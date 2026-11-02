import React, {useMemo, useState} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Svg, {Circle, Path} from 'react-native-svg';
import Blobs from '../components/Blobs';
import GlassCard from '../components/GlassCard';
import OnboardingHeader from '../components/OnboardingHeader';
import PrimaryButton from '../components/PrimaryButton';
import SelectRow from '../components/SelectRow';
import {Currency, CURRENCIES} from '../store';
import {colors, fonts, spacing, textColors} from '../theme';

type Props = {
  initialCode?: string;
  confirmLabel?: string;
  onBack?: () => void;
  onContinue?: (currency: Currency) => void;
};

// Figma: 05 Currency
export default function CurrencyScreen({
  initialCode = 'PKR',
  confirmLabel = "All set, let's go!",
  onBack,
  onContinue,
}: Props) {
  const [picked, setPicked] = useState(initialCode);
  const [query, setQuery] = useState('');
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CURRENCIES.filter(
      c => !q || c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <Blobs />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <SafeAreaView style={styles.content}>
          <OnboardingHeader step={4} onBack={onBack} />

          <Text style={styles.title}>Pick your currency</Text>
          <Text style={styles.subtitle}>I'll show every amount in this currency.</Text>

          <GlassCard style={styles.search} contentStyle={styles.searchContent}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Circle cx={11} cy={11} r={7} stroke={colors.textMuted} strokeWidth={2.2} />
              <Path
                d="M20 20l-3.5-3.5"
                stroke={colors.textMuted}
                strokeWidth={2.2}
                strokeLinecap="round"
              />
            </Svg>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search currency"
              placeholderTextColor={colors.textMuted}
              style={styles.searchInput}
            />
          </GlassCard>

          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {list.map(c => {
              const on = picked === c.code;
              return (
                <SelectRow key={c.code} selected={on} height={66} onPress={() => setPicked(c.code)}>
                  <View style={[styles.sym, on && styles.symOn]}>
                    <Text style={[styles.symText, on && styles.symTextOn]}>{c.sym}</Text>
                  </View>
                  <View>
                    <Text style={styles.code}>{c.code}</Text>
                    <Text style={styles.name}>{c.name}</Text>
                  </View>
                </SelectRow>
              );
            })}
          </ScrollView>

          <PrimaryButton
            label={confirmLabel}
            onPress={() => onContinue?.(CURRENCIES.find(c => c.code === picked)!)}
          />
        </SafeAreaView>
      </KeyboardAvoidingView>
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
  title: {
    marginTop: 28,
    color: colors.text,
    fontFamily: fonts.serif,
    fontSize: 30,
  },
  subtitle: {
    marginTop: 8,
    color: textColors.subtitle,
    fontFamily: fonts.semiBold,
    fontSize: 14,
  },
  search: {marginTop: 20},
  searchContent: {
    height: 51,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
  },
  flex: {flex: 1},
  searchInput: {
    flex: 1,
    padding: 0,
    color: colors.text,
    fontFamily: fonts.semiBold,
    fontSize: 15,
  },
  list: {flex: 1, marginTop: 16},
  listContent: {gap: 14, paddingBottom: 12},
  sym: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.75)',
  },
  symOn: {backgroundColor: 'rgba(158,85,57,0.14)'},
  symText: {color: '#5B4232', fontFamily: fonts.extraBold, fontSize: 13},
  symTextOn: {color: '#8F4A30'},
  code: {color: colors.text, fontFamily: fonts.extraBold, fontSize: 15},
  name: {
    color: textColors.subtitle,
    fontFamily: fonts.semiBold,
    fontSize: 12,
    marginTop: 1,
  },
});
