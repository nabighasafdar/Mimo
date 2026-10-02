import React from 'react';
import {Image, ImageStyle, StyleProp} from 'react-native';

type Props = {width?: number; height?: number; style?: StyleProp<ImageStyle>};

// Defaults match the "Bunny says" size in the Figma Name screen (61x130).
export default function Bunny({width = 61, height = 130, style}: Props) {
  return (
    <Image
      source={require('../../assets/bunny_final.png')}
      resizeMode="contain"
      style={[{width, height}, style]}
    />
  );
}
