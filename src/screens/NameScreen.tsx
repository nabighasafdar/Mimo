import React, {useState} from 'react';
import {StatusBar, StyleSheet, Text, TextInput, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Blobs from '../components/Blobs';
import Bunny from '../components/Bunny';
import GlassCard from '../components/GlassCard';
import OnboardingHeader from '../components/OnboardingHeader';
import PrimaryButton from '../components/PrimaryButton';
import {colors, fonts, spacing} from '../theme';

type Props = {onBack?: () => void; onContinue?: (name: string) => void};

// Figma: 02 Name (node 2:127)
export default function NameScreen({onBack, onContinue}: Props) {
  const [name, setName] = useState('Sara');

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <Blobs />
      <SafeAreaView style={styles.content}>
        <OnboardingHeader step={1} onBack={onBack} />

        <View style={styles.question}>
          <View style={styles.bunnySays}>
            <Bunny />
            <GlassCard style={styles.bubble} contentStyle={styles.bubbleContent}>
              <Text style={styles.bubbleText}>
                Nice to meet you! What should I call you?
              </Text>
            </GlassCard>
          </View>

          <Text style={styles.title}>Your name</Text>

          <View style={styles.field}>
            <Text style={styles.label}>First name</Text>
            <GlassCard contentStyle={styles.inputContent}>
              <TextInput
                value={name}
                onChangeText={setName}
                style={styles.input}
                placeholderTextColor={colors.textMuted}
                autoCapitalize="words"
              />
            </GlassCard>
          </View>
        </View>

        <PrimaryButton label="Continue" onPress={() => onContinue?.(name)} />
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
    paddingTop: spacing.screenTop - 44,
    paddingBottom: spacing.screenBottom,
  },
  question: {gap: 28},
  bunnySays: {flexDirection: 'row', alignItems: 'center', gap: 10},
  bubble: {flex: 1},
  bubbleContent: {paddingHorizontal: 18, paddingVertical: 14},
  bubbleText: {
    color: colors.text,
    fontFamily: fonts.semiBold,
    fontSize: 16,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.extraBold,
    fontSize: 32,
  },
  field: {gap: 8},
  label: {
    color: colors.textMuted,
    fontFamily: fonts.semiBold,
    fontSize: 14,
  },
  inputContent: {padding: 20},
  input: {
    padding: 0,
    color: colors.text,
    fontFamily: fonts.bold,
    fontSize: 20,
  },
});
