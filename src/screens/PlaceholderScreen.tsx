import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import Blobs from '../components/Blobs';
import OnboardingHeader from '../components/OnboardingHeader';
import PrimaryButton from '../components/PrimaryButton';
import {FLOW, RootStackParamList} from '../navigation';
import {colors, fonts, spacing} from '../theme';

// Stand-in for screens not yet built from Figma. Keeps the flow navigable.
export default function PlaceholderScreen({route}: {route: keyof RootStackParamList}) {
  const navigation = useNavigation<any>();
  const next = FLOW[FLOW.indexOf(route) + 1];

  return (
    <View style={styles.root}>
      <Blobs />
      <SafeAreaView style={styles.content}>
        <OnboardingHeader step={FLOW.indexOf(route)} onBack={() => navigation.goBack()} />
        <Text style={styles.title}>{route}</Text>
        {next ? (
          <PrimaryButton label="Continue" onPress={() => navigation.navigate(next)} />
        ) : (
          <View />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: colors.background},
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenX,
    paddingBottom: spacing.screenBottom,
  },
  title: {color: colors.text, fontFamily: fonts.extraBold, fontSize: 32},
});
