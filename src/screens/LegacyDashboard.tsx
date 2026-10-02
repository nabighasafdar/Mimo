import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const quickStats = [
  { label: 'Budget', value: 'Rs 55k', tone: '#8B5CF6' },
  { label: 'Saved', value: 'Rs 8.2k', tone: '#22C55E' },
  { label: 'Spent', value: 'Rs 21k', tone: '#F59E0B' },
];

const categories = [
  { label: 'Food', amount: 'Rs 4,500', percent: 42 },
  { label: 'Transport', amount: 'Rs 2,900', percent: 27 },
  { label: 'Bills', amount: 'Rs 1,800', percent: 17 },
];

const recentTransactions = [
  { id: 1, title: 'Groceries', amount: '-Rs 1,250', time: 'Today • 8:30 PM', color: '#FB7185' },
  { id: 2, title: 'Salary', amount: '+Rs 45,000', time: 'Yesterday • 9:00 AM', color: '#34D399' },
  { id: 3, title: 'Fuel', amount: '-Rs 3,200', time: 'Mon • 2:10 PM', color: '#60A5FA' },
];

export default function App() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning</Text>
            <Text style={styles.title}>Mimo</Text>
          </View>

          <TouchableOpacity style={styles.avatar} activeOpacity={0.8}>
            <Text style={styles.avatarText}>N</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Current balance</Text>
          <Text style={styles.balanceText}>Rs 32,450</Text>

          <View style={styles.balanceRow}>
            <View>
              <Text style={styles.miniLabel}>Income</Text>
              <Text style={styles.miniValue}>Rs 52,500</Text>
            </View>
            <View>
              <Text style={styles.miniLabel}>Expense</Text>
              <Text style={styles.miniValue}>Rs 20,050</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actionButton, styles.primaryButton]} activeOpacity={0.85}>
            <Text style={styles.actionIcon}>🎙️</Text>
            <Text style={styles.actionText}>Voice add</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]} activeOpacity={0.85}>
            <Text style={styles.actionIcon}>＋</Text>
            <Text style={styles.actionText}>Manual</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          {quickStats.map(item => (
            <View key={item.label} style={[styles.statBox, { borderColor: item.tone }]}>
              <Text style={[styles.statLabel, { color: item.tone }]}>{item.label}</Text>
              <Text style={styles.statValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <Text style={styles.sectionLink}>View all</Text>
        </View>

        <View style={styles.listCard}>
          {categories.map(item => (
            <View key={item.label} style={styles.categoryItem}>
              <View style={styles.categoryTopRow}>
                <Text style={styles.categoryLabel}>{item.label}</Text>
                <Text style={styles.categoryAmount}>{item.amount}</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${item.percent}%` }]} />
              </View>
            </View>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent</Text>
          <Text style={styles.sectionLink}>See more</Text>
        </View>

        {recentTransactions.map(item => (
          <View key={item.id} style={styles.transactionItem}>
            <View style={styles.transactionLeft}>
              <View style={[styles.iconWrap, { backgroundColor: item.color }]}>
                <Text style={styles.iconText}>•</Text>
              </View>

              <View>
                <Text style={styles.transactionTitle}>{item.title}</Text>
                <Text style={styles.transactionTime}>{item.time}</Text>
              </View>
            </View>

            <Text style={styles.transactionAmount}>{item.amount}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  greeting: {
    color: '#A5B4FC',
    fontSize: 13,
    marginBottom: 4,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 32,
    fontWeight: '700',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 18,
  },
  cardLabel: {
    color: '#CBD5E1',
    fontSize: 12,
    marginBottom: 8,
  },
  balanceText: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '800',
    marginBottom: 18,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  miniLabel: {
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 4,
  },
  miniValue: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  actionButton: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#8B5CF6',
  },
  secondaryButton: {
    backgroundColor: '#0EA5E9',
  },
  actionIcon: {
    fontSize: 22,
    marginBottom: 6,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 26,
  },
  statBox: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 16,
    backgroundColor: '#111827',
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 6,
    fontWeight: '600',
  },
  statValue: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
  },
  sectionLink: {
    color: '#A5B4FC',
    fontSize: 12,
    fontWeight: '600',
  },
  listCard: {
    backgroundColor: '#111827',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 8,
    marginBottom: 22,
  },
  categoryItem: {
    marginBottom: 12,
  },
  categoryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryLabel: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '600',
  },
  categoryAmount: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '600',
  },
  progressTrack: {
    height: 8,
    borderRadius: 8,
    backgroundColor: '#1F2937',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#8B5CF6',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  transactionTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '600',
  },
  transactionTime: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  transactionAmount: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
  },
});
