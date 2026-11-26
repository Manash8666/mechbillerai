import React, { useEffect, useState, useRef } from 'react';
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
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { COLORS } from '../constants/theme';
import { API } from '../services/api';
import { getAutomotiveTechnicalExplanation } from '../services/aiExplainer';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MobileLoader from '../components/MobileLoader';
import MobilePearlButton from '../components/MobilePearlButton';

interface LineItem {
  id: string;
  description: string;
  details?: string;
  category: 'part' | 'labor';
  quantity: number;
  unitPrice: number;
  discountType?: '%' | '₹';
  discountValue?: number;
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
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleReg, setVehicleReg] = useState('');
  const [serviceScope, setServiceScope] = useState('');

  // Line items state
  const [lineItems, setLineItems] = useState<LineItem[]>([]);

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
  const [deliveryPhoto, setDeliveryPhoto] = useState<string | null>(null);
  const [branding, setBranding] = useState<any>(null);

  // Custom Item discount state
  const [customDiscVal, setCustomDiscVal] = useState('0');
  const [customDiscType, setCustomDiscType] = useState<'%' | '₹'>('%');

  // Edit Invoice Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<InvoiceItem | null>(null);
  const [editCustName, setEditCustName] = useState('');
  const [editCustPhone, setEditCustPhone] = useState('');
  const [editVehicleModel, setEditVehicleModel] = useState('');
  const [editVehicleReg, setEditVehicleReg] = useState('');
  const [editServiceScope, setEditServiceScope] = useState('');
  const [editLineItems, setEditLineItems] = useState<LineItem[]>([]);
  const [editPaymentMode, setEditPaymentMode] = useState<'CASH' | 'UPI' | 'CARD'>('UPI');
  const [editStatus, setEditStatus] = useState<'paid' | 'partial' | 'unpaid'>('paid');
  const [editPaidAmount, setEditPaidAmount] = useState('0');
  const [editDiscount, setEditDiscount] = useState('0');
  const [editDeliveryPhoto, setEditDeliveryPhoto] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [newlyAddedEditItemId, setNewlyAddedEditItemId] = useState<string | null>(null);
  const editModalScrollRef = useRef<ScrollView>(null);
  const newModalScrollRef = useRef<ScrollView>(null);

  // Import Bills Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importing, setImporting] = useState(false);

  // Collect Payment Modal state (for Unpaid / Partial bills later)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceItem | null>(null);
  const [collectAmount, setCollectAmount] = useState('');
  const [collectMode, setCollectMode] = useState<'UPI' | 'CASH' | 'CARD' | 'BANK'>('UPI');
  const [collectDate, setCollectDate] = useState('');
  const [collectNotes, setCollectNotes] = useState('');
  const [collecting, setCollecting] = useState(false);

  const handleOpenNewBillModal = () => {
    setCustName('');
    setCustPhone('');
    setVehicleModel('');
    setVehicleReg('');
    setServiceScope('');
    setLineItems([]);
    setPaymentType('full');
    setAdvanceAmount('');
    setPaymentMode('UPI');
    setDeliveryPhoto(null);
    setCustomDesc('');
    setCustomRate('');
    setCustomQty('1');
    setCustomDiscVal('0');
    setShowCustomItemForm(false);
    setIsModalOpen(true);
  };

  const calculateLineTotal = (qty: number, rate: number, discType?: '%' | '₹', discVal?: number) => {
    const gross = qty * rate;
    const disc = Number(discVal) || 0;
    let discountAmount = 0;
    if (discType === '%') {
      discountAmount = (gross * disc) / 100;
    } else {
      discountAmount = disc;
    }
    return Math.max(0, gross - discountAmount);
  };

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
      details: getAutomotiveTechnicalExplanation(name),
      category,
      quantity: 1,
      unitPrice: rate,
      discountType: '%',
      discountValue: 0,
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
    const disc = Number.parseFloat(customDiscVal) || 0;
    const desc = customDesc.trim();
    const lineTotal = calculateLineTotal(qty, rate, customDiscType, disc);

    const newItem: LineItem = {
      id: Date.now().toString(),
      description: desc,
      details: getAutomotiveTechnicalExplanation(desc),
      category: customCategory,
      quantity: qty,
      unitPrice: rate,
      discountType: customDiscType,
      discountValue: disc,
      total: lineTotal,
    };
    setLineItems((prev) => [...prev, newItem]);
    setCustomDesc('');
    setCustomRate('');
    setCustomQty('1');
    setCustomDiscVal('0');
    setShowCustomItemForm(false);
  };

  const handleRemoveLineItem = (id: string) => {
    setLineItems((prev) => prev.filter((it) => it.id !== id));
  };

  // Delivery Photo Camera & Pickers
  const handleTakeDeliveryPhoto = async (forEdit = false) => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required to capture vehicle delivery photo.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.6,
        base64: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const dataUri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
        if (forEdit) {
          setEditDeliveryPhoto(dataUri);
        } else {
          setDeliveryPhoto(dataUri);
        }
      }
    } catch (e: any) {
      Alert.alert('Camera Error', e.message || 'Could not launch camera.');
    }
  };

  const handlePickDeliveryPhoto = async (forEdit = false) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        quality: 0.6,
        base64: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const dataUri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
        if (forEdit) {
          setEditDeliveryPhoto(dataUri);
        } else {
          setDeliveryPhoto(dataUri);
        }
      }
    } catch (e: any) {
      Alert.alert('Gallery Error', e.message || 'Could not pick image.');
    }
  };

  const handleQuickCaptureDeliveryPhoto = async (item: InvoiceItem) => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission required to capture handover photo.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.6,
        base64: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const dataUri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;

        let existingNotesObj: any = {};
        if ((item as any).notes) {
          try {
            existingNotesObj = JSON.parse((item as any).notes);
          } catch {
            existingNotesObj = { userNotes: (item as any).notes };
          }
        }
        existingNotesObj.deliveryPhoto = dataUri;

        await API.updateInvoice(item.id, {
          notes: JSON.stringify(existingNotesObj),
        });

        Alert.alert('Handover Photo Attached! 📸', `Handover photo verified & attached to #${item.invoiceNumber}.`);
        await fetchInvoices();
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not attach delivery photo.');
    }
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
        deliveryPhoto: deliveryPhoto || undefined,
      });

      await API.createInvoice({
        customerId,
        isEstimate,
        docType: isEstimate ? 'ESTIMATE' : 'INVOICE',
        items: lineItems.map((it) => ({
          description: it.description,
          details: it.details || getAutomotiveTechnicalExplanation(it.description),
          category: it.category,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          discount: it.discountValue ? `${it.discountValue}${it.discountType || '₹'}` : undefined,
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
      setDeliveryPhoto(null);
      setPaymentType('full');
      await fetchInvoices();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to generate bill.');
    } finally {
      setCreating(false);
    }
  };

  // Open Edit Modal for existing invoice
  const handleOpenEditModal = async (item: InvoiceItem) => {
    try {
      setEditingInvoice(item);
      setEditCustName(item.customer?.name || '');
      setEditCustPhone(item.customer?.phone || '');
      setEditPaymentMode(((item.paymentMode || 'UPI').toUpperCase() as any));
      setEditStatus(((item.status || 'paid').toLowerCase() as any));
      setEditPaidAmount(String(item.paid || '0'));
      setEditDiscount(String((item as any).discount || '0'));

      let vModel = '';
      let vReg = '';
      let vScope = '';
      let dPhoto: string | null = null;
      let rawNotes = (item as any).notes || '';

      if (rawNotes) {
        try {
          const parsed = JSON.parse(rawNotes);
          if (typeof parsed === 'object' && parsed !== null) {
            vModel = parsed.vehicleModel || parsed.model || '';
            vReg = parsed.vehicleReg || parsed.registrationNo || '';
            vScope = parsed.serviceScope || parsed.serviceType || '';
            dPhoto = parsed.deliveryPhoto || null;
          }
        } catch {
          const vehMatch = rawNotes.match(/\[VEHICLE:\s*([^|\]]+)/i);
          const regMatch = rawNotes.match(/REG:\s*([^|\]]+)/i);
          const scopeMatch = rawNotes.match(/SCOPE:\s*([^|\]]+)/i);
          if (vehMatch) vModel = vehMatch[1].trim();
          if (regMatch) vReg = regMatch[1].trim();
          if (scopeMatch) vScope = scopeMatch[1].trim();
        }
      }

      setEditVehicleModel(vModel || 'Royal Enfield Classic 350');
      setEditVehicleReg(vReg);
      setEditServiceScope(vScope || 'Service & Maintenance');
      setEditDeliveryPhoto(dPhoto);

      // Fetch full invoice with line items
      let fullItems: any[] = (item as any).items || [];
      if (fullItems.length === 0) {
        try {
          const fullInv = await API.getInvoiceById(item.id);
          if (fullInv && fullInv.items) {
            fullItems = fullInv.items;
          }
        } catch {}
      }

      if (fullItems.length > 0) {
        setEditLineItems(
          fullItems.map((it, idx) => {
            const rawDisc = it.discount;
            const isPercent = rawDisc && String(rawDisc).includes('%');
            const discVal = rawDisc ? parseFloat(String(rawDisc).replace(/[^0-9.]/g, '')) || 0 : 0;
            const qty = it.quantity || 1;
            const rate = it.unitPrice || 0;
            return {
              id: it.id || `edit-item-${idx}`,
              description: it.description,
              details: it.details || '',
              category: it.category || 'part',
              quantity: qty,
              unitPrice: rate,
              discountType: isPercent ? ('%' as const) : ('₹' as const),
              discountValue: discVal,
              total: calculateLineTotal(qty, rate, isPercent ? '%' : '₹', discVal),
            };
          })
        );
      } else {
        setEditLineItems([
          {
            id: '1',
            description: 'Workshop Service & Maintenance',
            category: 'labor',
            quantity: 1,
            unitPrice: item.subtotal || item.total || 1000,
            discountType: '%',
            discountValue: 0,
            total: item.subtotal || item.total || 1000,
          },
        ]);
      }

      setIsEditModalOpen(true);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not load invoice for editing.');
    }
  };

  // Save changes to existing invoice
  const handleSaveEditInvoice = async () => {
    if (!editingInvoice) return;
    if (editLineItems.length === 0) {
      Alert.alert('Required', 'Please keep at least one line item.');
      return;
    }

    try {
      setSavingEdit(true);
      const subtotal = editLineItems.reduce((acc, it) => acc + (it.total || 0), 0);
      const overallDisc = Number.parseFloat(editDiscount) || 0;
      const total = Math.max(0, subtotal - overallDisc);
      const paid = Number.parseFloat(editPaidAmount) || 0;
      const balance = Math.max(0, total - paid);

      let finalStatus = editStatus;
      if (balance <= 0) {
        finalStatus = 'paid';
      } else if (paid > 0) {
        finalStatus = 'partial';
      } else {
        finalStatus = 'unpaid';
      }

      const notesPayload = JSON.stringify({
        vehicleModel: editVehicleModel.trim() || undefined,
        vehicleReg: editVehicleReg.trim().toUpperCase() || undefined,
        serviceScope: editServiceScope.trim() || undefined,
        deliveryPhoto: editDeliveryPhoto || undefined,
      });

      await API.updateInvoice(editingInvoice.id, {
        paymentMode: editPaymentMode,
        status: finalStatus,
        subtotal,
        discount: overallDisc,
        tax: 0,
        total,
        paid,
        balance,
        notes: notesPayload,
        items: editLineItems.map((it) => ({
          description: it.description,
          details: it.details || getAutomotiveTechnicalExplanation(it.description),
          category: it.category,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          discount: it.discountValue ? `${it.discountValue}${it.discountType || '₹'}` : undefined,
          total: it.total,
        })),
      });

      Alert.alert('Success 🎉', `Invoice #${editingInvoice.invoiceNumber} updated successfully!`);
      setIsEditModalOpen(false);
      setEditingInvoice(null);
      await fetchInvoices();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not update invoice.');
    } finally {
      setSavingEdit(false);
    }
  };

  // Bills Import (CSV & JSON)
  const handleSelectImportFile = async () => {
    try {
      const doc = await DocumentPicker.getDocumentAsync({
        type: ['*/*'],
        copyToCacheDirectory: true,
      });

      if (doc.canceled || !doc.assets || doc.assets.length === 0) {
        return;
      }

      const fileAsset = doc.assets[0];
      setImporting(true);

      const fileRes = await fetch(fileAsset.uri);
      const content = await fileRes.text();

      if (!content.trim()) {
        Alert.alert('Empty File', 'The selected file contains no data.');
        return;
      }

      let invoicesToImport: any[] = [];
      const fileName = fileAsset.name || '';
      const isJson =
        fileName.toLowerCase().endsWith('.json') ||
        content.trim().startsWith('{') ||
        content.trim().startsWith('[');

      if (isJson) {
        const parsed = JSON.parse(content);
        const list = Array.isArray(parsed) ? parsed : parsed.invoices || [parsed];
        invoicesToImport = list.map((inv: any, idx: number) => ({
          invoiceNumber: inv.invoiceNumber || `IMP-${Date.now().toString().slice(-4)}-${idx + 1}`,
          date: inv.date || new Date().toISOString(),
          customer: {
            name: inv.customer?.name || inv.customerName || 'Walk-in Customer',
            phone: inv.customer?.phone || inv.customerPhone || '',
          },
          vehicle: {
            makeModel: inv.vehicle?.makeModel || inv.vehicleModel || 'Motorcycle',
            registrationNo: inv.vehicle?.registrationNo || inv.vehicleReg || 'As Per Estimate',
          },
          items: (inv.items || [
            {
              description: inv.serviceDescription || inv.description || 'Workshop Service',
              quantity: 1,
              unitPrice: Number(inv.subtotal || inv.total || 1000),
              total: Number(inv.subtotal || inv.total || 1000),
            },
          ]).map((it: any) => ({
            description: it.description || it.name || 'Service Item',
            quantity: Number(it.quantity || it.qty || 1),
            unitPrice: Number(it.unitPrice || it.rate || it.price || 0),
            total: Number(it.total || (Number(it.quantity || 1) * Number(it.unitPrice || 0))),
          })),
          subtotal: Number(inv.subtotal || inv.total || 0),
          tax: Number(inv.tax || 0),
          discount: Number(inv.discount || 0),
          total: Number(inv.total || inv.subtotal || 0),
          paid: Number(inv.paid ?? inv.total ?? 0),
          balance: Number(inv.balance ?? 0),
          paymentMode: inv.paymentMode || 'UPI',
          notes: inv.notes || 'Imported from JSON file',
        }));
      } else {
        // Parse CSV
        const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length < 2) {
          Alert.alert('Invalid CSV', 'CSV file must have a header row and at least one data row.');
          return;
        }
        const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/["']/g, ''));
        const invNumIdx = headers.findIndex((h) => h.includes('invoice') || h.includes('bill') || h.includes('id'));
        const nameIdx = headers.findIndex((h) => h.includes('name') || h.includes('customer'));
        const phoneIdx = headers.findIndex((h) => h.includes('phone') || h.includes('mobile'));
        const vehIdx = headers.findIndex((h) => h.includes('vehicle') || h.includes('model'));
        const regIdx = headers.findIndex((h) => h.includes('reg') || h.includes('number'));
        const itemIdx = headers.findIndex((h) => h.includes('item') || h.includes('service') || h.includes('desc'));
        const qtyIdx = headers.findIndex((h) => h.includes('qty') || h.includes('quantity'));
        const rateIdx = headers.findIndex((h) => h.includes('rate') || h.includes('price') || h.includes('mrp'));
        const totalIdx = headers.findIndex((h) => h.includes('total') || h.includes('amount'));
        const paidIdx = headers.findIndex((h) => h.includes('paid'));

        for (let i = 1; i < lines.length; i++) {
          const row = lines[i].split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
          if (row.length === 0 || !row.some((c) => c.length > 0)) continue;

          const custName = nameIdx >= 0 && row[nameIdx] ? row[nameIdx] : `Customer ${i}`;
          const phone = phoneIdx >= 0 && row[phoneIdx] ? row[phoneIdx] : '';
          const vehModel = vehIdx >= 0 && row[vehIdx] ? row[vehIdx] : 'Royal Enfield Classic 350';
          const vehReg = regIdx >= 0 && row[regIdx] ? row[regIdx] : 'As Per Estimate';
          const itemDesc = itemIdx >= 0 && row[itemIdx] ? row[itemIdx] : 'Periodic Maintenance Service';
          const qty = qtyIdx >= 0 ? Number(row[qtyIdx]) || 1 : 1;
          const rate = rateIdx >= 0 ? Number(row[rateIdx]) || 1000 : (totalIdx >= 0 ? Number(row[totalIdx]) || 1000 : 1000);
          const total = totalIdx >= 0 ? Number(row[totalIdx]) || qty * rate : qty * rate;
          const paid = paidIdx >= 0 ? Number(row[paidIdx]) || total : total;
          const invNum = invNumIdx >= 0 && row[invNumIdx] ? row[invNumIdx] : `CSV-${Date.now().toString().slice(-4)}-${i}`;

          invoicesToImport.push({
            invoiceNumber: invNum,
            date: new Date().toISOString(),
            customer: { name: custName, phone },
            vehicle: { makeModel: vehModel, registrationNo: vehReg },
            items: [
              {
                description: itemDesc,
                quantity: qty,
                unitPrice: rate,
                total,
              },
            ],
            subtotal: total,
            tax: 0,
            discount: 0,
            total,
            paid,
            balance: Math.max(0, total - paid),
            paymentMode: 'UPI',
            notes: 'Imported from CSV file',
          });
        }
      }

      if (invoicesToImport.length === 0) {
        Alert.alert('No Records Found', 'Could not parse bills from the selected file.');
        return;
      }

      await API.importBills(invoicesToImport);
      Alert.alert(
        'Import Succeeded! 🚀',
        `Successfully imported ${invoicesToImport.length} bill(s) into MotoFit workshop.`
      );
      setIsImportModalOpen(false);
      await fetchInvoices();
    } catch (err: any) {
      Alert.alert('Import Failed', err?.message || 'Could not import selected file.');
    } finally {
      setImporting(false);
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
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.invoiceNumber} numberOfLines={1} ellipsizeMode="tail">
              {item.invoiceNumber}
            </Text>
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
            <MaterialCommunityIcons name="motorbike" size={13} color={COLORS.textMuted} />
            <Text style={styles.jobBadgeText}>Job Card: {item.jobCard.jobNumber}</Text>
          </View>
        ) : null}

        {/* Financial Breakdown */}
        <View style={styles.amountBreakdown}>
          <View style={[styles.amountCol, { flex: 1 }]}>
            <Text style={styles.amountLabel}>Total Bill</Text>
            <Text style={styles.amountVal} numberOfLines={1} adjustsFontSizeToFit>₹{(item.total || 0).toLocaleString('en-IN')}</Text>
          </View>
          <View style={[styles.amountCol, { flex: 1 }]}>
            <Text style={styles.amountLabel}>Paid</Text>
            <Text style={[styles.amountVal, { color: '#10B981' }]} numberOfLines={1} adjustsFontSizeToFit>
              ₹{(item.paid || 0).toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={[styles.amountCol, { flex: 1 }]}>
            <Text style={styles.amountLabel}>Balance</Text>
            <Text
              style={[
                styles.amountVal,
                { color: item.balance > 0 ? '#EF4444' : COLORS.textMuted },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
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

        {/* Row 1: Document View & Edit (SOW Bill, PDF Bill, Edit) */}
        <View style={styles.actionsGridRow}>
          <TouchableOpacity
            style={styles.actionBtnSow}
            onPress={() => handleOpenPdf(item.id, 'SOW_BILL')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="auto-fix" size={13} color="#A78BFA" />
            <Text style={styles.actionBtnSowText}>SOW Bill</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtnPrimary}
            onPress={() => handleOpenPdf(item.id, 'INVOICE')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="receipt" size={13} color={COLORS.background} />
            <Text style={styles.actionBtnPrimaryText}>PDF Bill</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtnEdit}
            onPress={() => handleOpenEditModal(item)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="pencil-outline" size={13} color="#F59E0B" />
            <Text style={styles.actionBtnEditText}>Edit Bill</Text>
          </TouchableOpacity>
        </View>

        {/* Row 2: Customer Delivery & Comms (WhatsApp, Slip, Delivery Photo) */}
        <View style={styles.actionsGridRow}>
          <TouchableOpacity
            style={styles.actionBtnWhatsApp}
            onPress={() => handleShareWhatsApp(item)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="whatsapp" size={13} color="#25D366" />
            <Text style={styles.actionBtnWhatsAppText}>WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtnSecondary}
            onPress={() => handleThermalPrint(item)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="printer-pos" size={13} color={COLORS.primary} />
            <Text style={styles.actionBtnSecondaryText}>Slip</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtnPhoto}
            onPress={() => handleQuickCaptureDeliveryPhoto(item)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="camera-outline" size={13} color="#06B6D4" />
            <Text style={styles.actionBtnPhotoText}>📸 Photo</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Header with New Bill & Import buttons */}
      <View style={styles.topActions}>
        <Text style={styles.topTitle}>Billing Ledger</Text>
        <View style={styles.topBtnGroup}>
          <TouchableOpacity
            style={styles.importBtn}
            onPress={() => setIsImportModalOpen(true)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="file-import-outline" size={14} color="#C9F31D" />
            <Text style={styles.importBtnText}>Import</Text>
          </TouchableOpacity>
          <MobilePearlButton variant="gold" onPress={handleOpenNewBillModal}>
            <MaterialCommunityIcons
              name="plus"
              size={18}
              color={COLORS.background}
              style={{ marginRight: 4 }}
            />
            <Text style={styles.pearlBtnText}>New Bill</Text>
          </MobilePearlButton>
        </View>
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
      <TouchableOpacity style={styles.fab} onPress={handleOpenNewBillModal}>
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

            <ScrollView ref={newModalScrollRef} contentContainerStyle={styles.modalForm} showsVerticalScrollIndicator={false}>
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

                {/* Handover Delivery Photo (Optional) */}
                <View style={styles.photoCaptureCard}>
                  <View style={styles.photoCaptureHeader}>
                    <Text style={styles.inputLabel}>📸 Handover Delivery Photo (Optional)</Text>
                    {deliveryPhoto ? (
                      <TouchableOpacity onPress={() => setDeliveryPhoto(null)}>
                        <Text style={styles.photoRemoveText}>Remove</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                  <View style={styles.photoCaptureRow}>
                    {deliveryPhoto ? (
                      <Image source={{ uri: deliveryPhoto }} style={styles.photoThumb} />
                    ) : null}
                    <View style={styles.photoBtnGroup}>
                      <TouchableOpacity
                        style={styles.photoActionBtn}
                        onPress={() => handleTakeDeliveryPhoto(false)}
                      >
                        <MaterialCommunityIcons name="camera" size={14} color="#C9F31D" />
                        <Text style={styles.photoActionBtnText}>Take Photo</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.photoActionBtn}
                        onPress={() => handlePickDeliveryPhoto(false)}
                      >
                        <MaterialCommunityIcons name="image-outline" size={14} color={COLORS.primary} />
                        <Text style={styles.photoActionBtnText}>Pick Image</Text>
                      </TouchableOpacity>
                    </View>
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
                      <Text style={styles.lineItemExpl} numberOfLines={2}>
                        {item.details || getAutomotiveTechnicalExplanation(item.description)}
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
                          onChangeText={(text) => setCustomQty(text.replace(/^0+(?=\d)/, ''))}
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
                          onChangeText={(text) => setCustomRate(text.replace(/^0+(?=\d)/, ''))}
                        />
                      </View>
                    </View>
                    <View style={styles.twoColRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.inputLabel}>Discount ({customDiscType})</Text>
                        <View style={{ flexDirection: 'row', gap: 4 }}>
                          <TextInput
                            style={[styles.modalInput, { flex: 1 }]}
                            placeholder="0"
                            placeholderTextColor={COLORS.textMuted}
                            keyboardType="numeric"
                            value={customDiscVal === '0' ? '' : customDiscVal}
                            onChangeText={(text) => setCustomDiscVal(text.replace(/^0+(?=\d)/, ''))}
                          />
                          <TouchableOpacity
                            style={styles.discToggleBtn}
                            onPress={() => setCustomDiscType((prev) => (prev === '%' ? '₹' : '%'))}
                          >
                            <Text style={styles.discToggleBtnText}>{customDiscType}</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                      <View style={{ flex: 1, justifyContent: 'center' }}>
                        <Text style={styles.inputLabel}>Net Line Amount</Text>
                        <Text style={{ color: '#C9F31D', fontSize: 15, fontWeight: 'bold' }}>
                          ₹{calculateLineTotal(Number(customQty) || 1, Number(customRate) || 0, customDiscType, Number(customDiscVal) || 0).toLocaleString('en-IN')}
                        </Text>
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
                      onChangeText={(text) => setAdvanceAmount(text.replace(/^0+(?=\d)/, ''))}
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
                onChangeText={(text) => setCollectAmount(text.replace(/^0+(?=\d)/, ''))}
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

      {/* 4. Modal: Edit Bill / Estimate */}
      <Modal
        visible={isEditModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  Edit Bill #{editingInvoice?.invoiceNumber}
                </Text>
                <Text style={styles.modalSubtitle}>
                  Update Line Items, Discounts & Handover Proof
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsEditModalOpen(false)}
                style={styles.closeBtn}
              >
                <MaterialCommunityIcons name="close" size={22} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView ref={editModalScrollRef} contentContainerStyle={styles.modalForm} showsVerticalScrollIndicator={false}>
              {/* Customer & Vehicle Info */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionHeader}>Customer & Vehicle Information</Text>
                <View style={styles.twoColRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Customer Name</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={editCustName}
                      onChangeText={setEditCustName}
                      placeholder="Customer Name"
                      placeholderTextColor={COLORS.textMuted}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Phone Number</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={editCustPhone}
                      onChangeText={setEditCustPhone}
                      placeholder="Phone"
                      placeholderTextColor={COLORS.textMuted}
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>

                <View style={styles.twoColRow}>
                  <View style={{ flex: 1.2 }}>
                    <Text style={styles.inputLabel}>Vehicle Make & Model</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={editVehicleModel}
                      onChangeText={setEditVehicleModel}
                      placeholder="Make & Model"
                      placeholderTextColor={COLORS.textMuted}
                    />
                  </View>
                  <View style={{ flex: 0.8 }}>
                    <Text style={styles.inputLabel}>Vehicle Reg No.</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={editVehicleReg}
                      onChangeText={setEditVehicleReg}
                      placeholder="REG NO."
                      placeholderTextColor={COLORS.textMuted}
                      autoCapitalize="characters"
                    />
                  </View>
                </View>

                {/* Handover Delivery Photo (Optional) */}
                <View style={styles.photoCaptureCard}>
                  <View style={styles.photoCaptureHeader}>
                    <Text style={styles.inputLabel}>📸 Handover Delivery Photo (Optional)</Text>
                    {editDeliveryPhoto ? (
                      <TouchableOpacity onPress={() => setEditDeliveryPhoto(null)}>
                        <Text style={styles.photoRemoveText}>Remove</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                  <View style={styles.photoCaptureRow}>
                    {editDeliveryPhoto ? (
                      <Image source={{ uri: editDeliveryPhoto }} style={styles.photoThumb} />
                    ) : null}
                    <View style={styles.photoBtnGroup}>
                      <TouchableOpacity
                        style={styles.photoActionBtn}
                        onPress={() => handleTakeDeliveryPhoto(true)}
                      >
                        <MaterialCommunityIcons name="camera" size={14} color="#C9F31D" />
                        <Text style={styles.photoActionBtnText}>Take Photo</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.photoActionBtn}
                        onPress={() => handlePickDeliveryPhoto(true)}
                      >
                        <MaterialCommunityIcons name="image-outline" size={14} color={COLORS.primary} />
                        <Text style={styles.photoActionBtnText}>Pick Image</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>

              {/* Line Items Editor */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionHeader}>Line Items ({editLineItems.length})</Text>
                  <TouchableOpacity
                    style={styles.stockPickerBtn}
                    onPress={() => {
                      const newId = `edit_item_${Date.now()}`;
                      const newItem: LineItem = {
                        id: newId,
                        description: '',
                        details: '',
                        category: 'part',
                        quantity: 1,
                        unitPrice: 0,
                        discountType: '%',
                        discountValue: 0,
                        total: 0,
                      };
                      setNewlyAddedEditItemId(newId);
                      setEditLineItems((prev) => [...prev, newItem]);
                      setTimeout(() => {
                        editModalScrollRef.current?.scrollToEnd({ animated: true });
                      }, 100);
                    }}
                  >
                    <MaterialCommunityIcons name="plus" size={14} color="#C9F31D" />
                    <Text style={styles.stockPickerBtnText}>Add Item</Text>
                  </TouchableOpacity>
                </View>

                {editLineItems.map((item, idx) => (
                  <View key={item.id || idx} style={styles.editLineItemCard}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <TextInput
                        style={[styles.modalInput, { flex: 1, fontWeight: 'bold' }]}
                        value={item.description}
                        autoFocus={item.id === newlyAddedEditItemId}
                        onChangeText={(val) => {
                          setEditLineItems((prev) =>
                            prev.map((it, i) => (i === idx ? { ...it, description: val } : it))
                          );
                        }}
                        placeholder="Item Description"
                        placeholderTextColor={COLORS.textMuted}
                      />
                      {editLineItems.length > 1 && (
                        <TouchableOpacity
                          onPress={() =>
                            setEditLineItems((prev) => prev.filter((_, i) => i !== idx))
                          }
                          style={styles.lineItemDelete}
                        >
                          <MaterialCommunityIcons name="trash-can-outline" size={16} color="#EF4444" />
                        </TouchableOpacity>
                      )}
                    </View>

                    <View style={[styles.twoColRow, { marginTop: 6 }]}>
                      <View style={{ flex: 0.6 }}>
                        <Text style={styles.inputLabel}>Qty</Text>
                        <TextInput
                          style={styles.modalInput}
                          keyboardType="numeric"
                          value={String(item.quantity)}
                          onChangeText={(val) => {
                            const q = Number(val) || 1;
                            setEditLineItems((prev) =>
                              prev.map((it, i) =>
                                i === idx
                                  ? {
                                      ...it,
                                      quantity: q,
                                      total: calculateLineTotal(q, it.unitPrice, it.discountType, it.discountValue),
                                    }
                                  : it
                              )
                            );
                          }}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.inputLabel}>Rate (₹)</Text>
                        <TextInput
                          style={styles.modalInput}
                          keyboardType="numeric"
                          value={String(item.unitPrice)}
                          onChangeText={(val) => {
                            const r = Number(val) || 0;
                            setEditLineItems((prev) =>
                              prev.map((it, i) =>
                                i === idx
                                  ? {
                                      ...it,
                                      unitPrice: r,
                                      total: calculateLineTotal(it.quantity, r, it.discountType, it.discountValue),
                                    }
                                  : it
                              )
                            );
                          }}
                        />
                      </View>
                      <View style={{ flex: 1.1 }}>
                        <Text style={styles.inputLabel}>Discount ({item.discountType || '%'})</Text>
                        <View style={{ flexDirection: 'row', gap: 4 }}>
                          <TextInput
                            style={[styles.modalInput, { flex: 1 }]}
                            keyboardType="numeric"
                            value={String(item.discountValue || 0)}
                            onChangeText={(val) => {
                              const d = Number(val) || 0;
                              setEditLineItems((prev) =>
                                prev.map((it, i) =>
                                  i === idx
                                    ? {
                                        ...it,
                                        discountValue: d,
                                        total: calculateLineTotal(it.quantity, it.unitPrice, it.discountType, d),
                                      }
                                    : it
                                )
                              );
                            }}
                          />
                          <TouchableOpacity
                            style={styles.discToggleBtn}
                            onPress={() => {
                              const newType = item.discountType === '%' ? '₹' : '%';
                              setEditLineItems((prev) =>
                                prev.map((it, i) =>
                                  i === idx
                                    ? {
                                        ...it,
                                        discountType: newType,
                                        total: calculateLineTotal(it.quantity, it.unitPrice, newType, it.discountValue),
                                      }
                                    : it
                                )
                              );
                            }}
                          >
                            <Text style={styles.discToggleBtnText}>{item.discountType || '%'}</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4 }}>
                      <Text style={{ fontSize: 11, color: COLORS.textMuted }}>
                        Line Net: <Text style={{ color: '#C9F31D', fontWeight: 'bold' }}>₹{item.total.toLocaleString('en-IN')}</Text>
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Financials & Settlement */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionHeader}>Billing & Payment Status</Text>
                <View style={styles.twoColRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Overall Discount (₹)</Text>
                    <TextInput
                      style={styles.modalInput}
                      keyboardType="numeric"
                      value={editDiscount === '0' ? '' : editDiscount}
                      onChangeText={(text) => setEditDiscount(text.replace(/^0+(?=\d)/, ''))}
                      placeholder="0"
                      placeholderTextColor={COLORS.textMuted}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={styles.inputLabel}>Amount Paid (₹)</Text>
                      <TouchableOpacity
                        onPress={() => {
                          const curSub = editLineItems.reduce((acc, it) => acc + (it.total || 0), 0);
                          const curDisc = Number.parseFloat(editDiscount) || 0;
                          const curTot = Math.max(0, curSub - curDisc);
                          setEditPaidAmount(curTot.toString());
                          setEditStatus('paid');
                        }}
                      >
                        <Text style={{ fontSize: 10, color: COLORS.primary, fontWeight: 'bold' }}>✓ Paid in Full</Text>
                      </TouchableOpacity>
                    </View>
                    <TextInput
                      style={styles.modalInput}
                      keyboardType="numeric"
                      value={editPaidAmount === '0' ? '' : editPaidAmount}
                      onChangeText={(text) => {
                        const clean = text.replace(/^0+(?=\d)/, '');
                        setEditPaidAmount(clean);
                        const paidNum = Number.parseFloat(clean) || 0;
                        const curSub = editLineItems.reduce((acc, it) => acc + (it.total || 0), 0);
                        const curDisc = Number.parseFloat(editDiscount) || 0;
                        const curTot = Math.max(0, curSub - curDisc);
                        if (paidNum >= curTot && curTot > 0) {
                          setEditStatus('paid');
                        } else if (paidNum > 0) {
                          setEditStatus('partial');
                        } else {
                          setEditStatus('unpaid');
                        }
                      }}
                      placeholder="0"
                      placeholderTextColor={COLORS.textMuted}
                    />
                  </View>
                </View>

                <Text style={[styles.inputLabel, { marginTop: 10 }]}>Payment Mode</Text>
                <View style={styles.modeRow}>
                  {(['UPI', 'CASH', 'CARD'] as const).map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={[styles.modePill, editPaymentMode === m && styles.modePillActive]}
                      onPress={() => setEditPaymentMode(m)}
                    >
                      <Text style={[styles.modeText, editPaymentMode === m && styles.modeTextActive]}>
                        {m}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Save Button */}
              <View style={styles.totalSummaryBanner}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.totalSummaryLabel}>Net Bill Amount</Text>
                  <Text style={styles.totalSummaryVal}>
                    ₹{Math.max(
                      0,
                      editLineItems.reduce((acc, it) => acc + (it.total || 0), 0) -
                        (Number.parseFloat(editDiscount) || 0)
                    ).toLocaleString('en-IN')}
                  </Text>
                  <Text style={{ fontSize: 11, fontWeight: '700', marginTop: 3, color: (Math.max(0, editLineItems.reduce((acc, it) => acc + (it.total || 0), 0) - (Number.parseFloat(editDiscount) || 0)) - (Number.parseFloat(editPaidAmount) || 0)) > 0 ? '#EF4444' : '#10B981' }}>
                    Balance: ₹{Math.max(0, (Math.max(0, editLineItems.reduce((acc, it) => acc + (it.total || 0), 0) - (Number.parseFloat(editDiscount) || 0)) - (Number.parseFloat(editPaidAmount) || 0))).toLocaleString('en-IN')} ({editStatus.toUpperCase()})
                  </Text>
                </View>
                <MobilePearlButton
                  variant="gold"
                  onPress={handleSaveEditInvoice}
                  style={{ minWidth: 150 }}
                >
                  {savingEdit ? (
                    <MobileLoader text="Saving" />
                  ) : (
                    <>
                      <MaterialCommunityIcons
                        name="check"
                        size={18}
                        color={COLORS.background}
                        style={{ marginRight: 6 }}
                      />
                      <Text style={styles.pearlBtnText}>Save Changes</Text>
                    </>
                  )}
                </MobilePearlButton>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 5. Modal: Import Bills (CSV & JSON) */}
      <Modal
        visible={isImportModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsImportModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '75%' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Import Bills & Invoices</Text>
                <Text style={styles.modalSubtitle}>CSV and JSON File Formats Supported</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsImportModalOpen(false)}
                style={styles.closeBtn}
              >
                <MaterialCommunityIcons name="close" size={22} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalForm}>
              <View style={styles.importNoticeCard}>
                <MaterialCommunityIcons name="file-document-multiple-outline" size={32} color="#C9F31D" />
                <Text style={styles.importNoticeTitle}>Seamless Workshop Data Migration</Text>
                <Text style={styles.importNoticeText}>
                  Import bills exported from the Web App, Tally, Excel, or custom JSON.
                  Customers, vehicles, and line-item spare parts will be automatically resolved.
                </Text>
              </View>

              <View style={styles.supportedFormatCard}>
                <Text style={styles.supportedFormatTitle}>Supported Formats:</Text>
                <Text style={styles.supportedFormatRow}>• .JSON — MotoBan Web App bill export array</Text>
                <Text style={styles.supportedFormatRow}>• .CSV — Standard spreadsheet with Invoice, Customer, Phone, Items, Rates</Text>
              </View>

              <TouchableOpacity
                style={styles.selectFileBigBtn}
                onPress={handleSelectImportFile}
                disabled={importing}
                activeOpacity={0.8}
              >
                {importing ? (
                  <MobileLoader text="Importing Bills..." />
                ) : (
                  <>
                    <MaterialCommunityIcons name="cloud-upload-outline" size={24} color="#0B0F19" />
                    <Text style={styles.selectFileBigBtnText}>Choose CSV or JSON File</Text>
                  </>
                )}
              </TouchableOpacity>
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
  topBtnGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  importBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(201, 243, 29, 0.12)',
    borderWidth: 1,
    borderColor: '#C9F31D',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  importBtnText: {
    color: '#C9F31D',
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'System',
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
    backgroundColor: 'rgba(201, 243, 29, 0.18)',
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
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'System',
  },
  actionsGridRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionBtnWhatsApp: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#25D366',
    backgroundColor: 'rgba(37, 211, 102, 0.08)',
  },
  actionBtnWhatsAppText: {
    color: '#25D366',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'System',
  },
  actionBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(201, 243, 29, 0.12)',
  },
  actionBtnSecondaryText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'System',
  },
  actionBtnSow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#8B5CF6',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  actionBtnSowText: {
    color: '#A78BFA',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'System',
  },
  actionBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
  },
  actionBtnPrimaryText: {
    color: COLORS.background,
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'System',
  },
  actionBtnEdit: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F59E0B',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  actionBtnEditText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'System',
  },
  actionBtnPhoto: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#06B6D4',
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
  },
  actionBtnPhotoText: {
    color: '#06B6D4',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'System',
  },
  photoCaptureCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  photoCaptureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  photoRemoveText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '600',
  },
  photoCaptureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  photoThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C9F31D',
  },
  photoBtnGroup: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  photoActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  photoActionBtnText: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '600',
  },
  discToggleBtn: {
    backgroundColor: 'rgba(201, 243, 29, 0.15)',
    borderWidth: 1,
    borderColor: '#C9F31D',
    borderRadius: 8,
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  discToggleBtnText: {
    color: '#C9F31D',
    fontWeight: 'bold',
    fontSize: 12,
  },
  editLineItemCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  importNoticeCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(201, 243, 29, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(201, 243, 29, 0.25)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
  },
  importNoticeTitle: {
    color: '#C9F31D',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'System',
  },
  importNoticeText: {
    color: COLORS.textMuted,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'System',
  },
  supportedFormatCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    marginBottom: 16,
  },
  supportedFormatTitle: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'System',
  },
  supportedFormatRow: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'System',
  },
  selectFileBigBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#C9F31D',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 8,
  },
  selectFileBigBtnText: {
    color: '#0B0F19',
    fontSize: 13.5,
    fontWeight: 'bold',
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
    backgroundColor: '#C9F31D',
    borderColor: '#C9F31D',
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
  lineItemExpl: {
    fontSize: 9.5,
    color: '#94A3B8',
    marginTop: 2,
    lineHeight: 12.5,
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
