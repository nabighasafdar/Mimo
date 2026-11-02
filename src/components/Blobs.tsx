import React from 'react';
import {Image, StyleSheet, View} from 'react-native';
import Svg, {Defs, RadialGradient, Rect, Stop} from 'react-native-svg';
import {art} from '../art';

// Screen background: cream paper with a speckle texture and warm tints in two corners.
// (Named Blobs because every screen already renders it behind its content.)
export default function Blobs() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <RadialGradient id="tintTL" cx="0%" cy="0%" rx="60%" ry="46%">
            <Stop offset="0" stopColor="#B27052" stopOpacity="0.2" />
            <Stop offset="1" stopColor="#B27052" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="tintBR" cx="100%" cy="100%" rx="60%" ry="46%">
            <Stop offset="0" stopColor="#A27F45" stopOpacity="0.22" />
            <Stop offset="1" stopColor="#A27F45" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#tintTL)" />
        <Rect width="100%" height="100%" fill="url(#tintBR)" />
      </Svg>
      <Image source={art.paper} resizeMode="repeat" style={styles.texture} />
    </View>
  );
}

const styles = StyleSheet.create({
  texture: {...StyleSheet.absoluteFill, width: '100%', height: '100%'},
});
