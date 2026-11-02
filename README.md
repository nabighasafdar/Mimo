# Mimo

A voice-first budgeting app for Android. Say what you spent, scan a receipt or type it, and Mimo sorts it into your budget, tracks your savings goal and warns you before you overspend.

## Features

- **Add spending** by voice, receipt photo or typing. Voice and receipts are read by AI, and you confirm before anything is saved.
- **Budget:** monthly income minus your savings goal, with alerts at 80% and when you overspend.
- **Stats** by week, month and year, with every item listed so it can be edited or deleted.
- **Savings goals** in a bucket list.
- **Offline:** every change is saved on the phone first and sent when there is internet. Reading receipts and speech still need a connection.
- **Accounts:** email and password or Google sign-in, with full account deletion in the app.

## Tech stack

| Part | Tool |
|---|---|
| App | React Native 0.87 with TypeScript |
| Navigation | React Navigation native stack |
| Backend | Supabase: Postgres, Auth, Edge Functions |
| AI | Google Gemini, called from the `read-receipt` Edge Function |
| Speech | Android `SpeechRecognizer`, wrapped in `SpeechModule.kt` |
| Website | Static pages in `docs/`, served by GitHub Pages |

Android comes first. iOS is not set up: CocoaPods aren't installed and voice input is Android-only.

## Project layout

```text
src/store.tsx      App state, loading, offline copy
src/outbox.ts      Queue that sends changes to the database
src/db.ts          Reads from Supabase
src/budget.ts      Budget and date calculations
src/voiceParse.ts  On-device parser, used when the AI is unavailable
src/config.ts      Public settings
src/screens/       One file per screen
supabase/          Database schema and Edge Function
docs/              Website: privacy policy, password reset, account deletion
__tests__/         Jest tests
```

## Run it

You need Node 22.11 or newer, Android Studio and a connected Android phone with USB debugging on.

```bash
npm install
npm start          # keep this running
npm run android    # in a second terminal
npm test           # run before each release
```

## Backend setup

1. Run `supabase/schema.sql` in the Supabase SQL Editor. It is safe to re-run.
2. Put your Gemini key in `supabase/functions/.env` as `GEMINI_API_KEY=...`. This file is git-ignored.
3. Set the secret and deploy the function:

```bash
npx supabase secrets set --env-file supabase/functions/.env --project-ref ybvuqihcidyhufrqicgb
npx supabase functions deploy read-receipt --no-verify-jwt --project-ref ybvuqihcidyhufrqicgb
```

4. In Supabase, go to Authentication → URL Configuration and add `https://nabighasafdar.github.io/Mimo/reset-password` to the redirect URLs.

## Release build

Signing needs `android/keystore.properties` and `android/app/mimo-release.keystore`. Both are git-ignored, so back them up somewhere safe: an app can't be updated on Google Play without its signing key.

```bash
cd android && ./gradlew assembleRelease
adb install -r app/build/outputs/apk/release/app-release.apk
```
