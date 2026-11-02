import React, {useState} from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Svg, {Path} from 'react-native-svg';
import Blobs from '../components/Blobs';
import BottomNav from '../components/BottomNav';
import GlassCard from '../components/GlassCard';
import PrimaryButton from '../components/PrimaryButton';
import SecondaryButton from '../components/SecondaryButton';
import {Deco, Sticker, Tape, TornPaper} from '../components/Scrapbook';
import {art} from '../art';
import {monthYear} from '../budget';
import {formatAmount} from '../voiceParse';
import {Goal, useMoney, useStore} from '../store';
import {colors, fonts, spacing, textColors} from '../theme';

const DURATIONS: {months: number; label: string}[] = [
  {months: 1, label: '1 mo'},
  {months: 2, label: '2 mo'},
  {months: 3, label: '3 mo'},
  {months: 6, label: '6 mo'},
  {months: 12, label: '1 yr'},
];

const digits = (t: string) => parseInt(t.replace(/\D/g, ''), 10) || 0;

// A goal's `due` is the target month as "YYYY-MM"; older goals may hold free text.
function dueInfo(g: Goal) {
  const m = /^(\d{4})-(\d{2})$/.exec(g.due);
  if (!m) {
    return {by: g.due, monthsLeft: 0};
  }
  const by = new Date(+m[1], +m[2] - 1, 1);
  const now = new Date();
  const monthsLeft = Math.max(
    1,
    (by.getFullYear() - now.getFullYear()) * 12 + by.getMonth() - now.getMonth(),
  );
  return {by: monthYear(by), monthsLeft};
}

const monthsText = (n: number) => (n === 12 ? '1 year' : n === 1 ? '1 month' : `${n} months`);

// Design: 11 Bucket list. Add a wish with a price and a time frame; Mimo works out the monthly
// saving. Tick a wish when it's bought, add savings as they come in, long-press to remove.
export default function GoalsScreen() {
  const {goals, addGoal, updateGoal, deleteGoal, profile} = useStore();
  const money = useMoney();
  const [what, setWhat] = useState('');
  const [cost, setCost] = useState('');
  const [months, setMonths] = useState(3);
  const [saving, setSaving] = useState<Goal | null>(null);

  const price = digits(cost);
  const open = goals.filter(g => g.saved < g.target).length;

  const add = () => {
    if (!what.trim() || !price) {
      Alert.alert('Almost there', 'Tell me what you want and how much it costs.');
      return;
    }
    const by = new Date();
    by.setMonth(by.getMonth() + months);
    const due = `${by.getFullYear()}-${String(by.getMonth() + 1).padStart(2, '0')}`;
    addGoal({title: what.trim().slice(0, 80), target: price, saved: 0, due});
    setWhat('');
    setCost('');
  };

  const toggleDone = (g: Goal) => {
    if (g.saved < g.target) {
      updateGoal(g.id, {saved: g.target});
    } else {
      Alert.alert('Not bought yet?', `This puts ${g.title} back on your list with nothing saved.`, [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Put back', onPress: () => updateGoal(g.id, {saved: 0})},
      ]);
    }
  };

  const confirmDelete = (g: Goal) =>
    Alert.alert('Remove from your list?', g.title, [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Remove', style: 'destructive', onPress: () => deleteGoal(g.id)},
    ]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <Blobs />
      <SafeAreaView style={styles.content}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Text style={styles.title}>My bucket list</Text>
              <Text style={styles.subtitle}>things I'm saving up for</Text>
              <Deco source={art.bouquet} rotate={10} style={{right: -18, top: -6, width: 72, height: 104}} />
              <Sticker kind="butterfly" size={44} rotate={-12} style={{right: 60, top: 6}} />
            </View>

            <View style={styles.formWrap}>
              <TornPaper style={styles.form}>
                <Text style={styles.lbl}>I WANT TO…</Text>
                <TextInput
                  value={what}
                  onChangeText={setWhat}
                  placeholder="Buy a new phone, visit Hunza…"
                  placeholderTextColor="#9C8574"
                  maxLength={80}
                  accessibilityLabel="What do you want"
                  style={[styles.field, styles.mt6]}
                />
                <View style={styles.costRow}>
                  <Text style={styles.lbl}>IT COSTS</Text>
                  <View style={styles.costBox}>
                    <Text style={styles.sym}>{profile.currency.sym}</Text>
                    <TextInput
                      value={cost}
                      onChangeText={t => setCost(digits(t) ? formatAmount(digits(t)) : '')}
                      placeholder="25,000"
                      placeholderTextColor="#9C8574"
                      keyboardType="number-pad"
                      accessibilityLabel="How much it costs"
                      style={[styles.field, styles.costField]}
                    />
                  </View>
                </View>
                <Text style={[styles.lbl, styles.mt12]}>IN HOW LONG?</Text>
                <View style={styles.chips} accessibilityRole="radiogroup">
                  {DURATIONS.map(d => {
                    const on = d.months === months;
                    return (
                      <Pressable
                        key={d.months}
                        onPress={() => setMonths(d.months)}
                        accessibilityRole="radio"
                        accessibilityState={{checked: on}}
                        style={[styles.chip, on && styles.chipOn]}>
                        <Text style={[styles.chipText, on && styles.chipTextOn]}>{d.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
                <View style={styles.addRow}>
                  <Text style={styles.perMonth}>
                    {price ? `that's about ${money(price / months)} a month` : 'pick a price and a time'}
                  </Text>
                  <Pressable onPress={add} accessibilityRole="button" style={styles.addLedge}>
                    <View style={styles.addBtn}>
                      <Svg width={15} height={15} viewBox="0 0 24 24">
                        <Path d="M12 5v14M5 12h14" stroke={colors.onAccent} strokeWidth={2.6} strokeLinecap="round" />
                      </Svg>
                      <Text style={styles.addText}>Add to list</Text>
                    </View>
                  </Pressable>
                </View>
              </TornPaper>
              <Tape width={92} style={styles.tape} />
            </View>

            <View style={styles.listHead}>
              <Text style={styles.section}>On my list</Text>
              <Text style={styles.count}>
                {open} {open === 1 ? 'wish' : 'wishes'} to go
              </Text>
            </View>

            {goals.length === 0 && (
              <Text style={styles.empty}>Nothing here yet. Add your first wish above!</Text>
            )}

            <View style={styles.list}>
              {goals.map(g => {
                const done = g.saved >= g.target;
                const pct = Math.min(100, Math.round((g.saved / g.target) * 100));
                const {by, monthsLeft} = dueInfo(g);
                const left = Math.max(0, g.target - g.saved);
                return (
                  <Pressable
                    key={g.id}
                    onLongPress={() => confirmDelete(g)}
                    accessibilityHint="Long press to remove">
                    <GlassCard style={done && styles.doneCard} contentStyle={styles.wish}>
                      <Pressable
                        onPress={() => toggleDone(g)}
                        hitSlop={8}
                        accessibilityRole="checkbox"
                        accessibilityState={{checked: done}}
                        accessibilityLabel={`Mark ${g.title} bought`}
                        style={[styles.tick, done && styles.tickOn]}>
                        {done && (
                          <Svg width={14} height={14} viewBox="0 0 24 24">
                            <Path
                              d="M5 12.5l4.5 4.5L19 7.5"
                              stroke={colors.onAccent}
                              strokeWidth={3.2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              fill="none"
                            />
                          </Svg>
                        )}
                      </Pressable>
                      <View style={styles.between}>
                        <Text style={[styles.wishTitle, done && styles.struck]} numberOfLines={1}>
                          {g.title}
                        </Text>
                        <Text style={styles.wishCost}>{money(g.target)}</Text>
                      </View>
                      <Text style={styles.dur}>
                        {done
                          ? 'bought it!'
                          : monthsLeft
                          ? `in ${monthsText(monthsLeft)} · by ${by}`
                          : by}
                      </Text>
                      {!done && (
                        <>
                          <View style={styles.thread}>
                            <View style={styles.dashes}>
                              {Array.from({length: 36}, (_, i) => (
                                <View key={i} style={styles.dash} />
                              ))}
                            </View>
                            <View style={[styles.threadFill, {width: `${pct}%`}]} />
                          </View>
                          <View style={[styles.between, styles.mt6]}>
                            <Text style={styles.meta}>
                              {money(g.saved)} saved ({pct}%)
                            </Text>
                            {monthsLeft > 0 && (
                              <Text style={styles.meta}>{money(left / monthsLeft)} / month</Text>
                            )}
                          </View>
                          <Pressable onPress={() => setSaving(g)} hitSlop={6} style={styles.saveLink}>
                            <Text style={styles.saveLinkText}>+ add savings</Text>
                          </Pressable>
                        </>
                      )}
                      {done && (
                        <View style={styles.doneStamp}>
                          <Text style={styles.doneText}>done!</Text>
                        </View>
                      )}
                    </GlassCard>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        <View style={styles.nav}>
          <BottomNav active="Goals" />
        </View>
      </SafeAreaView>

      <AddSavingsModal
        goal={saving}
        onClose={() => setSaving(null)}
        onSave={amount => {
          if (saving) {
            updateGoal(saving.id, {saved: Math.min(saving.target, saving.saved + amount)});
          }
          setSaving(null);
        }}
      />
    </View>
  );
}

function AddSavingsModal({
  goal,
  onClose,
  onSave,
}: {
  goal: Goal | null;
  onClose: () => void;
  onSave: (amount: number) => void;
}) {
  const {profile} = useStore();
  const money = useMoney();
  const [amount, setAmount] = useState('');
  const value = digits(amount);

  return (
    <Modal visible={goal !== null} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Add savings</Text>
          {goal && (
            <Text style={styles.sheetSub}>
              {goal.title}: {money(goal.saved)} of {money(goal.target)} saved
            </Text>
          )}
          <View style={[styles.costBox, styles.mt12]}>
            <Text style={styles.sym}>{profile.currency.sym}</Text>
            <TextInput
              value={amount}
              onChangeText={t => setAmount(digits(t) ? formatAmount(digits(t)) : '')}
              placeholder="How much did you put aside?"
              placeholderTextColor="#9C8574"
              keyboardType="number-pad"
              autoFocus
              style={[styles.field, styles.costField]}
            />
          </View>
          <View style={styles.sheetActions}>
            <PrimaryButton
              label="Save"
              disabled={!value}
              onPress={() => {
                onSave(value);
                setAmount('');
              }}
            />
            <SecondaryButton label="Cancel" onPress={onClose} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: colors.background},
  flex: {flex: 1},
  content: {flex: 1},
  scroll: {paddingTop: 12, paddingBottom: 56, paddingHorizontal: spacing.screenX},
  mt6: {marginTop: 6},
  mt12: {marginTop: 12},
  header: {height: 82},
  title: {color: colors.text, fontFamily: fonts.serif, fontSize: 31, letterSpacing: -0.3},
  subtitle: {marginLeft: 2, color: textColors.subtitle, fontFamily: fonts.hand, fontSize: 21},
  formWrap: {marginTop: 8, marginHorizontal: -6},
  form: {paddingHorizontal: 20, paddingTop: 24, paddingBottom: 22},
  tape: {left: 140, top: -8, transform: [{rotate: '3deg'}]},
  lbl: {color: textColors.subtitle, fontFamily: fonts.extraBold, fontSize: 11, letterSpacing: 0.7},
  field: {
    height: 44,
    paddingHorizontal: 14,
    paddingVertical: 0,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.tan,
    backgroundColor: colors.card,
    color: colors.text,
    fontFamily: fonts.bold,
    fontSize: 15,
  },
  costRow: {marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 10},
  costBox: {flex: 1, justifyContent: 'center'},
  sym: {position: 'absolute', left: 14, zIndex: 1, color: colors.accentText, fontFamily: fonts.extraBold, fontSize: 14},
  costField: {paddingLeft: 40},
  chips: {marginTop: 6, flexDirection: 'row', gap: 6},
  chip: {
    flex: 1,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: colors.tan,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipOn: {
    backgroundColor: colors.orange,
    borderColor: colors.orange,
    borderBottomWidth: 3,
    borderBottomColor: colors.accentShadow,
  },
  chipText: {color: colors.textSoft, fontFamily: fonts.extraBold, fontSize: 12},
  chipTextOn: {color: colors.onAccent},
  addRow: {marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 10},
  perMonth: {flex: 1, color: colors.textSoft, fontFamily: fonts.hand, fontSize: 19, lineHeight: 21},
  addLedge: {borderRadius: 20, paddingBottom: 3, backgroundColor: colors.accentShadow},
  addBtn: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.orange,
  },
  addText: {color: colors.onAccent, fontFamily: fonts.extraBold, fontSize: 14},
  listHead: {
    marginTop: 18,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  section: {color: colors.text, fontFamily: fonts.serif, fontSize: 20},
  count: {color: textColors.subtitle, fontFamily: fonts.hand, fontSize: 19},
  empty: {marginHorizontal: 4, color: textColors.subtitle, fontFamily: fonts.hand, fontSize: 19},
  list: {gap: 12},
  doneCard: {opacity: 0.72},
  wish: {paddingTop: 14, paddingBottom: 13, paddingLeft: 54, paddingRight: 14},
  tick: {
    position: 'absolute',
    left: 14,
    top: 14,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#C9A97E',
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tickOn: {backgroundColor: '#8A9470', borderColor: '#8A9470'},
  between: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8},
  wishTitle: {flex: 1, color: colors.text, fontFamily: fonts.serif, fontSize: 16},
  struck: {textDecorationLine: 'line-through'},
  wishCost: {color: colors.text, fontFamily: fonts.black, fontSize: 14},
  dur: {marginTop: 1, color: colors.accentText, fontFamily: fonts.hand, fontSize: 18},
  thread: {marginTop: 9, height: 6, borderRadius: 3, overflow: 'hidden'},
  dashes: {...StyleSheet.absoluteFill, flexDirection: 'row', gap: 4},
  dash: {width: 6, height: 6, borderRadius: 2, backgroundColor: 'rgba(122,78,40,0.22)'},
  threadFill: {position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 3, backgroundColor: colors.orange},
  meta: {color: textColors.subtitle, fontFamily: fonts.bold, fontSize: 11.5},
  saveLink: {alignSelf: 'flex-start', marginTop: 6},
  saveLinkText: {color: colors.accentText, fontFamily: fonts.handBold, fontSize: 18},
  doneStamp: {
    position: 'absolute',
    right: 14,
    bottom: 10,
    paddingHorizontal: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#8A9470',
    borderRadius: 8,
    transform: [{rotate: '-6deg'}],
  },
  doneText: {color: '#4F5A3A', fontFamily: fonts.handBold, fontSize: 18},
  nav: {paddingBottom: 12, paddingHorizontal: spacing.screenX},
  backdrop: {flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(74,52,38,0.35)'},
  sheet: {
    padding: 24,
    paddingBottom: 32,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: colors.background,
  },
  sheetTitle: {color: colors.text, fontFamily: fonts.serif, fontSize: 24},
  sheetSub: {marginTop: 2, color: colors.textSoft, fontFamily: fonts.hand, fontSize: 19},
  sheetActions: {marginTop: 18, gap: 12},
});
