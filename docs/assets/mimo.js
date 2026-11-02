// The publishable key is safe in a public page: row level security limits each user to their
// own rows. supabase.js is a copy of @supabase/supabase-js so these pages load no third-party code.
window.mimo = window.supabase.createClient(
  'https://ybvuqihcidyhufrqicgb.supabase.co',
  'sb_publishable_f3AFQiH830CIkZ1iRhg04g_M690cOlU',
);

window.show = (id, text) => {
  const el = document.getElementById(id);
  el.hidden = !text;
  el.textContent = text ?? '';
};
