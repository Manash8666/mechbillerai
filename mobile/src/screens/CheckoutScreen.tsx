import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
  Share,
  RefreshControl,
  Modal,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { API } from '../services/api';
import MobileLoader from '../components/MobileLoader';
import { decodeIndianLicensePlate } from '../services/rtoLookup';

export default function CheckoutScreen() {
  const [activeTab, setActiveTab] = useState<'quick' | 'detailed'>('quick');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [quickPayJobs, setQuickPayJobs] = useState<any[]>([]);
  const [detailedJobs, setDetailedJobs] = useState<any[]>([]);
  const [workshopBranding, setWorkshopBranding] = useState<{
    paymentQrUrl?: string | null;
    upiId?: string | null;
    garageName?: string | null;
  }>({});
  const [selectedQrJob, setSelectedQrJob] = useState<any | null>(null);
  const [qrModalVisible, setQrModalVisible] = useState(false);

  const fetchBrandingData = async () => {
    try {
      const branding = await API.getBranding();
      if (branding) {
        setWorkshopBranding({
          paymentQrUrl: branding.paymentQrUrl,
          upiId: branding.upiId,
          garageName: branding.garageName || 'MotoBan Workshop',
        });
      }
    } catch (err) {
      console.warn('Failed to load workshop branding in mobile checkout:', err);
    }
  };

  const fetchTriageJobs = async () => {
    try {
      const jobCards = await API.getJobCards();
      const list = Array.isArray(jobCards) ? jobCards : [];

      // Split into Quick Pay (estimatedCost <= 1500) and Detailed Review (> 1500)
      const minors: any[] = [];
      const majors: any[] = [];

      list.forEach((job: any) => {
        const cost = Number(job.estimatedCost) || 0;
        const formatted = {
          id: job.id,
          jobNumber: job.jobNumber,
          vehicle: job.vehicle?.registrationNo || 'General Vehicle',
          model: `${job.vehicle?.make || ''} ${job.vehicle?.model || ''}`.trim() || 'Vehicle',
          work: job.description || 'Service & Maintenance',
          amount: cost,
          customerName: job.customer?.name || 'Valued Customer',
          customerPhone: job.customer?.phone || '',
          itemsCount: job.tasks?.length || 3,
        };

        if (cost <= 1500) {
          minors.push(formatted);
        } else {
          majors.push(formatted);
        }
      });

      setQuickPayJobs(minors);
      setDetailedJobs(majors);
    } catch (err) {
      console.error('Failed to fetch triage jobs in CheckoutScreen:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchTriageJobs();
    void fetchBrandingData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    void fetchTriageJobs();
    void fetchBrandingData();
  };

  const handleCollect = (job: any) => {
    const { id, vehicle, amount, jobNumber, customerPhone, customerName } = job;
    const actions: any[] = [];

    // 1. If workshop has uploaded their authentic GPay/PhonePe/Paytm QR standee photo
    if (workshopBranding.paymentQrUrl) {
      actions.push({
        text: '📷 Show Standee QR (GPay/PhonePe/Paytm)',
        onPress: () => {
          setSelectedQrJob(job);
          setQrModalVisible(true);
        },
      });
    }

    // 2. Direct Android UPI Intent Chooser
    actions.push({
      text: '📱 Pay via UPI Intent',
      onPress: async () => {
        const { launchMobileUpiPayment } = await import('../services/payments');
        await launchMobileUpiPayment({
          vpa: workshopBranding.upiId || 'motoban@icici',
          payeeName: workshopBranding.garageName || 'MotoBan Workshop',
          amount,
          invoiceNumber: jobNumber || id,
        });
        try {
          await API.updateJobCardStatus(id, 'completed');
          setQuickPayJobs((prev) => prev.filter((j) => j.id !== id));
        } catch (e) {
          console.warn('Local completion update:', e);
        }
      },
    });

    // 3. Share Bill on WhatsApp
    actions.push({
      text: '💬 Share Bill on WhatsApp',
      onPress: async () => {
        const { launchWhatsAppBill } = await import('../services/payments');
        const pdfUrl = API.getInvoicePdfUrl(jobNumber || id, 'INVOICE');
        await launchWhatsAppBill({
          phone: customerPhone || '9876543210',
          customerName: customerName || 'Valued Customer',
          vehicleNumber: vehicle,
          invoiceNumber: jobNumber || id,
          totalAmount: amount,
          paidAmount: 0,
          balanceAmount: amount,
          garageName: workshopBranding.garageName || 'MotoBan Workshop',
          invoiceUrl: pdfUrl,
        });
      },
    });

    // 4. Print Thermal Slip
    actions.push({
      text: '🖨️ Print Thermal Slip',
      onPress: async () => {
        const { printOrShareReceipt } = await import('../services/thermalPrinter');
        const { decodeIndianLicensePlate } = await import('../services/rtoLookup');
        const rto = decodeIndianLicensePlate(vehicle);
        await printOrShareReceipt({
          workshopName: workshopBranding.garageName || 'MotoBan Workshop',
          tagline: 'Express Garage & Diagnostics',
          phone: '+91 98765 43210',
          invoiceNumber: jobNumber || id,
          date: new Date().toLocaleDateString('en-IN'),
          customerName: customerName || 'Valued Customer',
          vehicleNumber: vehicle,
          rtoOffice: rto.rtoOffice,
          items: [{ description: 'Vehicle Maintenance & Repairs', qty: 1, amount }],
          subtotal: amount,
          total: amount,
          paid: amount,
          balance: 0,
          paymentMode: 'UPI / Cash',
          upiVpa: workshopBranding.upiId || 'motoban@icici',
        });
      },
    });

    // 5. Cash Received
    actions.push({
      text: '💵 Cash Received',
      onPress: async () => {
        try {
          await API.updateJobCardStatus(id, 'completed');
        } catch (e) {
          console.warn('Silent local completion fallback:', e);
        }
        setQuickPayJobs((prev) => prev.filter((j) => j.id !== id));
        Alert.alert('Payment Recorded', `Collected ₹${amount.toLocaleString('en-IN')} cash for ${vehicle}.`);
      },
    });

    actions.push({ text: 'Cancel', style: 'cancel' });

    Alert.alert(
      `Collect ₹${amount.toLocaleString('en-IN')}`,
      `Choose action for ${vehicle} (${customerName}):`,
      actions
    );
  };

  const handleOpenInvoicePdf = async (
    jobNumber: string,
    vehicle: string,
    type: 'INVOICE' | 'SOW_BILL' = 'INVOICE'
  ) => {
    const url = API.getInvoicePdfUrl(jobNumber, type);
    const label = type === 'SOW_BILL' ? 'Scope of Work (SOW) AI Bill' : 'Tax Invoice Bill';
    try {
      const supported = await Linking.canOpenURL(url).catch(() => true);
      if (supported) {
        await Linking.openURL(url);
      } else {
        await Share.share({
          title: `${label} - ${vehicle}`,
          message: `${label} for ${vehicle}: ${url}`,
          url,
        });
      }
    } catch (e: any) {
      Alert.alert(
        `${label} Ready`,
        `PDF Link: ${url}`,
        [
          { text: 'Share Link', onPress: () => void Share.share({ message: url, url }) },
          { text: 'OK', style: 'cancel' }
        ]
      );
    }
  };

  const handleShareInvoicePdf = async (job: any, type: 'INVOICE' | 'SOW_BILL' = 'INVOICE') => {
    const { vehicle, jobNumber, customerPhone, customerName, amount } = job;
    try {
      const { launchWhatsAppBill } = await import('../services/payments');
      const url = API.getInvoicePdfUrl(jobNumber, type);
      await launchWhatsAppBill({
        phone: customerPhone || '9876543210',
        customerName: customerName || 'Valued Customer',
        vehicleNumber: vehicle,
        invoiceNumber: jobNumber,
        totalAmount: amount || 1500,
        paidAmount: 0,
        balanceAmount: amount || 1500,
        garageName: workshopBranding.garageName || 'MotoBan Workshop',
        invoiceUrl: url,
      });
    } catch {
      const url = API.getInvoicePdfUrl(jobNumber, type);
      await Share.share({
        title: `Bill - ${vehicle}`,
        message: `Bill for ${vehicle}: ${url}`,
        url,
      });
    }
  };

  if (loading) {
    return <MobileLoader text="Loading Rush Hour Queue..." />;
  }

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

      <ScrollView
        contentContainerStyle={{ paddingBottom: 30 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {activeTab === 'quick' ? (
          <View>
            <Text style={styles.sectionHeader}>MINORS & ROUTINE JOBS (TAP TO COLLECT)</Text>
            {quickPayJobs.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>All quick-pay vehicles picked up! 🎉</Text>
              </View>
            ) : (
              quickPayJobs.map((job) => {
                const rto = decodeIndianLicensePlate(job.vehicle);
                return (
                  <View key={job.id} style={styles.jobCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.jobPlate}>{job.vehicle}</Text>
                      {rto.stateCode ? (
                        <Text style={styles.rtoPlateBadge}>📍 {rto.rtoOffice}</Text>
                      ) : null}
                      <Text style={styles.jobModel}>{job.model}</Text>
                      <Text style={styles.jobWork}>{job.work}</Text>
                      <Text style={styles.jobAmount}>₹{job.amount.toLocaleString('en-IN')}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.collectBtn}
                      onPress={() => handleCollect(job)}
                    >
                      <MaterialCommunityIcons name="check" size={18} color="#FFF" />
                      <Text style={styles.collectBtnText}>Collect</Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </View>
        ) : (
          <View>
            <Text style={[styles.sectionHeader, { color: COLORS.primary }]}>
              MAJOR OVERHAULS & COMPLEX BILLS (REQUIRES DETAILED REVIEW)
            </Text>
            {detailedJobs.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No major overhauls pending review. 🎉</Text>
              </View>
            ) : (
              detailedJobs.map((job) => {
                const rto = decodeIndianLicensePlate(job.vehicle);
                return (
                  <View key={job.id} style={[styles.jobCard, styles.detailedCard]}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.jobPlate}>{job.vehicle}</Text>
                      {rto.stateCode ? (
                        <Text style={styles.rtoPlateBadge}>📍 {rto.rtoOffice}</Text>
                      ) : null}
                      <Text style={styles.jobModel}>{job.model}</Text>
                      <Text style={styles.jobWork}>{job.work}</Text>
                      <Text style={[styles.jobAmount, { color: COLORS.primary }]}>
                        ₹{job.amount.toLocaleString('en-IN')}
                      </Text>
                      <Text style={styles.itemCountText}>{job.itemsCount} line items to verify</Text>
                    </View>
                  <View style={{ alignItems: 'flex-end', gap: 6 }}>
                    {workshopBranding.paymentQrUrl ? (
                      <TouchableOpacity
                        style={[styles.sowBtn, { backgroundColor: '#10B981' }]}
                        onPress={() => {
                          setSelectedQrJob(job);
                          setQrModalVisible(true);
                        }}
                      >
                        <MaterialCommunityIcons name="qrcode-scan" size={15} color="#FFF" />
                        <Text style={styles.sowBtnText}>Scan QR</Text>
                      </TouchableOpacity>
                    ) : null}
                    <TouchableOpacity
                      style={styles.sowBtn}
                      onPress={() => handleOpenInvoicePdf(job.jobNumber || job.id, job.vehicle, 'SOW_BILL')}
                    >
                      <MaterialCommunityIcons name="auto-fix" size={16} color="#FFF" />
                      <Text style={styles.sowBtnText}>AI SOW Bill</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.reviewBtn}
                      onPress={() => handleOpenInvoicePdf(job.jobNumber || job.id, job.vehicle, 'INVOICE')}
                    >
                      <MaterialCommunityIcons name="file-pdf-box" size={16} color={COLORS.background} />
                      <Text style={styles.reviewBtnText}>PDF Bill</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.shareBtnMini}
                      onPress={() => handleShareInvoicePdf(job, 'SOW_BILL')}
                    >
                      <MaterialCommunityIcons name="share-variant" size={14} color={COLORS.primary} />
                      <Text style={styles.shareBtnMiniText}>Share SOW</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* Workshop Counter Standee QR Modal */}
      <Modal
        visible={qrModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setQrModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Scan to Pay via UPI</Text>
                <Text style={styles.modalSubtitle} numberOfLines={1}>
                  {workshopBranding.garageName || 'MotoBan Workshop'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setQrModalVisible(false)}
                style={styles.closeBtn}
              >
                <MaterialCommunityIcons name="close" size={22} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {/* Standee QR Image Container */}
            {workshopBranding.paymentQrUrl ? (
              <View style={styles.qrImageContainer}>
                <Image
                  source={{ uri: workshopBranding.paymentQrUrl }}
                  style={styles.qrImage}
                  resizeMode="contain"
                />
              </View>
            ) : null}

            {selectedQrJob && (
              <View style={styles.qrJobDetails}>
                <Text style={styles.qrAmountText}>
                  ₹{Number(selectedQrJob.amount || 0).toLocaleString('en-IN')}
                </Text>
                <Text style={styles.qrVehicleText}>
                  {selectedQrJob.vehicle} · {selectedQrJob.customerName}
                </Text>
                {workshopBranding.upiId ? (
                  <Text style={styles.qrUpiText}>UPI ID: {workshopBranding.upiId}</Text>
                ) : null}
                <Text style={styles.qrHintText}>
                  GPay · PhonePe · Paytm · BHIM UPI
                </Text>
              </View>
            )}

            <View style={styles.qrModalActions}>
              <TouchableOpacity
                style={styles.confirmPaymentBtn}
                onPress={async () => {
                  if (selectedQrJob) {
                    try {
                      await API.updateJobCardStatus(selectedQrJob.id, 'completed');
                      setQuickPayJobs((prev) => prev.filter((j) => j.id !== selectedQrJob.id));
                      setDetailedJobs((prev) => prev.filter((j) => j.id !== selectedQrJob.id));
                    } catch (e) {
                      console.warn('Local update error:', e);
                    }
                  }
                  setQrModalVisible(false);
                  Alert.alert('Payment Recorded', 'Vehicle marked ready and payment collected!');
                }}
              >
                <MaterialCommunityIcons name="check-circle" size={18} color="#FFF" />
                <Text style={styles.confirmPaymentBtnText}>Mark Paid & Collected</Text>
              </TouchableOpacity>
            </View>
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
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    marginTop: 1,
  },
  jobWork: {
    color: COLORS.text,
    fontSize: 13,
    marginTop: 4,
  },
  jobAmount: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  itemCountText: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
    fontStyle: 'italic',
  },
  collectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 4,
  },
  collectBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  sowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 4,
  },
  sowBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  reviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  reviewBtnText: {
    color: COLORS.background,
    fontSize: 12,
    fontWeight: 'bold',
  },
  shareBtnMini: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    gap: 3,
  },
  shareBtnMiniText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  emptyCard: {
    padding: 30,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  rtoPlateBadge: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(201, 168, 76, 0.35)',
    alignItems: 'center',
  },
  modalHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  modalSubtitle: {
    fontSize: 12,
    color: COLORS.primary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  qrImageContainer: {
    width: 220,
    height: 220,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  qrImage: {
    width: '100%',
    height: '100%',
  },
  qrJobDetails: {
    width: '100%',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 16,
  },
  qrAmountText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10B981',
  },
  qrVehicleText: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '600',
    marginTop: 3,
  },
  qrUpiText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: COLORS.textMuted,
    marginTop: 3,
  },
  qrHintText: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: 'bold',
    marginTop: 5,
    letterSpacing: 0.5,
  },
  qrModalActions: {
    width: '100%',
  },
  confirmPaymentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
    width: '100%',
  },
  confirmPaymentBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
