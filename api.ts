// ══════════════════════════════════════════════════════════════════
// API CLIENT — Conecta todo el proyecto a VITE_API_URL
// ══════════════════════════════════════════════════════════════════

const BASE = (() => {
  const url = ((import.meta as any).env?.VITE_API_URL || '').trim();
  if (!url || url.startsWith('/')) return 'https://egchat-api.onrender.com/api';
  if (url.endsWith('/api')) return url;
  return url.replace(/\/$/, '') + '/api';
})();

// ── Token JWT — usa la misma clave que el backend espera ──────────
const TOKEN_KEY = 'token';
const TOKEN_BACKUP_KEY = 'egchat_token_backup';

const getToken = () => {
  const primary = localStorage.getItem(TOKEN_KEY) || '';
  if (primary) return primary;
  const backup = localStorage.getItem(TOKEN_BACKUP_KEY) || '';
  if (backup) {
    // Restaurar automáticamente sesión si el token principal desaparece tras actualización.
    localStorage.setItem(TOKEN_KEY, backup);
    return backup;
  }
  return '';
};
const setToken = (t: string) => {
  localStorage.setItem(TOKEN_KEY, t);
  localStorage.setItem(TOKEN_BACKUP_KEY, t);
};
const clearToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_BACKUP_KEY);
};

// ── Headers con token ─────────────────────────────────────────────
const getHeaders = (): Record<string, string> => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

// ── Helper base ───────────────────────────────────────────────────
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const method = (options.method || 'GET').toUpperCase();
  
  // Para GET: añadir token como query param (evita que Cloudflare elimine Authorization)
  // Para POST/PUT/DELETE: también añadir token como query param por seguridad
  let url = `${BASE}${path}`;
  if (token) {
    const sep = path.includes('?') ? '&' : '?';
    url = `${BASE}${path}${sep}_t=${encodeURIComponent(token)}`;
  }
  
  const headers = { ...getHeaders(), ...(options.headers as Record<string,string> || {}) };
  console.log(`[API] ${method} ${path} | token: ${token ? token.substring(0,20)+'...' : 'EMPTY'}`);
  const res = await fetch(url, {
    headers,
    ...options,
  });
  if (res.status === 401) {
    const err = await res.json().catch(() => ({ message: '' }));
    const message = err.message || 'No autorizado';
    // Disparar logout solo si el token realmente no existe en localStorage
    // No cerrar sesión por 401 transitorios (Render durmiendo, etc.)
    if (!getToken()) {
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }
    throw new Error(message);
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `Error ${res.status}`);
  }
  return res.json();
}

const get  = <T>(path: string, headers?: Record<string,string>) => request<T>(path, { method:'GET', headers });
const post = <T>(path: string, body: unknown) => request<T>(path, { method:'POST', body: JSON.stringify(body) });
const put  = <T>(path: string, body: unknown) => request<T>(path, { method:'PUT',  body: JSON.stringify(body) });
const patch = <T>(path: string, body: unknown) => request<T>(path, { method:'PATCH', body: JSON.stringify(body) });
const del  = <T>(path: string) => request<T>(path, { method:'DELETE' });

// ══════════════════════════════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════════════════════════════
export const authAPI = {
  login: async (phone: string, password: string) => {
    const res = await post<{token:string; user:any}>('/auth/login', { phone, password });
    if (res.token) setToken(res.token);
    return res;
  },
  register: async (data: {full_name:string; phone:string; password:string; avatar_url?: string}) => {
    const res = await post<{token:string; user:any}>('/auth/register', data);
    if (res.token) setToken(res.token);
    return res;
  },
  logout: async () => {
    try {
      await post<void>('/auth/logout', {});
    } catch {}
    clearToken();
  },
  me: () => get<any>('/auth/me'),
  updateProfile: (data: {full_name?: string; avatar_url?: string}) => put<any>('/auth/profile', data),
  sendVerification: (phone: string, method: string = 'sms', platform?: string) => post<{sent:boolean; message?:string; code?:string}>('/auth/send-verification', { phone, method, platform }),
  verifyCode: (phone: string, code: string, platform?: string) => post<{verified:boolean; message?:string}>('/auth/verify-code', { phone, code, platform }),
  registerWindow: (data: {phone:string; full_name:string; verification_code:string; window_registration?: boolean}) => post<{token:string; user:any}>('/auth/register-window', data),
  registerSocial: (data: {phone:string; full_name:string; email:string; password:string; birthday:string; gender:string; region:string; security_question:string; security_answer:string; verification_code:string; platform:string}) => post<{token:string; user:any}>('/auth/register-social', data),
  sendSMS: (phone: string, message: string) => post<{success:boolean; message?:string}>('/auth/send-notification', { phone, message }),
  resetPassword: (phone: string, code: string, newPassword: string) =>
    post<{success:boolean; message?:string}>('/auth/reset-password', { phone, code, newPassword }),
  getToken,
  setToken,
  clearToken,
  isAuthenticated: () => !!getToken(),
};

// ══════════════════════════════════════════════════════════════════
// WALLET / MONEDERO
// ══════════════════════════════════════════════════════════════════
export const walletAPI = {
  getBalance:      () => get<{balance:number}>('/wallet/balance'),
  getTransactions: (page=1, limit=20) => get<{transactions:any[]; total:number}>(`/wallet/transactions?page=${page}&limit=${limit}`),
  deposit:         (amount:number, method:string, reference:string) => post<{balance:number; transaction:any}>('/wallet/deposit', { amount, method, reference }),
  withdraw:        (amount:number, method:string, destination:string) => post<{balance:number; transaction:any}>('/wallet/withdraw', { amount, method, destination }),
  transfer:        (to:string, amount:number, concept?:string) => post<{balance:number; transaction:any}>('/wallet/transfer', { to, amount, concept }),
  redeemCode:      (code:string) => post<{balance:number; amount:number; message:string}>('/wallet/recharge-code', { code }),
};

// ══════════════════════════════════════════════════════════════════
// MENSAJERÍA / CHAT - COMPLETO
// ══════════════════════════════════════════════════════════════════
export const chatAPI = {
  // Obtener todos los chats del usuario
  getChats: () => get<any[]>('/chats'),
  
  // Obtener mensajes de un chat específico
  getMessages: (chatId:string, page=1, limit=50) => 
    get<any[]>(`/chats/${chatId}/messages?page=${page}&limit=${limit}`),
  
  // Enviar mensaje
  sendMessage: (chatId:string, data: {
    text?: string;
    type?: 'text' | 'image' | 'video' | 'audio' | 'file' | 'location' | 'contact';
    reply_to?: string;
    file_url?: string;
    file_type?: string;
    file_size?: number;
    thumbnail_url?: string;
  }) => post<any>(`/chats/${chatId}/messages`, data),
  
  // Crear chat privado
  createPrivate: (participant_id?: string, phone?: string) => 
    post<any>('/chats/private', { participant_id, phone }),
  
  // Crear chat grupal
  createGroup: (name:string, participant_ids: string[], avatar_url?: string) => 
    post<any>('/chats/group', { name, participant_ids, avatar_url }),

  // Añadir miembros a grupo existente
  addGroupMembers: async (groupId: string, user_ids: string[]) => {
    // Add each member one by one using existing endpoint
    const results = await Promise.allSettled(
      user_ids.map(uid => post<any>(`/chats/${groupId}/participants`, { user_id: uid }))
    );
    return results;
  },
  
  // Marcar mensajes como leídos
  markAsRead: (chatId:string, message_id: string) => 
    post<any>(`/chats/${chatId}/read`, { message_id }),
  
  // Subir archivo — envía el buffer directamente con headers de metadata
  uploadFile: async (chatId: string, file: File) => {
    const token = getToken();
    const arrayBuffer = await file.arrayBuffer();
    const res = await fetch(`${BASE}/chats/${chatId}/upload`, {
      method: 'POST',
      body: arrayBuffer,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': file.type || 'application/octet-stream',
        'X-File-Name': encodeURIComponent(file.name),
      },
    });
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
    return res.json();
  },
  
  // Eliminar mensaje para todos (solo remitente)
  deleteMessage: (messageId:string) => del<void>(`/messages/${messageId}`),
  
  // Eliminar mensaje solo para mí
  deleteMessageForMe: (messageId:string) => del<void>(`/messages/${messageId}/for-me`),
  
  // Buscar usuarios para chat
  searchUsers: (query:string) => get<any[]>(`/contacts/search?q=${encodeURIComponent(query)}`),
  
  // Archivar chat
  archiveChat: (chatId:string) => put<void>(`/chats/${chatId}/archive`, {}),
  
  // Eliminar chat
  deleteChat: (chatId:string) => del<void>(`/chats/${chatId}`),

  // Favoritos de grupos/chats
  getFavoriteChats: () => get<any[]>('/chats/favorites'),
  favoriteChat:     (chatId:string) => post<any>(`/chats/${chatId}/favorite`, {}),
  unfavoriteChat:   (chatId:string) => del<any>(`/chats/${chatId}/favorite`),
};

// ══════════════════════════════════════════════════════════════════
// CONTACTOS
// ══════════════════════════════════════════════════════════════════
export const contactsAPI = {
  getAll:       () => get<any[]>('/contacts'),
  add:          (contact_user_id?: string, phone?: string, name?: string) => post<any>('/contacts', { contact_user_id, phone, nickname: name }),
  remove:       (id:string) => del<void>(`/contacts/${id}`),
  block:        (id:string) => post<any>(`/contacts/${id}/block`, {}),
  getFavorites: () => get<any[]>('/contacts/favorites'),
  favorite:     (id:string) => post<any>(`/contacts/${id}/favorite`, {}),
  unfavorite:   (id:string) => del<any>(`/contacts/${id}/favorite`),
};

// ══════════════════════════════════════════════════════════════════
// LIA-25 (Asistente IA)
// ══════════════════════════════════════════════════════════════════
export const liaAPI = {
  chat: (message:string, history?:{role:string;content:string}[]) =>
    post<{reply:string; action?:string; data?:any}>('/lia/chat', { message, history }),
  analyzeFile: async (file:File) => {
    const fd = new FormData(); fd.append('file', file);
    const res = await fetch(`${BASE}/lia/analyze`, { method:'POST', body:fd });
    return res.json() as Promise<{analysis:string}>;
  },
  transcribeAudio: async (blob:Blob) => {
    const fd = new FormData(); fd.append('audio', blob, 'audio.webm');
    const res = await fetch(`${BASE}/lia/transcribe`, { method:'POST', body:fd });
    return res.json() as Promise<{text:string}>;
  },
};

// ══════════════════════════════════════════════════════════════════
// SERVICIOS PÚBLICOS
// ══════════════════════════════════════════════════════════════════
export const serviciosAPI = {
  // Electricidad SEGESA
  consultarFacturaElec: (contrato:string) => post<any>('/servicios/segesa/consultar', { contrato }),
  pagarElectricidad:    (contrato:string, importe:number, metodo:string) => post<any>('/servicios/segesa/pagar', { contrato, importe, metodo }),
  // Agua SNGE
  consultarFacturaAgua: (contrato:string) => post<any>('/servicios/snge/consultar', { contrato }),
  pagarAgua:            (contrato:string, importe:number, metodo:string) => post<any>('/servicios/snge/pagar', { contrato, importe, metodo }),
  // Impuestos DGI
  consultarImpuesto:    (nif:string, tipo:string) => post<any>('/servicios/dgi/consultar', { nif, tipo }),
  pagarImpuesto:        (nif:string, importe:number, referencia:string) => post<any>('/servicios/dgi/pagar', { nif, importe, referencia }),
  // Correos
  enviarPaquete:        (data:any) => post<any>('/servicios/correos/enviar', data),
};

// ══════════════════════════════════════════════════════════════════
// SUPERMERCADOS
// ══════════════════════════════════════════════════════════════════
export const superAPI = {
  getSupermarkets: (city?:string) => get<any[]>(`/supermarkets${city?`?city=${city}`:''}`),
  getProducts:     (smId:string, catId?:string) => get<any[]>(`/supermarkets/${smId}/products${catId?`?cat=${catId}`:''}`),
  createOrder:     (order:any) => post<{orderId:string; status:string}>('/supermarkets/orders', order),
  getOrders:       () => get<any[]>('/supermarkets/orders'),
  getOrderById:    (id:string) => get<any>(`/supermarkets/orders/${id}`),
};

// ══════════════════════════════════════════════════════════════════
// SALUD
// ══════════════════════════════════════════════════════════════════
export const saludAPI = {
  getHospitals:   (city?:string) => get<any[]>(`/salud/hospitales${city?`?city=${city}`:''}`),
  getPharmacies:  (city?:string) => get<any[]>(`/salud/farmacias${city?`?city=${city}`:''}`),
  requestCita:    (data:any) => post<{citaId:string}>('/salud/citas', data),
  getMedicamentos:(query:string) => get<any[]>(`/salud/medicamentos?q=${encodeURIComponent(query)}`),
  orderMeds:      (order:any) => post<{orderId:string}>('/salud/medicamentos/pedido', order),
};

// ══════════════════════════════════════════════════════════════════
// TAXI
// ══════════════════════════════════════════════════════════════════
export const taxiAPI = {
  requestRide:    (origin:any, dest:any, type:string) => post<{rideId:string; driver:any; eta:number}>('/taxi/request', { origin, dest, type }),
  cancelRide:     (rideId:string) => post<void>(`/taxi/${rideId}/cancel`, {}),
  getRideStatus:  (rideId:string) => get<any>(`/taxi/${rideId}/status`),
  rateDriver:     (rideId:string, rating:number, comment?:string) => post<void>(`/taxi/${rideId}/rate`, { rating, comment }),
  getRides:       () => get<any[]>('/taxi/rides'),
};

export const cemacAPI = {
  getRates:       () => get<any>('/cemac/rates'),
  getTransfers:   () => get<any[]>('/cemac/transfers'),
  createTransfer: (data: any) => post<any>('/cemac/transfers', data),
};

// ══════════════════════════════════════════════════════════════════
// SEGUROS
// ══════════════════════════════════════════════════════════════════
export const segurosAPI = {
  getCompanies:   () => get<any[]>('/seguros/companias'),
  getProducts:    (companyId:string) => get<any[]>(`/seguros/companias/${companyId}/productos`),
  applyInsurance: (data:any) => post<{solicitudId:string}>('/seguros/solicitar', data),
  uploadDoc:      async (solicitudId:string, file:File, tipo:string) => {
    const fd = new FormData(); fd.append('file', file); fd.append('tipo', tipo);
    const res = await fetch(`${BASE}/seguros/solicitudes/${solicitudId}/documentos`, { method:'POST', body:fd });
    return res.json();
  },
};

// ══════════════════════════════════════════════════════════════════
// NOTICIAS
// ══════════════════════════════════════════════════════════════════
export const noticiasAPI = {
  getAll:      (cat?:string) => get<any[]>(`/noticias${cat?`?cat=${cat}`:''}`),
  getById:     (id:string) => get<any>(`/noticias/${id}`),
};

// ══════════════════════════════════════════════════════════════════
// PERFIL DE USUARIO
// ══════════════════════════════════════════════════════════════════
export const userAPI = {
  getProfile:     () => get<any>('/user/profile'),
  updateProfile:  (data:any) => put<any>('/user/profile', data),
  changePassword: (oldPassword:string, newPassword:string) => post<void>('/user/change-password', { oldPassword, newPassword }),
  uploadAvatar:   async (file:File) => {
    const fd = new FormData(); fd.append('avatar', file);
    const res = await fetch(`${BASE}/user/avatar`, {
      method:'POST', body:fd,
      headers: getToken() ? { Authorization:`Bearer ${getToken()}` } : {}
    });
    return res.json();
  },
};

// ══════════════════════════════════════════════════════════════════
// ESPACIO DULCE — Canales y Comunidades
// ══════════════════════════════════════════════════════════════════
export const spacesAPI = {
  getAll:          () => get<any[]>('/spaces'),
  create:          (data: { name: string; description?: string; type: string; cover?: string; emoji?: string }) => post<any>('/spaces', data),
  follow:          (id: string) => post<any>(`/spaces/${id}/follow`, {}),
  getPosts:        (id: string, page = 1) => get<any[]>(`/spaces/${id}/posts?page=${page}`),
  createPost:      (id: string, text: string, image_url?: string) => post<any>(`/spaces/${id}/posts`, { text, image_url }),
  likePost:        (postId: string) => post<any>(`/spaces/posts/${postId}/like`, {}),
  getComments:     (postId: string) => get<any[]>(`/spaces/posts/${postId}/comments`),
  addComment:      (postId: string, text: string) => post<any>(`/spaces/posts/${postId}/comments`, { text }),
  deletePost:      (postId: string) => del<void>(`/spaces/posts/${postId}`),
};

// ══════════════════════════════════════════════════════════════════
// NOTICIAS GOBIERNO GE
// ══════════════════════════════════════════════════════════════════
export const noticiasGobAPI = {
  getAll: () => get<{ noticias: any[]; fromCache: boolean; updatedAt: number }>('/noticias/gobierno'),
};

// ══════════════════════════════════════════════════════════════════
// STORIES / ESTADOS
// ══════════════════════════════════════════════════════════════════
export const storiesAPI = {
  getAll: () => get<any[]>('/stories'),
  publish: (media: { type: string; content: string; bg: string; emoji?: string; music?: string; duration?: number }[]) =>
    post<any>('/stories', { media }),
  deleteAll: () => del<void>('/stories'),
  deleteSlide: (storyId: string, slideIdx: number) => del<any>(`/stories/${storyId}/slide/${slideIdx}`),
  updateSlide: (storyId: string, slideIdx: number, fields: { content?: string; bg?: string; emoji?: string; music?: string }) =>
    patch<any>(`/stories/${storyId}/slide/${slideIdx}`, fields),
  registerView: (storyId: string) => post<void>(`/stories/${storyId}/view`, {}),
};

// ══════════════════════════════════════════════════════════════════
// KEEP-ALIVE — ping cada 4 min para que Render no duerma
// ══════════════════════════════════════════════════════════════════
const keepAlive = () => {
  fetch(`${BASE.replace('/api', '')}/health`).catch(() => {});
};
setInterval(keepAlive, 4 * 60 * 1000); // cada 4 minutos
keepAlive(); // ping inmediato al cargar

// ══════════════════════════════════════════════════════════════════
// EXPORT DEFAULT — objeto con todos los módulos
// ══════════════════════════════════════════════════════════════════
export default {
  auth:     authAPI,
  wallet:   walletAPI,
  chat:     chatAPI,
  contacts: contactsAPI,
  lia:      liaAPI,
  servicios:serviciosAPI,
  super:    superAPI,
  salud:    saludAPI,
  taxi:     taxiAPI,
  cemac:    cemacAPI,
  seguros:  segurosAPI,
  noticias: noticiasAPI,
  user:     userAPI,
  stories:  storiesAPI,
  spaces:   spacesAPI,
  BASE,
};
