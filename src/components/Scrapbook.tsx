import React, {useState} from 'react';
import {Image, ImageSourcePropType, StyleProp, StyleSheet, Text, View, ViewStyle} from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Image as SvgImage,
  Line,
  Path,
  Pattern,
  Polygon,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import {art} from '../art';
import {colors, fonts} from '../theme';

// Scrapbook pieces from the design canvas: torn paper, washi tape, burlap, stickers.

// Torn-edge outline (percent of the box), taken from the design's `.torn` clip path.
const TORN =
  '0,1.6 3.6,0.1 7.1,1.3 10.7,0.1 14.3,0.1 17.9,1.8 21.4,1.2 25,2.1 28.6,0.7 32.1,0.6 35.7,1.3 39.3,2.5 42.9,0.4 46.4,1.2 50,2.4 53.6,1.5 57.1,2.5 60.7,1.3 64.3,2 67.9,1.6 71.4,0.3 75,1.4 78.6,0.5 82.1,0.6 85.7,1.2 89.3,1.2 92.9,0.2 96.4,0.2 99.3,0 99.4,7.1 99.9,14.3 99.4,21.4 99.5,28.6 99.8,35.7 99.4,42.9 98.4,50 98.6,57.1 99.1,64.3 98.5,71.4 99.4,78.6 99.4,85.7 99.2,92.9 100,97.5 96.4,98.6 92.9,98.7 89.3,99.7 85.7,98.7 82.1,99.8 78.6,98.9 75,97.6 71.4,98.6 67.9,98.7 64.3,98.2 60.7,99.7 57.1,98.4 53.6,98.2 50,98.4 46.4,98.9 42.9,97.9 39.3,99.3 35.7,99 32.1,97.4 28.6,97.4 25,97.6 21.4,98.3 17.9,99.9 14.3,99.9 10.7,99.9 7.1,98.4 3.6,98.3 1,100 0.8,92.9 1.6,85.7 0.7,78.6 0.1,71.4 0.8,64.3 0.7,57.1 0.3,50 0.1,42.9 0,35.7 0.4,28.6 1.1,21.4 0.7,14.3 0.1,7.1';

/** A scrap of kraft paper with torn edges; children sit on top. */
export function TornPaper({
  children,
  style,
  rotate = -1,
}: {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  rotate?: number;
}) {
  // The outline is drawn at the box's measured size, so it always covers everything inside.
  const [size, setSize] = useState({w: 0, h: 0});
  return (
    <View
      style={[{transform: [{rotate: `${rotate}deg`}]}, style]}
      onLayout={e => {
        const {width, height} = e.nativeEvent.layout;
        if (width !== size.w || height !== size.h) {
          setSize({w: width, h: height});
        }
      }}>
      <Svg
        style={StyleSheet.absoluteFill}
        width={size.w}
        height={size.h}
        viewBox="0 0 100 100"
        preserveAspectRatio="none">
        <Defs>
          <RadialGradient id="tornFill" cx="50%" cy="45%" rx="62%" ry="62%">
            <Stop offset="0" stopColor="#F6EBD6" />
            <Stop offset="0.6" stopColor="#E8D6B6" />
            <Stop offset="1" stopColor="#CDB08A" />
          </RadialGradient>
        </Defs>
        <Polygon points={TORN} fill="url(#tornFill)" />
      </Svg>
      {children}
    </View>
  );
}

/** A strip of striped washi tape. Position it absolutely with `style`. */
export function Tape({style, width = 88}: {style?: StyleProp<ViewStyle>; width?: number}) {
  return (
    <View style={[{position: 'absolute', width, height: 22}, style]} pointerEvents="none">
      <Svg width={width} height={22}>
        <Defs>
          <Pattern id="tapeStripes" width={12} height={12} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <Rect width={12} height={12} fill="rgba(224,201,164,0.85)" />
            <Rect width={6} height={12} fill="rgba(201,169,126,0.85)" />
          </Pattern>
        </Defs>
        <Polygon
          points={`${width * 0.03},0 ${width * 0.97},0 ${width},4 ${width * 0.97},9 ${width},13 ${width * 0.97},18 ${width},22 ${width * 0.03},22 0,18 ${width * 0.03},13 0,9 ${width * 0.03},4`}
          fill="url(#tapeStripes)"
        />
      </Svg>
    </View>
  );
}

/** Burlap backing card with a stitched edge. */
export function Burlap({style}: {style?: StyleProp<ViewStyle>}) {
  return (
    <View style={[styles.burlap, style]} pointerEvents="none">
      <Image source={art.burlap} resizeMode="cover" style={StyleSheet.absoluteFill} />
      <View style={styles.burlapStitch} />
    </View>
  );
}

/** A tilted picture sticker from the design (flowers, carrots, jars…). */
export function Deco({
  source,
  style,
  rotate = 0,
}: {
  source: ImageSourcePropType;
  style: StyleProp<ViewStyle> & {width: number; height: number};
  rotate?: number;
}) {
  return (
    <Image
      source={source}
      resizeMode="contain"
      accessible={false}
      style={[{position: 'absolute', transform: [{rotate: `${rotate}deg`}]}, style as object]}
    />
  );
}

/** A dashed rubber-stamp label, like the month tag on Home. */
export function Stamp({label, style}: {label: string; style?: StyleProp<ViewStyle>}) {
  return (
    <View style={[styles.stamp, style]}>
      <Text style={styles.stampText}>{label}</Text>
    </View>
  );
}

export type StickerKind = 'bow' | 'butterfly' | 'flowers' | 'coffee' | 'daisy' | 'seal';

const STICKER_COLORS: Record<StickerKind, [string, string]> = {
  bow: ['#6B4532', '#4E3022'],
  butterfly: ['#A26B48', '#7E4E33'],
  flowers: ['#C08A6A', '#B5644A'],
  coffee: ['#FBF6EC', '#FBF6EC'],
  daisy: ['#D9A441', '#D9A441'],
  seal: ['#8F3B2B', '#6E2A1E'],
};

/** Hand-drawn sticker with a white die-cut edge. */
export function Sticker({
  kind,
  size,
  rotate = 0,
  tint,
  style,
}: {
  kind: StickerKind;
  size: number;
  rotate?: number;
  tint?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const [d1, c2] = STICKER_COLORS[kind];
  const c1 = tint ?? d1;
  // Shapes drawn twice: a thick white outline first (the die-cut edge), then the fill.
  const cut = (shapes: (fill: string | undefined, outline: boolean) => React.ReactNode) => (
    <>
      <G stroke="#FFFDF8" strokeWidth={7} strokeLinejoin="round">
        {shapes(undefined, true)}
      </G>
      {shapes(undefined, false)}
    </>
  );
  return (
    <View
      style={[{position: 'absolute', width: size, height: size, transform: [{rotate: `${rotate}deg`}]}, style]}
      pointerEvents="none">
      <Svg width={size} height={size} viewBox="0 0 100 100">
        {kind === 'bow' &&
          cut((_, o) => (
            <>
              <Path d="M48 50 C40 30 14 22 10 36 C6 52 26 60 48 54 Z" fill={o ? '#FFFDF8' : c1} />
              <Path d="M52 50 C60 30 86 22 90 36 C94 52 74 60 52 54 Z" fill={o ? '#FFFDF8' : c1} />
              <Path d="M46 54 L30 88 L39 84 L44 93 L50 56 Z" fill={o ? '#FFFDF8' : c2} />
              <Path d="M54 54 L70 88 L61 84 L56 93 L50 56 Z" fill={o ? '#FFFDF8' : c2} />
              <Ellipse cx={50} cy={52} rx={8} ry={9} fill={o ? '#FFFDF8' : c2} />
            </>
          ))}
        {kind === 'butterfly' && (
          <>
            {cut((_, o) => (
              <>
                <Path d="M49 48 C40 20 12 14 10 30 C8 44 26 52 49 52 Z" fill={o ? '#FFFDF8' : c1} />
                <Path d="M51 48 C60 20 88 14 90 30 C92 44 74 52 51 52 Z" fill={o ? '#FFFDF8' : c1} />
                <Path d="M49 52 C34 54 20 66 26 78 C32 88 46 74 49 58 Z" fill={o ? '#FFFDF8' : c2} />
                <Path d="M51 52 C66 54 80 66 74 78 C68 88 54 74 51 58 Z" fill={o ? '#FFFDF8' : c2} />
                <Rect x={47.5} y={40} width={5} height={30} rx={2.5} fill={o ? '#FFFDF8' : '#4A3426'} />
              </>
            ))}
            <G fill="#FBF0DC" opacity={0.9}>
              <Circle cx={20} cy={27} r={2.6} />
              <Circle cx={80} cy={27} r={2.6} />
            </G>
            <G stroke="#4A3426" strokeWidth={1.5} fill="none" strokeLinecap="round">
              <Path d="M49 41 C46 34 42 30 38 29" />
              <Path d="M51 41 C54 34 58 30 62 29" />
            </G>
          </>
        )}
        {kind === 'flowers' && (
          <>
            <G fill="none" stroke="#7D7350" strokeWidth={2.2} strokeLinecap="round">
              <Line x1={50} y1={94} x2={42} y2={38} />
              <Line x1={50} y1={94} x2={60} y2={30} />
              <Line x1={50} y1={94} x2={30} y2={48} />
              <Line x1={50} y1={94} x2={72} y2={50} />
            </G>
            <G stroke="#FFFDF8" strokeWidth={3}>
              <Circle cx={42} cy={36} r={7} fill={c1} />
              <Circle cx={60} cy={28} r={6} fill="#E9D9B8" />
              <Circle cx={29} cy={46} r={5.5} fill="#A27F45" />
              <Circle cx={72} cy={48} r={6.5} fill={c2} />
            </G>
          </>
        )}
        {kind === 'coffee' && (
          <>
            <Path d="M55 30 L64 4" stroke="#6B4532" strokeWidth={4.5} strokeLinecap="round" />
            <Path d="M27 34 L73 34 L67 93 L33 93 Z" fill="#C9A27A" stroke="#FFFDF8" strokeWidth={6} strokeLinejoin="round" />
            <Path d="M29.6 45 L70.4 45 L68.5 64 L31.5 64 Z" fill="#9C6A45" />
            <Path d="M28.6 37 L71.4 37 L70.7 45 L29.3 45 Z" fill="#F4E9D6" />
            <Rect x={23} y={28} width={54} height={8} rx={4} fill={colors.card} stroke={colors.cardBorder} strokeWidth={1.5} />
            <Path d="M33 78 C40 72 46 86 52 79 C58 72 64 84 69 78" stroke={c1} strokeWidth={3} fill="none" strokeLinecap="round" />
          </>
        )}
        {kind === 'daisy' && (
          <>
            <G fill="#FFFDF8" stroke={colors.cardBorder} strokeWidth={1.2}>
              {Array.from({length: 12}, (_, i) => (
                <Ellipse key={i} cx={50} cy={24} rx={7} ry={17} rotation={i * 30} origin="50, 50" />
              ))}
            </G>
            <Circle cx={50} cy={50} r={12} fill={c1} />
          </>
        )}
        {kind === 'seal' && <SvgImage href={art.seal} x={0} y={0} width={100} height={100} />}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  burlap: {
    position: 'absolute',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#5A3C23',
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 10},
    elevation: 6,
  },
  burlapStitch: {
    ...StyleSheet.absoluteFill,
    margin: 5,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,244,228,0.8)',
  },
  stamp: {
    paddingHorizontal: 10,
    paddingVertical: 1,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.orange,
    borderRadius: 8,
    transform: [{rotate: '3deg'}],
  },
  stampText: {color: colors.accentText, fontFamily: fonts.handBold, fontSize: 18},
});
