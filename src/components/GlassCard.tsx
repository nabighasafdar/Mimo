import React from 'react';
import {StyleProp, StyleSheet, View, ViewStyle} from 'react-native';
import {colors, radii} from '../theme';

type Props = {
  children?: React.ReactNode;
  radius?: number;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
};

// Cream index card with a tan edge and a 2px "stacked paper" ledge underneath.
// (Still named GlassCard: every screen uses it for its panels.)
export default function GlassCard({children, radius = radii.card, style, contentStyle}: Props) {
  return (
    <View style={[styles.ledge, {borderRadius: radius}, style]}>
      <View style={[styles.panel, {borderRadius: radius}]}>
        <View style={contentStyle}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ledge: {
    paddingBottom: 2,
    backgroundColor: colors.cardBorder,
    shadowColor: '#5A3C23',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 8},
  },
  panel: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.card,
  },
});
