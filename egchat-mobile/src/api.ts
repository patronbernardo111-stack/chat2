// ══════════════════════════════════════════════════════════════════
// EGCHAT Mobile API Client
// Idéntico al web pero adaptado a React Native
// ══════════════════════════════════════════════════════════════════
import * as SecureStore from 'expo-secure-store';

const BASE = (() => {
  const url = (process.env.EXPO_PUBLIC_API_URL || '').trim();
  if (!url) return 'https://chat2-0x2c.onrender.com';
  return url.replace(/\/$/, '');
})();

// ── Token seguro (SecureStore en lugar de AsyncStorage) ───────────
const TOKEN_KEY = 'egchat_token';

export const getToken = () => SecureStore.getItemAsync(TOKEN_KEY);
export const setToken = (t: string) => SecureStore.setItemAsync(TOKEN_KEY, t);
export const clearToken = () => SecureStore.deleteItemAsync(TOKEN_KEY);

// ── Callback global para manejar 401 (se setea desde _layout.tsx) ─
let onUnauthorized: (() => void) | null = null;
export const setUnauthorizedHandler = (fn: () => void) => { onUnauthorized = fn; };

// ── Cliente HTTP base con timeout y reintentos ────────────────────
async function request<T>(
  path: string,
  options: RequestInit = {},
  retries = 2
): Promise<T> {
  const token = await getToken();
  const method = (options.method || 'GET').toUpperCase();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  // Timeout adaptativo igual que la web
  const timeoutMs = method === 'GET' ? 15000 : 20000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${BASE}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    // 401 — sesión expirada
    if (res.status === 401) {
      await clearToken();
      onUnauthorized?.();
      throw new Error('Sesión expirada. Inicia sesión de nuevo.');
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || `Error ${res.status}`);
    }

    return res.json();
  } catch (err: any) {
    clearTimeout(timeoutId);
    // Reintentar en errores de red (no en 4xx)
    const isNetwork = err.name === 'AbortError'
      || err.name === 'TypeError'
      || err.message?.includes('fetch')
      || err.message?.includes('Network');
    if (isNetwork && retries > 0) {
      await new Promise(r => setTimeout(r, (3 - retries) * 1500));
      return request<T>(path, options, retries - 1);
    }
    throw err;
  }
}

const get  = <T>(path: string) => request<T>(path, { method: 'GET' });
const post = <T>(path: string, body: unknown) =>
  request<T>(path, { method: 'POST', body: JSON.stringify(body) });
const put  = <T>(path: string, body: unknown) =>
  request<T>(path, { method: 'PUT', body: JSON.stringify(body) });
const del  = <T>(path: string) => request<T>(path, { method: 'DELETE' });

// ══════════════════════════════════════════════════════════════════
// AUTH — idéntico al web
// ══════════════════════════════════════════════════════════════════
export const authAPI = {
  login: async (phone: string, password: string) => {
    const res = await post<{ token: string; user: any }>('/api/auth/login', { phone, password });
    if (res.token) await setToken(res.token);
    return res;
  },

  register: async (data: {
    full_name: string;
    phone: string;
    password: string;
    avatar_url?: string;
  }) => {
    const res = await post<{ token: string; user: any }>('/api/auth/register', data);
    if (res.token) await setToken(res.token);
    return res;
  },

  logout: async () => {
    try { await post('/api/auth/logout', {}); } catch {}
    await clearToken();
  },

  me: () => get<any>('/api/auth/me'),

  updateProfile: (data: { full_name?: string; avatar_url?: string }) =>
    put<any>('/api/auth/profile', data),

  sendVerification: (phone: string) =>
    post<{ sent: boolean; message?: string }>('/api/auth/send-verification', { phone }),

  verifyCode: (phone: string, code: string) =>
    post<{ verified: boolean; message?: string }>('/api/auth/verify-code', { phone, code }),

  resetPassword: (phone: string, code: string, newPassword: string) =>
    post<{ success: boolean; message?: string }>('/api/auth/reset-password', { phone, code, newPassword }),

  checkPhone: (phone: string) =>
    post<{ exists: boolean }>('/api/auth/check-phone', { phone }),

  isAuthenticated: async () => !!(await getToken()),
};

// ══════════════════════════════════════════════════════════════════
// CHAT
// ══════════════════════════════════════════════════════════════════
export const chatAPI = {
  getChats: () => get<any[]>('/api/chats'),
  getMessages: (chatId: string, page = 1, limit = 50) =>
    get<any[]>(`/api/chats/${chatId}/messages?page=${page}&limit=${limit}`),
  sendMessage: (chatId: string, data: {
    text?: string;
    type?: string;
    reply_to?: string;
    file_url?: string;
  }) => post<any>(`/api/chats/${chatId}/messages`, data),
  createPrivate: (participant_id?: string, phone?: string) =>
    post<any>('/api/chats/private', { participant_id, phone }),
  createGroup: (name: string, participant_ids: string[], avatar_url?: string) =>
    post<any>('/api/chats/group', { name, participant_ids, avatar_url }),
  markAsRead: (chatId: string, message_id: string) =>
    post<any>(`/api/chats/${chatId}/read`, { message_id }),
  searchUsers: (query: string) =>
    get<any[]>(`/api/contacts/search?q=${encodeURIComponent(query)}`),
  deleteMessage: (messageId: string) => del<void>(`/api/messages/${messageId}`),
  deleteMessageForMe: (messageId: string) => del<void>(`/api/messages/${messageId}/for-me`),
};

// ══════════════════════════════════════════════════════════════════
// WALLET
// ══════════════════════════════════════════════════════════════════
export const walletAPI = {
  getBalance: () => get<{ balance: number; currency: string }>('/api/wallet/balance'),
  getTransactions: (page = 1) =>
    get<{ transactions: any[]; total: number }>(`/api/wallet/transactions?page=${page}&limit=20`),
  deposit: (amount: number, method: string, reference: string) =>
    post<any>('/api/wallet/deposit', { amount, method, reference }),
  withdraw: (amount: number, method: string, destination: string) =>
    post<any>('/api/wallet/withdraw', { amount, method, destination }),
  transfer: (to: string, amount: number, concept?: string) =>
    post<any>('/api/wallet/transfer', { to, amount, concept }),
  redeemCode: (code: string) =>
    post<any>('/api/wallet/recharge-code', { code }),
};

// ══════════════════════════════════════════════════════════════════
// CONTACTOS
// ══════════════════════════════════════════════════════════════════
export const contactsAPI = {
  getAll: () => get<any[]>('/api/contacts'),
  add: (contact_user_id?: string, phone?: string, name?: string) =>
    post<any>('/api/contacts', { contact_user_id, phone, nickname: name }),
  remove: (id: string) => del<void>(`/api/contacts/${id}`),
};

// ══════════════════════════════════════════════════════════════════
// LIA-25
// ══════════════════════════════════════════════════════════════════
export const liaAPI = {
  chat: (message: string, history?: any[]) =>
    post<{ reply: string }>('/api/lia/chat', { message, history }),
};

// ══════════════════════════════════════════════════════════════════
// USER
// ══════════════════════════════════════════════════════════════════
export const userAPI = {
  getProfile: () => get<any>('/api/user/profile'),
  updateProfile: (data: any) => put<any>('/api/user/profile', data),
};

// Keep-alive para que Render no duerma (igual que la web)
const keepAlive = async () => {
  try { await fetch(`${BASE}/health`); } catch {}
};
setInterval(keepAlive, 4 * 60 * 1000);

// ══════════════════════════════════════════════════════════════════
// STORIES
// ══════════════════════════════════════════════════════════════════
export const storiesAPI = {
  getAll: () => get<any[]>('/api/stories'),
  create: (data: { media_url: string; type: string; caption?: string }) =>
    post<any>('/api/stories', data),
  delete: (id: string) => del<void>(`/api/stories/${id}`),
};

// ══════════════════════════════════════════════════════════════════
// SERVICIOS (electricidad, agua, etc.)
// ══════════════════════════════════════════════════════════════════
export const serviciosAPI = {
  consultarFacturaElec: (contrato: string) =>
    get<any>(`/api/servicios/electricidad/${contrato}`),
  pagarElectricidad: (contrato: string, amount: number, method: string) =>
    post<any>('/api/servicios/electricidad/pagar', { contrato, amount, method }),
  consultarFacturaAgua: (contrato: string) =>
    get<any>(`/api/servicios/agua/${contrato}`),
  pagarAgua: (contrato: string, amount: number, method: string) =>
    post<any>('/api/servicios/agua/pagar', { contrato, amount, method }),
};

// ══════════════════════════════════════════════════════════════════
// TAXI
// ══════════════════════════════════════════════════════════════════
export const taxiAPI = {
  requestRide: (
    origin: { address: string; lat?: number; lng?: number },
    destination: { address: string; lat?: number; lng?: number },
    rideType: string
  ) => post<any>('/api/taxi/request', { origin, destination, rideType }),
  cancelRide: (rideId: string) => post<any>(`/api/taxi/${rideId}/cancel`, {}),
  getRideStatus: (rideId: string) => get<any>(`/api/taxi/${rideId}`),
};
