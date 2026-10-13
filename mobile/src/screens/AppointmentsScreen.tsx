import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Linking,
} from 'react-native';
import { COLORS } from '../constants/theme';
import { API } from '../services/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MobileLoader from '../components/MobileLoader';

interface AppointmentItem {
  id: string;
  serviceType: string;
  description?: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  bay?: string;
  notes?: string;
  customer: {
    name: string;
    phone: string;
  };
}

export default function AppointmentsScreen() {
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'confirmed' | 'in-progress'>('all');

  const fetchAppointments = async () => {
    try {
      const data = await API.getAppointments();
      setAppointments(data);
    } catch (e) {
      console.error('Failed to fetch appointments:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAppointments();
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return '#10B981';
      case 'in-progress':
        return COLORS.primary;
      case 'completed':
        return '#8B5CF6';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#38BDF8'; // scheduled
    }
  };

  const handleCallCustomer = (phone: string) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  const filteredAppointments = appointments.filter((apt) => {
    const matchesSearch =
      (apt.customer?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      apt.serviceType.toLowerCase().includes(search.toLowerCase()) ||
      (apt.bay || '').toLowerCase().includes(search.toLowerCase());

    const matchesFilter = filter === 'all' || apt.status?.toLowerCase() === filter;
    return matchesSearch && matchesFilter;
  });

  const renderItem = ({ item }: { item: AppointmentItem }) => {
    const statusColor = getStatusColor(item.status);
    const dateFormatted = new Date(item.date).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={styles.serviceType}>{item.serviceType}</Text>
            <View style={styles.timeRow}>
              <MaterialCommunityIcons name="clock-outline" size={13} color={COLORS.primary} />
              <Text style={styles.timeText}>
                {item.startTime} - {item.endTime} · {dateFormatted}
              </Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {(item.status || 'SCHEDULED').toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.customerRow}>
          <View style={styles.customerDetails}>
            <Text style={styles.customerName}>{item.customer?.name || 'Walk-in'}</Text>
            <Text style={styles.customerPhone}>{item.customer?.phone}</Text>
          </View>
          {item.customer?.phone ? (
            <TouchableOpacity
              style={styles.callBtn}
              onPress={() => handleCallCustomer(item.customer.phone)}
            >
              <MaterialCommunityIcons name="phone" size={16} color={COLORS.background} />
              <Text style={styles.callBtnText}>Call</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.metaRow}>
          {item.bay ? (
            <View style={styles.tag}>
              <MaterialCommunityIcons name="car-wrench" size={13} color={COLORS.textMuted} />
              <Text style={styles.tagText}>Bay: {item.bay}</Text>
            </View>
          ) : null}
          {item.description ? (
            <View style={[styles.tag, { flex: 1 }]}>
              <MaterialCommunityIcons name="information-outline" size={13} color={COLORS.textMuted} />
              <Text style={styles.tagText} numberOfLines={1}>
                {item.description}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Banner */}
      <View style={styles.topHeader}>
        <Text style={styles.headerTitle}>Daily Bookings & Roster</Text>
        <Text style={styles.headerSubtitle}>
          {appointments.length} Total active appointments scheduled
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBox}>
        <MaterialCommunityIcons name="magnify" size={20} color={COLORS.textMuted} />
        <TextInput
          placeholder="Search by customer, service or bay..."
          placeholderTextColor={COLORS.textMuted}
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <MaterialCommunityIcons name="close-circle" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        {(['all', 'scheduled', 'confirmed', 'in-progress'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.filterTab, filter === tab && styles.filterTabActive]}
            onPress={() => setFilter(tab)}
          >
            <Text style={[styles.filterTabText, filter === tab && styles.filterTabTextActive]}>
              {tab.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <MobileLoader text="Loading Appointments" />
        </View>
      ) : (
        <FlatList
          data={filteredAppointments}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="calendar-blank-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No appointments found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    marginLeft: 8,
  },
  filterTabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 8,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterTabActive: {
    backgroundColor: 'rgba(201, 168, 76, 0.15)',
    borderColor: COLORS.primary,
  },
  filterTabText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  filterTabTextActive: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  list: {
    padding: 16,
    paddingTop: 4,
  },
  card: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  serviceType: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: 'bold',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  timeText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  customerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: 'bold',
  },
  customerPhone: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  callBtnText: {
    color: COLORS.background,
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagText: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginLeft: 4,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.textMuted,
    marginTop: 10,
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: COLORS.textMuted,
    marginTop: 12,
    fontSize: 14,
  },
});
