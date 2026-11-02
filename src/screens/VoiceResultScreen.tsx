import React, {useState} from 'react';
import {Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Svg, {Path} from 'react-native-svg';
import Blobs from '../components/Blobs';
import BunnySays from '../components/BunnySays';
import GlassCard from '../components/GlassCard';
import {MicIcon} from '../components/MicButton';
import PrimaryButton from '../components/PrimaryButton';
import {BackTitle} from './ScanScreen';
import {CATEGORIES, CategoryKey, categoryInfo} from '../categories';
import {NewExpense, useMoney} from '../store';
import {ParsedExpense, formatAmount, parseAmount} from '../voiceParse';
import {colors, fonts, spacing, textColors} from '../theme';

type Props = {
  transcript: string;
  items: ParsedExpense[];
  onBack?: () => void;
  onSayAgain?: () => void;
  onAdd?: (items: NewExpense[]) => void;
};

type Draft = {amount: string; category: CategoryKey; note: string};

const nextCategory = (c: CategoryKey) =>
  CATEGORIES[(CATEGORIES.findIndex(x => x.key === c) + 1) % CATEGORIES.length].key;

// Figma: 13 Voice result. Fields are editable; tap the category chip to cycle it.
export default function VoiceResultScreen({transcript, items, onBack, onSayAgain, onAdd}: Props) {
  const money = useMoney();
  const [drafts, setDrafts] = useState<Draft[]>(() =>
    items.map(i => ({amount: formatAmount(i.amount), category: i.category, note: i.note})),
  );
  const patch = (i: number, p: Partial<Draft>) =>
    setDrafts(ds => ds.map((d, j) => (j === i ? {...d, ...p} : d)));

  const valid = drafts.map(d => ({...d, value: parseAmount(d.amount) ?? 0}));
  const good = valid.filter(d => d.value > 0);

  const totals = good.reduce<Partial<Record<CategoryKey, number>>>((acc, d) => {
    acc[d.category] = (acc[d.category] ?? 0) + d.value;
    return acc;
  }, {});

  const count = good.length;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <Blobs />
      <SafeAreaView style={styles.content}>
        <View style={styles.topRow}>
          <BackTitle title={count ? 'Got it!' : 'Hmm…'} onBack={onBack} />
          <Pressable onPress={onSayAgain} accessibilityLabel="Say again">
            <GlassCard radius={19} contentStyle={styles.again}>
              <MicIcon size={14} color="#8F4A30" />
              <Text style={styles.againText}>Say again</Text>
            </GlassCard>
          </Pressable>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <BunnySays
            size={49}
            text={
              drafts.length
                ? `I found ${drafts.length} expense${drafts.length === 1 ? '' : 's'} and filled ${
                    drafts.length === 1 ? 'it' : 'them'
                  } in for you.`
                : "I couldn't find an amount in that. Try saying something like “450 on lunch”."
            }
          />

          <GlassCard>
            <View style={styles.quote}>
              <MicIcon size={16} color="#8F4A30" />
              <Text style={styles.quoteText}>“{transcript}”</Text>
            </View>
          </GlassCard>

          {drafts.length > 0 && (
            <Text style={styles.ai}>Filled in by AI. Tap any field to change it.</Text>
          )}

          {drafts.map((d, i) => {
            const info = categoryInfo(d.category);
            return (
              <GlassCard key={i}>
                <View style={styles.exp}>
                  <Field label="AMOUNT">
                    <TextInput
                      value={d.amount}
                      onChangeText={t => patch(i, {amount: t})}
                      keyboardType="number-pad"
                      style={styles.input}
                    />
                  </Field>
                  <Field label="CATEGORY">
                    <Pressable
                      onPress={() => patch(i, {category: nextCategory(d.category)})}
                      accessibilityLabel={`Category ${info.key}, tap to change`}
                      style={[styles.input, styles.select]}>
                      <View style={[styles.tag, {backgroundColor: info.bg}]}>
                        <Text style={[styles.tagText, {color: info.fg}]}>{info.key}</Text>
                      </View>
                      <Svg width={12} height={12} viewBox="0 0 24 24">
                        <Path
                          d="M6 9l6 6 6-6"
                          stroke={textColors.subtitle}
                          strokeWidth={2.6}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          fill="none"
                        />
                      </Svg>
                    </Pressable>
                  </Field>
                  <Field label="NOTE">
                    <TextInput
                      value={d.note}
                      onChangeText={t => patch(i, {note: t})}
                      style={styles.input}
                    />
                  </Field>
                  <Field label="DATE">
                    <View style={[styles.input, styles.fixed]}>
                      <Text style={styles.fixedText}>Today</Text>
                    </View>
                  </Field>
                </View>
              </GlassCard>
            );
          })}

          {count > 0 && (
            <View style={styles.info}>
              <View style={styles.check}>
                <Svg width={12} height={12} viewBox="0 0 24 24">
                  <Path
                    d="M5 12.5l4.5 4.5L19 7.5"
                    stroke={colors.white}
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </Svg>
              </View>
              <Text style={styles.infoText}>
                {(Object.keys(totals) as CategoryKey[])
                  .map(c => `${c} +${money(totals[c]!)}`)
                  .join(' · ')}
              </Text>
            </View>
          )}
        </ScrollView>

        {count > 0 ? (
          <PrimaryButton
            label={`Add ${count} expense${count === 1 ? '' : 's'}`}
            onPress={() =>
              onAdd?.(
                good.map(d => ({
                  category: d.category,
                  amount: d.value,
                  note: d.note.trim() || 'Expense',
                  rawTranscript: transcript,
                })),
              )
            }
          />
        ) : (
          <PrimaryButton label="Try again" onPress={onSayAgain} />
        )}
      </SafeAreaView>
    </View>
  );
}

function Field({label, children}: {label: string; children: React.ReactNode}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: colors.background},
  flex: {flex: 1},
  content: {
    flex: 1,
    paddingHorizontal: spacing.screenX,
    paddingTop: 12,
    paddingBottom: spacing.screenBottom,
  },
  topRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  again: {height: 35, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14},
  againText: {color: '#8F4A30', fontFamily: fonts.extraBold, fontSize: 12.5},
  scroll: {paddingTop: 18, paddingBottom: 16, gap: 14},
  quote: {flexDirection: 'row', gap: 10, padding: 14, alignItems: 'flex-start'},
  quoteText: {
    flex: 1,
    color: '#5B4232',
    fontFamily: fonts.semiBold,
    fontSize: 13,
    lineHeight: 19,
    fontStyle: 'italic',
  },
  ai: {marginLeft: 4, color: textColors.subtitle, fontFamily: fonts.extraBold, fontSize: 11.5},
  exp: {padding: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 10},
  field: {width: '48%', flexGrow: 1, gap: 4},
  fieldLabel: {
    color: textColors.subtitle,
    fontFamily: fonts.extraBold,
    fontSize: 10.5,
    letterSpacing: 0.3,
  },
  input: {
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D9BE96',
    backgroundColor: '#FFFDF8',
    paddingHorizontal: 12,
    paddingVertical: 0,
    color: colors.text,
    fontFamily: fonts.extraBold,
    fontSize: 14,
  },
  select: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  fixed: {justifyContent: 'center'},
  fixedText: {color: colors.text, fontFamily: fonts.extraBold, fontSize: 14},
  tag: {paddingHorizontal: 10, paddingVertical: 3, borderRadius: 9},
  tagText: {fontFamily: fonts.extraBold, fontSize: 11},
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: colors.glassBorder,
    backgroundColor: '#E8EBDD',
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6F7A55',
  },
  infoText: {flex: 1, color: '#3F4A2C', fontFamily: fonts.extraBold, fontSize: 12},
});
