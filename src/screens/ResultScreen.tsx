import React, {useState} from 'react';
import {Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Svg, {Path} from 'react-native-svg';
import Blobs from '../components/Blobs';
import BunnySays from '../components/BunnySays';
import GlassCard from '../components/GlassCard';
import PrimaryButton from '../components/PrimaryButton';
import SecondaryButton from '../components/SecondaryButton';
import {BackTitle} from './ScanScreen';
import {CATEGORIES, CategoryKey, categoryInfo} from '../categories';
import {Receipt} from '../receipt';
import {NewExpense, useMoney, useStore} from '../store';
import {colors, fonts, spacing, textColors} from '../theme';

type Props = {receipt: Receipt; onBack?: () => void; onAdd?: (items: NewExpense[]) => void};

type Draft = {name: string; amount: string; category: CategoryKey};

// Receipt prices can have cents, so amounts are kept exact rather than rounded.
const toAmount = (text: string) => {
  const n = Number(text.replace(/,/g, '').trim());
  return Number.isFinite(n) && n > 0 ? n : 0;
};

const nextCategory = (c: CategoryKey) =>
  CATEGORIES[(CATEGORIES.findIndex(x => x.key === c) + 1) % CATEGORIES.length].key;

/** "2026-10-02" -> "2 Oct 2026"; anything unreadable is shown as-is. */
function formatDate(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString('en-GB', {day: 'numeric', month: 'short', year: 'numeric'});
}

// Figma: 08 AI result. Items come from the read-receipt Edge Function; tap a category to
// cycle it, or "Edit items" to fix names and prices and drop lines before adding.
export default function ResultScreen({receipt, onBack, onAdd}: Props) {
  const money = useMoney();
  const myCurrency = useStore().profile.currency.code;
  const [editing, setEditing] = useState(false);
  const [drafts, setDrafts] = useState<Draft[]>(() =>
    receipt.items.map(i => ({name: i.name, amount: String(i.amount), category: i.category})),
  );
  const patch = (i: number, p: Partial<Draft>) =>
    setDrafts(ds => ds.map((d, j) => (j === i ? {...d, ...p} : d)));
  const remove = (i: number) => setDrafts(ds => ds.filter((_, j) => j !== i));

  const good = drafts
    .map(d => ({...d, value: toAmount(d.amount)}))
    .filter(d => d.value > 0);
  const total = good.reduce((s, d) => s + d.value, 0);
  const totals = good.reduce<Partial<Record<CategoryKey, number>>>((acc, d) => {
    acc[d.category] = (acc[d.category] ?? 0) + d.value;
    return acc;
  }, {});
  const otherCurrency = receipt.currency && receipt.currency !== myCurrency;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <Blobs />
      <SafeAreaView style={styles.content}>
        <BackTitle title="Receipt scanned" onBack={onBack} />

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <BunnySays
            text={`All done! I found ${receipt.items.length} item${
              receipt.items.length === 1 ? '' : 's'
            } and sorted them into your budget.`}
            size={49}
          />

          <GlassCard>
            <View style={styles.card}>
              <View style={styles.between}>
                <Text style={styles.shop} numberOfLines={1}>
                  {receipt.merchant}
                </Text>
                <Text style={styles.sum}>{money(total)}</Text>
              </View>
              <View style={styles.between}>
                <Text style={styles.meta}>{receipt.date ? formatDate(receipt.date) : 'No date'}</Text>
                <Text style={styles.meta}>total</Text>
              </View>
              <View style={styles.hint}>
                <Svg width={12} height={12} viewBox="0 0 24 24">
                  <Path
                    d="M12 2l2.2 6.6L21 11l-6.8 2.4L12 20l-2.2-6.6L3 11l6.8-2.4z"
                    fill={colors.orange}
                  />
                </Svg>
                <Text style={styles.meta}>Sorted by AI. Tap a category to change it.</Text>
              </View>
              {drafts.map((d, i) => {
                const info = categoryInfo(d.category);
                return (
                  <View key={i} style={styles.row}>
                    {editing ? (
                      <TextInput
                        value={d.name}
                        onChangeText={t => patch(i, {name: t})}
                        style={[styles.itemName, styles.input]}
                      />
                    ) : (
                      <Text style={styles.itemName} numberOfLines={1}>
                        {d.name}
                      </Text>
                    )}
                    <Pressable
                      onPress={() => patch(i, {category: nextCategory(d.category)})}
                      accessibilityLabel={`Category ${info.key}, tap to change`}
                      hitSlop={6}
                      style={[styles.tag, {backgroundColor: info.bg}]}>
                      <Text style={[styles.tagText, {color: info.fg}]}>{info.key}</Text>
                    </Pressable>
                    {editing ? (
                      <>
                        <TextInput
                          value={d.amount}
                          onChangeText={t => patch(i, {amount: t})}
                          keyboardType="decimal-pad"
                          style={[styles.price, styles.input]}
                        />
                        <Pressable
                          onPress={() => remove(i)}
                          hitSlop={8}
                          accessibilityLabel={`Remove ${d.name}`}
                          style={styles.remove}>
                          <Svg width={14} height={14} viewBox="0 0 24 24">
                            <Path
                              d="M6 6l12 12M18 6L6 18"
                              stroke={textColors.subtitle}
                              strokeWidth={2.6}
                              strokeLinecap="round"
                            />
                          </Svg>
                        </Pressable>
                      </>
                    ) : (
                      <Text style={styles.price}>{money(toAmount(d.amount))}</Text>
                    )}
                  </View>
                );
              })}
            </View>
          </GlassCard>

          {otherCurrency && (
            <Text style={styles.warn}>
              This receipt looks like it is in {receipt.currency}, but your budget is in {myCurrency}.
              Amounts are added as they are, without conversion.
            </Text>
          )}

          {good.length > 0 && (
            <View style={styles.info}>
              <View style={styles.check}>
                <Svg width={14} height={14} viewBox="0 0 24 24">
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
                Your budget will update:{' '}
                {(Object.keys(totals) as CategoryKey[])
                  .map(c => `${c} +${money(totals[c]!)}`)
                  .join(', ')}
                .
              </Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.actions}>
          {good.length > 0 ? (
            <PrimaryButton
              label="Add to my budget"
              onPress={() =>
                onAdd?.(
                  good.map(d => ({
                    category: d.category,
                    amount: d.value,
                    note: d.name.trim() || receipt.merchant,
                  })),
                )
              }
            />
          ) : (
            <PrimaryButton label="Scan again" onPress={onBack} />
          )}
          <SecondaryButton
            label={editing ? 'Done editing' : 'Edit items'}
            onPress={() => setEditing(e => !e)}
          />
        </View>
      </SafeAreaView>
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
  scroll: {paddingTop: 20, paddingBottom: 16, gap: 18},
  card: {paddingHorizontal: 18, paddingTop: 18, paddingBottom: 8},
  between: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline'},
  shop: {flex: 1, marginRight: 10, color: colors.text, fontFamily: fonts.serifBold, fontSize: 17},
  sum: {color: '#8F4A30', fontFamily: fonts.serifBold, fontSize: 18},
  meta: {color: textColors.subtitle, fontFamily: fonts.bold, fontSize: 11},
  hint: {flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, marginBottom: 4},
  row: {flexDirection: 'row', alignItems: 'center', height: 41},
  itemName: {flex: 1, marginRight: 8, color: colors.text, fontFamily: fonts.bold, fontSize: 13},
  tag: {paddingHorizontal: 9, paddingVertical: 3, borderRadius: 9},
  tagText: {fontFamily: fonts.extraBold, fontSize: 9.5},
  price: {
    width: 72,
    textAlign: 'right',
    color: colors.text,
    fontFamily: fonts.extraBold,
    fontSize: 13,
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: colors.glassBorder,
    backgroundColor: '#E8EBDD',
  },
  check: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6F7A55',
  },
  infoText: {flex: 1, color: '#3F4A2C', fontFamily: fonts.extraBold, fontSize: 12, lineHeight: 17},
  input: {
    height: 32,
    marginRight: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D9BE96',
    backgroundColor: '#FFFDF8',
    paddingHorizontal: 8,
    paddingVertical: 0,
  },
  remove: {width: 22, alignItems: 'flex-end'},
  warn: {marginHorizontal: 4, color: '#8F4A30', fontFamily: fonts.hand, fontSize: 18, lineHeight: 21},
  actions: {gap: 14},
});
