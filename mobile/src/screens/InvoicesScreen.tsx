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
  Share,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { COLORS } from '../constants/theme';
import { API } from '../services/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MobileLoader from '../components/MobileLoader';
import MobilePearlButton from '../components/MobilePearlButton';

interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  paid: number;
  balance: number;
  paymentMode: string;
  createdAt: string;
  customer?: {
    name: string;
    phone: string;
  };
  jobCard?: {
    jobNumber: string;
  };
}

export default function InvoicesScreen() {
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'paid' | 'partial' | 'unpaid'>('all');

  // Modal creation state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [serviceDesc, setServiceDesc] = useState('Vehicle Service & Parts');
  const [laborCharge, setLaborCharge] = useState('600');
  const [partsCharge, setPartsCharge] = useState('400');
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI' | 'CARD'>('UPI');
  const [isPaid, setIsPaid] = useState(true);

  const fetchInvoices = async () => {
    try {
      const data = await API.getInvoices();
      setInvoices(data);
    } catch (e) {
      console.error('Failed to fetch invoices:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchInvoices();
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid': return '#10B981';
      case 'partial': return '#F59E0B';
      case 'unpaid': return '#EF4444';
      default: return COLORS.textMuted;
    }
  };

  const handleOpenPdf = async (invoiceId: string, type: 'INVOICE' | 'ESTIMATE' = 'INVOICE') => {
    try {
      const url = API.getInvoicePdfUrl(invoiceId, type);
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        await Share.share({
          title: `${type} PDF`,
          message: `View your ${type} PDF at: ${url}`,
          url,
        });
      }
    } catch {
      Alert.alert('PDF Viewer', `Opening ${type} PDF: ${API.getInvoicePdfUrl(invoiceId, type)}`);
    }
  };

  const handleCreateInvoice = async () => {
    if (!custName.trim() && !custPhone.trim()) {
      Alert.alert('Validation Error', 'Customer Name or Phone is required.');
      return;
    }

    try {
      setCreating(true);

      // 1. Get or create customer
      const existingCustomers = await API.getCustomers();
      let customerId = '';
      const matched = existingCustomers.find(
        (c: any) => c.phone === custPhone || c.name.toLowerCase() === custName.toLowerCase()
      );

      if (matched) {
        customerId = matched.id;
      } else {
        const user = await API.getDashboardStats();
        const newCustRes = await fetch(`${API.getInvoicePdfUrl('').replace('/pdf/invoice?id=&type=INVOICE', '')}/customers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: custName || 'Walk-in Customer',
            phone: custPhone || '9876543210',
            userId: user?.id,
          }),
        });
        const newCust = await newCustRes.json();
        customerId = newCust.id || existingCustomers[0]?.id;
      }

      const labor = Number.parseFloat(laborCharge) || 0;
      const parts = Number.parseFloat(partsCharge) || 0;
      const subtotal = labor + parts;
      const tax = 0; // Simplified
      const total = subtotal + tax;
      const paid = isPaid ? total : 0;
      const balance = total - paid;

      await API.createInvoice({
        customerId,
        items: [
          {
            description: serviceDesc || 'General Maintenance & Labor',
            quantity: 1,
            unitPrice: labor,
            total: labor,
          },
          ...(parts > 0
            ? [
                {
                  description: 'Replacement Parts & Consumables',
                  quantity: 1,
                  unitPrice: parts,
                  total: parts,
                },
              ]
            : []),
        ],
        subtotal,
        tax,
        total,
        paid,
        balance,
        paymentMode,
      });

      Alert.alert('Success', 'Invoice generated successfully!');
      setIsModalOpen(false);
      setCustName('');
      setCustPhone('');
      await fetchInvoices();
    } catch {
      Alert.alert('Error', 'Failed to generate invoice. Please check connection.');
    } finally {
      setCreating(false);
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      (inv.customer?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (inv.jobCard?.jobNumber || '').toLowerCase().includes(search.toLowerCase());

    const matchesFilter = filter === 'all' || inv.status?.toLowerCase() === filter;
    return matchesSearch && matchesFilter;
  });

  const totalRevenue = invoices.reduce((sum, item) => sum + (item.total || 0), 0);
  const totalPaid = invoices.reduce((sum, item) => sum + (item.paid || 0), 0);
  const totalBalance = invoices.reduce((sum, item) => sum + (item.balance || 0), 0);

  const renderItem = ({ item }: { item: InvoiceItem }) => {
    const statusColor = getStatusColor(item.status);
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.invoiceNumber}>{item.invoiceNumber}</Text>
            <Text style={styles.dateText}>
              {new Date(item.createdAt).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {(item.status || 'UNPAID').toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.customerInfo}>
          <MaterialCommunityIcons name="account-outline" size={16} color={COLORS.primary} />
          <Text style={styles.customerName}>{item.customer?.name || 'Walk-in Customer'}</Text>
          {item.customer?.phone ? (
            <Text style={styles.customerPhone}>({item.customer.phone})</Text>
          ) : null}
        </View>

        {item.jobCard?.jobNumber ? (
          <View style={styles.jobBadgeRow}>
            <MaterialCommunityIcons name="car-wrench" size={14} color={COLORS.textMuted} />
            <Text style={styles.jobBadgeText}>Job Card: {item.jobCard.jobNumber}</Text>
          </View>
        ) : null}

        <View style={styles.amountBreakdown}>
          <View style={styles.amountCol}>
            <Text style={styles.amountLabel}>Total Bill</Text>
            <Text style={styles.amountVal}>₹{(item.total || 0).toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.amountCol}>
            <Text style={styles.amountLabel}>Paid</Text>
            <Text style={[styles.amountVal, { color: '#10B981' }]}>
              ₹{(item.paid || 0).toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={styles.amountCol}>
            <Text style={styles.amountLabel}>Balance</Text>
            <Text style={[styles.amountVal, { color: item.balance > 0 ? '#EF4444' : COLORS.textMuted }]}>
              ₹{(item.balance || 0).toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionBtnSecondary}
            onPress={() => handleOpenPdf(item.id, 'ESTIMATE')}
          >
            <MaterialCommunityIcons name="file-document-outline" size={16} color={COLORS.primary} />
            <Text style={styles.actionBtnSecondaryText}>Estimate PDF</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtnPrimary}
            onPress={() => handleOpenPdf(item.id, 'INVOICE')}
          >
            <MaterialCommunityIcons name="receipt" size={16} color={COLORS.background} />
            <Text style={styles.actionBtnPrimaryText}>Bill PDF</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Header with New Invoice button */}
      <View style={styles.topActions}>
        <Text style={styles.topTitle}>Billing Ledger</Text>
        <MobilePearlButton
          variant="gold"
          onPress={() => setIsModalOpen(true)}
        >
          <MaterialCommunityIcons name="plus" size={18} color={COLORS.background} style={{ marginRight: 4 }} />
          <Text style={styles.pearlBtnText}>New Invoice</Text>
        </MobilePearlButton>
      </View>

      {/* Top Ledger Summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryMetric}>
          <Text style={styles.summaryLabel}>TOTAL BILLED</Text>
          <Text style={styles.summaryVal}>₹{totalRevenue.toLocaleString('en-IN')}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryMetric}>
          <Text style={styles.summaryLabel}>COLLECTED</Text>
          <Text style={[styles.summaryVal, { color: '#10B981' }]}>
            ₹{totalPaid.toLocaleString('en-IN')}
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryMetric}>
          <Text style={styles.summaryLabel}>RECEIVABLE</Text>
          <Text style={[styles.summaryVal, { color: '#EF4444' }]}>
            ₹{totalBalance.toLocaleString('en-IN')}
          </Text>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchBox}>
        <MaterialCommunityIcons name="magnify" size={20} color={COLORS.textMuted} />
        <TextInput
          placeholder="Search by invoice # or customer..."
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
        {(['all', 'paid', 'partial', 'unpaid'] as const).map((tab) => (
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
          <MobileLoader text="Loading Invoices" />
        </View>
      ) : (
        <FlatList
          data={filteredInvoices}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="receipt" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No invoices matching criteria</Text>
            </View>
          }
        />
      )}

      {/* Floating Plus Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setIsModalOpen(true)}
      >
        <MaterialCommunityIcons name="plus" size={28} color={COLORS.background} />
      </TouchableOpacity>

      {/* New Invoice & Estimate Modal */}
      <Modal
        visible={isModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Generate New Bill / Invoice</Text>
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

              <Text style={styles.inputLabel}>Customer Phone Number</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. 9876543210"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="phone-pad"
                value={custPhone}
                onChangeText={setCustPhone}
              />

              <Text style={styles.inputLabel}>Service / Repair Description</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="General Service & Diagnostic"
                placeholderTextColor={COLORS.textMuted}
                value={serviceDesc}
                onChangeText={setServiceDesc}
              />

              <View style={styles.twoColRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Labor Amount (₹)</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="600"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="numeric"
                    value={laborCharge}
                    onChangeText={setLaborCharge}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Parts Amount (₹)</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="400"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="numeric"
                    value={partsCharge}
                    onChangeText={setPartsCharge}
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Payment Mode</Text>
              <View style={styles.modeRow}>
                {(['UPI', 'CASH', 'CARD'] as const).map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[
                      styles.modePill,
                      paymentMode === m && styles.modePillActive,
                    ]}
                    onPress={() => setPaymentMode(m)}
                  >
                    <Text
                      style={[
                        styles.modeText,
                        paymentMode === m && styles.modeTextActive,
                      ]}
                    >
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setIsPaid(!isPaid)}
              >
                <MaterialCommunityIcons
                  name={isPaid ? 'checkbox-marked' : 'checkbox-blank-outline'}
                  size={22}
                  color={isPaid ? COLORS.primary : COLORS.textMuted}
                />
                <Text style={styles.checkboxLabel}>Mark Bill as Paid Immediately</Text>
              </TouchableOpacity>

              <MobilePearlButton
                variant="gold"
                onPress={handleCreateInvoice}
                style={{ marginTop: 20 }}
              >
                {creating ? (
                  <MobileLoader text="Creating" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="receipt" size={18} color={COLORS.background} style={{ marginRight: 6 }} />
                    <Text style={styles.pearlBtnText}>Generate Invoice & PDF</Text>
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
  summaryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 10,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryMetric: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  summaryVal: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: COLORS.border,
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
    fontSize: 11,
    fontWeight: '600',
  },
  filterTabTextActive: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  list: {
    padding: 16,
    paddingTop: 4,
    paddingBottom: 80,
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
  invoiceNumber: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  dateText: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  customerName: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  customerPhone: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginLeft: 4,
  },
  jobBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  jobBadgeText: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginLeft: 6,
  },
  amountBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
  },
  amountCol: {
    alignItems: 'center',
  },
  amountLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  amountVal: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  actionBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  actionBtnSecondaryText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  actionBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
  },
  actionBtnPrimaryText: {
    color: COLORS.background,
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  twoColRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  modePill: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modePillActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(201, 168, 76, 0.15)',
  },
  modeText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  modeTextActive: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    gap: 8,
  },
  checkboxLabel: {
    color: COLORS.text,
    fontSize: 13,
  },
});
