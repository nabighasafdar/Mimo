// Reads a photo of a receipt or bill, or what the user said they spent ({text}), with Gemini
// and returns the items, each sorted into one of the app's budget categories. The app calls
// it through supabase.functions.invoke with the user's session; withSupabase({auth: 'user'})
// rejects anyone not signed in, so the publishable key shipped in the app is not enough to
// spend the Gemini key.
//
// Deploy:  supabase functions deploy read-receipt --no-verify-jwt   (auth is checked in code)
// Secret:  supabase secrets set GEMINI_API_KEY=AIza...   (aistudio.google.com/apikey)
import {withSupabase} from 'npm:@supabase/server@1.9.1';

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills'] as const;
const MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;
type MediaType = (typeof MEDIA_TYPES)[number];

// Tried in order: when the first is overloaded, slow or retired, the next one reads the receipt.
const MODELS = ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.8-flash'];
const geminiUrl = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
// Per attempt. Gemini sometimes holds a request for minutes when it is overloaded.
const TIMEOUT_MS = 25_000;
// AI reads (photos and spoken text together) one user can make per UTC day.
const DAILY_LIMIT = 30;

// Gemini's answer must match this shape (structured output), so the app can trust it.
const RECEIPT_SCHEMA = {
  type: 'OBJECT',
  properties: {
    is_receipt: {type: 'BOOLEAN'},
    merchant: {type: 'STRING'},
    date: {type: 'STRING'},
    currency: {type: 'STRING'},
    total: {type: 'NUMBER'},
    items: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          name: {type: 'STRING'},
          amount: {type: 'NUMBER'},
          category: {type: 'STRING', enum: [...CATEGORIES]},
        },
        required: ['name', 'amount', 'category'],
        propertyOrdering: ['name', 'amount', 'category'],
      },
    },
  },
  required: ['is_receipt', 'merchant', 'date', 'currency', 'total', 'items'],
  propertyOrdering: ['is_receipt', 'merchant', 'date', 'currency', 'total', 'items'],
};

// Spoken spending: only the items matter.
const SPOKEN_SCHEMA = {
  type: 'OBJECT',
  properties: {items: RECEIPT_SCHEMA.properties.items},
  required: ['items'],
};

const CATEGORY_GUIDE = `- Food: groceries, restaurants, cafes, snacks, drinks.
- Transport: fuel, ride-hailing, taxis, public transport, parking, car repairs.
- Shopping: clothes, personal care, household goods, electronics, gifts, everything else bought in a shop.
- Bills: electricity, gas, water, internet, phone, mobile load, rent, subscriptions, fees and taxes.`;

const SPOKEN_SYSTEM = `You turn what someone said they spent into expense items for a personal
budgeting app. The text comes from speech recognition, so expect misheard words, repeats and
numbers written as digits or words, in English, Urdu or Roman Urdu.

Return items: one per thing paid for. Give each a short, readable name in English title case
(e.g. "Burger", "Rickshaw to office", "Electricity bill") with no amounts or filler words in it,
and the amount as a plain number. If the same purchase is said twice, return it once. Leave out
anything with no amount.

Sort each item into exactly one budget category by what it is:
${CATEGORY_GUIDE}`;

const SYSTEM = `You read photos of shop receipts and bills for a personal budgeting app.

Return:
- is_receipt: false if the photo is not a receipt, invoice or bill (then leave the other fields empty).
- merchant: the shop or company name, as printed but in normal capitalisation.
- date: the purchase or bill date as YYYY-MM-DD, or "" if none is readable.
- currency: the ISO 4217 code printed or implied by the receipt, or "" if unclear.
- total: the final amount paid or due.
- items: what the money was spent on. Give each line item a short, readable name
  (expand cryptic abbreviations, e.g. "MLK 1L" -> "Milk 1L") and its final price after any
  item discount. Put tax, service charge or delivery fees in their own item. The item amounts
  must add up to the total. For a utility, phone, internet or rent bill, return a single item
  named for the bill (e.g. "Electricity bill") with the amount due.

Sort each item into exactly one budget category:
${CATEGORY_GUIDE}

Amounts are plain numbers with no currency symbols or thousands separators. If a value cannot
be read, make your best reading rather than leaving the item out.`;

const API_KEY = Deno.env.get('GEMINI_API_KEY');
const NOT_SET_UP = 'The receipt reader is not set up yet (GEMINI_API_KEY).';
const UNREADABLE = 'Mimo could not read this photo. Try another one.';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {status, headers: {'Content-Type': 'application/json'}});

Deno.serve(
  withSupabase({auth: 'user'}, async (req, ctx) => {
    if (req.method !== 'POST') {
      return json({error: 'Use POST.'}, 405);
    }
    if (!API_KEY) {
      return json({error: NOT_SET_UP}, 500);
    }

    let image: string;
    let mediaType: MediaType;
    let text: string;
    try {
      const body = await req.json();
      image = String(body.image ?? '');
      mediaType = MEDIA_TYPES.includes(body.mediaType) ? body.mediaType : 'image/jpeg';
      text = String(body.text ?? '').trim();
    } catch {
      return json({error: 'Send JSON: {image: <base64>, mediaType} or {text}.'}, 400);
    }
    // ~5 MB of image; the app resizes photos well below this.
    if (text ? text.length > 2000 : !image || image.length > 7_000_000) {
      const error = text ? 'That is too much to read at once.' : 'The photo is missing or too large.';
      return json({error}, 400);
    }

    // Counted before calling Gemini, so a loop of failing requests can't run up the bill.
    const {data: allowed, error: quotaError} = await ctx.supabase.rpc('consume_ai_quota', {
      daily_limit: DAILY_LIMIT,
    });
    if (quotaError) {
      console.error('read-receipt: quota check failed', quotaError);
      return json({error: 'Mimo is busy right now. Try again in a minute.'}, 503);
    }
    if (!allowed) {
      return json({error: `You've used all ${DAILY_LIMIT} of today's AI reads. Try again tomorrow.`}, 429);
    }

    const request = JSON.stringify({
      systemInstruction: {parts: [{text: text ? SPOKEN_SYSTEM : SYSTEM}]},
      contents: [
        {
          role: 'user',
          parts: text
            ? [{text}]
            : [{inlineData: {mimeType: mediaType, data: image}}, {text: 'Read this receipt.'}],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: text ? SPOKEN_SCHEMA : RECEIPT_SCHEMA,
        temperature: 0,
      },
    });

    try {
      let res: Response | null = null;
      for (const model of MODELS) {
        try {
          res = await fetch(geminiUrl(model), {
            method: 'POST',
            headers: {'Content-Type': 'application/json', 'x-goog-api-key': API_KEY},
            body: request,
            signal: AbortSignal.timeout(TIMEOUT_MS),
          });
        } catch (error) {
          console.error('read-receipt:', model, 'timed out or failed', error);
          res = null;
          continue;
        }
        // Retired, busy or down: try the next model. Anything else is the answer.
        if (![404, 429, 500, 503, 504].includes(res.status)) {
          break;
        }
        console.error('read-receipt:', model, res.status, await res.text());
      }

      if (!res) {
        return json({error: 'Mimo is busy right now. Try again in a minute.'}, 503);
      }
      if (!res.ok) {
        const detail = await res.text().catch(() => '');
        console.error('read-receipt: Gemini', res.status, detail);
        // An invalid, revoked or restricted key: 403, or 400 with API_KEY_INVALID.
        if (res.status === 403 || detail.includes('API_KEY')) {
          return json({error: NOT_SET_UP}, 500);
        }
        if (res.status === 400) {
          return json({error: UNREADABLE}, 422);
        }
        return json({error: 'Mimo is busy right now. Try again in a minute.'}, 503);
      }

      const data = await res.json();
      const candidate = data.candidates?.[0];
      const answer = candidate?.content?.parts
        ?.map((p: {text?: string}) => p.text ?? '')
        .join('');
      if (!answer || candidate.finishReason !== 'STOP') {
        console.error('read-receipt: no answer', candidate?.finishReason, data.promptFeedback);
        return json({error: UNREADABLE}, 422);
      }
      return json(JSON.parse(answer));
    } catch (error) {
      console.error('read-receipt failed', error);
      return json({error: 'Mimo could not read this photo. Try again.'}, 502);
    }
  }),
);
