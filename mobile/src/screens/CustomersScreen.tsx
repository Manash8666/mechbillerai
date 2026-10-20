import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { COLORS } from '../constants/theme';
import { API } from '../services/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MobileLoader from '../components/MobileLoader';
import MobilePearlButton from '../components/MobilePearlButton';

interface CustomerItem {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  balance?: number;
  vehicles?: Array<{ id: string; registrationNo: string; make?: string; model?: string }>;
  _count?: {
    vehicles?: number;
    jobCards?: number;
  };
}

export default function CustomersScreen() {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // New Customer Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [regNo, setRegNo] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');

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
    void fetchCustomers();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    void fetchCustomers();
  };

  const handleCreateCustomer = async () => {
    if (!custName.trim() || !custPhone.trim()) {
      Alert.alert('Required', 'Customer Name and Phone Number are required.');
      return;
    }

    try {
      setSaving(true);
      const newCustomer = await API.createCustomer({
        name: custName.trim(),
        phone: custPhone.trim(),
        email: custEmail.trim() || undefined,
      });

      if (regNo.trim() && newCustomer.id) {
        const parts = vehicleModel.trim().split(' ');
        const make = parts.length > 1 ? parts[0] : (vehicleModel.trim() || 'Motorcycle / Vehicle');
        const model = parts.length > 1 ? parts.slice(1).join(' ') : (vehicleModel.trim() || 'Standard Model');
        await API.addVehicleToCustomer(newCustomer.id, {
          registrationNo: regNo.trim().toUpperCase(),
          make,
          model,
        });
      }

      Alert.alert('Success', `Customer "${custName}" created!`);
      setIsModalOpen(false);
      setCustName('');
      setCustPhone('');
      setCustEmail('');
      setRegNo('');
      setVehicleModel('');
      await fetchCustomers();
    } catch {
      Alert.alert('Error', 'Failed to save customer. Please try again.');
    } finally {
      setSaving(false);
    }
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
      {/* Top Header */}
      <View style={styles.topActions}>
        <Text style={styles.topTitle}>Customer Accounts</Text>
        <MobilePearlButton
          variant="gold"
          onPress={() => setIsModalOpen(true)}
        >
          <MaterialCommunityIcons name="account-plus" size={18} color={COLORS.background} style={{ marginRight: 4 }} />
          <Text style={styles.pearlBtnText}>Add Customer</Text>
        </MobilePearlButton>
      </View>

      {loading ? (
        <View style={styles.center}>
          <MobileLoader text="Loading Customers" />
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

      {/* Floating Plus Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setIsModalOpen(true)}
      >
        <MaterialCommunityIcons name="account-plus" size={26} color={COLORS.background} />
      </TouchableOpacity>

      {/* Add Customer Modal */}
      <Modal
        visible={isModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Customer</Text>
              <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                <MaterialCommunityIcons name="close" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalForm}>
              <Text style={styles.inputLabel}>Full Name *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Vikram Sharma"
                placeholderTextColor={COLORS.textMuted}
                value={custName}
                onChangeText={setCustName}
              />

              <Text style={styles.inputLabel}>Mobile Phone Number *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. 9876543210"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="phone-pad"
                value={custPhone}
                onChangeText={setCustPhone}
              />

              <Text style={styles.inputLabel}>Email Address (Optional)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="customer@example.com"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                value={custEmail}
                onChangeText={setCustEmail}
              />

              <Text style={styles.inputLabel}>Vehicle Number Plate (Optional)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. GJ01PU7510"
                placeholderTextColor={COLORS.textMuted}
                autoCapitalize="characters"
                value={regNo}
                onChangeText={setRegNo}
              />

              <Text style={styles.inputLabel}>Vehicle Make & Model (Optional)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Royal Enfield Classic 350"
                placeholderTextColor={COLORS.textMuted}
                value={vehicleModel}
                onChangeText={setVehicleModel}
              />

              <MobilePearlButton
                variant="gold"
                onPress={handleCreateCustomer}
                style={{ marginTop: 22 }}
              >
                {saving ? (
                  <MobileLoader text="Saving" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="check" size={18} color={COLORS.background} style={{ marginRight: 6 }} />
                    <Text style={styles.pearlBtnText}>Register Customer</Text>
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
  topActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  topTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  pearlBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.background,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  details: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  phone: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  subText: {
    fontSize: 11,
    color: COLORS.primary,
    marginTop: 2,
  },
  balanceCol: {
    alignItems: 'flex-end',
  },
  balanceLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  balanceValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.text,
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
    fontSize: 14,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  modalForm: {
    paddingVertical: 14,
    paddingBottom: 30,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginTop: 10,
    marginBottom: 4,
  },
  modalInput: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: COLORS.text,
    fontSize: 14,
  },
});
