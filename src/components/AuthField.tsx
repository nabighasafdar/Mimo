import React from 'react';
import {StyleSheet, TextInput, TextInputProps, View} from 'react-native';
import GlassCard from './GlassCard';
import {colors, fonts} from '../theme';

type Props = TextInputProps & {
  icon: React.ReactNode;
  right?: React.ReactNode;
};

// Glass text field with a leading icon and an optional trailing control (e.g. show/hide).
export default function AuthField({icon, right, style, ...input}: Props) {
  return (
    <GlassCard radius={16} contentStyle={styles.content}>
      <View style={styles.icon}>{icon}</View>
      <TextInput
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        style={[styles.input, style]}
        {...input}
      />
      {right}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  content: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
  },
  icon: {width: 18, alignItems: 'center'},
  input: {
    flex: 1,
    padding: 0,
    color: colors.text,
    fontFamily: fonts.bold,
    fontSize: 15,
  },
});
