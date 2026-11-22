import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  RefreshControl,
} from 'react-native';
import { COLORS } from '../constants/theme';
import { API, Storage } from '../services/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MobileLoader from '../components/MobileLoader';
import MobilePearlButton from '../components/MobilePearlButton';

const EXPENSE_CATEGORIES = [
  'Spare Parts Purchase',
  'Mechanic & Staff Salaries',
  'Shop Rent & Maintenance',
  'Electricity & Utilities',
  'Workshop Tools & Hardware',
  'Oils & Consumables',
  'Tea & Refreshments',
  'Miscellaneous',
];

const INCOME_CATEGORIES = [
  'Workshop Service Bill',
  'Direct Counter Sale',
  'Scrap / Battery Sale',
  'Vehicle Detailing',
  'Miscellaneous',
];

export default function LedgerScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ledgerData, setLedgerData] = useState<any>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [entryType, setEntryType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('cash');
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchLedger = async () => {
    try {
      setLoading(true);
      const res = await API.getLedger('this_month');
      setLedgerData(res);
    } catch (e) {
      console.error('Error fetching ledger in mobile:', e);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLedger();
    setRefreshing(false);
  };

  useEffect(() => {
    void fetchLedger();
  }, []);

  const handleOpenModal = (type: 'INCOME' | 'EXPENSE') => {
    setEntryType(type);
    setCategory(type === 'INCOME' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
    setAmount('');
    setPaymentMode('cash');
    setDescription('');
    setReference('');
    setIsModalOpen(true);
  };

  const handleSaveEntry = async () => {
    const num = Number(amount);
    if (!num || num <= 0) {
      Alert.alert('Required', 'Please enter a valid amount.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Required', 'Please enter a description for this entry.');
      return;
    }

    try {
      setSaving(true);
      const res = await API.createLedgerEntry({
        type: entryType,
        category,
        amount: num,
        paymentMode,
        description: description.trim(),
        reference: reference.trim() || undefined,
      });

      if (res.id) {
        Alert.alert('Success', `${entryType === 'INCOME' ? 'Income' : 'Expense'} recorded!`);
        setIsModalOpen(false);
        await fetchLedger();
      } else {
        Alert.alert('Error', res.error || 'Failed to save ledger entry.');
      }
    } catch {
      Alert.alert('Error', 'Network error saving ledger entry.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string, desc: string) => {
    Alert.alert('Delete Entry', `Are you sure you want to delete "${desc}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await API.deleteLedgerEntry(id);
            await fetchLedger();
          } catch {
            Alert.alert('Error', 'Failed to delete ledger entry.');
          }
        },
      },
    ]);
  };

  const summary = ledgerData?.summary || {
    grossTotalRevenue: 0,
    directExpense: 0,
    netOperatingProfit: 0,
    invoicedRevenue: 0,
    directIncome: 0,
  };

  const entries = ledgerData?.entries || [];

  return (
    <View style={styles.container}>
      {/* Header Summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryTop}>
          <View>
            <Text style={styles.summaryLabel}>NET OPERATING PROFIT</Text>
            <Text
              style={[
                styles.summaryValue,
                { color: summary.netOperatingProfit >= 0 ? COLORS.geekLime : '#EF4444' },
              ]}
            >
              ₹{summary.netOperatingProfit.toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={styles.badgeLive}>
            <Text style={styles.badgeLiveText}>THIS MONTH</Text>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Text style={styles.metricItemLabel}>GROSS REVENUE</Text>
            <Text style={[styles.metricItemValue, { color: '#10B981' }]}>
              +₹{summary.grossTotalRevenue.toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={styles.metricItemLabel}>EXPENSES</Text>
            <Text style={[styles.metricItemValue, { color: COLORS.garageOrange }]}>
              -₹{summary.directExpense.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: COLORS.garageOrange }]}
          onPress={() => handleOpenModal('EXPENSE')}
        >
          <MaterialCommunityIcons name="arrow-top-right" size={18} color="#FFFFFF" />
          <Text style={styles.actionBtnText}>- Record Expense</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#10B981' }]}
          onPress={() => handleOpenModal('INCOME')}
        >
          <MaterialCommunityIcons name="arrow-bottom-left" size={18} color="#0B0F19" />
          <Text style={[styles.actionBtnText, { color: '#0B0F19' }]}>+ Record Income</Text>
        </TouchableOpacity>
      </View>

      {/* Entries List */}
      <ScrollView
        style={styles.scrollList}
        contentContainerStyle={{ paddingBottom: 30 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        <Text style={styles.listSectionTitle}>Ledger Entries ({entries.length})</Text>

        {loading ? (
          <View style={{ paddingVertical: 40 }}>
            <MobileLoader text="Loading Ledger" />
          </View>
        ) : entries.length > 0 ? (
          entries.map((item: any) => {
            const isIncome = item.type === 'INCOME';
            return (
              <View key={item.id} style={styles.entryCard}>
                <View style={styles.entryLeft}>
                  <View
                    style={[
                      styles.iconWrap,
                      {
                        backgroundColor: isIncome
                          ? 'rgba(16, 185, 129, 0.15)'
                          : 'rgba(255, 94, 20, 0.15)',
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={isIncome ? 'arrow-bottom-left' : 'arrow-top-right'}
                      size={18}
                      color={isIncome ? '#10B981' : COLORS.garageOrange}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.entryDesc}>{item.description}</Text>
                    <Text style={styles.entrySub}>
                      {item.category} · {(item.paymentMode || 'cash').toUpperCase()}
                    </Text>
                    <Text style={styles.entryDate}>
                      {new Date(item.date).toLocaleDateString('en-IN')}
                      {item.reference ? ` · Ref: ${item.reference}` : ''}
                    </Text>
                  </View>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text
                    style={[
                      styles.entryAmount,
                      { color: isIncome ? '#10B981' : COLORS.garageOrange },
                    ]}
                  >
                    {isIncome ? '+' : '-'}₹{item.amount.toLocaleString('en-IN')}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleDelete(item.id, item.description)}
                    style={{ padding: 4, marginTop: 4 }}
                  >
                    <MaterialCommunityIcons name="trash-can-outline" size={16} color={COLORS.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyWrap}>
            <MaterialCommunityIcons name="book-open-page-variant-outline" size={36} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No ledger entries recorded this month.</Text>
          </View>
        )}
      </ScrollView>

      {/* Record Entry Modal */}
      <Modal visible={isModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {entryType === 'INCOME' ? '+ Record Operating Income' : '- Record Workshop Expense'}
              </Text>
              <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                <MaterialCommunityIcons name="close" size={22} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }}>
              <Text style={styles.inputLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {(entryType === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.catPill, category === cat && styles.catPillActive]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text
                      style={[styles.catPillText, category === cat && styles.catPillTextActive]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.inputLabel}>Amount (₹)</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />

              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Engine oil stock, Shop rent"
                placeholderTextColor={COLORS.textMuted}
                value={description}
                onChangeText={setDescription}
              />

              <Text style={styles.inputLabel}>Payment Mode</Text>
              <View style={styles.modeRow}>
                {['cash', 'upi', 'bank'].map((mode) => (
                  <TouchableOpacity
                    key={mode}
                    style={[styles.modeBtn, paymentMode === mode && styles.modeBtnActive]}
                    onPress={() => setPaymentMode(mode)}
                  >
                    <Text
                      style={[
                        styles.modeBtnText,
                        paymentMode === mode && styles.modeBtnTextActive,
                      ]}
                    >
                      {mode.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Voucher / Bill Reference (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. VCH-102 or UPI Txn ID"
                placeholderTextColor={COLORS.textMuted}
                value={reference}
                onChangeText={setReference}
              />
            </ScrollView>

            <MobilePearlButton
              variant="gold"
              onPress={handleSaveEntry}
              style={{ marginTop: 14 }}
            >
              <Text style={{ color: COLORS.background, fontWeight: 'bold' }}>
                {saving ? 'Saving...' : 'Save Entry'}
              </Text>
            </MobilePearlButton>
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
    padding: 16,
  },
  summaryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(201, 243, 29, 0.3)',
    marginBottom: 14,
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    letterSpacing: 1,
  },
  summaryValue: {
    fontSize: 26,
    fontWeight: 'bold',
    marginTop: 4,
  },
  badgeLive: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(201, 243, 29, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(201, 243, 29, 0.3)',
  },
  badgeLiveText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.geekLime,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  metricItem: {
    flex: 1,
  },
  metricItemLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  metricItemValue: {
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.border,
    marginHorizontal: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scrollList: {
    flex: 1,
  },
  listSectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  entryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  entryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryDesc: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  entrySub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  entryDate: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  entryAmount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(201, 243, 29, 0.4)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    height: 44,
    color: COLORS.text,
    fontSize: 13,
    marginBottom: 12,
  },
  catPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 6,
  },
  catPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  catPillText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  catPillTextActive: {
    color: COLORS.background,
    fontWeight: 'bold',
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  modeBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  modeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  modeBtnTextActive: {
    color: COLORS.background,
  },
});
