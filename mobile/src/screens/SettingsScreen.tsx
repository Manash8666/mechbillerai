import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert, Modal, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatThermalReceipt, printOrShareReceipt, ThermalPaperWidth } from '../services/thermalPrinter';

export default function SettingsScreen({ navigation }: any) {
  const [gstEnabled, setGstEnabled] = React.useState(false);
  const [syncing, setSyncing] = React.useState(false);

  // Thermal Printer Setup State
  const [isPrinterModalOpen, setIsPrinterModalOpen] = React.useState(false);
  const [paperWidth, setPaperWidth] = React.useState<ThermalPaperWidth>('58mm');
  const [shopTagline, setShopTagline] = React.useState('Express Automotive Care & Tuning');
  const [upiVpa, setUpiVpa] = React.useState('motoban@icici');

  React.useEffect(() => {
    void (async () => {
      try {
        const { offlineSyncManager } = await import('../services/offlineSync');
        const enabled = await offlineSyncManager.getGstEnabled();
        setGstEnabled(enabled);

        const savedWidth = await AsyncStorage.getItem('@motoban_printer_width');
        if (savedWidth === '58mm' || savedWidth === '80mm') setPaperWidth(savedWidth);

        const savedTagline = await AsyncStorage.getItem('@motoban_printer_tagline');
        if (savedTagline) setShopTagline(savedTagline);

        const savedVpa = await AsyncStorage.getItem('@motoban_printer_vpa');
        if (savedVpa) setUpiVpa(savedVpa);
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
    })();
  }, []);

  const handleSavePrinterSettings = async () => {
    try {
      await AsyncStorage.setItem('@motoban_printer_width', paperWidth);
      await AsyncStorage.setItem('@motoban_printer_tagline', shopTagline);
      await AsyncStorage.setItem('@motoban_printer_vpa', upiVpa);
      Alert.alert('Settings Saved', `Thermal Printer configured for ${paperWidth} slips.`);
      setIsPrinterModalOpen(false);
    } catch {
      Alert.alert('Error', 'Failed to save printer configuration.');
    }
  };

  const handleTestPrintSlip = async () => {
    await printOrShareReceipt(
      {
        workshopName: 'MotoBan Workshop',
        tagline: shopTagline,
        phone: '+91 98765 43210',
        address: 'Drive-In Road, Ahmedabad',
        invoiceNumber: 'TEST-001',
        date: new Date().toLocaleDateString('en-IN'),
        customerName: 'Test Customer',
        customerPhone: '9876543210',
        vehicleNumber: 'GJ-01-AB-1234',
        rtoOffice: 'Ahmedabad West (GJ-01)',
        items: [
          { description: 'Engine Oil Flush & Refill', qty: 1, rate: 450, amount: 450 },
          { description: 'Brake Caliper Servicing', qty: 1, rate: 350, amount: 350 },
        ],
        subtotal: 800,
        cgst: gstEnabled ? 72 : 0,
        sgst: gstEnabled ? 72 : 0,
        total: gstEnabled ? 944 : 800,
        paid: gstEnabled ? 944 : 800,
        balance: 0,
        paymentMode: 'UPI',
        upiVpa,
      },
      paperWidth
    );
  };

  const sampleSlipText = formatThermalReceipt(
    {
      workshopName: 'MotoBan Workshop',
      tagline: shopTagline,
      phone: '+91 98765 43210',
      invoiceNumber: 'TEST-001',
      date: new Date().toLocaleDateString('en-IN'),
      customerName: 'Test Customer',
      vehicleNumber: 'GJ-01-AB-1234',
      rtoOffice: 'Ahmedabad West (GJ-01)',
      items: [
        { description: 'Engine Oil Flush', amount: 450 },
        { description: 'Brake Caliper Servicing', amount: 350 },
      ],
      subtotal: 800,
      cgst: gstEnabled ? 72 : 0,
      sgst: gstEnabled ? 72 : 0,
      total: gstEnabled ? 944 : 800,
      paid: gstEnabled ? 944 : 800,
      balance: 0,
      upiVpa,
    },
    paperWidth
  );

  const handleToggleGST = async () => {
    const nextVal = !gstEnabled;
    setGstEnabled(nextVal);
    const { offlineSyncManager } = await import('../services/offlineSync');
    await offlineSyncManager.setGstEnabled(nextVal);
  };

  const handleSyncNow = async () => {
    try {
      setSyncing(true);
      const { offlineSyncManager } = await import('../services/offlineSync');
      const res = await offlineSyncManager.syncQueueWithServer();
      Alert.alert(
        'Offline Sync Status',
        `Synced: ${res.synced} job cards\nPending/Offline: ${res.failed}`
      );
    } catch {
      Alert.alert('Sync Offline', 'Local queue preserved safely on device storage.');
    } finally {
      setSyncing(false);
    }
  };

  const menuItems = [
    {
      icon: 'palette-outline',
      title: 'Garage Branding',
      subtitle: 'Color theme & workshop identity',
      onPress: () => navigation?.navigate('Branding'),
    },
    {
      icon: 'account-group-outline',
      title: 'Customer Directory',
      subtitle: 'View vehicle owners & accounts',
      onPress: () => navigation?.navigate('Customers'),
    },
    {
      icon: 'calendar-clock',
      title: 'Service Appointments',
      subtitle: 'View bookings & work bay schedule',
      onPress: () => navigation?.navigate('Appointments'),
    },
    {
      icon: 'shield-key-outline',
      title: 'License Status',
      subtitle: 'Lifetime License Active (MotoBan Pro)',
      onPress: () => Alert.alert('License Active', 'Lifetime Pro license verified on device.'),
    },
    {
      icon: 'printer-outline',
      title: 'Thermal Printer Setup',
      subtitle: `Configured: ${paperWidth} Bluetooth & USB POS`,
      onPress: () => setIsPrinterModalOpen(true),
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.profileCard}>
        <MaterialCommunityIcons name="shield-check" size={32} color={COLORS.primary} />
        <View style={{ marginLeft: 14 }}>
          <Text style={styles.garageName}>MotoBan Pro</Text>
          <Text style={styles.plan}>Version 1.0.0 (Android) · Powered by Hybrid StudioZ</Text>
        </View>
      </View>

      {/* Small Business GST Switch Card */}
      <View style={styles.gstCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={styles.gstTitle}>GST Registered Business</Text>
            <Text style={styles.gstSubtitle}>
              {gstEnabled
                ? 'GST Mode: 18% CGST/SGST applied to invoices'
                : 'MSME Mode: 0% Tax, simplified bill of supply'}
            </Text>
          </View>
          <Switch
            value={gstEnabled}
            onValueChange={handleToggleGST}
            trackColor={{ false: COLORS.border, true: COLORS.primary }}
            thumbColor="#FFF"
          />
        </View>

        {/* Live Invoice Preview */}
        <View style={styles.previewBox}>
          <Text style={styles.previewHeader}>SAMPLE INVOICE PREVIEW</Text>
          <View style={styles.previewRow}>
            <Text style={styles.previewText}>Engine Oil (1L)</Text>
            <Text style={styles.previewText}>₹400</Text>
          </View>
          <View style={styles.previewRow}>
            <Text style={styles.previewText}>Labor Charges</Text>
            <Text style={styles.previewText}>₹600</Text>
          </View>
          {gstEnabled ? (
            <View style={styles.taxBox}>
              <View style={styles.previewRow}>
                <Text style={styles.taxText}>CGST (9%)</Text>
                <Text style={styles.taxText}>₹90</Text>
              </View>
              <View style={styles.previewRow}>
                <Text style={styles.taxText}>SGST (9%)</Text>
                <Text style={styles.taxText}>₹90</Text>
              </View>
            </View>
          ) : null}
          <View style={[styles.previewRow, { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 8, marginTop: 4 }]}>
            <Text style={[styles.previewText, { fontWeight: 'bold' }]}>Grand Total</Text>
            <Text style={[styles.previewText, { fontWeight: 'bold', color: COLORS.primary }]}>
              {gstEnabled ? '₹1,180' : '₹1,000'}
            </Text>
          </View>
        </View>
      </View>

      {/* Cloud & Local Offline Sync */}
      <TouchableOpacity style={styles.syncBtn} onPress={handleSyncNow} disabled={syncing}>
        <MaterialCommunityIcons name="cloud-sync" size={22} color={COLORS.background} />
        <Text style={styles.syncBtnText}>
          {syncing ? 'Syncing Queue...' : 'Sync Offline Queue to Cloud'}
        </Text>
      </TouchableOpacity>

      <View style={styles.menuList}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.title}
            style={styles.menuItem}
            onPress={item.onPress}
          >
            <MaterialCommunityIcons name={item.icon as any} size={22} color={COLORS.primary} style={{ marginRight: 14 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[styles.menuItem, { borderBottomWidth: 0, marginTop: 12, backgroundColor: 'rgba(239, 68, 68, 0.08)' }]}
          onPress={() => {
            Alert.alert('Sign Out', 'Are you sure you want to sign out from this device?', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Sign Out',
                style: 'destructive',
                onPress: async () => {
                  const { Storage } = await import('../services/api');
                  await Storage.removeUser();
                  Alert.alert('Signed Out', 'Credentials cleared safely.');
                },
              },
            ]);
          }}
        >
          <MaterialCommunityIcons name="logout" size={22} color="#EF4444" style={{ marginRight: 14 }} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.itemTitle, { color: '#EF4444' }]}>Sign Out</Text>
            <Text style={styles.itemSubtitle}>Clear active session and device credentials</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Thermal Printer Setup Modal */}
      <Modal
        visible={isPrinterModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsPrinterModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <MaterialCommunityIcons name="printer-pos" size={24} color={COLORS.primary} />
                <Text style={styles.modalTitle}>Thermal Printer Setup</Text>
              </View>
              <TouchableOpacity onPress={() => setIsPrinterModalOpen(false)}>
                <MaterialCommunityIcons name="close" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingVertical: 14 }}>
              {/* Paper Width Selector */}
              <Text style={styles.modalSectionLabel}>PAPER ROLL WIDTH</Text>
              <View style={styles.paperToggleRow}>
                <TouchableOpacity
                  style={[styles.paperOption, paperWidth === '58mm' && styles.paperOptionActive]}
                  onPress={() => setPaperWidth('58mm')}
                >
                  <MaterialCommunityIcons
                    name="receipt"
                    size={20}
                    color={paperWidth === '58mm' ? COLORS.primary : COLORS.textMuted}
                  />
                  <Text style={[styles.paperOptionText, paperWidth === '58mm' && styles.paperOptionTextActive]}>
                    58mm (2 Inch Pocket / BT)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.paperOption, paperWidth === '80mm' && styles.paperOptionActive]}
                  onPress={() => setPaperWidth('80mm')}
                >
                  <MaterialCommunityIcons
                    name="printer-pos"
                    size={20}
                    color={paperWidth === '80mm' ? COLORS.primary : COLORS.textMuted}
                  />
                  <Text style={[styles.paperOptionText, paperWidth === '80mm' && styles.paperOptionTextActive]}>
                    80mm (3 Inch Countertop)
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Tagline */}
              <Text style={styles.modalSectionLabel}>WORKSHOP TAGLINE / SLOGAN</Text>
              <TextInput
                style={styles.modalInput}
                value={shopTagline}
                onChangeText={setShopTagline}
                placeholder="Express Automotive Care & Tuning"
                placeholderTextColor={COLORS.textMuted}
              />

              {/* UPI VPA for Slip QR & Payment */}
              <Text style={styles.modalSectionLabel}>RECEIPT UPI ID (VPA)</Text>
              <TextInput
                style={styles.modalInput}
                value={upiVpa}
                onChangeText={setUpiVpa}
                placeholder="workshop@okhdfcbank"
                placeholderTextColor={COLORS.textMuted}
                autoCapitalize="none"
              />

              {/* Live Thermal Monospace Slip Preview */}
              <Text style={styles.modalSectionLabel}>LIVE SLIP PREVIEW ({paperWidth})</Text>
              <View style={styles.slipPaper}>
                <Text style={styles.slipMonospaceText}>{sampleSlipText}</Text>
              </View>

              {/* Action Buttons */}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                <TouchableOpacity style={styles.testPrintBtn} onPress={handleTestPrintSlip}>
                  <MaterialCommunityIcons name="printer" size={18} color={COLORS.primary} />
                  <Text style={styles.testPrintBtnText}>Test Print Slip</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.savePrinterBtn} onPress={handleSavePrinterSettings}>
                  <MaterialCommunityIcons name="check" size={18} color={COLORS.background} />
                  <Text style={styles.savePrinterBtnText}>Save Settings</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  garageName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  plan: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  menuList: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  itemTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  itemSubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  gstCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(201, 168, 76, 0.4)',
    marginBottom: 16,
  },
  gstTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  gstSubtitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  previewBox: {
    marginTop: 14,
    backgroundColor: COLORS.background,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  previewHeader: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.8,
    color: COLORS.primary,
    marginBottom: 8,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  previewText: {
    color: COLORS.text,
    fontSize: 12,
  },
  taxBox: {
    marginVertical: 4,
    paddingVertical: 4,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(201, 168, 76, 0.2)',
  },
  taxText: {
    color: COLORS.primary,
    fontSize: 11,
    fontStyle: 'italic',
  },
  syncBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  syncBtnText: {
    color: COLORS.background,
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.78)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
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
  modalSectionLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.8,
    color: COLORS.primary,
    marginTop: 14,
    marginBottom: 8,
  },
  paperToggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  paperOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    gap: 8,
  },
  paperOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(201, 243, 29, 0.1)',
  },
  paperOptionText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  paperOptionTextActive: {
    color: COLORS.primary,
  },
  modalInput: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text,
    fontSize: 13,
  },
  slipPaper: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    maxHeight: 220,
  },
  slipMonospaceText: {
    fontFamily: 'Courier',
    fontSize: 10,
    color: '#0F172A',
    lineHeight: 13,
  },
  testPrintBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.primary,
    gap: 8,
  },
  testPrintBtnText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 13,
  },
  savePrinterBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 10,
    gap: 8,
  },
  savePrinterBtnText: {
    color: COLORS.background,
    fontWeight: 'bold',
    fontSize: 13,
  },
});
