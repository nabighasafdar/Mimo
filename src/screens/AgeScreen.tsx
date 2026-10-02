import React, {useState} from 'react';
import {StatusBar, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Blobs from '../components/Blobs';
import Bunny from '../components/Bunny';
import CircleButton from '../components/CircleButton';
import GlassCard from '../components/GlassCard';
import OnboardingHeader from '../components/OnboardingHeader';
import PrimaryButton from '../components/PrimaryButton';
import {colors, fonts, spacing, textColors} from '../theme';

type Props = {
  name: string;
  onBack?: () => void;
  onContinue?: (age: number) => void;
};

const MIN_AGE = 5;
const MAX_AGE = 120;

// Figma: 03 Age (built from a reference image, not the Figma API).
export default function AgeScreen({name, onBack, onContinue}: Props) {
  const [age, setAge] = useState(21);
  const change = (d: number) => setAge(a => Math.min(MAX_AGE, Math.max(MIN_AGE, a + d)));

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <Blobs />
      <SafeAreaView style={styles.content}>
        <OnboardingHeader step={2} onBack={onBack} />

        <View style={styles.body}>
          <View style={styles.bunnySays}>
            <Bunny width={62} height={132} />
            <GlassCard style={styles.bubble} contentStyle={styles.bubbleContent}>
              <Text style={styles.bubbleText}>
                Hi {name || 'there'}! How old are you? It helps me give tips that fit you.
              </Text>
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
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: colors.background},
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenX,
    paddingTop: 12,
    paddingBottom: spacing.screenBottom,
  },
  body: {marginTop: 64},
  bunnySays: {flexDirection: 'row', alignItems: 'center', gap: 10},
  bubble: {flex: 1},
  bubbleContent: {paddingHorizontal: 18, paddingVertical: 14},
  bubbleText: {color: colors.text, fontFamily: fonts.semiBold, fontSize: 16, lineHeight: 22},
  title: {
    marginTop: 20,
    color: colors.text,
    fontFamily: fonts.extraBold,
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
  age: {color: colors.orange, fontFamily: fonts.extraBold, fontSize: 60},
  years: {color: textColors.subtitle, fontFamily: fonts.semiBold, fontSize: 15},
  caption: {
    marginTop: 28,
    color: textColors.subtitle,
    fontFamily: fonts.semiBold,
    fontSize: 13,
    lineHeight: 20,
  },
});
