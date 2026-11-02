import React from 'react';
import {Image, StatusBar, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Blobs from '../components/Blobs';
import Bunny from '../components/Bunny';
import PrimaryButton from '../components/PrimaryButton';
import SecondaryButton from '../components/SecondaryButton';
import {Deco, Sticker, Tape} from '../components/Scrapbook';
import {art} from '../art';
import {colors, fonts, spacing, textColors} from '../theme';

type Props = {onStart?: () => void; onHaveAccount?: () => void};

// Design: 01 Welcome. The collage is laid out on the design's 390px-wide frame and centred.
export default function WelcomeScreen({onStart, onHaveAccount}: Props) {
  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <Blobs />
      <Image source={art.bannerWelcome} resizeMode="stretch" style={styles.banner} />
      <SafeAreaView style={styles.content}>
        <View>
          <View style={styles.logo} accessible accessibilityRole="header" accessibilityLabel="Mimo">
            <Image source={art.letterM} style={[styles.letterM, {transform: [{rotate: '-5deg'}]}]} />
            <Image source={art.letterI} style={[styles.letterI, {transform: [{rotate: '4deg'}]}]} />
            <Image source={art.letterM} style={[styles.letterM, {transform: [{rotate: '3deg'}]}]} />
            <Image source={art.letterO} style={[styles.letterO, {transform: [{rotate: '-6deg'}]}]} />
          </View>
          <Text style={styles.kicker}>BUDGET JOURNAL</Text>
        </View>

        <View style={styles.collage}>
          <Image source={art.burlap} resizeMode="cover" style={styles.burlap} />
          <Sticker kind="seal" size={64} rotate={-27} style={{left: 51, top: 0}} />
          <Tape width={96} style={{left: 150, top: 7, transform: [{rotate: '-4deg'}]}} />
          <Bunny width={142} height={301} style={styles.bunny} />
          <Deco source={art.flower} rotate={-105} style={{left: 205, top: -16, width: 59, height: 59}} />
          <Deco source={art.tall} rotate={24} style={{left: 265, top: 264, width: 48, height: 112}} />
          <Deco source={art.bouquet} rotate={-33} style={{left: 37, top: 267, width: 114, height: 135}} />
        </View>

        <View>
          <Text style={styles.title}>
            Hi, I'm <Text style={styles.titleName}>Mimo!</Text>
          </Text>
          <Text style={styles.subtitle}>
            I'll help you keep track of your money, one tiny carrot at a time.
          </Text>
        </View>

        <View style={styles.actions}>
          <PrimaryButton label="Let's get started" onPress={onStart} />
          <SecondaryButton label="I already have an account" onPress={onHaveAccount} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: colors.background},
  banner: {position: 'absolute', left: -10, right: -10, top: -14, height: 45},
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenX,
    paddingTop: 20,
    paddingBottom: spacing.screenBottom,
  },
  logo: {flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: -4},
  letterM: {width: 53, height: 40},
  letterI: {width: 23, height: 40},
  letterO: {width: 39, height: 39},
  kicker: {
    marginTop: 8,
    color: textColors.subtitle,
    fontFamily: fonts.extraBold,
    fontSize: 10.5,
    letterSpacing: 1.4,
  },
  collage: {width: 390, height: 380, alignSelf: 'center'},
  burlap: {
    position: 'absolute',
    left: 80,
    top: 11,
    width: 230,
    height: 359,
    borderRadius: 6,
    transform: [{rotate: '-2.5deg'}],
  },
  bunny: {position: 'absolute', left: 124, top: 43},
  title: {
    textAlign: 'center',
    color: colors.text,
    fontFamily: fonts.serif,
    fontSize: 34,
    letterSpacing: -0.4,
  },
  titleName: {color: colors.accentText, fontFamily: fonts.serifItalic},
  subtitle: {
    marginTop: 8,
    marginHorizontal: 16,
    textAlign: 'center',
    color: colors.textSoft,
    fontFamily: fonts.hand,
    fontSize: 22,
    lineHeight: 27,
  },
  actions: {gap: 14},
});
