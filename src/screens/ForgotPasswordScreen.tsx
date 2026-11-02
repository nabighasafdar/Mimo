import React, {useState} from 'react';
import {StatusBar, StyleSheet, Text, View} from 'react-native';
import Svg, {Path} from 'react-native-svg';
import AuthField from '../components/AuthField';
import AuthFooter from '../components/AuthFooter';
import {MailIcon} from '../components/AuthIcons';
import BackButton from '../components/BackButton';
import Blobs from '../components/Blobs';
import BunnySays from '../components/BunnySays';
import GlassCard from '../components/GlassCard';
import KeyboardScreen from '../components/KeyboardScreen';
import PrimaryButton from '../components/PrimaryButton';
import {sendPasswordReset} from '../auth';
import {colors, fonts, spacing} from '../theme';
import {isValidEmail} from '../validation';

type Props = {onBack?: () => void; onLogin?: () => void};

// Figma: R2 Forgot password. Sends a reset email through Supabase.
export default function ForgotPasswordScreen({onBack, onLogin}: Props) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    if (!isValidEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }
    setError(null);
    const res = await sendPasswordReset(email);
    if (res.error) {
      setError(res.error);
    } else {
      setSent(true);
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
            text={
              sent
                ? 'Done! Check your email for the reset link.'
                : 'No worries! Tell me your email and I’ll send you a reset link.'
            }
          />
          <Text style={styles.title}>Reset password</Text>
          <Text style={styles.help}>
            Use the email you signed up with. If you joined with Google, just go back and tap “Log
            in with Google”.
          </Text>

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
            {error && <Text style={styles.error}>{error}</Text>}
          </View>

          <PrimaryButton label={sent ? 'Send again' : 'Send reset link'} onPress={send} />

          {sent && (
            <GlassCard radius={16} contentStyle={styles.notice}>
              <View style={styles.tick}>
                <Svg width={12} height={12} viewBox="0 0 24 24">
                  <Path
                    d="M5 12.5l4.5 4.5L19 7.5"
                    stroke="#fff"
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </Svg>
              </View>
              <Text style={styles.noticeText}>
                Reset link sent. Check your inbox, then log in again.
              </Text>
            </GlassCard>
          )}
        </View>

        <AuthFooter prompt="Remembered it?" action="Back to log in" onPress={onLogin} />
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
  help: {
    color: colors.textMuted,
    fontFamily: fonts.semiBold,
    fontSize: 13,
    lineHeight: 20,
  },
  form: {gap: 12},
  error: {color: '#C0392B', fontFamily: fonts.semiBold, fontSize: 12.5},
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  tick: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#6F7A55',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noticeText: {
    flex: 1,
    color: '#3F4A2C',
    fontFamily: fonts.bold,
    fontSize: 12.5,
  },
});
