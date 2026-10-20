import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiBaseUrl, Storage } from './api';

export interface OfflineJobCard {
  id: string; // temporary local id (e.g. offline_xxx)
  vehicleNumber: string;
  customerName: string;
  customerPhone: string;
  serviceDescription: string;
  estimatedCost: number;
  voiceNote?: string | null;
  preInspectionShield: {
    front: boolean;
    back: boolean;
    left: boolean;
    right: boolean;
    timestamp: string;
  };
  createdAt: string;
  synced: boolean;
}

const STORAGE_KEY = '@motoban_offline_jobcards_queue';
const GST_SETTINGS_KEY = '@motoban_gst_enabled';

export const offlineSyncManager = {
  // GST Setting
  async getGstEnabled(): Promise<boolean> {
    try {
      const val = await AsyncStorage.getItem(GST_SETTINGS_KEY);
      return val === 'true';
    } catch {
      return false;
    }
  },

  async setGstEnabled(enabled: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(GST_SETTINGS_KEY, enabled ? 'true' : 'false');
    } catch (e) {
      console.error('Failed to save GST state offline', e);
    }
  },

  // Save Job Card locally into offline sync queue
  async enqueueJobCard(card: Omit<OfflineJobCard, 'id' | 'createdAt' | 'synced'>): Promise<OfflineJobCard> {
    const newEntry: OfflineJobCard = {
      ...card,
      id: `offline_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      synced: false,
    };

    try {
      const current = await this.getQueuedJobCards();
      current.unshift(newEntry);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    } catch (e) {
      console.error('Failed to enqueue offline job card', e);
    }

    return newEntry;
  },

  // Retrieve all queued job cards
  async getQueuedJobCards(): Promise<OfflineJobCard[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  // Sync queue with backend server (e.g., when network is restored)
  async syncQueueWithServer(customServerUrl?: string): Promise<{ synced: number; failed: number }> {
    const queue = await this.getQueuedJobCards();
    const unsynced = queue.filter(item => !item.synced);
    let syncedCount = 0;
    let failedCount = 0;

    const base = customServerUrl || (await getApiBaseUrl());
    const currentUser = await Storage.getUser();
    const userId = currentUser?.id;
    if (!userId) {
      console.warn('Cannot sync offline queue: No active user session logged in');
      return { synced: 0, failed: unsynced.length };
    }

    for (const item of unsynced) {
      try {
        const response = await fetch(`${base}/jobcards`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            description: item.serviceDescription,
            estimatedCost: item.estimatedCost,
            voiceNote: item.voiceNote,
            preInspectionShield: JSON.stringify(item.preInspectionShield),
            customerName: item.customerName,
            customerPhone: item.customerPhone,
            vehicleNo: item.vehicleNumber,
          }),
        });

        if (response.ok) {
          item.synced = true;
          syncedCount++;
        } else {
          failedCount++;
        }
      } catch {
        failedCount++;
      }
    }

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    return { synced: syncedCount, failed: failedCount };
  },

  // Clear synced cards
  async clearSynced(): Promise<void> {
    const queue = await this.getQueuedJobCards();
    const remaining = queue.filter(item => !item.synced);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
  },
};
