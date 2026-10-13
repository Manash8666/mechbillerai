import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { COLORS } from '../constants/theme';
import { API, Storage, UserSession } from '../services/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function DashboardScreen({ navigation }: any) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    invoicesThisMonth: 0,
    revenueThisMonth: 0,
    activeJobs: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const currentUser = await Storage.getUser();
      setUser(currentUser);

      const data = await API.getDashboardStats();
      if (data && !data.error) {
        setStats({
          totalCustomers: data.totalCustomers || 0,
          invoicesThisMonth: data.invoicesThisMonth || 0,
          revenueThisMonth: data.revenueThisMonth?._sum?.total || 0,
          activeJobs: data.activeJobs || 0,
        });
      }
    } catch (e) {
      console.error('Failed to load dashboard data:', e);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useEffect(() => {
    void loadData();
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
    >
      {/* iOS App Top Bar */}
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <View style={styles.avatarPill}>
            <Text style={styles.avatarText}>{(user?.name || 'M')[0].toUpperCase()}</Text>
          </View>
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.welcomeText}>Good morning,</Text>
            <Text style={styles.garageName}>{user?.name || 'Garage Partner'}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.notificationPill}
          onPress={() => navigation?.navigate('Appointments')}
        >
          <MaterialCommunityIcons name="calendar-month-outline" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Hero: iOS Banking Balance & Cashflow Card */}
      <View style={styles.bankBalanceCard}>
        <View style={styles.bankCardHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <MaterialCommunityIcons name="shield-check" size={16} color={COLORS.primary} />
            <Text style={styles.bankCardLabel}>GARAGE OPERATING VAULT</Text>
          </View>
          <View style={styles.liveChip}>
            <View style={styles.liveDot} />
            <Text style={styles.liveChipText}>LIVE</Text>
          </View>
        </View>

        <Text style={styles.balanceAmount}>
          ₹{stats.revenueThisMonth.toLocaleString('en-IN')}
        </Text>
        <Text style={styles.balanceSubtext}>Net Cash Flow Settled (This Month)</Text>

        <View style={styles.bankCardFooter}>
          <TouchableOpacity
            style={styles.footerMetric}
            onPress={() => navigation?.navigate('Invoices')}
          >
            <Text style={styles.footerMetricLabel}>PAID INVOICES</Text>
            <Text style={styles.footerMetricVal}>{stats.invoicesThisMonth}</Text>
          </TouchableOpacity>
          <View style={styles.footerDivider} />
          <TouchableOpacity
            style={styles.footerMetric}
            onPress={() => navigation?.navigate('Job Cards')}
          >
            <Text style={styles.footerMetricLabel}>ACTIVE JOBS</Text>
            <Text style={[styles.footerMetricVal, { color: COLORS.primary }]}>{stats.activeJobs}</Text>
          </TouchableOpacity>
          <View style={styles.footerDivider} />
          <TouchableOpacity
            style={styles.footerMetric}
            onPress={() => navigation?.navigate('Customers')}
          >
            <Text style={styles.footerMetricLabel}>CUSTOMERS</Text>
            <Text style={styles.footerMetricVal}>{stats.totalCustomers}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* iOS Quick Actions Pills (Send, Receive, Invoice, Intake) */}
      <View style={styles.pillsRow}>
        <TouchableOpacity
          style={styles.actionPill}
          onPress={() => navigation?.navigate('Intake')}
        >
          <View style={[styles.pillIconCircle, { backgroundColor: 'rgba(229, 192, 123, 0.15)' }]}>
            <MaterialCommunityIcons name="camera-plus" size={22} color={COLORS.primary} />
          </View>
          <Text style={styles.pillLabel}>Intake</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionPill}
          onPress={() => navigation?.navigate('Checkout')}
        >
          <View style={[styles.pillIconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
            <MaterialCommunityIcons name="cash-fast" size={22} color="#10B981" />
          </View>
          <Text style={styles.pillLabel}>Triage</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionPill}
          onPress={() => navigation?.navigate('Invoices')}
        >
          <View style={[styles.pillIconCircle, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
            <MaterialCommunityIcons name="file-document-plus" size={22} color="#38BDF8" />
          </View>
          <Text style={styles.pillLabel}>Bills</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionPill}
          onPress={() => navigation?.navigate('Appointments')}
        >
          <View style={[styles.pillIconCircle, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
            <MaterialCommunityIcons name="calendar-clock" size={22} color="#C084FC" />
          </View>
          <Text style={styles.pillLabel}>Bookings</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Cash Flow & Job Ledger Section */}
      <View style={styles.ledgerHeader}>
        <Text style={styles.sectionTitle}>Today&apos;s Garage Cash Flow</Text>
        <TouchableOpacity>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.transactionsCard}>
        <View style={styles.txRow}>
          <View style={[styles.txIcon, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
            <MaterialCommunityIcons name="arrow-bottom-left" size={20} color="#10B981" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.txTitle}>Splendor Plus (Spark Plug)</Text>
            <Text style={styles.txSubtitle}>Collected via Cash · 11:20 AM</Text>
          </View>
          <Text style={styles.txAmountIncome}>+₹250</Text>
        </View>

        <View style={styles.txRow}>
          <View style={[styles.txIcon, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
            <MaterialCommunityIcons name="arrow-bottom-left" size={20} color="#10B981" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.txTitle}>Activa 6G (Oil Change)</Text>
            <Text style={styles.txSubtitle}>Collected via UPI GPay · 10:45 AM</Text>
          </View>
          <Text style={styles.txAmountIncome}>+₹450</Text>
        </View>

        <View style={[styles.txRow, { borderBottomWidth: 0 }]}>
          <View style={[styles.txIcon, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
            <MaterialCommunityIcons name="clock-outline" size={20} color="#F59E0B" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.txTitle}>Royal Enfield Classic 350</Text>
            <Text style={styles.txSubtitle}>Engine Rebuild (In Progress)</Text>
          </View>
          <Text style={styles.txAmountPending}>₹18,400</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 18,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 4,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPill: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(229, 192, 123, 0.15)',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  welcomeText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  garageName: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  notificationPill: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Bank Hero Card
  bankBalanceCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: COLORS.borderHighlight,
    marginBottom: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  bankCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  bankCardLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  liveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  liveChipText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: 'bold',
  },
  balanceAmount: {
    color: COLORS.text,
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  balanceSubtext: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 4,
    marginBottom: 20,
  },
  bankCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  footerMetric: {
    alignItems: 'center',
    flex: 1,
  },
  footerMetricLabel: {
    color: COLORS.textSubtle,
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  footerMetricVal: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 2,
  },
  footerDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },

  // Pills Row
  pillsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionPill: {
    alignItems: 'center',
    width: '23%',
  },
  pillIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  pillLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Ledger / Transactions
  ledgerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  seeAllText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  transactionsCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 20,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
  },
  txSubtitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  txAmountIncome: {
    color: '#10B981',
    fontSize: 15,
    fontWeight: 'bold',
  },
  txAmountPending: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: 'bold',
  },
});
