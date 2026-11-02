import type {CategoryKey} from './categories';

// ---- numbers ---------------------------------------------------------------

const UNITS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19,
};
const TENS: Record<string, number> = {
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};
const SCALES: Record<string, number> = {
  thousand: 1000, grand: 1000, lakh: 100000, lac: 100000, million: 1000000,
};

type Kind = 'digit' | 'unit' | 'tens' | 'hundred' | 'scale' | null;
type NumberRun = {value: number; start: number; end: number}; // token range [start, end)

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/(\d),(?=\d)/g, '$1')
    .replace(/-/g, ' ')
    .replace(/,/g, ' , ')
    .replace(/[^a-z0-9.,\s\u00c0-\u024f]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

const isNumberWord = (t?: string) =>
  !!t && (t in UNITS || t in TENS || t === 'hundred' || t in SCALES);

function readNumber(tokens: string[], from: number): NumberRun | null {
  let total = 0;
  let current = 0;
  let got = false;
  let prev: Kind = null;
  let j = from;

  for (; j < tokens.length; j++) {
    const t = tokens[j];
    const startsFresh = prev === null || prev === 'hundred' || prev === 'scale';

    if (/^\d+(\.\d+)?$/.test(t)) {
      if (!startsFresh) {
        break;
      }
      current += parseFloat(t);
      got = true;
      prev = 'digit';
    } else if (/^\d+(\.\d+)?k$/.test(t)) {
      if (!startsFresh) {
        break;
      }
      total += parseFloat(t) * 1000;
      got = true;
      prev = 'scale';
    } else if (t in TENS || (t in UNITS && UNITS[t] >= 10)) {
      if (!startsFresh) {
        break;
      }
      current += TENS[t] ?? UNITS[t];
      got = true;
      prev = 'tens';
    } else if (t in UNITS) {
      if (!(startsFresh || (prev === 'tens' && current % 10 === 0))) {
        break;
      }
      current += UNITS[t];
      got = true;
      prev = 'unit';
    } else if (t === 'hundred') {
      current = (current || 1) * 100;
      got = true;
      prev = 'hundred';
    } else if (t in SCALES) {
      total += (current || 1) * SCALES[t];
      current = 0;
      got = true;
      prev = 'scale';
    } else if (t === 'and' && prev === 'hundred' && isNumberWord(tokens[j + 1])) {
      continue; // "one hundred and fifty"
    } else {
      break;
    }
  }
  return got ? {value: total + current, start: from, end: j} : null;
}

function findNumbers(tokens: string[]): NumberRun[] {
  const runs: NumberRun[] = [];
  for (let i = 0; i < tokens.length; ) {
    const run = readNumber(tokens, i);
    if (run) {
      runs.push(run);
      i = run.end;
    } else {
      i++;
    }
  }
  return runs;
}

/** First number in the sentence: "fifty thousand", "50,000", "5k", "twenty one". */
export function parseNumber(text: string): number | null {
  const run = findNumbers(tokenize(text))[0];
  return run ? run.value : null;
}

export function parseAge(text: string): number | null {
  const n = parseNumber(text);
  return n !== null && n >= 5 && n <= 120 ? Math.round(n) : null;
}

export function parseAmount(text: string): number | null {
  const n = parseNumber(text);
  return n !== null && n > 0 ? Math.round(n) : null;
}

export const formatAmount = (n: number) =>
  String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

// ---- name ------------------------------------------------------------------

export function parseName(text: string): string | null {
  const cleaned = text
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[^a-z\u00c0-\u024f\s'-]/g, ' ')
    .replace(/^\s*(hi|hello|hey|salam)\b[\s,]*/, '')
    .replace(/^\s*(my name is|my name's|i am|i'm|im|call me|it's|its|this is|they call me)\s+/, '')
    .trim();
  const words = cleaned.split(/\s+/).filter(Boolean).slice(0, 3);
  if (!words.length) {
    return null;
  }
  return words.map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
}

// ---- currency --------------------------------------------------------------

const CURRENCY_WORDS: [string, RegExp][] = [
  ['PKR', /\b(pkr|pakistan\w*|rupees?|rs)\b/],
  ['USD', /\b(usd|dollars?|bucks?|american)\b/],
  ['EUR', /\b(eur|euros?)\b/],
  ['GBP', /\b(gbp|pounds?|sterling|british)\b/],
  ['AED', /\b(aed|dirhams?|uae|emirates|dubai)\b/],
];

export function parseCurrency(text: string): string | null {
  const t = text.toLowerCase();
  return CURRENCY_WORDS.find(([, re]) => re.test(t))?.[0] ?? null;
}

// ---- expenses --------------------------------------------------------------

const CATEGORY_WORDS: Record<CategoryKey, string[]> = {
  Food: [
    'lunch', 'dinner', 'breakfast', 'food', 'coffee', 'tea', 'chai', 'cafe', 'café', 'restaurant',
    'pizza', 'burger', 'snack', 'snacks', 'groceries', 'grocery', 'biryani', 'juice', 'meal',
    'milk', 'bread', 'eat', 'drink', 'drinks', 'ice', 'icecream',
  ],
  Transport: [
    'rickshaw', 'uber', 'careem', 'taxi', 'cab', 'bus', 'fuel', 'petrol', 'diesel', 'metro',
    'train', 'ride', 'fare', 'parking', 'bike', 'transport', 'indrive',
  ],
  Bills: [
    'bill', 'bills', 'electricity', 'gas', 'internet', 'wifi', 'rent', 'water', 'phone',
    'recharge', 'load', 'subscription',
  ],
  Shopping: [
    'shopping', 'shirt', 'shoes', 'clothes', 'dress', 'bag', 'mall', 'gift', 'watch', 'shampoo',
  ],
};

const FILLER = new Set([
  'i', 'spent', 'spend', 'spending', 'paid', 'pay', 'bought', 'buy', 'purchased', 'of', 'worth', 'got', 'on', 'for', 'at', 'rs', 'rupees', 'rupee', 'pkr', 'usd',
  'dollars', 'dollar', 'euro', 'euros', 'pounds', 'pound', 'dirhams', 'dirham', 'just', 'about',
  'around', 'like', 'a', 'an', 'the', 'my', 'some',
]);

export type ParsedExpense = {amount: number; category: CategoryKey; note: string};

function categoryOf(words: string[]): CategoryKey {
  for (const [key, list] of Object.entries(CATEGORY_WORDS)) {
    if (words.some(w => list.includes(w))) {
      return key as CategoryKey;
    }
  }
  return 'Shopping';
}

const SEPARATORS = new Set([',', 'then', 'also', 'plus']);

/** "450 on lunch and 200 on a rickshaw" -> two expenses. Segments without a number are dropped. */
export function parseExpenses(text: string): ParsedExpense[] {
  const tokens = tokenize(text);
  const runs = findNumbers(tokens);
  const insideRun = (i: number) => runs.some(r => i >= r.start && i < r.end);

  const segments: string[][] = [[]];
  tokens.forEach((t, i) => {
    const boundary = !insideRun(i) && (SEPARATORS.has(t) || t === 'and');
    if (boundary) {
      segments.push([]);
    } else {
      segments[segments.length - 1].push(`${i}:${t}`);
    }
  });

  const out: ParsedExpense[] = [];
  for (const seg of segments) {
    const items = seg.map(s => {
      const [idx, ...rest] = s.split(':');
      return {i: Number(idx), t: rest.join(':')};
    });
    const run = runs.find(r => items.some(it => it.i >= r.start && it.i < r.end));
    if (!run || run.value <= 0) {
      continue;
    }
    const words = items.filter(it => it.i < run.start || it.i >= run.end).map(it => it.t);
    while (words.length && FILLER.has(words[0])) {
      words.shift();
    }
    const note = words.join(' ');
    out.push({
      amount: Math.round(run.value),
      category: categoryOf(words),
      note: note ? note[0].toUpperCase() + note.slice(1) : 'Expense',
    });
  }
  return out;
}
