import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
  Share,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { API } from '../services/api';

export default function CheckoutScreen() {
  const [activeTab, setActiveTab] = useState<'quick' | 'detailed'>('quick');

  const [quickPayJobs, setQuickPayJobs] = useState([
    { id: '1', vehicle: 'GJ-01-AB-1234', model: 'Splendor Plus', work: 'Spark Plug & Cable', amount: 250 },
    { id: '2', vehicle: 'GJ-27-XY-9087', model: 'Activa 6G', work: 'Engine Oil Change', amount: 450 },
    { id: '3', vehicle: 'GJ-05-MM-3344', model: 'Pulsar 150', work: 'Clutch Wire Adjustment', amount: 150 },
  ]);

  const detailedJobs = [
    { id: '4', vehicle: 'GJ-01-RE-9999', model: 'Royal Enfield Classic 350', work: 'Engine Rebuild & Valve Replacement', amount: 18400, itemsCount: 8 },
    { id: '5', vehicle: 'GJ-06-CD-5678', model: 'Hyundai i20', work: 'Suspension Overhaul & Brake Discs', amount: 12200, itemsCount: 6 },
  ];

  const handleCollect = (id: string, vehicle: string, amount: number) => {
    Alert.alert(
      'Payment Received! ✅',
      `Collected ₹${amount} for ${vehicle}. Job marked complete and invoice archived.`,
      [
        {
          text: 'Done',
          onPress: () => {
            setQuickPayJobs(prev => prev.filter(j => j.id !== id));
          },
        },
      ]
    );
  };

  const handleOpenInvoicePdf = async (jobId: string, vehicle: string) => {
    try {
      const url = API.getInvoicePdfUrl(jobId, 'INVOICE');
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        await Share.share({
          title: `Bill / Invoice - ${vehicle}`,
          message: `Tax Invoice for ${vehicle}: ${url}`,
          url,
        });
      }
    } catch {
      Alert.alert('Invoice Viewer', `Opening PDF Bill for ${vehicle}: ${API.getInvoicePdfUrl(jobId)}`);
    }
  };

  const handleShareInvoicePdf = async (vehicle: string, jobId: string) => {
    try {
      const url = API.getInvoicePdfUrl(jobId, 'INVOICE');
      await Share.share({
        title: `Bill - ${vehicle}`,
        message: `Tax Invoice Bill for ${vehicle}: ${url}`,
        url,
      });
    } catch (e: any) {
      Alert.alert('Share Failed', e.message);
    }
  };

  return (
    <View style={styles.container}>
      {/* Rush Hour Mode Banner */}
      <View style={styles.banner}>
        <MaterialCommunityIcons name="lightning-bolt" size={24} color="#F59E0B" />
        <View style={{ marginLeft: 10, flex: 1 }}>
          <Text style={styles.bannerTitle}>Evening Rush Hour Triage</Text>
          <Text style={styles.bannerSubtitle}>Split-view queue: Quick pickups vs Detailed invoice reviews</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'quick' && styles.tabActive]}
          onPress={() => setActiveTab('quick')}
        >
          <MaterialCommunityIcons
            name="cash-fast"
            size={18}
            color={activeTab === 'quick' ? COLORS.primary : COLORS.textMuted}
          />
          <Text style={[styles.tabText, activeTab === 'quick' && styles.tabTextActive]}>
            Quick Pay ({quickPayJobs.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'detailed' && styles.tabActive]}
          onPress={() => setActiveTab('detailed')}
        >
          <MaterialCommunityIcons
            name="file-document-edit-outline"
            size={18}
            color={activeTab === 'detailed' ? COLORS.primary : COLORS.textMuted}
          />
          <Text style={[styles.tabText, activeTab === 'detailed' && styles.tabTextActive]}>
            Detailed Review ({detailedJobs.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        {activeTab === 'quick' ? (
          <View>
            <Text style={styles.sectionHeader}>MINORS & ROUTINE JOBS (TAP TO COLLECT)</Text>
            {quickPayJobs.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>All quick-pay vehicles picked up! 🎉</Text>
              </View>
            ) : (
              quickPayJobs.map(job => (
                <View key={job.id} style={styles.jobCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.jobPlate}>{job.vehicle}</Text>
                    <Text style={styles.jobModel}>{job.model}</Text>
                    <Text style={styles.jobWork}>{job.work}</Text>
                    <Text style={styles.jobAmount}>₹{job.amount}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.collectBtn}
                    onPress={() => handleCollect(job.id, job.vehicle, job.amount)}
                  >
                    <MaterialCommunityIcons name="check" size={18} color="#FFF" />
                    <Text style={styles.collectBtnText}>Collect</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        ) : (
          <View>
            <Text style={[styles.sectionHeader, { color: COLORS.primary }]}>
              MAJOR OVERHAULS & COMPLEX BILLS (REQUIRES DETAILED REVIEW)
            </Text>
            {detailedJobs.map(job => (
              <View key={job.id} style={[styles.jobCard, styles.detailedCard]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.jobPlate}>{job.vehicle}</Text>
                  <Text style={styles.jobModel}>{job.model}</Text>
                  <Text style={styles.jobWork}>{job.work}</Text>
                  <Text style={[styles.jobAmount, { color: COLORS.primary }]}>₹{job.amount.toLocaleString('en-IN')}</Text>
                  <Text style={styles.itemCountText}>{job.itemsCount} line items to verify</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <TouchableOpacity
                    style={styles.reviewBtn}
                    onPress={() => handleOpenInvoicePdf(job.id, job.vehicle)}
                  >
                    <MaterialCommunityIcons name="file-pdf-box" size={18} color={COLORS.background} />
                    <Text style={styles.reviewBtnText}>PDF Bill</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.shareBtnMini}
                    onPress={() => handleShareInvoicePdf(job.vehicle, job.id)}
                  >
                    <MaterialCommunityIcons name="share-variant" size={15} color={COLORS.primary} />
                    <Text style={styles.shareBtnMiniText}>Share</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
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
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    marginBottom: 14,
  },
  bannerTitle: {
    color: '#F59E0B',
    fontSize: 14,
    fontWeight: 'bold',
  },
  bannerSubtitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  tabActive: {
    backgroundColor: 'rgba(201, 168, 76, 0.15)',
  },
  tabText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.8,
    color: '#10B981',
    marginBottom: 10,
  },
  jobCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailedCard: {
    borderColor: 'rgba(201, 168, 76, 0.4)',
  },
  jobPlate: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  jobModel: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  jobWork: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  jobAmount: {
    color: '#10B981',
    fontSize: 17,
    fontWeight: 'bold',
    marginTop: 6,
  },
  itemCountText: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  collectBtn: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 4,
  },
  collectBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  reviewBtn: {
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
    gap: 4,
  },
  reviewBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  shareBtnMini: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(201, 168, 76, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(201, 168, 76, 0.3)',
    gap: 3,
  },
  shareBtnMiniText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  emptyCard: {
    padding: 24,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
});
