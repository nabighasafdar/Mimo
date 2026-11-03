// Google Cloud Console → APIs & Services → Credentials → OAuth client ID of type "Web
// application". This is the *web* client's ID (ends in .apps.googleusercontent.com), even
// though the app is Android. Leave empty until it is created; Google sign-in then explains
// what is missing instead of failing.
export const GOOGLE_WEB_CLIENT_ID: string =
  '851907714306-lu19u76mcb67v0oe49trauqu0f7vin0a.apps.googleusercontent.com';

// The deployed landing page, no trailing slash (e.g. 'https://mimo-virid.vercel.app'). Password
// reset emails link to its /reset-password page and Me links to its /privacy page.
export const WEBSITE_URL: string = 'https://mimo-virid.vercel.app';

// Where Help & support sends people. Leave empty to hide the "Email us" button.
export const SUPPORT_EMAIL = '';

// Supabase → Project Settings → API. The publishable key is safe to ship in the app: row
// level security (supabase/schema.sql) limits every user to their own rows.
export const SUPABASE_URL = 'https://ybvuqihcidyhufrqicgb.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_f3AFQiH830CIkZ1iRhg04g_M690cOlU';
