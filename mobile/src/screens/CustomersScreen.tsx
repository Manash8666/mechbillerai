import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { COLORS } from '../constants/theme';
import { API } from '../services/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface CustomerItem {
  id: string;
  name: string;
  phone: string;
  balance?: number;
  vehicles?: Array<{ id: string; registrationNo: string }>;
  _count?: {
    vehicles?: number;
    jobCards?: number;
  };
}

export default function CustomersScreen() {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCustomers = async () => {
    try {
      const data = await API.getCustomers();
      setCustomers(data);
    } catch (e) {
      console.error('Failed to fetch customers:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCustomers();
  };

  const renderItem = ({ item }: { item: CustomerItem }) => {
    const vehiclesCount = item.vehicles?.length ?? item._count?.vehicles ?? 0;
    const balance = item.balance || 0;

    return (
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(item.name || 'C')[0].toUpperCase()}</Text>
        </View>
        <View style={styles.details}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.phone}>{item.phone}</Text>
          <Text style={styles.subText}>{vehiclesCount} Vehicle(s) registered</Text>
        </View>
        <View style={styles.balanceCol}>
          <Text style={styles.balanceLabel}>Balance</Text>
          <Text style={[styles.balanceValue, balance > 0 && { color: COLORS.error }]}>
            ₹{balance}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={customers}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="account-search-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No customers found</Text>
            </View>
          }
        />
      )}
      <TouchableOpacity style={styles.fab}>
        <MaterialCommunityIcons name="account-plus" size={26} color={COLORS.background} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    padding: 16,
    paddingBottom: 80,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(201, 168, 76, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  details: {
    flex: 1,
  },
  name: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  phone: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  subText: {
    color: COLORS.primaryLight,
    fontSize: 11,
    marginTop: 4,
  },
  balanceCol: {
    alignItems: 'flex-end',
  },
  balanceLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  balanceValue: {
    color: COLORS.success,
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: COLORS.textMuted,
    marginTop: 12,
    fontSize: 15,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    backgroundColor: COLORS.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
});
