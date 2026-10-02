import React from 'react';
import {StyleProp, StyleSheet, View, ViewStyle} from 'react-native';
import Gradient from './Gradient';
import {colors, radii} from '../theme';

type Props = {
  children?: React.ReactNode;
  radius?: number;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
};

// Frosted panel: translucent fill, white border, soft drop shadow, and
// gradients approximating the inner bevel (highlight on top, shade on bottom).
export default function GlassCard({
  children,
  radius = radii.card,
  style,
  contentStyle,
}: Props) {
  return (
    <View style={[styles.shadow, {borderRadius: radius}, style]}>
      <View style={[styles.panel, {borderRadius: radius}]}>
        <Gradient
          id="glassBevel"
          stops={[
            {offset: 0, color: '#FFFFFF', opacity: 0.45},
            {offset: 0.15, color: '#FFFFFF', opacity: 0},
            {offset: 0.85, color: '#734D2E', opacity: 0},
            {offset: 1, color: '#734D2E', opacity: 0.08},
          ]}
        />
        <View style={contentStyle}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: '#6B4729',
    shadowOpacity: 0.16,
    shadowRadius: 24,
    shadowOffset: {width: 0, height: 10},
    elevation: 6,
    backgroundColor: colors.glassFill,
  },
  panel: {
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassFill,
  },
});
