import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { COLORS } from '../constants/theme';
import { API } from '../services/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const PRESET_COLORS = [
  '#C9A84C', // Gold
  '#2563EB', // Royal Blue
  '#10B981', // Emerald Green
  '#DC2626', // Crimson Red
  '#8B5CF6', // Purple
  '#F59E0B', // Amber
  '#0EA5E9', // Sky Blue
  '#EC4899', // Pink
];

export default function BrandingScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [garageName, setGarageName] = useState('MechBillerAI Workshop');
  const [tagline, setTagline] = useState('Automotive Care & Precision Engineering');
  const [phone, setPhone] = useState('+91 99999 88888');
  const [address, setAddress] = useState('Plot 42, Auto Hub Industrial Area');
  const [gstin, setGstin] = useState('24AABCM1234F1Z5');
  const [primaryColor, setPrimaryColor] = useState('#C9A84C');

  useEffect(() => {
    fetchBranding();
  }, []);

  const fetchBranding = async () => {
    try {
      const data = await API.getBranding();
      if (data) {
        if (data.garageName) setGarageName(data.garageName);
        if (data.primaryColor) setPrimaryColor(data.primaryColor);
      }
    } catch (e) {
      console.error('Failed to load branding:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await API.updateBranding({
        garageName,
        primaryColor,
      });
      Alert.alert('Branding Saved', 'Workshop branding and brand accents updated successfully!');
    } catch {
      Alert.alert('Error', 'Could not save branding changes.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading Workshop Identity...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Visual Identity Preview Banner */}
      <View style={[styles.previewCard, { borderColor: primaryColor }]}>
        <View style={[styles.previewBadge, { backgroundColor: primaryColor }]}>
          <MaterialCommunityIcons name="shield-star" size={24} color={COLORS.background} />
        </View>
        <Text style={styles.previewGarageName}>{garageName || 'Your Workshop Name'}</Text>
        <Text style={styles.previewTagline}>{tagline}</Text>
        <View style={styles.previewDivider} />
        <View style={styles.previewFooter}>
          <Text style={styles.previewMeta}>GSTIN: {gstin}</Text>
          <Text style={styles.previewMeta}>{phone}</Text>
        </View>
      </View>

      {/* Workshop Profile Fields */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Garage Identity</Text>
        <Text style={styles.sectionSubtitle}>Displayed on Invoices, Job Cards, and Customer SMS</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Workshop Name</Text>
          <TextInput
            style={styles.input}
            value={garageName}
            onChangeText={setGarageName}
            placeholder="e.g. Apex Auto Services"
            placeholderTextColor={COLORS.textMuted}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tagline / Specialization</Text>
          <TextInput
            style={styles.input}
            value={tagline}
            onChangeText={setTagline}
            placeholder="e.g. Luxury Car Repair & Body Shop"
            placeholderTextColor={COLORS.textMuted}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Support Phone / WhatsApp</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="+91..."
            placeholderTextColor={COLORS.textMuted}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Workshop Address</Text>
          <TextInput
            style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
            value={address}
            onChangeText={setAddress}
            multiline
            placeholder="Full garage location..."
            placeholderTextColor={COLORS.textMuted}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>GSTIN / MSME Reg</Text>
          <TextInput
            style={styles.input}
            value={gstin}
            onChangeText={setGstin}
            autoCapitalize="characters"
            placeholder="24AAAAA0000A1Z5"
            placeholderTextColor={COLORS.textMuted}
          />
        </View>
      </View>

      {/* Brand Color Theme Palette */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Theme Accent Color</Text>
        <Text style={styles.sectionSubtitle}>
          Applied across PDFs, mobile highlights, and headers
        </Text>

        <View style={styles.colorPaletteGrid}>
          {PRESET_COLORS.map((c) => {
            const isSelected = primaryColor.toLowerCase() === c.toLowerCase();
            return (
              <TouchableOpacity
                key={c}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: c },
                  isSelected && styles.colorSwatchSelected,
                ]}
                onPress={() => setPrimaryColor(c)}
              >
                {isSelected && (
                  <MaterialCommunityIcons name="check-bold" size={18} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveBtn, { backgroundColor: primaryColor }]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator size="small" color={COLORS.background} />
        ) : (
          <>
            <MaterialCommunityIcons name="content-save-outline" size={20} color={COLORS.background} />
            <Text style={styles.saveBtnText}>Save Branding</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
  },
  previewCard: {
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    marginBottom: 16,
  },
  previewBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  previewGarageName: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  previewTagline: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  previewDivider: {
    width: '100%',
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 14,
  },
  previewFooter: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  previewMeta: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionSubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
    marginBottom: 14,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text,
    fontSize: 14,
  },
  colorPaletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 6,
  },
  colorSwatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorSwatchSelected: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.1 }],
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 4,
  },
  saveBtnText: {
    color: COLORS.background,
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    color: COLORS.textMuted,
    marginTop: 10,
    fontSize: 13,
  },
});
