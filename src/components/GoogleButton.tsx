import React from 'react';
import {Pressable, StyleSheet, Text} from 'react-native';
import {GoogleIcon} from './AuthIcons';
import GlassCard from './GlassCard';
import {colors, fonts, radii} from '../theme';

type Props = {label: string; onPress?: () => void};

export default function GoogleButton({label, onPress}: Props) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      <GlassCard radius={radii.pill} contentStyle={styles.content}>
        <GoogleIcon />
        <Text style={styles.label}>{label}</Text>
      </GlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  label: {color: colors.text, fontFamily: fonts.bold, fontSize: 15},
});
