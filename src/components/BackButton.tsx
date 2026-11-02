import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import Svg, {Path} from 'react-native-svg';
import {colors, radii} from '../theme';

type Props = {onPress?: () => void};

// Round cream back arrow with a tan ledge.
export default function BackButton({onPress}: Props) {
  return (
    <Pressable onPress={onPress} hitSlop={8} accessibilityRole="button" accessibilityLabel="Back">
      <View style={styles.ledge}>
        <View style={styles.back}>
          <Svg width={16} height={16} viewBox="0 0 24 24">
            <Path
              d="M15 18l-6-6 6-6"
              stroke={colors.textSoft}
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </Svg>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  ledge: {borderRadius: radii.back, paddingBottom: 2, backgroundColor: colors.tan},
  back: {
    width: 38,
    height: 38,
    borderRadius: radii.back,
    borderWidth: 1.5,
    borderColor: colors.tan,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
