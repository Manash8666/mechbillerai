import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { COLORS } from '../constants/theme';
import { API } from '../services/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MobileLoader from '../components/MobileLoader';
import MobilePearlButton from '../components/MobilePearlButton';

interface InventoryItem {
  id: string;
  name: string;
  code: string;
  category: string;
  quantity: number;
  unit: string;
  minQuantity: number;
  costPrice: number;
  sellingPrice: number;
  gstRate: number;
  location?: string;
  supplier?: string;
}

export default function InventoryScreen() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'instock'>('all');

  // Add Part Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [partName, setPartName] = useState('');
  const [partCode, setPartCode] = useState('');
  const [partCategory, setPartCategory] = useState('Lubricants');
  const [partQty, setPartQty] = useState('10');
  const [costPrice, setCostPrice] = useState('350');
  const [sellingPrice, setSellingPrice] = useState('500');

  const fetchInventory = async () => {
    try {
      const data = await API.getInventory();
      setItems(data);
    } catch (e) {
      console.error('Failed to fetch inventory:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchInventory();
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity === 0) return { label: 'OUT OF STOCK', color: '#EF4444' };
    if (item.quantity < item.minQuantity) return { label: 'LOW STOCK', color: '#F59E0B' };
    return { label: 'IN STOCK', color: '#10B981' };
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.code.toLowerCase().includes(search.toLowerCase()) ||
      (item.category || '').toLowerCase().includes(search.toLowerCase());

    const status = getStockStatus(item).label;
    const matchesStock =
      stockFilter === 'all' ||
      (stockFilter === 'low' && (status === 'LOW STOCK' || status === 'OUT OF STOCK')) ||
      (stockFilter === 'instock' && status === 'IN STOCK');

    return matchesSearch && matchesStock;
  });

  const totalSKUs = items.length;
  const lowStockCount = items.filter(
    (i) => i.quantity <= i.minQuantity
  ).length;
  const totalStockValue = items.reduce(
    (sum, i) => sum + (i.quantity * (i.costPrice || i.sellingPrice || 0)),
    0
  );

  const renderItem = ({ item }: { item: InventoryItem }) => {
    const status = getStockStatus(item);
    const margin =
      item.costPrice > 0
        ? (((item.sellingPrice - item.costPrice) / item.costPrice) * 100).toFixed(0)
        : '0';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemCode}>
              SKU: {item.code} · {item.category || 'General'}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${status.color}20` }]}>
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricBlock}>
            <Text style={styles.metricLabel}>ON HAND</Text>
            <Text style={[styles.metricVal, { color: status.color }]}>
              {item.quantity} {item.unit || 'pcs'}
            </Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricBlock}>
            <Text style={styles.metricLabel}>SELLING PRICE</Text>
            <Text style={styles.metricVal}>₹{(item.sellingPrice || 0).toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricBlock}>
            <Text style={styles.metricLabel}>MARGIN</Text>
            <Text style={[styles.metricVal, { color: COLORS.primary }]}>+{margin}%</Text>
          </View>
        </View>

        {(item.location || item.supplier) && (
          <View style={styles.cardFooter}>
            {item.location ? (
              <View style={styles.tag}>
                <MaterialCommunityIcons name="map-marker-outline" size={13} color={COLORS.textMuted} />
                <Text style={styles.tagText}>Bay: {item.location}</Text>
              </View>
            ) : null}
            {item.supplier ? (
              <View style={styles.tag}>
                <MaterialCommunityIcons name="truck-outline" size={13} color={COLORS.textMuted} />
                <Text style={styles.tagText}>{item.supplier}</Text>
              </View>
            ) : null}
          </View>
        )}
      </View>
    );
  };

  const handleCreatePart = async () => {
    if (!partName.trim() || !partCode.trim()) {
      Alert.alert('Required', 'Part Name and SKU/Code are required.');
      return;
    }

    try {
      setSaving(true);
      await API.createInventoryItem({
        name: partName.trim(),
        code: partCode.trim().toUpperCase(),
        category: partCategory,
        quantity: parseInt(partQty) || 1,
        unit: 'Pcs',
        minQuantity: 2,
        costPrice: parseFloat(costPrice) || 0,
        sellingPrice: parseFloat(sellingPrice) || 0,
        gstRate: 18,
      });

      Alert.alert('Success', `Part "${partName}" added to inventory.`);
      setIsModalOpen(false);
      setPartName('');
      setPartCode('');
      fetchInventory();
    } catch {
      Alert.alert('Error', 'Failed to save inventory part.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header with Add Part button */}
      <View style={styles.topActions}>
        <Text style={styles.topTitle}>Parts Inventory</Text>
        <MobilePearlButton
          variant="gold"
          onPress={() => setIsModalOpen(true)}
        >
          <MaterialCommunityIcons name="plus" size={18} color={COLORS.background} style={{ marginRight: 4 }} />
          <Text style={styles.pearlBtnText}>Add Part</Text>
        </MobilePearlButton>
      </View>

      {/* Inventory Summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryMetric}>
          <Text style={styles.summaryLabel}>TOTAL SKUS</Text>
          <Text style={styles.summaryVal}>{totalSKUs}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryMetric}>
          <Text style={styles.summaryLabel}>LOW STOCK</Text>
          <Text style={[styles.summaryVal, { color: lowStockCount > 0 ? '#EF4444' : '#10B981' }]}>
            {lowStockCount}
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryMetric}>
          <Text style={styles.summaryLabel}>INVENTORY VALUE</Text>
          <Text style={styles.summaryVal}>₹{totalStockValue.toLocaleString('en-IN')}</Text>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchBox}>
        <MaterialCommunityIcons name="magnify" size={20} color={COLORS.textMuted} />
        <TextInput
          placeholder="Search parts, sku, category..."
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
        {(['all', 'low', 'instock'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.filterTab, stockFilter === tab && styles.filterTabActive]}
            onPress={() => setStockFilter(tab)}
          >
            <Text style={[styles.filterTabText, stockFilter === tab && styles.filterTabTextActive]}>
              {tab === 'all' ? 'ALL PARTS' : tab === 'low' ? 'LOW STOCK' : 'IN STOCK'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <MobileLoader text="Loading Inventory" />
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="package-variant" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No inventory parts match</Text>
            </View>
          }
        />
      )}

      {/* Add Part Modal */}
      <Modal
        visible={isModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Part / Item</Text>
              <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                <MaterialCommunityIcons name="close" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalForm}>
              <Text style={styles.inputLabel}>Item Name *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. 10W-40 Synthetic Engine Oil"
                placeholderTextColor={COLORS.textMuted}
                value={partName}
                onChangeText={setPartName}
              />

              <Text style={styles.inputLabel}>SKU / Code *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. OIL-MOTUL-10W40"
                placeholderTextColor={COLORS.textMuted}
                value={partCode}
                onChangeText={setPartCode}
                autoCapitalize="characters"
              />

              <Text style={styles.inputLabel}>Category</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Lubricants / Filters / Brakes / Electrical"
                placeholderTextColor={COLORS.textMuted}
                value={partCategory}
                onChangeText={setPartCategory}
              />

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Initial Stock Qty</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="10"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="numeric"
                    value={partQty}
                    onChangeText={setPartQty}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Cost Price (₹)</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="350"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="numeric"
                    value={costPrice}
                    onChangeText={setCostPrice}
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Selling Price (₹)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="500"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="numeric"
                value={sellingPrice}
                onChangeText={setSellingPrice}
              />

              <MobilePearlButton
                variant="gold"
                onPress={handleCreatePart}
                style={{ marginTop: 20 }}
              >
                {saving ? (
                  <MobileLoader text="Adding..." />
                ) : (
                  <>
                    <MaterialCommunityIcons name="check-circle-outline" size={18} color={COLORS.background} style={{ marginRight: 6 }} />
                    <Text style={styles.pearlBtnText}>Save to Inventory</Text>
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
  summaryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginTop: 14,
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
  itemName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: 'bold',
  },
  itemCode: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
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
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
  },
  metricBlock: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: 'bold',
  },
  metricVal: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    backgroundColor: COLORS.border,
  },
  cardFooter: {
    flexDirection: 'row',
    gap: 10,
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
