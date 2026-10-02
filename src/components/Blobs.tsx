import React from 'react';
import {StyleSheet, View} from 'react-native';
import Svg, {Defs, RadialGradient, Rect, Stop} from 'react-native-svg';
import {colors} from '../theme';

type Blob = {id: string; left: number; top: number; size: number; color: string};

// Positions and sizes from the Figma "Name" frame.
const BLOBS: Blob[] = [
  {id: 'blush', left: 200, top: -90, size: 260, color: colors.blobBlush},
  {id: 'orange', left: 230, top: 430, size: 210, color: colors.blobOrange},
  {id: 'butter', left: -60, top: 230, size: 200, color: colors.blobButter},
  {id: 'sage', left: -110, top: 700, size: 240, color: colors.blobSage},
];

// Soft radial blobs standing in for Figma's blurred ellipses.
export default function Blobs() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {BLOBS.map(b => {
        const pad = b.size * 0.22;
        const full = b.size + pad * 2;
        return (
          <Svg
            key={b.id}
            width={full}
            height={full}
            style={{position: 'absolute', left: b.left - pad, top: b.top - pad}}>
            <Defs>
              <RadialGradient id={b.id} cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor={b.color} stopOpacity="0.95" />
                <Stop offset="0.6" stopColor={b.color} stopOpacity="0.7" />
                <Stop offset="1" stopColor={b.color} stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Rect width={full} height={full} fill={`url(#${b.id})`} />
          </Svg>
        );
      })}
    </View>
  );
}
