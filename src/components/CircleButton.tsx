import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import Svg, {Path} from 'react-native-svg';
import Gradient from './Gradient';
import GlassCard from './GlassCard';
import {colors} from '../theme';

type Props = {
  kind: 'minus' | 'plus';
  onPress?: () => void;
  size?: number;
};

// Round stepper button: glass for minus, orange gradient for plus.
export default function CircleButton({kind, onPress, size = 62}: Props) {
  const primary = kind === 'plus';
  const stroke = primary ? colors.white : colors.text;
  const icon = (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path
        d={primary ? 'M12 5v14M5 12h14' : 'M5 12h14'}
        stroke={stroke}
        strokeWidth={2.6}
        strokeLinecap="round"
      />
    </Svg>
  );

  return (
    <Pressable onPress={onPress} hitSlop={8}>
      {primary ? (
        <View style={[styles.primary, {width: size, height: size, borderRadius: size / 2}]}>
          <Gradient
            id="circleFill"
            stops={[
              {offset: 0, color: '#9E5539'},
              {offset: 1, color: '#9E5539'},
            ]}
          />
          {icon}
        </View>
      ) : (
        <GlassCard
          radius={size / 2}
          style={{width: size, height: size}}
          contentStyle={[styles.center, {width: size - 3, height: size - 3}]}>
          {icon}
        </GlassCard>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: {alignItems: 'center', justifyContent: 'center'},
  primary: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.buttonBottom,
    shadowColor: '#D9661F',
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: {width: 0, height: 8},
    elevation: 8,
  },
});
