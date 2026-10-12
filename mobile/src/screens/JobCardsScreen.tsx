import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { COLORS } from '../constants/theme';
import { API } from '../services/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface JobCardItem {
  id: string;
  jobNumber: string;
  status: string;
  priority: string;
  description: string;
  estimatedCost: number;
  actualCost?: number;
  customer?: {
    name: string;
    phone: string;
  };
  vehicle?: {
    registrationNo: string;
    make: string;
    model: string;
  };
}

export default function JobCardsScreen() {
  const [jobs, setJobs] = useState<JobCardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchJobs = async () => {
    try {
      const data = await API.getJobCards();
      setJobs(data);
    } catch (e) {
      console.error('Failed to fetch job cards:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchJobs();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return COLORS.success;
      case 'in-progress': return COLORS.primary;
      default: return COLORS.warning;
    }
  };

  const renderItem = ({ item }: { item: JobCardItem }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.jobNumber}>{item.jobNumber}</Text>
        <View style={[styles.statusBadge, { borderColor: getStatusColor(item.status) }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <Text style={styles.vehicleNo}>
        {item.vehicle?.registrationNo || 'No Plate Info'}
      </Text>
      <Text style={styles.model}>
        {[item.vehicle?.make, item.vehicle?.model].filter(Boolean).join(' ') || item.description}
      </Text>

      <View style={styles.divider} />

      <View style={styles.cardFooter}>
        <View>
          <Text style={styles.subLabel}>Customer</Text>
          <Text style={styles.customerName}>{item.customer?.name || 'Walk-in'}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.subLabel}>Est. Cost</Text>
          <Text style={styles.cost}>₹{(item.estimatedCost || 0).toLocaleString('en-IN')}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="car-wrench" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No job cards found</Text>
            </View>
          }
        />
      )}
      <TouchableOpacity style={styles.fab}>
        <MaterialCommunityIcons name="plus" size={28} color={COLORS.background} />
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
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  jobNumber: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  vehicleNo: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: 'bold',
  },
  model: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  subLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  customerName: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  cost: {
    color: COLORS.text,
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
