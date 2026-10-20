import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert, Modal, TextInput, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatThermalReceipt, printOrShareReceipt, ThermalPaperWidth } from '../services/thermalPrinter';
import { API } from '../services/api';

export default function SettingsScreen({ navigation }: any) {
  const [gstEnabled, setGstEnabled] = React.useState(false);
  const [syncing, setSyncing] = React.useState(false);

  // Thermal Printer Setup State
  const [isPrinterModalOpen, setIsPrinterModalOpen] = React.useState(false);
  const [paperWidth, setPaperWidth] = React.useState<ThermalPaperWidth>('58mm');
  const [shopTagline, setShopTagline] = React.useState('Express Automotive Care & Tuning');
  const [upiVpa, setUpiVpa] = React.useState('');

  // SaaS Trial & Licensing State
  const [isLicenseModalOpen, setIsLicenseModalOpen] = React.useState(false);
  const [licensingData, setLicensingData] = React.useState<any>(null);
  const [licenseKeyInput, setLicenseKeyInput] = React.useState('');
  const [activatingKey, setActivatingKey] = React.useState(false);

  const loadLicensing = async () => {
    try {
      const data = await API.getLicensingStatus();
      if (data && !data.error) {
        setLicensingData(data);
      }
    } catch (e) {
      console.warn('Failed to fetch licensing status on mobile:', e);
    }
  };

  React.useEffect(() => {
    void loadLicensing();
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
    let brandingData: any = null;
    try {
      brandingData = await API.getBranding();
    } catch {}
    await printOrShareReceipt(
      {
        workshopName: brandingData?.garageName || 'Test Workshop',
        tagline: shopTagline || brandingData?.tagline || 'Diagnostics & Servicing',
        phone: brandingData?.phone || '',
        address: brandingData?.address || '',
        invoiceNumber: 'TEST-001',
        date: new Date().toLocaleDateString('en-IN'),
        customerName: 'Test Alignment',
        customerPhone: '',
        vehicleNumber: 'TEST-VEHICLE',
        rtoOffice: '',
        items: [
          { description: 'Printer Alignment & Test Slip', qty: 1, rate: 100, amount: 100 },
        ],
        subtotal: 100,
        cgst: gstEnabled ? 9 : 0,
        sgst: gstEnabled ? 9 : 0,
        total: gstEnabled ? 118 : 100,
        paid: gstEnabled ? 118 : 100,
        balance: 0,
        paymentMode: 'CASH',
        upiVpa: upiVpa || undefined,
      },
      paperWidth
    );
  };

  const sampleSlipText = formatThermalReceipt(
    {
      workshopName: 'Workshop Receipt Preview',
      tagline: shopTagline,
      phone: '',
      invoiceNumber: 'TEST-001',
      date: new Date().toLocaleDateString('en-IN'),
      customerName: 'Walk-in Customer',
      vehicleNumber: 'XX-00-XX-0000',
      rtoOffice: '',
      items: [
        { description: 'General Servicing Labor', amount: 450 },
        { description: 'Consumables & Parts', amount: 350 },
      ],
      subtotal: 800,
      cgst: gstEnabled ? 72 : 0,
      sgst: gstEnabled ? 72 : 0,
      total: gstEnabled ? 944 : 800,
      paid: gstEnabled ? 944 : 800,
      balance: 0,
      paymentMode: 'CASH',
      upiVpa: upiVpa || undefined,
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

  const handleActivateLicenseKey = async () => {
    if (!licenseKeyInput.trim()) {
      Alert.alert('Required', 'Please enter your License Key or VIP Founder Pass.');
      return;
    }
    try {
      setActivatingKey(true);
      const res = await API.activateLicense(licenseKeyInput.trim().toUpperCase());
      if (res?.error) {
        Alert.alert('Activation Failed', res.error);
      } else {
        Alert.alert(
          'License Activated! 🎉',
          res.message || 'Your MotoBan Pro license is now active with unlimited access.'
        );
        setLicenseKeyInput('');
        await loadLicensing();
        setIsLicenseModalOpen(false);
      }
    } catch {
      Alert.alert('Error', 'Failed to connect to licensing server.');
    } finally {
      setActivatingKey(false);
    }
  };

  const getLicenseSubtitle = () => {
    if (licensingData?.isVip) return 'VIP Founding Partner (100% Free Lifetime)';
    if (licensingData?.isPro) return 'MotoBan Pro License Active';
    if (licensingData?.isExpired) return '15-Day Trial Expired · Upgrade to continue';
    const days = licensingData?.daysRemaining ?? 15;
    return `15-Day Free Trial (${days} days left · 2/day limit)`;
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
      title: 'License & SaaS Subscription',
      subtitle: getLicenseSubtitle(),
      onPress: () => setIsLicenseModalOpen(true),
    },
    {
      icon: 'printer-outline',
      title: 'Thermal Printer Setup',
      subtitle: `Configured: ${paperWidth} Bluetooth & USB POS`,
      onPress: () => setIsPrinterModalOpen(true),
    },
  ];

  const getLicenseBadgeStyle = (lic: any) => {
    if (lic?.isVip) return styles.badgeVip;
    if (lic?.isPro) return styles.badgePro;
    if (lic?.isExpired) return styles.badgeExpired;
    return styles.badgeTrial;
  };

  const getLicenseBadgeIcon = (lic: any): any => {
    if (lic?.isVip) return 'crown';
    if (lic?.isPro) return 'check-decagram';
    if (lic?.isExpired) return 'alert-circle';
    return 'clock-outline';
  };

  const getLicenseBadgeColor = (lic: any): string => {
    if (lic?.isVip) return '#D97706';
    if (lic?.isPro) return '#10B981';
    if (lic?.isExpired) return '#EF4444';
    return COLORS.primary;
  };

  const getLicenseBadgeTitle = (lic: any): string => {
    if (lic?.isVip) return 'VIP Founding Partner Garage';
    if (lic?.isPro) return 'MotoBan Pro Licensed';
    if (lic?.isExpired) return '15-Day Trial Expired';
    return `15-Day Free Trial (${lic?.daysRemaining ?? 15} Days Left)`;
  };

  const getLicenseBadgeSub = (lic: any): string => {
    if (lic?.isVip) return '100% Free Lifetime Full Access to all ecosystem modules.';
    if (lic?.isPro) return 'Commercial license active. Unlimited bills, job cards, and sync.';
    return 'Max 2 Bills, 2 Estimates, and 2 Job Cards per day.';
  };

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

      {/* SaaS Subscription & Licensing Modal */}
      <Modal visible={isLicenseModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialCommunityIcons name="shield-check" size={24} color={COLORS.primary} />
                <Text style={styles.modalTitle}>Licensing & Plans</Text>
              </View>
              <TouchableOpacity onPress={() => setIsLicenseModalOpen(false)}>
                <MaterialCommunityIcons name="close" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 16 }} contentContainerStyle={{ paddingBottom: 24 }}>
              {/* Status Header Badge */}
              <View style={[styles.licenseBadgeBox, getLicenseBadgeStyle(licensingData)]}>
                <MaterialCommunityIcons
                  name={getLicenseBadgeIcon(licensingData)}
                  size={20}
                  color={getLicenseBadgeColor(licensingData)}
                />
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <Text style={styles.licenseBadgeTitle}>
                    {getLicenseBadgeTitle(licensingData)}
                  </Text>
                  <Text style={styles.licenseBadgeSub}>
                    {getLicenseBadgeSub(licensingData)}
                  </Text>
                </View>
              </View>

              {/* Daily Quota Counter (Trial only) */}
              {!licensingData?.isVip && !licensingData?.isPro && (
                <View style={styles.quotaBox}>
                  <Text style={styles.quotaBoxTitle}>TODAY&apos;S TRIAL QUOTA (LIMIT 2 / DAY)</Text>
                  <View style={styles.quotaRow}>
                    <Text style={styles.quotaLabel}>🧾 Bills / Invoices</Text>
                    <Text style={styles.quotaValue}>{licensingData?.dailyQuota?.bills?.used ?? 0} / 2 Used</Text>
                  </View>
                  <View style={styles.quotaRow}>
                    <Text style={styles.quotaLabel}>📋 Estimates / Quotes</Text>
                    <Text style={styles.quotaValue}>{licensingData?.dailyQuota?.estimates?.used ?? 0} / 2 Used</Text>
                  </View>
                  <View style={styles.quotaRow}>
                    <Text style={styles.quotaLabel}>🛠️ Job Cards</Text>
                    <Text style={styles.quotaValue}>{licensingData?.dailyQuota?.jobCards?.used ?? 0} / 2 Used</Text>
                  </View>
                </View>
              )}

              {/* Pricing Tiers Carousel / Cards */}
              <Text style={[styles.modalSectionLabel, { marginTop: 16 }]}>SUBSCRIPTION TIERS</Text>

              {/* Monthly */}
              <View style={styles.tierCard}>
                <View style={styles.tierHeaderRow}>
                  <Text style={styles.tierName}>Monthly Plan</Text>
                  <Text style={styles.tierPrice}>₹1,299<Text style={{ fontSize: 11, color: COLORS.textMuted }}>/mo</Text></Text>
                </View>
                <Text style={styles.tierFeatures}>• Unlimited Invoices, Estimates & Job Cards</Text>
                <Text style={styles.tierFeatures}>• Dynamic Counter UPI QR & WhatsApp Dispatch</Text>
                <Text style={styles.tierFeatures}>• Up to 5 Staff User Accounts Included</Text>
              </View>

              {/* Quarterly */}
              <View style={styles.tierCard}>
                <View style={styles.tierHeaderRow}>
                  <View>
                    <Text style={styles.tierName}>Quarterly Plan</Text>
                    <Text style={styles.savingsTag}>Save 15%</Text>
                  </View>
                  <Text style={styles.tierPrice}>₹1,099<Text style={{ fontSize: 11, color: COLORS.textMuted }}>/mo</Text></Text>
                </View>
                <Text style={{ fontSize: 11, color: COLORS.primary, marginBottom: 4 }}>Billed ₹3,297 every 3 months</Text>
                <Text style={styles.tierFeatures}>• Everything in Monthly</Text>
                <Text style={styles.tierFeatures}>• 4-Sided Pre-Inspection Dent Photo Shield</Text>
                <Text style={styles.tierFeatures}>• Customer Credit & Ledger Tracking</Text>
              </View>

              {/* Yearly - Best Value */}
              <View style={[styles.tierCard, styles.tierCardFeatured]}>
                <View style={styles.featuredBadge}>
                  <Text style={styles.featuredBadgeText}>⭐ MOST POPULAR · SAVE 31%</Text>
                </View>
                <View style={styles.tierHeaderRow}>
                  <View>
                    <Text style={[styles.tierName, { color: COLORS.primary }]}>Annual Pro Plan</Text>
                    <Text style={styles.savingsTag}>Save ₹4,800/yr</Text>
                  </View>
                  <Text style={[styles.tierPrice, { color: COLORS.primary }]}>₹899<Text style={{ fontSize: 11, color: COLORS.textMuted }}>/mo</Text></Text>
                </View>
                <Text style={{ fontSize: 11, color: '#10B981', marginBottom: 4, fontWeight: 'bold' }}>Billed ₹10,788 yearly (Just ₹29/day)</Text>
                <Text style={styles.tierFeatures}>• Everything in Quarterly</Text>
                <Text style={styles.tierFeatures}>• Indian VAHAN / RTO Plate Decoder</Text>
                <Text style={styles.tierFeatures}>• Low-Stock Inventory Alerts & Subdomain</Text>
                <Text style={styles.tierFeatures}>• VIP 24/7 Dedicated Support</Text>
              </View>

              {/* Lifetime */}
              <View style={styles.tierCard}>
                <View style={styles.tierHeaderRow}>
                  <View>
                    <Text style={styles.tierName}>Perpetual License</Text>
                    <Text style={[styles.savingsTag, { backgroundColor: '#8B5CF6' }]}>Zero Renewal Fees</Text>
                  </View>
                  <Text style={styles.tierPrice}>₹15,999<Text style={{ fontSize: 11, color: COLORS.textMuted }}> one-time</Text></Text>
                </View>
                <Text style={styles.tierFeatures}>• 2 Years Guaranteed Feature Drops</Text>
                <Text style={styles.tierFeatures}>• Air-Gapped Offline Local SQLite Vault</Text>
                <Text style={styles.tierFeatures}>• Lifetime Commercial Ownership</Text>
              </View>

              {/* Addons */}
              <Text style={[styles.modalSectionLabel, { marginTop: 16 }]}>ECOSYSTEM ADDONS</Text>
              <View style={styles.addonCard}>
                <Text style={styles.addonTitle}>🏢 Multi-Location / Franchise</Text>
                <Text style={styles.addonPrice}>₹6,999 / additional shop</Text>
                <Text style={styles.addonDesc}>Centralized multi-bay reporting & unified vehicle history</Text>
              </View>
              <View style={styles.addonCard}>
                <Text style={styles.addonTitle}>👥 Extra Staff User Seat</Text>
                <Text style={styles.addonPrice}>₹1,599 / user above 5</Text>
                <Text style={styles.addonDesc}>Individual technician login with role-based permissions</Text>
              </View>

              {/* License Activation Form */}
              <Text style={[styles.modalSectionLabel, { marginTop: 20 }]}>ACTIVATE LICENSE / VIP FOUNDER KEY</Text>
              <TextInput
                style={styles.licenseInput}
                placeholder="XXXX-XXXX-XXXX-XXXX"
                placeholderTextColor={COLORS.textMuted}
                value={licenseKeyInput}
                onChangeText={(t) => setLicenseKeyInput(t.toUpperCase())}
                autoCapitalize="characters"
              />
              <Text style={styles.vipHelperText}>
                💡 Founding Garages (motofit2@garagesaas.com & VIP Partner) receive 100% Free Lifetime Full Access. VIP Founder Master Keys are accepted.
              </Text>

              <TouchableOpacity
                style={styles.activateBtn}
                onPress={handleActivateLicenseKey}
                disabled={activatingKey}
              >
                <MaterialCommunityIcons name="shield-key" size={18} color={COLORS.background} />
                <Text style={styles.activateBtnText}>
                  {activatingKey ? 'Verifying...' : 'Activate License'}
                </Text>
              </TouchableOpacity>

              {/* Contact Founders to Upgrade */}
              <TouchableOpacity
                style={styles.whatsappUpgradeBtn}
                onPress={() => Linking.openURL('https://wa.me/916359635416?text=Hi%20MotoBan,%20I%20want%20to%20upgrade%20my%20garage%20subscription.')}
              >
                <MaterialCommunityIcons name="whatsapp" size={20} color="#25D366" />
                <Text style={styles.whatsappUpgradeBtnText}>Contact Founder Desk to Upgrade</Text>
              </TouchableOpacity>
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
  licenseBadgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  badgeVip: {
    backgroundColor: 'rgba(217, 119, 6, 0.1)',
    borderColor: '#D97706',
  },
  badgePro: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: '#10B981',
  },
  badgeExpired: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: '#EF4444',
  },
  badgeTrial: {
    backgroundColor: 'rgba(201, 243, 29, 0.1)',
    borderColor: COLORS.primary,
  },
  licenseBadgeTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  licenseBadgeSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  quotaBox: {
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  quotaBoxTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.8,
    color: COLORS.primary,
    marginBottom: 8,
  },
  quotaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  quotaLabel: {
    fontSize: 12,
    color: COLORS.text,
  },
  quotaValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  tierCard: {
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  tierCardFeatured: {
    borderColor: COLORS.primary,
    borderWidth: 1.5,
    backgroundColor: 'rgba(201, 243, 29, 0.03)',
  },
  featuredBadge: {
    backgroundColor: COLORS.primary,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 6,
  },
  featuredBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.background,
  },
  tierHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  tierName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  tierPrice: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.text,
  },
  savingsTag: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFF',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 2,
    alignSelf: 'flex-start',
  },
  tierFeatures: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  addonCard: {
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
  },
  addonTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  addonPrice: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 2,
  },
  addonDesc: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  licenseInput: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.text,
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  vipHelperText: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 6,
    lineHeight: 14,
  },
  activateBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  activateBtnText: {
    color: COLORS.background,
    fontWeight: 'bold',
    fontSize: 13,
  },
  whatsappUpgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#25D366',
    gap: 8,
    marginTop: 10,
    backgroundColor: 'rgba(37, 211, 102, 0.05)',
  },
  whatsappUpgradeBtnText: {
    color: '#25D366',
    fontWeight: 'bold',
    fontSize: 12,
  },
});
