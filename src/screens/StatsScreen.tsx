import React, {useMemo, useState} from 'react';
import {ImageBackground, Pressable, ScrollView, StatusBar, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Deco} from '../components/Scrapbook';
import {art} from '../art';
import Svg, {Circle, Path} from 'react-native-svg';
import Blobs from '../components/Blobs';
import BottomNav from '../components/BottomNav';
import BunnySays from '../components/BunnySays';
import GlassCard from '../components/GlassCard';
import Gradient from '../components/Gradient';
import {budgetStatus, monthName, monthShort, monthStart, monthYear, sameMonth} from '../budget';
import {CATEGORIES, CategoryKey} from '../categories';
import {useMoney, useStore} from '../store';
import {formatAmount} from '../voiceParse';
import {colors, fonts, spacing, textColors} from '../theme';

type Range = 'Week' | 'Month' | 'Year';
const RANGES: Range[] = ['Week', 'Month', 'Year'];

const R = 58;
const C = 2 * Math.PI * R;
const GAP = 3;
const CHART_HEIGHT = 80;

const DAY = 24 * 60 * 60 * 1000;
const sumOf = (xs: {amount: number}[]) => xs.reduce((s, x) => s + x.amount, 0);

// Figma: 09 Stats. Everything is computed from the user's expenses for the chosen month.
export default function StatsScreen() {
  const {expenses, budget, savingsGoal, today, prefs} = useStore();
  const money = useMoney();
  const [range, setRange] = useState<Range>('Month');
  const [offset, setOffset] = useState(0); // 0 = this month, -1 = last month, ...

  const month = useMemo(() => monthStart(offset, today), [offset, today]);
  const isCurrent = offset === 0;
  // Earliest month with data, so the back arrow stops there.
  const earliest = useMemo(() => {
    const first = expenses.reduce<string | null>(
      (min, e) => (min === null || e.date < min ? e.date : min),
      null,
    );
    if (!first) {
      return 0;
    }
    const d = new Date(first);
    return (d.getFullYear() - today.getFullYear()) * 12 + d.getMonth() - today.getMonth();
  }, [expenses, today]);

  const inMonth = useMemo(() => expenses.filter(e => sameMonth(e.date, month)), [expenses, month]);
  const byCategory = useMemo(() => {
    const out = Object.fromEntries(CATEGORIES.map(c => [c.key, 0])) as Record<CategoryKey, number>;
    inMonth.forEach(e => {
      out[e.category] += e.amount;
    });
    return out;
  }, [inMonth]);
  const monthTotal = sumOf(inMonth);

  const slices = useMemo(() => {
    let cum = 0;
    return [...CATEGORIES]
      .sort((a, b) => byCategory[b.key] - byCategory[a.key])
      .map(c => {
        const frac = monthTotal > 0 ? byCategory[c.key] / monthTotal : 0;
        const slice = {...c, pct: Math.round(frac * 100), len: Math.max(0, frac * C - GAP), offset: -cum * C};
        cum += frac;
        return slice;
      });
  }, [byCategory, monthTotal]);

  const bars = useMemo(() => {
    if (range === 'Week') {
      // The last 7 days of the chosen month (up to today for the current month).
      const end = isCurrent ? today : new Date(month.getFullYear(), month.getMonth() + 1, 0);
      const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
      const data = Array.from({length: 7}, (_, i) => {
        const day = new Date(endDay.getTime() - (6 - i) * DAY);
        const next = day.getTime() + DAY;
        return {
          label: day.toLocaleDateString('en-GB', {weekday: 'short'}),
          value: sumOf(
            expenses.filter(e => {
              const t = new Date(e.date).getTime();
              return t >= day.getTime() && t < next;
            }),
          ),
        };
      });
      return {title: 'Spending by day', data};
    }
    if (range === 'Year') {
      const data = Array.from({length: 6}, (_, i) => {
        const m = monthStart(offset - 5 + i);
        return {label: monthShort(m), value: sumOf(expenses.filter(e => sameMonth(e.date, m)))};
      });
      return {title: 'Spending by month', data};
    }
    // Weeks of the month: days 1-7, 8-14, 15-21, 22-28, then 29 to the end.
    const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const data = Array.from({length: Math.ceil(days / 7)}, (_, i) => ({
      label: `wk ${i + 1}`,
      value: sumOf(inMonth.filter(e => Math.floor((new Date(e.date).getDate() - 1) / 7) === i)),
    }));
    return {title: 'Spending by week', data};
  }, [range, expenses, inMonth, month, offset, isCurrent, today]);

  const avg = Math.round(bars.data.reduce((s, b) => s + b.value, 0) / bars.data.length);
  const max = Math.max(1, ...bars.data.map(b => b.value));

  // Mimo's tip: spending that ate into (or nearly into) the savings goal first, else the
  // biggest spend.
  const tip = useMemo(() => {
    const when = isCurrent ? 'this month' : `in ${monthName(month)}`;
    if (monthTotal === 0) {
      return `No spending logged ${when} yet.`;
    }
    const status = budgetStatus(monthTotal, budget);
    if (savingsGoal > 0 && status.level === 'over') {
      return `You spent ${money(monthTotal - budget)} more than planned ${when}, so it came out of your ${money(savingsGoal)} savings.`;
    }
    if (savingsGoal > 0 && status.level === 'warn') {
      return `You've used ${status.pct}% of your spending money ${when}. Go easy to keep your ${money(savingsGoal)} savings safe!`;
    }
    const top = slices[0];
    const weeklyLimit = Math.max(100, Math.floor(byCategory[top.key] / 4 / 100) * 100);
    return `${top.label} is your biggest spend ${when}. Want to try a weekly limit of ${money(weeklyLimit)}?`;
  }, [isCurrent, month, monthTotal, byCategory, budget, savingsGoal, slices, money]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <Blobs />
      <SafeAreaView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Your stats</Text>
          <View style={styles.monthNav}>
            <Chevron
              dir="left"
              disabled={offset <= earliest}
              onPress={() => setOffset(o => o - 1)}
            />
            <Text style={styles.monthLabel}>{monthYear(month)}</Text>
            <Chevron dir="right" disabled={isCurrent} onPress={() => setOffset(o => o + 1)} />
          </View>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}>
          <GlassCard radius={23}>
            <View style={styles.tabs}>
              {RANGES.map(r => (
                <Pressable key={r} onPress={() => setRange(r)} style={styles.tabWrap}>
                  <View style={[styles.tab, range === r && styles.tabOn]}>
                    {range === r && (
                      <Gradient
                        id="tabFill"
                        stops={[
                          {offset: 0, color: '#9E5539'},
                          {offset: 1, color: '#9E5539'},
                        ]}
                      />
                    )}
                    <Text style={[styles.tabText, range === r && styles.tabTextOn]}>{r}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </GlassCard>

          <ImageBackground
            source={art.parchment}
            resizeMode="stretch"
            style={styles.parch}>
            <View>
              <Text style={styles.cardTitle}>Where your money went</Text>
              <View style={styles.donutRow}>
                <View style={styles.donut}>
                  <Svg width={134} height={134} viewBox="0 0 150 150" style={styles.donutSvg}>
                    <Circle cx={75} cy={75} r={R} fill="none" stroke="rgba(122,78,40,0.12)" strokeWidth={18} />
                    {slices.map(s => (
                      <Circle
                        key={s.key}
                        cx={75}
                        cy={75}
                        r={R}
                        fill="none"
                        stroke={s.bar}
                        strokeWidth={18}
                        strokeDasharray={`${s.len} ${C}`}
                        strokeDashoffset={s.offset}
                      />
                    ))}
                  </Svg>
                  <View style={styles.donutCenter}>
                    <Text style={styles.donutLabel}>spent</Text>
                    <Text style={styles.donutValue}>{money(monthTotal)}</Text>
                  </View>
                </View>
                <View style={styles.legend}>
                  {slices.map(s => (
                    <View key={s.key} style={styles.lg}>
                      <View style={[styles.dot, {backgroundColor: s.bar}]} />
                      <Text style={styles.lgName} numberOfLines={1}>{s.key}</Text>
                      <Text style={styles.lgValue}>{s.pct}%</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </ImageBackground>

          <View>
          <Deco source={art.statsTop} rotate={-16} style={{left: -20, top: -30, width: 44, height: 58, zIndex: 2}} />
          <GlassCard>
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.cardTitle}>{bars.title}</Text>
                <Text style={styles.avg}>avg {money(avg)}</Text>
              </View>
              <View style={styles.bars}>
                {bars.data.map(b => {
                  const isMax = b.value === max;
                  return (
                    <View key={b.label} style={styles.bcol}>
                      <Text style={[styles.bval, isMax && {color: '#8F4A30'}]}>{formatAmount(b.value)}</Text>
                      <View style={[styles.bar, {height: Math.max(8, (b.value / max) * CHART_HEIGHT)}]}>
                        {isMax && (
                          <Gradient
                            id="barFill"
                            stops={[
                              {offset: 0, color: '#9E5539'},
                              {offset: 1, color: '#9E5539'},
                            ]}
                          />
                        )}
                        {!isMax && <View style={styles.barSoft} />}
                      </View>
                      <Text style={styles.blabel}>{b.label}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </GlassCard>
          <Deco source={art.statsSide} rotate={14} style={{right: -22, bottom: -48, width: 40, height: 88}} />
          </View>

          {prefs.tips && <BunnySays size={40} text={tip} />}
        </ScrollView>

        <View style={styles.nav}>
          <BottomNav active="Stats" />
        </View>
      </SafeAreaView>
    </View>
  );
}

function Chevron({
  dir,
  disabled,
  onPress,
}: {
  dir: 'left' | 'right';
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      accessibilityLabel={dir === 'left' ? 'Previous month' : 'Next month'}
      accessibilityState={{disabled}}
      style={disabled && styles.chevron}>
      <GlassCard radius={17} style={styles.ib} contentStyle={styles.ibContent}>
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
      </GlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: colors.background},
  flex: {flex: 1},
  content: {flex: 1},
  header: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, paddingHorizontal: spacing.screenX},
  title: {color: colors.text, fontFamily: fonts.serif, fontSize: 30},
  monthNav: {flexDirection: 'row', alignItems: 'center', gap: 6},
  monthLabel: {minWidth: 76, textAlign: 'center', color: colors.accentText, fontFamily: fonts.handBold, fontSize: 19},
  chevron: {opacity: 0.45},
  ib: {width: 34, height: 34},
  ibContent: {width: 31, height: 31, alignItems: 'center', justifyContent: 'center'},
  scroll: {paddingTop: 18, paddingBottom: 56, paddingHorizontal: spacing.screenX, gap: 16},
  tabs: {height: 43, flexDirection: 'row', padding: 4, gap: 4},
  tabWrap: {flex: 1},
  tab: {flex: 1, borderRadius: 18, overflow: 'hidden', alignItems: 'center', justifyContent: 'center'},
  tabOn: {backgroundColor: colors.orange, borderBottomWidth: 2, borderBottomColor: colors.accentShadow},
  tabText: {color: textColors.subtitle, fontFamily: fonts.extraBold, fontSize: 13},
  tabTextOn: {color: colors.onAccent},
  card: {padding: 18},
  cardHead: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline'},
  cardTitle: {color: colors.text, fontFamily: fonts.serif, fontSize: 17},
  avg: {color: textColors.subtitle, fontFamily: fonts.hand, fontSize: 18},
  donutRow: {marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 14},
  donut: {width: 134, height: 134},
  donutSvg: {transform: [{rotate: '-90deg'}]},
  donutCenter: {...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center'},
  donutLabel: {color: colors.textSoft, fontFamily: fonts.hand, fontSize: 18},
  donutValue: {color: colors.text, fontFamily: fonts.serifBold, fontSize: 18},
  legend: {flex: 1, gap: 13},
  lg: {flexDirection: 'row', alignItems: 'center', gap: 8},
  dot: {width: 10, height: 10, borderRadius: 5},
  lgName: {flex: 1, color: colors.text, fontFamily: fonts.bold, fontSize: 13},
  lgValue: {color: colors.text, fontFamily: fonts.black, fontSize: 13},
  parch: {marginHorizontal: -16, height: 262, paddingTop: 40, paddingLeft: 36, paddingRight: 36},
  nav: {paddingBottom: 12, paddingHorizontal: spacing.screenX},
  bars: {marginTop: 12, borderBottomWidth: 1.5, borderBottomColor: colors.tan, flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 124},
  bcol: {flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 6},
  bval: {color: colors.textSoft, fontFamily: fonts.black, fontSize: 10.5},
  bar: {width: 30, maxWidth: '100%', borderTopLeftRadius: 10, borderTopRightRadius: 10, borderBottomLeftRadius: 4, borderBottomRightRadius: 4, overflow: 'hidden', backgroundColor: colors.orange},
  barSoft: {...StyleSheet.absoluteFill, backgroundColor: '#DCC2A0'},
  blabel: {color: colors.textSoft, fontFamily: fonts.hand, fontSize: 17},
});
