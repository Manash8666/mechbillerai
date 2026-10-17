import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Linking,
  Share,
  Alert,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { COLORS } from '../constants/theme';
import { API } from '../services/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MobileLoader from '../components/MobileLoader';
import MobilePearlButton from '../components/MobilePearlButton';

interface JobCardItem {
  id: string;
  jobNumber: string;
  status: string;
  priority: string;
  description: string;
  estimatedCost: number;
  actualCost?: number;
  customer?: {
    name: string;
    phone: string;
  };
  vehicle?: {
    registrationNo: string;
    make: string;
    model: string;
  };
}

export default function JobCardsScreen({ navigation }: any) {
  const [jobs, setJobs] = useState<JobCardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal creation state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [regNo, setRegNo] = useState('');
  const [makeModel, setMakeModel] = useState('');
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [issueDesc, setIssueDesc] = useState('');
  const [estCost, setEstCost] = useState('800');
  const [priority, setPriority] = useState<'normal' | 'high' | 'low'>('normal');

  const fetchJobs = async () => {
    try {
      const data = await API.getJobCards();
      setJobs(data);
    } catch (e) {
      console.error('Failed to fetch job cards:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchJobs();
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return COLORS.success;
      case 'in-progress': return COLORS.primary;
      default: return COLORS.warning;
    }
  };

  const handleOpenPdf = async (jobId: string, type: 'jobcard' | 'estimate' = 'jobcard') => {
    const url = type === 'jobcard' ? API.getJobCardPdfUrl(jobId) : API.getInvoicePdfUrl(jobId, 'ESTIMATE');
    try {
      const supported = await Linking.canOpenURL(url).catch(() => true);
      if (supported) {
        await Linking.openURL(url);
      } else {
        await Share.share({
          title: `PDF Document - ${type.toUpperCase()}`,
          message: `View your ${type} PDF at: ${url}`,
          url,
        });
      }
    } catch {
      Alert.alert(
        'PDF Document Ready',
        `Link: ${url}`,
        [
          { text: 'Share Link', onPress: () => void Share.share({ message: url, url }) },
          { text: 'OK', style: 'cancel' }
        ]
      );
    }
  };

  const handleSharePdf = async (jobNumber: string, jobId: string) => {
    try {
      const url = API.getJobCardPdfUrl(jobId);
      await Share.share({
        title: `Vehicle Job Card - ${jobNumber}`,
        message: `Vehicle Job Card ${jobNumber} PDF: ${url}`,
        url,
      });
    } catch (e: any) {
      Alert.alert('Share Failed', e.message);
    }
  };

  const handleCreateJobCard = async () => {
    if (!regNo.trim()) {
      Alert.alert('Validation Error', 'Vehicle registration number is required.');
      return;
    }

    try {
      setCreating(true);

      // 1. Get or create customer
      const existingCustomers = await API.getCustomers();
      let customerId = '';
      const matched = existingCustomers.find(
        (c: any) => (custPhone && c.phone === custPhone) || (custName && c.name?.toLowerCase() === custName.toLowerCase())
      );

      if (matched) {
        customerId = matched.id;
      } else {
        const newCust = await API.createCustomer({
          name: custName || `Owner of ${regNo.toUpperCase()}`,
          phone: custPhone || '9876543210',
        });
        customerId = newCust.id || existingCustomers[0]?.id;
      }

      // 2. Ensure customer vehicle exists
      let vehicleId = '';
      if (customerId) {
        try {
          const custDetails = await API.getCustomerById(customerId);
          const matchedVeh = custDetails.vehicles?.find(
            (v: any) => v.registrationNo.toUpperCase() === regNo.toUpperCase()
          );
          if (matchedVeh) {
            vehicleId = matchedVeh.id;
          } else {
            const newVeh = await API.addVehicleToCustomer(customerId, {
              registrationNo: regNo.toUpperCase(),
              make: makeModel || 'Two-Wheeler / Four-Wheeler',
              model: 'Standard',
            });
            vehicleId = newVeh.id;
          }
        } catch {
          // Continue if vehicle fetch fails
        }
      }

      // 3. Post Job Card
      await API.createJobCard({
        customerId,
        vehicleId,
        description: issueDesc || 'General Service & Maintenance',
        priority,
        estimatedCost: Number.parseFloat(estCost) || 800,
        tasks: [
          { description: 'Initial Inspection & Diagnostics' },
          { description: issueDesc || 'General Service' },
        ],
      });

      Alert.alert('Success', `Job Card created for ${regNo.toUpperCase()}`);
      setIsModalOpen(false);
      setRegNo('');
      setMakeModel('');
      setCustName('');
      setCustPhone('');
      setIssueDesc('');
      await fetchJobs();
    } catch {
      Alert.alert('Error', 'Failed to create Job Card. Please check connection.');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateStatus = async (item: JobCardItem, nextStatus: string) => {
    try {
      await API.updateJobCardStatus(item.id, nextStatus);
      Alert.alert('Status Updated', `${item.jobNumber} marked as ${nextStatus.toUpperCase()}`);
      await fetchJobs();
    } catch {
      Alert.alert('Update Failed', 'Could not update status. Please check connection.');
    }
  };

  const handlePromptStatus = (item: JobCardItem) => {
    const s = item.status?.toLowerCase();
    const options: any[] = [];
    if (s === 'pending') {
      options.push({ text: 'Start Work (In-Progress)', onPress: () => handleUpdateStatus(item, 'in-progress') });
    } else if (s === 'in-progress') {
      options.push({ text: 'Mark Completed', onPress: () => handleUpdateStatus(item, 'completed') });
    } else if (s === 'completed') {
      options.push({
        text: 'Generate Bill & Invoice',
        onPress: () => {
          navigation?.navigate('Invoices');
        },
      });
    }
    options.push({ text: 'Cancel', style: 'cancel' });

    Alert.alert(`Update ${item.jobNumber}`, `Current: ${item.status.toUpperCase()}`, options);
  };

  const renderItem = ({ item }: { item: JobCardItem }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.jobNumber}>{item.jobNumber}</Text>
        <TouchableOpacity
          style={[styles.statusBadge, { borderColor: getStatusColor(item.status) }]}
          onPress={() => handlePromptStatus(item)}
        >
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.toUpperCase()} ▾
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.vehicleNo}>
        {item.vehicle?.registrationNo || 'No Plate Info'}
      </Text>
      <Text style={styles.model}>
        {[item.vehicle?.make, item.vehicle?.model].filter(Boolean).join(' ') || item.description}
      </Text>

      <View style={styles.divider} />

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Customer</Text>
          <Text style={styles.metaValue}>{item.customer?.name || 'Walk-in'}</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Estimate</Text>
          <Text style={[styles.metaValue, { color: COLORS.primary }]}>
            ₹{item.estimatedCost || 0}
          </Text>
        </View>
      </View>

      <View style={styles.pdfActionsRow}>
        <TouchableOpacity
          style={styles.pdfBtn}
          onPress={() => handleOpenPdf(item.id, 'jobcard')}
        >
          <MaterialCommunityIcons name="file-pdf-box" size={16} color={COLORS.background} />
          <Text style={styles.pdfBtnText}>Job Card PDF</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.estimateBtn}
          onPress={() => handleOpenPdf(item.id, 'estimate')}
        >
          <MaterialCommunityIcons name="calculator" size={16} color={COLORS.primary} />
          <Text style={styles.estimateBtnText}>Estimate PDF</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.shareBtn}
          onPress={() => handleSharePdf(item.jobNumber, item.id)}
        >
          <MaterialCommunityIcons name="share-variant" size={18} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header bar with New Job Card action */}
      <View style={styles.topActions}>
        <Text style={styles.topTitle}>Workshop Floor</Text>
        <MobilePearlButton
          variant="gold"
          onPress={() => setIsModalOpen(true)}
        >
          <MaterialCommunityIcons name="plus" size={18} color={COLORS.background} style={{ marginRight: 4 }} />
          <Text style={styles.pearlBtnText}>New Job Card</Text>
        </MobilePearlButton>
      </View>

      {loading ? (
        <View style={styles.center}>
          <MobileLoader text="Loading Job Cards" />
        </View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="car-wrench" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No job cards found</Text>
            </View>
          }
        />
      )}

      {/* Floating Plus Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setIsModalOpen(true)}
      >
        <MaterialCommunityIcons name="plus" size={28} color={COLORS.background} />
      </TouchableOpacity>

      {/* New Job Card Modal */}
      <Modal
        visible={isModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Job Card</Text>
              <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                <MaterialCommunityIcons name="close" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalForm}>
              <Text style={styles.inputLabel}>Vehicle Registration No *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. MH12AB1234 or GJ01XY9999"
                placeholderTextColor={COLORS.textMuted}
                value={regNo}
                onChangeText={setRegNo}
                autoCapitalize="characters"
              />

              <Text style={styles.inputLabel}>Make & Model</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Honda Activa 6G / Royal Enfield"
                placeholderTextColor={COLORS.textMuted}
                value={makeModel}
                onChangeText={setMakeModel}
              />

              <Text style={styles.inputLabel}>Customer Name</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Rajesh Kumar"
                placeholderTextColor={COLORS.textMuted}
                value={custName}
                onChangeText={setCustName}
              />

              <Text style={styles.inputLabel}>Customer Phone Number</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. 9876543210"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="phone-pad"
                value={custPhone}
                onChangeText={setCustPhone}
              />

              <Text style={styles.inputLabel}>Service Requirement / Complaints</Text>
              <TextInput
                style={[styles.modalInput, { height: 70, textAlignVertical: 'top' }]}
                placeholder="e.g. Engine oil change, brake squeak, chain lubrication..."
                placeholderTextColor={COLORS.textMuted}
                multiline
                value={issueDesc}
                onChangeText={setIssueDesc}
              />

              <Text style={styles.inputLabel}>Estimated Cost (₹)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="800"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="numeric"
                value={estCost}
                onChangeText={setEstCost}
              />

              <Text style={styles.inputLabel}>Priority</Text>
              <View style={styles.priorityRow}>
                {(['low', 'normal', 'high'] as const).map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.priorityPill,
                      priority === p && styles.priorityPillActive,
                    ]}
                    onPress={() => setPriority(p)}
                  >
                    <Text
                      style={[
                        styles.priorityText,
                        priority === p && styles.priorityTextActive,
                      ]}
                    >
                      {p.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <MobilePearlButton
                variant="gold"
                onPress={handleCreateJobCard}
                style={{ marginTop: 20 }}
              >
                {creating ? (
                  <MobileLoader text="Creating" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="check-circle-outline" size={18} color={COLORS.background} style={{ marginRight: 6 }} />
                    <Text style={styles.pearlBtnText}>Generate Job Card</Text>
                  </>
                )}
              </MobilePearlButton>
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
  topTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  pearlBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    padding: 16,
    paddingBottom: 80,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  jobNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  vehicleNo: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 2,
  },
  model: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  pdfActionsRow: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
    marginTop: 4,
  },
  pdfBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 4,
  },
  pdfBtnText: {
    color: COLORS.background,
    fontSize: 11,
    fontWeight: 'bold',
  },
  estimateBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 4,
  },
  estimateBtnText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: 'bold',
  },
  shareBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(201, 168, 76, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(201, 168, 76, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: COLORS.textMuted,
    marginTop: 12,
    fontSize: 15,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    backgroundColor: COLORS.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
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
  modalForm: {
    paddingVertical: 14,
    paddingBottom: 30,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginTop: 10,
    marginBottom: 4,
  },
  modalInput: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: COLORS.text,
    fontSize: 14,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  priorityPill: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  priorityPillActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(201, 168, 76, 0.15)',
  },
  priorityText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  priorityTextActive: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
});
