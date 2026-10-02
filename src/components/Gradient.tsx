import React, {useState} from 'react';
import {LayoutChangeEvent, StyleSheet, View} from 'react-native';
import Svg, {Defs, LinearGradient, Rect, Stop} from 'react-native-svg';

export type GradientStop = {offset: number; color: string; opacity?: number};

type Props = {id: string; stops: GradientStop[]};

// Vertical gradient filling its parent. Uses measured pixel sizes because
// percentage-sized SVGs render as a fixed-size rectangle on Android.
// Stop colors must be hex (use `opacity` for alpha); rgba() strings ignore alpha.
export default function Gradient({id, stops}: Props) {
  const [size, setSize] = useState({width: 0, height: 0});

  const onLayout = (e: LayoutChangeEvent) => {
    const {width, height} = e.nativeEvent.layout;
    setSize({width, height});
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" onLayout={onLayout}>
      {size.width > 0 && (
        <Svg width={size.width} height={size.height}>
          <Defs>
            <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              {stops.map(s => (
                <Stop
                  key={s.offset}
                  offset={s.offset}
                  stopColor={s.color}
                  stopOpacity={s.opacity ?? 1}
                />
              ))}
            </LinearGradient>
          </Defs>
          <Rect width={size.width} height={size.height} fill={`url(#${id})`} />
        </Svg>
      )}
    </View>
  );
}
