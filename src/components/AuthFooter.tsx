import React from 'react';
import {StyleSheet, Text} from 'react-native';
import {fonts} from '../theme';

type Props = {prompt: string; action: string; onPress?: () => void};

// "Already have an account? Log in" line pinned under the form.
export default function AuthFooter({prompt, action, onPress}: Props) {
  return (
    <Text style={styles.text}>
      {prompt}{' '}
      <Text style={styles.action} onPress={onPress} accessibilityRole="link">
        {action}
      </Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    textAlign: 'center',
    color: '#5B4232',
    fontFamily: fonts.bold,
    fontSize: 13.5,
  },
  action: {color: '#8F4A30', fontFamily: fonts.extraBold},
});
