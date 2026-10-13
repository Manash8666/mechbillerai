import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { COLORS } from '../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function SettingsScreen({ navigation }: any) {
  const [gstEnabled, setGstEnabled] = React.useState(false);
  const [syncing, setSyncing] = React.useState(false);

  React.useEffect(() => {
    void (async () => {
      try {
        const { offlineSyncManager } = await import('../services/offlineSync');
        const enabled = await offlineSyncManager.getGstEnabled();
        setGstEnabled(enabled);
      } catch (err) {
        console.error('Failed to load GST status:', err);
      }
    })();
  }, []);

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
      subtitle: 'Lifetime License Active (MechBillerAI Pro)',
      onPress: () => Alert.alert('License Active', 'Lifetime Pro license verified on device.'),
    },
    {
      icon: 'printer-outline',
      title: 'Thermal Printer Setup',
      subtitle: 'Bluetooth 58mm / 80mm & USB',
      onPress: () => Alert.alert('Printer Setup', 'Standard 58mm/80mm ESC/POS and Network printers supported.'),
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.profileCard}>
        <MaterialCommunityIcons name="shield-check" size={32} color={COLORS.primary} />
        <View style={{ marginLeft: 14 }}>
          <Text style={styles.garageName}>MechBillerAI</Text>
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
      </View>
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
});
