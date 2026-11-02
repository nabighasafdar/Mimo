import {useCallback, useState} from 'react';
import {
  GoogleSignin,
  isErrorWithCode,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import {GOOGLE_WEB_CLIENT_ID} from './config';

export type GoogleAccount = {email: string; name: string; idToken: string};

let configured = false;

function configure() {
  if (!configured) {
    GoogleSignin.configure({webClientId: GOOGLE_WEB_CLIENT_ID});
    configured = true;
  }
}

/** Opens Google's account picker. Resolves `null` if the user closes it. */
export async function signInWithGoogle(): Promise<GoogleAccount | null> {
  if (!GOOGLE_WEB_CLIENT_ID) {
    throw new Error('Google sign-in isn’t set up yet. Add the web client ID in src/config.ts.');
  }
  configure();
  try {
    await GoogleSignin.hasPlayServices();
    const res = await GoogleSignin.signIn();
    if (res.type !== 'success') {
      return null;
    }
    const {email, name} = res.data.user;
    if (!res.data.idToken) {
      throw new Error('Google didn’t return a sign-in token. Check the web client ID.');
    }
    return {email, name: name ?? '', idToken: res.data.idToken};
  } catch (e) {
    if (isErrorWithCode(e) && e.code === statusCodes.SIGN_IN_CANCELLED) {
      return null;
    }
    if (isErrorWithCode(e) && e.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new Error('Google Play services are missing or out of date on this phone.');
    }
    throw new Error('Google sign-in failed. Check your connection and try again.');
  }
}

/** Forgets the Google account so the next sign-in shows the picker again. */
export async function signOutOfGoogle() {
  if (!GOOGLE_WEB_CLIENT_ID) {
    return;
  }
  try {
    configure();
    await GoogleSignin.signOut();
  } catch {
    // Nothing to do: the local data is cleared either way.
  }
}

/** Button handler + state for the "Continue with Google" buttons. */
export function useGoogleSignIn(onAccount: (account: GoogleAccount) => void) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(async () => {
    if (busy) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const account = await signInWithGoogle();
      if (account) {
        onAccount(account);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Google sign-in failed.');
    } finally {
      setBusy(false);
    }
  }, [busy, onAccount]);

  return {start, busy, error};
}
