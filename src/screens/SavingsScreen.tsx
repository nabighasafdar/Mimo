import React, {useState} from 'react';
import {Pressable, StatusBar, StyleSheet, Text, TextInput, View} from 'react-native';
import Blobs from '../components/Blobs';
import BunnySays from '../components/BunnySays';
import GlassCard from '../components/GlassCard';
import KeyboardScreen from '../components/KeyboardScreen';
import {Sticker, Tape, TornPaper} from '../components/Scrapbook';
import PrimaryButton from '../components/PrimaryButton';
import {BackTitle} from './ScanScreen';
import {SAVE_SHARES, spendable} from '../budget';
import {useMoney, useStore} from '../store';
import {formatAmount} from '../voiceParse';
import {colors, fonts, spacing, textColors} from '../theme';

type Props = {onBack?: () => void; onSaved?: () => void};

const roundDown = (n: number) => Math.floor(n / 100) * 100;

// How much the user wants to save each month. Everything else in their income is what they
// can spend; Home, the 80% / overspend warnings and Stats measure against that.
export default function SavingsScreen({onBack, onSaved}: Props) {
  const {income, savingsGoal, setSavingsGoal, spent, profile} = useStore();
  const money = useMoney();
  const [draft, setDraft] = useState(savingsGoal ? formatAmount(savingsGoal) : '');
  const [error, setError] = useState<string | null>(null);

  const goal = parseInt(draft.replace(/\D/g, ''), 10) || 0;
  const tooMuch = income > 0 && goal > income;
  const allowance = spendable(income, goal);

  const save = () => {
    if (tooMuch) {
      setError(`That's more than your income of ${money(income)}.`);
      return;
    }
    setSavingsGoal(goal);
    onSaved?.();
  };

  const bunny = income
    ? `You earn ${money(income)} a month. How much of it do you want to keep?`
    : 'Add your income in Me first, so I can tell you how much you can spend.';

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <Blobs />
      <KeyboardScreen style={styles.content}>
        <BackTitle title="Monthly savings" onBack={onBack} />

        <View style={styles.body}>
          <BunnySays size={44} text={bunny} />

          <View>
            <TornPaper style={styles.torn}>
              <View style={styles.paper}>
                <Text style={styles.label}>I want to save each month</Text>
                <View style={styles.inputRow}>
                  <Text style={styles.sym}>{profile.currency.sym}</Text>
                  <TextInput
                    value={draft}
                    onChangeText={t => {
                      const digits = t.replace(/\D/g, '').slice(0, 9);
                      setDraft(digits ? formatAmount(+digits) : '');
                      setError(null);
                    }}
                    placeholder="0"
                    placeholderTextColor={textColors.subtitle}
                    keyboardType="number-pad"
                    accessibilityLabel="Amount to save each month"
                    style={styles.input}
                  />
                </View>
                {income > 0 && (
                  <View style={styles.chips}>
                    {SAVE_SHARES.map(share => {
                      const amount = roundDown(income * share);
                      const on = amount === goal;
                      return (
                        <Pressable
                          key={share}
                          onPress={() => setDraft(formatAmount(amount))}
                          accessibilityLabel={`Save ${Math.round(share * 100)}% of my income`}
                          style={[styles.chip, on && styles.chipOn]}>
                          <Text style={[styles.chipText, on && styles.chipTextOn]}>
                            {Math.round(share * 100)}%
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>
            </TornPaper>
            <Tape width={88} style={styles.tape} />
            <Sticker kind="daisy" size={50} rotate={14} style={styles.daisy} />
          </View>

          {income > 0 && (
            <GlassCard>
              <View style={styles.plan}>
                <Line label="Income" value={money(income)} />
                <Line label="You save" value={`− ${money(Math.min(goal, income))}`} />
                <View style={styles.rule} />
                <Line label="You can spend" value={money(allowance)} strong />
                <Text style={[styles.note, spent > allowance && styles.bad]}>
                  {tooMuch
                    ? `That's more than your income.`
                    : spent > allowance
                    ? `You've already spent ${money(spent)} this month, ${money(spent - allowance)} over this.`
                    : `${money(allowance - spent)} left this month after the ${money(spent)} you've spent.`}
                </Text>
              </View>
            </GlassCard>
          )}

          {error && <Text style={styles.error}>{error}</Text>}
        </View>

        <PrimaryButton label="Save my goal" onPress={save} />
      </KeyboardScreen>
    </View>
  );
}

function Line({label, value, strong}: {label: string; value: string; strong?: boolean}) {
  return (
    <View style={styles.line}>
      <Text style={[styles.lineLabel, strong && styles.strong]}>{label}</Text>
      <Text style={[styles.lineValue, strong && styles.strong]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: colors.background},
  content: {
    paddingHorizontal: spacing.screenX,
    paddingTop: 12,
    paddingBottom: spacing.screenBottom,
  },
  body: {flex: 1, paddingTop: 18, paddingBottom: 20, gap: 14},
  torn: {marginHorizontal: -4, minHeight: 150},
  paper: {paddingHorizontal: 22, paddingTop: 22, paddingBottom: 18},
  label: {color: textColors.subtitle, fontFamily: fonts.extraBold, fontSize: 11, letterSpacing: 0.7, textTransform: 'uppercase'},
  inputRow: {
    marginTop: 8,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.tan,
    backgroundColor: '#FFFDF8',
  },
  sym: {color: textColors.subtitle, fontFamily: fonts.bold, fontSize: 16},
  input: {flex: 1, paddingVertical: 0, color: colors.text, fontFamily: fonts.serifBold, fontSize: 26},
  chips: {marginTop: 12, flexDirection: 'row', gap: 8},
  chip: {
    paddingHorizontal: 14,
    height: 34,
    justifyContent: 'center',
    borderRadius: 17,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.orange,
  },
  chipOn: {borderStyle: 'solid', backgroundColor: colors.orange},
  chipText: {color: colors.accentText, fontFamily: fonts.handBold, fontSize: 18},
  chipTextOn: {color: colors.onAccent},
  tape: {left: 130, top: -8, transform: [{rotate: '-4deg'}]},
  daisy: {right: -10, top: -20},
  plan: {paddingHorizontal: 18, paddingVertical: 14, gap: 8},
  line: {flexDirection: 'row', justifyContent: 'space-between'},
  lineLabel: {color: colors.textSoft, fontFamily: fonts.semiBold, fontSize: 14},
  lineValue: {color: colors.text, fontFamily: fonts.bold, fontSize: 14},
  strong: {color: colors.text, fontFamily: fonts.serifBold, fontSize: 18},
  rule: {height: 1, backgroundColor: colors.tan},
  note: {color: '#4F5A3A', fontFamily: fonts.hand, fontSize: 18},
  bad: {color: '#9A3524'},
  error: {marginHorizontal: 4, color: '#9A3524', fontFamily: fonts.semiBold, fontSize: 12.5},
});
