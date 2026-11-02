import React from 'react';
import {Alert, Image, Pressable, ScrollView, StatusBar, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Blobs from '../components/Blobs';
import BottomNav from '../components/BottomNav';
import Bunny from '../components/Bunny';
import GlassCard from '../components/GlassCard';
import {MicIcon} from '../components/MicButton';
import {Deco, Stamp, Sticker, Tape, TornPaper} from '../components/Scrapbook';
import {art} from '../art';
import {LEVEL_BAR, monthName, sameMonth} from '../budget';
import {useMoney, useStore} from '../store';
import {colors, fonts, spacing, textColors} from '../theme';

type Props = {
  onTellMimo?: () => void;
  onTypeExpense?: () => void;
  onEditExpense?: (id: string) => void;
  onEditSavings?: () => void;
};

const greeting = (now: Date) => {
  const h = now.getHours();
  return h < 12 ? 'Good morning,' : h < 17 ? 'Good afternoon,' : 'Good evening,';
};

// Design: 07 Home. This month's spending, item by item, against what the user can spend once
// their savings goal is set aside.
export default function HomeScreen({onTellMimo, onTypeExpense, onEditExpense, onEditSavings}: Props) {
  const {
    profile,
    budget,
    savingsGoal,
    spent,
    expenses,
    deleteExpense,
    pending,
    offline,
    today: now,
  } = useStore();
  const money = useMoney();
  const month = monthName(now);
  const over = budget > 0 && spent > budget;
  const usedPct = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;

  // This month's spending, oldest first, so new items land at the bottom above the total.
  const items = expenses
    .filter(e => sameMonth(e.date, now))
    .sort((a, b) => a.date.localeCompare(b.date));
  const confirmDelete = (id: string, note: string) =>
    Alert.alert('Delete this item?', note, [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Delete', style: 'destructive', onPress: () => deleteExpense(id)},
    ]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <Blobs />
      <SafeAreaView style={styles.content}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.flex}>
              <Text style={styles.hello}>{greeting(now)}</Text>
              <Text style={styles.name} numberOfLines={1}>
                {profile.name || 'there'}
              </Text>
            </View>
            <View style={styles.avatar}>
              <Bunny width={36} height={77} style={styles.avatarBunny} />
            </View>
          </View>

          {(pending > 0 || offline) && (
            <Text style={styles.offline} accessibilityLiveRegion="polite">
              {pending > 0
                ? `${pending} ${pending === 1 ? 'change' : 'changes'} on this phone. I'll save ${
                    pending === 1 ? 'it' : 'them'
                  } when you're back online.`
                : "You're offline. This is your last saved budget."}
            </Text>
          )}

          <View style={styles.heroWrap}>
            <View style={styles.burlapFrame}>
              <Image source={art.burlap} resizeMode="cover" style={styles.burlapImage} />
              <View style={styles.burlapStitch} pointerEvents="none" />
              <TornPaper rotate={0} style={styles.hero}>
              <Text style={styles.label}>
                {budget === 0
                  ? `SPENT IN ${month.toUpperCase()}`
                  : over
                  ? `OVERSPENT IN ${month.toUpperCase()} BY`
                  : `LEFT TO SPEND IN ${month.toUpperCase()}`}
              </Text>
              <Text style={styles.heroAmount} numberOfLines={1} adjustsFontSizeToFit>
                {money(budget === 0 ? spent : Math.abs(budget - spent))}
              </Text>
              <View style={styles.thread}>
                <Dashes />
                <View
                  style={[
                    styles.threadFill,
                    {width: `${usedPct}%`, backgroundColor: over ? LEVEL_BAR.over : colors.orange},
                  ]}
                />
              </View>
              <View style={styles.heroFoot}>
                <Text style={styles.heroFootText}>spent {money(spent)}</Text>
                {savingsGoal > 0 ? (
                  <Pressable onPress={onEditSavings} hitSlop={8} accessibilityLabel="Edit savings goal">
                    <Text style={[styles.heroFootText, styles.editable]}>
                      saving {money(savingsGoal)} ✎
                    </Text>
                  </Pressable>
                ) : (
                  <Text style={styles.heroFootText}>
                    {budget > 0 ? `income ${money(budget)}` : 'no income yet'}
                  </Text>
                )}
              </View>
              </TornPaper>
            </View>
            <Tape width={84} style={styles.tape} />
            <Sticker kind="coffee" size={70} rotate={10} style={styles.coffee} />
          </View>

          <Pressable onPress={onTellMimo} accessibilityLabel="Tell Mimo what you spent">
            <GlassCard radius={27} contentStyle={styles.voiceBar}>
              <Text style={styles.voiceText}>Tell Mimo what you spent…</Text>
              <View style={styles.voiceMic}>
                <MicIcon size={18} color={colors.onAccent} />
              </View>
            </GlassCard>
          </Pressable>
          <Pressable onPress={onTypeExpense} hitSlop={8} style={styles.typeIt}>
            <Text style={styles.typeItText}>or type it instead</Text>
          </Pressable>

          {savingsGoal === 0 && (
            <Pressable onPress={onEditSavings} accessibilityLabel="Set a monthly savings goal">
              <View style={styles.setup}>
                <View style={styles.flex}>
                  <Text style={styles.setupTitle}>How much do you want to save?</Text>
                  <Text style={styles.setupSub}>
                    Set a monthly goal and I'll warn you before spending eats into it.
                  </Text>
                </View>
                <Text style={styles.setupGo}>set up →</Text>
              </View>
            </Pressable>
          )}

          <View style={styles.sectionHead}>
            <Text style={styles.section}>Where your money went</Text>
            <Stamp label={month} />
          </View>

          <GlassCard contentStyle={styles.ledger}>
            <View style={[styles.lrow, styles.lhead]}>
              <Text style={[styles.th, styles.colNo]}>#</Text>
              <Text style={[styles.th, styles.colItem]}>ITEM</Text>
              <Text style={[styles.th, styles.colDate]}>DATE</Text>
              <Text style={[styles.th, styles.colSpent]}>SPENT</Text>
            </View>
            {items.length === 0 && (
              <View style={[styles.lrow, styles.lbody]}>
                <Text style={styles.empty}>Nothing yet. Tell Mimo what you spent.</Text>
              </View>
            )}
            {items.map((e, i) => (
              <Pressable
                key={e.id}
                onPress={() => onEditExpense?.(e.id)}
                onLongPress={() => confirmDelete(e.id, e.note)}
                accessibilityLabel={`${e.note}, ${money(e.amount)}, ${shortDate(e.date)}`}
                accessibilityHint="Tap to edit, long press to delete"
                style={({pressed}) => [styles.lrow, styles.lbody, pressed && styles.pressed]}>
                <DashLine />
                <Text style={[styles.td, styles.colNo]}>{i + 1}</Text>
                <Text style={[styles.itemName, styles.colItem]} numberOfLines={1}>
                  {e.note}
                </Text>
                <Text style={[styles.td, styles.colDate]}>{shortDate(e.date)}</Text>
                <Text style={[styles.amt, styles.colSpent]} numberOfLines={1}>
                  {money(e.amount)}
                </Text>
              </Pressable>
            ))}
            <View style={[styles.lrow, styles.lfoot]}>
              <Text style={[styles.total, styles.colItem]}>
                Total <Text style={styles.td}>· {items.length} {items.length === 1 ? 'item' : 'items'}</Text>
              </Text>
              <Text style={[styles.total, styles.colSpent]} numberOfLines={1}>
                {money(spent)}
              </Text>
            </View>
          </GlassCard>

        </ScrollView>

        <View style={styles.bouquets} pointerEvents="none">
          <Deco source={art.carrot} rotate={-16} style={{left: 2, bottom: 0, width: 48, height: 84}} />
          <Deco source={art.jar} rotate={14} style={{right: 16, bottom: 0, width: 58, height: 76}} />
        </View>
        <View style={styles.nav}>
          <BottomNav active="Home" />
        </View>
      </SafeAreaView>
    </View>
  );
}

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', {day: 'numeric', month: 'short'});

/** A dashed rule under a ledger row. */
function DashLine() {
  return (
    <View style={styles.dashLine} pointerEvents="none">
      {Array.from({length: 48}, (_, i) => (
        <View key={i} style={styles.ruleDash} />
      ))}
    </View>
  );
}

/** The dashed "thread" behind a progress fill. */
function Dashes() {
  return (
    <View style={styles.dashes}>
      {Array.from({length: 40}, (_, i) => (
        <View key={i} style={styles.dash} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: colors.background},
  flex: {flex: 1},
  content: {flex: 1},
  scroll: {paddingTop: 12, paddingBottom: 40, paddingHorizontal: spacing.screenX},
  header: {flexDirection: 'row', alignItems: 'center', gap: 12},
  hello: {color: textColors.subtitle, fontFamily: fonts.hand, fontSize: 23},
  name: {marginTop: -2, color: colors.text, fontFamily: fonts.serif, fontSize: 32},
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: colors.paper,
    borderWidth: 2,
    borderColor: colors.card,
  },
  avatarBunny: {position: 'absolute', left: 7, top: 4},
  heroWrap: {marginTop: 16, marginBottom: 18, marginHorizontal: -14, transform: [{rotate: '-1deg'}]},
  hero: {minHeight: 166, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16},
  label: {color: textColors.subtitle, fontFamily: fonts.extraBold, fontSize: 11, letterSpacing: 0.7},
  heroAmount: {
    marginTop: 2,
    color: colors.text,
    fontFamily: fonts.serifBold,
    fontSize: 40,
    letterSpacing: -0.5,
  },
  thread: {marginTop: 12, height: 8, borderRadius: 4, overflow: 'hidden'},
  threadFill: {position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 4},
  dashes: {...StyleSheet.absoluteFill, flexDirection: 'row', gap: 4},
  dash: {width: 7, height: 8, borderRadius: 2, backgroundColor: 'rgba(122,78,40,0.25)'},
  heroFoot: {marginTop: 6, flexDirection: 'row', justifyContent: 'space-between'},
  heroFootText: {color: colors.textSoft, fontFamily: fonts.hand, fontSize: 18},
  editable: {color: colors.accentText, textDecorationLine: 'underline'},
  tape: {left: 30, top: -8, transform: [{rotate: '-8deg'}]},
  coffee: {right: -4, top: -22},
  voiceBar: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 18,
    paddingRight: 6,
  },
  voiceText: {flex: 1, color: colors.textSoft, fontFamily: fonts.hand, fontSize: 20},
  typeIt: {marginTop: 8, alignSelf: 'center'},
  typeItText: {
    color: colors.accentText,
    fontFamily: fonts.handBold,
    fontSize: 19,
    textDecorationLine: 'underline',
  },
  offline: {marginTop: 10, color: colors.accentText, fontFamily: fonts.bold, fontSize: 12.5},
  voiceMic: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.orange,
    borderBottomWidth: 3,
    borderBottomColor: colors.accentShadow,
  },
  setup: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.orange,
    backgroundColor: 'rgba(251,246,236,0.7)',
  },
  setupTitle: {color: colors.text, fontFamily: fonts.serif, fontSize: 17},
  setupSub: {
    marginTop: 2,
    color: colors.textSoft,
    fontFamily: fonts.hand,
    fontSize: 18,
    lineHeight: 21,
  },
  setupGo: {color: colors.accentText, fontFamily: fonts.handBold, fontSize: 19},
  sectionHead: {
    marginTop: 20,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  section: {flexShrink: 1, color: colors.text, fontFamily: fonts.serif, fontSize: 19},
  ledger: {paddingHorizontal: 16, paddingTop: 14},
  lrow: {flexDirection: 'row', alignItems: 'center'},
  lhead: {paddingBottom: 8, borderBottomWidth: 1.5, borderBottomColor: colors.tan},
  lbody: {height: 50},
  lfoot: {height: 48},
  pressed: {backgroundColor: 'rgba(217,190,150,0.2)'},
  colNo: {width: 24},
  colItem: {flex: 1, paddingRight: 8},
  colDate: {width: 54, textAlign: 'right'},
  colSpent: {width: 84, textAlign: 'right'},
  th: {color: textColors.subtitle, fontFamily: fonts.extraBold, fontSize: 10, letterSpacing: 0.7},
  itemName: {color: colors.text, fontFamily: fonts.extraBold, fontSize: 13},
  empty: {flex: 1, color: colors.textSoft, fontFamily: fonts.hand, fontSize: 18},
  td: {color: colors.textSoft, fontFamily: fonts.bold, fontSize: 13},
  amt: {color: colors.text, fontFamily: fonts.black, fontSize: 13},
  total: {color: colors.text, fontFamily: fonts.serifBold, fontSize: 16},
  nav: {paddingBottom: 12, paddingHorizontal: spacing.screenX},
  bouquets: {position: 'absolute', left: 0, right: 0, bottom: 72, height: 84},
  burlapFrame: {
    padding: 12,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#B89B74',
    shadowColor: '#5A3C23',
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 10},
    elevation: 6,
  },
  burlapImage: {...StyleSheet.absoluteFill, width: '100%', height: '100%'},
  burlapStitch: {
    ...StyleSheet.absoluteFill,
    margin: 5,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,244,228,0.8)',
  },
  dashLine: {position: 'absolute', left: 0, right: 0, bottom: 0, height: 1, flexDirection: 'row', gap: 3, overflow: 'hidden'},
  ruleDash: {width: 4, height: 1, backgroundColor: colors.dashed},
});
