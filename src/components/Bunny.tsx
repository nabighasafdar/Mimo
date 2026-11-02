import React from 'react';
import {Image, ImageStyle, StyleProp} from 'react-native';
import {art} from '../art';

type Props = {width?: number; height?: number; style?: StyleProp<ImageStyle>};

// Mimo the bunny holding a basket of flowers (artwork is about 1:2.1).
export default function Bunny({width = 61, height = 130, style}: Props) {
  return (
    <Image
      source={art.mimo}
      resizeMode="contain"
      accessibilityLabel="Mimo"
      style={[{width, height}, style]}
    />
  );
}
