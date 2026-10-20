import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Linking,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { COLORS } from '../constants/theme';
import { API } from '../services/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MobileLoader from '../components/MobileLoader';
import MobilePearlButton from '../components/MobilePearlButton';

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

  // Book Appointment Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [serviceType, setServiceType] = useState('Periodic Maintenance Service');
  const [dateStr, setDateStr] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('10:00 AM');
  const [bay, setBay] = useState('Bay 1 - Express Service');

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
    void fetchAppointments();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    void fetchAppointments();
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
      void Linking.openURL(`tel:${phone}`);
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

  const handleCreateAppointment = async () => {
    if (!custName.trim() && !custPhone.trim()) {
      Alert.alert('Required', 'Customer Name and Phone Number are required.');
      return;
    }

    try {
      setSaving(true);
      // 1. Get or create customer
      const existingCustomers = await API.getCustomers();
      let customerId = '';
      const matched = existingCustomers.find(
        (c: any) => (custPhone && c.phone === custPhone) || (custName && c.name?.toLowerCase() === custName.toLowerCase())
      );

      if (matched) {
        customerId = matched.id;
      } else {
        if (!custPhone.trim()) {
          Alert.alert('Phone Required', 'Please enter a customer contact number to book an appointment.');
          setSaving(false);
          return;
        }
        const newCust = await API.createCustomer({
          name: custName.trim() || 'Walk-in Client',
          phone: custPhone.trim(),
        });
        customerId = newCust.id || existingCustomers[0]?.id;
      }

      await API.createAppointment({
        customerId,
        serviceType,
        date: dateStr,
        startTime,
        endTime: '11:00 AM',
        bay,
      });

      Alert.alert('Success', `Appointment booked for ${custName || custPhone}`);
      setIsModalOpen(false);
      setCustName('');
      setCustPhone('');
      await fetchAppointments();
    } catch {
      Alert.alert('Error', 'Failed to book appointment. Please check connection.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Banner */}
      <View style={styles.topHeader}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={styles.headerTitle}>Daily Bookings & Roster</Text>
          <Text style={styles.headerSubtitle}>
            {appointments.length} Total active appointments scheduled
          </Text>
        </View>
        <MobilePearlButton
          variant="gold"
          onPress={() => setIsModalOpen(true)}
        >
          <MaterialCommunityIcons name="calendar-plus" size={16} color={COLORS.background} style={{ marginRight: 4 }} />
          <Text style={styles.pearlBtnText}>Book Slot</Text>
        </MobilePearlButton>
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

      {/* Book Slot Modal */}
      <Modal
        visible={isModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Book Service Slot</Text>
              <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                <MaterialCommunityIcons name="close" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalForm}>
              <Text style={styles.inputLabel}>Customer Name *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Ramesh Patel"
                placeholderTextColor={COLORS.textMuted}
                value={custName}
                onChangeText={setCustName}
              />

              <Text style={styles.inputLabel}>Customer Phone *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. 9876543210"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="phone-pad"
                value={custPhone}
                onChangeText={setCustPhone}
              />

              <Text style={styles.inputLabel}>Service Requirement</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Periodic Maintenance / Brake Service / Engine"
                placeholderTextColor={COLORS.textMuted}
                value={serviceType}
                onChangeText={setServiceType}
              />

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Date (YYYY-MM-DD)</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="2026-10-15"
                    placeholderTextColor={COLORS.textMuted}
                    value={dateStr}
                    onChangeText={setDateStr}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Time</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="10:00 AM"
                    placeholderTextColor={COLORS.textMuted}
                    value={startTime}
                    onChangeText={setStartTime}
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Assigned Work Bay</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Bay 1 - Express Service"
                placeholderTextColor={COLORS.textMuted}
                value={bay}
                onChangeText={setBay}
              />

              <MobilePearlButton
                variant="gold"
                onPress={handleCreateAppointment}
                style={{ marginTop: 20 }}
              >
                {saving ? (
                  <MobileLoader text="Booking Slot..." />
                ) : (
                  <>
                    <MaterialCommunityIcons name="calendar-check" size={18} color={COLORS.background} style={{ marginRight: 6 }} />
                    <Text style={styles.pearlBtnText}>Confirm Booking</Text>
                  </>
                )}
              </MobilePearlButton>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  pearlBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.background,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  modalForm: {
    padding: 20,
    paddingBottom: 40,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    marginBottom: 6,
    marginTop: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalInput: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
  },
});
