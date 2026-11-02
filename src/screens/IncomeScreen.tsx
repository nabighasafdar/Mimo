import React, {useRef, useState} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ScrollViewInstance,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Svg, {Path, Rect} from 'react-native-svg';
import Blobs from '../components/Blobs';
import BunnySays from '../components/BunnySays';
import GlassCard from '../components/GlassCard';
import OnboardingHeader from '../components/OnboardingHeader';
import PrimaryButton from '../components/PrimaryButton';
import SelectRow from '../components/SelectRow';
import {colors, fonts, spacing, textColors} from '../theme';

type Props = {
  initialPicked?: string;
  initialAmount?: string;
  onBack?: () => void;
  onContinue?: (income: string, amount: string) => void;
};

type Option = {
  id: string;
  title: string;
  sub: string;
  bg: string;
  fg: string;
  icon: React.ReactNode;
};

const icon = (children: React.ReactNode) => (
  <Svg
    width={18}
    height={18}
    viewBox="0 0 24 24"
    fill="none"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </Svg>
);

const OPTIONS: Option[] = [
  {
    id: 'salary',
    title: 'Monthly salary',
    sub: 'I get paid every month',
    bg: 'rgba(158,85,57,0.14)',
    fg: '#8F4A30',
    icon: icon(
      <>
        <Rect x={3} y={7} width={18} height={13} rx={2} stroke="#8F4A30" />
        <Path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 12h18" stroke="#8F4A30" />
      </>,
    ),
  },
  {
    id: 'pocket',
    title: 'Pocket money',
    sub: 'Allowance from family',
    bg: 'rgba(138,148,112,0.22)',
    fg: '#4F5A3A',
    icon: icon(
      <>
        <Rect x={3} y={6} width={18} height={14} rx={3} stroke="#4F5A3A" />
        <Path d="M3 10h18M16 15h2" stroke="#4F5A3A" />
      </>,
    ),
  },
  {
    id: 'none',
    title: 'No income yet',
    sub: "I'll just track spending",
    bg: 'rgba(160,130,210,0.22)',
    fg: '#5B4232',
    icon: icon(
      <Path
        d="M12 21v-9M12 12c0-4-3-6-7-6 0 4 3 6 7 6zM12 10c0-3 2.5-5 6-5 0 3.5-2.5 5-6 5z"
        stroke="#5B4232"
      />,
    ),
  },
];

// Figma: 04 Income
export default function IncomeScreen({
  initialPicked = 'salary',
  initialAmount = '50,000',
  onBack,
  onContinue,
}: Props) {
  const [picked, setPicked] = useState(initialPicked);
  const [amount, setAmount] = useState(initialAmount);
  const scrollRef = useRef<ScrollViewInstance>(null);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <Blobs />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <SafeAreaView style={styles.content}>
          <OnboardingHeader step={3} onBack={onBack} />

          <ScrollView
            ref={scrollRef}
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <BunnySays text="Where does your money come from?" />
            <Text style={styles.title}>Your income</Text>

            <View style={styles.options}>
              {OPTIONS.map(o => (
                <SelectRow key={o.id} selected={picked === o.id} onPress={() => setPicked(o.id)}>
                  <View style={[styles.ico, {backgroundColor: o.bg}]}>{o.icon}</View>
                  <View>
                    <Text style={styles.optTitle}>{o.title}</Text>
                    <Text style={styles.optSub}>{o.sub}</Text>
                  </View>
                </SelectRow>
              ))}
            </View>

            <View style={styles.amount}>
              <Text style={styles.label}>How much do you get each month?</Text>
              <View style={styles.amountRow}>
                <GlassCard style={styles.cur} contentStyle={styles.curContent}>
                  <Text style={styles.curText}>PKR</Text>
                </GlassCard>
                <GlassCard style={styles.flex} contentStyle={styles.inputContent}>
                  <TextInput
                    value={amount}
                    onChangeText={setAmount}
                    onFocus={() =>
                      setTimeout(() => scrollRef.current?.scrollToEnd({animated: true}), 150)
                    }
                    placeholder="Amount"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                    style={styles.input}
                  />
                </GlassCard>
              </View>
            </View>
          </ScrollView>

          <PrimaryButton label="Continue" onPress={() => onContinue?.(picked, amount)} />
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
  scroll: {flex: 1},
  scrollContent: {paddingTop: 24, paddingBottom: 16, gap: 20},
  flex: {flex: 1},
  title: {color: colors.text, fontFamily: fonts.serif, fontSize: 30},
  options: {gap: 12},
  ico: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optTitle: {color: colors.text, fontFamily: fonts.extraBold, fontSize: 15},
  optSub: {
    color: textColors.subtitle,
    fontFamily: fonts.semiBold,
    fontSize: 12,
    marginTop: 2,
  },
  amount: {gap: 8},
  label: {color: colors.textMuted, fontFamily: fonts.extraBold, fontSize: 11, letterSpacing: 0.7, textTransform: 'uppercase'},
  amountRow: {flexDirection: 'row', gap: 10},
  cur: {width: 88},
  curContent: {height: 59, alignItems: 'center', justifyContent: 'center'},
  curText: {color: colors.orange, fontFamily: fonts.extraBold, fontSize: 16},
  inputContent: {
    height: 59,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  input: {
    flex: 1,
    padding: 0,
    color: colors.text,
    fontFamily: fonts.extraBold,
    fontSize: 18,
  },
});
