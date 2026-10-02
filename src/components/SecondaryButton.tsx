import React from 'react';
import {Pressable, StyleSheet, Text} from 'react-native';
import GlassCard from './GlassCard';
import {fonts, radii, textColors} from '../theme';

type Props = {label: string; onPress?: () => void};

// Glass pill used for the secondary action under PrimaryButton.
export default function SecondaryButton({label, onPress}: Props) {
  return (
    <Pressable onPress={onPress} style={styles.pressable}>
      <GlassCard radius={radii.pill} contentStyle={styles.content}>
        <Text style={styles.label}>{label}</Text>
      </GlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {width: '100%'},
  content: {paddingVertical: 18, paddingHorizontal: 24, alignItems: 'center'},
  label: {color: textColors.secondaryButton, fontFamily: fonts.bold, fontSize: 16},
});
