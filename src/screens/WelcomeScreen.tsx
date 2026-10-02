import React from 'react';
import {StatusBar, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Blobs from '../components/Blobs';
import Bunny from '../components/Bunny';
import GlassCard from '../components/GlassCard';
import PrimaryButton from '../components/PrimaryButton';
import SecondaryButton from '../components/SecondaryButton';
import {colors, fonts, spacing, textColors} from '../theme';

type Props = {onStart?: () => void; onHaveAccount?: () => void};

// Figma: 01 Welcome (built from a reference image, not the Figma API).
export default function WelcomeScreen({onStart, onHaveAccount}: Props) {
  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <Blobs />
      <SafeAreaView style={styles.content}>
        <View>
          <Text style={styles.brand}>Bonnie</Text>

          <View style={styles.hero}>
            <GlassCard radius={134} style={styles.circle} contentStyle={styles.circleFill} />
            <Bunny width={140} height={292} style={styles.bunny} />
          </View>

          <Text style={styles.title}>Hi, I'm Bonnie!</Text>
          <Text style={styles.subtitle}>
            I'll help you keep track of your money, one tiny carrot at a time.
          </Text>
        </View>

        <View style={styles.actions}>
          <PrimaryButton label="Let's get started" onPress={onStart} />
          <SecondaryButton label="I already have an account" onPress={onHaveAccount} />
        </View>
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
    paddingBottom: spacing.screenBottom,
  },
  brand: {
    marginTop: 12,
    color: colors.orange,
    fontFamily: fonts.extraBold,
    fontSize: 22,
  },
  hero: {alignItems: 'center', marginTop: 52, height: 292},
  circle: {position: 'absolute', top: 15, width: 268, height: 268},
  circleFill: {width: 265, height: 265},
  bunny: {position: 'absolute', top: 0},
  title: {
    marginTop: 28,
    textAlign: 'center',
    color: colors.text,
    fontFamily: fonts.extraBold,
    fontSize: 32,
  },
  subtitle: {
    marginTop: 14,
    paddingHorizontal: 8,
    textAlign: 'center',
    color: textColors.subtitle,
    fontFamily: fonts.semiBold,
    fontSize: 16,
    lineHeight: 24,
  },
  actions: {gap: 12},
});
