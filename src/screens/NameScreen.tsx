import React, {useState} from 'react';
import {StatusBar, StyleSheet, Text, TextInput, View} from 'react-native';
import Blobs from '../components/Blobs';
import Bunny from '../components/Bunny';
import GlassCard from '../components/GlassCard';
import OnboardingHeader from '../components/OnboardingHeader';
import KeyboardScreen from '../components/KeyboardScreen';
import PrimaryButton from '../components/PrimaryButton';
import TypingText from '../components/TypingText';
import {colors, fonts, spacing} from '../theme';

type Props = {initialName?: string; onBack?: () => void; onContinue?: (name: string) => void};

// Figma: 02 Name (node 2:127)
export default function NameScreen({initialName = '', onBack, onContinue}: Props) {
  const [name, setName] = useState(initialName);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <Blobs />
      <KeyboardScreen style={styles.content}>
        <OnboardingHeader step={1} onBack={onBack} />

        <View style={styles.question}>
          <View style={styles.bunnySays}>
            <Bunny />
            <GlassCard style={styles.bubble} contentStyle={styles.bubbleContent}>
              <TypingText
                text="Nice to meet you! What should I call you?"
                style={styles.bubbleText}
              />
            </GlassCard>
          </View>

          <Text style={styles.title}>Your name</Text>

          <View style={styles.field}>
            <Text style={styles.label}>First name</Text>
            <GlassCard contentStyle={styles.inputContent}>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Your first name"
                style={styles.input}
                placeholderTextColor={colors.textMuted}
                autoCapitalize="words"
              />
            </GlassCard>
          </View>
        </View>

        <PrimaryButton label="Continue" onPress={() => onContinue?.(name.trim())} />
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
    paddingTop: spacing.screenTop - 44,
    paddingBottom: spacing.screenBottom,
  },
  question: {gap: 28},
  bunnySays: {flexDirection: 'row', alignItems: 'center', gap: 10},
  bubble: {flex: 1},
  bubbleContent: {paddingHorizontal: 18, paddingVertical: 14},
  bubbleText: {
    color: colors.text,
    fontFamily: fonts.hand,
    fontSize: 20,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.serif,
    fontSize: 32,
  },
  field: {gap: 8},
  label: {
    color: colors.textMuted,
    fontFamily: fonts.extraBold,
    fontSize: 11, letterSpacing: 0.7, textTransform: 'uppercase',
  },
  inputContent: {height: 62, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20},
  input: {
    flex: 1,
    padding: 0,
    color: colors.text,
    fontFamily: fonts.bold,
    fontSize: 20,
  },
});
