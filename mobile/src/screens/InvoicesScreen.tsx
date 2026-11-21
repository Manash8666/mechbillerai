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
  Platform,
} from 'react-native';
import { COLORS } from '../constants/theme';
import { API } from '../services/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MobileLoader from '../components/MobileLoader';
import MobilePearlButton from '../components/MobilePearlButton';

interface LineItem {
  id: string;
  description: string;
  category: 'part' | 'labor';
  quantity: number;
  unitPrice: number;
  total: number;
}

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

const COMMON_SPARE_PARTS = [
  { name: 'Motul 15W50 3100 Semi-Synthetic (1.5L)', category: 'part' as const, rate: 1050 },
  { name: 'Front Disc Brake Pads OEM', category: 'part' as const, rate: 450 },
  { name: 'Rear Drum / Disc Brake Shoe', category: 'part' as const, rate: 380 },
  { name: 'Spark Plug NGK Laser Iridium', category: 'part' as const, rate: 220 },
  { name: 'Air Filter Element Paper/Foam', category: 'part' as const, rate: 280 },
  { name: 'Engine Oil Filter Cartridge', category: 'part' as const, rate: 140 },
  { name: 'Drive Chain Clean & Lube (Motul)', category: 'labor' as const, rate: 250 },
  { name: 'Engine Overhaul & Rebuild Labor', category: 'labor' as const, rate: 1800 },
  { name: 'General Periodic Maintenance Labor', category: 'labor' as const, rate: 600 },
];

export default function InvoicesScreen() {
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'paid' | 'partial' | 'unpaid'>('all');

  // Modal creation state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [docType, setDocType] = useState<'SOW_BILL' | 'SOW_ESTIMATE'>('SOW_BILL');
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [vehicleModel, setVehicleModel] = useState('Royal Enfield Classic 350');
  const [vehicleReg, setVehicleReg] = useState('');
  const [serviceScope, setServiceScope] = useState('Classic 350 Overhaul & Service');

  // Line items state
  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      id: '1',
      description: 'General Service & Precision Inspection',
      category: 'labor',
      quantity: 1,
      unitPrice: 600,
      total: 600,
    },
    {
      id: '2',
      description: 'Motul 15W50 3100 Engine Oil (1.5L)',
      category: 'part',
      quantity: 1,
      unitPrice: 1050,
      total: 1050,
    },
  ]);

  // Custom Item creation inline form
  const [showCustomItemForm, setShowCustomItemForm] = useState(false);
  const [customDesc, setCustomDesc] = useState('');
  const [customCategory, setCustomCategory] = useState<'part' | 'labor'>('part');
  const [customQty, setCustomQty] = useState('1');
  const [customRate, setCustomRate] = useState('');

  // Inventory picker modal
  const [isInventoryPickerOpen, setIsInventoryPickerOpen] = useState(false);

  // Payment terms during creation
  const [paymentType, setPaymentType] = useState<'full' | 'partial' | 'unpaid'>('full');
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI' | 'CARD'>('UPI');
  const [branding, setBranding] = useState<any>(null);

  // Collect Payment Modal state (for Unpaid / Partial bills later)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceItem | null>(null);
  const [collectAmount, setCollectAmount] = useState('');
  const [collectMode, setCollectMode] = useState<'UPI' | 'CASH' | 'CARD' | 'BANK'>('UPI');
  const [collectDate, setCollectDate] = useState('');
  const [collectNotes, setCollectNotes] = useState('');
  const [collecting, setCollecting] = useState(false);

  const fetchInvoices = async () => {
    try {
      const data = await API.getInvoices();
      setInvoices(data);
      API.getBranding().then(setBranding).catch(() => {});
      API.getInventory().then(setInventory).catch(() => {});
    } catch (e) {
      console.error('Failed to fetch invoices:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchInvoices();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    void fetchInvoices();
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return '#10B981';
      case 'partial':
        return '#F59E0B';
      case 'unpaid':
        return '#EF4444';
      default:
        return COLORS.textMuted;
    }
  };

  const handleOpenPdf = async (
    invoiceId: string,
    type: 'INVOICE' | 'ESTIMATE' | 'SOW_BILL' | 'SOW_ESTIMATE' = 'INVOICE'
  ) => {
    const label = type.includes('SOW') ? 'Scope of Work (SOW) Bill' : `${type} PDF`;
    try {
      const url = API.getInvoicePdfUrl(invoiceId, type);
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        await Share.share({
          title: label,
          message: `View your ${label} at: ${url}`,
          url,
        });
      }
    } catch {
      Alert.alert('PDF Viewer', `Opening ${label}: ${API.getInvoicePdfUrl(invoiceId, type)}`);
    }
  };

  // Line item manipulation
  const handleAddPredefinedPart = (name: string, category: 'part' | 'labor', rate: number) => {
    const newItem: LineItem = {
      id: Date.now().toString() + Math.random().toString().slice(2, 6),
      description: name,
      category,
      quantity: 1,
      unitPrice: rate,
      total: rate,
    };
    setLineItems((prev) => [...prev, newItem]);
  };

  const handleAddCustomItem = () => {
    if (!customDesc.trim()) {
      Alert.alert('Required', 'Please enter item or spare part description.');
      return;
    }
    const rate = Number.parseFloat(customRate) || 0;
    const qty = Number.parseFloat(customQty) || 1;
    const newItem: LineItem = {
      id: Date.now().toString(),
      description: customDesc.trim(),
      category: customCategory,
      quantity: qty,
      unitPrice: rate,
      total: qty * rate,
    };
    setLineItems((prev) => [...prev, newItem]);
    setCustomDesc('');
    setCustomRate('');
    setCustomQty('1');
    setShowCustomItemForm(false);
  };

  const handleRemoveLineItem = (id: string) => {
    setLineItems((prev) => prev.filter((it) => it.id !== id));
  };

  // Calculations
  const calculatedSubtotal = lineItems.reduce((acc, it) => acc + (it.total || 0), 0);
  const partsSubtotal = lineItems
    .filter((it) => it.category === 'part')
    .reduce((acc, it) => acc + (it.total || 0), 0);
  const laborSubtotal = lineItems
    .filter((it) => it.category === 'labor')
    .reduce((acc, it) => acc + (it.total || 0), 0);

  // Create Bill / Estimate
  const handleCreateInvoice = async () => {
    if (!custName.trim() && !custPhone.trim()) {
      Alert.alert('Validation Error', 'Customer Name or Phone is required.');
      return;
    }
    if (lineItems.length === 0) {
      Alert.alert('Empty Bill', 'Please add at least one spare part or labor charge.');
      return;
    }

    try {
      setCreating(true);

      // 1. Get or create customer
      const existingCustomers = await API.getCustomers();
      let customerId = '';
      const matched = existingCustomers.find(
        (c: any) =>
          (custPhone.trim() && c.phone === custPhone.trim()) ||
          (custName.trim() && c.name?.toLowerCase() === custName.trim().toLowerCase())
      );

      if (matched) {
        customerId = matched.id;
      } else {
        const newCust = await API.createCustomer({
          name: custName.trim() || 'Walk-in Customer',
          phone: custPhone.trim() || 'N/A',
        });
        customerId = newCust.id || existingCustomers[0]?.id;
      }

      const total = calculatedSubtotal;
      let paid = 0;
      if (paymentType === 'full') {
        paid = total;
      } else if (paymentType === 'partial') {
        paid = Math.min(total, Number.parseFloat(advanceAmount) || 0);
      } else {
        paid = 0; // Unpaid / Credit
      }
      const balance = Math.max(0, total - paid);

      const isEstimate = docType === 'SOW_ESTIMATE';

      const notesPayload = JSON.stringify({
        vehicleModel: vehicleModel.trim() || undefined,
        vehicleReg: vehicleReg.trim().toUpperCase() || undefined,
        serviceScope: serviceScope.trim() || undefined,
      });

      await API.createInvoice({
        customerId,
        isEstimate,
        docType: isEstimate ? 'ESTIMATE' : 'INVOICE',
        items: lineItems.map((it) => ({
          description: it.description,
          category: it.category,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          total: it.total,
        })),
        subtotal: total,
        tax: 0,
        total,
        paid,
        balance,
        paymentMode,
        notes: notesPayload,
      });

      Alert.alert(
        'Success',
        `${isEstimate ? 'SoW Estimate' : 'SoW Bill'} created successfully!`
      );
      setIsModalOpen(false);
      setCustName('');
      setCustPhone('');
      setVehicleReg('');
      setAdvanceAmount('');
      setPaymentType('full');
      await fetchInvoices();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to generate bill.');
    } finally {
      setCreating(false);
    }
  };

  // Payment Recording Modal (For bills unpaid or marked partial, collected after 1-2-3 months)
  const handleOpenPaymentModal = (item: InvoiceItem) => {
    setSelectedInvoice(item);
    setCollectAmount(String(item.balance || ''));
    setCollectMode('UPI');
    const today = new Date().toISOString().split('T')[0];
    setCollectDate(today);
    setCollectNotes('');
    setIsPaymentModalOpen(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedInvoice) return;
    const amount = Number.parseFloat(collectAmount);
    if (!amount || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid payment amount.');
      return;
    }

    try {
      setCollecting(true);
      await API.recordPayment(selectedInvoice.id, {
        amount,
        paymentMode: collectMode,
        notes: collectNotes || `Settled via ${collectMode}`,
      });

      Alert.alert(
        'Payment Recorded! 🎉',
        `₹${amount.toLocaleString('en-IN')} recorded for #${selectedInvoice.invoiceNumber}. Balance updated & logged in Daily Ledger.`
      );
      setIsPaymentModalOpen(false);
      setSelectedInvoice(null);
      await fetchInvoices();
    } catch (err: any) {
      Alert.alert('Error Recording Payment', err?.message || 'Failed to save payment.');
    } finally {
      setCollecting(false);
    }
  };

  const handleShareWhatsApp = async (item: InvoiceItem) => {
    try {
      const { launchWhatsAppBill } = await import('../services/payments');
      const pdfUrl = API.getInvoicePdfUrl(item.id, 'INVOICE', (item as any).secureToken);
      await launchWhatsAppBill({
        phone: item.customer?.phone || '',
        customerName: item.customer?.name || 'Valued Customer',
        vehicleNumber: (item.jobCard as any)?.vehicle?.registrationNo || undefined,
        invoiceNumber: item.invoiceNumber,
        totalAmount: item.total || 0,
        paidAmount: item.paid || 0,
        balanceAmount: item.balance || 0,
        garageName: branding?.garageName || 'MotoFit Workshop',
        invoiceUrl: pdfUrl,
      });
    } catch (err: any) {
      Alert.alert('WhatsApp Error', err.message || 'Could not launch WhatsApp.');
    }
  };

  const handleThermalPrint = async (item: InvoiceItem) => {
    try {
      const { printOrShareReceipt } = await import('../services/thermalPrinter');
      await printOrShareReceipt({
        workshopName: branding?.garageName || 'MotoFit Workshop',
        tagline: branding?.tagline || 'Automotive Care & Precision Engineering',
        phone: branding?.phone || '6359635416',
        invoiceNumber: item.invoiceNumber,
        date: new Date(item.createdAt).toLocaleDateString('en-IN'),
        customerName: item.customer?.name || 'Walk-in Customer',
        customerPhone: item.customer?.phone,
        vehicleNumber: (item.jobCard as any)?.vehicle?.registrationNo,
        items: [
          {
            description: 'Automotive Spares & Precision Service',
            qty: 1,
            amount: item.subtotal || item.total || 0,
          },
        ],
        subtotal: item.subtotal || item.total || 0,
        cgst: item.tax ? item.tax / 2 : undefined,
        sgst: item.tax ? item.tax / 2 : undefined,
        total: item.total || 0,
        paid: item.paid || 0,
        balance: item.balance || 0,
        paymentMode: item.paymentMode,
        upiVpa: branding?.upiId || '',
      });
    } catch (err: any) {
      Alert.alert('Printer Error', err.message || 'Could not print thermal receipt.');
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
        {/* Card Header */}
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
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}22` }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {(item.status || 'UNPAID').toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Customer Info */}
        <View style={styles.customerInfo}>
          <MaterialCommunityIcons name="account-outline" size={15} color={COLORS.primary} />
          <Text style={styles.customerName}>{item.customer?.name || 'Walk-in Customer'}</Text>
          {item.customer?.phone ? (
            <Text style={styles.customerPhone}>({item.customer.phone})</Text>
          ) : null}
        </View>

        {item.jobCard?.jobNumber ? (
          <View style={styles.jobBadgeRow}>
            <MaterialCommunityIcons name="car-wrench" size={13} color={COLORS.textMuted} />
            <Text style={styles.jobBadgeText}>Job Card: {item.jobCard.jobNumber}</Text>
          </View>
        ) : null}

        {/* Financial Breakdown */}
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
            <Text
              style={[
                styles.amountVal,
                { color: item.balance > 0 ? '#EF4444' : COLORS.textMuted },
              ]}
            >
              ₹{(item.balance || 0).toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        {/* Payment Action Row: Collect / Record Payment if unpaid or partially paid */}
        {item.balance > 0 ? (
          <TouchableOpacity
            style={styles.recordPaymentBanner}
            onPress={() => handleOpenPaymentModal(item)}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="cash-register" size={16} color="#0B0F19" />
            <Text style={styles.recordPaymentBannerText}>
              Collect Payment • ₹{item.balance.toLocaleString('en-IN')} Due
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={16} color="#0B0F19" />
          </TouchableOpacity>
        ) : (
          <View style={styles.paidInFullBanner}>
            <MaterialCommunityIcons name="check-decagram" size={14} color="#10B981" />
            <Text style={styles.paidInFullText}>Fully Settled & Paid</Text>
          </View>
        )}

        {/* Balanced 4-Grid Action Row (WhatsApp, Slip, SOW, PDF) */}
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionBtnWhatsApp}
            onPress={() => handleShareWhatsApp(item)}
          >
            <MaterialCommunityIcons name="whatsapp" size={13} color="#25D366" />
            <Text style={styles.actionBtnWhatsAppText}>WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtnSecondary} onPress={() => handleThermalPrint(item)}>
            <MaterialCommunityIcons name="printer-pos" size={13} color={COLORS.primary} />
            <Text style={styles.actionBtnSecondaryText}>Slip</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtnSow}
            onPress={() => handleOpenPdf(item.id, 'SOW_BILL')}
          >
            <MaterialCommunityIcons name="auto-fix" size={13} color="#A78BFA" />
            <Text style={styles.actionBtnSowText}>SOW</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtnPrimary}
            onPress={() => handleOpenPdf(item.id, 'INVOICE')}
          >
            <MaterialCommunityIcons name="receipt" size={13} color={COLORS.background} />
            <Text style={styles.actionBtnPrimaryText}>PDF</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Header with New Bill button */}
      <View style={styles.topActions}>
        <Text style={styles.topTitle}>Billing Ledger</Text>
        <MobilePearlButton variant="gold" onPress={() => setIsModalOpen(true)}>
          <MaterialCommunityIcons
            name="plus"
            size={18}
            color={COLORS.background}
            style={{ marginRight: 4 }}
          />
          <Text style={styles.pearlBtnText}>New Bill / Estimate</Text>
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

      {/* Floating Action Button - Positioned above 60px bottom tab bar */}
      <TouchableOpacity style={styles.fab} onPress={() => setIsModalOpen(true)}>
        <MaterialCommunityIcons name="plus" size={28} color={COLORS.background} />
      </TouchableOpacity>

      {/* 1. Modal: Full SoW Bill & Estimate Generator with Line Items & Spare Parts */}
      <Modal
        visible={isModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Generate SoW Bill / Estimate</Text>
                <Text style={styles.modalSubtitle}>With Line-Item Spare Parts & Technical Breakdown</Text>
              </View>
              <TouchableOpacity onPress={() => setIsModalOpen(false)} style={styles.closeBtn}>
                <MaterialCommunityIcons name="close" size={22} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalForm} showsVerticalScrollIndicator={false}>
              {/* Document Type Selector: SoW Bill vs SoW Estimate */}
              <View style={styles.docTypeToggleRow}>
                <TouchableOpacity
                  style={[
                    styles.docTypeBtn,
                    docType === 'SOW_BILL' && styles.docTypeBtnActiveBill,
                  ]}
                  onPress={() => setDocType('SOW_BILL')}
                >
                  <MaterialCommunityIcons
                    name="file-document-outline"
                    size={16}
                    color={docType === 'SOW_BILL' ? '#0B0F19' : COLORS.textMuted}
                  />
                  <Text
                    style={[
                      styles.docTypeBtnText,
                      docType === 'SOW_BILL' && styles.docTypeBtnTextActive,
                    ]}
                  >
                    SoW Bill (Tax Invoice)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.docTypeBtn,
                    docType === 'SOW_ESTIMATE' && styles.docTypeBtnActiveEstimate,
                  ]}
                  onPress={() => setDocType('SOW_ESTIMATE')}
                >
                  <MaterialCommunityIcons
                    name="calculator-variant-outline"
                    size={16}
                    color={docType === 'SOW_ESTIMATE' ? '#0B0F19' : COLORS.textMuted}
                  />
                  <Text
                    style={[
                      styles.docTypeBtnText,
                      docType === 'SOW_ESTIMATE' && styles.docTypeBtnTextActive,
                    ]}
                  >
                    SoW Estimate (Quote)
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Customer Details */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionHeader}>Customer & Vehicle Details</Text>
                <View style={styles.twoColRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Customer Name *</Text>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="e.g. Ramesh Patel"
                      placeholderTextColor={COLORS.textMuted}
                      value={custName}
                      onChangeText={setCustName}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Phone Number *</Text>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="e.g. 9876543210"
                      placeholderTextColor={COLORS.textMuted}
                      keyboardType="phone-pad"
                      value={custPhone}
                      onChangeText={setCustPhone}
                    />
                  </View>
                </View>

                <View style={styles.twoColRow}>
                  <View style={{ flex: 1.2 }}>
                    <Text style={styles.inputLabel}>Vehicle Make & Model</Text>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="e.g. Classic 350 / Activa 6G"
                      placeholderTextColor={COLORS.textMuted}
                      value={vehicleModel}
                      onChangeText={setVehicleModel}
                    />
                  </View>
                  <View style={{ flex: 0.8 }}>
                    <Text style={styles.inputLabel}>Vehicle Reg No.</Text>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="e.g. GJ01AB1234"
                      placeholderTextColor={COLORS.textMuted}
                      autoCapitalize="characters"
                      value={vehicleReg}
                      onChangeText={setVehicleReg}
                    />
                  </View>
                </View>
              </View>

              {/* Spare Parts & Line Items Section */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeaderRow}>
                  <View>
                    <Text style={styles.sectionHeader}>Spare Parts & Service Tasks</Text>
                    <Text style={styles.sectionSubtext}>
                      {lineItems.length} items • Parts: ₹{partsSubtotal} | Labor: ₹{laborSubtotal}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.stockPickerBtn}
                    onPress={() => setIsInventoryPickerOpen(true)}
                  >
                    <MaterialCommunityIcons name="package-variant" size={14} color="#C9F31D" />
                    <Text style={styles.stockPickerBtnText}>Pick Stock</Text>
                  </TouchableOpacity>
                </View>

                {/* List of Line Items */}
                {lineItems.map((item, idx) => (
                  <View key={item.id || idx} style={styles.lineItemRow}>
                    <View style={styles.lineItemBadge}>
                      <Text
                        style={[
                          styles.lineItemBadgeText,
                          { color: item.category === 'part' ? '#F59E0B' : '#60A5FA' },
                        ]}
                      >
                        {item.category === 'part' ? 'PART' : 'LABOR'}
                      </Text>
                    </View>
                    <View style={styles.lineItemMain}>
                      <Text style={styles.lineItemTitle}>{item.description}</Text>
                      <Text style={styles.lineItemSub}>
                        {item.quantity} × ₹{item.unitPrice.toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <Text style={styles.lineItemTotal}>₹{item.total.toLocaleString('en-IN')}</Text>
                    <TouchableOpacity
                      onPress={() => handleRemoveLineItem(item.id)}
                      style={styles.lineItemDelete}
                    >
                      <MaterialCommunityIcons name="trash-can-outline" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}

                {/* Quick Add Workshop Spares Pills */}
                <Text style={styles.quickAddLabel}>⚡ Quick Add Common Spares & Tasks:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickPillRow}>
                  {COMMON_SPARE_PARTS.map((spare, sIdx) => (
                    <TouchableOpacity
                      key={sIdx}
                      style={styles.quickPill}
                      onPress={() => handleAddPredefinedPart(spare.name, spare.category, spare.rate)}
                    >
                      <MaterialCommunityIcons
                        name={spare.category === 'part' ? 'wrench' : 'hammer-wrench'}
                        size={12}
                        color={spare.category === 'part' ? '#F59E0B' : '#60A5FA'}
                      />
                      <Text style={styles.quickPillText} numberOfLines={1}>
                        {spare.name.slice(0, 22)} (₹{spare.rate})
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Add Custom Item Toggle */}
                {showCustomItemForm ? (
                  <View style={styles.customItemBox}>
                    <Text style={styles.customItemBoxTitle}>Add Custom Part or Labor</Text>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Part / Labor Name (e.g. Clutch Cable OEM)"
                      placeholderTextColor={COLORS.textMuted}
                      value={customDesc}
                      onChangeText={setCustomDesc}
                    />
                    <View style={styles.twoColRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.inputLabel}>Type</Text>
                        <View style={styles.categoryToggle}>
                          <TouchableOpacity
                            style={[
                              styles.catBtn,
                              customCategory === 'part' && styles.catBtnActive,
                            ]}
                            onPress={() => setCustomCategory('part')}
                          >
                            <Text style={styles.catBtnText}>Spare Part</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[
                              styles.catBtn,
                              customCategory === 'labor' && styles.catBtnActive,
                            ]}
                            onPress={() => setCustomCategory('labor')}
                          >
                            <Text style={styles.catBtnText}>Labor</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                      <View style={{ flex: 0.6 }}>
                        <Text style={styles.inputLabel}>Qty</Text>
                        <TextInput
                          style={styles.modalInput}
                          placeholder="1"
                          placeholderTextColor={COLORS.textMuted}
                          keyboardType="numeric"
                          value={customQty}
                          onChangeText={setCustomQty}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.inputLabel}>Rate (₹)</Text>
                        <TextInput
                          style={styles.modalInput}
                          placeholder="e.g. 450"
                          placeholderTextColor={COLORS.textMuted}
                          keyboardType="numeric"
                          value={customRate}
                          onChangeText={setCustomRate}
                        />
                      </View>
                    </View>
                    <View style={styles.customBtnRow}>
                      <TouchableOpacity
                        style={styles.customCancelBtn}
                        onPress={() => setShowCustomItemForm(false)}
                      >
                        <Text style={styles.customCancelText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.customAddBtn} onPress={handleAddCustomItem}>
                        <Text style={styles.customAddText}>+ Add to Bill</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.addCustomTriggerBtn}
                    onPress={() => setShowCustomItemForm(true)}
                  >
                    <MaterialCommunityIcons name="plus-circle-outline" size={16} color={COLORS.primary} />
                    <Text style={styles.addCustomTriggerText}>Add Custom Spare Part or Labor Charge</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Payment Schedule & Credit Terms */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionHeader}>Payment Schedule & Credit Terms</Text>
                <Text style={styles.sectionSubtext}>Choose immediate settlement, partial advance, or pay later</Text>

                <View style={styles.paymentTypeRow}>
                  <TouchableOpacity
                    style={[
                      styles.paymentTypeBtn,
                      paymentType === 'full' && styles.paymentTypeBtnActive,
                    ]}
                    onPress={() => setPaymentType('full')}
                  >
                    <MaterialCommunityIcons
                      name="check-circle-outline"
                      size={16}
                      color={paymentType === 'full' ? '#10B981' : COLORS.textMuted}
                    />
                    <Text style={styles.paymentTypeBtnText}>Full Paid</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.paymentTypeBtn,
                      paymentType === 'partial' && styles.paymentTypeBtnActive,
                    ]}
                    onPress={() => setPaymentType('partial')}
                  >
                    <MaterialCommunityIcons
                      name="fraction-one-half"
                      size={16}
                      color={paymentType === 'partial' ? '#F59E0B' : COLORS.textMuted}
                    />
                    <Text style={styles.paymentTypeBtnText}>Partial Advance</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.paymentTypeBtn,
                      paymentType === 'unpaid' && styles.paymentTypeBtnActive,
                    ]}
                    onPress={() => setPaymentType('unpaid')}
                  >
                    <MaterialCommunityIcons
                      name="clock-outline"
                      size={16}
                      color={paymentType === 'unpaid' ? '#EF4444' : COLORS.textMuted}
                    />
                    <Text style={styles.paymentTypeBtnText}>Unpaid (1-3 Mo)</Text>
                  </TouchableOpacity>
                </View>

                {paymentType === 'partial' && (
                  <View style={{ marginTop: 10 }}>
                    <Text style={styles.inputLabel}>Advance Payment Collected (₹)</Text>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="e.g. 500"
                      placeholderTextColor={COLORS.textMuted}
                      keyboardType="numeric"
                      value={advanceAmount}
                      onChangeText={setAdvanceAmount}
                    />
                    <Text style={styles.creditNotice}>
                      Remaining ₹
                      {Math.max(
                        0,
                        calculatedSubtotal - (Number.parseFloat(advanceAmount) || 0)
                      ).toLocaleString('en-IN')}{' '}
                      will be marked as Outstanding Balance for collection later.
                    </Text>
                  </View>
                )}

                {paymentType === 'unpaid' && (
                  <View style={styles.creditNoticeBox}>
                    <MaterialCommunityIcons name="information" size={16} color="#F59E0B" />
                    <Text style={styles.creditNoticeBoxText}>
                      Client chosen to pay later (1-3 months). The full ₹
                      {calculatedSubtotal.toLocaleString('en-IN')} will be tracked as Receivable. You can
                      record payments against this bill at any date.
                    </Text>
                  </View>
                )}

                {paymentType !== 'unpaid' && (
                  <>
                    <Text style={[styles.inputLabel, { marginTop: 10 }]}>Payment Mode</Text>
                    <View style={styles.modeRow}>
                      {(['UPI', 'CASH', 'CARD'] as const).map((m) => (
                        <TouchableOpacity
                          key={m}
                          style={[styles.modePill, paymentMode === m && styles.modePillActive]}
                          onPress={() => setPaymentMode(m)}
                        >
                          <Text style={[styles.modeText, paymentMode === m && styles.modeTextActive]}>
                            {m}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}
              </View>

              {/* Total Summary Footer */}
              <View style={styles.totalSummaryBanner}>
                <View>
                  <Text style={styles.totalSummaryLabel}>Total Bill Amount</Text>
                  <Text style={styles.totalSummaryVal}>
                    ₹{calculatedSubtotal.toLocaleString('en-IN')}
                  </Text>
                </View>
                <MobilePearlButton
                  variant="gold"
                  onPress={handleCreateInvoice}
                  style={{ minWidth: 160 }}
                >
                  {creating ? (
                    <MobileLoader text="Creating" />
                  ) : (
                    <>
                      <MaterialCommunityIcons
                        name="check"
                        size={18}
                        color={COLORS.background}
                        style={{ marginRight: 6 }}
                      />
                      <Text style={styles.pearlBtnText}>
                        Save {docType === 'SOW_ESTIMATE' ? 'Estimate' : 'Bill'}
                      </Text>
                    </>
                  )}
                </MobilePearlButton>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 2. Modal: Record Payment on Unpaid / Partial Bills (Late Collection) */}
      <Modal
        visible={isPaymentModalOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsPaymentModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '70%' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Record Bill Payment</Text>
                <Text style={styles.modalSubtitle}>
                  Invoice #{selectedInvoice?.invoiceNumber} • {selectedInvoice?.customer?.name}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsPaymentModalOpen(false)}
                style={styles.closeBtn}
              >
                <MaterialCommunityIcons name="close" size={22} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalForm}>
              {/* Balance Summary Box */}
              <View style={styles.paymentSummaryCard}>
                <View style={styles.paymentMetricCol}>
                  <Text style={styles.paymentMetricLabel}>TOTAL BILL</Text>
                  <Text style={styles.paymentMetricVal}>
                    ₹{(selectedInvoice?.total || 0).toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={styles.paymentMetricCol}>
                  <Text style={styles.paymentMetricLabel}>PAID SO FAR</Text>
                  <Text style={[styles.paymentMetricVal, { color: '#10B981' }]}>
                    ₹{(selectedInvoice?.paid || 0).toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={styles.paymentMetricCol}>
                  <Text style={styles.paymentMetricLabel}>BALANCE DUE</Text>
                  <Text style={[styles.paymentMetricVal, { color: '#EF4444' }]}>
                    ₹{(selectedInvoice?.balance || 0).toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>

              {/* Amount to Collect Input */}
              <Text style={styles.inputLabel}>Payment Amount to Collect (₹) *</Text>
              <TextInput
                style={[styles.modalInput, styles.bigAmountInput]}
                placeholder="Amount (₹)"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="numeric"
                value={collectAmount}
                onChangeText={setCollectAmount}
              />

              {/* Quick Amount Pills */}
              <View style={styles.quickAmountRow}>
                <TouchableOpacity
                  style={styles.quickAmountPill}
                  onPress={() => setCollectAmount(String(selectedInvoice?.balance || ''))}
                >
                  <Text style={styles.quickAmountPillText}>
                    Full Balance (₹{selectedInvoice?.balance})
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickAmountPill}
                  onPress={() =>
                    setCollectAmount(
                      String(Math.round((selectedInvoice?.balance || 0) / 2))
                    )
                  }
                >
                  <Text style={styles.quickAmountPillText}>50% Split</Text>
                </TouchableOpacity>
              </View>

              {/* Payment Mode */}
              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Payment Mode</Text>
              <View style={styles.modeRow}>
                {(['UPI', 'CASH', 'CARD', 'BANK'] as const).map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.modePill, collectMode === m && styles.modePillActive]}
                    onPress={() => setCollectMode(m)}
                  >
                    <Text style={[styles.modeText, collectMode === m && styles.modeTextActive]}>
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Payment Notes */}
              <Text style={[styles.inputLabel, { marginTop: 12 }]}>
                Payment Reference / Notes (Optional)
              </Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Paid via GPay / Settled after 2 months"
                placeholderTextColor={COLORS.textMuted}
                value={collectNotes}
                onChangeText={setCollectNotes}
              />

              <MobilePearlButton
                variant="gold"
                onPress={handleConfirmPayment}
                style={{ marginTop: 20 }}
              >
                {collecting ? (
                  <MobileLoader text="Saving Payment" />
                ) : (
                  <>
                    <MaterialCommunityIcons
                      name="check-circle"
                      size={18}
                      color={COLORS.background}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.pearlBtnText}>
                      Record ₹{Number(collectAmount || 0).toLocaleString('en-IN')} & Update Bill
                    </Text>
                  </>
                )}
              </MobilePearlButton>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 3. Modal: Pick from Inventory Stock */}
      <Modal
        visible={isInventoryPickerOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsInventoryPickerOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '75%' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Select Spare Part from Stock</Text>
                <Text style={styles.modalSubtitle}>{inventory.length} parts in workshop inventory</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsInventoryPickerOpen(false)}
                style={styles.closeBtn}
              >
                <MaterialCommunityIcons name="close" size={22} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={inventory}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: 16 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.inventoryItemCard}
                  onPress={() => {
                    handleAddPredefinedPart(
                      item.name || item.partName || 'Spare Part',
                      'part',
                      Number(item.price || item.sellingPrice || item.unitPrice || 0)
                    );
                    setIsInventoryPickerOpen(false);
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.invItemName}>{item.name || item.partName}</Text>
                    <Text style={styles.invItemSub}>
                      SKU: {item.sku || 'N/A'} • Available: {item.quantity || item.stock || 0} units
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.invItemPrice}>
                      ₹{Number(item.price || item.sellingPrice || 0).toLocaleString('en-IN')}
                    </Text>
                    <Text style={styles.invItemAddBadge}>+ Add to Bill</Text>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <Text style={{ color: COLORS.textMuted }}>No parts found in inventory.</Text>
                </View>
              }
            />
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
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'System',
  },
  pearlBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.background,
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'System',
  },
  summaryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 10,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryMetric: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.8,
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'System',
  },
  summaryVal: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 3,
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'System',
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
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 13,
    marginLeft: 8,
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'System',
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
    fontSize: 10.5,
    fontWeight: '600',
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'System',
  },
  filterTabTextActive: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  list: {
    padding: 16,
    paddingTop: 4,
    paddingBottom: 90,
  },
  card: {
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 12,
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
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'System',
  },
  dateText: {
    color: COLORS.textMuted,
    fontSize: 10.5,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'System',
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  customerName: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'System',
  },
  customerPhone: {
    color: COLORS.textMuted,
    fontSize: 11.5,
    marginLeft: 4,
  },
  jobBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  jobBadgeText: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginLeft: 5,
  },
  amountBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 10,
  },
  amountCol: {
    alignItems: 'center',
  },
  amountLabel: {
    color: COLORS.textMuted,
    fontSize: 9.5,
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'System',
  },
  amountVal: {
    color: COLORS.text,
    fontSize: 13.5,
    fontWeight: 'bold',
    marginTop: 2,
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'System',
  },
  recordPaymentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#C9F31D',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 10,
  },
  recordPaymentBannerText: {
    color: '#0B0F19',
    fontSize: 11.5,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'System',
  },
  paidInFullBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 6,
    paddingVertical: 5,
    marginTop: 8,
    gap: 4,
  },
  paidInFullText: {
    color: '#10B981',
    fontSize: 10.5,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'System',
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  actionBtnWhatsApp: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#25D366',
    backgroundColor: 'rgba(37, 211, 102, 0.06)',
  },
  actionBtnWhatsAppText: {
    color: '#25D366',
    fontSize: 10.5,
    fontWeight: 'bold',
    marginLeft: 3,
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'System',
  },
  actionBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(229, 192, 123, 0.05)',
  },
  actionBtnSecondaryText: {
    color: COLORS.primary,
    fontSize: 10.5,
    fontWeight: '600',
    marginLeft: 3,
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'System',
  },
  actionBtnSow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#8B5CF6',
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
  },
  actionBtnSowText: {
    color: '#A78BFA',
    fontSize: 10.5,
    fontWeight: 'bold',
    marginLeft: 3,
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'System',
  },
  actionBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 7,
    backgroundColor: COLORS.primary,
  },
  actionBtnPrimaryText: {
    color: COLORS.background,
    fontSize: 10.5,
    fontWeight: 'bold',
    marginLeft: 3,
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'System',
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
    fontSize: 13,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 78,
    backgroundColor: COLORS.primary,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'System',
  },
  modalSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'System',
  },
  closeBtn: {
    padding: 4,
  },
  modalForm: {
    padding: 16,
    paddingBottom: 40,
  },
  docTypeToggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  docTypeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  docTypeBtnActiveBill: {
    backgroundColor: '#C9F31D',
    borderColor: '#C9F31D',
  },
  docTypeBtnActiveEstimate: {
    backgroundColor: '#E5C07B',
    borderColor: '#E5C07B',
  },
  docTypeBtnText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'System',
  },
  docTypeBtnTextActive: {
    color: '#0B0F19',
    fontWeight: 'bold',
  },
  sectionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    marginBottom: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionHeader: {
    fontSize: 12.5,
    fontWeight: 'bold',
    color: COLORS.text,
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'System',
  },
  sectionSubtext: {
    fontSize: 10.5,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  stockPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: 'rgba(201, 243, 29, 0.12)',
    borderWidth: 1,
    borderColor: '#C9F31D',
    borderRadius: 6,
  },
  stockPickerBtnText: {
    fontSize: 10.5,
    fontWeight: 'bold',
    color: '#C9F31D',
  },
  inputLabel: {
    fontSize: 10.5,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    marginBottom: 4,
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'System',
  },
  modalInput: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: COLORS.text,
    fontSize: 12.5,
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'System',
  },
  bigAmountInput: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#C9F31D',
    paddingVertical: 10,
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  lineItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  lineItemBadge: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.3)',
    marginRight: 6,
  },
  lineItemBadgeText: {
    fontSize: 8.5,
    fontWeight: 'bold',
  },
  lineItemMain: {
    flex: 1,
  },
  lineItemTitle: {
    fontSize: 11.5,
    fontWeight: '600',
    color: COLORS.text,
  },
  lineItemSub: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  lineItemTotal: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginRight: 8,
  },
  lineItemDelete: {
    padding: 4,
  },
  quickAddLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    marginTop: 8,
    marginBottom: 4,
  },
  quickPillRow: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  quickPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    marginRight: 6,
  },
  quickPillText: {
    fontSize: 10,
    color: COLORS.text,
  },
  addCustomTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    marginTop: 6,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.primary,
    borderRadius: 8,
  },
  addCustomTriggerText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },
  customItemBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  customItemBoxTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 6,
  },
  categoryToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  catBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
  },
  catBtnActive: {
    backgroundColor: COLORS.primary,
  },
  catBtnText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  customBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 10,
  },
  customCancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  customCancelText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  customAddBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  customAddText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.background,
  },
  paymentTypeRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  paymentTypeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  paymentTypeBtnActive: {
    backgroundColor: 'rgba(201, 243, 29, 0.1)',
    borderColor: '#C9F31D',
  },
  paymentTypeBtnText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: COLORS.text,
  },
  creditNotice: {
    fontSize: 10.5,
    color: '#F59E0B',
    marginTop: 4,
  },
  creditNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
  },
  creditNoticeBoxText: {
    flex: 1,
    fontSize: 10.5,
    color: '#F59E0B',
    lineHeight: 14,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  modePill: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modePillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  modeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.textMuted,
  },
  modeTextActive: {
    color: COLORS.background,
  },
  totalSummaryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(201, 243, 29, 0.08)',
    borderWidth: 1,
    borderColor: '#C9F31D',
    borderRadius: 12,
    padding: 12,
    marginTop: 6,
  },
  totalSummaryLabel: {
    fontSize: 10.5,
    color: COLORS.textMuted,
  },
  totalSummaryVal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#C9F31D',
    marginTop: 2,
  },
  paymentSummaryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  paymentMetricCol: {
    flex: 1,
    alignItems: 'center',
  },
  paymentMetricLabel: {
    fontSize: 9,
    color: COLORS.textMuted,
    fontWeight: 'bold',
  },
  paymentMetricVal: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 2,
  },
  quickAmountRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  quickAmountPill: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  quickAmountPillText: {
    fontSize: 10.5,
    color: COLORS.primary,
    fontWeight: '600',
  },
  inventoryItemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  invItemName: {
    fontSize: 12.5,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  invItemSub: {
    fontSize: 10.5,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  invItemPrice: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  invItemAddBadge: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#C9F31D',
    marginTop: 2,
  },
});
