import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

type Props = {children: React.ReactNode; style?: StyleProp<ViewStyle>};

// Screen body that moves out of the keyboard's way. Edge-to-edge Android ignores
// adjustResize, so the padding is applied here. The ScrollView lets content scroll
// on short screens and keeps the layout filling the screen when the keyboard is closed.
export default function KeyboardScreen({children, style}: Props) {
  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.grow}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <SafeAreaView style={[styles.content, style]}>{children}</SafeAreaView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1},
  grow: {flexGrow: 1},
  content: {flexGrow: 1},
});
