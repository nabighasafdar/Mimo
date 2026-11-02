import React, {useState} from 'react';
import {Alert, Pressable, StatusBar, StyleSheet, Text, TextInput, View} from 'react-native';
import Svg, {Path} from 'react-native-svg';
import Blobs from '../components/Blobs';
import GlassCard from '../components/GlassCard';
import KeyboardScreen from '../components/KeyboardScreen';
import PrimaryButton from '../components/PrimaryButton';
import SecondaryButton from '../components/SecondaryButton';
import {BackTitle} from './ScanScreen';
import {MAX_AMOUNT, toAmount} from '../budget';
import {CATEGORIES, CategoryKey} from '../categories';
import {Expense, NewExpense} from '../store';
import {colors, fonts, spacing, textColors} from '../theme';

type Props = {
  /** The saved expense to change. Without one, this adds a new expense. */
  expense?: Expense;
  today: Date;
  onBack?: () => void;
  onSave?: (expense: NewExpense & {date: string}) => void;
  onDelete?: () => void;
};

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

const dayLabel = (d: Date, today: Date) =>
  startOfDay(d) === startOfDay(today)
    ? 'Today'
    : d.toLocaleDateString('en-GB', {day: 'numeric', month: 'short', year: 'numeric'});

// Typing an expense, or changing one already saved. Reached from "Type it instead" on Home, and
// by tapping any item on Home or Stats.
export default function ExpenseScreen({expense, today, onBack, onSave, onDelete}: Props) {
  const [amount, setAmount] = useState(expense ? String(expense.amount) : '');
  const [note, setNote] = useState(expense?.note ?? '');
  const [category, setCategory] = useState<CategoryKey>(expense?.category ?? 'Food');
  const [date, setDate] = useState(() => (expense ? new Date(expense.date) : today));
  const [error, setError] = useState<string | null>(null);

  const isToday = startOfDay(date) >= startOfDay(today);
  const moveDay = (by: number) =>
    setDate(d => new Date(d.getFullYear(), d.getMonth(), d.getDate() + by, d.getHours(), d.getMinutes()));

  const save = () => {
    const value = toAmount(amount);
    if (value <= 0) {
      setError('Enter how much you spent.');
    } else if (value >= MAX_AMOUNT) {
      setError("That amount is too big. Check it and try again.");
    } else {
      onSave?.({
        amount: value,
        category,
        note: note.trim() || 'Expense',
        date: date.toISOString(),
      });
    }
  };

  const confirmDelete = () =>
    Alert.alert('Delete this item?', expense?.note, [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Delete', style: 'destructive', onPress: onDelete},
    ]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <Blobs />
      <KeyboardScreen style={styles.content}>
        <BackTitle title={expense ? 'Edit expense' : 'Add expense'} onBack={onBack} />

        <View style={styles.fields}>
          <GlassCard>
            <View style={styles.card}>
              <Text style={styles.label}>AMOUNT</Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={textColors.subtitle}
                accessibilityLabel="Amount"
                style={styles.input}
              />
              <Text style={styles.label}>WHAT WAS IT FOR?</Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="Lunch, rickshaw, phone bill…"
                placeholderTextColor={textColors.subtitle}
                accessibilityLabel="What it was for"
                maxLength={120}
                style={styles.input}
              />
              <Text style={styles.label}>CATEGORY</Text>
              <View style={styles.chips}>
                {CATEGORIES.map(c => (
                  <Pressable
                    key={c.key}
                    onPress={() => setCategory(c.key)}
                    accessibilityRole="radio"
                    accessibilityState={{selected: category === c.key}}
                    style={[styles.chip, {backgroundColor: c.bg}, category === c.key && styles.chipOn]}>
                    <Text style={[styles.chipText, {color: c.fg}]}>{c.key}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.label}>DATE</Text>
              <View style={styles.dateRow}>
                <DayButton dir="left" onPress={() => moveDay(-1)} />
                <Text style={styles.date}>{dayLabel(date, today)}</Text>
                <DayButton dir="right" disabled={isToday} onPress={() => moveDay(1)} />
              </View>
            </View>
          </GlassCard>
          {error && <Text style={styles.error}>{error}</Text>}
        </View>

        <View style={styles.actions}>
          <PrimaryButton label={expense ? 'Save changes' : 'Add expense'} onPress={save} />
          {expense && <SecondaryButton label="Delete" onPress={confirmDelete} />}
        </View>
      </KeyboardScreen>
    </View>
  );
}

function DayButton({
  dir,
  disabled,
  onPress,
}: {
  dir: 'left' | 'right';
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      accessibilityLabel={dir === 'left' ? 'Previous day' : 'Next day'}
      accessibilityState={{disabled}}
      style={[styles.dayButton, disabled && styles.dayButtonOff]}>
      <Svg width={14} height={14} viewBox="0 0 24 24">
        <Path
          d={dir === 'left' ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'}
          stroke={colors.text}
          strokeWidth={2.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: colors.background},
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.screenX,
    paddingTop: 12,
    paddingBottom: spacing.screenBottom,
  },
  fields: {flex: 1, marginTop: 20, gap: 10},
  card: {padding: 18, gap: 8},
  label: {
    marginTop: 6,
    color: textColors.subtitle,
    fontFamily: fonts.extraBold,
    fontSize: 11,
    letterSpacing: 0.7,
  },
  input: {
    height: 46,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    backgroundColor: colors.input,
    color: colors.text,
    fontFamily: fonts.bold,
    fontSize: 15,
  },
  chips: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  chipOn: {borderColor: colors.orange},
  chipText: {fontFamily: fonts.extraBold, fontSize: 13},
  dateRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  date: {color: colors.text, fontFamily: fonts.extraBold, fontSize: 15},
  dayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    backgroundColor: colors.input,
  },
  dayButtonOff: {opacity: 0.45},
  error: {marginHorizontal: 4, color: '#9A3524', fontFamily: fonts.semiBold, fontSize: 12.5},
  actions: {marginTop: 20, gap: 14},
});
