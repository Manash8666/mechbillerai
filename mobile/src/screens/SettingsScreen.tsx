import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const menuItems = [
    { icon: 'shield-key-outline', title: 'License Status', subtitle: 'Lifetime License Active' },
    { icon: 'palette-outline', title: 'Garage Branding', subtitle: 'Gold & Slate Theme' },
    { icon: 'printer-outline', title: 'Thermal Printer Setup', subtitle: 'Bluetooth & USB' },
    { icon: 'translate', title: 'Language', subtitle: 'English (ગુજરાતી, हिंदी)' },
    { icon: 'database-sync-outline', title: 'Cloud Sync', subtitle: 'Connected to local server' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.profileCard}>
        <MaterialCommunityIcons name="shield-check" size={32} color={COLORS.primary} />
        <View style={{ marginLeft: 14 }}>
          <Text style={styles.garageName}>Garage SaaS - Mobile</Text>
          <Text style={styles.plan}>Version 1.0.0 (Android)</Text>
        </View>
      </View>

      <View style={styles.menuList}>
        {menuItems.map((item, index) => (
          <TouchableOpacity key={index} style={styles.menuItem}>
            <MaterialCommunityIcons name={item.icon as any} size={22} color={COLORS.primary} style={{ marginRight: 14 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
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
});
