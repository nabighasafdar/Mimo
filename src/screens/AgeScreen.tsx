import React, {useState} from 'react';
import {StatusBar, StyleSheet, Text, View} from 'react-native';
import Blobs from '../components/Blobs';
import Bunny from '../components/Bunny';
import CircleButton from '../components/CircleButton';
import GlassCard from '../components/GlassCard';
import KeyboardScreen from '../components/KeyboardScreen';
import OnboardingHeader from '../components/OnboardingHeader';
import PrimaryButton from '../components/PrimaryButton';
import TypingText from '../components/TypingText';
import {colors, fonts, spacing, textColors} from '../theme';

type Props = {
  name: string;
  initialAge?: number;
  onBack?: () => void;
  onContinue?: (age: number) => void;
};

const MIN_AGE = 5;
const MAX_AGE = 120;

// Figma: 03 Age
export default function AgeScreen({name, initialAge = 21, onBack, onContinue}: Props) {
  const [age, setAge] = useState(initialAge);
  const change = (d: number) => setAge(a => Math.min(MAX_AGE, Math.max(MIN_AGE, a + d)));

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <Blobs />
      <KeyboardScreen style={styles.content}>
        <OnboardingHeader step={2} onBack={onBack} />

        <View style={styles.body}>
          <View style={styles.bunnySays}>
            <Bunny width={62} height={132} />
            <GlassCard style={styles.bubble} contentStyle={styles.bubbleContent}>
              <TypingText
                text={`Hi ${name || 'there'}! How old are you? It helps me give tips that fit you.`}
                style={styles.bubbleText}
              />
            </GlassCard>
          </View>

          <Text style={styles.title}>Your age</Text>

          <View style={styles.stepper}>
            <CircleButton kind="minus" onPress={() => change(-1)} />
            <GlassCard radius={30} style={styles.ageCard} contentStyle={styles.ageContent}>
              <Text style={styles.age}>{age}</Text>
              <Text style={styles.years}>years old</Text>
            </GlassCard>
            <CircleButton kind="plus" onPress={() => change(1)} />
          </View>

          <Text style={styles.caption}>
            I only use this to personalise your tips. You can change it anytime.
          </Text>
        </View>

        <PrimaryButton label="Continue" onPress={() => onContinue?.(age)} />
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
  body: {marginTop: 64},
  bunnySays: {flexDirection: 'row', alignItems: 'center', gap: 10},
  bubble: {flex: 1},
  bubbleContent: {paddingHorizontal: 18, paddingVertical: 14},
  bubbleText: {color: colors.text, fontFamily: fonts.hand, fontSize: 20, lineHeight: 24},
  title: {
    marginTop: 20,
    color: colors.text,
    fontFamily: fonts.serif,
    fontSize: 32,
  },
  stepper: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ageCard: {width: 190, height: 150},
  ageContent: {
    width: 187,
    height: 147,
    alignItems: 'center',
    justifyContent: 'center',
  },
  age: {color: colors.accentText, fontFamily: fonts.serifBold, fontSize: 66},
  years: {color: colors.textSoft, fontFamily: fonts.hand, fontSize: 22},
  caption: {
    marginTop: 28,
    color: textColors.subtitle,
    fontFamily: fonts.semiBold,
    fontSize: 13,
    lineHeight: 20,
  },
});
