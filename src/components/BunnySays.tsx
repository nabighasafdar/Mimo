import React from 'react';
import {StyleSheet, View} from 'react-native';
import Bunny from './Bunny';
import TypingText from './TypingText';
import {colors, fonts} from '../theme';

type Props = {text: string; size?: number};

// Mimo with a handwritten speech bubble beside it. `size` is Mimo's width (aspect ~1:2.1).
export default function BunnySays({text, size = 52}: Props) {
  return (
    <View style={styles.row}>
      <Bunny width={size} height={Math.round(size * 2.1)} />
      <View style={styles.ledge}>
        <View style={styles.bubble}>
          <TypingText text={text} style={styles.text} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {flexDirection: 'row', alignItems: 'center', gap: 12},
  ledge: {
    flex: 1,
    paddingBottom: 3,
    backgroundColor: '#E5D3B3',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
    borderBottomLeftRadius: 6,
  },
  bubble: {
    paddingHorizontal: 16,
    paddingTop: 9,
    paddingBottom: 10,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.tan,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
    borderBottomLeftRadius: 6,
  },
  text: {color: colors.text, fontFamily: fonts.hand, fontSize: 20, lineHeight: 24},
});
