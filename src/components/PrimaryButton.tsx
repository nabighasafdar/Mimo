import React from 'react';
import {Pressable, StyleSheet, Text} from 'react-native';
import Gradient from './Gradient';
import {colors, fonts, radii} from '../theme';

type Props = {label: string; onPress?: () => void};

// Orange gradient pill with a bevel approximated by top/bottom gradient stops.
export default function PrimaryButton({label, onPress}: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({pressed}) => [styles.button, pressed && styles.pressed]}>
      <Gradient
        id="btnFill"
        stops={[
          {offset: 0, color: '#F7AE6E'},
          {offset: 1, color: '#DD6E2B'},
        ]}
      />
      <Gradient
        id="btnBevel"
        stops={[
          {offset: 0, color: '#FFFFFF', opacity: 0.4},
          {offset: 0.1, color: '#FFFFFF', opacity: 0},
          {offset: 0.85, color: '#8C380A', opacity: 0},
          {offset: 1, color: '#8C380A', opacity: 0.35},
        ]}
      />
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: radii.pill,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.buttonBottom,
  },
  pressed: {opacity: 0.9, transform: [{scale: 0.98}]},
  label: {
    color: colors.white,
    fontFamily: fonts.bold,
    fontSize: 17,
  },
});
