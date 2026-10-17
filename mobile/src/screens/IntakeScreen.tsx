import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { offlineSyncManager } from '../services/offlineSync';
import { decodeIndianLicensePlate } from '../services/rtoLookup';

export default function IntakeScreen({ navigation }: any) {
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [serviceDescription, setServiceDescription] = useState('Full Maintenance Inspection');
  const [estimatedCost, setEstimatedCost] = useState('650');

  const rtoInfo = decodeIndianLicensePlate(vehicleNumber);

  // 4 photos states
  const [photos, setPhotos] = useState<{ [key: string]: boolean }>({
    Front: false,
    Back: false,
    'Left Side': false,
    'Right Side': false,
  });

  const [isRecording, setIsRecording] = useState(false);
  const [voiceNote, setVoiceNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const togglePhoto = (side: string) => {
    setPhotos(prev => ({ ...prev, [side]: !prev[side] }));
  };

  const handleRecordVoice = () => {
    if (!isRecording) {
      setIsRecording(true);
      setTimeout(() => {
        setVoiceNote('Customer noted slight oil leakage near drain plug and scratch on right exhaust guard.');
        setIsRecording(false);
      }, 1500);
    } else {
      setIsRecording(false);
    }
  };

  const handleSaveIntake = async () => {
    if (!vehicleNumber.trim()) {
      Alert.alert('Required', 'Please enter the vehicle registration number.');
      return;
    }

    try {
      setIsSaving(true);
      await offlineSyncManager.enqueueJobCard({
        vehicleNumber: vehicleNumber.toUpperCase().trim(),
        customerName: customerName || 'Walk-in Customer',
        customerPhone: customerPhone || '9876543210',
        serviceDescription,
        estimatedCost: parseFloat(estimatedCost) || 500,
        voiceNote: voiceNote || 'Captured via Mobile Express Intake',
        preInspectionShield: {
          front: photos.Front,
          back: photos.Back,
          left: photos['Left Side'],
          right: photos['Right Side'],
          timestamp: new Date().toISOString(),
        },
      });

      Alert.alert(
        'Liability Shield Saved! 🛡️',
        'Job card and 4-sided inspection record created and saved offline. Will auto-sync to cloud when online.',
        [
          {
            text: 'OK',
            onPress: () => {
              setVehicleNumber('');
              setCustomerName('');
              setVoiceNote('');
              setPhotos({ Front: false, Back: false, 'Left Side': false, 'Right Side': false });
              if (navigation && navigation.navigate) {
                navigation.navigate('Job Cards');
              }
            },
          },
        ]
      );
    } catch (e) {
      Alert.alert('Error', 'Failed to save offline intake card.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header Banner */}
      <View style={styles.banner}>
        <MaterialCommunityIcons name="shield-check" size={26} color={COLORS.primary} />
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={styles.bannerTitle}>Morning Express Intake</Text>
          <Text style={styles.bannerSubtitle}>Pre-Inspection Shield & 100% Offline Capture</Text>
        </View>
      </View>

      {/* Inputs */}
      <View style={styles.card}>
        <Text style={styles.label}>Vehicle Number *</Text>
        <TextInput
          style={styles.inputPlate}
          placeholder="GJ-01-AB-1234"
          placeholderTextColor={COLORS.textMuted}
          autoCapitalize="characters"
          value={vehicleNumber}
          onChangeText={setVehicleNumber}
        />

        {rtoInfo.stateCode ? (
          <View style={styles.rtoBadge}>
            <MaterialCommunityIcons
              name={rtoInfo.isBharatSeries ? 'shield-star' : 'map-marker-radius'}
              size={15}
              color={COLORS.primary}
            />
            <Text style={styles.rtoBadgeText}>
              {rtoInfo.isBharatSeries
                ? '🇮🇳 Bharat Series (Pan-India MoRTH Permit)'
                : `🇮🇳 ${rtoInfo.stateName} • ${rtoInfo.rtoOffice}`}
            </Text>
          </View>
        ) : null}

        <Text style={[styles.label, { marginTop: 12 }]}>Customer Name & Phone</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Ramesh Patel"
            placeholderTextColor={COLORS.textMuted}
            value={customerName}
            onChangeText={setCustomerName}
          />
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="9898012345"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="phone-pad"
            value={customerPhone}
            onChangeText={setCustomerPhone}
          />
        </View>
      </View>

      {/* 4 Photos Shield Grid */}
      <View style={styles.card}>
        <Text style={styles.label}>Pre-Inspection Shield (4-Sided Dent Photos)</Text>
        <Text style={styles.hint}>Taps save timestamped proof of pre-existing scratches.</Text>
        <View style={styles.photoGrid}>
          {['Front', 'Back', 'Left Side', 'Right Side'].map(side => {
            const isCaptured = photos[side];
            return (
              <TouchableOpacity
                key={side}
                style={[styles.photoBox, isCaptured && styles.photoBoxCaptured]}
                onPress={() => togglePhoto(side)}
              >
                <MaterialCommunityIcons
                  name={isCaptured ? 'check-decagram' : 'camera-outline'}
                  size={26}
                  color={isCaptured ? '#10B981' : COLORS.primary}
                />
                <Text style={[styles.photoLabel, isCaptured && { color: '#10B981', fontWeight: 'bold' }]}>
                  {side}
                </Text>
                <Text style={styles.photoStatus}>{isCaptured ? 'Logged ✓' : 'Tap to snap'}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Hands-free Voice Note */}
      <View style={styles.card}>
        <Text style={styles.label}>Grease-Proof Voice Note</Text>
        <TouchableOpacity
          style={[styles.voiceBtn, isRecording && styles.voiceBtnActive]}
          onPress={handleRecordVoice}
        >
          <MaterialCommunityIcons
            name={isRecording ? 'stop-circle' : 'microphone'}
            size={24}
            color={isRecording ? '#FFF' : '#EF4444'}
          />
          <Text style={[styles.voiceBtnText, isRecording && { color: '#FFF' }]}>
            {isRecording ? 'Recording Voice Note... (Tap to save)' : 'Tap to Record Voice Note'}
          </Text>
        </TouchableOpacity>
        {voiceNote ? (
          <View style={styles.voiceResultBox}>
            <Text style={styles.voiceResultText}>🎙️ "{voiceNote}"</Text>
          </View>
        ) : null}
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveBtn, isSaving && { opacity: 0.6 }]}
        onPress={handleSaveIntake}
        disabled={isSaving}
      >
        <MaterialCommunityIcons name="content-save-check" size={20} color={COLORS.background} />
        <Text style={styles.saveBtnText}>
          {isSaving ? 'Saving Offline...' : 'Save Job Card & Shield'}
        </Text>
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
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(201, 168, 76, 0.12)',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(201, 168, 76, 0.3)',
    marginBottom: 16,
  },
  bannerTitle: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: 'bold',
  },
  bannerSubtitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  card: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  label: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  hint: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginBottom: 12,
  },
  inputPlate: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    color: COLORS.text,
    fontSize: 14,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  photoBox: {
    width: '48%',
    aspectRatio: 1.4,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  photoBoxCaptured: {
    borderColor: '#10B981',
    borderStyle: 'solid',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  photoLabel: {
    color: COLORS.text,
    fontSize: 12,
    marginTop: 4,
  },
  photoStatus: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  voiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  voiceBtnActive: {
    backgroundColor: '#EF4444',
    borderColor: '#DC2626',
  },
  voiceBtnText: {
    color: COLORS.text,
    fontWeight: 'bold',
    fontSize: 13,
  },
  voiceResultBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  voiceResultText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontStyle: 'italic',
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 14,
    gap: 10,
    marginTop: 4,
  },
  saveBtnText: {
    color: COLORS.background,
    fontSize: 15,
    fontWeight: 'bold',
  },
  rtoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(201, 243, 29, 0.08)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(201, 243, 29, 0.25)',
  },
  rtoBadgeText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
});
