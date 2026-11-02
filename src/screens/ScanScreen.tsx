import React, {useState} from 'react';
import {ActivityIndicator, StatusBar, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Svg, {Path} from 'react-native-svg';
import BackButton from '../components/BackButton';
import Blobs from '../components/Blobs';
import Bunny from '../components/Bunny';
import GlassCard from '../components/GlassCard';
import PrimaryButton from '../components/PrimaryButton';
import SecondaryButton from '../components/SecondaryButton';
import {Receipt, pickPhoto, readReceipt} from '../receipt';
import {colors, fonts, spacing} from '../theme';

type Props = {onBack?: () => void; onScanned?: (receipt: Receipt) => void};

const LINES = ['70%', '90%', '82%', '92%', '65%', '86%', '74%'];

export function BackTitle({title, onBack}: {title: string; onBack?: () => void}) {
  return (
    <View style={styles.top}>
      <BackButton onPress={onBack} />
      <Text style={styles.heading} numberOfLines={1}>
        {title}
      </Text>
    </View>
  );
}

// Figma: 07 Scan receipt. The photo is read by the read-receipt Edge Function (src/receipt.ts).
export default function ScanScreen({onBack, onScanned}: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scan = async (source: 'camera' | 'gallery') => {
    if (busy) {
      return;
    }
    setError(null);
    try {
      const photo = await pickPhoto(source);
      if (!photo) {
        return;
      }
      setBusy(true);
      onScanned?.(await readReceipt(photo));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <Blobs />
      <SafeAreaView style={styles.content}>
        <BackTitle title="Add a receipt" onBack={onBack} />

        <View style={styles.frame}>
          <View style={[styles.corner, {left: 22, top: 22, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 6}]} />
          <View style={[styles.corner, {right: 22, top: 22, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 6}]} />
          <View style={[styles.corner, {right: 22, bottom: 22, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 6}]} />
          <View style={styles.receipt}>
            <Text style={styles.shop}>SUPER MARKET</Text>
            {LINES.map((w, i) => (
              <View key={i} style={[styles.ln, {width: w as `${number}%`}]} />
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.total}>TOTAL</Text>
              <Text style={styles.total}>2,340</Text>
            </View>
          </View>
          <Bunny width={80} height={170} style={styles.bunny} />
        </View>

        <GlassCard style={styles.tip} contentStyle={styles.tipContent}>
          <Svg width={18} height={18} viewBox="0 0 24 24">
            <Path d="M12 2l2.2 6.6L21 11l-6.8 2.4L12 20l-2.2-6.6L3 11l6.8-2.4z" fill={colors.orange} />
          </Svg>
          <Text style={[styles.tipText, error ? styles.errorText : null]}>
            {busy
              ? 'Reading your receipt…'
              : error ?? "Lay the receipt flat in good light. I'll read every item for you."}
          </Text>
          {busy && <ActivityIndicator color={colors.orange} />}
        </GlassCard>

        <View style={styles.actions}>
          <PrimaryButton label={busy ? 'Reading…' : 'Take photo'} onPress={() => scan('camera')} />
          <SecondaryButton label="Choose from gallery" onPress={() => scan('gallery')} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: colors.background},
  content: {
    flex: 1,
    paddingHorizontal: spacing.screenX,
    paddingTop: 12,
    paddingBottom: spacing.screenBottom,
  },
  top: {flexDirection: 'row', alignItems: 'center', gap: 14},
  heading: {flex: 1, color: colors.text, fontFamily: fonts.serif, fontSize: 25},
  frame: {
    flex: 1,
    marginTop: 24,
    borderRadius: 22,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#C9A27A',
    backgroundColor: 'rgba(255,255,255,0.4)',
    overflow: 'hidden',
    alignItems: 'center',
  },
  corner: {position: 'absolute', width: 26, height: 26, borderColor: colors.orange},
  receipt: {
    marginTop: 54,
    width: 172,
    height: 250,
    padding: 18,
    gap: 9,
    borderRadius: 6,
    backgroundColor: '#FFFDFA',
    transform: [{rotate: '4deg'}],
    shadowColor: '#783E1E',
    shadowOpacity: 0.16,
    shadowRadius: 30,
    shadowOffset: {width: 0, height: 14},
    elevation: 6,
  },
  shop: {textAlign: 'center', color: colors.text, fontFamily: fonts.serifBold, fontSize: 13, letterSpacing: 0.4, marginBottom: 4},
  ln: {height: 5, borderRadius: 3, backgroundColor: '#E6DDD4'},
  totalRow: {
    marginTop: 'auto',
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#E6DDD4',
  },
  total: {color: '#8F4A30', fontFamily: fonts.black, fontSize: 11},
  bunny: {position: 'absolute', left: 12, bottom: -10},
  tip: {marginTop: 18},
  tipContent: {flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14},
  tipText: {flex: 1, color: '#4A3426', fontFamily: fonts.hand, fontSize: 19, lineHeight: 22},
  errorText: {color: '#9A3524'},
  actions: {marginTop: 20, gap: 14},
});
