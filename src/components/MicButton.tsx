import React, {useEffect, useRef} from 'react';
import {Animated, Easing, Pressable, StyleSheet, View} from 'react-native';
import Svg, {Path, Rect} from 'react-native-svg';
import Gradient from './Gradient';
import {colors} from '../theme';

type Props = {
  active: boolean;
  onPress: () => void;
  size?: number;
  label?: string;
  style?: object;
};

export function MicIcon({size = 18, color = colors.white}: {size?: number; color?: string}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={9} y={3} width={6} height={11} rx={3} stroke={color} strokeWidth={2.2} />
      <Path d="M5 11a7 7 0 0 0 14 0M12 18v3" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
    </Svg>
  );
}

// Round orange mic button; pulses a ring while `active` (listening).
export default function MicButton({active, onPress, size = 42, label = 'Say it', style}: Props) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) {
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(pulse, {toValue: 1, duration: 1200, easing: Easing.out(Easing.quad), useNativeDriver: true}),
    );
    loop.start();
    return () => loop.stop();
  }, [active, pulse]);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={active ? 'Stop listening' : label}
      hitSlop={6}
      style={[{width: size, height: size}, style]}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.ring,
          {
            borderRadius: size / 2,
            opacity: pulse.interpolate({inputRange: [0, 1], outputRange: [0.8, 0]}),
            transform: [{scale: pulse.interpolate({inputRange: [0, 1], outputRange: [1, 1.7]})}],
          },
        ]}
      />
      <View style={[styles.button, {borderRadius: size / 2}]}>
        <Gradient
          id="micFill"
          stops={[
            {offset: 0, color: '#9E5539'},
            {offset: 1, color: '#9E5539'},
          ]}
        />
        {active ? (
          <View style={styles.stop} />
        ) : (
          <MicIcon size={Math.round(size * 0.43)} />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  ring: {...StyleSheet.absoluteFill, borderWidth: 2, borderColor: 'rgba(232,121,59,0.5)'},
  button: {
    flex: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.buttonBottom,
    shadowColor: '#8F4A30',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 6},
    elevation: 6,
  },
  stop: {width: 14, height: 14, borderRadius: 3, backgroundColor: colors.white},
});
