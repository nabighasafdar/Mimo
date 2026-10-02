import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import Svg, {Path} from 'react-native-svg';
import GlassCard from './GlassCard';
import {colors, radii} from '../theme';

type Props = {step: number; total?: number; onBack?: () => void};

// Back button plus segmented progress bar shown on the onboarding screens.
export default function OnboardingHeader({step, total = 4, onBack}: Props) {
  return (
    <View style={styles.row}>
      <Pressable onPress={onBack} hitSlop={8}>
        <GlassCard radius={radii.back} style={styles.back} contentStyle={styles.backContent}>
          <Svg width={20} height={20} viewBox="0 0 24 24">
            <Path
              d="M15 18l-6-6 6-6"
              stroke={colors.text}
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </Svg>
        </GlassCard>
      </Pressable>
      <View style={styles.progress}>
        {Array.from({length: total}, (_, i) => (
          <View
            key={i}
            style={[
              styles.step,
              {backgroundColor: i < step ? colors.orange : colors.progressTrack},
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {flexDirection: 'row', alignItems: 'center', gap: 14},
  back: {width: 40, height: 40},
  backContent: {width: 37, height: 37, alignItems: 'center', justifyContent: 'center'},
  progress: {flex: 1, flexDirection: 'row', gap: 6},
  step: {flex: 1, height: 6, borderRadius: radii.progress},
});
