# Voice Expense Tracker

A simple, voice-first expense tracker that lets users log spending naturally without typing. The app converts spoken expense details into structured transactions, then confirms them before saving.

## Problem

Manual expense tracking fails because typing every transaction is too much friction. People will start strong, then stop logging expenses when the process feels slow or annoying.

## Solution

Let users speak their expense in natural language and turn that speech into a structured transaction automatically:

- amount
- category
- merchant/item note
- date

Then show a confirmation screen so users can verify and edit the parsed result before saving.

## Core User Flow

1. User taps a mic button (or long-presses a floating action button).
2. User speaks the expense naturally.
3. Speech-to-text converts audio into raw text.
4. An LLM extracts structured fields from the transcript.
5. The app shows a confirmation card with editable fields.
6. The transaction saves locally when the user confirms.
7. Budget totals update instantly.

## MVP Feature Set

- Voice input → transaction: press a mic button, say something like “I bought ice cream for 500,” and AI extracts amount/category/note
- Manual entry as a fallback/edit path
- Currency selection: choose a base currency (e.g. PKR, USD)
- Monthly budget: set a total and view spent vs remaining
- Yearly budget: aggregated annual view
- Category breakdown (food, transport, bills, etc.)
- Transaction history list with edit/delete
- Simple local persistence for offline use

## Post-MVP Features

- Yearly/monthly trend charts
- Recurring expenses auto-logged
- Budget alerts (e.g. “You’ve used 80% of your food budget”)
- Live currency conversion for different spoken currencies
- Export to CSV/PDF
- Cloud sync + multi-device support
- Bank SMS/notification parsing as another auto-entry source
- Voice queries such as “How much did I spend on food this month?”

## Recommended Tech Stack

- App framework: Flutter
- State management: Riverpod or Bloc
- Local database: Drift (SQLite) or Isar
- Speech-to-text: `speech_to_text` package or cloud STT API
- AI extraction: LLM API call with strict JSON-only prompt
- Backend (optional later): Firebase or a lightweight Node/Express + Postgres API
- Charts: `fl_chart`

## Data Model

```text
Transaction
- id
- amount
- currency
- category
- note (raw or cleaned)
- rawTranscript
- date
- createdAt

Category
- id
- name
- icon
- monthlyLimit (optional)

Budget
- id
- period (month/year)
- periodValue (e.g. "2026-08" or "2026")
- totalLimit
- currency

UserSettings
- baseCurrency (e.g. PKR, USD)
```

## AI Extraction Design

This is the riskiest technical step, so keep it simple and reliable:

- Use a single small LLM call with a system prompt that returns only JSON.
- Validate against a fixed category list so the model cannot invent categories.
- Include the user’s selected currency so bare numbers are interpreted correctly.
- Always show a confirmation/edit screen instead of auto-saving.
- Store the raw transcript for debugging and future prompt tuning.
- If extraction is not confident, fall back to a manual form pre-filled with what was understood.

### Example JSON output

```json
{
  "amount": 500,
  "currency": "PKR",
  "category": "Food",
  "note": "ice cream",
  "confidence": 0.84
}
```

## Suggested Build Order

1. Phase 1 — Skeleton: Flutter project, local DB schema, manual transaction entry, category list, monthly budget screen.
2. Phase 2 — Voice input: integrate STT, wire mic button, show raw transcript.
3. Phase 3 — AI extraction: send transcript to LLM, parse JSON, show confirmation card, save on confirm.
4. Phase 4 — Budgets & insights: monthly/yearly totals, remaining budget, category breakdown, basic charts.
5. Phase 5 — Polish: edit/delete flows, empty states, error handling, offline resilience.
6. Phase 6 — Optional backend: add sync/auth once the local version works end-to-end.

## Key Risks

- STT accuracy for accented or noisy speech — test early with real voice samples.
- Currency/number parsing for values such as “500,” “five hundred,” or “5k.”
- Cost growth from AI calls if usage scales — keep extraction calls minimal and cheap.
- User trust — never auto-save parsed entries without confirmation.

## Notes

- Start with local-only support and keep the backend optional until the core voice entry flow is stable.
- The confirmation step is critical for trust and error recovery.
- Logging transcripts and parsed results will make prompt iteration much easier.
