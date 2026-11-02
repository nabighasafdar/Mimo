import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {colors, fonts} from '../theme';

export default function Divider({label}: {label: string}) {
  return (
    <View style={styles.row}>
      <View style={styles.line} />
      <Text style={styles.label}>{label}</Text>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {flexDirection: 'row', alignItems: 'center', gap: 12},
  line: {flex: 1, height: 1, backgroundColor: 'rgba(170,130,100,0.25)'},
  label: {color: colors.textMuted, fontFamily: fonts.bold, fontSize: 12},
});
