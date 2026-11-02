import React from 'react';
import {StyleSheet, View} from 'react-native';
import BackButton from './BackButton';
import {colors, radii} from '../theme';

type Props = {step: number; total?: number; onBack?: () => void};

// Back button plus the onboarding progress: filled steps in terracotta, the rest as
// stitched (dashed) thread.
export default function OnboardingHeader({step, total = 4, onBack}: Props) {
  return (
    <View style={styles.row}>
      <BackButton onPress={onBack} />
      <View style={styles.progress}>
        {Array.from({length: total}, (_, i) =>
          i < step ? (
            <View key={i} style={[styles.step, styles.done]} />
          ) : (
            <View key={i} style={[styles.step, styles.todo]}>
              {Array.from({length: 12}, (__, j) => (
                <View key={j} style={styles.dash} />
              ))}
            </View>
          ),
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {flexDirection: 'row', alignItems: 'center', gap: 16},
  progress: {flex: 1, flexDirection: 'row', gap: 8},
  step: {flex: 1, height: 5, borderRadius: radii.progress, overflow: 'hidden'},
  done: {backgroundColor: colors.orange},
  todo: {flexDirection: 'row', gap: 4},
  dash: {width: 6, height: 5, borderRadius: 3, backgroundColor: '#D3BE9B'},
});
