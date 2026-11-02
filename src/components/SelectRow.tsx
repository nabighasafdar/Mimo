import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import Svg, {Path} from 'react-native-svg';
import GlassCard from './GlassCard';
import {colors} from '../theme';

type Props = {
  selected: boolean;
  onPress: () => void;
  height?: number;
  children: React.ReactNode;
};

// Glass option row with a trailing radio; the selected row gets a peach fill and orange border.
export default function SelectRow({selected, onPress, height = 72, children}: Props) {
  const body = (
    <View style={[styles.row, {height}]}>
      {children}
      <View style={[styles.radio, selected && styles.radioOn]}>
        {selected && (
          <Svg width={12} height={12} viewBox="0 0 24 24">
            <Path
              d="M5 12.5l4.5 4.5L19 7.5"
              stroke={colors.white}
              strokeWidth={3.2}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </Svg>
        )}
      </View>
    </View>
  );

  return (
    <Pressable onPress={onPress}>
      {selected ? <View style={styles.selected}>{body}</View> : <GlassCard>{body}</GlassCard>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16},
  selected: {
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: colors.orange,
    backgroundColor: 'rgba(250,205,170,0.5)',
  },
  radio: {
    marginLeft: 'auto',
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(200,170,140,0.4)',
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: {backgroundColor: colors.orange, borderWidth: 0},
});
