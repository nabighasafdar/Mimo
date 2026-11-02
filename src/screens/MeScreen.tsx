import React from 'react';
import {Image, Alert, Linking, Pressable, ScrollView, StatusBar, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Svg, {Circle, Path, Rect} from 'react-native-svg';
import Blobs from '../components/Blobs';
import BottomNav from '../components/BottomNav';
import GlassCard from '../components/GlassCard';
import {Deco, Sticker} from '../components/Scrapbook';
import {art} from '../art';
import {monthYear} from '../budget';
import {SUPPORT_EMAIL, WEBSITE_URL} from '../config';
import {useStore} from '../store';
import {formatAmount} from '../voiceParse';
import {colors, fonts, spacing, textColors} from '../theme';

type Props = {
  onEditPersonal?: () => void;
  onEditIncome?: () => void;
  onEditCurrency?: () => void;
  onEditSavings?: () => void;
  onLogout?: () => void;
  /** Resolves false if the account could not be deleted. */
  onDeleteAccount?: () => Promise<boolean>;
};

const icon = (children: React.ReactNode) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </Svg>
);

const compact = (n: number) => (n >= 1000 && n % 1000 === 0 ? `${n / 1000}k` : formatAmount(n));

// Figma: 11 Me (profile)
function showHelp() {
  const text =
    'Add spending: tap the mic on Home and say it, like “450 on lunch”, or scan a receipt with the camera button.\n\n' +
    'Type an expense: tap “or type it instead” on Home.\n\n' +
    'Fix or delete an item: tap it on Home or in Stats. You can also press and hold it on Home to delete it.\n\n' +
    'No internet: keep going. Mimo saves on your phone and catches up when you are back online. Reading receipts and speech still needs internet.\n\n' +
    'Change your savings goal: tap “saving” on Home, or Monthly savings here.\n\n' +
    'AI reads are limited to 30 a day. After that, voice entries are matched by keywords and receipts can be scanned again tomorrow.';
  Alert.alert(
    'Help & support',
    text,
    SUPPORT_EMAIL
      ? [
          {text: 'Close', style: 'cancel'},
          {text: 'Email us', onPress: () => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Mimo%20help`)},
        ]
      : undefined,
  );
}

export default function MeScreen({
  onEditPersonal,
  onEditIncome,
  onEditCurrency,
  onEditSavings,
  onLogout,
  onDeleteAccount,
}: Props) {
  const {profile, savingsGoal, goals, prefs, setPrefs, memberSince} = useStore();
  const initial = (profile.name.trim()[0] ?? 'M').toUpperCase();

  const deleteForGood = async () => {
    if (!(await onDeleteAccount?.())) {
      Alert.alert('Not deleted', "I couldn't delete your account. Check your internet and try again.");
    }
  };
  const confirmDelete = () =>
    Alert.alert(
      'Delete your account?',
      'This permanently deletes your account, expenses, goals and budget. It cannot be undone.',
      [
        {text: 'Keep my account', style: 'cancel'},
        {text: 'Delete everything', style: 'destructive', onPress: deleteForGood},
      ],
    );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <Blobs />
      <Image source={art.bannerMe} resizeMode="stretch" style={styles.banner} />
      <SafeAreaView style={styles.content}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}>
          <View style={styles.top}>
            <Sticker kind="bow" size={54} rotate={-16} style={{left: 10, top: 6}} />
            <Deco source={art.meSticker} rotate={12} style={{right: 2, top: 20, width: 60, height: 85}} />
            <View style={styles.avatar}>
              <View style={styles.avatarStitch} />
              <Text style={styles.avatarText}>{initial}</Text>
              <Sticker kind="seal" size={40} rotate={-12} style={{left: -30, top: 50}} />
            </View>
            <Text style={styles.name}>{profile.name || 'Friend'}</Text>
            {memberSince && (
              <Text style={styles.since}>budgeting with Mimo since {monthYear(new Date(memberSince))}</Text>
            )}
          </View>

          <View style={styles.tiles}>
            <Tile value={`${profile.currency.sym} ${compact(savingsGoal)}`} label="Saving / mo" accent />
            <Tile value={profile.currency.code} label="Currency" />
            <Tile value={String(goals.length)} label="Bucket list" />
          </View>

          <Text style={styles.sec}>ACCOUNT</Text>
          <GlassCard>
            <Row
              bg="rgba(158,85,57,0.14)"
              onPress={onEditPersonal}
              title="Personal details"
              value={`${profile.name || 'Add name'}, ${profile.age}`}
              icon={icon(
                <>
                  <Circle cx={12} cy={8} r={4} stroke="#8F4A30" />
                  <Path d="M4 21c1-4 4-6 8-6s7 2 8 6" stroke="#8F4A30" />
                </>,
              )}
            />
            <Row
              bg="rgba(138,148,112,0.22)"
              onPress={onEditIncome}
              title="Income"
              value={`${profile.currency.sym} ${profile.amount || '0'} / mo`}
              icon={icon(
                <>
                  <Rect x={3} y={7} width={18} height={13} rx={2} stroke="#4F5A3A" />
                  <Path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 12h18" stroke="#4F5A3A" />
                </>,
              )}
            />
            <Row
              bg="rgba(232,121,59,0.2)"
              onPress={onEditSavings}
              title="Monthly savings"
              value={savingsGoal > 0 ? `${profile.currency.sym} ${formatAmount(savingsGoal)}` : 'Not set'}
              icon={icon(
                <>
                  <Circle cx={12} cy={12} r={9} stroke="#8F4A30" />
                  <Path d="M12 3v9l6 4" stroke="#8F4A30" />
                </>,
              )}
            />
            <Row
              bg="rgba(162,127,69,0.2)"
              onPress={onEditCurrency}
              title="Currency"
              value={profile.currency.code}
              last
              icon={<Text style={styles.rsIcon}>{profile.currency.sym}</Text>}
            />
          </GlassCard>

          <Text style={styles.sec}>PREFERENCES</Text>
          <GlassCard>
            <Row
              bg="rgba(107,84,70,0.14)"
              title="Savings alerts"
              toggle={{on: prefs.savingsAlerts, set: on => setPrefs({savingsAlerts: on})}}
              icon={icon(<Path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 21h4" stroke="#5B4232" />)}
            />
            <Row
              bg="rgba(158,85,57,0.14)"
              title="Mimo's tips"
              toggle={{on: prefs.tips, set: on => setPrefs({tips: on})}}
              icon={
                <Svg width={16} height={16} viewBox="0 0 24 24">
                  <Path d="M12 2l2.2 6.6L21 11l-6.8 2.4L12 20l-2.2-6.6L3 11l6.8-2.4z" fill="#8F4A30" />
                </Svg>
              }
            />
            <Row
              bg="rgba(162,127,69,0.2)"
              title="Help & support"
              last={!WEBSITE_URL}
              onPress={showHelp}
              icon={icon(
                <>
                  <Circle cx={12} cy={12} r={9} stroke="#6E5426" />
                  <Path d="M9.5 9.5a2.5 2.5 0 0 1 4.8 1c0 1.7-2.3 2-2.3 3.5M12 17.5h.01" stroke="#6E5426" />
                </>,
              )}
            />
            {!!WEBSITE_URL && (
              <Row
                bg="rgba(107,84,70,0.14)"
                title="Privacy policy"
                last
                onPress={() => Linking.openURL(`${WEBSITE_URL}/privacy`)}
                icon={icon(<Path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" stroke="#5B4232" />)}
              />
            )}
          </GlassCard>

          <Pressable onPress={onLogout} hitSlop={10} style={styles.logout}>
            <Text style={styles.logoutText}>Log out</Text>
          </Pressable>
          <Pressable onPress={confirmDelete} hitSlop={10} style={styles.deleteAccount}>
            <Text style={styles.deleteAccountText}>Delete account</Text>
          </Pressable>
        </ScrollView>

        <View style={styles.nav}>
          <BottomNav active="Me" />
        </View>
      </SafeAreaView>
    </View>
  );
}

function Tile({value, label, accent}: {value: string; label: string; accent?: boolean}) {
  return (
    <View style={styles.tileWrap}>
      <GlassCard>
        <View style={styles.tile}>
          <Text style={[styles.tileValue, accent && {color: '#8F4A30'}]}>{value}</Text>
          <Text style={styles.tileLabel}>{label}</Text>
        </View>
      </GlassCard>
    </View>
  );
}

type RowProps = {
  icon: React.ReactNode;
  bg: string;
  title: string;
  value?: string;
  last?: boolean;
  onPress?: () => void;
  toggle?: {on: boolean; set: (v: boolean) => void};
};

function Row({icon: ic, bg, title, value, last, onPress, toggle}: RowProps) {
  return (
    <Pressable
      onPress={toggle ? () => toggle.set(!toggle.on) : onPress}
      accessibilityRole={toggle ? 'switch' : 'button'}
      accessibilityState={toggle ? {checked: toggle.on} : undefined}
      style={[styles.row, !last && styles.rowBorder]}>
      <View style={[styles.ri, {backgroundColor: bg}]}>{ic}</View>
      <Text style={styles.rt}>{title}</Text>
      {value !== undefined && <Text style={styles.rv}>{value}</Text>}
      {toggle ? (
        <View style={[styles.sw, toggle.on && styles.swOn]}>
          <View style={[styles.knob, toggle.on && styles.knobOn]} />
        </View>
      ) : (
        <Svg width={14} height={14} viewBox="0 0 24 24">
          <Path
            d="M9 18l6-6-6-6"
            stroke="#A68D77"
            strokeWidth={2.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </Svg>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: colors.background},
  flex: {flex: 1},
  banner: {position: 'absolute', left: -10, right: -10, top: -14, height: 45},
  content: {flex: 1, paddingHorizontal: spacing.screenX},
  scroll: {paddingTop: 20, paddingBottom: 56},
  top: {alignItems: 'center'},
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.orange,
    borderWidth: 3,
    borderColor: colors.card,
  },
  avatarStitch: {
    position: 'absolute',
    left: 7,
    right: 7,
    top: 7,
    bottom: 7,
    borderRadius: 32,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,236,214,0.6)',
  },
  avatarText: {color: colors.onAccent, fontFamily: fonts.serif, fontSize: 38},
  name: {marginTop: 12, color: colors.text, fontFamily: fonts.serif, fontSize: 26},
  since: {color: colors.textSoft, fontFamily: fonts.hand, fontSize: 20},
  tiles: {marginTop: 22, flexDirection: 'row', gap: 10},
  tileWrap: {flex: 1},
  tile: {height: 70, alignItems: 'center', justifyContent: 'center', gap: 1},
  tileValue: {color: colors.text, fontFamily: fonts.serifBold, fontSize: 17},
  tileLabel: {color: textColors.subtitle, fontFamily: fonts.extraBold, fontSize: 11},
  sec: {
    marginTop: 22,
    marginBottom: 8,
    marginLeft: 4,
    color: textColors.subtitle,
    fontFamily: fonts.extraBold,
    fontSize: 11,
    letterSpacing: 0.8,
  },
  row: {height: 54, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14},
  rowBorder: {borderBottomWidth: 1, borderBottomColor: colors.dashed},
  ri: {width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center'},
  rsIcon: {color: '#6E5426', fontFamily: fonts.serifBold, fontSize: 12},
  rt: {flex: 1, color: colors.text, fontFamily: fonts.extraBold, fontSize: 14},
  rv: {color: colors.textSoft, fontFamily: fonts.hand, fontSize: 19},
  sw: {width: 44, height: 26, borderRadius: 13, backgroundColor: colors.dashed, justifyContent: 'center'},
  swOn: {backgroundColor: colors.orange},
  knob: {
    position: 'absolute',
    left: 3,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFDF8',
    elevation: 2,
  },
  knobOn: {left: 21},
  logout: {alignSelf: 'center', marginTop: 18, padding: 6},
  logoutText: {color: colors.accentText, fontFamily: fonts.handBold, fontSize: 22},
  deleteAccount: {alignSelf: 'center', marginTop: 6, padding: 6},
  deleteAccountText: {color: '#9A3524', fontFamily: fonts.bold, fontSize: 13},
  nav: {paddingBottom: 12},
});
