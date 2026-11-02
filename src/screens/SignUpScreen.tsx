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
import {logInWithGoogleToken, signUpWithEmail} from '../auth';
import {useGoogleSignIn} from '../googleAuth';
import {colors, fonts, spacing} from '../theme';
import {isValidEmail, MIN_PASSWORD} from '../validation';

type Props = {
  name: string;
  onBack?: () => void;
  onDone?: () => void;
  onLogin?: () => void;
};

// Figma: 06 Save your budget (sign up). Creates the account in Supabase.
export default function SignUpScreen({name, onBack, onDone, onLogin}: Props) {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
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
    } else if (pw.length < MIN_PASSWORD) {
      setError(`Use at least ${MIN_PASSWORD} characters for your password.`);
    } else {
      setError(null);
      setBusy(true);
      const res = await signUpWithEmail(email, pw, name);
      setBusy(false);
      if (res.error) {
        setError(res.error);
      } else if (res.needsConfirm) {
        setNotice('Almost there! Tap the link we emailed you, then log in.');
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
          <BunnySays
            text={`Your budget is ready${
              name ? `, ${name}` : ''
            }! Save it so it stays safe on any phone.`}
          />
          <Text style={styles.title}>Save your budget</Text>

          {GOOGLE_WEB_CLIENT_ID !== '' && (
            <>
              <GoogleButton
                label={google.busy ? 'Opening Google…' : 'Sign up with Google'}
                onPress={google.start}
              />
              {google.error && <Text style={styles.error}>{google.error}</Text>}
              <Divider label="or sign up with email" />
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
              placeholder="Create a password"
              value={pw}
              onChangeText={setPw}
              secureTextEntry={!show}
              autoComplete="new-password"
              textContentType="newPassword"
              right={
                <Pressable
                  onPress={() => setShow(s => !s)}
                  hitSlop={8}
                  accessibilityLabel={show ? 'Hide password' : 'Show password'}>
                  <EyeIcon off={show} />
                </Pressable>
              }
            />
            {error && <Text style={styles.error}>{error}</Text>}
            {notice && <Text style={styles.notice}>{notice}</Text>}
          </View>

          <PrimaryButton label={busy ? 'Creating…' : 'Create account & save'} onPress={submit} />
          <Text style={styles.legal}>
            By continuing you agree to Mimo's Terms and Privacy Policy.
          </Text>
        </View>

        <AuthFooter prompt="Already have an account?" action="Log in" onPress={onLogin} />
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
  error: {color: '#C0392B', fontFamily: fonts.semiBold, fontSize: 12.5},
  notice: {color: '#3F4A2C', fontFamily: fonts.bold, fontSize: 12.5},
  legal: {
    textAlign: 'center',
    color: colors.textMuted,
    fontFamily: fonts.semiBold,
    fontSize: 11.5,
    lineHeight: 17,
    paddingHorizontal: 16,
  },
});
