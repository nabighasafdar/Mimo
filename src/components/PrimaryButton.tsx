import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {colors, fonts, radii} from '../theme';

type Props = {label: string; onPress?: () => void; icon?: React.ReactNode; disabled?: boolean};

// Terracotta pill with a darker ledge underneath and a stitched (dashed) inner edge.
export default function PrimaryButton({label, onPress, icon, disabled}: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{disabled}}
      style={({pressed}) => [styles.ledge, (pressed || disabled) && styles.pressed]}>
      <View style={styles.button}>
        <View style={styles.stitch} pointerEvents="none" />
        {icon}
        <Text style={styles.label}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  ledge: {
    width: '100%',
    borderRadius: radii.pill,
    paddingBottom: 4,
    backgroundColor: colors.accentShadow,
    shadowColor: colors.accentShadow,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 10},
    elevation: 6,
  },
  button: {
    height: 56,
    borderRadius: radii.pill,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.orange,
  },
  stitch: {
    position: 'absolute',
    left: 6,
    right: 6,
    top: 6,
    bottom: 6,
    borderRadius: radii.pill - 6,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,236,214,0.6)',
  },
  pressed: {opacity: 0.88, transform: [{translateY: 2}]},
  label: {color: colors.onAccent, fontFamily: fonts.extraBold, fontSize: 15, letterSpacing: 0.2},
});
