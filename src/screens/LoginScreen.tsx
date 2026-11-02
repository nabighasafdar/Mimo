import React, {useState} from 'react';
import {Pressable, StatusBar, StyleSheet, Text, View} from 'react-native';
import AuthField from '../components/AuthField';
import AuthFooter from '../components/AuthFooter';
import {EyeIcon, LockIcon, MailIcon} from '../components/AuthIcons';
import BackButton from '../components/BackButton';
import Blobs from '../components/Blobs';
import BunnySays from '../components/BunnySays';
import Divider from '../components/Divider';
import GoogleButton from '../components/GoogleButton';
import {GOOGLE_WEB_CLIENT_ID} from '../config';
import KeyboardScreen from '../components/KeyboardScreen';
import PrimaryButton from '../components/PrimaryButton';
import {logInWithEmail, logInWithGoogleToken} from '../auth';
import {useGoogleSignIn} from '../googleAuth';
import {colors, fonts, spacing} from '../theme';
import {isValidEmail} from '../validation';

type Props = {
  onBack?: () => void;
  onDone?: () => void;
  onForgot?: () => void;
  onSignUp?: () => void;
};

// Figma: R1 Log in (returning user). Checks the account with Supabase.
export default function LoginScreen({onBack, onDone, onForgot, onSignUp}: Props) {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const google = useGoogleSignIn(async account => {
    const res = await logInWithGoogleToken(account.idToken);
    if (res.error) {
      setError(res.error);
    } else {
      onDone?.();
    }
  });

  const submit = async () => {
    if (busy) {
      return;
    }
    if (!isValidEmail(email)) {
      setError('Enter a valid email address.');
    } else if (!pw) {
      setError('Enter your password.');
    } else {
      setError(null);
      setBusy(true);
      const res = await logInWithEmail(email, pw);
      setBusy(false);
      if (res.error) {
        setError(res.error);
      } else {
        onDone?.();
      }
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <Blobs />
      <KeyboardScreen style={styles.content}>
        <View style={styles.top}>
          <View style={styles.back}>
            <BackButton onPress={onBack} />
          </View>
          <BunnySays text="Welcome back! Log in to see your budget." />
          <Text style={styles.title}>Log in</Text>

          {GOOGLE_WEB_CLIENT_ID !== '' && (
            <>
              <GoogleButton
                label={google.busy ? 'Opening Google…' : 'Log in with Google'}
                onPress={google.start}
              />
              {google.error && <Text style={styles.error}>{google.error}</Text>}
              <Divider label="or log in with email" />
            </>
          )}

          <View style={styles.form}>
            <AuthField
              icon={<MailIcon />}
              placeholder="Email address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
            />
            <AuthField
              icon={<LockIcon />}
              placeholder="Password"
              value={pw}
              onChangeText={setPw}
              secureTextEntry={!show}
              autoComplete="current-password"
              textContentType="password"
              right={
                <Pressable
                  onPress={() => setShow(s => !s)}
                  hitSlop={8}
                  accessibilityLabel={show ? 'Hide password' : 'Show password'}>
                  <EyeIcon off={show} />
                </Pressable>
              }
            />
            <Pressable onPress={onForgot} hitSlop={8} style={styles.forgot}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </Pressable>
            {error && <Text style={styles.error}>{error}</Text>}
          </View>

          <PrimaryButton label={busy ? 'Logging in…' : 'Log in'} onPress={submit} />
        </View>

        <AuthFooter prompt="New here?" action="Create an account" onPress={onSignUp} />
      </KeyboardScreen>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: colors.background},
  content: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenX,
    paddingTop: 12,
    paddingBottom: spacing.screenBottom,
  },
  top: {gap: 20},
  back: {alignSelf: 'flex-start'},
  title: {color: colors.text, fontFamily: fonts.serif, fontSize: 30},
  form: {gap: 12},
  forgot: {alignSelf: 'flex-end'},
  forgotText: {color: '#8F4A30', fontFamily: fonts.extraBold, fontSize: 12.5},
  error: {color: '#C0392B', fontFamily: fonts.semiBold, fontSize: 12.5},
});
