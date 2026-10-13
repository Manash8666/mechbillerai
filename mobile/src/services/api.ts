import AsyncStorage from '@react-native-async-storage/async-storage';

// Base API config for mobile app
// On Android Emulator, 10.0.2.2 points to host machine localhost:3000
export const API_BASE_URL = 'http://10.0.2.2:3000/api';

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
  setUser: async (user: UserSession) => {
    await AsyncStorage.setItem('user', JSON.stringify(user));
  },
  removeUser: async () => {
    await AsyncStorage.removeItem('user');
  },
};

export const API = {
  login: async (email: string, password: string) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (res.ok && data.user) {
      await Storage.setUser(data.user);
    }
    return data;
  },

  getDashboardStats: async () => {
    const user = await Storage.getUser();
    const query = user?.id ? `?userId=${user.id}` : '';
    const res = await fetch(`${API_BASE_URL}/dashboard/stats${query}`);
    return res.json();
  },

  getJobCards: async () => {
    const user = await Storage.getUser();
    const query = user?.id ? `?userId=${user.id}` : '';
    const res = await fetch(`${API_BASE_URL}/jobcards${query}`);
    const result = await res.json();
    return Array.isArray(result) ? result : result.data || [];
  },

  getCustomers: async () => {
    const user = await Storage.getUser();
    const query = user?.id ? `?userId=${user.id}` : '';
    const res = await fetch(`${API_BASE_URL}/customers${query}`);
    const result = await res.json();
    return Array.isArray(result) ? result : result.data || [];
  },

  getInvoices: async () => {
    const user = await Storage.getUser();
    const query = user?.id ? `?userId=${user.id}` : '';
    const res = await fetch(`${API_BASE_URL}/invoices${query}`);
    const result = await res.json();
    return Array.isArray(result) ? result : result.data || [];
  },

  getInventory: async () => {
    const res = await fetch(`${API_BASE_URL}/inventory`);
    const result = await res.json();
    return Array.isArray(result) ? result : result.data || [];
  },

  getAppointments: async () => {
    const user = await Storage.getUser();
    const query = user?.id ? `?userId=${user.id}` : '';
    const res = await fetch(`${API_BASE_URL}/appointments${query}`);
    const result = await res.json();
    return Array.isArray(result) ? result : result.data || [];
  },

  createAppointment: async (payload: any) => {
    const user = await Storage.getUser();
    const res = await fetch(`${API_BASE_URL}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, userId: user?.id }),
    });
    return res.json();
  },

  getBranding: async () => {
    const user = await Storage.getUser();
    const query = user?.id ? `?userId=${user.id}` : '';
    const res = await fetch(`${API_BASE_URL}/branding${query}`);
    return res.json();
  },

  updateBranding: async (payload: any) => {
    const user = await Storage.getUser();
    const res = await fetch(`${API_BASE_URL}/branding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, userId: user?.id }),
    });
    return res.json();
  },

  getJobCardPdfUrl: (jobCardId: string) => {
    return `${API_BASE_URL}/pdf/jobcard?id=${jobCardId}`;
  },

  getInvoicePdfUrl: (invoiceId: string, type: 'INVOICE' | 'ESTIMATE' = 'INVOICE') => {
    return `${API_BASE_URL}/pdf/invoice?id=${invoiceId}&type=${type}`;
  },
};
