import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { COLORS } from '../constants/theme';
import { API, Storage, UserSession } from '../services/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function DashboardScreen() {
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
    loadData();
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome back 👋</Text>
          <Text style={styles.garageName}>{user?.name || 'Garage Owner'}</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {user?.licenseStatus === 'active' ? 'Active License' : 'Trial Period'}
          </Text>
        </View>
      </View>

      {/* Quick Stats Grid */}
      <View style={styles.grid}>
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="account-group" size={28} color={COLORS.primary} />
          <Text style={styles.statNumber}>{stats.totalCustomers}</Text>
          <Text style={styles.statLabel}>Total Customers</Text>
        </View>

        <View style={styles.statCard}>
          <MaterialCommunityIcons name="car-wrench" size={28} color="#38BDF8" />
          <Text style={styles.statNumber}>{stats.activeJobs}</Text>
          <Text style={styles.statLabel}>Active Job Cards</Text>
        </View>

        <View style={styles.statCard}>
          <MaterialCommunityIcons name="file-document-outline" size={28} color="#34D399" />
          <Text style={styles.statNumber}>{stats.invoicesThisMonth}</Text>
          <Text style={styles.statLabel}>Invoices (Month)</Text>
        </View>

        <View style={styles.statCard}>
          <MaterialCommunityIcons name="currency-inr" size={28} color="#FBBF24" />
          <Text style={styles.statNumber}>₹{stats.revenueThisMonth.toLocaleString('en-IN')}</Text>
          <Text style={styles.statLabel}>Monthly Revenue</Text>
        </View>
      </View>

      {/* Quick Action Buttons */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionBtn}>
          <MaterialCommunityIcons name="plus-circle" size={22} color={COLORS.background} />
          <Text style={styles.actionBtnText}>New Job Card</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionBtn, styles.actionBtnOutline]}>
          <MaterialCommunityIcons name="account-plus" size={22} color={COLORS.primary} />
          <Text style={[styles.actionBtnText, { color: COLORS.primary }]}>Add Customer</Text>
        </TouchableOpacity>
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
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  welcomeText: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  garageName: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  badge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  badgeText: {
    color: COLORS.success,
    fontSize: 12,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    width: '48%',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statNumber: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  actionBtnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  actionBtnText: {
    color: COLORS.background,
    fontWeight: 'bold',
    fontSize: 14,
  },
});
