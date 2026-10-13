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
} from 'react-native';
import { COLORS } from '../constants/theme';
import { API } from '../services/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MobileLoader from '../components/MobileLoader';

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

  return (
    <View style={styles.container}>
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
});
