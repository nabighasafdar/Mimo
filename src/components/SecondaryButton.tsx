import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {colors, fonts, radii, textColors} from '../theme';

type Props = {label: string; onPress?: () => void; icon?: React.ReactNode};

// Cream pill with a tan edge and stitched inner border, under PrimaryButton.
export default function SecondaryButton({label, onPress, icon}: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({pressed}) => [styles.ledge, pressed && styles.pressed]}>
      <View style={styles.button}>
        <View style={styles.stitch} pointerEvents="none" />
        {icon}
        <Text style={styles.label}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  ledge: {width: '100%', borderRadius: radii.pill, paddingBottom: 3, backgroundColor: colors.tan},
  button: {
    height: 56,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.tan,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  stitch: {
    position: 'absolute',
    left: 5,
    right: 5,
    top: 5,
    bottom: 5,
    borderRadius: radii.pill - 7,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#DCC6A2',
  },
  pressed: {opacity: 0.9, transform: [{translateY: 2}]},
  label: {color: textColors.secondaryButton, fontFamily: fonts.extraBold, fontSize: 15},
});
