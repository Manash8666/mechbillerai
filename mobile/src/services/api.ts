import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Live production Vercel cloud API URL
export const CLOUD_API_URL = 'https://mechbillerai.vercel.app/api';
export const LOCAL_API_URL = 'http://localhost:3000/api';

// On physical Android devices, connect directly to the live Cloud API by default
export const DEFAULT_API_URL = CLOUD_API_URL;

export const getApiBaseUrl = async (): Promise<string> => {
  try {
    const custom = await AsyncStorage.getItem('custom_api_url');
    if (custom) return custom;
  } catch {}

  if (Platform.OS === 'web') {
    return LOCAL_API_URL;
  }
  return DEFAULT_API_URL;
};

export let API_BASE_URL = DEFAULT_API_URL;

const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeoutMs = 8000): Promise<Response> => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
};

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: string;
  garageType: string;
  licenseStatus: string;
}

export const DEFAULT_DEMO_USER: UserSession = {
  id: 'cmv4zl4620001d96sd1e0qto2',
  name: 'Demo Two-Wheeler Workshop',
  email: 'demo@garagesaas.com',
  role: 'owner',
  garageType: 'two_wheeler',
  licenseStatus: 'active',
};

export const Storage = {
  getUser: async (): Promise<UserSession | null> => {
    try {
      const data = await AsyncStorage.getItem('user');
      return data ? JSON.parse(data) : DEFAULT_DEMO_USER;
    } catch {
      return DEFAULT_DEMO_USER;
    }
  },
  setUser: async (user: UserSession) => {
    await AsyncStorage.setItem('user', JSON.stringify(user));
  },
  removeUser: async () => {
    await AsyncStorage.removeItem('user');
  },
  setServerUrl: async (url: string) => {
    await AsyncStorage.setItem('custom_api_url', url);
    API_BASE_URL = url;
  },
  getServerUrl: async () => {
    return (await AsyncStorage.getItem('custom_api_url')) || DEFAULT_API_URL;
  },
};

export const API = {
  login: async (email: string, password: string) => {
    const base = await getApiBaseUrl();
    const res = await fetchWithTimeout(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }, 8000);
    const data = await res.json();
    if (res.ok && data.user) {
      await Storage.setUser(data.user);
    }
    return data;
  },

  getDashboardStats: async () => {
    const base = await getApiBaseUrl();
    const user = await Storage.getUser();
    const query = user?.id ? `?userId=${user.id}` : '';
    const res = await fetchWithTimeout(`${base}/dashboard/stats${query}`, {}, 6000);
    return res.json();
  },

  getJobCards: async () => {
    const base = await getApiBaseUrl();
    const user = await Storage.getUser();
    const query = user?.id ? `?userId=${user.id}` : '';
    const res = await fetchWithTimeout(`${base}/jobcards${query}`, {}, 6000);
    const result = await res.json();
    return Array.isArray(result) ? result : result.data || [];
  },

  getCustomers: async () => {
    const base = await getApiBaseUrl();
    const user = await Storage.getUser();
    const query = user?.id ? `?userId=${user.id}` : '';
    const res = await fetchWithTimeout(`${base}/customers${query}`, {}, 6000);
    const result = await res.json();
    return Array.isArray(result) ? result : result.data || [];
  },

  getInvoices: async () => {
    const base = await getApiBaseUrl();
    const user = await Storage.getUser();
    const query = user?.id ? `?userId=${user.id}` : '';
    const res = await fetchWithTimeout(`${base}/invoices${query}`, {}, 6000);
    const result = await res.json();
    return Array.isArray(result) ? result : result.data || [];
  },

  getInventory: async () => {
    const base = await getApiBaseUrl();
    const res = await fetchWithTimeout(`${base}/inventory`, {}, 6000);
    const result = await res.json();
    return Array.isArray(result) ? result : result.data || [];
  },

  getAppointments: async () => {
    const base = await getApiBaseUrl();
    const user = await Storage.getUser();
    const query = user?.id ? `?userId=${user.id}` : '';
    const res = await fetchWithTimeout(`${base}/appointments${query}`, {}, 6000);
    const result = await res.json();
    return Array.isArray(result) ? result : result.data || [];
  },

  createAppointment: async (payload: any) => {
    const base = await getApiBaseUrl();
    const user = await Storage.getUser();
    const res = await fetchWithTimeout(`${base}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, userId: user?.id }),
    }, 8000);
    return res.json();
  },

  getBranding: async () => {
    const base = await getApiBaseUrl();
    const user = await Storage.getUser();
    const query = user?.id ? `?userId=${user.id}` : '';
    const res = await fetchWithTimeout(`${base}/branding${query}`, {}, 6000);
    return res.json();
  },

  updateBranding: async (payload: any) => {
    const base = await getApiBaseUrl();
    const user = await Storage.getUser();
    const res = await fetchWithTimeout(`${base}/branding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, userId: user?.id }),
    }, 8000);
    return res.json();
  },

  createJobCard: async (payload: any) => {
    const base = await getApiBaseUrl();
    const user = await Storage.getUser();
    const res = await fetchWithTimeout(`${base}/jobcards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, userId: user?.id }),
    }, 8000);
    return res.json();
  },

  createInvoice: async (payload: any) => {
    const base = await getApiBaseUrl();
    const user = await Storage.getUser();
    const res = await fetchWithTimeout(`${base}/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, userId: user?.id }),
    }, 8000);
    return res.json();
  },

  getJobCardPdfUrl: (jobCardId: string) => {
    return `${API_BASE_URL}/pdf/jobcard?id=${jobCardId}`;
  },

  getInvoicePdfUrl: (invoiceId: string, type: 'INVOICE' | 'ESTIMATE' = 'INVOICE') => {
    return `${API_BASE_URL}/pdf/invoice?id=${invoiceId}&type=${type}`;
  },
};
