import {supabase} from './supabase';
import {WEBSITE_URL} from './config';

export type AuthResult = {error: string | null; needsConfirm?: boolean};

// Supabase's messages are developer-facing; map the common ones to something friendly.
function friendly(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login')) {
    return 'That email and password don’t match. Try again.';
  }
  if (m.includes('already registered')) {
    return 'That email already has an account. Try logging in.';
  }
  if (m.includes('email not confirmed')) {
    return 'Confirm your email first, then log in. Check your inbox.';
  }
  if (m.includes('rate limit')) {
    return 'Too many tries. Wait a minute and try again.';
  }
  if (m.includes('network') || m.includes('fetch')) {
    return 'Can’t reach the server. Check your connection and try again.';
  }
  return message;
}

export async function signUpWithEmail(
  email: string,
  password: string,
  name: string,
): Promise<AuthResult> {
  const {data, error} = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {data: {full_name: name}},
  });
  if (error) {
    return {error: friendly(error.message)};
  }
  // With "Confirm email" on in Supabase there is no session until the link is tapped.
  return {error: null, needsConfirm: !data.session};
}

export async function logInWithEmail(email: string, password: string): Promise<AuthResult> {
  const {error} = await supabase.auth.signInWithPassword({email: email.trim(), password});
  return {error: error ? friendly(error.message) : null};
}

export async function logInWithGoogleToken(idToken: string): Promise<AuthResult> {
  const {error} = await supabase.auth.signInWithIdToken({provider: 'google', token: idToken});
  return {error: error ? friendly(error.message) : null};
}

export async function sendPasswordReset(email: string): Promise<AuthResult> {
  const {error} = await supabase.auth.resetPasswordForEmail(
    email.trim(),
    WEBSITE_URL ? {redirectTo: `${WEBSITE_URL}/reset-password`} : undefined,
  );
  return {error: error ? friendly(error.message) : null};
}
