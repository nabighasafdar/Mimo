import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Svg, {Circle, Path} from 'react-native-svg';
import {colors, fonts} from '../theme';

export type Tab = 'Home' | 'Stats' | 'Goals' | 'Me';

const LABELS: Record<Tab, string> = {Home: 'Home', Stats: 'Stats', Goals: 'Bucket list', Me: 'Me'};

const ICONS: Record<Tab, (c: string) => React.ReactNode> = {
  Home: c => (
    <Path
      d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"
      stroke={c}
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  Stats: c => <Path d="M6 20V12M12 20V5M18 20v-9" stroke={c} strokeWidth={1.9} strokeLinecap="round" />,
  Goals: c => (
    <Path
      d="M10 6h10M10 12h10M10 18h10M3.5 6l1.5 1.5 2.5-3M3.5 12l1.5 1.5 2.5-3M3.5 18l1.5 1.5 2.5-3"
      stroke={c}
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  Me: c => (
    <>
      <Circle cx={12} cy={8} r={4} stroke={c} strokeWidth={1.9} />
      <Path d="M4 21c1-4 4-6 8-6s7 2 8 6" stroke={c} strokeWidth={1.9} strokeLinecap="round" />
    </>
  ),
};

// Cream pill tab bar with a stitched edge and a raised terracotta Scan button in the middle.
export default function BottomNav({active}: {active: Tab}) {
  const navigation = useNavigation<any>();

  // Reset instead of navigate so switching tabs doesn't stack screens.
  const go = (name: Tab) => {
    if (name !== active) {
      navigation.reset({index: 0, routes: [{name}]});
    }
  };

  const item = (name: Tab) => {
    const on = name === active;
    const color = on ? colors.accentText : '#7A6150';
    return (
      <Pressable
        key={name}
        onPress={() => go(name)}
        style={[styles.item, on && styles.itemOn]}
        accessibilityRole="tab"
        accessibilityState={{selected: on}}
        accessibilityLabel={LABELS[name]}>
        <Svg width={21} height={21} viewBox="0 0 24 24" fill="none">
          {ICONS[name](color)}
        </Svg>
        <Text style={[styles.label, {color}]} numberOfLines={1} adjustsFontSizeToFit>
          {LABELS[name]}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.ledge}>
      <View style={styles.nav}>
        <View style={styles.stitch} pointerEvents="none" />
        {item('Home')}
        {item('Stats')}
        <Pressable
          onPress={() => navigation.navigate('ScanReceipt')}
          accessibilityLabel="Scan a receipt"
          style={styles.scanRing}>
          <View style={styles.scan}>
            <View style={styles.scanStitch} pointerEvents="none" />
            <Svg width={23} height={23} viewBox="0 0 24 24" fill="none">
              <Path
                d="M4 8h3l2-3h6l2 3h3v11H4z"
                stroke={colors.onAccent}
                strokeWidth={1.9}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Circle cx={12} cy={13} r={3.5} stroke={colors.onAccent} strokeWidth={1.9} />
            </Svg>
          </View>
        </Pressable>
        {item('Goals')}
        {item('Me')}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ledge: {
    borderRadius: 35,
    paddingBottom: 3,
    backgroundColor: colors.tan,
    shadowColor: '#5A3C23',
    shadowOpacity: 0.14,
    shadowRadius: 14,
    shadowOffset: {width: 0, height: 10},
    elevation: 6,
  },
  nav: {
    height: 70,
    borderRadius: 35,
    borderWidth: 1.5,
    borderColor: colors.tan,
    backgroundColor: colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  stitch: {
    position: 'absolute',
    left: 6,
    right: 6,
    top: 6,
    bottom: 6,
    borderRadius: 29,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#DCC6A2',
  },
  // Tabs share the space left by the Scan button, so the bar fits any phone width.
  item: {flex: 1, minWidth: 0, alignItems: 'center', gap: 2, paddingTop: 6, paddingBottom: 4, borderRadius: 16},
  itemOn: {backgroundColor: 'rgba(217,190,150,0.38)'},
  label: {fontFamily: fonts.extraBold, fontSize: 10.5},
  scanRing: {
    width: 68,
    height: 68,
    marginTop: -30,
    borderRadius: 34,
    padding: 5,
    backgroundColor: colors.background,
  },
  scan: {
    flex: 1,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.orange,
    borderBottomWidth: 4,
    borderBottomColor: colors.accentShadow,
  },
  scanStitch: {
    position: 'absolute',
    left: 5,
    right: 5,
    top: 5,
    bottom: 3,
    borderRadius: 24,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,236,214,0.65)',
  },
});
