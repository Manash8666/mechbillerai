import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Official MotoBan Cloud API URLs with dual-cloud failover
export const VERCEL_ACTIVE_URL = 'https://mechbillerai.vercel.app/api';
export const MOTOBAN_CUSTOM_URL = 'https://motoban.in/api';
export const LOCAL_API_URL = 'http://localhost:3000/api';

// On physical Android devices, connect directly to active verified cloud API
let currentResolvedUrl = VERCEL_ACTIVE_URL;

export const getApiBaseUrl = async (): Promise<string> => {
  try {
    const custom = await AsyncStorage.getItem('custom_api_url');
    if (custom) return custom;
  } catch {}

  if (Platform.OS === 'web') {
    return LOCAL_API_URL;
  }
  return currentResolvedUrl;
};

export const API_BASE_URL = VERCEL_ACTIVE_URL;

const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeoutMs = 7000): Promise<Response> => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
};

/**
 * Resilient API fetcher with automatic cloud connectivity:
 * Queries active verified Vercel production endpoint by default.
 */
async function apiFetch(path: string, options: RequestInit = {}, timeoutMs = 8000): Promise<Response> {
  const custom = await AsyncStorage.getItem('custom_api_url');
  const token = await AsyncStorage.getItem('token');
  const base = custom || (Platform.OS === 'web' ? LOCAL_API_URL : currentResolvedUrl);
  const targetUrl = `${base}${path}`;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const mergedOptions: RequestInit = {
    ...options,
    headers,
  };

  try {
    const res = await fetchWithTimeout(targetUrl, mergedOptions, timeoutMs);
    return res;
  } catch (err: any) {
    if (!custom && Platform.OS !== 'web' && currentResolvedUrl !== VERCEL_ACTIVE_URL) {
      console.warn(`[MotoBan] Falling back to verified Vercel cloud API: ${VERCEL_ACTIVE_URL}`);
      currentResolvedUrl = VERCEL_ACTIVE_URL;
      const fallbackUrl = `${VERCEL_ACTIVE_URL}${path}`;
      return await fetchWithTimeout(fallbackUrl, mergedOptions, timeoutMs);
    }
    throw err;
  }
}

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: string;
  garageType: string;
  licenseStatus: string;
}

export const Storage = {
  getUser: async (): Promise<UserSession | null> => {
    try {
      const data = await AsyncStorage.getItem('user');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  setUser: async (user: UserSession, token?: string) => {
    await AsyncStorage.setItem('user', JSON.stringify(user));
    if (token) {
      await AsyncStorage.setItem('token', token);
    }
  },
  getToken: async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem('token');
    } catch {
      return null;
    }
  },
  removeUser: async () => {
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('token');
  },
  setServerUrl: async (url: string) => {
    await AsyncStorage.setItem('custom_api_url', url);
    currentResolvedUrl = url;
  },
  getServerUrl: async () => {
    return (await AsyncStorage.getItem('custom_api_url')) || currentResolvedUrl;
  },
};

export const API = {
  login: async (email: string, password: string) => {
    const res = await apiFetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }, 8000);
    const data = await res.json();
    if (res.ok && data.user) {
      await Storage.setUser(data.user, data.token);
    }
    return data;
  },

  getDashboardStats: async () => {
    const user = await Storage.getUser();
    const query = user?.id ? `?userId=${user.id}` : '';
    const res = await apiFetch(`/dashboard/stats${query}`, {}, 7000);
    return res.json();
  },

  // Job Cards
  getJobCards: async (status?: string, search?: string) => {
    const user = await Storage.getUser();
    const params = new URLSearchParams();
    if (user?.id) params.append('userId', user.id);
    if (status && status !== 'all') params.append('status', status);
    if (search) params.append('search', search);

    const res = await apiFetch(`/jobcards?${params.toString()}`, {}, 7000);
    const result = await res.json();
    return Array.isArray(result) ? result : result.data || [];
  },

  getJobCardById: async (id: string) => {
    const res = await apiFetch(`/jobcards/${id}`, {}, 7000);
    return res.json();
  },

  createJobCard: async (payload: any) => {
    const user = await Storage.getUser();
    const res = await apiFetch('/jobcards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, userId: user?.id }),
    }, 8000);
    return res.json();
  },

  updateJobCardStatus: async (id: string, status: string, notes?: string) => {
    const res = await apiFetch(`/jobcards/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, notes }),
    }, 8000);
    return res.json();
  },

  // Customers & Vehicles
  getCustomers: async (search?: string) => {
    const user = await Storage.getUser();
    const params = new URLSearchParams();
    if (user?.id) params.append('userId', user.id);
    if (search) params.append('search', search);

    const res = await apiFetch(`/customers?${params.toString()}`, {}, 7000);
    const result = await res.json();
    return Array.isArray(result) ? result : result.data || [];
  },

  getCustomerById: async (id: string) => {
    const res = await apiFetch(`/customers/${id}`, {}, 7000);
    return res.json();
  },

  createCustomer: async (payload: { name: string; phone: string; email?: string; address?: string; gstNumber?: string; userId?: string }) => {
    const user = await Storage.getUser();
    const res = await apiFetch('/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, userId: payload.userId || user?.id }),
    }, 8000);
    return res.json();
  },

  addVehicleToCustomer: async (customerId: string, payload: { registrationNo: string; make?: string; model?: string; year?: number; color?: string }) => {
    const res = await apiFetch(`/customers/${customerId}/vehicles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }, 8000);
    return res.json();
  },

  // Invoices & Billing
  getInvoices: async (status?: string, search?: string) => {
    const user = await Storage.getUser();
    const params = new URLSearchParams();
    if (user?.id) params.append('userId', user.id);
    if (status && status !== 'all') params.append('status', status);
    if (search) params.append('search', search);

    const res = await apiFetch(`/invoices?${params.toString()}`, {}, 7000);
    const result = await res.json();
    return Array.isArray(result) ? result : result.data || [];
  },

  getInvoiceById: async (id: string) => {
    const res = await apiFetch(`/invoices/${id}`, {}, 7000);
    return res.json();
  },

  createInvoice: async (payload: any) => {
    const user = await Storage.getUser();
    const res = await apiFetch('/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, userId: user?.id }),
    }, 8000);
    return res.json();
  },

  recordPayment: async (invoiceId: string, payload: { amount: number; paymentMode: string; notes?: string }) => {
    const res = await apiFetch(`/invoices/${invoiceId}/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }, 8000);
    return res.json();
  },

  // Inventory
  getInventory: async (search?: string) => {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await apiFetch(`/inventory${query}`, {}, 7000);
    const result = await res.json();
    return Array.isArray(result) ? result : result.data || [];
  },

  createInventoryItem: async (payload: any) => {
    const res = await apiFetch('/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }, 8000);
    return res.json();
  },

  // Appointments
  getAppointments: async (status?: string) => {
    const user = await Storage.getUser();
    const params = new URLSearchParams();
    if (user?.id) params.append('userId', user.id);
    if (status && status !== 'all') params.append('status', status);

    const res = await apiFetch(`/appointments?${params.toString()}`, {}, 7000);
    const result = await res.json();
    return Array.isArray(result) ? result : result.data || [];
  },

  createAppointment: async (payload: any) => {
    const user = await Storage.getUser();
    const res = await apiFetch('/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, userId: user?.id }),
    }, 8000);
    return res.json();
  },

  // Branding & Settings
  getBranding: async () => {
    const user = await Storage.getUser();
    const query = user?.id ? `?userId=${user.id}` : '';
    const res = await apiFetch(`/branding${query}`, {}, 7000);
    return res.json();
  },

  updateBranding: async (payload: any) => {
    const user = await Storage.getUser();
    const res = await apiFetch('/branding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, userId: user?.id }),
    }, 8000);
    return res.json();
  },

  getSettings: async () => {
    const user = await Storage.getUser();
    const query = user?.id ? `?userId=${user.id}` : '';
    const res = await apiFetch(`/settings${query}`, {}, 7000);
    return res.json();
  },

  updateSettings: async (payload: { gstEnabled?: boolean; name?: string }) => {
    const user = await Storage.getUser();
    const res = await apiFetch('/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, userId: user?.id }),
    }, 8000);
    return res.json();
  },

  // Licensing & SaaS Trial Quotas
  getLicensingStatus: async () => {
    const res = await apiFetch('/licensing', {}, 7000);
    return res.json();
  },

  activateLicense: async (licenseKey: string, deviceId?: string) => {
    const user = await Storage.getUser();
    const res = await apiFetch('/auth/activate-license', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user?.id,
        licenseKey,
        deviceId,
      }),
    }, 8000);
    return res.json();
  },

  // PDF URLs
  getJobCardPdfUrl: (jobCardId: string) => {
    return `${currentResolvedUrl}/pdf/jobcard?id=${jobCardId}`;
  },

  getInvoicePdfUrl: (invoiceId: string, type: 'INVOICE' | 'ESTIMATE' = 'INVOICE', token?: string) => {
    const tokenQuery = token ? `&token=${token}` : '';
    return `${currentResolvedUrl}/pdf/invoice?id=${invoiceId}&type=${type}${tokenQuery}`;
  },
};
