import React, { useState, useEffect, useRef, useCallback } from 'react';
import './index.css';
import { chatAPI, authAPI, contactsAPI } from './api';
import AuthScreen from './AuthScreen';
import { ContactImportModal } from './ContactImportModal';
import { EstadosView } from './EstadosView';
import { ApuestasView } from './ApuestasView';
import { CemacView } from './CemacView';
import { MiTaxiView } from './MiTaxiView';
import { InternetModal, RecargaModal, CanalesModal, BancosModal, SegurosModal, FacturasModal, ActividadModal, SaludModal } from './ServiciosModules';
import { SupermercadosModal } from './SupermercadosModule';
import { RecargaMonederoModal, RetiroMonederoModal } from './WalletSystem';
import { useWallet } from './WalletSystem';
import { ContactProfileModal } from './ContactProfileModal';
import { CameraModal } from './CameraModal';
import { useDevice } from './useDevice';
import { EGChatDesktopWelcome } from './EGChatDesktopWelcome';
import { UpdateBanner } from './UpdateBanner';
import { PhotoEditorModal } from './PhotoEditorModal';
import { Avatar } from './Avatar';
import { Lia25View } from './Lia25View';
import { AvatarCropModal } from './AvatarCropModal';
import { QRScanner } from './QRScanner';
import { QRCodeSVG } from 'qrcode.react';
import { RestaurantesModule, VuelosModule, GasolinerasModule } from './ServiciosDiarios';
import { useWebRTC } from './useWebRTC';
import { playMessageReceived, playMessageSent, playNotification, startRingtone, stopRingtone, startDialingTone, stopDialingTone, playCallConnected, playCallEnded, playError, playSuccess, vibrate, unlockAudio, getSoundSettings, saveSoundSettings, MESSAGE_TONES, RINGTONES, NOTIFICATION_TONES, type SoundSettings } from './useSounds';

// Helper para rutas de assets — funciona en web, Capacitor y Electron
const asset = (path: string) => (window.location.protocol === 'file:' ? '.' : '') + path;

interface Bank {
  id: string;
  name: string;
  services: string[];
}

interface NewsItem {
  id: string;
  title: string;
  source: string;
  category: string;
  time: string;
  isLive?: boolean;
}

interface Transaction {
  id: string;
  type: 'sent' | 'received';
  amount: number;
  description: string;
  date: string;
}

const App: React.FC = () => {
  const device = useDevice();

  // Helper: padding de contenido según dispositivo
  // móvil: header fijo (44px) + safe area top + bottom nav (49px)
  // tablet/desktop: sin bottom nav, sin safe area top (la sidebar lo gestiona)
  const viewPadding = {
    top: device.isMobile
      ? 'calc(44px + max(36px, env(safe-area-inset-top, 36px)) + 8px)'
      : '60px',
    bottom: device.isMobile
      ? 'calc(49px + env(safe-area-inset-bottom, 0px) + 8px)'
      : '24px',
    left: device.isDesktop ? '24px' : '16px',
    right: device.isDesktop ? '24px' : '16px',
  };

  const [currentView, setCurrentView] = useState<string>('home');
  const [previousView, setPreviousView] = useState<string>('home');
  // -- Auth persistente -----------------------------------------
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!localStorage.getItem('token'));
  // -- WebRTC real -----------------------------------------------
  const webrtc = useWebRTC();
  // -- Llamada entrante ------------------------------------------
  const [incomingCall, setIncomingCall] = useState<{callId:string; callerId:string; type:'audio'|'video'; offer:any} | null>(null);
  const incomingCallIdRef = useRef<string | null>(null); // ref global para el callId entrante actual
  // -- Grabación de voz en chat ----------------------------------
  const chatRecorderRef = useRef<MediaRecorder | null>(null);
  const chatAudioChunksRef = useRef<Blob[]>([]);
  const [chatRecordingTime, setChatRecordingTime] = useState(0);
  const chatRecordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef<boolean>(true);
  // -- Mensajería real -------------------------------------------
  const [realChats, setRealChats] = useState<any[]>([]);
  const [newChatSearching, setNewChatSearching] = useState(false);
  const currentUserId = useRef<string>('');
  const pollingRef = useRef<ReturnType<typeof setInterval>|null>(null);

  const loadChats = useCallback(async () => {
    if (!localStorage.getItem('token')) return;
    try {
      const d = await chatAPI.getChats();
      if (Array.isArray(d)) {
        // Merge: preservar chats locales recién creados que aún no están en el backend
        setRealChats(prev => {
          const backendIds = new Set(d.map((c: any) => c.id?.toString()));
          const localOnly = prev.filter((c: any) => !backendIds.has(c.id?.toString()));
          const merged = [...localOnly, ...d];
          realChatsRef.current = merged;
          return merged;
        });
        // Sincronizar allGroups con los grupos del backend (reemplazar completamente)
        const backendGroups = d.filter((c: any) => c.type === 'group');
        const mappedGroups = backendGroups.map((c: any) => ({
          id: c.id?.toString(),
          name: c.name || 'Grupo',
          description: c.description || '',
          members: c.participants?.length || 0,
          avatar: (c.name || 'G').slice(0, 2).toUpperCase(),
          avatarUrl: c.avatar_url || '',
          createdDate: c.created_at || new Date().toISOString(),
          lastMessage: c.last_message?.text || '',
          unread: c.unread_count || 0,
          is_favorite: false,
        }));
        setAllGroups(prev => {
          // Preservar is_favorite y avatarUrl de grupos locales
          const prevMap = new Map(prev.map((g: any) => [g.id?.toString(), g]));
          const backendIds = new Set(mappedGroups.map((g: any) => g.id?.toString()));
          const merged = mappedGroups.map((g: any) => ({
            ...g,
            is_favorite: prevMap.get(g.id?.toString())?.is_favorite ?? false,
            avatarUrl: prevMap.get(g.id?.toString())?.avatarUrl || g.avatarUrl || '',
          }));
          // Preservar grupos locales que aún no están en el backend (recién creados)
          const localOnly = prev.filter((g: any) => !backendIds.has(g.id?.toString()));
          const final = [...localOnly, ...merged];
          // Guardar en localStorage como respaldo
          try { localStorage.setItem('egchat_groups', JSON.stringify(final)); } catch {}
          return final;
        });
        // Abrir chat pendiente de notificación si existe
        const pendingId = (window as any).__pendingOpenChatId;
        if (pendingId) {
          const chat = d.find((c: any) => c.id?.toString() === pendingId);
          if (chat) {
            const isGroup = chat.type === 'group';
            let name = chat.name || chat.title || '';
            let avatarUrl = chat.avatar_url || '';
            if (!isGroup && chat.participants) {
              const other = chat.participants.find((p: any) => p.user_id?.toString() !== currentUserId.current?.toString());
              if (other) { name = other.full_name || other.users?.full_name || name; avatarUrl = other.avatar_url || other.users?.avatar_url || avatarUrl; }
            }
            setSelectedChat({ id: chat.id, type: chat.type || 'individual', title: name, subtitle: '', time: '', status: 'online', initials: name.slice(0,2).toUpperCase(), color: isGroup ? '#a855f7' : '#00c8a0', avatarUrl, isGroup });
            setCurrentView('Mensajería');
            (window as any).__pendingOpenChatId = null;
          }
        }
      }
    } catch {}
  }, []);

  const loadMessages = useCallback(async (chatId: string) => {
    if (!chatId || chatId.length < 10) return;
    try {
      const msgs = await chatAPI.getMessages(chatId);
      if (Array.isArray(msgs)) {
        const fmt = msgs.map((m: any) => ({
          id: m.id, from: m.sender_id === currentUserId.current ? 'me' as const : 'them' as const,
          text: m.text || '', time: new Date(m.created_at).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'}),
          created_at: m.created_at,
          status: (m.status||'delivered') as 'pending'|'delivered'|'read',
          // Mensajes de llamada
          ...(m.type === 'call' ? {
            type: 'call',
            callType: m.call_type || (m.text?.includes('Video') ? 'video' : 'audio'),
            callStatus: m.call_status || (m.text?.includes('perdida') ? 'missed' : m.text?.includes('saliente') ? 'outgoing' : 'completed'),
            callDuration: m.call_duration || 0,
          } : {}),
          // Archivos e imágenes del backend
          ...(m.file_url ? {
            fileUrl: m.type !== 'image' && m.type !== 'audio' ? m.file_url : undefined,
            imageUrl: m.type === 'image' ? m.file_url : undefined,
            audioUrl: m.type === 'audio' ? m.file_url : undefined,
            type: m.type === 'image' ? 'image' : m.type === 'audio' ? 'audio' : (m.type === 'file' ? 'file' : m.type),
          } : {}),
          // Fallback: detectar llamadas por texto si el backend no guarda type
          ...(m.type !== 'call' && !m.file_url && m.text && (m.text.includes('Llamada') || m.text.includes('📵') || m.text.includes('📞')) ? {
            type: 'call',
            callType: m.text.includes('Video') || m.text.includes('video') ? 'video' : 'audio',
            callStatus: m.text.includes('perdida') ? 'missed' : m.text.includes('saliente') ? 'outgoing' : 'completed',
            callDuration: 0,
          } : {}),
        }));
        setChatMessages((prev: any) => {
          // Detectar mensajes nuevos para notificar
          const lastId = lastMsgIds.current[chatId];
          const newFromThem = fmt.filter((m: any) => m.from === 'them');
          if (newFromThem.length > 0) {
            const newest = newFromThem[newFromThem.length - 1];
            if (lastId && newest.id !== lastId) {
              notifyNewMessage(chatId, newest.text);
              playMessageReceived(); vibrate([50, 30, 50]); // sonido + vibración doble al recibir
            }
            lastMsgIds.current[chatId] = newest.id;
          }
          // Fusionar: conservar mensajes locales (fotos, audio, archivos) que no están en el backend
          const backendIds = new Set(fmt.map((m: any) => m.id));
          // También excluir mensajes locales cuya URL de archivo ya existe en el backend (evita duplicados durante el upload)
          const backendFileUrls = new Set(fmt.map((m: any) => m.imageUrl || m.audioUrl || m.fileUrl).filter(Boolean));
          const localOnly = (prev[chatId] || []).filter((m: any) =>
            !backendIds.has(m.id) &&
            !(m.imageUrl && backendFileUrls.has(m.imageUrl)) &&
            !(m.audioUrl && backendFileUrls.has(m.audioUrl)) &&
            !(m.fileUrl && backendFileUrls.has(m.fileUrl)) &&
            (m.type === 'image' || m.type === 'audio' || m.imageUrl || m.audioUrl || m.status === 'pending')
          );
          // Filtrar mensajes eliminados para mí localmente (respaldo)
          const filteredFmt = fmt.filter((m: any) => !deletedForMeIds.current.has(m.id));
          // Ordenar por tiempo para mantener el orden correcto
          const merged = [...filteredFmt, ...localOnly].sort((a: any, b: any) => {
            const ta = a.time || '00:00';
            const tb = b.time || '00:00';
            return ta.localeCompare(tb);
          });
          return { ...prev, [chatId]: merged };
        });
      }
    } catch {}
  }, []);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  // -- Notificaciones de mensajes --
  const [msgNotif, setMsgNotif] = useState<{id:string; sender:string; text:string; chatId:string; avatar?:string} | null>(null);
  const msgNotifTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastMsgIds = React.useRef<Record<string, string>>({});
  // IDs de mensajes eliminados "para mí" — persistidos en localStorage
  const deletedForMeIds = React.useRef<Set<string>>(new Set(
    JSON.parse(localStorage.getItem('deletedForMeIds') || '[]')
  ));
  // -- Toast system --
  const [toast, setToast] = useState<{msg:string; type:'success'|'error'|'info'} | null>(null);
  const toastTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = React.useCallback((msg: string, type: 'success'|'error'|'info' = 'success') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(() => setToast(null), 3000);
    // Sonido segn tipo
    if (type === 'success') playSuccess();
    else if (type === 'error') playError();
    else playNotification();
  }, []);
  const realChatsRef = React.useRef<any[]>([]);

  const notifyNewMessage = React.useCallback((chatId: string, text: string) => {
    const chat = realChatsRef.current.find((c: any) => c.id === chatId);
    const other = chat?.participants?.find((p: any) => p.user_id?.toString() !== currentUserId.current?.toString());
    const senderName = other?.users?.full_name || other?.full_name || 'Nuevo mensaje';
    const avatar = other?.users?.avatar_url || '';
    if (msgNotifTimer.current) clearTimeout(msgNotifTimer.current);
    setMsgNotif({ id: Date.now().toString(), sender: senderName, text, chatId, avatar });
    msgNotifTimer.current = setTimeout(() => setMsgNotif(null), 5000);
    // Añadir a notificaciones reales de la app
    const t = new Date();
    const time = `${t.getHours().toString().padStart(2,'0')}:${t.getMinutes().toString().padStart(2,'0')}`;
    setAppNotifications(prev => [{
      id: Date.now().toString(), type: 'message' as const,
      title: `💬 ${senderName}`, body: text, time, read: false, chatId,
    }, ...prev].slice(0, 50));
    if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(`💬 ${senderName}`, { body: text, icon: '/logo-transparent.png', tag: chatId });
    }
  }, []);
  // Helper: navegar a una vista siempre cierra el men radial
  const navigateTo = (view: string) => { setIsMenuOpen(false); setCurrentView(view); };
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [selectedService, setSelectedService] = useState<string>('');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [currentTime, setCurrentTime] = useState<string>('');
  const [selectedNewsCategory, setSelectedNewsCategory] = useState<string>('Todas');
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  // Notificaciones reales de la app
  const [appNotifications, setAppNotifications] = useState<Array<{
    id: string; type: 'message' | 'payment' | 'system' | 'security' | 'taxi' | 'bet';
    title: string; body: string; time: string; read: boolean; chatId?: string; action?: () => void;
  }>>([]);
  const addAppNotification = React.useCallback((notif: { type: 'message'|'payment'|'system'|'security'|'taxi'|'bet'; title: string; body: string; chatId?: string; action?: () => void }) => {
    const t = new Date();
    const time = `${t.getHours().toString().padStart(2,'0')}:${t.getMinutes().toString().padStart(2,'0')}`;
    setAppNotifications(prev => [{ id: Date.now().toString(), ...notif, time, read: false }, ...prev].slice(0, 50));
  }, []);
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [showAddContact, setShowAddContact] = useState<boolean>(false);
  const [showCreateGroup, setShowCreateGroup] = useState<boolean>(false);
  const [addContactTab, setAddContactTab] = useState<'phone'|'qr'|'repertorio'>('phone');
  const [newContactPhone, setNewContactPhone] = useState<string>('');
  const [newContactName, setNewContactName] = useState<string>('');
  const [groupName, setGroupName] = useState<string>('');
  const [groupMembers, setGroupMembers] = useState<Array<{id:string;name:string;initials:string;color:string}>>([]);
  const availableContacts: Array<{id:string;name:string;initials:string;color:string;phone:string}> = [];
  const [showWeatherModal, setShowWeatherModal] = useState<boolean>(false);
  const [showTimeModal, setShowTimeModal] = useState<boolean>(false);
  const [editTime, setEditTime] = useState<string>('');
  const [isManualTime, setIsManualTime] = useState<boolean>(false);
  const [manualTime, setManualTime] = useState<string>('');
  // Estados de llamadas
  const [activeCall, setActiveCall] = useState<{ type: 'audio' | 'video'; contact: any; status: 'calling' | 'connected' | 'ended' } | null>(null);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [callMinimized, setCallMinimized] = useState<boolean>(false);
  const [isCameraOff, setIsCameraOff] = useState<boolean>(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [selectedNotif, setSelectedNotif] = useState<any>(null);
  const [editWeather, setEditWeather] = useState<{ temp: string; city: string; condition: string }>({ temp: '28', city: 'Malabo', condition: 'sunny' });
  const [weather, setWeather] = useState<{ temp: number; city: string; condition: string }>({
    temp: 28,
    city: 'Malabo',
    condition: 'sunny'
  });
  const [homeButtonPos, setHomeButtonPos] = useState<{ x: number; y: number }>({ x: window.innerWidth - 70, y: window.innerHeight - 200 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [messageFilter, setMessageFilter] = useState<string>('individual');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<Record<string, Array<{id: string; from: 'me'|'them'; text: string; time: string; type?: 'text'|'audio'|'image'; status?: 'pending'|'delivered'|'read'; audioUrl?: string; imageUrl?: string; fileUrl?: string; fileName?: string; fileSize?: string; fileExt?: string}>>>(() => {
    try { const s = localStorage.getItem('egchat_messages'); return s ? JSON.parse(s) : {}; } catch { return {}; }
  });
  const [currentChatInput, setCurrentChatInput] = useState<string>('');
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [showChatEmojis, setShowChatEmojis] = useState<boolean>(false);
  const [showChatAttach, setShowChatAttach] = useState<boolean>(false);
  const [showNewChatModal, setShowNewChatModal] = useState<boolean>(false);
  const [showContactSearch, setShowContactSearch] = useState<boolean>(false);
  const [contactSearchQuery, setContactSearchQuery] = useState<string>('');
  const [newChatPhone, setNewChatPhone] = useState<string>('');
  const [newChatLoading, setNewChatLoading] = useState<boolean>(false);
  const [chatEmojiTab, setChatEmojiTab] = useState<'system'|'custom'>('system');
  const [chatEmojiCategory, setChatEmojiCategory] = useState<string>('stickers');
  const [emojiSearch, setEmojiSearch] = useState<string>('');
  const [isRecordingAudio, setIsRecordingAudio] = useState<boolean>(false);
  const [customEmojis, setCustomEmojis] = useState<Array<{id:string; label:string; title:string; source:'created'|'copied'; from?:string}>>([
    { id:'1', label:'🦁', title:'Rico',    source:'created' },
    { id:'2', label:'🌍', title:'Leon GQ', source:'created' },
    { id:'3', label:'?', title:'Africa',  source:'created' },
    { id:'4', label:'💚', title:'Verde GQ',source:'created' },
    { id:'5', label:'🏅', title:'Medalla', source:'copied', from:'Juan' },
    { id:'6', label:'💪', title:'Fuerza',  source:'copied', from:'María Garcia' },
  ]);
  const [showEmojiEditor, setShowEmojiEditor] = useState<boolean>(false);
  const [editingEmoji, setEditingEmoji] = useState<{id?:string; label:string; title:string} | null>(null);
  const [aiButtonPos, setAiButtonPos] = useState<{ x: number; y: number }>({ x: window.innerWidth - 60, y: window.innerHeight - 260 });
  const [isDraggingAI, setIsDraggingAI] = useState<boolean>(false);
  const [dragOffsetAI, setDragOffsetAI] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Posiciones de los 4 iconos arrastrables del men radial
  const [floatingIconPositions, setFloatingIconPositions] = useState<Record<string, { x: number; y: number }>>({});
  const floatingDragRef = React.useRef<{ id: string; ox: number; oy: number; moved: boolean } | null>(null);
  // Saldo sincronizado con WalletSystem
  const { balance: walletBalance, addBalance, subtractBalance } = useWallet();
  const userBalance = walletBalance;
  const setUserBalance = (fn: number | ((p: number) => number)) => {
    const newVal = typeof fn === 'function' ? fn(walletBalance) : fn;
    const diff = newVal - walletBalance;
    if (diff > 0) addBalance(diff);
    else if (diff < 0) { try { subtractBalance(-diff); } catch {} }
  };
  const [transferError, setTransferError] = useState<string>('');
  const [showTransferModal, setShowTransferModal] = useState<boolean>(false);

  // Recarga telefnica
  const [showRechargeModal, setShowRechargeModal] = useState<boolean>(false);
  const [rechargeStep, setRechargeStep] = useState<'operator' | 'amount' | 'confirm' | 'success'>('operator');
  const [rechargeOperator, setRechargeOperator] = useState<string>('');
  const [rechargePhone, setRechargePhone] = useState<string>('');
  const [rechargeAmount, setRechargeAmount] = useState<string>('');

  // Internet / Datos
  const [showInternetModal, setShowInternetModal] = useState<boolean>(false);
  const [internetStep, setInternetStep] = useState<'operator' | 'providers' | 'plan' | 'confirm' | 'success'>('operator');
  const [internetOperator, setInternetOperator] = useState<string>('');
  const [internetPhone, setInternetPhone] = useState<string>('');
  const [internetPlan, setInternetPlan] = useState<string>('');

  // Canales / TV / Entretenimiento
  const [showCanalesModal, setShowCanalesModal] = useState<boolean>(false);
  const [canalesScreen, setCanalesScreen] = useState<'home'|'companies'|'packages'|'detail'|'subscribe'|'orders'|'myChannels'|'support'>('home');
  const [canalesCompany, setCanalesCompany] = useState<string>('');
  const [canalesPackage, setCanalesPackage] = useState<any>(null);
  const [canalesOrders, setCanalesOrders] = useState<Array<{id:string;company:string;package:string;status:string;date:string;price:string}>>([]);
  const [canalesForm, setCanalesForm] = useState({name:'',phone:'',address:'',city:'',notes:''});

  // Servicios Financieros
  const [showFinModal, setShowFinModal] = useState<string | null>(null);
  const [showBancosModal, setShowBancosModal] = useState(false);
  const [bancosInitScreen, setBancosInitScreen] = useState<'home'|'cards'>('home');
  const [showSegurosModal, setShowSegurosModal] = useState(false);
  const [showFacturasModal, setShowFacturasModal] = useState(false);
  const [showActividadModal, setShowActividadModal] = useState(false);
  const [showSaludModal, setShowSaludModal] = useState(false);
  const [showSuperModal, setShowSuperModal] = useState(false);
  const [showReadReceipts, setShowReadReceipts] = useState(true);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [showContactProfile, setShowContactProfile] = useState<any>(null);
  const [mutedChats, setMutedChats] = useState<string[]>([]);
  const [blockedChats, setBlockedChats] = useState<string[]>([]);
  const [pinnedChats, setPinnedChats] = useState<string[]>([]);
  const [starredMessages, setStarredMessages] = useState<Record<string,string[]>>({});
  const [showStarredModal, setShowStarredModal] = useState(false);
  const [starredChatId, setStarredChatId] = useState<string>('');
  const [cameraPhoto, setCameraPhoto] = useState<{url:string; chatId:string; chatTitle:string} | null>(null);
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoFilter, setPhotoFilter] = useState('none');
  const [showLiveCamera, setShowLiveCamera] = useState(false);
  const [liveCameraChatId, setLiveCameraChatId] = useState('');
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [showChatSearch, setShowChatSearch] = useState(false);
  const [chatImageViewer, setChatImageViewer] = useState<string | null>(null); // visor de imagen inline
  const [msgContextMenu, setMsgContextMenu] = useState<{msg: any; x: number; y: number} | null>(null); // men contextual de mensaje
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedMsgIds, setSelectedMsgIds] = useState<string[]>([]);
  const [saludInitTab, setSaludInitTab] = useState<'hospitales'|'farmacias'|'cita'|'urgencias'>('hospitales');
  const [showSvcModal, setShowSvcModal] = useState<string | null>(null); // servicios publicos + diarios + herramientas
  const [svcStep, setSvcStep] = useState<string>('main');
  const [svcData, setSvcData] = useState<Record<string,string>>({}); // 'transfer'|'loan'|'insurance'|'bills'|'invest'|'cards'
  const [finStep, setFinStep] = useState<string>('main');
  const [finData, setFinData] = useState<Record<string,string>>({});

  const [chatWallpapers, setChatWallpapers] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem('egchat_chat_wallpapers') || '{}'); } catch { return {}; }
  });
  const [showWallpaperCatalog, setShowWallpaperCatalog] = useState<boolean>(false);
  const [showLayoutPanel, setShowLayoutPanel] = useState<boolean>(false);
  const [homeLayout, setHomeLayout] = useState<string>('default');
  const [customWallpapers, setCustomWallpapers] = useState<Array<{ id: string; label: string; url: string; type: 'image' | 'video' }>>(() => {
    try { return JSON.parse(localStorage.getItem('egchat_custom_wallpapers') || '[]'); } catch { return []; }
  });
  const [transferAmount, setTransferAmount] = useState<string>('');
  const [transferRecipient, setTransferRecipient] = useState<string>('');
  const [aiMessages, setAiMessages] = useState<Array<{ id: string; type: 'user' | 'assistant'; content: string; timestamp: string }>>([
    {
      id: '1',
      type: 'assistant',
      content: '¡Hola! Soy Lia-25, tu asistente inteligente de EGCHAT. Puedo ayudarte con cualquier cosa: responder preguntas, enviar mensajes a contactos, gestionar tu dinero, y mucho ms. En qu puedo ayudarte?',
      timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [aiInputValue, setAiInputValue] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ id: string; name: string; type: string; content: string; size: number }>>([]);
  const [analysisResults, setAnalysisResults] = useState<string>('');
  const [presentationMode, setPresentationMode] = useState<boolean>(false);
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [presentationData, setPresentationData] = useState<Array<{ title: string; content: string; bullets: string[] }>>([]);
  const [showContactsModal, setShowContactsModal] = useState<boolean>(false);
  const [contactsSearchQuery, setContactsSearchQuery] = useState<string>('');
  const [expandFavoriteContacts, setExpandFavoriteContacts] = useState<boolean>(false);
  const [expandFavoriteGroups, setExpandFavoriteGroups] = useState<boolean>(false);
  const [favoriteContacts, setFavoriteContacts] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<Array<{ id: string; bank: string; type: string; balance: number; icon: string }>>([
    { id: '1', bank: 'BANGE', type: 'Corriente', balance: 45200, icon: 'banking' },
    { id: '2', bank: 'CCEI Bank', type: 'Ahorros', balance: 80000, icon: 'banking' }
  ]);
  const [showAddBankAccount, setShowAddBankAccount] = useState<boolean>(false);
  const [newBankForm, setNewBankForm] = useState<{ bank: string; type: string; balance: string }>({ bank: '', type: 'Corriente', balance: '' });
  const [showQRModal, setShowQRModal] = useState<boolean>(false);
  const [qrType, setQRType] = useState<'pay' | 'receive'>('pay');
  const [qrAmount, setQrAmount] = useState<string>('');
  const [qrConcept, setQrConcept] = useState<string>('');
  const [pendingTransfers, setPendingTransfers] = useState<Array<{ id: string; from: string; to: string; amount: number; status: 'pending' | 'cancelled'; createdAt: Date; expiresAt: Date }>>([]);
  const [showQuickTransferModal, setShowQuickTransferModal] = useState<boolean>(false);
  const [quickTransferData, setQuickTransferData] = useState<{ contactId: string; contactName: string; amount: string; accountId: string }>({ contactId: '', contactName: '', amount: '', accountId: '' });
  
  // Fase 5: Historial y Transacciones
  const [transactionHistory, setTransactionHistory] = useState<Array<{ id: string; type: 'sent' | 'received' | 'payment' | 'deposit' | 'withdrawal' | 'salary' | 'card_withdrawal'; amount: number; description: string; date: string; status: 'completed' | 'pending' | 'failed'; fromAccount?: string; toAccount?: string; commission?: number }>>([
    { id: '1', type: 'received', amount: 50000, description: 'Transferencia recibida de Juan', date: '12/03/2026', status: 'completed' },
    { id: '2', type: 'sent', amount: 25000, description: 'Pago de servicios', date: '11/03/2026', status: 'completed' },
    { id: '3', type: 'received', amount: 75000, description: 'Depósito salario', date: '10/03/2026', status: 'completed' },
    { id: '4', type: 'payment', amount: 15000, description: 'Pago de electricidad', date: '09/03/2026', status: 'completed' },
    { id: '5', type: 'sent', amount: 30000, description: 'Transferencia a María', date: '08/03/2026', status: 'completed' }
  ]);
  const [transactionFilter, setTransactionFilter] = useState<'all' | 'sent' | 'received' | 'payment' | 'deposit' | 'withdrawal'>('all');
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [showTransactionDetail, setShowTransactionDetail] = useState<boolean>(false);
  
  // Fase 6: Recargas y Retiros
  const [showSalaryReloadModal, setShowSalaryReloadModal] = useState<boolean>(false);
  const [salaryReloadData, setShowSalaryReloadData] = useState<{ amount: string; accountId: string; concept: string }>({ amount: '', accountId: '', concept: '' });
  const [showCardWithdrawalModal, setShowCardWithdrawalModal] = useState<boolean>(false);
  const [cardWithdrawalData, setCardWithdrawalData] = useState<{ amount: string; accountId: string; cardNumber: string }>({ amount: '', accountId: '', cardNumber: '' });

  // Seguridad: PIN y Autenticación
  const [showPINModal, setShowPINModal] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [userPIN, setUserPIN] = useState<string>('1234'); // PIN por defecto (en producción ser encriptado)
  const [pinAttempts, setPinAttempts] = useState<number>(0);
  const [isAccountLocked, setIsAccountLocked] = useState<boolean>(false);
  const [lockoutTime, setLockoutTime] = useState<number>(0);
  const [pendingOperation, setPendingOperation] = useState<any>(null);
  
  // Seguridad: Límites y Validaciones
  const [dailyTransactionTotal, setDailyTransactionTotal] = useState<number>(0);
  const [transactionLog, setTransactionLog] = useState<Array<{ id: string; type: string; amount: number; timestamp: Date; status: string; ipAddress?: string }>>([]);
  const [suspiciousActivities, setSuspiciousActivities] = useState<Array<{ id: string; type: string; description: string; timestamp: Date }>>([]);
  const [sessionStartTime, setSessionStartTime] = useState<Date>(new Date());
  const [lastActivityTime, setLastActivityTime] = useState<Date>(new Date());

  // Perfil de Usuario - Datos reales del usuario logueado
  const [userProfile, setUserProfile] = useState<{
    id: string;
    name: string;
    email: string;
    phone: string;
    country: string;
    city: string;
    address: string;
    avatar: string;
    avatarUrl: string;
    joinDate: string;
    verificationStatus: 'verified' | 'pending' | 'unverified';
    twoFactorEnabled: boolean;
    notificationsEnabled: boolean;
  }>(() => {
    // Cargar perfil guardado para no perderlo al reconectar
    try {
      const saved = localStorage.getItem('egchat_user_profile');
      if (saved) {
        const p = JSON.parse(saved);
        return {
          id: p.id || '', name: p.name || 'Usuario', email: p.email || '',
          phone: p.phone || '', country: p.country || 'Guinea Ecuatorial',
          city: p.city || '', address: p.address || '',
          avatar: p.avatar || 'U', avatarUrl: p.avatarUrl || localStorage.getItem('user_avatar') || '',
          joinDate: p.joinDate || new Date().toLocaleDateString('es-ES'),
          verificationStatus: 'pending', twoFactorEnabled: false, notificationsEnabled: true,
        };
      }
    } catch {}
    return {
      id: '', name: 'Usuario', email: '', phone: '',
      country: 'Guinea Ecuatorial', city: '', address: '',
      avatar: 'U', avatarUrl: '', joinDate: new Date().toLocaleDateString('es-ES'),
      verificationStatus: 'pending', twoFactorEnabled: false, notificationsEnabled: true,
    };
  });
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [editedProfile, setEditedProfile] = useState<any>(null);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [showProfileView, setShowProfileView] = useState<boolean>(false);
  const [showProfileQR, setShowProfileQR] = useState<boolean>(false);
  const [avatarCropUrl, setAvatarCropUrl] = useState<string | null>(null);
  const [showQRScannerCamera, setShowQRScannerCamera] = useState<boolean>(false);
  // Wallet balance reveal animation
  const [balanceRevealed, setBalanceRevealed] = useState<boolean>(false);
  const [balanceRevealing, setBalanceRevealing] = useState<boolean>(false);
  // Balance oculto en otros lugares
  const [balanceVisibleMap, setBalanceVisibleMap] = useState<Record<string, boolean>>({});
  const toggleBalanceVisible = (key: string) => setBalanceVisibleMap(prev => ({ ...prev, [key]: !prev[key] }));
  const isBalanceVisible = (key: string) => !!balanceVisibleMap[key];

  // Ajustes
  const [currentSettingsTab, setCurrentSettingsTab] = useState<'perfil' | 'sonidos' | 'ayuda' | 'actividad' | 'apariencia'>('perfil');
  const [appFontSize, setAppFontSize] = useState<number>(() => parseFloat(localStorage.getItem('egchat_fontsize') || '1'));
  const [appFontFamily, setAppFontFamily] = useState<string>(() => localStorage.getItem('egchat_fontfamily') || 'default');

  // Aplicar fuente y tamaño a toda la app
  React.useEffect(() => {
    const fonts: Record<string, string> = {
      default: "'Segoe UI', system-ui, -apple-system, sans-serif",
      rounded: "'Nunito', 'Varela Round', sans-serif",
      modern: "'Inter', 'Helvetica Neue', sans-serif",
      classic: "'Georgia', 'Times New Roman', serif",
      mono: "'Courier New', 'Consolas', monospace",
    };
    document.documentElement.style.fontSize = `${appFontSize * 16}px`;
    document.documentElement.style.fontFamily = fonts[appFontFamily] || fonts.default;
  }, [appFontSize, appFontFamily]);

  // Detectar Android y establecer altura de status bar
  React.useEffect(() => {
    const isAndroid = /android/i.test(navigator.userAgent);
    const isCapacitor = !!(window as any).Capacitor;
    if (isAndroid || isCapacitor) {
      document.documentElement.style.setProperty('--status-bar-height', '28px');
      document.documentElement.style.setProperty('--header-top-padding', '28px');
    }
  }, []);
  const [soundSettings, setSoundSettings] = React.useState<SoundSettings>(getSoundSettings);
  const updateSoundSetting = (key: keyof SoundSettings, value: any) => {
    const updated = { ...soundSettings, [key]: value };
    setSoundSettings(updated);
    saveSoundSettings(updated);
  };
  // Tonos personalizados subidos por el usuario
  const [customTones, setCustomTones] = React.useState<Array<{id:string; name:string; url:string; type:'message'|'ringtone'|'notification'}>>(() => {
    try { const s = localStorage.getItem('egchat_custom_tones'); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const saveCustomTones = (tones: typeof customTones) => {
    setCustomTones(tones);
    try { localStorage.setItem('egchat_custom_tones', JSON.stringify(tones)); } catch {}
  };
  const [activityLog, setActivityLog] = useState<Array<{ id: string; action: string; description: string; timestamp: Date; type: 'login' | 'transaction' | 'security' | 'profile' }>>([
    { id: '1', action: 'Login', description: 'Inicio de sesión exitoso', timestamp: new Date(Date.now() - 3600000), type: 'login' },
    { id: '2', action: 'Transferencia', description: 'Transferencia de 25,000 XAF a María', timestamp: new Date(Date.now() - 7200000), type: 'transaction' },
    { id: '3', action: 'PIN Verificado', description: 'PIN verificado para retiro a tarjeta', timestamp: new Date(Date.now() - 10800000), type: 'security' },
    { id: '4', action: 'Perfil Actualizado', description: 'Teléfono actualizado', timestamp: new Date(Date.now() - 86400000), type: 'profile' }
  ]);

  // Gestion de Contactos - Ahora usa datos reales del backend
  const [allContacts, setAllContacts] = useState<Array<{ id: string; name: string; phone: string; avatar: string; avatarUrl?: string; status: 'online' | 'offline' | 'away'; addedDate: string }>>([]);
  const allContactsRef = React.useRef<any[]>([]);
  React.useEffect(() => { allContactsRef.current = allContacts; }, [allContacts]);
  const [showAddContactModal, setShowAddContactModal] = useState<boolean>(false);
  const [newContactData, setNewContactData] = useState<{ name: string; phone: string }>({ name: '', phone: '' });
  const [showQRScannerModal, setShowQRScannerModal] = useState<boolean>(false);
  const [qrScanResult, setQrScanResult] = useState<string>('');
  const [showContactImportModal, setShowContactImportModal] = useState<boolean>(false);

  // Gestion de Grupos - Ahora usa datos reales del backend
  const [allGroups, setAllGroups] = useState<Array<{ id: string; name: string; description: string; members: number; avatar: string; avatarUrl?: string; createdDate: string; lastMessage: string; unread: number; is_favorite?: boolean }>>(() => {
    try {
      const saved = localStorage.getItem('egchat_groups');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [favoriteGroupIds, setFavoriteGroupIds] = useState<string[]>([]);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState<boolean>(false);
  const [newGroupData, setNewGroupData] = useState<{ name: string; description: string; selectedMembers: string[] }>({ name: '', description: '', selectedMembers: [] });

  // Panel de integrantes del grupo
  const [showGroupMembersPanel, setShowGroupMembersPanel] = useState<boolean>(false);
  const [groupMembersList, setGroupMembersList] = useState<Array<{
    id: string; user_id: string; phone?: string; full_name?: string;
    avatar_url?: string; online_status?: boolean; role?: string;
  }>>([]);
  const [loadingGroupMembers, setLoadingGroupMembers] = useState<boolean>(false);

  // Persistir mensajes en localStorage  incluye imágenes comprimidas
  useEffect(() => {
    try {
      const toSave: Record<string, any[]> = {};
      for (const [k, msgs] of Object.entries(chatMessages)) {
        toSave[k] = msgs.map(m => {
          const saved: any = { ...(m as any) };
          // Excluir blob: URLs de audio que expiran
          if (saved.audioUrl && saved.audioUrl.startsWith('blob:')) {
            delete saved.audioUrl;
          }
          // Comprimir imágenes base64 grandes a thumbnail para localStorage
          if (saved.imageUrl && saved.imageUrl.startsWith('data:image') && saved.imageUrl.length > 50000) {
            // Guardar versión comprimida como thumbnail
            try {
              const canvas = document.createElement('canvas');
              const img = new Image();
              img.src = saved.imageUrl;
              canvas.width = 200; canvas.height = 160;
              const ctx = canvas.getContext('2d');
              if (ctx && img.complete) {
                ctx.drawImage(img, 0, 0, 200, 160);
                saved.imageUrl = canvas.toDataURL('image/jpeg', 0.4);
              }
            } catch {}
          }
          return saved;
        });
      }
      try {
        localStorage.setItem('egchat_messages', JSON.stringify(toSave));
      } catch {
        // Si aún falla, guardar solo mensajes de texto (sin imágenes)
        const toSaveLite: Record<string, any[]> = {};
        for (const [k, msgs] of Object.entries(toSave)) {
          toSaveLite[k] = msgs.filter((m: any) => !m.imageUrl || !m.imageUrl.startsWith('data:'));
        }
        try { localStorage.setItem('egchat_messages', JSON.stringify(toSaveLite)); } catch {}
      }
    } catch {}
  }, [chatMessages]);

  // Actualizar hora cada 30s (los minutos cambian cada 60s, 30s es suficiente)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const t = now.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
      setCurrentTime(t);
      // También actualizar DOM directo para evitar re-render en el header
      const el = document.getElementById('header-clock');
      if (el) el.textContent = t;
    };
    
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  // Scroll al fondo al ABRIR un chat
  // Scroll automático: siempre al abrir chat, y al recibir/enviar solo si estás al fondo
  React.useEffect(() => {
    if (!selectedChat) return;
    isAtBottomRef.current = true;
    setTimeout(() => {
      const el = document.querySelector('.chat-messages-scroll') as HTMLElement;
      if (el) el.scrollTop = el.scrollHeight;
    }, 100);
  }, [selectedChat?.id]);

  // Scroll automático: solo cuando hay mensaje nuevo real
  const lastScrollMsgId = React.useRef<string>('');
  React.useEffect(() => {
    if (!selectedChat) return;
    const chatId = selectedChat.id?.toString() || '';
    const msgs = chatMessages[chatId] || [];
    if (msgs.length === 0) return;
    const lastMsg = msgs[msgs.length - 1];
    // Evitar scroll si el último mensaje ya lo procesamos
    if (lastMsg.id === lastScrollMsgId.current) return;
    lastScrollMsgId.current = lastMsg.id;
    // Scroll si es mensaje mío, o si estaba al fondo
    if (lastMsg.from === 'me' || isAtBottomRef.current) {
      requestAnimationFrame(() => {
        const el = document.querySelector('.chat-messages-scroll') as HTMLElement;
        if (el) el.scrollTop = el.scrollHeight;
      });
    }
  }, [chatMessages]);

  // Geolocalizacin automática + clima real (Open-Meteo, sin API key)
  // watchPosition detecta cambios de ubicación  actualiza ciudad y temperatura
  // Además refresca temperatura cada 15 min aunque no te muevas
  useEffect(() => {
    if (!navigator.geolocation) return;

    let lastLat: number | null = null;
    let lastLon: number | null = null;
    let tempInterval: ReturnType<typeof setInterval> | null = null;

    const CITY_THRESHOLD_KM = 5; // cambiar ciudad solo si te mueves >5 km

    const distKm = (la1: number, lo1: number, la2: number, lo2: number) => {
      const R = 6371;
      const dLat = (la2 - la1) * Math.PI / 180;
      const dLon = (lo2 - lo1) * Math.PI / 180;
      const a = Math.sin(dLat/2)**2 + Math.cos(la1*Math.PI/180)*Math.cos(la2*Math.PI/180)*Math.sin(dLon/2)**2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    };

    const fetchAll = async (lat: number, lon: number, forceCity = false) => {
      try {
        // Temperatura + condición siempre
        const meteo = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
        ).then(r => r.json());
        const tempC = Math.round(meteo?.current_weather?.temperature ?? 28);
        const wcode = meteo?.current_weather?.weathercode ?? 0;
        const condition = wcode === 0 ? 'sunny' : wcode <= 3 ? 'cloudy' : 'rain';

        if (forceCity) {
          // Ciudad  solo cuando cambia de zona
          const geo = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
          ).then(r => r.json());
          const city = geo?.address?.city || geo?.address?.town || geo?.address?.village || geo?.address?.county || 'Mi ciudad';
          setWeather({ temp: tempC, city, condition });
          setEditWeather({ temp: String(tempC), city, condition });
        } else {
          setWeather(prev => ({ ...prev, temp: tempC, condition }));
          setEditWeather(prev => ({ ...prev, temp: String(tempC), condition }));
        }
      } catch {}
    };

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        const isFirstFix = lastLat === null;
        const movedFar = !isFirstFix && distKm(lastLat!, lastLon!, lat, lon) > CITY_THRESHOLD_KM;

        if (isFirstFix || movedFar) {
          lastLat = lat; lastLon = lon;
          await fetchAll(lat, lon, true); // actualiza ciudad + temp
        }

        // Refrescar temperatura cada 15 min aunque no te muevas
        if (isFirstFix) {
          tempInterval = setInterval(() => {
            if (lastLat !== null && lastLon !== null) fetchAll(lastLat, lastLon, false);
          }, 15 * 60 * 1000);
        }
      },
      () => {/* permiso denegado */},
      { enableHighAccuracy: false, maximumAge: 5 * 60 * 1000, timeout: 10000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      if (tempInterval) clearInterval(tempInterval);
    };
  }, []);

  // Neon glow via CSS animation (better performance on iOS)
  useEffect(() => {
    const eg = document.getElementById('neon-eg');
    const chat = document.getElementById('neon-chat');
    const glowStyle = 'neon-glow-anim';
    if (!document.getElementById(glowStyle)) {
      const style = document.createElement('style');
      style.id = glowStyle;
      style.textContent = `
        @keyframes neonPulse {
          0%, 100% { text-shadow: 0 0 6px #fff, 0 0 18px #fff, 0 0 35px rgba(255,255,255,0.7); }
          50% { text-shadow: 0 0 12px #fff, 0 0 30px #fff, 0 0 55px rgba(255,255,255,0.7); }
        }
        #neon-eg, #neon-chat { animation: neonPulse 1.6s ease-in-out infinite; }
      `;
      document.head.appendChild(style);
    }
    return () => {};
  }, []);

  // Manejar drag del botón home
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setHomeButtonPos({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches[0]) {
        const touch = e.touches[0];
        setHomeButtonPos({
          x: touch.clientX - dragOffset.x,
          y: touch.clientY - dragOffset.y
        });
      }
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, dragOffset]);

  // Manejar drag del botón AI
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingAI) {
        setAiButtonPos({
          x: e.clientX - dragOffsetAI.x,
          y: e.clientY - dragOffsetAI.y
        });
      }
    };

    const handleMouseUp = () => {
      setIsDraggingAI(false);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDraggingAI && e.touches[0]) {
        const touch = e.touches[0];
        setAiButtonPos({
          x: touch.clientX - dragOffsetAI.x,
          y: touch.clientY - dragOffsetAI.y
        });
      }
    };

    const handleTouchEnd = () => {
      setIsDraggingAI(false);
    };

    if (isDraggingAI) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDraggingAI, dragOffsetAI]);

  // Drag de iconos flotantes del men radial
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const d = floatingDragRef.current;
      if (!d) return;
      d.moved = true;
      setFloatingIconPositions(prev => ({ ...prev, [d.id]: { x: e.clientX - d.ox, y: e.clientY - d.oy } }));
    };
    const onTouchMove = (e: TouchEvent) => {
      const d = floatingDragRef.current;
      if (!d || !e.touches[0]) return;
      d.moved = true;
      setFloatingIconPositions(prev => ({ ...prev, [d.id]: { x: e.touches[0].clientX - d.ox, y: e.touches[0].clientY - d.oy } }));
    };
    const onUp = () => { floatingDragRef.current = null; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onUp);
    };
  }, []);

  // Funcion para procesar transferencia
  const processTransfer = (amount: number, recipient: string): boolean => {
    if (amount > 0 && amount <= userBalance) {
      setUserBalance(userBalance - amount);
      // notificación real de pago enviado
      const t = new Date();
      const time = `${t.getHours().toString().padStart(2,'0')}:${t.getMinutes().toString().padStart(2,'0')}`;
      setAppNotifications(prev => [{
        id: Date.now().toString(), type: 'payment' as const,
        title: '💸 Transferencia enviada',
        body: `${amount.toLocaleString()} XAF a ${recipient}`,
        time, read: false,
      }, ...prev].slice(0, 50));
      setShowTransferModal(false);
      setTransferAmount('');
      setTransferRecipient('');
      return true;
    }
    return false;
  };

  // Bancos disponibles
  const banks: Bank[] = [
    {
      id: 'bange',
      name: 'BANGE',
      services: ['Transferencias', 'Pagos de Servicios', 'Consulta de Saldo', 'Historial', 'Cambio de Divisa', 'Préstamos']
    },
    {
      id: 'ccei',
      name: 'CCEI Bank',
      services: ['Transferencias Internacionales', 'Pagos Móviles', 'Consulta de Cuenta', 'Inversiones', 'Tarjetas', 'Seguros']
    },
    {
      id: 'bgfi',
      name: 'BGFI Bank',
      services: ['Banca Digital', 'Pagos QR', 'Consultas', 'Créditos', 'Ahorros', 'Comercio Exterior']
    },
    {
      id: 'afrexim',
      name: 'Afrexim Bank',
      services: ['Financiamiento', 'Comercio', 'Consultoría', 'Inversión', 'Desarrollo', 'Cooperación']
    },
    {
      id: 'ecobank',
      name: 'Ecobank',
      services: ['Banca Móvil', 'Transferencias', 'Pagos', 'Préstamos', 'Tarjetas', 'Seguros']
    },
    {
      id: 'societe',
      name: 'Societe Generale',
      services: ['Banca Personal', 'Empresarial', 'Inversiones', 'Seguros', 'Créditos', 'Consultas']
    }
  ];

  // Noticias simuladas
  const newsItems: NewsItem[] = [
    {
      id: '1',
      title: 'Presidente anuncia nuevas medidas economicas para 2026',
      source: 'Presidencia de Guinea Ecuatorial',
      category: 'Polatica',
      time: '14:30',
      isLive: true
    },
    {
      id: '2',
      title: 'CEMAC aprueba nuevo marco financiero regional',
      source: 'Noticias CEMAC',
      category: 'Financieras',
      time: '13:45'
    },
    {
      id: '3',
      title: 'Ministerio de Salud reporta avances en vacunacion',
      source: 'Ministerio de informacion',
      category: 'Salud',
      time: '12:20'
    },
    {
      id: '4',
      title: 'Nueva tecnologia 5G llega a Malabo',
      source: 'TVGE',
      category: 'tecnologia',
      time: '11:15'
    },
    {
      id: '5',
      title: 'Seleccion nacional se prepara para eliminatorias',
      source: 'Radio Nacional',
      category: 'Deportes',
      time: '10:30'
    },
    {
      id: '6',
      title: 'Vicepresidencia presenta plan de desarrollo digital',
      source: 'Vicepresidencia',
      category: 'Polatica',
      time: '09:45'
    },
    {
      id: '7',
      title: 'BEAC anuncia nuevas polaticas monetarias',
      source: 'BEAC',
      category: 'Financieras',
      time: '08:30'
    },
    {
      id: '8',
      title: 'Festival de cultura africana en Bata',
      source: 'Guinea Ecuatorial Press',
      category: 'Cultura',
      time: '07:15'
    }
  ];

  // Transacciones simuladas
  const transactions: Transaction[] = [
    {
      id: '1',
      type: 'received',
      amount: 50000,
      description: 'Transferencia recibida',
      date: '12/03/2026'
    },
    {
      id: '2',
      type: 'sent',
      amount: 25000,
      description: 'Pago de servicios',
      date: '11/03/2026'
    },
    {
      id: '3',
      type: 'received',
      amount: 75000,
      description: 'Depósito salario',
      date: '10/03/2026'
    },
    {
      id: '4',
      type: 'sent',
      amount: 15000,
      description: 'Compra En línea',
      date: '09/03/2026'
    },
    {
      id: '5',
      type: 'received',
      amount: 30000,
      description: 'Reembolso',
      date: '08/03/2026'
    }
  ];

  // Funcion para crear efecto ripple - SIMPLIFICADO
  const createRippleEffect = (event: React.MouseEvent<HTMLButtonElement>, color: string = 'rgba(255, 255, 255, 0.6)') => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    const ripple = document.createElement('span');
    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      background: ${color};
      border-radius: 50%;
      transform: scale(0);
      animation: rippleEffect 0.6s linear;
      pointer-events: none;
      z-index: 1000;
    `;
    
    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  };

  // Funcion para procesar mensajes de Lia-25 ? conectada al backend
  const processAiMessage = async (userMessage: string) => {
    const now = new Date();
    const timestamp = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
    const userMsg = { id: Date.now().toString(), type: 'user' as const, content: userMessage, timestamp };
    setAiMessages(prev => [...prev, userMsg]);
    setAiInputValue('');
    try {
      const history = aiMessages.slice(-10).map(m => ({ role: m.type === 'user' ? 'user' : 'assistant', content: m.content }));
      const { liaAPI } = await import('./api');
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const result = await liaAPI.chat(userMessage, history);
      clearTimeout(timeout);
      const assistantMsg = { id: (Date.now()+1).toString(), type: 'assistant' as const, content: result.reply, timestamp };
      setAiMessages(prev => [...prev, assistantMsg]);
    } catch {
      // Backend no disponible ? usar respuesta local
      processAiMessageAdvanced(userMessage);
    }
  };

  // Funcion para iniciar grabacion de audio
  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/wav' });
        handleAudioMessage(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setAudioChunks(chunks);
    } catch (error) {
      console.error('Error al acceder al microfono:', error);
      showToast('No se pudo acceder al micrófono. Verifica los permisos.', 'error');
    }
  };

  // Funcion para detener grabacion
  const stopAudioRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  // Funcion para procesar mensaje de audio
  const handleAudioMessage = (audioBlob: Blob) => {
    // Simular transcripci?n de audio (en producción usar?s una API de speech-to-text)
    const transcriptions = [
      '¿Cuál es mi saldo?',
      'Enviar 5000 XAF a Juan',
      'Abrir Mensajería',
      'Qu noticias hay?',
      'Ayuda',
      'Hola asistente',
      'Qu hora es?',
      'Mostrar mis contactos'
    ];

    const randomTranscription = transcriptions[Math.floor(Math.random() * transcriptions.length)];

    // Agregar mensaje de audio del usuario
    const newAudioMessage = {
      id: Date.now().toString(),
      type: 'user' as const,
      content: ` [Audio] ${randomTranscription}`,
      timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    };

    setAiMessages(prev => [...prev, newAudioMessage]);

    // Procesar como si fuera texto
    setTimeout(() => {
      processAiMessage(randomTranscription);
    }, 300);

    // Reproducir audio de confirmacian
    playAudioResponse('Entendido, procesando tu audio...');
  };

  // Funcion para reproducir respuesta en audio
  const playAudioResponse = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Funcion para analizar documentos y textos
  const analyzeDocument = (content: string, analysisType: string): string => {
    const lines = content.split('\n').filter(line => line.trim());
    const wordCount = content.split(/\s+/).length;
    const charCount = content.length;
    const paragraphs = content.split('\n\n').length;

    let analysis = `📄 ANLISIS DE DOCUMENTO\n\n`;
    analysis += `📊 Estad?sticas B?sicas:\n`;
    analysis += `- Palabras: ${wordCount}\n`;
    analysis += `- Caracteres: ${charCount}\n`;
    analysis += `- Parrafos: ${paragraphs}\n`;
    analysis += `- Lineas: ${lines.length}\n\n`;

    if (analysisType === 'sentiment') {
      const positiveWords = ['bueno', 'excelente', 'perfecto', 'bien', 'fantastico', 'maravilloso'];
      const negativeWords = ['malo', 'terrible', 'horrible', 'mal', 'pasimo', 'desastre'];
      
      const positiveCount = positiveWords.filter(word => content.toLowerCase().includes(word)).length;
      const negativeCount = negativeWords.filter(word => content.toLowerCase().includes(word)).length;
      
      analysis += `📄 ANLISIS de Sentimiento:\n`;
      analysis += `- Palabras positivas: ${positiveCount}\n`;
      analysis += `- Palabras negativas: ${negativeCount}\n`;
      analysis += `- Sentimiento general: ${positiveCount > negativeCount ? 'Positivo' : negativeCount > positiveCount ? 'Negativo' : 'Neutral'}\n\n`;
    }

    if (analysisType === 'keywords') {
      const words = content.toLowerCase().split(/\s+/);
      const wordFreq: Record<string, number> = {};
      words.forEach(word => {
        if (word.length > 4) {
          wordFreq[word] = (wordFreq[word] || 0) + 1;
        }
      });
      
      const topWords = Object.entries(wordFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
      
      analysis += `🔑 Palabras Clave:\n`;
      topWords.forEach(([word, count]) => {
        analysis += `- "${word}" (${count} veces)\n`;
      });
      analysis += '\n';
    }

    if (analysisType === 'summary') {
      const sentences = content.split(/[.!]+/).filter(s => s.trim());
      const summaryLength = Math.ceil(sentences.length / 3);
      const summary = sentences.slice(0, summaryLength).join('. ');
      
      analysis += `📝 Resumen:\n${summary}...\n\n`;
    }

    return analysis;
  };

  // Funcion para generar presentaciones
  const generatePresentation = (topic: string, slides: number = 5): Array<{ title: string; content: string; bullets: string[] }> => {
    const presentations: Record<string, Array<{ title: string; content: string; bullets: string[] }>> = {
      'negocios': [
        {
          title: 'Introducción al Negocio',
          content: 'Visión general y objetivos',
          bullets: ['Misión clara', 'Objetivos medibles', 'Estrategia definida']
        },
        {
          title: 'ANALISIS de Mercado',
          content: 'Investigación y oportunidades',
          bullets: ['Mercado objetivo', 'Competencia', 'Oportunidades de crecimiento']
        },
        {
          title: 'Propuesta de Valor',
          content: 'Lo que nos diferencia',
          bullets: ['Ventajas competitivas', 'Beneficios únicos', 'Propuesta diferenciadora']
        },
        {
          title: 'Plan de acción',
          content: 'Estrategia de implementación',
          bullets: ['Fases del proyecto', 'Timeline', 'Recursos necesarios']
        },
        {
          title: 'Proyecciones Financieras',
          content: 'ANALISIS economico',
          bullets: ['Ingresos proyectados', 'Costos estimados', 'ROI esperado']
        }
      ],
      'tecnologia': [
        {
          title: 'Introducción Tecnológica',
          content: 'Visión de la solución',
          bullets: ['Problema identificado', 'Solución propuesta', 'Impacto esperado']
        },
        {
          title: 'Arquitectura del Sistema',
          content: 'Componentes técnicos',
          bullets: ['Frontend', 'Backend', 'Base de datos']
        },
        {
          title: 'Caracterasticas Principales',
          content: 'Funcionalidades clave',
          bullets: ['Automatizacian', 'Escalabilidad', 'Seguridad']
        },
        {
          title: 'Roadmap de Desarrollo',
          content: 'Plan de implementación',
          bullets: ['Fase 1: MVP', 'Fase 2: Expansión', 'Fase 3: Optimización']
        },
        {
          title: 'Conclusiones',
          content: 'Resumen y praximos pasos',
          bullets: ['Beneficios clave', 'Llamada a la acción', 'Contacto']
        }
      ],
      'educacion': [
        {
          title: 'Introducción al Tema',
          content: 'Contexto y relevancia',
          bullets: ['¿Por qué es importante?', 'Objetivos de aprendizaje', 'Estructura del curso']
        },
        {
          title: 'Conceptos Fundamentales',
          content: 'Bases teóricas',
          bullets: ['Definiciones clave', 'Principios basicos', 'Aplicaciones']
        },
        {
          title: 'Casos de Estudio',
          content: 'Ejemplos practicos',
          bullets: ['Caso 1', 'Caso 2', 'Lecciones aprendidas']
        },
        {
          title: 'Metodologaa Practica',
          content: 'Aplicacian real',
          bullets: ['Ejercicios', 'Proyectos', 'Evaluacian']
        },
        {
          title: 'Conclusiones y Recursos',
          content: 'Resumen y referencias',
          bullets: ['Puntos clave', 'Bibliografaa', 'Recursos adicionales']
        }
      ]
    };

    const selectedPresentation = presentations[topic.toLowerCase()] || presentations['negocios'];
    return selectedPresentation.slice(0, slides);
  };

  // Funcion para procesar archivos
  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const newFile = {
        id: Date.now().toString(),
        name: file.name,
        type: file.type,
        content: content,
        size: file.size
      };
      setUploadedFiles(prev => [...prev, newFile]);
      
      // Agregar mensaje al chat
      const fileMessage = {
        id: Date.now().toString(),
        type: 'user' as const,
        content: `📎 Archivo cargado: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`,
        timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
      };
      setAiMessages(prev => [...prev, fileMessage]);

      // Respuesta del asistente
      setTimeout(() => {
        const response = {
          id: (Date.now() + 1).toString(),
          type: 'assistant' as const,
          content: `📌 Archivo "${file.name}" cargado exitosamente. Puedo:\n- Analizar su contenido\n- Extraer información clave\n- Generar resumen\n- Detectar sentimiento\n\nQu deseas que haga con este archivo?`,
          timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
        };
        setAiMessages(prev => [...prev, response]);
      }, 500);
    };
    reader.readAsText(file);
  };

  // Funcian mejorada de procesamiento de mensajes con capacidades avanzadas
  const processAiMessageAdvanced = (userMessage: string) => {
    const newUserMessage = {
      id: Date.now().toString(),
      type: 'user' as const,
      content: userMessage,
      timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    };

    setAiMessages(prev => [...prev, newUserMessage]);
    setAiInputValue('');

    setTimeout(() => {
      let assistantResponse = '';
      const lowerMessage = userMessage.toLowerCase();

      // Generar presentaciones - FUNCIONA SIN ARCHIVOS
      if (lowerMessage.includes('presentacion') || lowerMessage.includes('slides') || lowerMessage.includes('diapositivas')) {
        let topic = 'negocios';
        if (lowerMessage.includes('tecnolog')) topic = 'tecnologia';
        if (lowerMessage.includes('educac')) topic = 'educacion';
        
        const slides = generatePresentation(topic);
        setPresentationData(slides);
        setPresentationMode(true);
        setCurrentSlide(0);
        
        assistantResponse = ` presentacion GENERADA\n\nTema: ${topic}\nDiapositivas: ${slides.length}\n\n`;
        slides.forEach((slide, idx) => {
          assistantResponse += `${idx + 1}. ${slide.title}\n`;
        });
        assistantResponse += `\n✓ Presentación lista. Escribe "mostrar presentacion" para verla.`;
      }
      // ANALISIS de documentos - FUNCIONA CON ARCHIVOS
      else if ((lowerMessage.includes('analizar') || lowerMessage.includes('ANALISIS')) && uploadedFiles.length > 0) {
        const lastFile = uploadedFiles[uploadedFiles.length - 1];
        const analysisType = lowerMessage.includes('sentimiento') ? 'sentiment' : 
                            lowerMessage.includes('palabras clave') ? 'keywords' : 'summary';
        assistantResponse = analyzeDocument(lastFile.content, analysisType);
      }
      // ANALISIS sin archivos
      else if (lowerMessage.includes('analizar') || lowerMessage.includes('ANALISIS')) {
        assistantResponse = ` ANALISIS DE DOCUMENTOS\n\nPara analizar un documento:\n1. Haz clic en "Cargar archivo"\n2. Selecciona un documento (TXT, PDF, DOC, DOCX)\n3. Escribe "analizar documento"\n\nPuedo hacer:\na ANALISIS de sentimiento\na Extraccin de palabras clave\na Resumen automatico\na Estadisticas de contenido`;
      }
      // Saldo
      else if (lowerMessage.includes('saldo') || lowerMessage.includes('balance')) {
        assistantResponse = `📊 TU SALDO ACTUAL\n\nSaldo: ${userBalance.toLocaleString()} XAF\n\nPuedo ayudarte con:\n- Transferencias\n- Consultas\n- Historial`;
      }
      // Enviar dinero
      else if (lowerMessage.includes('enviar') && lowerMessage.includes('dinero')) {
        assistantResponse = `💸 TRANSFERENCIA DE DINERO\n\nTu saldo: ${userBalance.toLocaleString()} XAF\n\nPara enviar dinero:\n- Escribe: "Enviar 5000 XAF a Juan"\n- O: "Transferir 10000 XAF a María"\n\nContactos disponibles:\n- Juan Prez\n- María Gonzlez\n- Carlos Mendoza`;
      }
      // Procesar transferencia
      else if (lowerMessage.match(/enviar\s+(\d+)\s*xaf\s+a\s+(\w+)/i)) {
        const match = userMessage.match(/enviar\s+(\d+)\s*xaf\s+a\s+(\w+)/i);
        if (match) {
          const amount = parseInt(match[1]);
          const recipient = match[2];
          if (amount <= userBalance) {
            setUserBalance(userBalance - amount);
            assistantResponse = `✓ TRANSFERENCIA COMPLETADA\n\nMonto: ${amount.toLocaleString()} XAF\nDestinatario: ${recipient}\nNuevo saldo: ${(userBalance - amount).toLocaleString()} XAF`;
          } else {
            assistantResponse = `⚠ SALDO INSUFICIENTE\n\nNecesitas: ${amount.toLocaleString()} XAF\nTienes: ${userBalance.toLocaleString()} XAF\nFalta: ${(amount - userBalance).toLocaleString()} XAF`;
          }
        }
      }
      // Noticias
      else if (lowerMessage.includes('noticias') || lowerMessage.includes('noticia')) {
        assistantResponse = `📰 NOTICIAS RECIENTES\n\n1. Presidente anuncia nuevas medidas economicas\n2. CEMAC aprueba nuevo marco financiero\n3. Ministerio de Salud reporta avances en vacunacion\n4. Nueva tecnologia 5G llega a Malabo\n5. Seleccion nacional se prepara para eliminatorias\n\nEscribe el numero para mas detalles`;
      }
      // Servicios
      else if (lowerMessage.includes('servicios') || lowerMessage.includes('banco')) {
        assistantResponse = `🏦 SERVICIOS BANCARIOS\n\nBancos disponibles:\n- BANGE\n- CCEI Bank\n- BGFI Bank\n- Afrexim Bank\n- Ecobank\n- Societe Generale\n\n¿Cuál necesitas?`;
      }
      // Contactos
      else if (lowerMessage.includes('contactos') || lowerMessage.includes('amigos')) {
        assistantResponse = `👥 TUS CONTACTOS\n\n- Juan Prez (Dinero)\n- María Gonzlez (Personal)\n- Carlos Mendoza (Negocios)\n\nDeseas contactar a alguien?`;
      }
      // Hora
      else if (lowerMessage.includes('hora') || lowerMessage.includes('que hora')) {
        assistantResponse = ` HORA ACTUAL\n\n${currentTime}\n\nHay algo ms que necesites?`;
      }
      // Clima
      else if (lowerMessage.includes('clima') || lowerMessage.includes('tiempo')) {
        assistantResponse = `🌤️ CLIMA EN MALABO\n\nTemperatura: 28C\nCondicion: Soleado\nHumedad: 75%\n\nPerfecto para el dia`;
      }
      // Navegar
      else if (lowerMessage.includes('ir a') || lowerMessage.includes('abrir')) {
        if (lowerMessage.includes('Mensajería') || lowerMessage.includes('mensajes')) {
          setCurrentView('Mensajería');
          assistantResponse = `💬 Abriendo Mensajería...`;
        } else if (lowerMessage.includes('monedero') || lowerMessage.includes('cartera')) {
          setCurrentView('monedero');
          assistantResponse = `💰 Abriendo monedero...`;
        } else if (lowerMessage.includes('servicios')) {
          setCurrentView('servicios');
          assistantResponse = `🛠 Abriendo servicios...`;
        } else if (lowerMessage.includes('noticias')) {
          setCurrentView('news');
          assistantResponse = `📰 Abriendo noticias...`;
        } else if (lowerMessage.includes('inicio') || lowerMessage.includes('home')) {
          setCurrentView('home');
          assistantResponse = `🏠 Volviendo al inicio...`;
        } else {
          assistantResponse = `Puedo abrir:\n- Mensajería\n- Monedero\n- Servicios\n- Noticias\n- Inicio\n\n¿Cuál prefieres?`;
        }
      }
      // capacidades
      else if (lowerMessage.includes('capacidades') || lowerMessage.includes('que puedes hacer')) {
        assistantResponse = `🤖 MIS CAPACIDADES\n\n💰 DINERO:\n- Consultar saldo\n- Transferencias\n- Historial\n\n📊 ANÁLISIS:\n- Documentos\n- Sentimiento\n- Palabras clave\n\n📝 GENERACIÓN:\n- Presentaciones\n- Contenido\n- Reportes\n\n🎙 AUDIO:\n- Grabar comandos\n- Reproducir respuestas\n\n🧭 NAVEGACIÓN:\n- Abrir vistas\n- Gestionar app\n\n¿Qué necesitas?`;
      }
      // Ayuda
      else if (lowerMessage.includes('ayuda') || lowerMessage.includes('help')) {
        assistantResponse = `❓ AYUDA\n\nPuedo ayudarte con:\n\nEscribe:\n- "Saldo" - Ver tu saldo\n- "Enviar 5000 XAF a Juan" - Transferir\n- "presentacion de negocios" - Crear slides\n- "Noticias" - Ver noticias\n- "capacidades" - Ver todo lo que puedo hacer\n\nO habla:\n- Manten presionado el micrfono\n- Habla tu comando\n- Suelta para enviar\n\nQu necesitas?`;
      }
      // Fallback
      else {
        assistantResponse = `✓ Entendido: "${userMessage}"\n\nPuedo ayudarte con:\n- Consultar saldo\n- Transferencias\n- Generar presentaciones\n- Analizar documentos\n- Ver noticias\n- Navegar la app\n\n¿Qué deseas hacer?`;
      }

      const newAssistantMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant' as const,
        content: assistantResponse,
        timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
      };

      setAiMessages(prev => [...prev, newAssistantMessage]);
    }, 500);
  };

  // ============ FUNCIONES DE SEGURIDAD ============

  // Validar PIN
  const validatePIN = (pin: string): boolean => {
    return pin === userPIN;
  };

  // Verificar si la cuenta esta bloqueada
  const checkAccountLock = (): boolean => {
    if (isAccountLocked && lockoutTime > 0) {
      const now = Date.now();
      if (now < lockoutTime) {
        return true;
      } else {
        setIsAccountLocked(false);
        setPinAttempts(0);
        setLockoutTime(0);
      }
    }
    return false;
  };

  // Registrar intento fallido de PIN
  const recordFailedPINAttempt = () => {
    const newAttempts = pinAttempts + 1;
    setPinAttempts(newAttempts);
    
    if (newAttempts >= 3) {
      setIsAccountLocked(true);
      setLockoutTime(Date.now() + 5 * 60 * 1000); // 5 minutos de bloqueo
      setSuspiciousActivities([...suspiciousActivities, {
        id: Date.now().toString(),
        type: 'failed_pin_attempts',
        description: `3 intentos fallidos de PIN detectados`,
        timestamp: new Date()
      }]);
      console.warn(' Cuenta bloqueada por 5 minutos debido a intentos fallidos de PIN');
    }
  };

  // Validar monto de transacción
  const validateTransactionAmount = (amount: number, maxLimit: number = 500000): { valid: boolean; error?: string } => {
    if (amount <= 0) {
      return { valid: false, error: 'El monto debe ser mayor a 0' };
    }
    if (amount > maxLimit) {
      return { valid: false, error: `El monto no puede exceder ${maxLimit.toLocaleString()} XAF` };
    }
    return { valid: true };
  };

  // Validar numero de tarjeta (formato basico)
  const validateCardNumber = (cardNumber: string): { valid: boolean; error?: string } => {
    const cleaned = cardNumber.replace(/\s/g, '');
    if (cleaned.length < 13 || cleaned.length > 19) {
      return { valid: false, error: 'numero de tarjeta invalido' };
    }
    if (!/^\d+$/.test(cleaned)) {
      return { valid: false, error: 'El nmero de tarjeta solo debe contener dgitos' };
    }
    return { valid: true };
  };

  // Validar saldo suficiente
  const validateSufficientBalance = (accountId: string, amount: number, commission: number = 0): { valid: boolean; error?: string } => {
    const account = bankAccounts.find(a => a.id === accountId);
    if (!account) {
      return { valid: false, error: 'Cuenta no encontrada' };
    }
    const totalNeeded = amount + commission;
    if (account.balance < totalNeeded) {
      return { valid: false, error: `Saldo insuficiente. Necesitas ${totalNeeded.toLocaleString()} XAF` };
    }
    return { valid: true };
  };

  // Verificar lmite de transacciones diarias
  const checkDailyLimit = (amount: number, dailyLimit: number = 2000000): { valid: boolean; error?: string } => {
    const today = new Date().toDateString();
    const todayTransactions = transactionLog.filter(t => new Date(t.timestamp).toDateString() === today);
    const todayTotal = todayTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    if (todayTotal + amount > dailyLimit) {
      const remaining = dailyLimit - todayTotal;
      return { valid: false, error: `Lmite diario excedido. Puedes transferir ${remaining.toLocaleString()} XAF ms hoy` };
    }
    return { valid: true };
  };

  // Detectar actividad sospechosa
  const detectSuspiciousActivity = (amount: number, type: string): boolean => {
    // Transacción muy grande
    if (amount > 1000000) {
      setSuspiciousActivities([...suspiciousActivities, {
        id: Date.now().toString(),
        type: 'large_transaction',
        description: `Transacción grande detectada: ${amount.toLocaleString()} XAF`,
        timestamp: new Date()
      }]);
      return true;
    }

    // Mltiples transacciones en corto tiempo
    const lastMinute = new Date(Date.now() - 60000);
    const recentTransactions = transactionLog.filter(t => new Date(t.timestamp) > lastMinute);
    if (recentTransactions.length > 5) {
      setSuspiciousActivities([...suspiciousActivities, {
        id: Date.now().toString(),
        type: 'rapid_transactions',
        description: `${recentTransactions.length} transacciones en el ltimo minuto`,
        timestamp: new Date()
      }]);
      return true;
    }

    return false;
  };

  // Registrar transacción en log de auditora
  const logTransaction = (type: string, amount: number, status: string) => {
    const newLog = {
      id: Date.now().toString(),
      type: type,
      amount: amount,
      timestamp: new Date(),
      status: status,
      ipAddress: 'local' // En producción ser la IP real
    };
    setTransactionLog([...transactionLog, newLog]);
    setDailyTransactionTotal(dailyTransactionTotal + amount);
    
  };

  // Requerir PIN para operación sensible
  const requirePINForOperation = (operation: any) => {
    setPendingOperation(operation);
    setShowPINModal(true);
    setPinInput('');
    setPinAttempts(0);
  };

  // Funcion para renderizar iconos SVG profesionales
  const renderIcon = (iconType: string, size: number = 24) => {
    const iconStyle = { 
      width: `${size}px`, 
      height: `${size}px`, 
      stroke: 'currentColor', 
      strokeWidth: 2, 
      strokeLinecap: 'round' as const, 
      strokeLinejoin: 'round' as const 
    };

    switch (iconType) {
      case 'mensajes':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            <line x1="9" y1="10" x2="15" y2="10"/>
            <line x1="9" y1="14" x2="13" y2="14"/>
          </svg>
        );
      case 'cartera':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
          </svg>
        );
      case 'noticias':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><line x1="18" y1="9" x2="10" y2="9"/><line x1="18" y1="13" x2="10" y2="13"/><line x1="14" y1="17" x2="10" y2="17"/>
          </svg>
        );
      case 'salud':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 1-4 0V5a2 2 0 0 1 2-2h3"/>
            <path d="M19 3H9a2 2 0 0 0-2 2v3h14V5a2 2 0 0 0-2-2z"/>
            <line x1="14" y1="11" x2="14" y2="17"/>
            <line x1="11" y1="14" x2="17" y2="14"/>
          </svg>
        );
      case 'edu':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 10v6M2 10l10-5 10 5-10 5-10-5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
          </svg>
        );
      case 'transp':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
          </svg>
        );
      case 'contactos':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z"/>
            <path d="M12 14c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        );
      case 'wallet':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 7H5c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2z"/>
            <path d="M16 12h2v2h-2z"/>
          </svg>
        );
      case 'services':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
          </svg>
        );
      case 'ajustes':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94L14.4 2.81c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
          </svg>
        );
      case 'estados':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4"/>
            <circle cx="12" cy="12" r="9" strokeDasharray="2.5 2" strokeWidth="1.5"/>
          </svg>
        );
      case 'apuestas':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="4"/>
            <circle cx="8" cy="8" r="1.2" fill="currentColor" stroke="none"/>
            <circle cx="16" cy="8" r="1.2" fill="currentColor" stroke="none"/>
            <circle cx="8" cy="16" r="1.2" fill="currentColor" stroke="none"/>
            <circle cx="16" cy="16" r="1.2" fill="currentColor" stroke="none"/>
            <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/>
          </svg>
        );
      case 'cemac':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
            <circle cx="12" cy="6" r="1.5" stroke="none"/>
          </svg>
        );
      case 'mitaxi':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1l2-3h10l2 3h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2"/>
            <circle cx="7.5" cy="17" r="2.5"/>
            <circle cx="16.5" cy="17" r="2.5"/>
            <path d="M7 9h10"/>
          </svg>
        );
      case 'qrscan':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="5" height="5" rx="1"/><rect x="16" y="3" width="5" height="5" rx="1"/><rect x="3" y="16" width="5" height="5" rx="1"/>
            <path d="M21 16h-3v3"/><path d="M21 21h-3"/><path d="M16 21v-3"/>
            <path d="M10 3h1"/><path d="M10 8h1"/><path d="M3 10v1"/><path d="M8 10v1"/>
          </svg>
        );
      case 'plus':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        );
      case 'close':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        );
      case 'notification':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        );
      case 'menu':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        );
      case 'id-card':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M7 18v-2a2 2 0 0 1 4 0v2"/><line x1="14" y1="8" x2="18" y2="8"/><line x1="14" y1="12" x2="18" y2="12"/>
          </svg>
        );
      case 'historial':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        );
      case 'farmacia':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 1-4 0V5a2 2 0 0 1 2-2h3"/>
            <path d="M19 3H9a2 2 0 0 0-2 2v3h14V5a2 2 0 0 0-2-2z"/>
            <line x1="14" y1="11" x2="14" y2="17"/>
            <line x1="11" y1="14" x2="17" y2="14"/>
          </svg>
        );
      case 'belleza':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        );
      case 'seguros':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <polyline points="9 12 11 14 15 10"/>
          </svg>
        );
      case 'electricidad':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
        );
      case 'factura':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
        );
      case 'lavanderia':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="2"/>
            <circle cx="12" cy="13" r="5"/>
            <circle cx="12" cy="13" r="2"/>
            <line x1="6" y1="6" x2="6.01" y2="6"/>
            <line x1="9" y1="6" x2="9.01" y2="6"/>
          </svg>
        );
      case 'restaurante':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
            <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
            <line x1="6" y1="1" x2="6" y2="4"/>
            <line x1="10" y1="1" x2="10" y2="4"/>
            <line x1="14" y1="1" x2="14" y2="4"/>
          </svg>
        );
      case 'tienda':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
        );
      case 'gasolinera':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 22V8l9-6 9 6v14"/>
            <path d="M9 22V12h6v10"/>
            <path d="M19 8h2a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-2"/>
          </svg>
        );
      case 'taxi':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1l2-3h10l2 3h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2"/>
            <circle cx="7.5" cy="17" r="2.5"/>
            <circle cx="16.5" cy="17" r="2.5"/>
            <rect x="8" y="9" width="3" height="3" rx="1"/>
          </svg>
        );
      case 'hotel':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 22V12h18v10"/>
            <path d="M3 12V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5"/>
            <path d="M11 12V7"/>
            <path d="M7 22v-4h10v4"/>
          </svg>
        );
      case 'vuelos':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21 4 19 4c-2 0-4 2-4 2L7 7.2l-1.5 1.5 5.5 2-2 3.5-3-1-1 1 2.5 2.5 2.5 2.5 1-1-1-3 3.5-2 2 5.5z"/>
          </svg>
        );
      case 'tarjeta':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="4" width="22" height="16" rx="2"/>
            <line x1="1" y1="10" x2="23" y2="10"/>
            <line x1="5" y1="15" x2="9" y2="15"/>
            <line x1="12" y1="15" x2="14" y2="15"/>
          </svg>
        );
      case 'invest':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
          </svg>
        );
      case 'banking':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 21h18"/><path d="M3 10h18"/><path d="M5 6l7-3 7 3"/><path d="M4 10v11"/><path d="M20 10v11"/><path d="M8 14v3"/><path d="M12 14v3"/><path d="M16 14v3"/>
          </svg>
        );
      case 'gobierno':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 20h20"/><path d="M4 20V10"/><path d="M20 20V10"/><path d="M12 4v16"/><path d="M12 4l-8 6h16l-8-6z"/><path d="M8 14v3"/><path d="M16 14v3"/>
          </svg>
        );
      case 'comercio':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l1-6h16l1 6"/><path d="M3 9a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0"/><path d="M5 11v9h14v-9"/><path d="M9 21v-6h6v6"/>
          </svg>
        );
      case 'turismo':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
            <polyline points="14 2 14 8 20 8"/>
            <path d="M10 12l2 2 4-4"/>
          </svg>
        );
      case 'fondo':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <path d="M21 15l-5-5L5 21"/>
          </svg>
        );
      case 'emergencia':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        );
      case 'ai':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="6" width="18" height="13" rx="3"/>
            <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/>
            <circle cx="8.5" cy="12.5" r="1.5"/>
            <circle cx="15.5" cy="12.5" r="1.5"/>
            <path d="M9 16c.83.63 1.94 1 3 1s2.17-.37 3-1"/>
            <line x1="12" y1="3" x2="12" y2="6"/>
          </svg>
        );
      case 'sun':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
        );
      case 'cloud':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
          </svg>
        );
      case 'rain':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2C12 2 5 10 5 15a7 7 0 0 0 14 0C19 10 12 2 12 2z"/>
          </svg>
        );
      case 'world':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
        );
      case 'money':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
        );
      case 'building':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/>
            <path d="M6 12h4v4h-4z"/>
            <path d="M14 12h4v4h-4z"/>
            <path d="M6 20h4v2h-4z"/>
            <path d="M14 20h4v2h-4z"/>
            <path d="M6 4h4v4h-4z"/>
            <path d="M14 4h4v4h-4z"/>
          </svg>
        );
      case 'users':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        );
      case 'zap':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
        );
      case 'credit-card':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
            <line x1="1" y1="10" x2="23" y2="10"/>
          </svg>
        );
      case 'briefcase':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
          </svg>
        );
      case 'shield':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        );
      case 'heart':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        );
      case 'cpu':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="4" width="16" height="16" rx="2" ry="2"/>
            <rect x="9" y="9" width="6" height="6"/>
            <line x1="9" y1="1" x2="9" y2="4"/>
            <line x1="15" y1="1" x2="15" y2="4"/>
            <line x1="9" y1="20" x2="9" y2="23"/>
            <line x1="15" y1="20" x2="15" y2="23"/>
            <line x1="20" y1="9" x2="23" y2="9"/>
            <line x1="20" y1="14" x2="23" y2="14"/>
            <line x1="1" y1="9" x2="4" y2="9"/>
            <line x1="1" y1="14" x2="4" y2="14"/>
          </svg>
        );
      case 'sparkles':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        );
      case 'zap-circle':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
        );
      case 'check-circle':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        );
      case 'x-circle':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        );
      case 'alert-triangle':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        );
      case 'message-square':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        );
      case 'filter':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
          </svg>
        );
      case 'search':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
        );
      case 'user-plus':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="8.5" cy="7" r="4"/>
            <line x1="20" y1="8" x2="20" y2="14"/>
            <line x1="23" y1="11" x2="17" y2="11"/>
          </svg>
        );
      case 'users-group':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        );
      case 'phone':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
          </svg>
        );
      case 'recharge':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="2" width="14" height="20" rx="2"/>
            <path d="M12 18h.01"/>
            <path d="M9 7h6"/>
            <path d="M9 11h4"/>
            <path d="M15 14l2-2-2-2"/>
          </svg>
        );
      case 'video':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="23 7 16 12 23 17 23 7"/>
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
          </svg>
        );
      case 'more-horizontal':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="1"/>
            <circle cx="19" cy="12" r="1"/>
            <circle cx="5" cy="12" r="1"/>
          </svg>
        );
      case 'send':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        );
      case 'paperclip':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.64 16.2a2 2 0 0 1-2.83-2.83l8.49-8.49"/>
          </svg>
        );
      case 'mic':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" y1="19" x2="12" y2="23"/>
            <line x1="8" y1="23" x2="16" y2="23"/>
          </svg>
        );
      case 'volume-2':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <path d="M15.54 3.54a9 9 0 0 1 0 12.73M19.07 4.93a13 13 0 0 1 0 14.14"/>
          </svg>
        );
      case 'image':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
        );
      default:
        return null;
    }
  };

  // Renderizar header - OPTIMIZADO PARA Móvil CON COLORES DEL LOGO
  const renderHeader = () => (
    <div
      id="app-main-header"
      ref={(el) => {
        if (el) {
          const update = () => {
            // Pequeño delay para que el CSS del safe area se aplique completamente
            requestAnimationFrame(() => {
              const h = el.getBoundingClientRect().height;
              if (h > 0) {
                document.documentElement.style.setProperty('--header-height', h + 'px');
              }
            });
          };
          update();
          // Re-medir después de 100ms (para modo PWA standalone)
          setTimeout(update, 100);
          setTimeout(update, 500);
          if (typeof ResizeObserver !== 'undefined') {
            const ro = new ResizeObserver(update);
            ro.observe(el);
          }
        }
      }}
      style={{
      position: 'fixed',
      top: 0,
      left: device.isMobile ? 0 : (device.isTablet ? '72px' : '240px'),
      right: 0,
      background: 'linear-gradient(90deg, #00c8a0 0%, #00b4e6 100%)',
      borderBottom: 'none',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000,
      boxShadow: '0 2px 8px rgba(0,200,160,0.3)',
      overflow: 'hidden',
      // En tablet/desktop no hay status bar — solo en móvil
      paddingTop: device.isMobile ? 'max(28px, env(safe-area-inset-top, 28px))' : '0',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', height: '44px', padding: '0 10px', boxSizing: 'border-box' }}>
      

      {/* Logo y texto / Botan de regreso */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0px' }}>
        {['news','banking','historial-completo','id-digital'].includes(currentView) ? (
          // Botan de regreso para vistas secundarias
          <button
            onClick={() => setCurrentView('home')}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 0 0 1.5px #00c8a0, 0 0 10px rgba(0,200,160,0.5)';
              e.currentTarget.style.background = 'rgba(0,200,160,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 0 0 1.5px #00c8a0';
              e.currentTarget.style.background = 'rgba(0,0,0,0.35)';
            }}
            style={{
              background: 'rgba(0,0,0,0.35)',
              border: 'none',
              boxShadow: '0 0 0 1.5px #00c8a0',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#0d0d0d',
              outline: 'none',
              transition: 'background 0.2s, box-shadow 0.2s !important'
            }}
          >
            <svg style={{ width: '20px', height: '20px', stroke: 'currentColor', fill: 'none', strokeWidth: 2 }} viewBox="0 0 24 24">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
        ) : (
          // Logo normal
          <>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, rgba(59, 130, 246, 0.3) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)',
              flexShrink: 0,
            }}>
              <img 
                src="/logo-transparent.png" 
                alt="EGCHAT Logo" 
                style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', animation: 'spin 6s linear infinite', willChange: 'transform', transform: 'translateZ(0)', backfaceVisibility: 'hidden' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '1px', marginLeft: '4px' }}>
              <span id="neon-eg" style={{ fontSize: '20px', fontWeight: '800', color: 'white', letterSpacing: '-0.5px' }}>EG</span>
              <span id="neon-chat" style={{ fontSize: '14px', fontWeight: '800', color: 'white', letterSpacing: '-0.5px' }}>CHAT</span>
            </div>
          </>
        )}
      </div>

      {/* Hora, clima y controles */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>

        {/* Clima */}
        <div style={{ position: 'relative' }}>
          <div
            onClick={() => setShowWeatherModal(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              background: 'rgba(8,18,36,0.88)',
              padding: '5px 10px',
              borderRadius: '50px',
              border: '1px solid rgba(255,255,255,0.13)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)',
              cursor: 'pointer',
            }}
          >
            <div style={{ color: '#fbbf24' }}>{renderIcon(weather.condition === 'sunny' ? 'sun' : weather.condition === 'cloudy' ? 'cloud' : 'rain', 12)}</div>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#ffffff' }}>{weather.temp}°</span>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.85)' }}>{weather.city}</span>
          </div>
        </div>

        {/* Notificaciones */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => { setShowNotifications(!showNotifications); setAppNotifications(prev => prev.map(n => ({ ...n, read: true }))); }}
            style={{
              background: showNotifications ? 'rgba(0,200,160,0.30)' : 'rgba(8,18,36,0.88)',
              border: `1px solid ${showNotifications ? 'rgba(0,200,160,0.45)' : 'rgba(255,255,255,0.13)'}`,
              boxShadow: showNotifications
                ? '0 2px 12px rgba(0,200,160,0.25), inset 0 1px 0 rgba(255,255,255,0.08)'
                : '0 2px 12px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)',
              cursor: 'pointer',
              padding: '5px 10px',
              borderRadius: '50px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative', outline: 'none',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {appNotifications.filter(n => !n.read).length > 0 && (
              <div style={{
                position: 'absolute', top: '-2px', right: '-2px',
                minWidth: '15px', height: '15px',
                background: '#ef4444', borderRadius: '8px',
                border: '1.5px solid rgba(10,20,40,0.9)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '8px', fontWeight: '800', color: '#fff', padding: '0 2px',
              }}>
                {appNotifications.filter(n => !n.read).length > 9 ? '9+' : appNotifications.filter(n => !n.read).length}
              </div>
            )}
          </button>
        </div>

        {/* Menú */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            style={{
              background: showMenu ? 'rgba(0,180,230,0.30)' : 'rgba(8,18,36,0.88)',
              border: `1px solid ${showMenu ? 'rgba(0,180,230,0.45)' : 'rgba(255,255,255,0.13)'}`,
              boxShadow: showMenu
                ? '0 2px 12px rgba(0,180,230,0.25), inset 0 1px 0 rgba(255,255,255,0.08)'
                : '0 2px 12px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)',
              cursor: 'pointer',
              padding: '5px 10px',
              borderRadius: '50px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              outline: 'none',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        </div>

      </div>
      </div>
    </div>
  );

  // Panel de notificaciones
  const renderNotificationsPanel = () => {
    if (!showNotifications) return null;

    const iconForType = (type: string) => {
      if (type === 'message') return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
      if (type === 'payment') return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>;
      if (type === 'taxi') return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>;
      if (type === 'security') return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
      return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
    };
    const colorForType = (type: string) => {
      if (type === 'message') return '#00b4e6';
      if (type === 'payment') return '#00c8a0';
      if (type === 'taxi') return '#f59e0b';
      if (type === 'security') return '#ef4444';
      if (type === 'bet') return '#a855f7';
      return '#6b7280';
    };

    const unreadCount = appNotifications.filter(n => !n.read).length;

    return (
      <div onClick={() => setShowNotifications(false)}
        style={{ position: 'fixed', inset: 0, zIndex: 1001 }}>
        <div onClick={e => e.stopPropagation()} style={{
          position: 'absolute', top: '58px', right: '8px',
          width: '320px', maxWidth: 'calc(100vw - 16px)',
          background: '#fff', borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          border: '1px solid rgba(0,0,0,0.07)',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px 10px', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#0d0d0d' }}>Notificaciones</span>
              {unreadCount > 0 && (
                <span style={{ fontSize: '11px', fontWeight: '700', background: '#ef4444', color: '#fff', borderRadius: '10px', padding: '1px 7px' }}>{unreadCount}</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {appNotifications.length > 0 && (
                <button onClick={() => setAppNotifications(prev => prev.map(n => ({ ...n, read: true })))}
                  style={{ background: 'none', border: 'none', color: '#00c8a0', fontSize: '11px', fontWeight: '600', cursor: 'pointer', outline: 'none' }}>
                  Marcar todas
                </button>
              )}
              <button onClick={() => setShowNotifications(false)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', outline: 'none', padding: '0', fontSize: '18px', lineHeight: 1 }}>&#x2715;</button>
            </div>
          </div>

          {/* Lista */}
          <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
            {appNotifications.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔔</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>Sin notificaciones</div>
                <div style={{ fontSize: '12px', color: '#9ca3af' }}>Las notificaciones de mensajes, pagos y más aparecerán aquí</div>
              </div>
            ) : appNotifications.map((n, i) => (
              <div key={n.id}
                onClick={async () => {
                  // Eliminar notificación vista inmediatamente
                  setAppNotifications(prev => prev.filter(x => x.id !== n.id));
                  setShowNotifications(false);
                  // Si es de chat, navegar directamente al chat
                  if (n.chatId) {
                    // Buscar el chat en la lista
                    const chat = realChats.find((c: any) => c.id === n.chatId);
                    if (chat) {
                      const isGroup = chat.type === 'group';
                      let name = chat.name || chat.title || '';
                      let avatarUrl = chat.avatar_url || '';
                      if (!isGroup && chat.participants) {
                        const other = chat.participants.find((p: any) => p.user_id?.toString() !== currentUserId.current?.toString());
                        if (other) { name = other.full_name || other.users?.full_name || name; avatarUrl = other.avatar_url || other.users?.avatar_url || avatarUrl; }
                      }
                      setSelectedChat({ id: chat.id, type: chat.type || 'individual', title: name, subtitle: '', time: '', status: 'online', initials: name.slice(0,2).toUpperCase(), color: isGroup ? '#a855f7' : '#00c8a0', avatarUrl, isGroup });
                    }
                    setCurrentView('Mensajería');
                  }
                  if (n.action) n.action();
                }}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '10px',
                  padding: '10px 14px',
                  borderBottom: i < appNotifications.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                  cursor: 'pointer', background: n.read ? 'transparent' : 'rgba(0,180,230,0.04)',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                onMouseLeave={e => e.currentTarget.style.background = n.read ? 'transparent' : 'rgba(0,180,230,0.04)'}
              >
                <div style={{
                  width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
                  background: colorForType(n.type) + '18',
                  border: `1.5px solid ${colorForType(n.type)}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: colorForType(n.type),
                }}>
                  {iconForType(n.type)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: n.read ? '500' : '700', color: '#111827', marginBottom: '2px' }}>{n.title}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.body}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                  <span style={{ fontSize: '10px', color: '#9ca3af' }}>{n.time}</span>
                  {!n.read && <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: colorForType(n.type) }}/>}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          {appNotifications.length > 0 && (
            <div style={{ padding: '8px 14px', borderTop: '1px solid rgba(0,0,0,0.07)', display: 'flex', justifyContent: 'center' }}>
              <button onClick={() => setAppNotifications([])}
                style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '12px', cursor: 'pointer', outline: 'none' }}>
                Limpiar todo
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Iniciar llamada con acceso a camara/microfono

  const startCall = async (type: 'audio' | 'video', contact: any) => {
    // Buscar el user_id real del contacto ? puede estar en distintos campos
    const targetUserId = contact?.user_id?.toString()
      || contact?.participant_id?.toString()
      || contact?.id?.toString()
      || '';

    // Validar que es un UUID real (no un ID de chat demo)
    const isRealUser = targetUserId && targetUserId.includes('-') && targetUserId.length > 20;
    if (isRealUser) {
      try {
        startDialingTone(); // tono de marcaci?n
        await webrtc.startCall(type, targetUserId);
        setActiveCall({ type, contact, status: 'calling' });
        setCallDuration(0); setIsMuted(false); setIsCameraOff(false);
      } catch (err: any) {
        console.error('WebRTC startCall error:', err);
        // Si el error es de cámara/micrófono, avisar al usuario
        const isMediaError = err?.message?.includes('cámara') || err?.message?.includes('micrófono')
          || err?.name === 'NotAllowedError' || err?.name === 'NotFoundError'
          || err?.name === 'NotReadableError' || err?.name === 'OverconstrainedError';
        if (isMediaError) {
          alert('No se pudo acceder a la cámara o micrófono.\nVerifica que los permisos estén concedidos y que ninguna otra app esté usando la cámara.');
          return;
        }
        // Fallback si WebRTC falla por otro motivo — intentar obtener stream local
        try {
          const constraints = type === 'video'
            ? { audio: true, video: { facingMode: 'user' as const } }
            : { audio: true, video: false };
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          setLocalStream(stream);
        } catch {}
        setActiveCall({ type, contact, status: 'calling' });
        setCallDuration(0); setIsMuted(false); setIsCameraOff(false);
        // Solo pasar a 'connected' si la llamada sigue activa (no fue colgada)
        setTimeout(() => setActiveCall(prev => prev && prev.contact?.id === contact?.id ? { ...prev, status: 'connected' } : prev), 2000);
      }
    } else {
      // Fallback simulado para chats demo
      try {
        const constraints = type === 'video'
          ? { audio: true, video: { facingMode: 'user' as const } }
          : { audio: true, video: false };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        setLocalStream(stream);
      } catch {}
      setActiveCall({ type, contact, status: 'calling' });
      setCallDuration(0); setIsMuted(false); setIsCameraOff(false);
      // Solo pasar a 'connected' si la llamada sigue activa (no fue colgada)
      setTimeout(() => setActiveCall(prev => prev && prev.contact?.id === contact?.id ? { ...prev, status: 'connected' } : prev), 2000);
    }
  };

  // Añadir registro de llamada en el chat
  const addCallRecord = React.useCallback((type: 'audio' | 'video', status: 'completed' | 'missed' | 'outgoing', duration: number, contact: any) => {
    const chatId = selectedChat?.id?.toString() || '';
    if (!chatId) return;
    const key = chatId;
    const t = new Date();
    const time = `${t.getHours().toString().padStart(2,'0')}:${t.getMinutes().toString().padStart(2,'0')}`;
    const durationStr = duration > 0 ? `  -  ${String(Math.floor(duration/60)).padStart(2,'0')}:${String(duration%60).padStart(2,'0')}` : '';
    const prefix = type === 'video' ? 'Video' : '';
    const statusText = status === 'missed' ? `${prefix}Llamada perdida` : status === 'outgoing' ? `${prefix}Llamada saliente${durationStr}` : `${prefix}Llamada recibida${durationStr}`;
    const msgId = `call_${Date.now()}`;
    const callMsg: any = {
      id: msgId,
      from: status === 'missed' ? 'them' : 'me',
      text: statusText,
      time,
      status: 'delivered',
      type: 'call',
      callType: type,
      callStatus: status,
      callDuration: duration,
      contactId: contact?.user_id || contact?.id,
      contactName: contact?.title || contact?.name || 'Contacto',
    };
    setChatMessages(prev => ({ ...prev, [key]: [...(prev[key] || []), callMsg] }));
    // Enviar al backend como mensaje de texto
    if (chatId.length > 10) {
      chatAPI.sendMessage(chatId, { 
        text: statusText, 
        type: 'text',
      } as any).catch(() => {});
    }
  }, [selectedChat]);

  const endCall = () => {
    stopRingtone(); stopDialingTone(); playCallEnded(); vibrate([100, 50, 100]);
    if (activeCall) {
      const status = activeCall.status === 'connected' ? 'completed' : 'outgoing';
      addCallRecord(activeCall.type, status, callDuration, activeCall.contact);
    }
    try { webrtc.endCall(); } catch (e) { console.warn('endCall error:', e); }
    // Limpiar todos los streams y estado completamente
    if (localStream) { 
      localStream.getTracks().forEach(t => { 
        try { t.stop(); } catch {} 
      }); 
      setLocalStream(null); 
    }
    if (webrtc.localStream) {
      webrtc.localStream.getTracks().forEach(t => {
        try { t.stop(); } catch {}
      });
    }
    // Limpiar video elements
    if (remoteVideoRef.current) { 
      remoteVideoRef.current.srcObject = null; 
      remoteVideoRef.current.pause();
    }
    if (localVideoRef.current) { 
      localVideoRef.current.srcObject = null;
      localVideoRef.current.pause();
    }
    // Limpiar audio element
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
      remoteAudioRef.current.pause();
    }
    // Forzar cierre inmediato de la ventana de llamada
    setActiveCall(null); 
    setCallMinimized(false);
    setCallDuration(0); 
    setIsMuted(false); 
    setIsCameraOff(false);
  };

  // Temporizador de llamada
  React.useEffect(() => {
    if (activeCall?.status === 'connected') {
      const timer = setInterval(() => setCallDuration(d => d + 1), 1000);
      return () => clearInterval(timer);
    }
  }, [activeCall?.status]);

  const formatCallDuration = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // Pantalla de llamada activa
  // Refs estables para los elementos de video/audio (evitan parpadeo)
  const remoteVideoRef = React.useRef<HTMLVideoElement | null>(null);
  const localVideoRef = React.useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = React.useRef<HTMLAudioElement | null>(null);

  // Callback refs que asignan el stream en cuanto el elemento se monta
  const setRemoteVideoRef = React.useCallback((el: HTMLVideoElement | null) => {
    remoteVideoRef.current = el;
    if (el && webrtc.remoteStream) {
      el.srcObject = webrtc.remoteStream;
      el.play().catch(() => {});
    }
  }, [webrtc.remoteStream]);

  const setLocalVideoRef = React.useCallback((el: HTMLVideoElement | null) => {
    localVideoRef.current = el;
    const s = webrtc.localStream || localStream;
    if (el && s) {
      el.srcObject = s;
      el.play().catch(() => {});
    }
  }, [webrtc.localStream, localStream]);

  // Sincronizar streams cuando cambian (para cuando el elemento ya est montado)
  React.useEffect(() => {
    if (remoteVideoRef.current && webrtc.remoteStream) {
      remoteVideoRef.current.srcObject = webrtc.remoteStream;
      remoteVideoRef.current.play().catch(() => {});
    }
  }, [webrtc.remoteStream]);

  // Sincronizar audio remoto cuando llega el stream (fix: audio no suena tras reconexión)
  React.useEffect(() => {
    if (remoteAudioRef.current && webrtc.remoteStream) {
      remoteAudioRef.current.srcObject = webrtc.remoteStream;
      remoteAudioRef.current.play().catch(() => {});
    }
  }, [webrtc.remoteStream]);

  React.useEffect(() => {
    const s = webrtc.localStream || localStream;
    if (localVideoRef.current && s) {
      localVideoRef.current.srcObject = s;
      localVideoRef.current.play().catch(() => {});
    }
  }, [webrtc.localStream, localStream]);

  const renderActiveCall = () => {
    if (!activeCall) return null;
    const { type, contact, status } = activeCall;
    const color = contact?.color || '#00c8a0';
    const rawName = contact?.users?.full_name || contact?.full_name || contact?.title || contact?.name || contact?.subtitle || '';
    const name = rawName && !rawName.match(/^[0-9a-f-]{20,}$/i) ? rawName : 'Contacto';
    const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || 'EG';

    // Floating mini widget when minimized
    if (callMinimized) {
      return (
        <div onClick={() => setCallMinimized(false)} style={{ position: 'fixed', bottom: '90px', right: '16px', zIndex: 2000, background: 'linear-gradient(135deg,#1a1a2e,#0f3460)', borderRadius: '16px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.15)', minWidth: '160px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: `${color}30`, border: `2px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', color, flexShrink: 0 }}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>{status === 'connected' ? formatCallDuration(callDuration) : type === 'video' ? '📹 Video' : '📞 Voz'}</div>
          </div>
          <button onClick={(e) => { e.stopPropagation(); endCall(); }} style={{ background: '#ef4444', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.42 19.42 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
          </button>
        </div>
      );
    }

    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: type === 'video' ? '#000' : 'linear-gradient(160deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        {/* Botón minimizar — bajar la llamada y seguir chateando */}
        <button onClick={() => setCallMinimized(true)} style={{ position: 'absolute', top: 'calc(16px + env(safe-area-inset-top, 44px))', left: '16px', zIndex: 20, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '20px', padding: '8px 14px', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', backdropFilter: 'blur(10px)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="18 15 12 9 6 15"/></svg>
          Minimizar
        </button>
        {/* Video remoto (fondo) */}
        {type === 'video' && (
          <div style={{ position: 'absolute', inset: 0, background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <video
              ref={setRemoteVideoRef}
              autoPlay playsInline
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: webrtc.remoteStream ? 'block' : 'none' }}
            />
            {!webrtc.remoteStream && (
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: `${color}30`, border: `3px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: '700', color }}>
                {initials}
              </div>
            )}
          </div>
        )}

        {/* Audio remoto - Elemento oculto para reproducción de audio */}
        <audio
          ref={(el) => {
            remoteAudioRef.current = el;
            // Inyectar en el hook WebRTC para que ontrack también lo use
            webrtc.setRemoteAudioElement(el);
            if (el && webrtc.remoteStream) {
              el.srcObject = webrtc.remoteStream;
              el.play().catch(() => {});
            }
          }}
          autoPlay
          playsInline
          style={{ display: 'none' }}
        />

        {/* Video local (esquina) */}
        {type === 'video' && !isCameraOff && (
          <div style={{ position: 'absolute', top: '80px', right: '16px', width: '90px', height: '120px', borderRadius: '12px', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.3)', zIndex: 10, background: '#222' }}>
            <video
              ref={setLocalVideoRef}
              autoPlay muted playsInline
              style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
            />
          </div>
        )}

        {/* Info contacto */}
        <div style={{ marginTop: '80px', textAlign: 'center', zIndex: 5 }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: `${color}30`, border: `3px solid ${color}60`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: '700', color, margin: '0 auto 14px' }}>
            {initials}
          </div>
          <div style={{ fontSize: '22px', fontWeight: '700', color: '#ffffff', marginBottom: '6px' }}>{name}</div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)' }}>
            {status === 'calling' ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00e5ff', display: 'inline-block', animation: 'pulse 1s infinite' }} />
                Llamando...
              </span>
            ) : formatCallDuration(callDuration)}
          </div>
          <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
            {type === 'video' ? 'Videollamada' : 'Llamada de voz'}
          </div>
        </div>

        {/* Controles */}
        <div style={{ position: 'absolute', bottom: '60px', width: '100%', display: 'flex', justifyContent: 'center', gap: '28px', zIndex: 5, paddingLeft: '16px', paddingRight: '16px' }}>
          {/* Silenciar */}
          <button onClick={() => {
            webrtc.toggleMute();
            setIsMuted(m => !m);
          }} title={isMuted ? "Activar micrófono" : "Silenciar"} style={{ width: '60px', height: '60px', borderRadius: '50%', background: isMuted ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.15)', border: isMuted ? '1.5px solid rgba(239,68,68,0.5)' : '1.5px solid rgba(255,255,255,0.2)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', outline: 'none', transition: 'all 0.2s ease', backdropFilter: 'blur(12px)', flexDirection: 'column', gap: '4px' }}>
            {isMuted ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="1" y1="1" x2="23" y2="23"/>
                <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/>
                <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            )}
          </button>

          {/* Colgar - Botón Principal */}
          <button onClick={endCall} title="Terminar llamada" style={{ width: '68px', height: '68px', borderRadius: '50%', background: 'linear-gradient(135deg, #ff3b30, #c0392b)', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', outline: 'none', boxShadow: '0 6px 24px rgba(255,59,48,0.5)', transition: 'all 0.2s ease' }}>
            {/* Ícono teléfono colgado - rotado 135° estilo moderno */}
            <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" transform="rotate(135 12 12)"/>
            </svg>
          </button>

          {/* Camara (solo videollamada) */}
          {type === 'video' && (
            <button onClick={() => {
              const newCamOff = !isCameraOff;
              setIsCameraOff(newCamOff);
              // Aplicar al stream local (demo) y al stream WebRTC real
              const stream = webrtc.localStream || localStream;
              stream?.getVideoTracks().forEach(t => { t.enabled = !newCamOff; });
            }} title={isCameraOff ? "Activar cámara" : "Desactivar cámara"} style={{ width: '60px', height: '60px', borderRadius: '50%', background: isCameraOff ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.15)', border: isCameraOff ? '1.5px solid rgba(239,68,68,0.5)' : '1.5px solid rgba(255,255,255,0.2)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', outline: 'none', transition: 'all 0.2s ease', backdropFilter: 'blur(12px)' }}>
              {isCameraOff ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="1" y1="1" x2="23" y2="23"/>
                  <path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34m-7.72-2.06a4 4 0 1 1-5.56-5.56"/>
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="23 7 16 12 23 17 23 7"/>
                  <rect x="1" y="5" width="15" height="14" rx="2"/>
                </svg>
              )}
            </button>
          )}

          {/* Altavoz (solo audio) */}
          {type === 'audio' && (
            <button onClick={() => {
              // Toggle speaker
            }} title="Altavoz" style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.2)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', outline: 'none', transition: 'all 0.2s ease', backdropFilter: 'blur(12px)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  };

  // Modal de edician de hora
  const renderTimeModal = () => {
    if (!showTimeModal) return null;
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        onClick={() => setShowTimeModal(false)}>
        <div onClick={e => e.stopPropagation()} style={{ background: 'rgba(255,255,255,0.35)', backdropFilter: 'blur(28px) saturate(200%)', WebkitBackdropFilter: 'blur(28px) saturate(200%)', borderRadius: '16px', padding: '20px', width: '260px', boxShadow: '0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.8)', border: '1.5px solid rgba(255,255,255,0.6)' }}>
          <div style={{ fontSize: '14px', fontWeight: '700', color: '#0d0d0d', marginBottom: '16px', textAlign: 'center' }}>Ajustar Hora</div>
          <div style={{ textAlign: 'center', fontSize: '28px', fontWeight: '800', color: '#0d0d0d', marginBottom: '16px', letterSpacing: '-0.5px' }}>
            {isManualTime ? manualTime : currentTime}
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>
              Hora personalizada
            </label>
            <input
              type="time"
              value={editTime}
              onChange={e => setEditTime(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1.5px solid rgba(0,0,0,0.15)', fontSize: '16px', fontWeight: '600', color: '#0d0d0d', outline: 'none', boxSizing: 'border-box' as any, background: 'rgba(249,250,251,0.88)' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => { setIsManualTime(false); setManualTime(''); setShowTimeModal(false); }}
              style={{ flex: 1, padding: '9px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', background: 'rgba(243,244,246,0.85)', color: '#374151', fontSize: '12px', fontWeight: '600', cursor: 'pointer', outline: 'none' }}
            >
              Hora real
            </button>
            <button
              onClick={() => {
                if (editTime) {
                  setManualTime(editTime);
                  setIsManualTime(true);
                }
                setShowTimeModal(false);
              }}
              style={{ flex: 1, padding: '9px', borderRadius: '8px', border: 'none', background: 'linear-gradient(90deg, #00e5ff, #1e90ff)', color: '#ffffff', fontSize: '12px', fontWeight: '700', cursor: 'pointer', outline: 'none' }}
            >
              Aplicar
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Vista completa de perfil
  const renderProfileView = () => {
    if (!showProfileView) return null;

    // QR real con link para añadir contacto directamente
    const userId = userProfile.id || currentUserId.current || '';
    const qrLink = userId
      ? `https://egchat-v2.vercel.app/add?phone=${encodeURIComponent(userProfile.phone)}&name=${encodeURIComponent(userProfile.name)}&id=${userId}`
      : `https://egchat-v2.vercel.app/add?phone=${encodeURIComponent(userProfile.phone)}&name=${encodeURIComponent(userProfile.name)}`;

    const fields = [
      { key: 'name', label: 'Nombre completo', icon: 'contactos' },
      { key: 'email', label: 'Email', icon: 'message-square' },
      { key: 'phone', label: 'Teléfono', icon: 'phone' },
      { key: 'country', label: 'País', icon: 'world' },
      { key: 'city', label: 'Ciudad', icon: 'building' },
      { key: 'address', label: 'dirección', icon: 'briefcase' },
    ];

    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end' }}
        onClick={() => { setShowProfileView(false); setIsEditingProfile(false); setShowProfileQR(false); }}>
        <div onClick={e => e.stopPropagation()} style={{
          width: '100%', maxHeight: '92vh', background: '#FFFFFF',
          borderRadius: '20px 20px 0 0', border: '1px solid rgba(0,0,0,0.07)',
          display: 'flex', flexDirection: 'column', }}>
          {/* Handle — toca para cerrar */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px', cursor: 'pointer' }}
            onClick={() => { setShowProfileView(false); setIsEditingProfile(false); setShowProfileQR(false); }}>
            <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: '#e5e7eb' }} />
          </div>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 16px 12px' }}>
            <span style={{ fontSize: '15px', fontWeight: '700', color: '#0d0d0d' }}>Mi Perfil</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              {!isEditingProfile ? (
                <>
                  <button onClick={() => setShowProfileQR(!showProfileQR)}
                    style={{ background: showProfileQR ? 'rgba(0,180,230,0.2)' : '#f5f6f7', border: `1px solid ${showProfileQR ? 'rgba(0,180,230,0.4)' : '#f3f4f6'}`, borderRadius: '8px', padding: '6px 10px', color: showProfileQR ? '#00b4e6' : '#6b7280', fontSize: '14px', cursor: 'pointer', outline: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                    QR
                  </button>
                  <button onClick={() => { setEditedProfile({ ...userProfile }); setIsEditingProfile(true); setShowProfileQR(false); }}
                    style={{ background: 'rgba(0,200,160,0.15)', border: '1px solid rgba(0,200,160,0.3)', borderRadius: '8px', padding: '6px 10px', color: '#00c8a0', fontSize: '14px', cursor: 'pointer', outline: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    Editar
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => { setIsEditingProfile(false); setEditedProfile(null); }}
                    style={{ background: 'rgba(243,244,246,0.85)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '8px', padding: '6px 10px', color: '#374151', fontSize: '14px', cursor: 'pointer', outline: 'none' }}>
                    Cancelar
                  </button>
                  <button onClick={() => { setUserProfile({ ...editedProfile }); setIsEditingProfile(false); setEditedProfile(null); }}
                    style={{ background: 'rgba(0,200,160,0.2)', border: '1px solid rgba(0,200,160,0.4)', borderRadius: '8px', padding: '6px 10px', color: '#00c8a0', fontSize: '14px', fontWeight: '600', cursor: 'pointer', outline: 'none' }}>
                    Guardar
                  </button>
                </>
              )}
              <button onClick={() => { setShowProfileView(false); setIsEditingProfile(false); setShowProfileQR(false); }}
                style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', outline: 'none', fontSize: '18px', padding: '0 4px' }}></button>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 24px' }}>
            {/* Avatar + info basica */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px', padding: '14px', background: 'rgba(250,250,250,0.88)', borderRadius: '14px', border: '1px solid rgba(0,0,0,0.07)' }}>
              <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(0,200,160,0.3), rgba(0,180,230,0.3))', border: '3px solid rgba(0,200,160,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: '700', color: '#00c8a0', flexShrink: 0, overflow: 'hidden', cursor: 'pointer' }}
                onClick={() => { const i=document.createElement('input');i.type='file';i.accept='image/*';i.onchange=()=>{const f=i.files?.[0];if(f){const r=new FileReader();r.onload=e=>{setAvatarCropUrl(e.target?.result as string);};r.readAsDataURL(f);}};i.click(); }}>
                {(userProfile as any).avatarUrl ? <img src={(userProfile as any).avatarUrl} style={{width:'100%',height:'100%',objectFit:'cover'}} alt=""/> : userProfile.avatar}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#0d0d0d', marginBottom: '4px' }}>{userProfile.name}</div>
                <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '6px', fontFamily: 'monospace' }}>ID: {userProfile.id ? userProfile.id.slice(0,8).toUpperCase() : '?'}</div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#00c8a0', background: 'rgba(0,200,160,0.15)', border: '1px solid rgba(0,200,160,0.3)', borderRadius: '10px', padding: '2px 8px' }}>
                    ✓ Verificado
                  </span>
                  <span style={{ fontSize: '13px', color: '#6b7280', background: 'rgba(249,250,251,0.88)', borderRadius: '10px', padding: '2px 8px' }}>
                    Desde {userProfile.joinDate}
                  </span>
                </div>
              </div>
            </div>

            {/* QR Panel */}
            {showProfileQR && (
              <div style={{ background: 'rgba(250,250,250,0.88)', borderRadius: '14px', border: '1px solid rgba(0,180,230,0.2)', padding: '16px', marginBottom: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Escanea para añadirme
                </div>
                <div style={{ display: 'inline-block', padding: '10px', background: 'white', borderRadius: '12px', marginBottom: '10px', position: 'relative' }}>
                  <QRCodeSVG
                    value={qrLink}
                    size={160}
                    level="M"
                    imageSettings={{
                      src: (userProfile as any).avatarUrl || '',
                      height: 32,
                      width: 32,
                      excavate: true,
                    }}
                  />
                  {/* Avatar del usuario en el centro del QR */}
                  <div style={{
                    position: 'absolute',
                    top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '32px', height: '32px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #00b4e6, #00c8a0)',
                    border: '2.5px solid white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', fontWeight: '700', color: '#0d0d0d',
                    boxShadow: '0 1px 6px rgba(0,0,0,0.25)',
                    flexShrink: 0,
                    letterSpacing: '0.5px'
                  }}>
                    {userProfile.name.split(' ').map((w: string) => w[0]).join('').slice(0,2).toUpperCase()}
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>
                  Vlido para EGCHAT a {userProfile.id}
                </div>
              </div>
            )}

            {/* Campos del perfil */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>informacion personal</div>
              {fields.map(f => (
                <div key={f.key} style={{ background: 'rgba(250,250,250,0.88)', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.07)', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ color: '#6b7280', flexShrink: 0 }}>{renderIcon(f.icon, 14)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{f.label}</div>
                    {isEditingProfile ? (
                      <input
                        value={editedProfile?.[f.key] || ''}
                        onChange={e => setEditedProfile({ ...editedProfile, [f.key]: e.target.value })}
                        style={{ width: '100%', background: 'rgba(243,244,246,0.85)', border: '1px solid rgba(0,200,160,0.3)', borderRadius: '6px', padding: '5px 8px', color: '#0d0d0d', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                      />
                    ) : (
                      <div style={{ fontSize: '13px', color: '#0d0d0d', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {(userProfile as any)[f.key]}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Seguridad */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Seguridad</div>
              {[
                { label: 'Autenticación 2FA', value: userProfile.twoFactorEnabled, key: 'twoFactorEnabled', color: '#00c8a0' },
                { label: 'Notificaciones', value: userProfile.notificationsEnabled, key: 'notificationsEnabled', color: '#00b4e6' },
              ].map(item => (
                <div key={item.key} style={{ background: 'rgba(250,250,250,0.88)', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.07)', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#1f2937' }}>{item.label}</span>
                  <button onClick={() => setUserProfile({ ...userProfile, [item.key]: !item.value })}
                    style={{ width: '40px', height: '22px', borderRadius: '11px', background: item.value ? `${item.color}40` : '#f3f4f6', border: `1px solid ${item.value ? item.color : '#e5e7eb'}`, cursor: 'pointer', outline: 'none', position: 'relative', transition: 'all 0.2s' }}>
                    <div style={{ position: 'absolute', top: '2px', left: item.value ? '20px' : '2px', width: '16px', height: '16px', borderRadius: '50%', background: item.value ? item.color : '#d1d5db', transition: 'left 0.2s' }} />
                  </button>
                </div>
              ))}
            </div>

            {/* Actualizar app / limpiar caché */}
            <button onClick={async () => {
              try {
                if ('serviceWorker' in navigator) {
                  const regs = await navigator.serviceWorker.getRegistrations();
                  await Promise.all(regs.map(r => r.unregister()));
                }
                if ('caches' in window) {
                  const keys = await caches.keys();
                  await Promise.all(keys.map(k => caches.delete(k)));
                }
                window.location.reload();
              } catch { window.location.reload(); }
            }} style={{ width: '100%', background: 'rgba(0,200,160,0.08)', border: '1px solid rgba(0,200,160,0.25)', borderRadius: '10px', padding: '11px', color: '#00c8a0', fontSize: '12px', fontWeight: '600', cursor: 'pointer', outline: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
              Actualizar app (limpiar caché)
            </button>

            {/* Cerrar sesión */}
            <button onClick={() => {
              if(window.confirm('Cerrar sesión?')) {
                authAPI.logout().catch(()=>{});
                localStorage.removeItem('token');
                localStorage.removeItem('egchat_token_backup');
                setShowProfileView(false);
                setIsAuthenticated(false);
                setCurrentView('home');
              }
            }} style={{ width: '100%', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px', padding: '11px', color: '#ef4444', fontSize: '12px', fontWeight: '600', cursor: 'pointer', outline: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Panel de men lateral
  const renderMenuPanel = () => {
    if (!showMenu) return null;
    const menuItems = [
      { id:'perfil',          label:'Mi Perfil',            sub:'Ver y editar tu perfil',       icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>, color:'#374151' },
      { id:'nuevo-contacto',  label:'Nuevo contacto',       sub:'Añadir a tu lista',            icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>, color:'#374151' },
      { id:'crear-grupo',     label:'Crear grupo',          sub:'Nuevo grupo de chat',          icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, color:'#374151' },
      { id:'contactos',       label:'Mis contactos',        sub:'Ver todos tus contactos',      icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, color:'#374151' },
      { id:'mensajes-arch',   label:'Mensajes archivados',  sub:'Chats archivados',             icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>, color:'#374151' },
      { id:'notificaciones',  label:'Notificaciones',       sub:'Gestionar alertas',            icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>, color:'#374151' },
      { id:'privacidad',      label:'Privacidad',           sub:'Configurar privacidad',        icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>, color:'#374151' },
      { id:'ajustes',         label:'Ajustes',              sub:'configuración de la app',      icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>, color:'#374151' },
      { id:'ayuda',           label:'Ayuda y soporte',      sub:'Centro de ayuda',              icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>, color:'#374151' },
      { id:'salir',           label:'Cerrar sesión',        sub:'Salir de tu cuenta',           icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>, color:'#EF4444' },
    ];
    return (
      <>
        {/* Overlay para cerrar al tocar fuera */}
        <div style={{ position:'fixed', inset:0, zIndex:1000 }} onClick={() => setShowMenu(false)} />
        <div style={{ position:'fixed', top:'56px', right:'8px', width:'230px', background:'rgba(255,255,255,0.35)', backdropFilter:'blur(28px) saturate(200%)', WebkitBackdropFilter:'blur(28px) saturate(200%)', borderRadius:'16px', border:'1.5px solid rgba(255,255,255,0.6)', boxShadow:'0 8px 32px rgba(0,0,0,0.15)', zIndex:1001, overflow:'hidden' }}>
        {/* Header del men  solo avatar, sin nombre */}
        <div style={{ padding:'12px 14px 10px', borderBottom:'1px solid rgba(0,0,0,0.06)', display:'flex', alignItems:'center', gap:'10px' }}>
          <div style={{ width:'36px', height:'36px', borderRadius:'50%', background:'linear-gradient(135deg,#00c8a0,#00b4e6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', fontWeight:'800', color:'#fff', flexShrink:0, overflow:'hidden' }}>
            {userProfile.avatarUrl
              ? <img src={userProfile.avatarUrl} alt={userProfile.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
              : userProfile.name.split(' ').map((w:string)=>w[0]).join('').slice(0,2).toUpperCase()
            }
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:'12px', fontWeight:'600', color:'#111827', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{userProfile.name}</div>
            <div style={{ fontSize:'10px', color:'#00c8a0', fontWeight:'600' }}>● En línea</div>
          </div>
        </div>
        {/* Items */}
        {menuItems.map((item, i) => (
          <button key={item.id} onClick={() => {
            if (item.id==='perfil') { setShowProfileView(true); }
            else if (item.id==='nuevo-contacto') { setShowAddContact(true); }
            else if (item.id==='crear-grupo') { setShowCreateGroup(true); setGroupName(''); setGroupMembers([]); }
            else if (item.id==='contactos') { setShowMenu(false); setCurrentView('contactos'); }
            else if (item.id==='mensajes-arch') { setCurrentView('Mensajería'); setMessageFilter('all'); }
            else if (item.id==='notificaciones') { setShowNotifications(true); }
            else if (item.id==='privacidad') { setCurrentView('ajustes'); setCurrentSettingsTab('perfil'); }
            else if (item.id==='ajustes') { setCurrentView('ajustes'); }
            else if (item.id==='ayuda') { setCurrentView('ajustes'); setCurrentSettingsTab('ayuda'); }
            else if (item.id==='salir') {
              if(window.confirm('Cerrar sesión?')) {
                authAPI.logout().catch(()=>{});
                localStorage.removeItem('token');
                localStorage.removeItem('egchat_token_backup');
                setIsAuthenticated(false);
                setCurrentView('home');
              }
            }
            setShowMenu(false);
          }}
            style={{ width:'100%', padding:'10px 14px', background:'none', border:'none', borderBottom: i<menuItems.length-1?'1px solid rgba(0,0,0,0.05)':'none', cursor:'pointer', display:'flex', alignItems:'center', gap:'12px', textAlign:'left', outline:'none' }}
            onMouseEnter={e=>{e.currentTarget.style.background='rgba(0,0,0,0.04)';}}
            onMouseLeave={e=>{e.currentTarget.style.background='none';}}>
            <span style={{ color:item.color, flexShrink:0, display:'flex' }}>{item.icon}</span>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:'13px', fontWeight:'500', color:item.id==='salir'?'#EF4444':'#111827', lineHeight:1.2 }}>{item.label}</div>
              <div style={{ fontSize:'10px', color:'#9CA3AF', marginTop:'1px' }}>{item.sub}</div>
            </div>
          </button>
        ))}
      </div>
      </>
    );
  };

  // Modal: Añadir contacto
  const [repertorioUsers, setRepertorioUsers] = React.useState<any[]>([]);
  const [repertorioSearch, setRepertorioSearch] = React.useState('');
  const [repertorioSelected, setRepertorioSelected] = React.useState<Set<string>>(new Set());
  const [repertorioLoading, setRepertorioLoading] = React.useState(false);
  const [repertorioAdding, setRepertorioAdding] = React.useState(false);
  // Contactos del teléfono enriquecidos con info de EGCHAT
  const [deviceContacts, setDeviceContacts] = React.useState<any[]>([]);
  const [deviceContactsLoaded, setDeviceContactsLoaded] = React.useState(false);

  const loadRepertorioUsers = React.useCallback(async () => {
    try {
      setRepertorioLoading(true);

      // 1. Intentar leer contactos del dispositivo (API de Contactos del navegador - Chrome Android)
      let phoneContacts: any[] = [];
      if ('contacts' in navigator && 'ContactsManager' in window) {
        try {
          const raw = await (navigator as any).contacts.select(['name', 'tel'], { multiple: true });
          phoneContacts = (raw || []).flatMap((c: any) =>
            (c.tel || []).map((tel: string) => ({
              name: (c.name?.[0] || tel).trim(),
              phone: tel.replace(/\s+/g, '').trim(),
            }))
          ).filter((c: any) => c.phone);
        } catch {
          // Usuario canceló o no hay permiso — continuar con búsqueda en EGCHAT
        }
      }

      // 2. Obtener todos los usuarios de EGCHAT para cruzar
      const egchatUsers = await chatAPI.searchUsers('');
      const existingIds = new Set(allContacts.map((c: any) => (c.contact_user_id || c.id)?.toString()));
      const myId = userProfile.id || currentUserId.current?.toString() || '';

      // 3. Mapa de teléfonos EGCHAT normalizado
      const egchatByPhone = new Map<string, any>();
      (egchatUsers || []).forEach((u: any) => {
        if (!u.phone) return;
        const norm = u.phone.replace(/\s+/g, '').replace(/^\+/, '');
        egchatByPhone.set(norm, u);
        egchatByPhone.set('+' + norm, u);
        egchatByPhone.set(u.phone, u);
      });

      if (phoneContacts.length > 0) {
        // Cruzar contactos del dispositivo con EGCHAT
        const enriched = phoneContacts.map((c: any) => {
          const normPhone = c.phone.replace(/\s+/g, '').replace(/^\+/, '');
          const egUser = egchatByPhone.get(c.phone) || egchatByPhone.get(normPhone) || egchatByPhone.get('+' + normPhone);
          return {
            id: egUser?.id?.toString() || null,
            full_name: c.name,
            phone: c.phone,
            avatar_url: egUser?.avatar_url || '',
            onEgchat: !!egUser && egUser.id?.toString() !== myId,
            alreadyContact: egUser ? existingIds.has(egUser.id?.toString()) : false,
          };
        }).filter((c: any) => c.id !== myId);

        // Ordenar: primero los que tienen EGCHAT y no son contactos aún
        enriched.sort((a: any, b: any) => {
          if (a.onEgchat && !a.alreadyContact && !(b.onEgchat && !b.alreadyContact)) return -1;
          if (b.onEgchat && !b.alreadyContact && !(a.onEgchat && !a.alreadyContact)) return 1;
          if (a.onEgchat && !b.onEgchat) return -1;
          if (b.onEgchat && !a.onEgchat) return 1;
          return a.full_name.localeCompare(b.full_name);
        });

        setDeviceContacts(enriched);
        setDeviceContactsLoaded(true);
        setRepertorioUsers(enriched.filter((c: any) => c.onEgchat && !c.alreadyContact));
      } else {
        // Sin API de contactos del dispositivo — mostrar usuarios de EGCHAT
        const filtered = (egchatUsers || [])
          .filter((u: any) => u.id?.toString() !== myId && !existingIds.has(u.id?.toString()))
          .map((u: any) => ({ id: u.id?.toString() || '', full_name: u.full_name || 'Usuario', phone: u.phone || '', avatar_url: u.avatar_url || '', onEgchat: true, alreadyContact: false }));
        setDeviceContacts(filtered);
        setDeviceContactsLoaded(true);
        setRepertorioUsers(filtered);
      }
    } catch {
      setRepertorioUsers([]);
      setDeviceContacts([]);
    } finally {
      setRepertorioLoading(false);
    }
  }, [allContacts, userProfile.id]);

  const renderAddContactModal = () => {
    if (!showAddContact) return null;

    const filteredRep = repertorioUsers.filter(u =>
      u.full_name.toLowerCase().includes(repertorioSearch.toLowerCase()) || u.phone.includes(repertorioSearch)
    );

    const handleAddRepertorio = async () => {
      if (repertorioSelected.size === 0) return;
      try {
        setRepertorioAdding(true);
        await Promise.all(Array.from(repertorioSelected).map(id => contactsAPI.add(id)));
        showToast(`✓ ${repertorioSelected.size} contacto${repertorioSelected.size > 1 ? 's' : ''} añadido${repertorioSelected.size > 1 ? 's' : ''}`, 'success');
        setRepertorioSelected(new Set());
        setShowAddContact(false);
        await loadContacts();
      } catch { showToast('Error al añadir contactos', 'error'); }
      finally { setRepertorioAdding(false); }
    };

    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-end' }}
        onClick={() => setShowAddContact(false)}>
        <div onClick={e => e.stopPropagation()} style={{ width: '100%', background: '#FFFFFF', borderRadius: '18px 18px 0 0', border: '1px solid rgba(0,0,0,0.07)', padding: '20px 16px 28px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
          <div style={{ width: '36px', height: '3px', background: '#e5e7eb', borderRadius: '2px', margin: '0 auto 16px' }}/>
          <div style={{ fontSize: '14px', fontWeight: '700', color: '#0d0d0d', marginBottom: '14px' }}>Añadir contacto</div>

          {/* Tabs */}
          <div style={{ display: 'flex', background: 'rgba(249,250,251,0.88)', borderRadius: '8px', padding: '3px', marginBottom: '16px', flexShrink: 0 }}>
            {(['phone','qr','repertorio'] as const).map(tab => {
              const active = addContactTab === tab;
              return (
                <button key={tab} onClick={() => {
                  setAddContactTab(tab as any);
                  if (tab === 'repertorio' && repertorioUsers.length === 0) loadRepertorioUsers();
                }}
                  style={{ flex: 1, padding: '8px 4px', background: active ? '#fff' : 'none', border: 'none', borderRadius: '6px', color: active ? '#00b4e6' : '#9ca3af', fontSize: '12px', fontWeight: '600', cursor: 'pointer', outline: 'none', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', boxShadow: active ? '0 1px 4px rgba(0,0,0,0.1)' : 'none' }}>
                  {tab === 'phone' && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6.29 6.29l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                  )}
                  {tab === 'qr' && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                      <path d="M14 14h3v3h-3z"/><path d="M17 17h4"/><path d="M17 21v-4"/>
                    </svg>
                  )}
                  {tab === 'repertorio' && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  )}
                  {tab === 'phone' ? 'Teléfono' : tab === 'qr' ? 'QR' : 'Repertorio'}
                </button>
              );
            })}
          </div>

          {/* Tab: Teléfono */}
          {addContactTab === 'phone' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input value={newContactName} onChange={e => setNewContactName(e.target.value)}
                placeholder="Nombre del contacto"
                style={{ background: 'rgba(249,250,251,0.88)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '8px', padding: '10px 12px', color: '#0d0d0d', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }}/>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ background: 'rgba(249,250,251,0.88)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '8px', padding: '10px 12px', color: '#6b7280', fontSize: '13px', flexShrink: 0 }}>+240</div>
                <input value={newContactPhone} onChange={e => setNewContactPhone(e.target.value)}
                  placeholder="numero de telefono" type="tel"
                  style={{ flex: 1, background: 'rgba(249,250,251,0.88)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '8px', padding: '10px 12px', color: '#0d0d0d', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }}/>
              </div>
              <button onClick={async () => {
                if (newContactPhone.trim()) {
                  try {
                    const phone = newContactPhone.startsWith('+') ? newContactPhone : '+240' + newContactPhone.replace(/\D/g, '').slice(-9);
                    await contactsAPI.add(undefined, phone, newContactName.trim() || undefined);
                    showToast('✓ Contacto añadido', 'success');
                    setShowAddContact(false); setNewContactPhone(''); setNewContactName('');
                    await loadContacts();
                  } catch (err: any) {
                    const msg = err?.message || '';
                    if (msg.includes('no encontrado') || msg.includes('404')) showToast('No se encontró ningún usuario con ese número.', 'error');
                    else if (msg.includes('ya existe') || msg.includes('409') || msg.includes('duplicate')) { showToast('Este contacto ya está en tu lista.', 'info'); setNewContactPhone(''); setNewContactName(''); setShowAddContact(false); }
                    else showToast(msg || 'Error al añadir contacto.', 'error');
                  }
                }
              }}
                style={{ background: '#00b4e6', border: 'none', borderRadius: '10px', padding: '12px', color: 'white', fontSize: '13px', fontWeight: '700', cursor: 'pointer', outline: 'none', marginTop: '4px' }}>
                Añadir contacto
              </button>
            </div>
          )}

          {/* Tab: QR */}
          {addContactTab === 'qr' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '8px 0' }}>
              <div style={{ width: '200px', height: '200px', background: 'rgba(250,250,250,0.88)', border: '2px dashed rgba(0,180,230,0.4)', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" stroke="rgba(0,180,230,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
                </svg>
                <span style={{ fontSize: '14px', color: '#6b7280', textAlign: 'center' }}>Apunta la cámara al QR del contacto</span>
              </div>
              <button onClick={() => { setShowAddContact(false); setShowQRScannerCamera(true); }}
                style={{ background: '#00b4e6', border: 'none', borderRadius: '10px', padding: '12px 24px', color: '#fff', fontSize: '13px', fontWeight: '700', cursor: 'pointer', outline: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Activar cámara
              </button>
            </div>
          )}

          {/* Tab: Repertorio */}
          {addContactTab === 'repertorio' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              {/* Buscador */}
              <div style={{ position: 'relative', marginBottom: '10px', flexShrink: 0 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}>
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input type="text" value={repertorioSearch} onChange={e => setRepertorioSearch(e.target.value)}
                  placeholder="Buscar por nombre o teléfono..."
                  style={{ width: '100%', padding: '9px 12px 9px 30px', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '8px', fontSize: '13px', background: 'rgba(249,250,251,0.88)', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              {/* Lista */}
              <div style={{ flex: 1, overflowY: 'auto', marginBottom: '10px' }}>
                {repertorioLoading ? (
                  <div style={{ padding: '30px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>Cargando contactos...</div>
                ) : (deviceContactsLoaded ? deviceContacts : repertorioUsers).filter((u: any) =>
                    u.full_name.toLowerCase().includes(repertorioSearch.toLowerCase()) || u.phone.includes(repertorioSearch)
                  ).length === 0 ? (
                  <div style={{ padding: '30px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
                    {repertorioSearch ? 'No se encontraron contactos' : 'No hay contactos disponibles'}
                  </div>
                ) : (deviceContactsLoaded ? deviceContacts : repertorioUsers)
                    .filter((u: any) => u.full_name.toLowerCase().includes(repertorioSearch.toLowerCase()) || u.phone.includes(repertorioSearch))
                    .map((user: any) => {
                  const isSel = repertorioSelected.has(user.id || user.phone);
                  const initials = user.full_name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
                  const canSelect = user.onEgchat && !user.alreadyContact;
                  return (
                    <div key={user.id || user.phone} style={{ width: '100%', padding: '9px 12px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #f3f4f6', background: isSel ? 'rgba(0,180,230,0.07)' : 'transparent' }}>
                      {/* Avatar con indicador verde */}
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: user.avatar_url ? 'transparent' : 'linear-gradient(135deg,#00c8a0,#00b894)', backgroundImage: user.avatar_url ? `url(${user.avatar_url})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '14px', fontWeight: '700' }}>
                          {!user.avatar_url && initials}
                        </div>
                        {/* Señal verde si tiene EGCHAT */}
                        {user.onEgchat && (
                          <div style={{ position: 'absolute', bottom: 0, right: 0, width: '12px', height: '12px', borderRadius: '50%', background: '#22c55e', border: '2px solid #fff' }}/>
                        )}
                      </div>
                      {/* Info */}
                      <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.full_name}</div>
                        <div style={{ fontSize: '11px', color: user.onEgchat ? '#22c55e' : '#9ca3af' }}>
                          {user.alreadyContact ? '✓ Ya es tu contacto' : user.onEgchat ? 'En EGCHAT' : user.phone}
                        </div>
                      </div>
                      {/* Acción */}
                      {user.alreadyContact ? (
                        <span style={{ fontSize: '11px', color: '#22c55e', fontWeight: '600' }}>✓</span>
                      ) : user.onEgchat ? (
                        // Checkbox para añadir
                        <button onClick={() => {
                          const next = new Set(repertorioSelected);
                          isSel ? next.delete(user.id) : next.add(user.id);
                          setRepertorioSelected(next);
                        }} style={{ width: '22px', height: '22px', borderRadius: '50%', border: isSel ? 'none' : '2px solid #d1d5db', background: isSel ? '#00b4e6' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer', outline: 'none' }}>
                          {isSel && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                        </button>
                      ) : (
                        // Botón invitar por SMS/WhatsApp
                        <button onClick={() => {
                          const msg = `Hola ${user.full_name.split(' ')[0]}, únete a EGCHAT, la app de mensajería de Guinea Ecuatorial 🇬🇶 https://egchat-v2.vercel.app`;
                          window.open(`sms:${user.phone}?body=${encodeURIComponent(msg)}`, '_blank');
                        }} style={{ background: 'rgba(0,180,230,0.1)', border: '1px solid rgba(0,180,230,0.3)', borderRadius: '8px', padding: '4px 8px', color: '#00b4e6', fontSize: '11px', fontWeight: '600', cursor: 'pointer', outline: 'none', whiteSpace: 'nowrap' }}>
                          Invitar
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Botón añadir */}
              {repertorioSelected.size > 0 && (
                <div style={{ fontSize: '11px', color: '#6b7280', textAlign: 'center', marginBottom: '6px' }}>
                  {repertorioSelected.size} {repertorioSelected.size === 1 ? 'contacto seleccionado' : 'contactos seleccionados'}
                </div>
              )}
              <button onClick={handleAddRepertorio} disabled={repertorioSelected.size === 0 || repertorioAdding}
                style={{ background: repertorioSelected.size > 0 ? '#00b4e6' : '#d1d5db', border: 'none', borderRadius: '10px', padding: '12px', color: '#fff', fontSize: '13px', fontWeight: '700', cursor: repertorioSelected.size > 0 ? 'pointer' : 'not-allowed', outline: 'none', opacity: repertorioAdding ? 0.7 : 1, flexShrink: 0 }}>
                {repertorioAdding ? 'Añadiendo...' : `Añadir${repertorioSelected.size > 0 ? ` (${repertorioSelected.size})` : ''} a contactos`}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Modal: Crear grupo — funcional con API real
  const renderCreateGroupModal = () => {
    if (!showCreateGroup) return null;
    const contacts = allContacts.length > 0 ? allContacts : [];
    const addMembersMode = !!(window as any).__addMembersToGroupId;
    const targetGroupId = (window as any).__addMembersToGroupId as string | undefined;
    const canCreate = addMembersMode ? groupMembers.length >= 1 : (groupName.trim().length >= 2 && groupMembers.length >= 1);

    const doCreate = async () => {
      if (!canCreate) return;
      const memberIds = groupMembers.map(m => m.id);

      // Modo añadir miembros a grupo existente
      if (addMembersMode && targetGroupId) {
        try {
          await chatAPI.addGroupMembers(targetGroupId, memberIds);
          const members = await chatAPI.getGroupParticipants(targetGroupId);
          setGroupMembersList(members || []);
          showToast(`${memberIds.length} miembro(s) añadido(s)`, 'success');
        } catch { showToast('No se pudo añadir los miembros', 'error'); }
        (window as any).__addMembersToGroupId = null;
        setShowCreateGroup(false);
        setGroupMembers([]);
        return;
      }

      let groupId = Date.now().toString();
      let backendSuccess = false;
      try {
        const chat = await chatAPI.createGroup(groupName.trim(), memberIds);
        if (chat?.id) { groupId = chat.id; backendSuccess = true; }
      } catch { /* usar ID local */ }

      const newGroup = {
        id: groupId,
        name: groupName.trim(),
        description: '',
        members: groupMembers.length + 1,
        avatar: 'friends',
        avatarUrl: '',
        createdDate: new Date().toLocaleDateString('es-ES'),
        lastMessage: 'Grupo creado',
        unread: 0,
        is_favorite: false,
      };
      // Añadir a allGroups Y a realChats para que aparezca en la lista de mensajes
      setAllGroups(prev => {
        const updated = [newGroup, ...prev];
        try { localStorage.setItem('egchat_groups', JSON.stringify(updated)); } catch {}
        return updated;
      });
      setRealChats((prev: any[]) => [{
        id: groupId, type: 'group', name: groupName.trim(),
        avatar_url: '', participants: groupMembers.map(m => ({ user_id: m.id, full_name: m.name })),
        last_message: null, unread_count: 0, updated_at: new Date().toISOString(),
      }, ...prev]);

      const sc = {
        id: groupId, type: 'group', title: groupName.trim(),
        subtitle: 'Grupo creado', time: '', status: 'online',
        initials: groupName.trim().slice(0,2).toUpperCase(),
        color: '#a855f7', isGroup: true, members: groupMembers.length + 1,
      };
      setSelectedChat(sc);
      setCurrentView('Mensajería');
      setShowCreateGroup(false);
      setGroupName('');
      setGroupMembers([]);
      showToast(`Grupo "${groupName.trim()}" creado`, 'success');
      // Si se guardó en backend, recargar para sincronizar IDs correctos
      if (backendSuccess) setTimeout(() => loadChats(), 1500);
    };

    return (
      <div style={{ position:'fixed', inset:0, zIndex:1200, background:'rgba(0,0,0,0.55)', backdropFilter:'blur(6px)', display:'flex', alignItems:'flex-end' }}
        onClick={() => setShowCreateGroup(false)}>
        <div onClick={e => e.stopPropagation()} style={{ width:'100%', background:'#fff', borderRadius:'20px 20px 0 0', padding:'0 0 32px', maxHeight:'92vh', overflowY:'auto' }}>

          {/* Handle */}
          <div style={{ display:'flex', justifyContent:'center', padding:'12px 0 0' }}>
            <div style={{ width:'36px', height:'4px', background:'#E5E7EB', borderRadius:'2px' }}/>
          </div>

          {/* Header */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px 12px' }}>
            <div style={{ fontSize:'17px', fontWeight:'800', color:'#111827', display:'flex', alignItems:'center', gap:'8px' }}>
              <div style={{ width:'32px', height:'32px', borderRadius:'10px', background:'linear-gradient(135deg,#a855f7,#6366f1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              Nuevo grupo
            </div>
            <button onClick={() => { setShowCreateGroup(false); (window as any).__addMembersToGroupId = null; }} style={{ background:'#F3F4F6', border:'none', borderRadius:'50%', width:'32px', height:'32px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" stroke="#6B7280" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div style={{ padding:'0 16px' }}>
            {/* Nombre del grupo — oculto en modo añadir miembros */}
            {!addMembersMode && (
              <>
                <div style={{ fontSize:'11px', fontWeight:'700', color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'6px' }}>Nombre del grupo *</div>
                <input value={groupName} onChange={e => setGroupName(e.target.value)}
                  placeholder="Ej: Familia, Trabajo, Amigos..."
                  maxLength={50}
                  style={{ width:'100%', background:'#F9FAFB', border:`1.5px solid ${groupName.trim().length>=2?'#a855f7':'#E5E7EB'}`, borderRadius:'12px', padding:'12px 14px', color:'#111827', fontSize:'15px', outline:'none', fontFamily:'inherit', boxSizing:'border-box', marginBottom:'4px', transition:'border 0.2s' }}/>
                <div style={{ fontSize:'11px', color:'#9CA3AF', textAlign:'right', marginBottom:'14px' }}>{groupName.length}/50</div>
              </>
            )}

            {/* Miembros seleccionados */}
            {groupMembers.length > 0 && (
              <div style={{ marginBottom:'12px' }}>
                <div style={{ fontSize:'11px', fontWeight:'700', color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'8px' }}>
                  Participantes seleccionados ({groupMembers.length})
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                  {groupMembers.map(m => (
                    <div key={m.id} style={{ display:'flex', alignItems:'center', gap:'5px', background:'#F3E8FF', border:'1px solid #D8B4FE', borderRadius:'20px', padding:'4px 10px 4px 6px' }}>
                      <div style={{ width:'22px', height:'22px', borderRadius:'50%', background:'#a855f7', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'9px', fontWeight:'700', color:'#fff' }}>
                        {m.initials || m.name?.slice(0,2).toUpperCase()}
                      </div>
                      <span style={{ fontSize:'13px', color:'#7C3AED', fontWeight:'600' }}>{m.name.split(' ')[0]}</span>
                      <button onClick={() => setGroupMembers(prev => prev.filter(x => x.id !== m.id))}
                        style={{ background:'none', border:'none', color:'#9CA3AF', cursor:'pointer', outline:'none', padding:0, fontSize:'16px', lineHeight:1, display:'flex', alignItems:'center' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lista de contactos */}
            <div style={{ fontSize:'11px', fontWeight:'700', color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'8px' }}>
              Anadir participantes ({contacts.length} contactos disponibles)
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'4px', marginBottom:'16px', maxHeight:'260px', overflowY:'auto' }}>
              {contacts.length === 0 ? (
                <div style={{ textAlign:'center', padding:'24px', color:'#9CA3AF', fontSize:'13px' }}>
                  <div style={{ fontSize:'32px', marginBottom:'8px' }}>👥</div>
                  No tienes contactos aun. Anade contactos primero.
                </div>
              ) : contacts.map(c => {
                const isAdded = groupMembers.some(m => m.id === c.id);
                return (
                  <button key={c.id}
                    onClick={() => {
                      if (isAdded) setGroupMembers(prev => prev.filter(m => m.id !== c.id));
                      else setGroupMembers(prev => [...prev, { id: c.id, name: c.name, initials: c.avatar || c.name?.slice(0,2).toUpperCase() || '??', color: '#a855f7' }]);
                    }}
                    style={{ display:'flex', alignItems:'center', gap:'12px', padding:'10px 12px', background: isAdded ? '#F3E8FF' : '#FAFAFA', border:`1.5px solid ${isAdded ? '#D8B4FE' : '#F0F0F0'}`, borderRadius:'12px', cursor:'pointer', outline:'none', transition:'all 0.15s' }}>
                    <div style={{ width:'42px', height:'42px', borderRadius:'50%', background:'linear-gradient(135deg,#a855f7,#6366f1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:'700', color:'#fff', flexShrink:0, overflow:'hidden' }}>
                      {c.avatarUrl ? <img src={c.avatarUrl} alt={c.name} style={{ width:'100%', height:'100%', objectFit:'cover' }}/> : (c.avatar || c.name?.slice(0,2).toUpperCase())}
                    </div>
                    <div style={{ flex:1, textAlign:'left' }}>
                      <div style={{ fontSize:'14px', fontWeight:'600', color:'#111827' }}>{c.name}</div>
                      <div style={{ fontSize:'12px', color:'#9CA3AF' }}>{c.phone}</div>
                    </div>
                    <div style={{ width:'26px', height:'26px', borderRadius:'50%', background: isAdded ? '#a855f7' : '#F3F4F6', border:`2px solid ${isAdded ? '#a855f7' : '#E5E7EB'}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.15s' }}>
                      {isAdded && <svg width="12" height="12" viewBox="0 0 24 24" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Botón crear */}
            <button
              disabled={!canCreate}
              onClick={doCreate}
              style={{ width:'100%', background: canCreate ? 'linear-gradient(135deg,#a855f7,#6366f1)' : '#E5E7EB', border:'none', borderRadius:'14px', padding:'15px', color: canCreate ? '#fff' : '#9CA3AF', fontSize:'15px', fontWeight:'700', cursor: canCreate ? 'pointer' : 'default', outline:'none', transition:'all 0.2s', boxShadow: canCreate ? '0 4px 16px rgba(168,85,247,0.35)' : 'none' }}>
              {canCreate
                ? addMembersMode
                  ? `Añadir ${groupMembers.length} miembro(s) al grupo`
                  : `Crear grupo  -  ${groupMembers.length + 1} miembros`
                : addMembersMode
                  ? 'Selecciona al menos 1 contacto'
                  : groupName.trim().length < 2
                    ? 'Escribe el nombre del grupo'
                    : 'Selecciona al menos 1 contacto'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Catalogo de wallpapers
  const wallpapers = [
    // -- SIN FONDO ------------------------------------------------------
    { id: 'none', label: 'Sin fondo', type: 'none', emoji: '', category: 'static' },
    // -- CRISTALINOS / SUAVES -------------------------------------------
    {
      id: 'crystal-mint', label: 'Menta Cristal', type: 'css', category: 'crystal',
      bg: 'linear-gradient(145deg, #e0fdf4 0%, #ccfbf1 30%, #a7f3d0 60%, #d1fae5 100%)',
      overlay: `radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.6) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(0,200,160,0.15) 0%, transparent 45%)`
    },
    {
      id: 'crystal-sky', label: 'Cielo Suave', type: 'css', category: 'crystal',
      bg: 'linear-gradient(145deg, #eff6ff 0%, #dbeafe 35%, #bfdbfe 65%, #e0f2fe 100%)',
      overlay: `radial-gradient(ellipse at 60% 10%, rgba(255,255,255,0.7) 0%, transparent 50%), radial-gradient(ellipse at 20% 90%, rgba(147,197,253,0.3) 0%, transparent 45%)`
    },
    {
      id: 'crystal-rose', label: 'Rosa Pétalo', type: 'css', category: 'crystal',
      bg: 'linear-gradient(145deg, #fff1f2 0%, #ffe4e6 35%, #fecdd3 65%, #fce7f3 100%)',
      overlay: `radial-gradient(ellipse at 40% 20%, rgba(255,255,255,0.65) 0%, transparent 50%), radial-gradient(ellipse at 80% 75%, rgba(251,113,133,0.12) 0%, transparent 45%)`
    },
    {
      id: 'crystal-lavender', label: 'Lavanda', type: 'css', category: 'crystal',
      bg: 'linear-gradient(145deg, #f5f3ff 0%, #ede9fe 35%, #ddd6fe 65%, #f0e6ff 100%)',
      overlay: `radial-gradient(ellipse at 50% 15%, rgba(255,255,255,0.6) 0%, transparent 50%), radial-gradient(ellipse at 25% 80%, rgba(167,139,250,0.15) 0%, transparent 45%)`
    },
    {
      id: 'crystal-peach', label: 'Melocotón', type: 'css', category: 'crystal',
      bg: 'linear-gradient(145deg, #fff7ed 0%, #ffedd5 35%, #fed7aa 65%, #fef3c7 100%)',
      overlay: `radial-gradient(ellipse at 35% 25%, rgba(255,255,255,0.65) 0%, transparent 50%), radial-gradient(ellipse at 75% 70%, rgba(251,146,60,0.12) 0%, transparent 45%)`
    },
    {
      id: 'crystal-aqua', label: 'Aqua Cristal', type: 'css', category: 'crystal',
      bg: 'linear-gradient(145deg, #ecfeff 0%, #cffafe 35%, #a5f3fc 65%, #e0f7fa 100%)',
      overlay: `radial-gradient(ellipse at 55% 15%, rgba(255,255,255,0.65) 0%, transparent 50%), radial-gradient(ellipse at 20% 85%, rgba(6,182,212,0.15) 0%, transparent 45%)`
    },
    {
      id: 'crystal-sand', label: 'Arena Clara', type: 'css', category: 'crystal',
      bg: 'linear-gradient(145deg, #fefce8 0%, #fef9c3 35%, #fef08a 55%, #fefce8 100%)',
      overlay: `radial-gradient(ellipse at 40% 20%, rgba(255,255,255,0.6) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(234,179,8,0.1) 0%, transparent 45%)`
    },
    {
      id: 'crystal-white', label: 'Blanco Puro', type: 'css', category: 'crystal',
      bg: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)',
      overlay: `radial-gradient(ellipse at 50% 50%, rgba(0,200,160,0.05) 0%, transparent 70%)`
    },
    // -- ESTÁTICOS OSCUROS ----------------------------------------------
    {
      id: 'static-malabo', label: 'Malabo Noche', type: 'css', category: 'static',
      bg: 'linear-gradient(170deg, #020617 0%, #0f172a 45%, #1e1b4b 75%, #0f172a 100%)',
      overlay: `radial-gradient(ellipse at 50% 85%, rgba(0,200,160,0.18) 0%, transparent 55%), radial-gradient(ellipse at 20% 30%, rgba(0,180,230,0.12) 0%, transparent 40%)`,
      stars: true
    },
    {
      id: 'static-sunset', label: 'Atardecer GQ', type: 'css', category: 'static',
      bg: 'linear-gradient(170deg, #1e3a5f 0%, #7c2d12 25%, #c2410c 50%, #ea580c 70%, #fbbf24 90%, #fef3c7 100%)',
      overlay: `radial-gradient(ellipse at 50% 95%, rgba(251,191,36,0.3) 0%, transparent 50%)`
    },
    {
      id: 'static-forest', label: 'Selva Ecuatorial', type: 'css', category: 'static',
      bg: 'linear-gradient(170deg, #052e16 0%, #14532d 30%, #166534 60%, #15803d 80%, #052e16 100%)',
      overlay: `radial-gradient(ellipse at 30% 20%, rgba(74,222,128,0.2) 0%, transparent 50%), radial-gradient(ellipse at 70% 70%, rgba(0,200,160,0.15) 0%, transparent 40%)`
    },
    {
      id: 'static-ocean', label: 'Océano Atlántico', type: 'css', category: 'static',
      bg: 'linear-gradient(170deg, #0c4a6e 0%, #0369a1 35%, #0284c7 60%, #0ea5e9 80%, #38bdf8 100%)',
      overlay: `radial-gradient(ellipse at 50% 100%, rgba(56,189,248,0.25) 0%, transparent 50%)`
    },
    {
      id: 'static-aurora', label: 'Aurora con Logo', type: 'css', category: 'static',
      bg: 'linear-gradient(135deg, #0f172a 0%, #064e3b 30%, #1e3a5f 60%, #0f172a 100%)',
      overlay: `radial-gradient(ellipse at 50% 40%, rgba(0,200,160,0.35) 0%, transparent 55%), radial-gradient(ellipse at 30% 60%, rgba(0,180,230,0.25) 0%, transparent 45%)`,
      logo: true
    },
    // -- DINÁMICOS ------------------------------------------------------
    {
      id: 'dyn-rain-bata', label: 'Lluvia en Bata', type: 'css', category: 'dynamic',
      bg: 'linear-gradient(170deg, #0f2027 0%, #203a43 45%, #2c5364 100%)',
      overlay: `radial-gradient(ellipse at 30% 70%, rgba(100,180,255,0.12) 0%, transparent 50%)`,
      rain: true, logo: true
    },
    {
      id: 'dyn-rain-malabo', label: 'Lluvia Malabo', type: 'css', category: 'dynamic',
      bg: 'linear-gradient(170deg, #0a0a1a 0%, #1a2a4a 50%, #0d1b2a 100%)',
      overlay: `radial-gradient(ellipse at 60% 40%, rgba(0,180,230,0.15) 0%, transparent 50%)`,
      rain: true, lightning: true, logo: true
    },
    {
      id: 'dyn-kids-school', label: 'Niños Estudiando', type: 'css', category: 'dynamic',
      bg: 'linear-gradient(170deg, #1a3a2e 0%, #2d6a4f 40%, #1e5a38 70%, #0f3020 100%)',
      overlay: `radial-gradient(ellipse at 50% 30%, rgba(100,255,150,0.15) 0%, transparent 55%)`,
      floating: true, logo: true
    },
    {
      id: 'dyn-nanobanana', label: 'NanoBanana Fiesta', type: 'css', category: 'dynamic',
      bg: 'linear-gradient(135deg, #1a0533 0%, #2d1b69 35%, #1e3a5f 65%, #0f2027 100%)',
      overlay: `radial-gradient(ellipse at 40% 50%, rgba(168,85,247,0.2) 0%, transparent 50%), radial-gradient(ellipse at 70% 30%, rgba(0,180,230,0.15) 0%, transparent 40%)`,
      particles: true, logo: true
    },
    {
      id: 'dyn-maritime', label: 'Paseo Marítimo', type: 'css', category: 'dynamic',
      bg: 'linear-gradient(170deg, #0c1445 0%, #1a3a6e 40%, #0369a1 70%, #0ea5e9 100%)',
      overlay: `radial-gradient(ellipse at 50% 80%, rgba(14,165,233,0.2) 0%, transparent 50%)`,
      waves: true, logo: true
    },
    {
      id: 'dyn-stars-logo', label: 'Cosmos EGCHAT', type: 'css', category: 'dynamic',
      bg: 'linear-gradient(135deg, #020617 0%, #0f172a 50%, #1e1b4b 100%)',
      overlay: `radial-gradient(ellipse at 50% 50%, rgba(0,200,160,0.12) 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, rgba(0,180,230,0.1) 0%, transparent 40%)`,
      stars: true, logo: true, logoGlow: true
    },
  ];

  const renderWallpaperCatalog = () => {
    if (!showWallpaperCatalog) return null;
    const crystals = wallpapers.filter(w => w.category === 'crystal');
    const statics = wallpapers.filter(w => w.category === 'static');
    const dynamics = wallpapers.filter(w => w.category === 'dynamic');
    const noneWp = wallpapers.filter(w => w.type === 'none');

    const handleFileUploadWallpaper = async () => {
      // Primero intentar Electron, si no usar input file web
      if ((window as any).electronAPI?.openFileDialog) {
        try {
          const result = await (window as any).electronAPI.openFileDialog();
          if (!result) return;
          const id = `custom-${Date.now()}`;
          const label = result.path.split(/[\\/]/).pop().replace(/\.[^.]+$/, '').slice(0, 20);
          setCustomWallpapers(prev => [...prev, { id, label, url: result.url, type: result.isVideo ? 'video' : 'image' }]);
          setActiveChatWallpaper(id);
          localStorage.setItem('egchat_custom_wallpapers', JSON.stringify([...customWallpapers, { id, label, url: result.url, type: result.isVideo ? 'video' : 'image' }]));
          setShowWallpaperCatalog(false);
          return;
        } catch {}
      }
      // Web: usar input file
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*,video/*';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        const id = `custom-${Date.now()}`;
        const label = file.name.replace(/\.[^.]+$/, '').slice(0, 20);
        const type = file.type.startsWith('video') ? 'video' : 'image';
        setCustomWallpapers(prev => [...prev, { id, label, url, type }]);
        setActiveChatWallpaper(id);
        setShowWallpaperCatalog(false);
      };
      input.click();
    };

    const activeWallpaper = getActiveChatWallpaper();
    const WpThumb = ({ w }: { w: typeof wallpapers[0] }) => (
      <button key={w.id} onClick={() => { setActiveChatWallpaper(w.id); setShowWallpaperCatalog(false); }}
        title={w.label}
        style={{ border: activeWallpaper === w.id ? '2px solid #00c8a0' : '1px solid rgba(0,0,0,0.08)', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', outline: 'none', padding: 0, background: 'none', position: 'relative' }}>
        <div style={{ height: '90px', background: w.type === 'none'
          ? 'repeating-conic-gradient(#e5e7eb 0% 25%, #f9fafb 0% 50%) 0 0 / 16px 16px'
          : (w as any).bg || '#1a1a2e', position: 'relative' }}>
          {(w as any).overlay && <div style={{ position: 'absolute', inset: 0, background: (w as any).overlay }} />}
          {w.category === 'dynamic' && <div style={{ position: 'absolute', top: '3px', left: '3px', background: 'linear-gradient(135deg,#00c8a0,#00b4e6)', borderRadius: '3px', padding: '1px 4px', fontSize: '7px', fontWeight: '700', color: 'white', zIndex: 2 }}>VIVO</div>}
          {activeWallpaper === w.id && (
            <div style={{ position: 'absolute', top: '4px', right: '4px', width: '18px', height: '18px', borderRadius: '50%', background: '#00c8a0', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3, boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>
              <svg width="9" height="9" viewBox="0 0 24 24" stroke="white" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
          )}
        </div>
        <div style={{ padding: '4px 4px 5px', background: activeWallpaper === w.id ? 'rgba(0,200,160,0.08)' : '#fff', fontSize: '9px', fontWeight: '600', color: '#374151', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {w.label}
        </div>
      </button>
    );

    const Section = ({ title, items }: { title: string; items: typeof wallpapers }) => (
      <div style={{ marginBottom: '14px' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '7px' }}>{title}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '7px' }}>
          {items.map(w => <WpThumb key={w.id} w={w} />)}
        </div>
      </div>
    );

    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end' }}
        onClick={() => setShowWallpaperCatalog(false)}>
        <div onClick={e => e.stopPropagation()} style={{ width: '100%', background: 'rgba(255,255,255,0.35)', backdropFilter: 'blur(28px) saturate(200%)', WebkitBackdropFilter: 'blur(28px) saturate(200%)', borderRadius: '20px 20px 0 0', padding: '14px 14px 28px', maxHeight: '85vh', overflowY: 'auto', border: '1.5px solid rgba(255,255,255,0.6)', borderBottom: 'none' }}>
          {/* Handle */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
            <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: '#e5e7eb' }} />
          </div>
          {/* Título */}
          <div style={{ fontSize: '14px', fontWeight: '700', color: '#0d0d0d', marginBottom: '4px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
            Fondo de pantalla
          </div>
          {/* Subtítulo: indica que es solo para este chat */}
          <div style={{ fontSize: '11px', color: '#6b7280', textAlign: 'center', marginBottom: '14px' }}>
            Solo para este chat  -  {selectedChat?.title || 'Chat actual'}
          </div>

          {/* Mis fondos personalizados */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '7px' }}>Mis fondos</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '7px' }}>
              {/* Botón + para subir imagen/video */}
              <button
                onClick={handleFileUploadWallpaper}
                title="Añadir imagen o vídeo"
                style={{ border: '1.5px dashed rgba(0,200,160,0.6)', borderRadius: '10px', overflow: 'hidden', background: 'rgba(0,200,160,0.06)', cursor: 'pointer', outline: 'none', padding: 0, width: '100%' }}
              >
                <div style={{ height: '90px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '5px', color: '#00c8a0' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
                  </svg>
                  <span style={{ fontSize: '9px', fontWeight: '700', color: '#00c8a0' }}>Añadir</span>
                </div>
                <div style={{ padding: '4px 4px 5px', background: 'rgba(0,200,160,0.04)', fontSize: '9px', fontWeight: '600', color: '#00c8a0', textAlign: 'center' }}>
                  Galería
                </div>
              </button>
              {/* Fondos personalizados subidos */}
              {customWallpapers.map(cw => (
                <div key={cw.id} style={{ position: 'relative' }}>
                  <button onClick={() => { setActiveChatWallpaper(cw.id); setShowWallpaperCatalog(false); }}
                    title={cw.label}
                    style={{ width: '100%', border: activeWallpaper === cw.id ? '2px solid #00c8a0' : '1px solid rgba(0,0,0,0.08)', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', outline: 'none', padding: 0, background: 'none' }}>
                    <div style={{ height: '90px', position: 'relative', overflow: 'hidden', background: '#111' }}>
                      {cw.type === 'video'
                        ? <video src={cw.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted playsInline />
                        : <img src={cw.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={cw.label} />
                      }
                      {cw.type === 'video' && (
                        <div style={{ position: 'absolute', top: '3px', left: '3px', background: 'rgba(0,0,0,0.55)', borderRadius: '3px', padding: '1px 4px', fontSize: '7px', fontWeight: '700', color: 'white' }}>VID</div>
                      )}
                      {activeWallpaper === cw.id && (
                        <div style={{ position: 'absolute', top: '4px', right: '4px', width: '18px', height: '18px', borderRadius: '50%', background: '#00c8a0', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3 }}>
                          <svg width="9" height="9" viewBox="0 0 24 24" stroke="white" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                      )}
                    </div>
                    <div style={{ padding: '4px 4px 5px', background: activeWallpaper === cw.id ? 'rgba(0,200,160,0.08)' : '#fff', fontSize: '9px', fontWeight: '600', color: '#374151', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {cw.label}
                    </div>
                  </button>
                  {/* Botón eliminar */}
                  <button onClick={() => { setCustomWallpapers(prev => prev.filter(w => w.id !== cw.id)); if (activeWallpaper === cw.id) { setActiveChatWallpaper('none'); } }}
                    style={{ position: 'absolute', top: '4px', left: '4px', width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(239,68,68,0.9)', border: 'none', cursor: 'pointer', outline: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 4 }}>
                    <svg width="7" height="7" viewBox="0 0 24 24" stroke="white" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Sin fondo */}
          <Section title="Sin fondo" items={noneWp} />
          {/* Cristalinos */}
          <Section title="✨ Cristalinos y Suaves" items={crystals} />
          {/* Estáticos oscuros */}
          <Section title="🌙 Oscuros" items={statics} />
          {/* Dinámicos */}
          <Section title="⚡ Vivos y Animados" items={dynamics} />
        </div>
      </div>
    );
  };

  // Panel de selección de layouts para la pgina home
  const renderLayoutPanel = () => {
    if (!showLayoutPanel) return null;

    const layouts = [
      { id: 'default',   label: 'Estándar',    desc: 'Balance + tarjetas',       icon: '🏠' },
      { id: 'compact',   label: 'Compacto',    desc: 'Solo accesos rapidos',      icon: '?' },
      { id: 'cards',     label: 'Tarjetas',    desc: 'Grid de servicios grande',  icon: '🏠' },
      { id: 'minimal',   label: 'Minimal',     desc: 'Solo saldo y botones',      icon: '?' },
      { id: 'news',      label: 'Noticias',    desc: 'Noticias en portada',       icon: '📰' },
      { id: 'finance',   label: 'Finanzas',    desc: 'Enfocado en cartera',       icon: '💳' },
    ];

    return (
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end' }}
        onClick={() => setShowLayoutPanel(false)}
      >
        <div onClick={e => e.stopPropagation()} style={{ width: '100%', background: 'rgba(255,255,255,0.35)', backdropFilter: 'blur(28px) saturate(200%)', WebkitBackdropFilter: 'blur(28px) saturate(200%)', borderRadius: '20px 20px 0 0', padding: '16px 16px 32px', maxHeight: '75vh', overflowY: 'auto', border: '1.5px solid rgba(255,255,255,0.6)', borderBottom: 'none' }}>
          {/* Handle */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
            <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: '#e5e7eb' }} />
          </div>

          {/* Titulo */}
          <div style={{ fontSize: '15px', fontWeight: '700', color: '#0d0d0d', marginBottom: '16px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
            Diseno de pantalla principal
          </div>

          {/* Grid de layouts */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            {layouts.map(l => (
              <button
                key={l.id}
                onClick={() => { setHomeLayout(l.id); setShowLayoutPanel(false); }}
                style={{
                  background: homeLayout === l.id ? 'rgba(0,200,160,0.08)' : '#f9fafb',
                  border: homeLayout === l.id ? '2px solid #00c8a0' : '1.5px solid rgba(0,0,0,0.08)',
                  borderRadius: '12px',
                  padding: '14px 12px',
                  cursor: 'pointer',
                  outline: 'none',
                  textAlign: 'left',
                  position: 'relative'
                }}
              >
                <div style={{ fontSize: '22px', marginBottom: '6px' }}>{l.icon}</div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#0d0d0d', marginBottom: '2px' }}>{l.label}</div>
                <div style={{ fontSize: '13px', color: '#6b7280' }}>{l.desc}</div>
                {homeLayout === l.id && (
                  <div style={{ position: 'absolute', top: '8px', right: '8px', width: '16px', height: '16px', borderRadius: '50%', background: '#00c8a0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="9" height="9" viewBox="0 0 24 24" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Devuelve el wallpaper activo para el chat actual (individual por chat)
  const getActiveChatWallpaper = (): string => {
    const chatId = selectedChat?.id?.toString() || '';
    return chatWallpapers[chatId] || 'none';
  };

  // Guarda el wallpaper para el chat actual (solo afecta a este chat)
  const setActiveChatWallpaper = (wallpaperId: string) => {
    const chatId = selectedChat?.id?.toString() || '';
    if (!chatId) return;
    const updated = { ...chatWallpapers, [chatId]: wallpaperId };
    setChatWallpapers(updated);
    localStorage.setItem('egchat_chat_wallpapers', JSON.stringify(updated));
  };

  // Devuelve el estilo de fondo para el área de mensajes del chat
  const getChatAreaBg = (): React.CSSProperties => {
    const selectedWallpaper = getActiveChatWallpaper();
    const custom = customWallpapers.find(w => w.id === selectedWallpaper);
    if (custom) {
      return { position: 'relative', overflow: 'hidden', background: 'transparent' };
    }
    const wp = wallpapers.find(w => w.id === selectedWallpaper) as any;
    if (!wp || wp.type === 'none') return { background: '#efeae2' };
    // El fondo real lo pone renderWallpaperBg (position:absolute), aquí solo transparente
    return { background: 'transparent', position: 'relative', overflow: 'hidden' };
  };

  // Renderiza elementos animados del wallpaper dentro del área de mensajes
  const renderChatWallpaperContent = () => {
    const selectedWallpaper = getActiveChatWallpaper();
    const custom = customWallpapers.find(w => w.id === selectedWallpaper);
    if (custom) {
      return (
        <>
          {custom.type === 'video'
            ? <video src={custom.url} autoPlay loop muted playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} />
            : <img src={custom.url} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} />
          }
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.15)', zIndex: 0 }} />
        </>
      );
    }
    const wp = wallpapers.find(w => w.id === selectedWallpaper) as any;
    if (!wp || wp.type === 'none') return null;
    return (
      <>
        {wp.overlay && <div style={{ position: 'absolute', inset: 0, background: wp.overlay, zIndex: 0 }} />}
      </>
    );
  };

  const renderWallpaperBg = () => {
    const selectedWallpaper = getActiveChatWallpaper();
    const custom = customWallpapers.find(w => w.id === selectedWallpaper);
    if (custom) {
      return (
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          {custom.type === 'video'
            ? <video src={custom.url} autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <img src={custom.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          }
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.15)' }} />
        </div>
      );
    }
    const wp = wallpapers.find(w => w.id === selectedWallpaper) as any;
    if (!wp || wp.type === 'none') return null;
    return (
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, background: wp.bg, overflow: 'hidden', pointerEvents: 'none' }}>
        {wp.overlay && <div style={{ position: 'absolute', inset: 0, background: wp.overlay }} />}
        {wp.rain && (
          <div style={{ position: 'absolute', inset: 0, }}>
            {Array.from({ length: 55 }).map((_, i) => (
              <div key={i} style={{ position: 'absolute', left: `${(i * 1.9) % 100}%`, top: `-${10 + (i * 7) % 30}%`, width: '1px', height: `${18 + (i * 3) % 22}px`, background: 'linear-gradient(to bottom, transparent, rgba(150,210,255,0.7))', animation: `rainDrop ${0.55 + (i % 5) * 0.12}s linear ${(i * 0.07) % 2}s infinite`, transform: 'rotate(12deg)' }} />
            ))}
          </div>
        )}
        {wp.lightning && <div style={{ position: 'absolute', inset: 0, animation: 'lightning 4s ease-in-out infinite', background: 'rgba(200,220,255,0)', pointerEvents: 'none' }} />}
        {wp.stars && Array.from({ length: 70 }).map((_, i) => (
          <div key={i} style={{ position: 'absolute', left: `${(i * 14.3) % 100}%`, top: `${(i * 9.7) % 65}%`, width: `${1 + (i % 3)}px`, height: `${1 + (i % 3)}px`, borderRadius: '50%', background: 'white', opacity: 0.3 + (i % 7) * 0.1, animation: `pulse ${1.5 + (i % 4) * 0.5}s ease-in-out ${(i * 0.13) % 2}s infinite` }} />
        ))}
        {wp.particles && Array.from({ length: 20 }).map((_, i) => (
          <div key={i} style={{ position: 'absolute', left: `${(i * 5.3) % 100}%`, top: `${(i * 7.1) % 100}%`, width: `${4 + (i % 4) * 2}px`, height: `${4 + (i % 4) * 2}px`, borderRadius: '50%', background: i % 2 === 0 ? 'rgba(0,200,160,0.6)' : 'rgba(0,180,230,0.6)', animation: `pulse ${2 + (i % 3)}s ease-in-out ${(i * 0.2) % 2}s infinite`, filter: 'blur(1px)' }} />
        ))}
        {wp.waves && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '120px', }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ position: 'absolute', bottom: `${i * 20}px`, left: '-50%', width: '200%', height: '60px', background: `rgba(14,165,233,${0.15 - i * 0.04})`, borderRadius: '50%', animation: `wave ${3 + i}s ease-in-out ${i * 0.5}s infinite alternate` }} />
            ))}
          </div>
        )}
        {wp.floating && Array.from({ length: 12 }).map((_, i) => (
          <div key={i} style={{ position: 'absolute', left: `${(i * 8.5) % 90}%`, top: `${20 + (i * 6.3) % 60}%`, fontSize: `${10 + (i % 3) * 4}px`, animation: `pulse ${2 + (i % 3)}s ease-in-out ${(i * 0.3) % 2}s infinite`, opacity: 0.6 }}>
            {['🌸', '✨', '🌿', '💫', '🌺'][i % 5]}
          </div>
        ))}
        {wp.logo && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', opacity: 0.15, pointerEvents: 'none' }}>
            <img src="/logo-transparent.png" alt="" style={{ width: '140px', height: '140px', borderRadius: '50%', filter: wp.logoGlow ? 'drop-shadow(0 0 30px rgba(0,200,160,0.9))' : 'drop-shadow(0 0 10px rgba(255,255,255,0.3))' }} />
            <div style={{ fontSize: '28px', fontWeight: '900', color: 'white', letterSpacing: '4px' }}>EGCHAT</div>
          </div>
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)' }} />
      </div>
    );
  };

  // Renderizar men radial - CON 12 SERVICIOS VISIBLES
  const renderRadialMenu = () => {
    if (!isMenuOpen || currentView !== 'home') return null;

    const menuItems = [
      { id: 'mensajes',   label: 'MENSAJES',   angle: 0   },
      { id: 'estados',    label: 'ESTADOS',    angle: 30  },
      { id: 'noticias',   label: 'NOTICIAS',   angle: 60  },
      { id: 'salud',      label: 'SALUD',      angle: 90  },
      { id: 'edu',        label: 'EDUCACIN',  angle: 120 },
      { id: 'apuestas',   label: 'APUESTAS',   angle: 150 },
      { id: 'contactos',  label: 'CONTACTOS',  angle: 180 },
      { id: 'banking',    label: 'BANCOS',     angle: 210 },
      { id: 'cemac',      label: 'CEMAC',      angle: 240 },
      { id: 'qrscan',     label: 'ESCANEAR',   angle: 270 },
      { id: 'fondo',      label: 'FONDO',      angle: 300 },
      { id: 'mitaxi',     label: 'MITAXI',     angle: 330 }
    ];

    const gradients = [
      'linear-gradient(135deg, #00c8a0, #00e5ff)',
      'linear-gradient(135deg, #00b4e6, #1e90ff)',
      'linear-gradient(135deg, #00c8a0, #00b4e6)',
      'linear-gradient(135deg, #00e5ff, #1e90ff)',
      'linear-gradient(135deg, #059669, #2563eb)',
      'linear-gradient(135deg, #00b4e6, #00c8a0)',
      'linear-gradient(135deg, #00c8a0, #00e5ff)',
      'linear-gradient(135deg, #1e90ff, #00e5ff)',
      'linear-gradient(135deg, #00c8a0, #00b4e6)',
      'linear-gradient(135deg, #00e5ff, #00b4e6)',
      'linear-gradient(135deg, #00b4e6, #00e5ff)',
      'linear-gradient(135deg, #00c8a0, #1e90ff)',
    ];

    return (
      <>
      <div style={{
        position: 'fixed',
        bottom: 'calc(49px + env(safe-area-inset-bottom, 0px) + 24px)',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1002,
        width: '300px',
        height: '300px',
        pointerEvents: 'none'
      }}>
        {menuItems.map((item, i) => {
          const radius = 120;
          const angleRad = ((item.angle - 90) * Math.PI) / 180;
          const x = Math.cos(angleRad) * radius + 150;
          const y = Math.sin(angleRad) * radius + 150;

          return (
            <button
              key={item.id}
              className="radial-item"
              onClick={() => {
                if (item.id === 'noticias') setCurrentView('news');
                else if (item.id === 'cartera' || item.id === 'banking') setCurrentView('banking');
                else if (item.id === 'mensajes') setCurrentView('Mensajería');
                else if (item.id === 'fondo') { setShowWallpaperCatalog(true); setIsMenuOpen(false); }
                else if (item.id === 'comercio') { setShowLayoutPanel(true); setIsMenuOpen(false); }
                else if (item.id === 'qrscan') { setShowQRScannerCamera(true); setIsMenuOpen(false); }
                else setCurrentView(item.id);
                setIsMenuOpen(false);
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.25)';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255,255,255,0.8), 0 0 20px rgba(0,200,160,0.7), 0 0 40px rgba(0,180,230,0.4)';
                const lbl = e.currentTarget.querySelector('.radial-label') as HTMLElement;
                if (lbl) { lbl.style.opacity = '1'; lbl.style.transform = 'translateY(0px) scale(1)'; }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.25)';
                const lbl = e.currentTarget.querySelector('.radial-label') as HTMLElement;
                if (lbl) { lbl.style.opacity = '0'; lbl.style.transform = 'translateY(4px) scale(0.9)'; }
              }}
              style={{
                position: 'absolute',
                left: `${x - 28}px`,
                top: `${y - 28}px`,
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: gradients[i],
                border: '2.5px solid #000000',
                color: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
                outline: 'none',
                pointerEvents: 'auto',
                boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                transition: 'transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s ease',
                animationDelay: `${i * 0.04}s`,
                zIndex: 1,
              }}
            >
              {renderIcon(item.id, 18)}
              <span className="radial-label" style={{
                position: 'absolute',
                bottom: '-22px',
                left: '50%',
                transform: 'translateX(-50%) translateY(4px) scale(0.9)',
                fontSize: '8px',
                fontWeight: '700',
                color: '#ffffff',
                whiteSpace: 'nowrap',
                background: 'rgba(0,0,0,0.65)',
                backdropFilter: 'blur(6px)',
                padding: '2px 6px',
                borderRadius: '6px',
                opacity: 0,
                transition: 'opacity 0.15s ease, transform 0.15s ease',
                pointerEvents: 'none',
                letterSpacing: '0.3px'
              }}>{item.label}</span>
            </button>
          );
        })}
      </div>
      </>
    );
  };

  // Renderizar botan de home flotante - DRAGGABLE
  const renderHomeButton = () => {
    // No mostrar en home ni en Mensajería
    if (currentView === 'home' || currentView === 'Mensajería') {
      return null;
    }

    const handleMouseDown = (e: React.MouseEvent) => {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - homeButtonPos.x,
        y: e.clientY - homeButtonPos.y
      });
    };

    const handleTouchStart = (e: React.TouchEvent) => {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragOffset({
        x: touch.clientX - homeButtonPos.x,
        y: touch.clientY - homeButtonPos.y
      });
    };

    return (
      <button
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onClick={(e) => {
          if (!isDragging) {
            setCurrentView('home');
          }
        }}
        style={{
          position: 'fixed',
          left: `${homeButtonPos.x}px`,
          top: `${homeButtonPos.y}px`,
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.9), rgba(59, 130, 246, 0.9))',
          border: '1.5px solid rgba(255, 255, 255, 0.3)',
          color: '#0d0d0d',
          cursor: isDragging ? 'grabbing' : 'grab',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001,
          boxShadow: '0 3px 12px rgba(16, 185, 129, 0.5), 0 0 20px rgba(59, 130, 246, 0.3)',
          outline: 'none',
          touchAction: 'none',
          userSelect: 'none'
        }}
      >
        <svg style={{ width: '16px', height: '16px', stroke: 'currentColor', fill: 'none', strokeWidth: 2, pointerEvents: 'none' }} viewBox="0 0 24 24">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      </button>
    );
  };
  const renderFloatingButton = () => {
    if (currentView !== 'home') {
      return null;
    }

    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          
          setIsMenuOpen(!isMenuOpen);
        }}
        style={{
          position: 'fixed',
          bottom: 'calc(49px + env(safe-area-inset-bottom, 0px) + 24px)',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '65px',
          height: '65px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(59, 130, 246, 0.95))',
          border: '2px solid #000000',
          color: '#0d0d0d',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001,
          boxShadow: '0 4px 20px rgba(16, 185, 129, 0.5), 0 0 40px rgba(59, 130, 246, 0.3)',
          outline: 'none',
          transition: 'transform 0.2s ease'
        }}
      >
        <div style={{
          transform: isMenuOpen ? 'rotate(45deg)' : 'rotate(0deg)',
          transition: 'transform 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {isMenuOpen ? renderIcon('close', 28) : renderIcon('plus', 28)}
        </div>
      </button>
    );
  };
  // Renderizar NAVEGACION inferior - OPTIMIZADA PARA Móvil
  const renderBottomNavigation = () => {
    // En tablet/desktop la navegación es la sidebar — no mostrar bottom nav
    if (!device.isMobile) return null;
    const allViews = ['home', 'Mensajería', 'monedero', 'servicios', 'ajustes', 'Lia-25', 'estados', 'apuestas', 'cemac', 'mitaxi'];
    if (!allViews.includes(currentView)) return null;
    if (currentView === 'Mensajería' && selectedChat) return null;

    const navItems = [
      { id: 'Mensajería', label: 'Mensajería', icon: 'mensajes' },
      { id: 'monedero',   label: 'Cartera',    icon: 'wallet'   },
      { id: 'servicios',  label: 'Servicios',  icon: 'services' },
      { id: 'ajustes',    label: 'Ajustes',    icon: 'ajustes'  },
    ];

    return (
      <>
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(90deg, #00c8a0 0%, #00b4e6 100%)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-around',
          zIndex: 1000, borderTop: '0.5px solid rgba(255,255,255,0.25)',
          boxShadow: '0 -1px 0 rgba(0,0,0,0.1)',
          paddingTop: '6px',
          paddingBottom: 'calc(8px + env(safe-area-inset-bottom, 0px))',
          minHeight: '49px',
        }}>
          {navItems.map((item) => (
            <button key={item.id} onClick={() => {
              if (item.id === 'servicios') {
                if (currentView === 'servicios') { setCurrentView(previousView); }
                else { setPreviousView(currentView); setCurrentView('servicios'); }
              } else { setCurrentView(item.id); }
            }} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', padding: 0, outline: 'none', flex: 1, height: '100%', WebkitTapHighlightColor: 'transparent' }}>
              <div style={{ color: currentView === item.id ? '#fff' : 'rgba(255,255,255,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px' }}>
                {renderIcon(item.icon, 28)}
              </div>
              <span style={{ fontSize: '10px', fontWeight: currentView === item.id ? '600' : '400', color: currentView === item.id ? '#fff' : 'rgba(255,255,255,0.65)', lineHeight: 1, letterSpacing: '0.2px' }}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </>
    );
  };

  // Renderizar vista principal - PÁGINA DE INICIO CON SOPORTE DE LAYOUTS
  const renderHomeView = () => {
    const containerStyle: React.CSSProperties = {
      paddingTop: viewPadding.top,
      paddingLeft: '16px',
      paddingRight: '16px',
      paddingBottom: 'calc(49px + env(safe-area-inset-bottom, 0px) + 8px)',
      height: '100vh',
      overflowY: 'auto',
      background: 'transparent'
    };

    // Layout: Minimal ? solo saldo y botones
    if (homeLayout === 'minimal') return (
      <div style={containerStyle}>
        <div style={{ background: 'linear-gradient(135deg,#1A3A6B,#0E5F8A,#0A7A8A)', borderRadius: '20px', padding: '20px 18px 18px', border: 'none', boxShadow: '0 6px 24px rgba(14,95,138,0.25)' }}>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', marginBottom: '6px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>Saldo disponible</div>
          <div style={{ fontSize: '32px', fontWeight: '800', color: '#fff', marginBottom: '18px', letterSpacing: '-1px', cursor: 'pointer' }} onClick={() => toggleBalanceVisible('home-minimal')}>
          {isBalanceVisible('home-minimal') ? <>{userBalance.toLocaleString()} <span style={{ fontSize: '14px', fontWeight: '600', color: 'rgba(255,255,255,0.6)' }}>XAF</span></> : <span style={{ letterSpacing: '4px', color: 'rgba(255,255,255,0.4)' }}>● ● ● ●</span>}
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginLeft: '8px' }}>{isBalanceVisible('home-minimal') ? '🙈' : '👁'}</span>
        </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setCurrentView('monedero')} style={{ flex: 1, background: 'rgba(255,255,255,0.92)', border: 'none', color: '#1A2B4A', padding: '11px', borderRadius: '12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', outline: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
              <div style={{ width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#92400E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 17 12 21 8 17"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/></svg>
              </div>
              RECARGAR
            </button>
            <button onClick={() => setCurrentView('monedero')} style={{ flex: 1, background: 'rgba(255,255,255,0.92)', border: 'none', color: '#1A2B4A', padding: '11px', borderRadius: '12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', outline: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
              <div style={{ width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#065F46" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </div>
              ENVIAR
            </button>
          </div>
        </div>
      </div>
    );

    // Layout: Compacto - accesos rpidos en grid
    if (homeLayout === 'compact') return (
      <div style={containerStyle}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          {[
            { label: 'Mensajes', icon: 'mensajes', view: 'Mensajería', color: '#00b4e6' },
            { label: 'Cartera', icon: 'wallet', view: 'monedero', color: '#00c8a0' },
            { label: 'Servicios', icon: 'services', view: 'servicios', color: '#8b5cf6' },
            { label: 'Noticias', icon: 'noticias', view: 'news', color: '#ef4444' },
            { label: 'ID Digital', icon: 'id-card', view: 'id-digital', color: '#f59e0b' },
            { label: 'Ajustes', icon: 'ajustes', view: 'ajustes', color: '#6b7280' },
          ].map(item => (
            <button key={item.view} onClick={() => setCurrentView(item.view)}
              style={{ background: 'rgba(243,244,246,0.85)', border: `1.5px solid ${item.color}30`, borderRadius: '12px', padding: '16px 8px', cursor: 'pointer', outline: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div style={{ color: item.color }}>{renderIcon(item.icon, 22)}</div>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#0d0d0d' }}>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    );

    // Layout: Noticias - noticias en portada
    if (homeLayout === 'news') return (
      <div style={containerStyle}>
        <div style={{ background: 'rgba(243,244,246,0.85)', borderRadius: '12px', padding: '14px', marginBottom: '12px', border: '1px solid rgba(0,0,0,0.07)' }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>SALDO</div>
          <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#0d0d0d' }}>45.200 XAF</div>
        </div>
        <div style={{ fontSize: '12px', fontWeight: '700', color: '#0d0d0d', marginBottom: '10px' }}>LTIMAS NOTICIAS</div>
        {['Nuevas inversiones en Malabo', 'Actualización del sistema bancario', 'Festival cultural de Bata'].map((n, i) => (
          <button key={i} onClick={() => setCurrentView('news')}
            style={{ width: '100%', background: 'rgba(243,244,246,0.85)', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '10px', padding: '12px', marginBottom: '8px', cursor: 'pointer', outline: 'none', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
            <span style={{ fontSize: '12px', color: '#0d0d0d', fontWeight: '500' }}>{n}</span>
          </button>
        ))}
      </div>
    );

    // Layout: Finanzas - enfocado en cartera
    if (homeLayout === 'finance') return (
      <div style={containerStyle}>
        <div style={{ background: 'linear-gradient(135deg,#1A3A6B,#0E5F8A,#0A7A8A)', borderRadius: '16px', padding: '16px', marginBottom: '12px', boxShadow: '0 6px 24px rgba(14,95,138,0.25)' }}>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', marginBottom: '4px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>Saldo Total</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#fff', marginBottom: '14px', letterSpacing: '-1px', cursor: 'pointer' }} onClick={() => toggleBalanceVisible('home-finance')}>
          {isBalanceVisible('home-finance') ? <>{userBalance.toLocaleString()} <span style={{ fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.6)' }}>XAF</span></> : <span style={{ letterSpacing: '4px', color: 'rgba(255,255,255,0.4)' }}>● ● ● ●</span>}
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginLeft: '8px' }}>{isBalanceVisible('home-finance') ? (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>) : (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>)}</span>
        </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setCurrentView('monedero')} style={{ flex: 1, background: 'rgba(255,255,255,0.92)', border: 'none', color: '#1A2B4A', padding: '9px 6px', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', outline: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
              <div style={{ width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#92400E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 17 12 21 8 17"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/></svg>
              </div>
              RECARGAR
            </button>
            <button onClick={() => setCurrentView('monedero')} style={{ flex: 1, background: 'rgba(255,255,255,0.92)', border: 'none', color: '#1A2B4A', padding: '9px 6px', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', outline: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
              <div style={{ width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#065F46" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </div>
              ENVIAR
            </button>
            <button onClick={() => setCurrentView('monedero')} style={{ flex: 1, background: 'rgba(255,255,255,0.92)', border: 'none', color: '#1A2B4A', padding: '9px 6px', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', outline: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
              <div style={{ width: '18px', height: '18px', borderRadius: '5px', background: '#F3F0FD', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#4C1D95" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="8 17 12 21 16 17"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/></svg>
              </div>
              HISTORIAL
            </button>
          </div>
        </div>
        {[{ label: 'Cuenta Principal', amount: '45.200 XAF', color: '#00c8a0' }, { label: 'Ahorros', amount: '12.000 XAF', color: '#00b4e6' }].map((acc, i) => (
          <div key={i} style={{ background: 'rgba(243,244,246,0.85)', borderRadius: '10px', padding: '12px 14px', marginBottom: '8px', border: '1px solid rgba(0,0,0,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#0d0d0d', fontWeight: '500' }}>{acc.label}</span>
            <span style={{ fontSize: '13px', fontWeight: '700', color: acc.color }}>{acc.amount}</span>
          </div>
        ))}
      </div>
    );

    // Layout por defecto y 'cards'
    return (
    <div style={{
      paddingTop: viewPadding.top, paddingLeft: viewPadding.left, paddingRight: viewPadding.right, paddingBottom: viewPadding.bottom,
      height: '100vh',
      overflow: 'hidden',
      background: 'transparent'
    }}>
      {/* Tarjeta de balance principal - Minimalista */}
      <div style={{
        background: 'linear-gradient(135deg,#1A3A6B,#0E5F8A,#0A7A8A)',
        borderRadius: '20px',
        padding: '18px 18px 16px',
        marginBottom: '12px',
        boxShadow: '0 6px 24px rgba(14,95,138,0.25)'
      }}>
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', marginBottom: '6px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>
          Saldo disponible
        </div>
        <div style={{ fontSize: '28px', fontWeight: '800', color: '#fff', marginBottom: '16px', letterSpacing: '-1px', lineHeight: 1, cursor: 'pointer', userSelect: 'none' }}
          onClick={() => toggleBalanceVisible('home-default')}>
          {isBalanceVisible('home-default')
            ? <>{userBalance.toLocaleString()} <span style={{ fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.6)' }}>XAF</span></>
            : <span style={{ letterSpacing: '4px', color: 'rgba(255,255,255,0.4)' }}>● ● ● ●</span>
          }
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginLeft: '8px' }}>{isBalanceVisible('home-default') ? (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>) : (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>)}</span>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setCurrentView('monedero')} style={{ flex: 1, background: 'rgba(255,255,255,0.92)', border: 'none', color: '#1A2B4A', padding: '9px 8px', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', outline: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
            <div style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#92400E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 17 12 21 8 17"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/></svg>
            </div>
            RECARGAR
          </button>
          <button onClick={() => setCurrentView('monedero')} style={{ flex: 1, background: 'rgba(255,255,255,0.92)', border: 'none', color: '#1A2B4A', padding: '9px 8px', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', outline: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
            <div style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#065F46" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </div>
            ENVIAR
          </button>
        </div>
      </div>

      {/* Tarjetas pequeaas - Minimalista */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <button
          onClick={() => setCurrentView('id-digital')}
          style={{
            background: 'rgba(243,244,246,0.85)',
            borderRadius: '10px',
            padding: '12px',
            border: '1px solid rgba(0,0,0,0.07)',
            color: '#0d0d0d',
            cursor: 'pointer',
            textAlign: 'left',
            outline: 'none',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px', 
            marginBottom: '6px',
            color: '#0d0d0d'
          }}>
            {renderIcon('id-card', 14)}
            <span style={{ fontSize: '14px', fontWeight: '600' }}>ID Digital</span>
          </div>
          <div style={{ 
            fontSize: '12px', 
            color: '#6b7280'
          }}>
            Verificado
          </div>
        </button>

        <button
          onClick={() => setCurrentView('news')}
          style={{
            background: 'rgba(243,244,246,0.85)',
            borderRadius: '10px',
            padding: '12px',
            border: '1px solid rgba(0,0,0,0.07)',
            color: '#0d0d0d',
            cursor: 'pointer',
            textAlign: 'left',
            outline: 'none',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px', 
            marginBottom: '6px',
            color: '#0d0d0d'
          }}>
            {renderIcon('noticias', 14)}
            <span style={{ fontSize: '14px', fontWeight: '600' }}>Noticias</span>
          </div>
          <div style={{ 
            fontSize: '12px', 
            color: '#6b7280'
          }}>
            8 nuevas
          </div>
        </button>
      </div>

      {/* Accesos rapidos ? 4 apps */}
      <div style={{ marginTop: '12px' }}>
        <div style={{ fontSize: '12px', fontWeight: '600', color: '#1a1a1a', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Apps</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', justifyItems: 'center' }}>
          {[
            { id: 'estados',  label: 'Estados',  img: asset('/assets/apps/estados.png') },
            { id: 'apuestas', label: 'Juegos',   img: asset('/assets/apps/apuestas.png') },
            { id: 'cemac',    label: 'Cemac',    img: asset('/assets/apps/cemac.png') },
            { id: 'mitaxi',   label: 'MiTaxi',   img: asset('/assets/apps/mitaxi.png') },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => { setPreviousView(currentView); setCurrentView(item.id); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', outline: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '4px 0', width: '100%', transition: 'all 0.25s ease', WebkitTapHighlightColor: 'transparent' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px) scale(1.05)'; const icon = e.currentTarget.querySelector('div[style*="rgba(255,255,255,0.18)"]') as HTMLElement; if (icon) icon.style.boxShadow = '0 8px 24px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.6), 0 0 12px rgba(0,174,255,0.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; const icon = e.currentTarget.querySelector('div[style*="rgba(255,255,255,0.18)"]') as HTMLElement; if (icon) icon.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -1px 0 rgba(0,0,0,0.06)'; }}
              onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.95)'; }}
              onMouseUp={e => { e.currentTarget.style.transform = 'translateY(-4px) scale(1.05)'; }}
            >
              {/* App icon container — estilo cristalino */}
              <div style={{
                position: 'relative',
                width: 'clamp(52px, 14vw, 72px)',
                height: 'clamp(52px, 14vw, 72px)',
                borderRadius: 'clamp(13px, 3.5vw, 18px)',
                overflow: 'hidden',
                background: 'rgba(255,255,255,0.18)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -1px 0 rgba(0,0,0,0.06)',
                border: '1px solid rgba(255,255,255,0.35)',
                flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <img
                  src={item.img}
                  alt={item.label}
                  style={{ width: '70%', height: '70%', objectFit: 'contain', display: 'block', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}
                />
              </div>
              <span style={{ fontSize: 'clamp(10px, 2.8vw, 13px)', color: '#1a1a1a', fontWeight: '700', textAlign: 'center', lineHeight: '1.2', maxWidth: 'clamp(52px, 14vw, 72px)', letterSpacing: '0.1px' }}>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
  };

  // Renderizar vista de servicios ? estilo EGCHAT
  const renderServicesView = () => {
    const Btn = ({ label, icon, color, onClick }: { label: string; icon: string; color: string; onClick: () => void }) => (
      <button
        onClick={onClick}
        className="svc-btn"
        style={{ background: 'none', border: 'none', cursor: 'pointer', outline: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '10px 6px 8px', transition: 'transform 0.15s ease' }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; }}
        onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.93)'; }}
        onMouseUp={e => { e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)'; }}
      >
        {/* Contenedor icono sin fondo, icono 34px */}
        <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: color }}>
          {renderIcon(icon, 34)}
        </div>
        <span style={{ fontSize: '13px', color: '#374151', fontWeight: '500', textAlign: 'center', lineHeight: 1.3, maxWidth: '66px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
      </button>
    );

    const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
      <div style={{ background: '#FFFFFF', borderRadius: '14px', marginBottom: '10px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #F0F2F5' }}>
        <div style={{ padding: '10px 14px 6px', borderBottom: '1px solid #F3F4F6' }}>
          <span style={{ fontSize: '12px', fontWeight: '600', color: '#9CA3AF' }}>{title}</span>
        </div>
        {/* 4 columnas */}
        <div style={{ display: 'grid', gridTemplateColumns: device.isDesktop ? 'repeat(6, 1fr)' : device.isTablet ? 'repeat(5, 1fr)' : 'repeat(4, 1fr)', gap: '0', padding: '6px 4px 8px' }}>
          {children}
        </div>
      </div>
    );

    return (
      <div style={{ padding: `${device.isMobile ? '56px' : '60px'} 0 0`, height: '100vh', display: 'flex', flexDirection: 'column', background: '#F7F8FA', }}>
        <div style={{ padding: '10px 16px 8px', background: '#FFFFFF', borderBottom: '1px solid #F0F2F5', flexShrink: 0 }}>
          <span style={{ fontSize: '17px', fontWeight: '700', color: '#111827' }}>Servicios</span>
        </div>

        <div className="scroll-container" style={{ flex: 1, overflowY: 'scroll', paddingBottom: '100px' }}>
          <div style={{ height: '8px', background: '#F7F8FA' }} />

          {/* BÁSICOS */}
          <Section title="Básicos">
            <Btn label="Recarga Tel." icon="recharge" color="#07C160" onClick={() => { setShowRechargeModal(true); }} />
            <Btn label="Internet" icon="world" color="#1485EE" onClick={() => { setShowInternetModal(true); }} />
            <Btn label="Canales" icon="services" color="#8B5CF6" onClick={() => { setCanalesScreen('home'); setShowCanalesModal(true); }} />
          </Section>
          <Section title="Servicios Financieros">
            <Btn label="Bancos" icon="banking" color="#1485EE" onClick={() => setShowBancosModal(true)} />
            <Btn label="Seguros" icon="seguros" color="#2E9E6B" onClick={() => setShowSegurosModal(true)} />
            <Btn label="Facturas" icon="factura" color="#C47D2A" onClick={() => setShowFacturasModal(true)} />
            <Btn label="Inversión" icon="invest" color="#6B5BD6" onClick={() => { setShowFinModal('invest'); setFinStep('main'); setFinData({}); }} />
            <Btn label="Tarjetas" icon="tarjeta" color="#C0392B" onClick={() => { setBancosInitScreen('cards'); setShowBancosModal(true); }} />
            <Btn label="Historial" icon="historial" color="#5A7090" onClick={() => setCurrentView('historial-completo')} />
          </Section>

          {/* SERVICIOS PÚBLICOS */}
          <Section title="Servicios Públicos">
            <Btn label="Electricidad" icon="electricidad" color="#C47D2A" onClick={() => { setShowSvcModal('elec'); setSvcStep('main'); setSvcData({}); }} />
            <Btn label="Agua" icon="rain" color="#1485EE" onClick={() => { setShowSvcModal('agua'); setSvcStep('main'); setSvcData({}); }} />
            <Btn label="Salud" icon="salud" color="#C0392B" onClick={() => setShowSaludModal(true)} />
            <Btn label="Educación" icon="edu" color="#6B5BD6" onClick={() => { setShowSvcModal('edu'); setSvcStep('main'); setSvcData({}); }} />
            <Btn label="Correos" icon="mensajes" color="#C47D2A" onClick={() => { setShowSvcModal('correos'); setSvcStep('main'); setSvcData({}); }} />
            <Btn label="Impuestos" icon="gobierno" color="#C0392B" onClick={() => { setShowSvcModal('impuestos'); setSvcStep('main'); setSvcData({}); }} />
          </Section>

          {/* SERVICIOS DIARIOS */}
          <Section title="Servicios Diarios">
            <Btn label="Supermercado" icon="comercio" color="#2E9E6B" onClick={() => setShowSuperModal(true)} />
            <Btn label="Comida" icon="money" color="#C0392B" onClick={() => { setShowSvcModal('comida'); setSvcStep('main'); setSvcData({}); }} />
            <Btn label="Restaurante" icon="restaurante" color="#C47D2A" onClick={() => { setShowSvcModal('restaurante'); setSvcStep('main'); setSvcData({}); }} />
            <Btn label="Hotel" icon="hotel" color="#1485EE" onClick={() => { setShowSvcModal('hotel'); setSvcStep('main'); setSvcData({}); }} />
            <Btn label="Vuelos" icon="vuelos" color="#6B5BD6" onClick={() => { setShowSvcModal('vuelos'); setSvcStep('main'); setSvcData({}); }} />
            <Btn label="Gasolinera" icon="gasolinera" color="#C47D2A" onClick={() => { setShowSvcModal('gasolinera'); setSvcStep('main'); setSvcData({}); }} />
            <Btn label="Tienda" icon="tienda" color="#2E9E6B" onClick={() => { setShowSvcModal('tienda'); setSvcStep('main'); setSvcData({}); }} />
            <Btn label="Lavandería" icon="lavanderia" color="#1485EE" onClick={() => { setShowSvcModal('lavanderia'); setSvcStep('main'); setSvcData({}); }} />
            <Btn label="Belleza" icon="belleza" color="#C0392B" onClick={() => { setShowSvcModal('belleza'); setSvcStep('main'); setSvcData({}); }} />
            <Btn label="Noticias" icon="noticias" color="#6B5BD6" onClick={() => { setShowSvcModal('noticias'); setSvcStep('main'); setSvcData({}); }} />
          </Section>

          {/* HERRAMIENTAS */}
          <Section title="Herramientas">
            <Btn label="ID Digital" icon="id-card" color="#6B5BD6" onClick={() => { setShowSvcModal('id'); setSvcStep('main'); setSvcData({}); }} />
            <Btn label="Lia-25" icon="ai" color="#1485EE" onClick={() => setCurrentView('Lia-25')} />
            <Btn label="Actividad" icon="historial" color="#0E7FA8" onClick={() => setShowActividadModal(true)} />
            <Btn label="Emergencia" icon="emergencia" color="#C0392B" onClick={() => { setShowSvcModal('emergencia'); setSvcStep('main'); setSvcData({}); }} />
            <Btn label="Ajustes" icon="ajustes" color="#5A7090" onClick={() => setCurrentView('ajustes')} />
          </Section>

        </div>
      </div>
    );
  };
  // Funcian principal de renderizado
  const renderCurrentView = () => {
    switch (currentView) {
      case 'home':
        return renderHomeView();
      case 'servicios':
        return renderServicesView();
      case 'Mensajería':
        // Si hay un chat seleccionado, mostrar la conversacin directamente
        if (selectedChat) {
          const sc = selectedChat;
          const initials = sc.initials || sc.title.split(' ').map((w: string) => w[0]).join('').slice(0,2).toUpperCase();
          const color = sc.color || '#00b4e6';
          const chatId = sc.id?.toString() || sc.title;
          const msgs = chatMessages[chatId] || [];

          // En desktop/tablet: mostrar lista de chats a la izquierda mientras el chat está abierto
          // El chat-view-container ya tiene left: 352px/580px para dejar espacio
          const addMsg = (msg: any) => {
            const key = sc.id?.toString() || sc.title;
            setChatMessages(prev => ({ ...prev, [key]: [...(prev[key] || []), msg] }));
          };
          const makeTime = () => { const n = new Date(); return `${n.getHours().toString().padStart(2,'0')}:${n.getMinutes().toString().padStart(2,'0')}`; };

          const sendChatMessage = async () => {
            if (!currentChatInput.trim()) return;
            const messageText = currentChatInput.trim();

            // MODO EDICIÓN — actualiza el mensaje existente
            if (editingMsgId) {
              setChatMessages(prev => ({ ...prev, [chatId]: (prev[chatId]||[]).map(m => m.id === editingMsgId ? { ...m, text: messageText, edited: true } : m) }));
              setCurrentChatInput('');
              setEditingMsgId(null);
              showToast('Mensaje editado', 'success');
              // Cerrar teclado en Android
              (document.activeElement as HTMLElement)?.blur();
              return;
            }

            // Cerrar teclado en Android inmediatamente al enviar
            (document.activeElement as HTMLElement)?.blur();

            playMessageSent(); vibrate(30);
            const newMsg = { id: Date.now().toString(), from: 'me' as const, text: messageText, time: makeTime(), status: 'pending' as const };
            addMsg(newMsg);
            setCurrentChatInput('');
            setShowChatEmojis(false);

            // Scroll al último mensaje
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
            
            if (chatId && chatId.includes('-') && chatId.length > 20) {
              try {
                await chatAPI.sendMessage(chatId, { text: messageText, type: 'text' });
                setChatMessages(prev => ({ ...prev, [chatId]: (prev[chatId]||[]).map(m => m.id===newMsg.id ? {...m, status:'delivered'} : m) }));
                setTimeout(() => setChatMessages(prev => ({ ...prev, [chatId]: (prev[chatId]||[]).map(m => m.id===newMsg.id ? {...m, status:'read'} : m) })), 2000);
              } catch {
                setChatMessages(prev => ({ ...prev, [chatId]: (prev[chatId]||[]).map(m => m.id===newMsg.id ? {...m, status:'pending'} : m) }));
              }
            } else {
              setTimeout(() => setChatMessages(prev => ({ ...prev, [chatId]: (prev[chatId]||[]).map(m => m.id===newMsg.id ? {...m, status:'delivered'} : m) })), 1000);
              setTimeout(() => setChatMessages(prev => ({ ...prev, [chatId]: (prev[chatId]||[]).map(m => m.id===newMsg.id ? {...m, status:'read'} : m) })), 3000);
            }
          };

          return (
            <>
            <div className="chat-view-container" style={{ position: 'fixed', top: 0, left: device.isMobile ? 0 : (device.isTablet ? '72px' : '240px'), right: 0, bottom: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 1001 }} onClick={() => { if(showChatMenu) setShowChatMenu(false); }}>
              {/* Wallpaper del chat — individual por chat, no afecta a otros */}
              {(() => {
                const activeChatWp = getActiveChatWallpaper();
                if (activeChatWp === 'none') return null;
                const custom = customWallpapers.find(w => w.id === activeChatWp);
                const wp = !custom ? wallpapers.find(w => w.id === activeChatWp) as any : null;
                if (!custom && (!wp || wp.type === 'none')) return null;
                return (
                  <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
                    {custom ? (
                      <>
                        {custom.type === 'video'
                          ? <video src={custom.url} autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <img src={custom.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        }
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.15)' }} />
                      </>
                    ) : (
                      <div style={{ position: 'absolute', inset: 0, background: wp.bg, overflow: 'hidden' }}>
                        {wp.overlay && <div style={{ position: 'absolute', inset: 0, background: wp.overlay }} />}
                        {wp.rain && (
                          <div style={{ position: 'absolute', inset: 0 }}>
                            {Array.from({ length: 55 }).map((_, i) => (
                              <div key={i} style={{ position: 'absolute', left: `${(i * 1.9) % 100}%`, top: `-${10 + (i * 7) % 30}%`, width: '1px', height: `${18 + (i * 3) % 22}px`, background: 'linear-gradient(to bottom, transparent, rgba(150,210,255,0.7))', animation: `rainDrop ${0.55 + (i % 5) * 0.12}s linear ${(i * 0.07) % 2}s infinite`, transform: 'rotate(12deg)' }} />
                            ))}
                          </div>
                        )}
                        {wp.lightning && <div style={{ position: 'absolute', inset: 0, animation: 'lightning 4s ease-in-out infinite', background: 'rgba(200,220,255,0)', pointerEvents: 'none' }} />}
                        {wp.stars && Array.from({ length: 70 }).map((_, i) => (
                          <div key={i} style={{ position: 'absolute', left: `${(i * 14.3) % 100}%`, top: `${(i * 9.7) % 65}%`, width: `${1 + (i % 3)}px`, height: `${1 + (i % 3)}px`, borderRadius: '50%', background: 'white', opacity: 0.3 + (i % 7) * 0.1, animation: `pulse ${1.5 + (i % 4) * 0.5}s ease-in-out ${(i * 0.13) % 2}s infinite` }} />
                        ))}
                        {wp.particles && Array.from({ length: 20 }).map((_, i) => (
                          <div key={i} style={{ position: 'absolute', left: `${(i * 5.3) % 100}%`, top: `${(i * 7.1) % 100}%`, width: `${4 + (i % 4) * 2}px`, height: `${4 + (i % 4) * 2}px`, borderRadius: '50%', background: i % 2 === 0 ? 'rgba(0,200,160,0.6)' : 'rgba(0,180,230,0.6)', animation: `pulse ${2 + (i % 3)}s ease-in-out ${(i * 0.2) % 2}s infinite`, filter: 'blur(1px)' }} />
                        ))}
                        {wp.waves && (
                          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '120px' }}>
                            {[0, 1, 2].map(i => (
                              <div key={i} style={{ position: 'absolute', bottom: `${i * 20}px`, left: '-50%', width: '200%', height: '60px', background: `rgba(14,165,233,${0.15 - i * 0.04})`, borderRadius: '50%', animation: `wave ${3 + i}s ease-in-out ${i * 0.5}s infinite alternate` }} />
                            ))}
                          </div>
                        )}
                        {wp.floating && Array.from({ length: 12 }).map((_, i) => (
                          <div key={i} style={{ position: 'absolute', left: `${(i * 8.5) % 90}%`, top: `${20 + (i * 6.3) % 60}%`, fontSize: `${10 + (i % 3) * 4}px`, animation: `pulse ${2 + (i % 3)}s ease-in-out ${(i * 0.3) % 2}s infinite`, opacity: 0.6 }}>
                            {['🌸', '✨', '🌿', '💫', '🌺'][i % 5]}
                          </div>
                        ))}
                        {wp.logo && (
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', opacity: 0.15, pointerEvents: 'none' }}>
                            <img src="/logo-transparent.png" alt="" style={{ width: '140px', height: '140px', borderRadius: '50%', filter: wp.logoGlow ? 'drop-shadow(0 0 30px rgba(0,200,160,0.9))' : 'drop-shadow(0 0 10px rgba(255,255,255,0.3))' }} />
                            <div style={{ fontSize: '28px', fontWeight: '900', color: 'white', letterSpacing: '4px' }}>EGCHAT</div>
                          </div>
                        )}
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)' }} />
                      </div>
                    )}
                  </div>
                );
              })()}
              {/* Header conversacin */}
              <div style={{ 
                position: device.isMobile ? 'relative' : 'fixed',
                top: device.isMobile ? 'auto' : 0,
                left: device.isMobile ? 'auto' : (device.isTablet ? '72px' : '240px'),
                right: device.isMobile ? 'auto' : 0,
                zIndex: 1002,
                display: 'flex', alignItems: 'center', 
                paddingTop: device.isMobile ? 'max(28px, env(safe-area-inset-top, 28px))' : '10px', 
                paddingLeft: '4px', paddingRight: '8px', paddingBottom: '10px', 
                background: 'linear-gradient(135deg, #00b4e6 0%, #0088cc 100%)', 
                borderBottom: 'none', flexShrink: 0, 
                boxShadow: '0 2px 12px rgba(0,180,230,0.3)' 
              }}>
                <button
                  onClick={() => { setSelectedChat(null); setShowChatEmojis(false); setCurrentChatInput(''); setShowChatMenu(false); setSelectionMode(false); setSelectedMsgIds([]); }}
                  style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', outline: 'none', padding: '5px', display: 'flex', borderRadius: '50%', flexShrink: 0 }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <div style={{ cursor: 'pointer', flexShrink: 0, marginLeft: '4px' }} onClick={async () => {
                  setShowContactProfile(sc);
                  if (sc.isGroup) await loadGroupMembers(sc.id?.toString() || '');
                }}>
                  <Avatar name={sc.title} size={50} status={sc.status as any} showStatus={!sc.isGroup} photo={sc.avatarUrl} />
                </div>
                <div style={{ flex: 1, cursor: 'pointer', minWidth: 0, marginLeft: '10px' }} onClick={async () => {
                  setShowContactProfile(sc);
                  if (sc.isGroup) await loadGroupMembers(sc.id?.toString() || '');
                }}>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>{sc.title}</div>
                  <div
                    style={{ fontSize: '11px', fontWeight: '600', color: sc.isGroup ? 'rgba(255,255,255,0.85)' : sc.status === 'online' ? '#a8ffdd' : sc.status === 'away' ? '#ffe08a' : 'rgba(255,255,255,0.6)', cursor: sc.isGroup ? 'pointer' : 'default', textDecoration: sc.isGroup ? 'underline' : 'none', textDecorationColor: 'rgba(255,255,255,0.4)' }}
                    onClick={sc.isGroup ? async (e) => {
                      e.stopPropagation();
                      setShowGroupMembersPanel(true);
                      setLoadingGroupMembers(true);
                      try {
                        const chatId = sc.id?.toString() || '';
                        await loadGroupMembers(chatId);
                      } catch { setGroupMembersList([]); }
                      setLoadingGroupMembers(false);
                    } : undefined}
                  >
                    {sc.isGroup ? `👥 ${sc.members || ''} miembros  -  Ver` : sc.status === 'online' ? '● En línea' : sc.status === 'away' ? '● Ausente' : '○ Desconectado'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0px', alignItems: 'center', flexShrink: 0 }}>
                  {/* Llamada de audio */}
                  <button onClick={() => startCall('audio', sc)}
                    style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', outline: 'none', padding: '7px', display: 'flex', borderRadius: '50%' }}>
                    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                  </button>
                  {/* Videollamada */}
                  <button onClick={() => startCall('video', sc)}
                    style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', outline: 'none', padding: '7px', display: 'flex', borderRadius: '50%' }}>
                    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="23 7 16 12 23 17 23 7"/>
                      <rect x="1" y="5" width="15" height="14" rx="2"/>
                    </svg>
                  </button>
                  {/* Camara */}
                  <button onClick={() => { setLiveCameraChatId(sc.id?.toString()||''); setShowLiveCamera(true); }}
                    style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', outline: 'none', padding: '7px', display: 'flex', borderRadius: '50%' }}>
                    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                      <circle cx="12" cy="13" r="4"/>
                    </svg>
                  </button>
                  {/* Tres puntos */}
                  <button onClick={e => { e.stopPropagation(); setShowChatMenu(p => !p); }}
                    style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', outline: 'none', padding: '7px', display: 'flex', borderRadius: '50%' }}>
                    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Dropdown men del chat  cae desde arriba */}
              {showChatMenu && (
                <div style={{position:'fixed',inset:0,zIndex:200}} onClick={()=>setShowChatMenu(false)}>
                  <div style={{position:'absolute',top:'calc(60px + env(safe-area-inset-top, 0px))',right:'8px',background:'rgba(255,255,255,0.35)',backdropFilter:'blur(28px) saturate(200%)',WebkitBackdropFilter:'blur(28px) saturate(200%)',borderRadius:'16px',boxShadow:'0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.8)',width:'240px',border:'1.5px solid rgba(255,255,255,0.6)'}}
                    onClick={e=>e.stopPropagation()}>
                    {/* Seccin principal */}
                    {[
                      {icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,label:'Ver perfil',color:'#374151',action:async ()=>{setShowChatMenu(false);setShowContactProfile(sc);if(sc.isGroup){await loadGroupMembers(sc.id?.toString()||'');}}},
                      {icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>,label:'Buscar en el chat',color:'#374151',action:()=>{setShowChatMenu(false);setShowChatSearch(true);setChatSearchQuery('');}},
                      {icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,label:'Mensajes destacados',color:'#374151',action:()=>{setShowChatMenu(false);setStarredChatId(sc.id?.toString()||'');setShowStarredModal(true);}},
                      {icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/><circle cx="12" cy="12" r="10"/></svg>,label:pinnedChats.includes(sc.id?.toString()||'')?'Desfijar chat':'Fijar chat',color:'#374151',action:()=>{const id=sc.id?.toString()||'';setPinnedChats(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);setShowChatMenu(false);}},
                    ].map((item,i)=>(
                      <button key={i} onClick={item.action} style={{width:'100%',background:'none',border:'none',padding:'10px 14px',display:'flex',alignItems:'center',gap:'10px',cursor:'pointer',outline:'none',borderBottom:'1px solid rgba(0,0,0,0.06)',textAlign:'left'}}
                        onMouseEnter={e=>{e.currentTarget.style.background='rgba(0,0,0,0.05)';}} onMouseLeave={e=>{e.currentTarget.style.background='transparent';}}><span style={{color:item.color,flexShrink:0,display:'flex'}}>{item.icon}</span>
                        <span style={{fontSize:'13px',color:item.color,fontWeight:'500'}}>{item.label}</span>
                      </button>
                    ))}
                    {/* Seccin configuración */}
                    {[
                      {icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,label:mutedChats.includes(sc.id?.toString()||'')?'Activar notificaciones':'Silenciar',color:'#374151',action:()=>{const id=sc.id?.toString()||'';setMutedChats(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);setShowChatMenu(false);}},
                      {icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>,label:'Fondo de pantalla',color:'#374151',action:()=>{setShowChatMenu(false);setShowWallpaperCatalog(true);}},
                      {icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,label:'Cifrado E2E',color:'#00c8a0',action:()=>{setShowChatMenu(false);alert('🔒 Chat cifrado de extremo a extremo.');}},
                    ].map((item,i)=>(
                      <button key={i} onClick={item.action} style={{width:'100%',background:'none',border:'none',padding:'10px 14px',display:'flex',alignItems:'center',gap:'10px',cursor:'pointer',outline:'none',borderBottom:'1px solid rgba(0,0,0,0.06)',textAlign:'left'}}
                        onMouseEnter={e=>{e.currentTarget.style.background='rgba(0,0,0,0.05)';}} onMouseLeave={e=>{e.currentTarget.style.background='transparent';}}><span style={{color:item.color,flexShrink:0,display:'flex'}}>{item.icon}</span>
                        <span style={{fontSize:'13px',color:item.color,fontWeight:'500'}}>{item.label}</span>
                      </button>
                    ))}
                    {/* Seccin acciones */}
                    {[
                      {icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,label:'Enviar dinero',color:'#374151',action:()=>{setShowChatMenu(false);setQuickTransferData({contactId:sc.id?.toString()||'',contactName:sc.title,amount:'',accountId:bankAccounts[0]?.id||''});setShowQuickTransferModal(true);}},
                      {icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,label:'Compartir contacto',color:'#374151',action:()=>{setShowChatMenu(false);const now=new Date();const time=`${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;const chatId=sc.id?.toString()||'';setChatMessages(prev=>({...prev,[chatId]:[...(prev[chatId]||[]),{id:Date.now().toString(),from:'me',text:`👤 Contacto: ${sc.title}`,time,status:'pending'}]}));}},
                      {icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,label:'Crear grupo con este contacto',color:'#374151',action:()=>{setShowChatMenu(false);setGroupMembers([{id:sc.id?.toString()||'',name:sc.title,initials:sc.initials||sc.title?.slice(0,2).toUpperCase()||'??',color:'#a855f7'}]);setShowCreateGroup(true);}},
                      {icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,label:'Exportar chat',color:'#374151',action:()=>{setShowChatMenu(false);const chatId=sc.id?.toString()||'';const msgs=chatMessages[chatId]||[];const text=msgs.map(m=>`[${m.time}] ${m.from==='me'?'Yo':sc.title}: ${m.text}`).join('\n');const blob=new Blob([text],{type:'text/plain'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`chat_${sc.title}.txt`;a.click();}},
                    ].map((item,i)=>(
                      <button key={i} onClick={item.action} style={{width:'100%',background:'none',border:'none',padding:'10px 14px',display:'flex',alignItems:'center',gap:'10px',cursor:'pointer',outline:'none',borderBottom:'1px solid rgba(0,0,0,0.06)',textAlign:'left'}}
                        onMouseEnter={e=>{e.currentTarget.style.background='rgba(0,0,0,0.05)';}} onMouseLeave={e=>{e.currentTarget.style.background='transparent';}}><span style={{color:item.color,flexShrink:0,display:'flex'}}>{item.icon}</span>
                        <span style={{fontSize:'13px',color:item.color,fontWeight:'500'}}>{item.label}</span>
                      </button>
                    ))}
                    {/* Seccin peligrosa */}
                    {[
                      {icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>,label:'Vaciar chat',color:'#F59E0B',action:()=>{if(window.confirm('Vaciar todos los mensajes?')){setChatMessages(prev=>({...prev,[sc.id?.toString()||'']:[]}));}setShowChatMenu(false);}},
                      {icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,label:'Reportar',color:'#EF4444',action:()=>{setShowChatMenu(false);alert(`"${sc.title}" reportado.`);}},
                      {icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>,label:blockedChats.includes(sc.id?.toString()||'')?'Desbloquear':'Bloquear',color:'#EF4444',action:()=>{const id=sc.id?.toString()||'';setBlockedChats(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);setShowChatMenu(false);}},
                      {icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="23" y1="11" x2="17" y2="11"/></svg>,label:'Eliminar contacto',color:'#EF4444',action:()=>{setShowChatMenu(false);if(window.confirm(`¿Eliminar a ${sc.title} de tus contactos?`)){const found=allContacts.find(c=>c.id===sc.id||c.phone===sc.phone);if(found){contactsAPI.remove(found.id).then(()=>{setAllContacts(prev=>prev.filter(c=>c.id!==found.id));setSelectedChat(null);showToast(`${sc.title} eliminado`,`info`);}).catch(()=>showToast('No se pudo eliminar.','error'));}else{setAllContacts(prev=>prev.filter(c=>c.id!==sc.id));setSelectedChat(null);showToast(`${sc.title} eliminado`,'info');}}}},
                    ].map((item,i,arr)=>(
                      <button key={i} onClick={item.action} style={{width:'100%',background:'none',border:'none',padding:'10px 14px',display:'flex',alignItems:'center',gap:'10px',cursor:'pointer',outline:'none',borderBottom:i<arr.length-1?'1px solid rgba(0,0,0,0.06)':'none',textAlign:'left'}}
                        onMouseEnter={e=>{e.currentTarget.style.background='rgba(239,68,68,0.06)';}} onMouseLeave={e=>{e.currentTarget.style.background='transparent';}}><span style={{color:item.color,flexShrink:0,display:'flex'}}>{item.icon}</span>
                        <span style={{fontSize:'13px',color:item.color,fontWeight:'500'}}>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Spacer eliminado - header ahora es sticky */}
              {/* Barra búsqueda en el chat */}
              {showChatSearch && (
                <div style={{background:'#fff',borderBottom:'1px solid #F0F2F5',padding:'8px 12px',display:'flex',alignItems:'center',gap:'8px',flexShrink:0}}>
                  <div style={{flex:1,background:'#F3F4F6',borderRadius:'10px',padding:'0 12px',height:'36px',display:'flex',alignItems:'center',gap:'8px'}}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                    <input autoFocus value={chatSearchQuery} onChange={e=>setChatSearchQuery(e.target.value)} placeholder="Buscar en el chat..." style={{flex:1,background:'none',border:'none',outline:'none',fontSize:'13px',color:'#111827',fontFamily:'inherit'}}/>
                    {chatSearchQuery&&<button onClick={()=>setChatSearchQuery('')} style={{background:'none',border:'none',color:'#9CA3AF',cursor:'pointer',fontSize:'14px',padding:0}}>?</button>}
                  </div>
                  <button onClick={()=>{setShowChatSearch(false);setChatSearchQuery('');}} style={{background:'none',border:'none',color:'#6B7280',cursor:'pointer',fontSize:'13px',fontWeight:'600',padding:'4px 8px'}}>Cancelar</button>
                </div>
              )}

              {/* Mensajes */}
              <div
                className="scroll-container chat-messages-scroll"
                ref={(el) => { if (el) { el.onscroll = () => { const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80; isAtBottomRef.current = atBottom; }; } }}
                style={{ flex: 1, minHeight: 0, overflowY: 'scroll', overflowX: 'hidden', WebkitOverflowScrolling: 'touch' as any, padding: '10px 10px 8px', paddingTop: device.isMobile ? '10px' : '60px', display: 'flex', flexDirection: 'column', gap: '3px', position: 'relative', zIndex: 1, background: getActiveChatWallpaper() === 'none' ? '#efeae2' : 'transparent' }}
              >
                {[...msgs].filter((m,i,a)=>a.findIndex((x:any)=>x.id===m.id)===i).sort((a:any,b:any)=>{const ts=(m:any)=>{if(m.created_at){const d=new Date(m.created_at);if(!isNaN(d.getTime()))return d.getTime();}if(m.timestamp){const d=new Date(m.timestamp);if(!isNaN(d.getTime()))return d.getTime();}const n=parseInt((m.id?.toString()||"").replace(/\D/g,"")||"0");return n>1e12?n:0;};return ts(a)-ts(b);}).map((msg) => (
                  <div key={msg.id} onClick={() => { if (selectionMode) { setSelectedMsgIds(prev => prev.includes(msg.id) ? prev.filter(x => x !== msg.id) : [...prev, msg.id]); } }} style={{ display: 'flex', justifyContent: msg.from === 'me' ? 'flex-end' : 'flex-start', position: 'relative', zIndex: 1, marginBottom: '2px', alignItems: 'center', gap: '8px', padding: selectionMode ? '2px 8px' : '0', background: selectionMode && selectedMsgIds.includes(msg.id) ? 'rgba(0,180,230,0.10)' : 'transparent', borderRadius: '8px', transition: 'background 0.15s', cursor: selectionMode ? 'pointer' : 'default' }}>
                    {selectionMode && (
                      <div style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${selectedMsgIds.includes(msg.id) ? '#00b4e6' : '#ccc'}`, background: selectedMsgIds.includes(msg.id) ? '#00b4e6' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, order: msg.from === 'me' ? 1 : 0, transition: 'all 0.15s' }}>
                        {selectedMsgIds.includes(msg.id) && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                      </div>
                    )}
                    <div
                      style={{
                        maxWidth: '72%',
                        background: msg.from === 'me' ? '#d9fdd3' : '#ffffff',
                        borderRadius: msg.from === 'me' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        padding: (msg as any).type === 'image' && (msg as any).imageUrl ? '4px 4px 7px' : '9px 12px 7px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.13)',
                        position: 'relative',
                        overflow: 'hidden',
                        cursor: selectionMode ? 'pointer' : 'pointer',
                        userSelect: 'none',
                      }}
                      onContextMenu={e => { if (selectionMode) return; e.preventDefault(); setMsgContextMenu({ msg, x: e.clientX, y: e.clientY }); }}
                      onTouchStart={e => {
                        if (selectionMode) return;
                        const touch = e.touches[0];
                        const timer = setTimeout(() => setMsgContextMenu({ msg, x: touch.clientX, y: touch.clientY }), 500);
                        const cancel = () => clearTimeout(timer);
                        e.currentTarget.addEventListener('touchend', cancel, { once: true });
                        e.currentTarget.addEventListener('touchmove', cancel, { once: true });
                      }}
                    >
                      {/* -- LLAMADA -- */}
                      {(msg as any).type === 'call' ? (() => {
                        const isMissed = (msg as any).callStatus === 'missed';
                        const isVideo = (msg as any).callType === 'video';
                        const isOutgoing = (msg as any).callStatus === 'outgoing';
                        const iconColor = isMissed ? '#ef4444' : '#00c8a0';
                        const bgColor = isMissed ? 'rgba(239,68,68,0.1)' : isVideo ? 'rgba(99,102,241,0.1)' : 'rgba(0,200,160,0.1)';
                        const borderColor = isMissed ? 'rgba(239,68,68,0.3)' : isVideo ? 'rgba(99,102,241,0.4)' : 'rgba(0,200,160,0.3)';
                        return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '6px 4px', minWidth: '210px' }}>
                          {/* Icono circular */}
                          <div style={{ width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: bgColor, border: `1.5px solid ${borderColor}` }}>
                            {isMissed ? (
                              /* Llamada perdida — teléfono tachado */
                              isVideo ? (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <line x1="1" y1="1" x2="23" y2="23"/>
                                  <path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34"/>
                                </svg>
                              ) : (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.42 19.42 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.8"/>
                                  <line x1="23" y1="1" x2="1" y2="23"/>
                                </svg>
                              )
                            ) : isVideo ? (
                              /* Videollamada — cámara */
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="23 7 16 12 23 17 23 7"/>
                                <rect x="1" y="5" width="15" height="14" rx="2"/>
                              </svg>
                            ) : (
                              /* Audio llamada — teléfono */
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00c8a0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6.29 6.29l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                              </svg>
                            )}
                          </div>
                          {/* Texto */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: isMissed ? '#ef4444' : '#111827', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                              {/* Flecha dirección */}
                              {!isMissed && (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={isOutgoing ? '#6b7280' : '#00c8a0'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  {isOutgoing
                                    ? <><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></>
                                    : <><line x1="17" y1="7" x2="7" y2="17"/><polyline points="17 17 7 17 7 7"/></>
                                  }
                                </svg>
                              )}
                              {isMissed ? (isVideo ? 'Videollamada perdida' : 'Llamada perdida') : isOutgoing ? (isVideo ? 'Videollamada saliente' : 'Llamada saliente') : (isVideo ? 'Videollamada recibida' : 'Llamada recibida')}
                            </div>
                            <div style={{ fontSize: '12px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {isVideo ? (
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
                              ) : (
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6.29 6.29l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                              )}
                              {isVideo ? 'Videollamada' : 'Llamada de voz'}
                              {(msg as any).callDuration > 0 && `  -  ${String(Math.floor((msg as any).callDuration/60)).padStart(2,'0')}:${String((msg as any).callDuration%60).padStart(2,'0')}`}
                            </div>
                          </div>
                          <button onClick={() => { if (selectedChat) startCall((msg as any).callType || 'audio', selectedChat); }}
                            style={{ background: isVideo ? 'rgba(99,102,241,0.1)' : 'rgba(0,200,160,0.1)', border: `1px solid ${isVideo ? 'rgba(99,102,241,0.3)' : 'rgba(0,200,160,0.3)'}`, borderRadius: '50%', width: '34px', height: '34px', cursor: 'pointer', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isVideo ? '#6366f1' : '#00c8a0', flexShrink: 0 }}>
                            {isVideo ? (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
                            ) : (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6.29 6.29l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                            )}
                          </button>
                        </div>
                        );
                      })() : (msg as any).type === 'audio' && (msg as any).audioUrl ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '240px', maxWidth: '280px', padding: '6px 4px' }}>
                          {/* Audio element oculto */}
                          <audio
                            id={`audio-${msg.id}`}
                            src={(msg as any).audioUrl}
                            preload="metadata"
                            style={{ display: 'none' }}
                            onTimeUpdate={() => {
                              const audio = document.getElementById(`audio-${msg.id}`) as HTMLAudioElement;
                              const bar = document.getElementById(`progress-${msg.id}`) as HTMLElement;
                              const timeEl = document.getElementById(`time-${msg.id}`) as HTMLElement;
                              if (!audio || !bar) return;
                              const pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
                              bar.style.width = `${pct}%`;
                              if (timeEl) {
                                const rem = audio.duration - audio.currentTime;
                                timeEl.textContent = isNaN(rem) ? '0:00' : `${Math.floor(rem/60)}:${String(Math.floor(rem%60)).padStart(2,'0')}`;
                              }
                            }}
                            onLoadedMetadata={() => {
                              const audio = document.getElementById(`audio-${msg.id}`) as HTMLAudioElement;
                              const timeEl = document.getElementById(`time-${msg.id}`) as HTMLElement;
                              if (audio && timeEl && !isNaN(audio.duration)) {
                                timeEl.textContent = `${Math.floor(audio.duration/60)}:${String(Math.floor(audio.duration%60)).padStart(2,'0')}`;
                              }
                            }}
                            onEnded={() => {
                              const bar = document.getElementById(`progress-${msg.id}`) as HTMLElement;
                              const btn = document.getElementById(`play-btn-${msg.id}`) as HTMLElement;
                              const timeEl = document.getElementById(`time-${msg.id}`) as HTMLElement;
                              const audio = document.getElementById(`audio-${msg.id}`) as HTMLAudioElement;
                              const iconEl = document.getElementById(`play-icon-${msg.id}`);
                              if (bar) bar.style.width = '0%';
                              if (btn) btn.setAttribute('data-playing', 'false');
                              if (iconEl) iconEl.innerHTML = '<polygon points="6 3 20 12 6 21 6 3"/>';
                              if (timeEl && audio && !isNaN(audio.duration)) {
                                timeEl.textContent = `${Math.floor(audio.duration/60)}:${String(Math.floor(audio.duration%60)).padStart(2,'0')}`;
                              }
                            }}
                          />

                          {/* Bot?n play/pause */}
                          <button
                            id={`play-btn-${msg.id}`}
                            data-playing="false"
                            onClick={() => {
                              const audio = document.getElementById(`audio-${msg.id}`) as HTMLAudioElement;
                              const btn = document.getElementById(`play-btn-${msg.id}`);
                              const iconEl = document.getElementById(`play-icon-${msg.id}`);
                              if (!audio) return;
                              if (audio.paused) {
                                // Pausar todos los dems
                                document.querySelectorAll('audio').forEach(a => {
                                  if (a !== audio) {
                                    a.pause();
                                    const otherId = a.id.replace('audio-', '');
                                    const otherIcon = document.getElementById(`play-icon-${otherId}`);
                                    if (otherIcon) otherIcon.innerHTML = '<polygon points="6 3 20 12 6 21 6 3"/>';
                                    const otherBtn = document.getElementById(`play-btn-${otherId}`);
                                    if (otherBtn) otherBtn.setAttribute('data-playing', 'false');
                                  }
                                });
                                audio.play().catch(() => {});
                                btn?.setAttribute('data-playing', 'true');
                                // Cambiar a icono pause
                                if (iconEl) iconEl.innerHTML = '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>';
                              } else {
                                audio.pause();
                                btn?.setAttribute('data-playing', 'false');
                                // Cambiar a icono play
                                if (iconEl) iconEl.innerHTML = '<polygon points="6 3 20 12 6 21 6 3"/>';
                              }
                            }}
                            style={{
                              background: msg.from === 'me'
                                ? 'linear-gradient(135deg,#6ee7b7,#34d399)'
                                : 'linear-gradient(135deg,#c4b5fd,#a78bfa)',
                              border: 'none', borderRadius: '50%',
                              width: '40px', height: '40px', flexShrink: 0,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                              transition: 'transform 0.15s',
                              alignSelf: 'center',
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                          >
                            <svg id={`play-icon-${msg.id}`} width="15" height="15" viewBox="0 0 24 24" fill="#fff">
                              <polygon points="6 3 20 12 6 21 6 3"/>
                            </svg>
                          </button>

                          {/* Waveform + progreso + tiempo */}
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            {/* Barra de progreso con waveform */}
                            <div
                              style={{ position: 'relative', height: '28px', cursor: 'pointer' }}
                              onClick={(e) => {
                                const audio = document.getElementById(`audio-${msg.id}`) as HTMLAudioElement;
                                if (!audio || !audio.duration) return;
                                const rect = e.currentTarget.getBoundingClientRect();
                                const pct = (e.clientX - rect.left) / rect.width;
                                audio.currentTime = pct * audio.duration;
                              }}
                            >
                              {/* Fondo waveform esttico */}
                              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', gap: '2px', padding: '0 2px' }}>
                                {[2,4,7,5,9,6,3,8,5,7,4,6,3,5,7,4,8,5,3,6,4,7,5,8,3,5,7,4,6,3].map((h, i) => (
                                  <div key={i} style={{
                                    flex: 1, height: `${h * 2.5}px`,
                                    background: msg.from === 'me'
                                      ? 'rgba(134,239,172,0.3)'
                                      : 'rgba(196,181,253,0.35)',
                                    borderRadius: '3px',
                                  }}/>
                                ))}
                              </div>
                              {/* Progreso coloreado (clip) */}
                              <div
                                id={`progress-clip-${msg.id}`}
                                style={{ position: 'absolute', inset: 0, overflow: 'hidden', width: '0%', transition: 'width 0.1s linear' }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '2px', padding: '0 2px', height: '100%' }}>
                                  {[2,4,7,5,9,6,3,8,5,7,4,6,3,5,7,4,8,5,3,6,4,7,5,8,3,5,7,4,6,3].map((h, i) => (
                                    <div key={i} style={{
                                      flex: 1, height: `${h * 2.5}px`,
                                      background: msg.from === 'me'
                                        ? 'linear-gradient(180deg, #6ee7b7, #34d399)'
                                        : 'linear-gradient(180deg, #c4b5fd, #a78bfa)',
                                      borderRadius: '3px',
                                    }}/>
                                  ))}
                                </div>
                              </div>
                              {/* Barra de progreso invisible para el clculo */}
                              <div id={`progress-${msg.id}`} style={{ display: 'none' }}
                                ref={el => {
                                  if (el) {
                                    // Sincronizar con el clip
                                    const observer = new MutationObserver(() => {
                                      const clip = document.getElementById(`progress-clip-${msg.id}`);
                                      if (clip) clip.style.width = el.style.width;
                                    });
                                    observer.observe(el, { attributes: true, attributeFilter: ['style'] });
                                  }
                                }}
                              />
                            </div>

                            {/* Tiempo restante */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '10px', color: msg.from === 'me' ? 'rgba(134,239,172,0.9)' : 'rgba(147,197,253,0.9)', fontWeight: '600', letterSpacing: '0.3px' }}>
                                Voz
                              </span>
                              <span id={`time-${msg.id}`} style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '500', fontVariantNumeric: 'tabular-nums' }}>
                                0:00
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (msg as any).type === 'image' ? (
                        /* -- IMAGEN -- */
                        (msg as any).imageUrl ? (
                          <div style={{ cursor: 'zoom-in', borderRadius: '12px 12px 0 0', overflow: 'hidden' }} onClick={(e) => { e.stopPropagation(); setChatImageViewer((msg as any).imageUrl); }}>
                            <img src={(msg as any).imageUrl} alt="foto"
                              style={{ width: '240px', height: '200px', objectFit: 'cover', display: 'block' }}
                              onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                          </div>
                        ) : (
                          /* imageUrl vac?o ? foto no disponible (localStorage lleno) */
                          <div style={{ width: '220px', height: '120px', background: '#f3f4f6', borderRadius: '12px 12px 0 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                            <span style={{ fontSize: '11px', color: '#9ca3af' }}>Foto no disponible</span>
                          </div>
                        )
                      ) : msg.text?.startsWith('📄') || msg.text?.startsWith('📎') ? (
                        /* -- DOCUMENTO / ARCHIVO -- */
                        (() => {
                          const raw = (msg.text || '').replace(/^📄 |^📎 /, '');
                          const match = raw.match(/^(.+?) \((.+?)\)$/);
                          const fileName = match ? match[1] : raw;
                          const fileSize = match ? match[2] : '';
                          const ext = ((msg as any).fileExt || fileName.split('.').pop()?.toLowerCase() || '');
                          const extColors: Record<string,string> = { pdf:'#ef4444', doc:'#2563eb', docx:'#2563eb', xls:'#16a34a', xlsx:'#16a34a', ppt:'#ea580c', pptx:'#ea580c', txt:'#6b7280', csv:'#16a34a', zip:'#7c3aed', rar:'#7c3aed' };
                          const extColor = extColors[ext] || '#6b7280';
                          const fileUrl = (msg as any).fileUrl;
                          return (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '220px', padding: '4px 0', cursor: fileUrl ? 'pointer' : 'default' }}
                              onClick={() => { if (fileUrl) { const a = document.createElement('a'); a.href = fileUrl; a.download = fileName; a.click(); } }}>
                              <div style={{ width: '44px', height: '52px', borderRadius: '8px', background: extColor + '18', border: `1.5px solid ${extColor}40`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={extColor} strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                <span style={{ fontSize: '7px', fontWeight: '800', color: extColor, textTransform: 'uppercase', letterSpacing: '0.3px' }}>{ext}</span>
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '13px', fontWeight: '600', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>{fileName}</div>
                                <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>{fileSize}{fileSize ? ' ? ' : ''}{ext.toUpperCase()}</div>
                                <div style={{ fontSize: '11px', color: extColor, marginTop: '3px', fontWeight: '600' }}>{fileUrl ? '↓ Descargar' : 'Archivo'}</div>
                              </div>
                            </div>
                          );
                        })()
                      ) : msg.text?.startsWith('🎥') ? (
                        /* -- VIDEO -- */
                        (() => {
                          const raw = (msg.text || '').replace(/^[^\s]+ /, '');
                          const match = raw.match(/^(.+?) \((.+?)\)$/);
                          const fileName = match ? match[1] : raw;
                          const fileSize = match ? match[2] : '';
                          return (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '200px', padding: '4px 0' }}>
                              <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#8b5cf618', border: '1.5px solid #8b5cf640', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="1.8" strokeLinecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '13px', fontWeight: '600', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>{fileName}</div>
                                <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>{fileSize}{fileSize ? ' ? ' : ''}Video</div>
                              </div>
                            </div>
                          );
                        })()
                      ) : msg.text?.startsWith('👁') ? (
                        /* -- UBICACIN -- */
                        (() => {
                          const lines = (msg.text || '').split('\n');
                          const label = lines[0].replace('💸 ', '');
                          const link = lines[1] || '';
                          // Extraer coordenadas del link para el mapa esttico
                          const coordMatch = link.match(/q=(-?\d+\.\d+),(-?\d+\.\d+)/);
                          const lat = coordMatch?.[1] || '3.7520';
                          const lng = coordMatch?.[2] || '8.7735';
                          const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
                          const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
                          const staticMapUrl = `https://api.maptiler.com/maps/streets-v2/static/${lng},${lat},15/300x120.png?key=bg3FUa7es7Qn1TITIWjO&markers=icon:pin-s-red+${lng},${lat}`;
                          return (
                            <div style={{ minWidth: '220px', cursor: 'pointer' }} onClick={() => window.open(mapsUrl, '_blank')}>
                              {/* Mini mapa */}
                              <div style={{ borderRadius: '10px 10px 0 0', height: '110px', overflow: 'hidden', position: 'relative', background: 'linear-gradient(135deg,#e8f5e9,#e3f2fd)' }}>
                                <img src={staticMapUrl} alt="mapa"
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  onError={e => { (e.target as HTMLImageElement).style.display='none'; }}
                                />
                                {/* Pin overlay */}
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                                  <svg width="28" height="36" viewBox="0 0 24 32" fill="none">
                                    <path d="M12 0C7.58 0 4 3.58 4 8c0 5.25 8 16 8 16s8-10.75 8-16c0-4.42-3.58-8-8-8z" fill="#ef4444"/>
                                    <circle cx="12" cy="8" r="3" fill="#fff"/>
                                  </svg>
                                </div>
                              </div>
                              {/* Info + botones */}
                              <div style={{ padding: '8px 10px 4px', background: 'rgba(0,0,0,0.02)', borderRadius: '0 0 10px 10px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                                <div style={{ fontSize: '13px', fontWeight: '600', color: '#111827', marginBottom: '6px' }}>{label}</div>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <a href={mapsUrl} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                                    style={{ flex: 1, background: '#e3f2fd', borderRadius: '6px', padding: '5px 8px', fontSize: '11px', fontWeight: '600', color: '#1565c0', textDecoration: 'none', textAlign: 'center' }}>
                                    🗺️ Ver mapa
                                  </a>
                                  <a href={directionsUrl} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                                    style={{ flex: 1, background: '#e8f5e9', borderRadius: '6px', padding: '5px 8px', fontSize: '11px', fontWeight: '600', color: '#2e7d32', textDecoration: 'none', textAlign: 'center' }}>
                                    📍 Cómo llegar
                                  </a>
                                </div>
                              </div>
                            </div>
                          );
                        })()
                      ) : msg.text?.startsWith('👁') ? (
                        /* -- CONTACTO  siempre abre modal con opciones -- */
                        (() => {
                          const lines = (msg.text || '').split('\n');
                          const name = lines[0].replace('💸 ', '');
                          const phone = lines[1]?.replace('💸 ', '') || '';
                          const avatar = (msg as any).contactAvatar || '';
                          const found = allContacts.find(c => c.phone === phone || c.name === name);
                          const isAlreadyContact = !!found;
                          // Construir objeto de perfil con los datos disponibles
                          const contactProfile = found
                            ? { id: found.id, title: found.name, phone: found.phone, avatarUrl: found.avatarUrl, status: found.status }
                            : { id: phone, title: name, phone, avatarUrl: avatar, status: 'offline' as const };
                          return (
                            <div style={{ minWidth: '220px' }}>
                              {/* Tarjeta ? toca para abrir perfil completo */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '6px 0 8px', cursor: 'pointer' }}
                                onClick={() => setShowContactProfile(contactProfile)}>
                                <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'linear-gradient(135deg,#00c8a0,#00b4e6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                                  {avatar
                                    ? <img src={avatar} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                                    : <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                  }
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#111827' }}>{name}</div>
                                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '1px' }}>{phone}</div>
                                  {isAlreadyContact && <div style={{ fontSize: '11px', color: '#00c8a0', fontWeight: '600', marginTop: '2px' }}>✓ En tus contactos</div>}
                                </div>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                              </div>
                              {/* Separador */}
                              <div style={{ height: '1px', background: 'rgba(0,0,0,0.08)', margin: '0 -12px' }}/>
                              {/* Acciones rapidas */}
                              <div style={{ display: 'flex', gap: '8px', padding: '8px 0 2px' }}>
                                <button onClick={() => setShowContactProfile(contactProfile)}
                                  style={{ flex: 1, background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0', fontSize: '12px', fontWeight: '700', color: '#6b7280', outline: 'none', textAlign: 'center' }}>
                                  👤 Ver perfil
                                </button>
                                {!isAlreadyContact && (
                                  <button onClick={() => {
                                    if (phone) {
                                      contactsAPI.add(undefined, phone, name)
                                        .then(async () => { showToast(`? ${name} aadido`, 'success'); await loadContacts(); })
                                        .catch(() => showToast('No se pudo añadir.', 'error'));
                                    }
                                  }} style={{ flex: 1, background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0', fontSize: '12px', fontWeight: '700', color: '#00c8a0', outline: 'none', textAlign: 'center' }}>
                                    + Añadir
                                  </button>
                                )}
                                {isAlreadyContact && (
                                  <button onClick={() => {
                                    if (found && window.confirm(`?Eliminar a ${name}?`)) {
                                      contactsAPI.remove(found.id)
                                        .then(() => { setAllContacts(prev => prev.filter(c => c.id !== found.id)); showToast(`${name} eliminado`, 'info'); })
                                        .catch(() => showToast('No se pudo eliminar.', 'error'));
                                    }
                                  }} style={{ flex: 1, background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0', fontSize: '12px', fontWeight: '700', color: '#ef4444', outline: 'none', textAlign: 'center' }}>
                                    🗑️ Eliminar
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })()
                      ) : (
                        /* -- TEXTO NORMAL o DINERO -- */
                        msg.text?.startsWith('🎵') ? (() => {
                          // Burbuja de transferencia de dinero
                          const lines = (msg.text || '').split('\n');
                          const amount = lines[1]?.replace('💸 ', '') || '';
                          const recipient = lines[2]?.replace('💸 ', '') || '';
                          const code = lines[3]?.replace('🔑 Código: ', '') || '';
                          const status = lines[4]?.replace('💸 ', '') || '';
                          return (
                            <div style={{ minWidth: '220px' }}>
                              <div style={{ background: 'linear-gradient(135deg,#00c8a0,#00b4e6)', borderRadius: '10px', padding: '12px 14px', marginBottom: '6px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                                  </div>
                                  <div>
                                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)', fontWeight: '600' }}>Transferencia enviada</div>
                                    <div style={{ fontSize: '18px', fontWeight: '800', color: '#fff' }}>{amount}</div>
                                  </div>
                                </div>
                                {recipient && <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)' }}>Para: {recipient}</div>}
                              </div>
                              {code && (
                                <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '8px 10px', border: '1px solid #e5e7eb' }}>
                                  <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '3px', fontWeight: '600', textTransform: 'uppercase' }}>Codigo de confirmacion</div>
                                  <div style={{ fontSize: '16px', fontWeight: '800', color: '#111827', letterSpacing: '3px', fontFamily: 'monospace' }}>{code}</div>
                                  <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px' }}>Comparte este codigo con el destinatario</div>
                                </div>
                              )}
                              {status && <div style={{ fontSize: '11px', color: '#22c55e', marginTop: '4px', fontWeight: '600' }}>{status}</div>}
                            </div>
                          );
                        })()
                        : <div style={{ fontSize: '15px', color: '#111827', lineHeight: '1.5', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                      )}

                      {/* Hora + estado */}
                      <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px', textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px',
                        padding: (msg as any).type === 'image' && (msg as any).imageUrl ? '0 8px' : '0' }}>
                        <span>{msg.time}</span>
                        {msg.from === 'me' && showReadReceipts && (
                          <span style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block', flexShrink: 0 }}/>
                            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: msg.status === 'delivered' || msg.status === 'read' ? '#22c55e' : 'rgba(34,197,94,0.25)', display: 'inline-block', flexShrink: 0 }}/>
                            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: msg.status === 'read' ? '#00b4e6' : 'rgba(0,180,230,0.25)', display: 'inline-block', flexShrink: 0 }}/>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Panel adjuntar */}
              {showChatAttach && (
                <div style={{ background: '#FFFFFF', borderTop: '1px solid rgba(0,0,0,0.07)', padding: '14px 16px', flexShrink: 0 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                    {[
                      {
                        label: 'Foto', color: '#00b4e6', bg: '#E0F7FF',
                        icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00b4e6" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
                        action: () => {
                          setShowChatAttach(false);
                          const key = sc.id?.toString() || sc.title;
                          const chatId = sc.id?.toString() || '';
                          const inp = document.createElement('input');
                          inp.type='file'; inp.accept='image/*'; inp.style.display='none';
                          document.body.appendChild(inp);
                          inp.onchange = async () => {
                            const file = inp.files?.[0];
                            document.body.removeChild(inp);
                            if (!file) return;
                            const t = new Date();
                            const tm = `${t.getHours().toString().padStart(2,'0')}:${t.getMinutes().toString().padStart(2,'0')}`;
                            const msgId = Date.now().toString();
                            // Mostrar preview local inmediatamente
                            const localUrl = URL.createObjectURL(file);
                            setChatMessages(prev => ({ ...prev, [key]: [...(prev[key]||[]), { id: msgId, from: 'me' as const, text: '📷 Foto', time: tm, timestamp: new Date().toISOString(), created_at: new Date().toISOString(), status: 'pending' as const, type: 'image', imageUrl: localUrl } as any] }));
                            try {
                              // Subir al servidor
                              const result = await chatAPI.uploadFile(chatId, file);
                              const serverUrl = result.file_url;
                              // Enviar mensaje al backend con la URL real
                              const sent = await chatAPI.sendMessage(chatId, { text: '📷 Foto', type: 'image', file_url: serverUrl });
                              // Reemplazar ID local con ID del servidor para evitar duplicados en el polling
                              const serverId = sent?.id || msgId;
                              setChatMessages(prev => ({ ...prev, [key]: (prev[key]||[]).map(m => m.id === msgId ? { ...m, id: serverId, imageUrl: serverUrl, status: 'delivered' } : m) }));
                            } catch (e) {
                              // Fallback: usar base64 local si el servidor falla
                              try {
                                const reader = new FileReader();
                                reader.onload = async () => {
                                  const base64Url = reader.result as string;
                                  // Enviar con la URL local como fallback
                                  const sent = await chatAPI.sendMessage(chatId, { text: '📷 Foto', type: 'image', file_url: localUrl });
                                  const serverId = sent?.id || msgId;
                                  setChatMessages(prev => ({ ...prev, [key]: (prev[key]||[]).map(m => m.id === msgId ? { ...m, id: serverId, imageUrl: localUrl, status: 'delivered' } : m) }));
                                };
                                reader.readAsDataURL(file);
                              } catch {
                                // Mantener la imagen local visible aunque no se suba al servidor
                                setChatMessages(prev => ({ ...prev, [key]: (prev[key]||[]).map(m => m.id === msgId ? { ...m, imageUrl: localUrl, status: 'delivered' } : m) }));
                                showToast('Foto guardada localmente', 'info');
                              }
                            }
                          };
                          inp.click();
                        }
                      },
                      {
                        label: 'Video', color: '#f59e0b', bg: '#FEF3C7',
                        icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>,
                        action: () => {
                          setShowChatAttach(false);
                          const key = sc.id?.toString() || sc.title;
                          const chatId = sc.id?.toString() || '';
                          const inp = document.createElement('input');
                          inp.type='file'; inp.accept='video/*'; inp.style.display='none';
                          document.body.appendChild(inp);
                          inp.onchange = async () => {
                            const file = inp.files?.[0];
                            document.body.removeChild(inp);
                            if (!file) return;
                            const t = new Date();
                            const tm = `${t.getHours().toString().padStart(2,'0')}:${t.getMinutes().toString().padStart(2,'0')}`;
                            const size = (file.size/1024/1024).toFixed(1);
                            const msgId = Date.now().toString();
                            setChatMessages(prev => ({ ...prev, [key]: [...(prev[key]||[]), { id: msgId, from: 'me' as const, text: `🎥 ${file.name} (${size} MB)`, time: tm, timestamp: new Date().toISOString(), created_at: new Date().toISOString(), status: 'pending' as const } as any] }));
                            try {
                              const result = await chatAPI.uploadFile(chatId, file);
                              const sent = await chatAPI.sendMessage(chatId, { text: `🎥 ${file.name} (${size} MB)`, type: 'file', file_url: result.file_url });
                              const serverId = sent?.id || msgId;
                              setChatMessages(prev => ({ ...prev, [key]: (prev[key]||[]).map(m => m.id === msgId ? { ...m, id: serverId, fileUrl: result.file_url, fileName: file.name, fileSize: size + ' MB', fileExt: 'mp4', status: 'delivered' } : m) }));
                            } catch { showToast('Error al subir video', 'error'); }
                          };
                          inp.click();
                        }
                      },
                      {
                        label: 'Archivo', color: '#06b6d4', bg: '#CFFAFE',
                        icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>,
                        action: () => {
                          setShowChatAttach(false);
                          const key = sc.id?.toString() || sc.title;
                          const chatId = sc.id?.toString() || '';
                          const inp = document.createElement('input');
                          inp.type='file'; inp.style.display='none';
                          document.body.appendChild(inp);
                          inp.onchange = async () => {
                            const file = inp.files?.[0];
                            document.body.removeChild(inp);
                            if (!file) return;
                            const t = new Date();
                            const tm = `${t.getHours().toString().padStart(2,'0')}:${t.getMinutes().toString().padStart(2,'0')}`;
                            const size = (file.size/1024).toFixed(1);
                            const ext = file.name.split('.').pop()?.toLowerCase() || '';
                            const msgId = Date.now().toString();
                            // Mostrar pendiente
                            setChatMessages(prev => ({ ...prev, [key]: [...(prev[key]||[]), { id: msgId, from: 'me' as const, text: `🎥 ${file.name} (${size} KB)`, time: tm, status: 'pending' as const, fileName: file.name, fileSize: size + ' KB', fileExt: ext } as any] }));
                            try {
                              const result = await chatAPI.uploadFile(chatId, file);
                              const sent = await chatAPI.sendMessage(chatId, { text: `🎥 ${file.name} (${size} KB)`, type: 'file', file_url: result.file_url });
                              const serverId = sent?.id || msgId;
                              setChatMessages(prev => ({ ...prev, [key]: (prev[key]||[]).map(m => m.id === msgId ? { ...m, id: serverId, fileUrl: result.file_url, status: 'delivered' } : m) }));
                            } catch { showToast('Error al subir archivo', 'error'); }
                          };
                          inp.click();
                        }
                      },
                      {
                        label: 'Contacto', color: '#ec4899', bg: '#FCE7F3',
                        icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
                        action: () => {
                          setShowChatAttach(false);
                          const myName = userProfile.name || 'Mi contacto';
                          const myPhone = userProfile.phone || '+240 222 *** ***';
                          const myAvatar = userProfile.avatarUrl || '';
                          const key = sc.id?.toString() || sc.title;
                          const t = new Date();
                          const tm = `${t.getHours().toString().padStart(2,'0')}:${t.getMinutes().toString().padStart(2,'0')}`;
                          setChatMessages(prev => ({ ...prev, [key]: [...(prev[key]||[]), { id: Date.now().toString(), from: 'me' as const, text: `👤 ${myName}\n📞 ${myPhone}`, time: tm, status: 'pending' as const, type: 'contact' as any, contactAvatar: myAvatar } as any] }));
                        }
                      },
                      {
                        label: 'Ubicación', color: '#ef4444', bg: '#FEE2E2',
                        icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
                        action: () => {
                          setShowChatAttach(false);
                          const key = sc.id?.toString() || sc.title;
                          const t = new Date();
                          const tm = `${t.getHours().toString().padStart(2,'0')}:${t.getMinutes().toString().padStart(2,'0')}`;
                          if (!navigator.geolocation) {
                            setChatMessages(prev => ({ ...prev, [key]: [...(prev[key]||[]), { id: Date.now().toString(), from: 'me' as const, text: `📌 Malabo, Guinea Ecuatorial\nhttps://maps.google.com/?q=3.7520,8.7735`, time: tm, status: 'pending' as const }] }));
                            return;
                          }
                          navigator.geolocation.getCurrentPosition(
                            pos => {
                              const lat = pos.coords.latitude.toFixed(6);
                              const lng = pos.coords.longitude.toFixed(6);
                              setChatMessages(prev => ({ ...prev, [key]: [...(prev[key]||[]), { id: Date.now().toString(), from: 'me' as const, text: `📌 Mi ubicación\nhttps://maps.google.com/?q=${lat},${lng}`, time: tm, status: 'pending' as const }] }));
                            },
                            () => {
                              setChatMessages(prev => ({ ...prev, [key]: [...(prev[key]||[]), { id: Date.now().toString(), from: 'me' as const, text: `📌 Malabo, Guinea Ecuatorial\nhttps://maps.google.com/?q=3.7520,8.7735`, time: tm, status: 'pending' as const }] }));
                            },
                            { timeout: 8000, enableHighAccuracy: true }
                          );
                        }
                      },
                      {
                        label: 'Enviar dinero', color: '#00c8a0', bg: '#D1FAE5',
                        icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00c8a0" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/><circle cx="12" cy="15" r="2"/></svg>,
                        action: () => {
                          setShowChatAttach(false);
                          const key = sc.id?.toString() || sc.title;
                          const amountStr = window.prompt(`Enviar dinero a ${sc.title}\n\nIngresa el monto en XAF:`);
                          if (!amountStr || isNaN(Number(amountStr)) || Number(amountStr) <= 0) return;
                          const amount = Number(amountStr);
                          if (amount > userBalance) { showToast('⚠ Saldo insuficiente', 'error'); return; }
                          const code = Math.floor(100000 + Math.random() * 900000).toString();
                          const t = new Date();
                          const tm = `${t.getHours().toString().padStart(2,'0')}:${t.getMinutes().toString().padStart(2,'0')}`;
                          try { subtractBalance(amount); } catch {}
                          setChatMessages(prev => ({ ...prev, [key]: [...(prev[key]||[]), {
                            id: Date.now().toString(), from: 'me' as const,
                            text: `📌 Transferencia\n💰 ${amount.toLocaleString()} XAF\n👤 ${sc.title}\n🔑 Código: ${code}\n✅ Enviado`,
                            time: tm, status: 'pending' as const
                          }] }));
                        }
                      },
                    ].map((item, i) => (
                      <button key={i} onClick={() => item.action()}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', outline: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '7px', padding: '4px' }}>
                        <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.15s' }}
                          onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.transform='scale(1.08)';}}
                          onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.transform='scale(1)';}}>
                          {item.icon}
                        </div>
                        <span style={{ fontSize: '13px', color: '#374151', fontWeight: '500', textAlign: 'center', lineHeight: 1.2 }}>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Panel emojis a estilo EGCHAT */}
              {showChatEmojis && (() => {
                const emojiCats: Record<string, {icon:string; emojis:string[]}> = {
                  stickers:  { icon:'🎭', emojis:[] },
                  recientes: { icon:'🕐', emojis:['😀','😂','😍','🥰','😎','🤔','😭','😡','👍','❤️','🔥','✅','🎉','💯','🙏','😊','🤣','😅','😆','😋','😜','🤩','🥳','😴','🤯','🥺','😤','😏','🤗','😇'] },
                  caras:     { icon:'😀', emojis:['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','🤩','😘','😗','😚','😙','🥲','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','😏','😒','🙄','😬','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🤧','🥵','🥶','🥴','😵','🤯','🤠','🥸','😎','🤓','🧐','😕','😟','🙁','☹️','😮','😯','😲','😳','🥺','😦','😧','😨','😰','😥','😢','😭','😱','😖','😣','😞','😓','😩','😫','🥱','😤','😡','😠','🤬','😈','👿','💀','☠️','💩','🤡','👹','👺','👻','👽','👾','🤖'] },
                  gestos:    { icon:'👋', emojis:['👋','🤚','🖐️','✋','🖖','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏','✍️','💅','🤳','💪','🦾','🦿','🦵','🦶','👂','🦻','👃','👀','👁️','👅','👄','💋'] },
                  personas:  { icon:'👤', emojis:['👶','🧒','👦','👧','🧑','👱','👨','🧔','👩','🧓','👴','👵','🙍','🙎','🙅','🙆','💁','🙋','🧏','🙇','🤦','🤷','👮','🕵️','💂','🥷','👷','🤴','👸','👳','👲','🧕','🤵','👰','🤰','🤱','👼','🎅','🤶','🦸','🦹','🧙','🧝','🧛','🧟','🧞','🧜','🧚','👫','👬','👭','💏','💑','👨‍👩‍👦'] },
                  animales:  { icon:'🐶', emojis:['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🙈','🙉','🙊','🐔','🐧','🐦','🐤','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🐛','🦋','🐌','🐞','🐜','🦟','🦗','🕷️','🦂','🐢','🐍','🦎','🐙','🦑','🦐','🦞','🦀','🐡','🐠','🐟','🐬','🐳','🐋','🦈','🐊','🐅','🐆','🦍','🦧','🐘','🦛','🦏','🐪','🐫','🦒','🦘','🐃','🐂','🐄','🐎','🐖','🐏','🐑','🦙','🐐','🦌','🐕','🐩','🐈','🐓','🦃','🦚','🦜','🦢','🦩','🕊️','🐇','🦝','🦨','🦡','🦦','🦥','🐁','🐀','🐿️','🦔'] },
                  comida:    { icon:'🍎', emojis:['🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑','🥦','🥬','🥒','🌶️','🧄','🧅','🥔','🍠','🥐','🥯','🍞','🥖','🥨','🧀','🥚','🍳','🧈','🥞','🧇','🥓','🥩','🍗','🍖','🌭','🍔','🍟','🍕','🥪','🥙','🧆','🌮','🌯','🥗','🥘','🥫','🍝','🍜','🍲','🍛','🍣','🍱','🥟','🍤','🍙','🍚','🍘','🍥','🥮','🍢','🧁','🍰','🎂','🍮','🍭','🍬','🍫','🍿','🍩','🍪','🌰','🥜','🍯','🧃','🥤','🧋','☕','🍵','🍺','🍻','🥂','🍷','🥃','🍸','🍹','🧉','🍾','🥄','🍴','🍽️','🥢','🧂'] },
                  viajes:    { icon:'✈️', emojis:['🚗','🚕','🚙','🚌','🚎','🏎️','🚓','🚑','🚒','🚐','🛻','🚚','🚛','🚜','🏍️','🛵','🚲','🛴','🛹','🚏','⛽','🚨','🚥','🚦','🛑','🚧','⚓','⛵','🚤','🛥️','🛳️','⛴️','🚢','✈️','🛩️','🛫','🛬','🪂','💺','🚁','🚀','🛸','🌍','🌎','🌏','🗺️','🧭','🏔️','⛰️','🌋','🗻','🏕️','🏖️','🏜️','🏝️','🏞️','🏟️','🏛️','🏗️','🛖','🏘️','🏚️','🏠','🏡','🏢','🏣','🏤','🏥','🏦','🏨','🏩','🏪','🏫','🏬','🏭','🏯','🏰','💒','🗼','🗽','⛪','🕌','🛕','🕍','⛩️','🕋','⛲','⛺','🌁','🌃','🏙️','🌄','🌅','🌆','🌇','🌉','🎠','🎡','🎢','💈','🎪'] },
                  objetos:   { icon:'💡', emojis:['⌚','📱','📲','💻','⌨️','🖥️','🖨️','🖱️','💽','💾','💿','📀','🧮','📷','📸','📹','🎥','📽️','🎞️','📞','☎️','📟','📠','📺','📻','🧭','⏱️','⏲️','⏰','🕰️','⌛','⏳','📡','🔋','🔌','💡','🔦','🕯️','🧯','💰','💴','💵','💶','💷','💸','💳','🪙','💹','📈','📉','📊','📋','📌','📍','📎','🖇️','📏','📐','✂️','🗃️','🗄️','🗑️','🔒','🔓','🔏','🔐','🔑','🗝️','🔨','🪓','⛏️','⚒️','🛠️','🗡️','⚔️','🛡️','🔧','🪛','🔩','⚙️','🗜️','⚖️','🔗','⛓️','🪝','🧲','🪜','🧰','🧪','🧫','🧬','🔭','🔬','🩺','🩹','💊','💉','🩸','🌡️','🧹','🪣','🧺','🧻','🚽','🚰','🚿','🛁','🪥','🧼','🪒','🧴','🧷','🧹','🧺','🧻'] },
                  simbolos:  { icon:'❤️', emojis:['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❤️‍🔥','❤️‍🩹','❣️','💕','💞','💓','💗','💖','💘','💝','💟','☮️','✝️','☪️','🕉️','☸️','✡️','🔯','🕎','☯️','☦️','🛐','⛎','♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓','🆔','⚛️','🉑','☢️','☣️','📴','📳','🈶','🈚','🈸','🈺','🈷️','✴️','🆚','💮','🉐','㊙️','㊗️','🈴','🈵','🈹','🈲','🅰️','🅱️','🆎','🆑','🅾️','🆘','❌','⭕','🛑','⛔','📛','🚫','💯','💢','♨️','🚷','🚯','🚳','🚱','🔞','📵','🚭','❗','❕','❓','❔','‼️','⁉️','🔅','🔆','〽️','⚠️','🚸','🔱','⚜️','🔰','♻️','✅','🈯','💹','❇️','✳️','❎','🌐','💠','Ⓜ️','🌀','💤','🏧','🚾','♿','🅿️','🛗','🈳','🈂️','🛂','🛃','🛄','🛅','🚹','🚺','🚼','⚧️','🚻','🚮','🎦','📶','🈁','🔣','ℹ️','🔤','🔡','🔠','🆖','🆗','🆙','🆒','🆕','🆓','0️⃣','1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟','🔢','#️⃣','*️⃣','⏏️','▶️','⏸️','⏹️','⏺️','⏭️','⏮️','⏩','⏪','⏫','⏬','◀️','🔼','🔽','➡️','⬅️','⬆️','⬇️','↗️','↘️','↙️','↖️','↕️','↔️','↪️','↩️','⤴️','⤵️','🔀','🔁','🔂','🔄','🔃','🎵','🎶','➕','➖','➗','✖️','♾️','💲','💱','™️','©️','®️','〰️','➰','➿','🔚','🔙','🔛','🔝','🔜','✔️','☑️','🔘','🔴','🟠','🟡','🟢','🔵','🟣','⚫','⚪','🟤','🔺','🔻','🔷','🔶','🔹','🔸','🔲','🔳','▪️','▫️','◾','◽','◼️','◻️','🟥','🟧','🟨','🟩','🟦','🟪','⬛','⬜','🟫','🔈','🔇','🔉','🔊','🔔','🔕','📣','📢','💬','💭','🗯️','♠️','♣️','♥️','♦️','🃏','🎴','🀄'] },
                  custom:    { icon:'⭐', emojis:[] },
                };                return (
                <div style={{ background: '#f7f8fa', borderTop: '1px solid rgba(0,0,0,0.07)', flexShrink: 0 }}>
                  {/* Barra bsqueda */}
                  <div style={{ padding: '7px 10px 4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'rgba(249,250,251,0.88)', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '6px', padding: '0 8px', height: '28px', gap: '6px' }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                      <input value={emojiSearch} onChange={e => setEmojiSearch(e.target.value)} placeholder="Buscar emoji..."
                        style={{ flex: 1, background: 'none', border: 'none', color: '#0d0d0d', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }}/>
                      {emojiSearch && <button onClick={() => setEmojiSearch('')} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', outline: 'none', padding: 0, fontSize: '12px', lineHeight: 1 }}></button>}
                    </div>
                    <button onClick={() => { setEditingEmoji({ label: '', title: '' }); setShowEmojiEditor(true); setChatEmojiCategory('custom'); }}
                      style={{ background: 'rgba(0,180,230,0.12)', border: '1px solid rgba(0,180,230,0.25)', borderRadius: '6px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', outline: 'none', color: '#00b4e6', flexShrink: 0 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    </button>
                  </div>

                  {/* Grid emojis */}
                  <div style={{ height: '155px', overflowY: 'auto', padding: '4px 8px' }}>
                    {chatEmojiCategory === 'custom' && showEmojiEditor && editingEmoji ? (
                      <div style={{ padding: '6px 2px' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(249,250,251,0.88)', border: '1px solid rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>
                            {editingEmoji.label || ''}
                          </div>
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <input value={editingEmoji.label} onChange={e => setEditingEmoji(p => p ? {...p, label: e.target.value} : p)}
                              placeholder="Emoji (ej: )" autoFocus
                              style={{ background: 'rgba(249,250,251,0.88)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '5px', padding: '4px 8px', color: '#0d0d0d', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }}/>
                            <input value={editingEmoji.title} onChange={e => setEditingEmoji(p => p ? {...p, title: e.target.value} : p)}
                              placeholder="Nombre"
                              style={{ background: 'rgba(249,250,251,0.88)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '5px', padding: '4px 8px', color: '#0d0d0d', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }}/>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => setShowEmojiEditor(false)}
                            style={{ flex: 1, background: 'rgba(249,250,251,0.88)', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '6px', padding: '6px', color: '#6b7280', cursor: 'pointer', outline: 'none', fontSize: '14px' }}>Cancelar</button>
                          <button onClick={() => {
                            if (!editingEmoji.label.trim()) return;
                            if (editingEmoji.id) {
                              setCustomEmojis(prev => prev.map(e => e.id === editingEmoji.id ? {...e, label: editingEmoji.label, title: editingEmoji.title} : e));
                            } else {
                              setCustomEmojis(prev => [...prev, { id: Date.now().toString(), label: editingEmoji.label, title: editingEmoji.title, source: 'created' }]);
                            }
                            setShowEmojiEditor(false); setEditingEmoji(null);
                          }}
                            style={{ flex: 1, background: '#00b4e6', border: 'none', borderRadius: '6px', padding: '6px', color: '#0d0d0d', cursor: 'pointer', outline: 'none', fontSize: '14px', fontWeight: '600' }}>
                            {editingEmoji.id ? 'Guardar' : 'Crear'}
                          </button>
                        </div>
                      </div>
                    ) : chatEmojiCategory === 'stickers' ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', paddingTop: '4px' }}>
                        {[
                          { emoji: '😎', label: 'Con Flow' },
                          { emoji: '👍', label: 'Bien!' },
                          { emoji: '😱', label: 'OMG!' },
                          { emoji: '😂', label: 'Jajaja' },
                          { emoji: '😘', label: 'Muack!' },
                          { emoji: '🕶️', label: 'Cool' },
                          { emoji: '💃', label: 'A Bailar' },
                          { emoji: '🥰', label: 'Sueño' },
                          { emoji: '☕', label: 'Cafacito' },
                          { emoji: '🙄', label: 'Ugh' },
                          { emoji: '🙌', label: 'Fuerte' },
                          { emoji: '💪', label: 'Hmm...' },
                          { emoji: '🍕', label: 'Ñam Nam' },
                          { emoji: '☮️', label: 'Paz' },
                          { emoji: '🎉', label: 'Huhoo!' },
                          { emoji: '🤳', label: 'Selfie!' },
                          { emoji: '😴', label: 'Zzz' },
                          { emoji: '🤩', label: 'Wow' },
                          { emoji: '😤', label: 'No Way' },
                          { emoji: '🥳', label: 'Fiesta' },
                          { emoji: '🤗', label: 'Abrazo' },
                          { emoji: '😇', label: 'Inocente' },
                          { emoji: '🤭', label: 'Shh' },
                          { emoji: '🥺', label: 'Por Favor' },
                          { emoji: '😏', label: 'Obvio' },
                          { emoji: '🤪', label: 'Loco' },
                          { emoji: '😋', label: 'Rico' },
                          { emoji: '🤑', label: 'Dinero' },
                          { emoji: '😈', label: 'Travieso' },
                          { emoji: '👑', label: 'Reina' },
                          { emoji: '💅', label: 'Glamour' },
                          { emoji: '🦋', label: 'Libre' },
                        ].map((s, i) => (
                          <button key={i} onClick={() => {
                            const sticker = `${s.emoji} ${s.label}`;
                            // Enviar como mensaje directo
                            const cid = selectedChat?.id?.toString() || selectedChat?.title || '';
                            const newMsg = { id: `local-${Date.now()}`, from: 'me' as const, text: sticker, time: new Date().toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'}), created_at: new Date().toISOString(), status: 'pending' as const };
                            setChatMessages((prev: any) => ({ ...prev, [cid]: [...(prev[cid]||[]), newMsg] }));
                            setShowChatEmojis(false);
                            if (cid && cid.includes('-') && cid.length > 20) {
                              chatAPI.sendMessage(cid, { text: sticker, type: 'text' }).catch(() => {});
                            }
                          }}
                            style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '12px', cursor: 'pointer', padding: '8px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', minWidth: '58px', outline: 'none', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', transition: 'transform 0.1s' }}
                            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.08)')}
                            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}>
                            <span style={{ fontSize: '28px', lineHeight: 1 }}>{s.emoji}</span>
                            <span style={{ fontSize: '9px', color: '#6b7280', fontWeight: '600', whiteSpace: 'nowrap' }}>{s.label}</span>
                          </button>
                        ))}
                      </div>
                    ) : chatEmojiCategory === 'custom' ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', paddingTop: '4px' }}>
                        {customEmojis.map(em => (
                          <div key={em.id} style={{ position: 'relative' }}>
                            <button onClick={() => setCurrentChatInput(prev => prev + em.label)}
                              style={{ background: 'rgba(249,250,251,0.88)', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '8px', fontSize: '20px', cursor: 'pointer', padding: '5px 7px', lineHeight: 1, outline: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', minWidth: '42px' }}>
                              {em.label}
                              <span style={{ fontSize: '7px', color: '#9ca3af', whiteSpace: 'nowrap' }}>{em.title}</span>
                            </button>
                            <button onClick={() => { setEditingEmoji({ id: em.id, label: em.label, title: em.title }); setShowEmojiEditor(true); }}
                              style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#f0f2f5', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '50%', width: '14px', height: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', outline: 'none', color: '#6b7280', padding: 0 }}>
                              <svg width="7" height="7" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                          </div>
                        ))}
                        <button onClick={() => {
                          const toCopy = [
                            { id: Date.now().toString(), label: '🏅', title: 'De Juan', source: 'copied' as const, from: 'Juan' },
                            { id: (Date.now()+1).toString(), label: '💪', title: 'De María', source: 'copied' as const, from: 'María' },
                          ];
                          setCustomEmojis(prev => [...prev, ...toCopy.filter(c => !prev.find(p => p.label === c.label))]);
                        }}
                          style={{ background: 'rgba(0,200,160,0.08)', border: '1px dashed rgba(0,200,160,0.3)', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', padding: '5px 8px', color: '#00c8a0', outline: 'none', display: 'flex', alignItems: 'center', gap: '4px', height: '42px' }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                          Copiar
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                        {(emojiSearch
                          ? Object.values(emojiCats).flatMap(c => c.emojis).filter(e => e.includes(emojiSearch))
                          : (emojiCats[chatEmojiCategory].emojis || [])
                        ).map((em, i) => (
                          <button key={i} onClick={() => setCurrentChatInput(prev => prev + em)}
                            style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', padding: '4px 3px', lineHeight: 1, outline: 'none', borderRadius: '5px' }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#f3f4f6')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                            {em}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Barra categorías estilo EGCHAT */}
                  <div style={{ display: 'flex', borderTop: '1px solid rgba(0,0,0,0.07)', overflowX: 'auto' }}>
                    {Object.entries(emojiCats).map(([key, cat]) => (
                      <button key={key} onClick={() => { setChatEmojiCategory(key); setEmojiSearch(''); setShowEmojiEditor(false); }}
                        style={{ background: key === 'stickers' && chatEmojiCategory === key ? 'rgba(0,180,230,0.08)' : 'none', border: 'none', borderTop: chatEmojiCategory === key ? '2px solid #00b4e6' : '2px solid transparent', padding: key === 'stickers' ? '5px 12px' : '7px 10px', cursor: 'pointer', outline: 'none', fontSize: '18px', lineHeight: 1, flexShrink: 0, opacity: chatEmojiCategory === key ? 1 : 0.4, transition: 'all 0.15s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px' }}>
                        {cat.icon}
                        {key === 'stickers' && <span style={{ fontSize: '8px', fontWeight: '700', color: chatEmojiCategory === key ? '#00b4e6' : '#9ca3af', letterSpacing: '0.3px' }}>STICKERS</span>}
                      </button>
                    ))}
                  </div>
                </div>
                );
              })()}

              {/* Barra de selección múltiple */}
              {selectionMode && (
                <div style={{ flexShrink: 0, background: '#fff', borderTop: '1px solid #E5E7EB', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '8px', zIndex: 2 }}>
                  <button onClick={() => { setSelectionMode(false); setSelectedMsgIds([]); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: '600' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    Cancelar
                  </button>
                  <span style={{ flex: 1, fontSize: '13px', color: '#374151', fontWeight: '600', textAlign: 'center' }}>
                    {selectedMsgIds.length} seleccionado{selectedMsgIds.length !== 1 ? 's' : ''}
                  </span>
                  {selectedMsgIds.length > 0 && (
                    <>
                      <button onClick={() => {
                        const cid = selectedChat?.id?.toString() || selectedChat?.title || '';
                        setChatMessages(prev => ({ ...prev, [cid]: (prev[cid]||[]).filter(m => !selectedMsgIds.includes(m.id)) }));
                        showToast(`${selectedMsgIds.length} mensaje${selectedMsgIds.length !== 1 ? 's' : ''} eliminado${selectedMsgIds.length !== 1 ? 's' : ''}`, 'info');
                        setSelectionMode(false); setSelectedMsgIds([]);
                      }} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', cursor: 'pointer', color: '#EF4444', padding: '8px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                        Eliminar
                      </button>
                      <button onClick={() => {
                        const cid = selectedChat?.id?.toString() || selectedChat?.title || '';
                        const msgsToForward = (chatMessages[cid]||[]).filter(m => selectedMsgIds.includes(m.id));
                        const texts = msgsToForward.map(m => m.text).filter(Boolean).join('\n');
                        navigator.clipboard?.writeText(texts);
                        showToast('Mensajes copiados', 'success');
                        setSelectionMode(false); setSelectedMsgIds([]);
                      }} style={{ background: 'rgba(0,180,230,0.1)', border: 'none', cursor: 'pointer', color: '#00b4e6', padding: '8px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        Copiar
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Fin del scroll de mensajes — ref para scroll automático */}
              {/* Barra de input */}
              <div style={{
                flexShrink: 0,
                background: '#f0f2f5',
                borderTop: 'none',
                padding: '8px 8px',
                paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                position: 'relative',
                zIndex: 1,
              }}>
                {/* Botón + */}
                <button onClick={() => { setShowChatAttach(p => !p); setShowChatEmojis(false); }}
                  style={{ background: 'none', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', outline: 'none', color: showChatAttach ? '#00b4e6' : '#9ca3af', flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>

                {/* Input */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: '#ffffff', border: `1.5px solid ${editingMsgId ? '#6B5BD6' : '#E5E7EB'}`, borderRadius: '24px', minHeight: '44px', padding: '0 8px 0 16px', gap: '4px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                  {editingMsgId && <span style={{ fontSize: '11px', color: '#6B5BD6', fontWeight: '700', flexShrink: 0 }}>✏️</span>}
                  <input
                    type="text"
                    value={currentChatInput}
                    onChange={e => { setCurrentChatInput(e.target.value); if (!e.target.value && editingMsgId) setEditingMsgId(null); }}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); sendChatMessage(); } }}
                    placeholder="Escribe un mensaje..."
                    autoFocus
                    ref={el => { if (el && document.activeElement !== el) el.focus(); }}
                    style={{ flex: 1, background: 'none', border: 'none', color: '#111827', fontSize: '15px', outline: 'none', fontFamily: 'inherit', lineHeight: '1.4' }}
                  />
                  {currentChatInput.trim() && (
                    <button onClick={sendChatMessage}
                      style={{ background: 'none', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', outline: 'none', color: '#00c8a0', flexShrink: 0 }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                    </button>
                  )}
                </div>

                {/* Emoji */}
                <button onClick={() => { setShowChatEmojis(p => !p); setShowChatAttach(false); setChatEmojiCategory('stickers'); }}
                  style={{ background: 'none', border: 'none', borderRadius: '50%', color: showChatEmojis ? '#f59e0b' : '#9ca3af', cursor: 'pointer', outline: 'none', padding: '8px', display: 'flex', flexShrink: 0 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><path d="M8 13s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
                  </svg>
                </button>

                {/* Micrófono — toca para grabar, toca de nuevo para enviar */}
                <button
                  onClick={async () => {
                    if (isRecordingAudio) {
                      chatRecorderRef.current?.stop();
                      chatRecorderRef.current = null;
                      setIsRecordingAudio(false);
                      if (chatRecordTimerRef.current) { clearInterval(chatRecordTimerRef.current); chatRecordTimerRef.current = null; }
                      return;
                    }
                    try {
                      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                      chatAudioChunksRef.current = [];
                      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus'
                        : MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm'
                        : MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : '';
                      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
                      recorder.ondataavailable = e => { if (e.data.size > 0) chatAudioChunksRef.current.push(e.data); };
                      let audioSent = false;
                      recorder.onstop = async () => {
                        if (audioSent) return; audioSent = true;
                        stream.getTracks().forEach(t => t.stop());
                        if (chatRecordTimerRef.current) { clearInterval(chatRecordTimerRef.current); chatRecordTimerRef.current = null; }
                        setChatRecordingTime(0);
                        if (chatAudioChunksRef.current.length === 0) return;
                        const finalMime = mimeType || 'audio/webm';
                        const ext = finalMime.includes('mp4') ? 'm4a' : 'webm';
                        const blob = new Blob(chatAudioChunksRef.current, { type: finalMime });
                        if (blob.size < 100) return;
                        const now = new Date();
                        const time = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
                        const msgId = Date.now().toString();
                        const localUrl = URL.createObjectURL(blob);
                        const newMsg = { id: msgId, from: 'me' as const, text: `🎤 Mensaje de voz`, time, timestamp: new Date().toISOString(), created_at: new Date().toISOString(), status: 'pending' as const, type: 'audio' as const, audioUrl: localUrl };
                        addMsg(newMsg);
                        // Subir al servidor para que persista
                        const chatId = sc?.id?.toString() || '';
                        if (chatId && chatId.length > 10) {
                          try {
                            const audioFile = new File([blob], `audio_${msgId}.${ext}`, { type: mimeType });
                            const result = await chatAPI.uploadFile(chatId, audioFile);
                            if (result.file_url) {
                              const sent = await chatAPI.sendMessage(chatId, { text: '🎤 Mensaje de voz', type: 'audio', file_url: result.file_url });
                              // Reemplazar ID local con ID del servidor para evitar duplicados en el polling
                              const serverId = sent?.id || msgId;
                              const key = sc?.id?.toString() || sc?.title;
                              setChatMessages(prev => ({ ...prev, [key]: (prev[key]||[]).map(m => m.id === msgId ? { ...m, id: serverId, audioUrl: result.file_url, status: 'delivered' } : m) }));
                            }
                          } catch {}
                        }
                      };
                      recorder.start(100);
                      chatRecorderRef.current = recorder;
                      setIsRecordingAudio(true);
                      setChatRecordingTime(0);
                      chatRecordTimerRef.current = setInterval(() => setChatRecordingTime(t => t + 1), 1000);
                    } catch { showToast('No se pudo acceder al micrófono', 'error'); }
                  }}
                  style={{ background: isRecordingAudio ? '#ef4444' : 'none', border: 'none', borderRadius: '50%', color: isRecordingAudio ? '#fff' : '#9ca3af', cursor: 'pointer', outline: 'none', padding: '8px', display: 'flex', flexShrink: 0, position: 'relative' }}>
                  {isRecordingAudio && (
                    <span style={{ position: 'absolute', top: '-20px', left: '50%', transform: 'translateX(-50%)', fontSize: '11px', color: '#ef4444', fontWeight: '700', whiteSpace: 'nowrap', background: '#fff', padding: '2px 6px', borderRadius: '6px', boxShadow: '0 1px 4px rgba(0,0,0,0.15)', border: '1px solid rgba(239,68,68,0.2)' }}>
                      🔴 {String(Math.floor(chatRecordingTime/60)).padStart(2,'0')}:{String(chatRecordingTime%60).padStart(2,'0')}
                    </span>
                  )}
                  {isRecordingAudio ? (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
                  ) : (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </>
          );
        }
        return (
          <div style={{
            padding: '0 8px 0px',
            paddingTop: device.isMobile ? 'calc(max(28px, env(safe-area-inset-top, 28px)) + 44px + 6px)' : '8px',
            height: device.isMobile ? '100vh' : 'calc(100vh - 44px)',
            marginTop: device.isMobile ? '0' : '44px',
            width: device.isMobile ? '100%' : (device.isTablet ? '280px' : '300px'),
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            background: '#fff',
            position: 'relative',
            zIndex: 1002,
            borderRight: device.isMobile ? 'none' : '1px solid #e5e7eb',
          }}>
            {/* Header - Ultra minimalista */}
            <div style={{ marginBottom: '8px', flexShrink: 0 }}>
              {/* Barra de búsqueda + botón nuevo chat */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '6px', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <input
                    type="text"
                    placeholder="Buscar..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 12px 6px 32px',
                      background: 'rgba(255,255,255,0.85)',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#0d0d0d',
                      fontSize: '12px',
                      outline: 'none'
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    left: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#9ca3af'
                  }}>
                    {renderIcon('search', 14)}
                  </div>
                </div>
                <button
                  onClick={() => setShowNewChatModal(true)}
                  style={{
                    background: 'linear-gradient(135deg, #00c8a0, #00b4e6)',
                    border: 'none',
                    borderRadius: '8px',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    outline: 'none',
                    color: '#fff',
                    flexShrink: 0
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </button>
              </div>

              {/* Seccin: Contactos Favoritos - COLAPSABLE */}
              <div style={{
                marginBottom: '8px'
              }}>
                <button
                  onClick={() => setExpandFavoriteContacts(!expandFavoriteContacts)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'transparent',
                    border: 'none',
                    padding: '6px 0',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  <h3 style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#9ca3af',
                    margin: 0,
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                    fontFamily: 'inherit'
                  }}>
                    Contactos Favoritos
                  </h3>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{
                      fontSize: '13px',
                      color: '#6b7280',
                      fontWeight: '500'
                    }}>
                      {expandFavoriteContacts ? '-' : '+'}
                    </span>
                  </div>
                </button>

                {expandFavoriteContacts && (
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    overflowX: 'auto',
                    paddingBottom: '4px',
                    scrollBehavior: 'smooth',
                    marginTop: '8px'
                  }}>
                    {favoriteContacts.length === 0 ? (
                      <span style={{ fontSize: '14px', color: '#9ca3af', padding: '8px 0' }}>
                        No tienes contactos favoritos a?n
                      </span>
                    ) : favoriteContacts.map((contact: any) => (
                      <button
                        key={contact.id}
                        onClick={async () => {
                          try {
                            const chat = await chatAPI.createPrivate(contact.id);
                            if (chat?.id) {
                              const name = contact.name || contact.user?.name || 'Usuario';
                              const initials = name.split(' ').map((w:string)=>w[0]).join('').slice(0,2).toUpperCase();
                              setSelectedChat({ id: chat.id, type: 'individual', title: name, subtitle: '', time: '', status: 'online', initials, color: '#00c8a0', avatarUrl: contact.avatar_url || contact.user?.avatar_url || '', user_id: contact.id });
                              setCurrentView('Mensajería');
                              loadChats();
                            }
                          } catch { showToast('No se pudo abrir el chat', 'error'); }
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          padding: '0',
                          color: '#0d0d0d',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '6px',
                          outline: 'none',
                          transition: 'all 0.2s ease',
                          minWidth: '70px',
                          flexShrink: 0
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                      >
                        <Avatar name={contact.name || contact.user?.name || '?'} size={56} showStatus={false} photo={contact.avatar_url || contact.user?.avatar_url} />
                        <span style={{ 
                          fontSize: '13px', 
                          fontWeight: '600',
                          textAlign: 'center',
                          color: '#0d0d0d',
                          maxWidth: '70px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {contact.name || contact.user?.name}
                        </span>
                      </button>
                    ))}

                  </div>
                )}
              </div>

              {/* Seccin: Grupos Favoritos - COLAPSABLE */}
              <div style={{
                marginBottom: '8px'
              }}>
                <button
                  onClick={() => setExpandFavoriteGroups(!expandFavoriteGroups)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'transparent',
                    border: 'none',
                    padding: '6px 0',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  <h3 style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#9ca3af',
                    margin: 0,
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                    fontFamily: 'inherit'
                  }}>
                    Grupos Favoritos
                  </h3>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{
                      fontSize: '13px',
                      color: '#6b7280',
                      fontWeight: '500'
                    }}>
                      {expandFavoriteGroups ? '-' : '+'}
                    </span>
                  </div>
                </button>

                {expandFavoriteGroups && (
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    overflowX: 'auto',
                    paddingBottom: '4px',
                    scrollBehavior: 'smooth',
                    marginTop: '8px'
                  }}>
                    {realChats.filter((c: any) => c.type === 'group' && favoriteGroupIds.includes(c.id?.toString())).length === 0 ? (
                      <span style={{ fontSize: '14px', color: '#9ca3af', padding: '8px 0' }}>
                        No tienes grupos favoritos a?n
                      </span>
                    ) : realChats.filter((c: any) => c.type === 'group' && favoriteGroupIds.includes(c.id?.toString())).slice(0, 6).map((group: any) => (
                      <button
                        key={group.id}
                        onClick={() => setSelectedChat(group)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          padding: '0',
                          color: '#0d0d0d',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '6px',
                          outline: 'none',
                          transition: 'all 0.2s ease',
                          minWidth: '70px',
                          flexShrink: 0
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                      >
                        <Avatar name={group.name || 'Grupo'} size={56} showStatus={false} />
                        <span style={{ 
                          fontSize: '13px', 
                          fontWeight: '600',
                          textAlign: 'center',
                          color: '#0d0d0d',
                          maxWidth: '70px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {group.name}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Filtros */}
              <div style={{
                display: 'flex',
                gap: '6px',
                marginBottom: '8px',
                overflowX: 'auto',
                paddingBottom: '2px'
              }}>
                {[
                  { id: 'individual', label: 'Individual', icon: 'user-plus' },
                  { id: 'group', label: 'Grupos', icon: 'users-group' },
                  { id: 'money', label: 'Dinero', icon: 'money' }
                ].map((filter) => (
                  <button 
                    key={filter.id}
                    onClick={() => setMessageFilter(filter.id)}
                    style={{
                      background: messageFilter === filter.id 
                        ? 'linear-gradient(135deg, #00c8a0, #00b4e6)'
                        : '#ffffff',
                      border: messageFilter === filter.id 
                        ? '1.5px solid #00c8a0'
                        : '1.5px solid #d1d5db',
                      borderRadius: '20px',
                      padding: '6px 14px',
                      color: messageFilter === filter.id ? '#ffffff' : '#374151',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      outline: 'none',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      boxShadow: messageFilter === filter.id 
                        ? '0 2px 8px rgba(0,200,160,0.35)'
                        : '0 1px 3px rgba(0,0,0,0.08)'
                    }}
                    onMouseEnter={(e) => {
                      if (messageFilter !== filter.id) {
                        e.currentTarget.style.background = '#f3f4f6';
                        e.currentTarget.style.borderColor = '#9ca3af';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (messageFilter !== filter.id) {
                        e.currentTarget.style.background = '#ffffff';
                        e.currentTarget.style.borderColor = '#d1d5db';
                      }
                    }}
                  >
                    {renderIcon(filter.icon, 12)}
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Lista de conversacines ? datos reales del backend */}
            <div
              className="scroll-container"
              style={{ flex: 1, overflowY: 'scroll', overflowX: 'hidden', WebkitOverflowScrolling: 'touch' as any, paddingBottom: '100px' }}
            >
              {/* Chats reales del backend */}
              {realChats.length > 0 && realChats
                .filter(chat => {
                  // Usar solo chat.type para determinar si es grupo
                  const isGrp = chat.type === 'group';

                  if (messageFilter === 'group') return isGrp;
                  if (messageFilter === 'individual') return !isGrp;
                  if (messageFilter === 'money') {
                    const chatId = chat.id?.toString() || '';
                    const msgs = chatMessages[chatId] || [];
                    const hasMoneyMsg = msgs.some((m: any) =>
                      m.text?.includes('Transferencia') ||
                      m.text?.includes('XAF') ||
                      m.text?.includes('💸') ||
                      m.text?.includes('📌') ||
                      m.type === 'transfer' || m.type === 'payment'
                    );
                    const lastText = chat.last_message?.text || '';
                    const lastHasMoney = lastText.includes('XAF') || lastText.includes('Transferencia') || lastText.includes('💸');
                    return hasMoneyMsg || lastHasMoney;
                  }
                  return true;
                })
                .filter(chat => {
                  if (!searchQuery.trim()) return true;
                  const name = (chat.name || chat.title || '').toLowerCase();
                  const last = (chat.last_message?.text || chat.subtitle || '').toLowerCase();
                  return name.includes(searchQuery.toLowerCase()) || last.includes(searchQuery.toLowerCase());
                })
                .map((chat: any) => {
                  // Para chats privados, usar el nombre del otro participante
                  const isGroup = chat.type === 'group' ||
                    (Array.isArray(chat.participants) && chat.participants.length > 2);
                  let name = chat.name || chat.title || '';
                  let avatarUrl = chat.avatar_url || '';
                  if (!isGroup && chat.participants) {
                    const other = chat.participants.find((p: any) => 
                      p.user_id?.toString() !== currentUserId.current?.toString()
                    );
                    if (other) {
                      name = other.full_name || other.users?.full_name || name;
                      avatarUrl = other.avatar_url || other.users?.avatar_url || avatarUrl;
                    }
                  }
                  if (!name) name = 'Chat';
                  const initials = name.split(' ').map((w:string)=>w[0]).join('').slice(0,2).toUpperCase();
                  const lastMsg = chat.last_message?.text || chat.subtitle || '';
                  const time = chat.last_message?.created_at
                    ? new Date(chat.last_message.created_at).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})
                    : '';
                  // Extraer user_id real del otro participante para WebRTC
                  const otherParticipant = !isGroup && chat.participants
                    ? chat.participants.find((p: any) => p.user_id?.toString() !== currentUserId.current?.toString())
                    : null;
                  const otherUserId = otherParticipant?.user_id?.toString() || '';
                  return (
                    <div key={chat.id}
                      onClick={async () => {
                        setSelectedChat({
                          id: chat.id, type: chat.type||'individual',
                          title: name, subtitle: lastMsg, time,
                          status: 'online', initials, color: isGroup ? '#a855f7' : '#00c8a0',
                          avatarUrl: avatarUrl,
                          isGroup,
                          user_id: otherUserId, // para WebRTC
                        });
                        // Auto-registrar contacto si es chat individual y no est en la lista
                        if (!isGroup && otherParticipant) {
                          const alreadyInContacts = allContacts.some(
                            (c: any) => c.id?.toString() === otherUserId || c.user_id?.toString() === otherUserId
                          );
                          if (!alreadyInContacts && otherUserId) {
                            try {
                              const phone = otherParticipant.phone || otherParticipant.users?.phone || '';
                              await contactsAPI.add(otherUserId as any, phone || undefined, name || undefined);
                              await loadContacts();
                            } catch {}
                          }
                        }
                      }}
                      style={{ background:'#fff', borderRadius:'8px', padding:'12px 10px', marginBottom:'6px', border:'1px solid #F0F2F5', cursor:'pointer', display:'flex', alignItems:'center', gap:'12px' }}
                      onMouseEnter={e=>{e.currentTarget.style.background='#f9fafb';}}
                      onMouseLeave={e=>{e.currentTarget.style.background='#fff';}}
                    >
                      <div style={{ width:'50px', height:'50px', borderRadius:'50%', background: isGroup ? 'linear-gradient(135deg,#a855f7,#6366f1)' : 'linear-gradient(135deg,#00c8a0,#00b4e6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', fontWeight:'700', color:'#fff', flexShrink:0, overflow:'hidden' }}>
                        {avatarUrl ? <img src={avatarUrl} alt={name} style={{width:'100%',height:'100%',objectFit:'cover'}}/> : <span>{initials}</span>}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:'15px', fontWeight:'600', color:'#111827', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name}</div>
                        <div style={{ fontSize:'13px', color:'#6b7280', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginTop:'2px', display:'flex', alignItems:'center', gap:'4px' }}>
                          {(() => {
                            if (!lastMsg) return <span>Sin mensajes</span>;
                            if (lastMsg.includes('Llamada perdida')) return <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.42 19.42 0 0 1 4.69 13"/><line x1="1" y1="1" x2="23" y2="23"/></svg><span style={{color:'#ef4444'}}>Llamada perdida</span></>;
                            if (lastMsg.includes('Llamada saliente')) return <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.13 12 19.79 19.79 0 0 1 1.06 3.38 2 2 0 0 1 3 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg><span>Llamada saliente</span></>;
                            if (lastMsg.includes('Llamada')) return <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.13 12 19.79 19.79 0 0 1 1.06 3.38 2 2 0 0 1 3 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg><span>Llamada</span></>;
                            if (lastMsg.includes('Videollamada')) return <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg><span>Videollamada</span></>;
                            if (lastMsg.includes('Mensaje de voz')) return <><svg width="16" height="12" viewBox="0 0 40 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{flexShrink:0}}><rect x="0" y="8" width="3" height="4" rx="1.5" fill="#9ca3af"/><rect x="5" y="5" width="3" height="10" rx="1.5" fill="#9ca3af"/><rect x="10" y="2" width="3" height="16" rx="1.5" fill="#9ca3af"/><rect x="15" y="5" width="3" height="10" rx="1.5" fill="#9ca3af"/><rect x="20" y="7" width="3" height="6" rx="1.5" fill="#9ca3af"/><rect x="25" y="4" width="3" height="12" rx="1.5" fill="#9ca3af"/><rect x="30" y="6" width="3" height="8" rx="1.5" fill="#9ca3af"/><rect x="35" y="8" width="3" height="4" rx="1.5" fill="#9ca3af"/></svg><span style={{color:'#6b7280'}}>Audio</span></>;
                            if (lastMsg.includes('Foto') || lastMsg.includes('📷') || lastMsg.includes('📌')) return <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg><span>Foto</span></>;
                            if (lastMsg.includes('Video') || lastMsg.includes('🎥')) return <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg><span>Video</span></>;
                            return <span>{lastMsg.replace(/\?\?/g, '').trim() || 'Sin mensajes'}</span>;
                          })()}
                        </div>
                      </div>
                      <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'4px', flexShrink:0 }}>
                        {time && <span style={{ fontSize:'11px', color:'#9ca3af' }}>{time}</span>}
                        {(chat.unread_count||0) > 0 && (
                          <div style={{ background:'#00c8a0', color:'#fff', borderRadius:'50%', width:'20px', height:'20px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:'700' }}>
                            {chat.unread_count}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              }

              {/* Estado vacío */}
              {realChats.length === 0 && (
                <div style={{ textAlign:'center', padding:'60px 20px', color:'#9ca3af' }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" style={{margin:'0 auto 16px',display:'block'}}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  <div style={{ fontSize:'15px', fontWeight:'600', color:'#374151', marginBottom:'6px' }}>Sin conversaciones</div>
                  <div style={{ fontSize:'13px' }}>Toca <strong>+</strong> para iniciar un chat</div>
                </div>
              )}
              {/* Estado vacío cuando el filtro no devuelve resultados */}
              {realChats.length > 0 && messageFilter !== 'all' && (() => {
                const filtered = realChats.filter(chat => {
                  const isGrp = chat.type === 'group';
                  if (messageFilter === 'group') return isGrp;
                  if (messageFilter === 'individual') return !isGrp;
                  if (messageFilter === 'money') {
                    const chatId = chat.id?.toString() || '';
                    const msgs = (chatMessages as any)[chatId] || [];
                    const hasMoneyMsg = msgs.some((m: any) => m.text?.includes('XAF') || m.text?.includes('💸') || m.text?.includes('Transferencia'));
                    const lastHasMoney = (chat.last_message?.text || '').includes('XAF');
                    return hasMoneyMsg || lastHasMoney;
                  }
                  return true;
                });
                if (filtered.length > 0) return null;
                const labels: Record<string,string> = { individual:'chats individuales', group:'grupos', money:'conversaciones de dinero' };
                return (
                  <div style={{ textAlign:'center', padding:'60px 20px', color:'#9ca3af' }}>
                    <div style={{ fontSize:'32px', marginBottom:'12px' }}>
                      {messageFilter === 'group' ? '👥' : messageFilter === 'money' ? '💸' : '💬'}
                    </div>
                    <div style={{ fontSize:'15px', fontWeight:'600', color:'#374151', marginBottom:'6px' }}>
                      No hay {labels[messageFilter] || 'resultados'}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        );
      case 'news':
        return (
          <div style={{
            paddingTop: viewPadding.top, paddingLeft: viewPadding.left, paddingRight: viewPadding.right, paddingBottom: viewPadding.bottom,
            minHeight: '100vh',
            background: 'transparent'
          }}>
            <h2 style={{ fontSize: '24px', marginBottom: '20px', color: '#ffffff', textAlign: 'center', fontWeight: '700', textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
              Centro de Noticias
            </h2>
            <div style={{
              background: 'rgba(243,244,246,0.85)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              padding: '20px',
              border: '1px solid rgba(0,0,0,0.08)'
            }}>
              {newsItems.slice(0, 5).map((news) => (
                <div key={news.id} style={{
                  padding: '15px',
                  borderRadius: '12px',
                  background: 'rgba(249,250,251,0.88)',
                  marginBottom: '12px'
                }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '500', color: '#0d0d0d', marginBottom: '8px' }}>
                    {news.title}
                  </h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#374151' }}>
                      {news.source}
                    </span>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>
                      {news.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'banking':
        return (
          <div style={{
            paddingTop: viewPadding.top, paddingLeft: viewPadding.left, paddingRight: viewPadding.right, paddingBottom: viewPadding.bottom,
            minHeight: '100vh',
            textAlign: 'center',
            background: 'transparent'
          }}>
            <h2 style={{ fontSize: '24px', marginBottom: '20px', color: '#ffffff', fontWeight: '700', textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
              Servicios Bancarios
            </h2>
            <p style={{ color: '#374151' }}>
              Funcian en desarrollo
            </p>
          </div>
        );
      case 'id-digital':
        return (
          <div style={{
            paddingTop: viewPadding.top, paddingLeft: viewPadding.left, paddingRight: viewPadding.right, paddingBottom: viewPadding.bottom,
            minHeight: '100vh',
            textAlign: 'center',
            background: 'transparent'
          }}>
            <h2 style={{ fontSize: '24px', marginBottom: '20px', color: '#ffffff', fontWeight: '700', textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
              ID Digital
            </h2>
            <div style={{
              background: 'rgba(243,244,246,0.85)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              padding: '30px 20px',
              border: '1px solid rgba(0,0,0,0.08)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '15px' }}></div>
              <div style={{ fontSize: '18px', fontWeight: '500', color: '#00c8a0', marginBottom: '5px' }}>
                Identidad Verificada
              </div>
              <div style={{ fontSize: '14px', color: '#374151' }}>
                ID: EG-2024-****789
              </div>
            </div>
          </div>
        );
      case 'monedero':
        return (
          <div style={{
            padding: `${device.isMobile ? '66px' : '60px'} 0 0`,
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            background: '#EEF2F7',
            }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
              flexShrink: 0,
              padding: '0 14px'
            }}>
              <h2 style={{
                fontSize: '16px',
                fontWeight: '700',
                color: '#1A2B4A',
                margin: 0
              }}>
                Mi Cartera
              </h2>
            </div>

          {/* Tarjeta de Balance Principal - ESTÁTICA */}
            <div style={{ padding: '0 14px', flexShrink: 0 }}>
              <div style={{
                background: 'linear-gradient(135deg, #1A3A6B 0%, #0E5F8A 50%, #0A7A8A 100%)',
                borderRadius: '20px',
                padding: '20px 18px 16px',
                marginBottom: '14px',
                boxShadow: '0 6px 24px rgba(14,95,138,0.25)'
              }}>
                {/* Label + saldo con animaci?n de revelado */}
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Monedero EGChat
                </div>
                <style>{`
                  @keyframes zipReveal {
                    0%   { clip-path: inset(0 100% 0 0); }
                    100% { clip-path: inset(0 0% 0 0); }
                  }
                  @keyframes zipCursor {
                    0%   { left: 0%; }
                    100% { left: 100%; }
                  }
                  @keyframes toothMove {
                    0%   { transform: translateX(0); }
                    100% { transform: translateX(200px); }
                  }
                  @keyframes countUp {
                    0%   { opacity: 0; transform: scale(0.8) translateY(4px); }
                    60%  { opacity: 1; transform: scale(1.05) translateY(-2px); }
                    100% { opacity: 1; transform: scale(1) translateY(0); }
                  }
                  @keyframes glowPulse {
                    0%, 100% { text-shadow: 0 0 0px rgba(0,200,160,0); }
                    50%       { text-shadow: 0 0 20px rgba(0,200,160,0.6), 0 0 40px rgba(0,180,230,0.3); }
                  }
                `}</style>
                <div style={{ position: 'relative', marginBottom: '2px', minHeight: '38px' }}>
                  {/* Saldo real ? siempre renderizado, revelado con clip-path */}
                  <div style={{
                    fontSize: '30px', fontWeight: '800', color: '#ffffff',
                    letterSpacing: '-1px', lineHeight: 1,
                    clipPath: balanceRevealed ? 'inset(0 0% 0 0)' : balanceRevealing ? undefined : 'inset(0 100% 0 0)',
                    animation: balanceRevealing ? 'zipReveal 1.2s cubic-bezier(0.25,0.46,0.45,0.94) forwards' : 'none',
                    userSelect: 'none',
                  }}>
                    <span style={{ animation: balanceRevealed ? 'countUp 0.5s ease forwards, glowPulse 1.5s ease 0.5s 2' : 'none', display: 'inline-block' }}>
                      {userBalance.toLocaleString()}
                    </span>
                    {' '}<span style={{ fontSize: '14px', fontWeight: '600', color: 'rgba(255,255,255,0.65)' }}>XAF</span>
                  </div>

                  {/* Capa oscura + cremallera ? visible cuando no revelado */}
                  {!balanceRevealed && (
                    <div
                      onClick={() => {
                        if (balanceRevealing) return;
                        setBalanceRevealing(true);
                        setTimeout(() => { setBalanceRevealed(true); setBalanceRevealing(false); }, 1300);
                      }}
                      style={{
                        position: 'absolute', inset: 0,
                        background: 'rgba(8,20,50,0.82)',
                        backdropFilter: 'blur(6px)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        overflow: 'hidden',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        clipPath: balanceRevealing ? 'inset(0 0 0 0)' : undefined,
                        animation: balanceRevealing ? 'zipReveal 1.2s cubic-bezier(0.25,0.46,0.45,0.94) reverse forwards' : 'none',
                      }}
                    >
                      {/* Dientes de cremallera superior */}
                      {balanceRevealing && (
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '6px', display: 'flex', animation: 'toothMove 1.2s linear forwards', gap: '3px', paddingLeft: '4px' }}>
                          {Array.from({length: 20}).map((_,i) => (
                            <div key={i} style={{ width: '6px', height: '6px', background: '#00c8a0', borderRadius: '0 0 3px 3px', flexShrink: 0 }}/>
                          ))}
                        </div>
                      )}
                      {/* Dientes de cremallera inferior */}
                      {balanceRevealing && (
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '6px', display: 'flex', animation: 'toothMove 1.2s linear forwards', gap: '3px', paddingLeft: '4px' }}>
                          {Array.from({length: 20}).map((_,i) => (
                            <div key={i} style={{ width: '6px', height: '6px', background: '#00b4e6', borderRadius: '3px 3px 0 0', flexShrink: 0 }}/>
                          ))}
                        </div>
                      )}
                      {/* Cursor de cremallera */}
                      {balanceRevealing && (
                        <div style={{
                          position: 'absolute', top: '50%', transform: 'translateY(-50%)',
                          width: '14px', height: '22px',
                          background: 'linear-gradient(135deg, #00c8a0, #00b4e6)',
                          borderRadius: '4px',
                          boxShadow: '0 0 16px #00c8a0, 0 0 32px rgba(0,200,160,0.5)',
                          animation: 'zipCursor 1.2s cubic-bezier(0.25,0.46,0.45,0.94) forwards',
                          zIndex: 10,
                        }}/>
                      )}
                      {/* L?nea central de cremallera */}
                      {balanceRevealing && (
                        <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '2px', background: 'rgba(0,200,160,0.3)', transform: 'translateY(-50%)' }}/>
                      )}
                      {/* Texto inicial */}
                      {!balanceRevealing && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.75)', fontSize: '12px', fontWeight: '600' }}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                          Toca para revelar
                        </div>
                      )}
                    </div>
                  )}

                  {/* Bot?n ocultar */}
                  {balanceRevealed && (
                    <button onClick={() => setBalanceRevealed(false)} style={{ position: 'absolute', top: '-2px', right: 0, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', padding: '2px' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    </button>
                  )}
                </div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)', fontWeight: '600', marginBottom: '18px' }}>
                  Saldo disponible
                </div>

                {/* 4 botones en una fila */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  {/* Recibir */}
                  <button onClick={() => { setQRType('receive'); setShowQRModal(true); setQrAmount(''); setQrConcept(''); }}
                    style={{ background: 'rgba(255,255,255,0.92)', border: 'none', color: '#1A2B4A', padding: '10px 4px', borderRadius: '12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', outline: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', transition: 'all 0.15s', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.92)'; e.currentTarget.style.transform = 'none'; }}>
                    <div style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0E5F8A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="8 17 12 21 16 17"/><line x1="12" y1="12" x2="12" y2="21"/>
                        <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/>
                      </svg>
                    </div>
                    <span style={{ color: '#1A2B4A' }}>Recibir</span>
                  </button>

                  {/* Pagar */}
                  <button onClick={() => { setQRType('pay'); setShowQRModal(true); setQrAmount(''); setQrConcept(''); }}
                    style={{ background: 'rgba(255,255,255,0.92)', border: 'none', color: '#1A2B4A', padding: '10px 4px', borderRadius: '12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', outline: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', transition: 'all 0.15s', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.92)'; e.currentTarget.style.transform = 'none'; }}>
                    <div style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#065F46" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/><line x1="6" y1="15" x2="10" y2="15"/>
                      </svg>
                    </div>
                    <span style={{ color: '#1A2B4A' }}>Pagar</span>
                  </button>

                  {/* Recarga */}
                  <button onClick={() => { setShowSalaryReloadModal(true); setShowSalaryReloadData({ amount: '', accountId: '', concept: '' }); }}
                    style={{ background: 'rgba(255,255,255,0.92)', border: 'none', color: '#1A2B4A', padding: '10px 4px', borderRadius: '12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', outline: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', transition: 'all 0.15s', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.92)'; e.currentTarget.style.transform = 'none'; }}>
                    <div style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#92400E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="16 17 12 21 8 17"/><line x1="12" y1="12" x2="12" y2="21"/>
                        <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/>
                      </svg>
                    </div>
                    <span style={{ color: '#1A2B4A' }}>Recarga</span>
                  </button>

                  {/* Retiro */}
                  <button onClick={() => { setShowCardWithdrawalModal(true); setCardWithdrawalData({ amount: '', accountId: '', cardNumber: '' }); }}
                    style={{ background: 'rgba(255,255,255,0.92)', border: 'none', color: '#1A2B4A', padding: '10px 4px', borderRadius: '12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', outline: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', transition: 'all 0.15s', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.92)'; e.currentTarget.style.transform = 'none'; }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#F3F0FD', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4C1D95" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                      </svg>
                    </div>
                    <span style={{ color: '#1A2B4A' }}>Retiro</span>
                  </button>
                </div>
              </div>
            </div>{/* fin tarjeta esttica */}

            {/* Contenedor con scroll - desde Mis Cuentas */}
            <div
              className="scroll-container"
              style={{
                overflowY: 'scroll',
                overflowX: 'hidden',
                WebkitOverflowScrolling: 'touch' as any,
                flex: 1,
                padding: '0 14px 100px'
              }}>
              {/* Mis Cuentas */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <h3 style={{
                    fontSize: '14px',
                    fontWeight: '800',
                    color: '#0d0d0d',
                    margin: 0,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Mis Cuentas
                  </h3>
                  <button
                    onClick={() => setShowAddBankAccount(true)}
                    style={{
                      background: 'rgba(52, 211, 153, 0.12)',
                      border: '1px solid rgba(52, 211, 153, 0.25)',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: '#00e5ff',
                      outline: 'none',
                      fontSize: '16px',
                      fontWeight: 'bold'
                    }}
                  >
                    +
                  </button>
                </div>
                {bankAccounts.map((account) => (
                  <button
                    key={account.id}
                    onClick={() => console.log(`Abriendo cuenta: ${account.bank}`)}
                    style={{
                      width: '100%',
                      background: '#FFFFFF',
                      border: '1px solid rgba(0,0,0,0.07)',
                      borderRadius: '12px',
                      padding: '12px',
                      marginBottom: '8px',
                      color: '#0d0d0d',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      outline: 'none',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f9fafb';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#ffffff';
                    }}
                  >
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, rgba(52,211,153,0.1) 0%, rgba(96,165,250,0.1) 100%)',
                      border: '1px solid rgba(52,211,153,0.18)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#00e5ff',
                      flexShrink: 0
                    }}>
                      {renderIcon(account.icon, 18)}
                    </div>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#0d0d0d', marginBottom: '2px' }}>
                        {account.bank}
                      </div>
                      <div style={{ fontSize: '13px', color: '#6b7280' }}>
                        {account.type}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '12px', fontWeight: '800', color: '#0d0d0d' }}>
                        {account.balance.toLocaleString()}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>XAF</div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Transferencias Pendientes */}
              {pendingTransfers.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <h3 style={{
                    fontSize: '14px',
                    fontWeight: '700',
                    color: '#b45309',
                    margin: '0 0 8px 0',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                    Transferencias Pendientes
                  </h3>
                  {pendingTransfers.filter(t => t.status === 'pending').map((transfer) => (
                    <button
                      key={transfer.id}
                      onClick={() => console.log(`Detalles de transferencia: ${transfer.id}`)}
                      style={{
                        width: '100%',
                        background: 'rgba(180, 83, 9, 0.04)',
                        border: '1px solid rgba(180, 83, 9, 0.12)',
                        borderRadius: '10px',
                        padding: '10px',
                        marginBottom: '6px',
                        color: '#0d0d0d',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        outline: 'none',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(180, 83, 9, 0.08)';
                        e.currentTarget.style.borderColor = 'rgba(180, 83, 9, 0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(180, 83, 9, 0.04)';
                        e.currentTarget.style.borderColor = 'rgba(180, 83, 9, 0.12)';
                      }}
                    >
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'rgba(180, 83, 9, 0.08)',
                        border: '1px solid rgba(180, 83, 9, 0.18)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                        </svg>
                      </div>
                      <div style={{ flex: 1, textAlign: 'left' }}>
                        <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '2px' }}>
                          {transfer.from} ? {transfer.to}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          Expira en {Math.max(0, Math.ceil((transfer.expiresAt.getTime() - Date.now()) / 1000 / 60))} min
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#b45309' }}>
                          {transfer.amount.toLocaleString()} XAF
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Cancelar transferencia
                            const updatedTransfers = pendingTransfers.map(t =>
                              t.id === transfer.id ? { ...t, status: 'cancelled' as const } : t
                            );
                            setPendingTransfers(updatedTransfers);
                            
                            // Devolver dinero
                            const sourceAccount = bankAccounts.find(a => a.bank === transfer.from);
                            if (sourceAccount) {
                              const updatedAccounts = bankAccounts.map(acc =>
                                acc.id === sourceAccount.id
                                  ? { ...acc, balance: acc.balance + transfer.amount }
                                  : acc
                              );
                              setBankAccounts(updatedAccounts);
                            }
                            
                            
                          }}
                          style={{
                            background: 'rgba(248, 113, 113, 0.1)',
                            border: '1px solid rgba(248, 113, 113, 0.25)',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#f87171',
                            cursor: 'pointer',
                            outline: 'none',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(248, 113, 113, 0.18)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(248, 113, 113, 0.1)';
                          }}
                        >
                          Cancelar
                        </button>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Transacciones Recientes */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <h3 style={{
                    fontSize: '14px',
                    fontWeight: '800',
                    color: '#0d0d0d',
                    margin: 0,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Historial de Transferencias
                  </h3>
                  <button
                    onClick={() => setCurrentView('historial-completo')}
                    style={{
                      fontSize: '13px',
                      color: '#00e5ff',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      outline: 'none',
                      fontWeight: '600'
                    }}
                  >
                    Ver todo →
                  </button>
                </div>
                {transactionHistory
                  .filter(trans => trans.type === 'sent' || trans.type === 'received')
                  .map((trans) => (
                  <button
                    key={trans.id}
                    onClick={() => {
                      setSelectedTransaction(trans);
                      setShowTransactionDetail(true);
                    }}
                    style={{
                      width: '100%',
                      background: '#FFFFFF',
                      border: '1px solid rgba(0,0,0,0.07)',
                      borderRadius: '12px',
                      padding: '12px',
                      marginBottom: '8px',
                      color: '#0d0d0d',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      outline: 'none',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#f9fafb'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; }}
                  >
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '50%',
                      background: (trans.type === 'received' || trans.type === 'deposit' || trans.type === 'salary')
                        ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)',
                      border: `1px solid ${(trans.type === 'received' || trans.type === 'deposit' || trans.type === 'salary') ? 'rgba(52,211,153,0.2)' : 'rgba(248,113,113,0.2)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {trans.type === 'salary' ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="9"/><path d="M9 12h6"/><path d="M12 9v6"/>
                        </svg>
                      ) : trans.type === 'card_withdrawal' ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
                        </svg>
                      ) : trans.type === 'received' || trans.type === 'deposit' ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
                        </svg>
                      )}
                    </div>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#0d0d0d', marginBottom: '2px' }}>
                        {trans.type === 'sent' ? '↗️ Enviado' : '↙️ Recibido'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#374151', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {trans.description}
                      </div>
                      <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                        {trans.date}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '12px', fontWeight: '800', color: trans.type === 'received' ? '#00e5ff' : '#f87171' }}>
                        {trans.type === 'received' ? '+' : '-'}{trans.amount.toLocaleString()}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>XAF</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      case 'historial-completo':
        return (
          <div style={{
            padding: `${device.isMobile ? '66px' : '60px'} 12px ${device.isMobile ? '90px' : '24px'}`,
            height: '100vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            background: 'transparent'
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px'
            }}>
              <h2 style={{
                fontSize: '16px',
                fontWeight: '700',
                color: '#ffffff',
                margin: 0,
                textShadow: '0 1px 4px rgba(0,0,0,0.4)'
              }}>
                Historial Completo
              </h2>
              <button
                onClick={() => setCurrentView('monedero')}
                style={{
                  background: 'rgba(243,244,246,0.85)',
                  border: '1px solid rgba(0,0,0,0.12)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#0d0d0d',
                  outline: 'none'
                }}
              ><svg width='16' height='16' viewBox='0 0 24 24' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round'><line x1='18' y1='6' x2='6' y2='18'/><line x1='6' y1='6' x2='18' y2='18'/></svg></button>
            </div>

            {/* Filtros */}
            <div style={{
              display: 'flex',
              gap: '6px',
              marginBottom: '12px',
              overflowX: 'auto',
              paddingBottom: '6px'
            }}>
              {['all', 'sent', 'received', 'payment', 'deposit', 'withdrawal'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setTransactionFilter(filter as any)}
                  style={{
                    padding: '6px 12px',
                    background: transactionFilter === filter ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    border: transactionFilter === filter ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(0,0,0,0.08)',
                    borderRadius: '20px',
                    color: transactionFilter === filter ? '#00c8a0' : 'rgba(255, 255, 255, 0.6)',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    outline: 'none',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {filter === 'all' ? 'Todas' : filter === 'sent' ? 'Enviadas' : filter === 'received' ? 'Recibidas' : filter === 'payment' ? 'Pagos' : filter === 'deposit' ? 'Depsitos' : 'Retiros'}
                </button>
              ))}
            </div>

            {/* Lista de Transacciones */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden'
            }}>
              {transactionHistory
                .filter(trans => transactionFilter === 'all' || trans.type === transactionFilter)
                .map((trans) => (
                  <button
                    key={trans.id}
                    onClick={() => {
                      setSelectedTransaction(trans);
                      setShowTransactionDetail(true);
                    }}
                    style={{
                      width: '100%',
                      background: 'rgba(250,250,250,0.88)',
                      border: '1px solid rgba(0,0,0,0.07)',
                      borderRadius: '8px',
                      padding: '10px',
                      marginBottom: '6px',
                      color: '#0d0d0d',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      outline: 'none',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                      e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)';
                    }}
                  >
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: trans.type === 'received' || trans.type === 'deposit' || trans.type === 'salary' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                      border: `2px solid ${trans.type === 'received' || trans.type === 'deposit' || trans.type === 'salary' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: trans.type === 'received' || trans.type === 'deposit' || trans.type === 'salary' ? '#00c8a0' : '#ef4444',
                      flexShrink: 0
                    }}>
                      {trans.type === 'salary' ? '' : trans.type === 'card_withdrawal' ? '' : trans.type === 'received' || trans.type === 'deposit' ? '' : ''}
                    </div>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '2px' }}>
                        {trans.description}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        {trans.date} a {trans.status === 'completed' ? '✅ Completada' : trans.status === 'pending' ? '⏳ Pendiente' : '❌ Fallida'}
                      </div>
                    </div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: trans.type === 'received' || trans.type === 'deposit' || trans.type === 'salary' ? '#00c8a0' : '#ef4444'
                    }}>
                      {trans.type === 'received' || trans.type === 'deposit' || trans.type === 'salary' ? '+' : '-'}{trans.amount.toLocaleString()} XAF
                    </div>
                  </button>
                ))}
            </div>
          </div>
        );
      case 'contactos':
        // La carga se hace via useEffect cuando currentView === 'contactos'
        return (
          <div style={{
            padding: '66px 12px 100px',
            height: '100vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            background: '#f0f2f5'
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px'
            }}>
              <h2 style={{
                fontSize: '16px',
                fontWeight: '700',
                color: '#111827',
                margin: 0,
              }}>
                 Mis Contactos
              </h2>
              <button
                onClick={() => setCurrentView('home')}
                style={{
                  background: 'rgba(243,244,246,0.85)',
                  border: '1px solid rgba(0,0,0,0.12)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#0d0d0d',
                  outline: 'none'
                }}
              ><svg width='16' height='16' viewBox='0 0 24 24' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round'><line x1='18' y1='6' x2='6' y2='18'/><line x1='6' y1='6' x2='18' y2='18'/></svg></button>
            </div>

            {/* Botones de accin */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              marginBottom: '12px'
            }}>
              <button
                onClick={() => {
                  setShowAddContact(true);
                  setNewContactPhone(''); setNewContactName('');
                }}
                style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(16, 185, 129, 0.2))',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  color: '#00c8a0',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.4), rgba(16, 185, 129, 0.3))';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(16, 185, 129, 0.2))';
                }}
              >
                + Agregar
              </button>
              <button
                onClick={() => setShowQRScannerCamera(true)}
                style={{
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(59, 130, 246, 0.2))',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  color: '#00b4e6',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.4), rgba(59, 130, 246, 0.3))';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(59, 130, 246, 0.2))';
                }}
              >
                 Escanear QR
              </button>
            </div>

            {/* Lista de Contactos */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden'
            }}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px', textTransform: 'uppercase' }}>
                Total: {allContacts.length} contactos
              </div>
              {(() => {
                const sorted = [...allContacts].sort((a, b) => {
                  const aFirst = a.name.trim()[0]?.toUpperCase() || '';
                  const bFirst = b.name.trim()[0]?.toUpperCase() || '';
                  const aIsLetter = /[A-ZÁÉÍÓÚÑ]/.test(aFirst);
                  const bIsLetter = /[A-ZÁÉÍÓÚÑ]/.test(bFirst);
                  if (aIsLetter && !bIsLetter) return -1;
                  if (!aIsLetter && bIsLetter) return 1;
                  return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
                });
                const groups: { letter: string; contacts: typeof sorted }[] = [];
                sorted.forEach(contact => {
                  const first = contact.name.trim()[0]?.toUpperCase() || '#';
                  const letter = /[A-ZÁÉÍÓÚÑ]/.test(first) ? first.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : '#';
                  const last = groups[groups.length - 1];
                  if (last && last.letter === letter) { last.contacts.push(contact); }
                  else { groups.push({ letter, contacts: [contact] }); }
                });
                return (<>
                  {groups.map(group => (
                  <div key={group.letter}>
                    {/* Cabecera de letra */}
                    <div style={{ fontSize: '12px', fontWeight: '800', color: '#00c8a0', padding: '6px 4px 4px', letterSpacing: '0.5px', borderBottom: '1px solid #f0f0f0', marginBottom: '4px' }}>
                      {group.letter === '#' ? '# 0-9' : group.letter}
                    </div>
                    {group.contacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={async () => {
                    setIsMenuOpen(false);
                    try {
                      const chat = await chatAPI.createPrivate(contact.id);
                      if (chat?.id) {
                        const name = contact.name || 'Chat';
                        setSelectedChat({
                          id: chat.id,
                          type: 'individual',
                          title: name,
                          subtitle: '',
                          time: '',
                          status: contact.status || 'offline',
                          initials: name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase(),
                          color: '#00c8a0',
                          avatarUrl: contact.avatarUrl || '',
                        });
                        navigateTo('Mensajería');
                      }
                    } catch {}
                  }}
                  style={{
                    width: '100%',
                    background: 'rgba(250,250,250,0.88)',
                    border: '1px solid rgba(0,0,0,0.07)',
                    borderRadius: '8px',
                    padding: '10px',
                    marginBottom: '6px',
                    color: '#0d0d0d',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    outline: 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {/* Avatar con foto editable */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '50%',
                      background: 'linear-gradient(135deg, #00c8a0, #00b4e6)',
                      overflow: 'hidden', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: '16px', fontWeight: '700', color: '#fff',
                      border: `2px solid ${contact.status === 'online' ? '#00c8a0' : contact.status === 'away' ? '#f59e0b' : '#9ca3af'}`
                    }}>
                      {contact.avatarUrl
                        ? <img src={contact.avatarUrl} alt={contact.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                        : <span>{contact.avatar}</span>
                      }
                    </div>
                    {/* Bot?n cambiar foto */}
                    <button onClick={(e) => {
                      e.stopPropagation();
                      const inp = document.createElement('input');
                      inp.type = 'file'; inp.accept = 'image/*';
                      inp.onchange = () => {
                        const f = inp.files?.[0];
                        if (f) {
                          const r = new FileReader();
                          r.onload = (ev) => {
                            const url = ev.target?.result as string;
                            setAllContacts(prev => prev.map(c => c.id === contact.id ? { ...c, avatarUrl: url } : c));
                          };
                          r.readAsDataURL(f);
                        }
                      };
                      inp.click();
                    }} style={{
                      position: 'absolute', bottom: -2, right: -2,
                      width: '18px', height: '18px', borderRadius: '50%',
                      background: '#00c8a0', border: '1.5px solid #fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', outline: 'none', padding: 0
                    }}>
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                    </button>
                  </div>

                  {/* información */}
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '2px', color: '#0d0d0d' }}>
                      {contact.name}
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>
                      {contact.phone}
                    </div>
                  </div>

                  {/* Bot?n favorito */}
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      const isFav = favoriteContacts.some((f: any) => f.id?.toString() === contact.id?.toString());
                      try {
                        if (isFav) {
                          await contactsAPI.unfavorite(contact.id);
                          setFavoriteContacts(prev => prev.filter((f: any) => f.id?.toString() !== contact.id?.toString()));
                        } else {
                          await contactsAPI.favorite(contact.id);
                          const updated = await contactsAPI.getFavorites();
                          setFavoriteContacts(updated || []);
                        }
                      } catch {}
                    }}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                      color: favoriteContacts.some((f: any) => f.id?.toString() === contact.id?.toString()) ? '#F59E0B' : '#d1d5db',
                      flexShrink: 0, display: 'flex', alignItems: 'center'
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill={favoriteContacts.some((f: any) => f.id?.toString() === contact.id?.toString()) ? '#F59E0B' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  </button>

                  {/* Estado online */}
                  <div style={{
                    fontSize: '13px', fontWeight: '600',
                    color: contact.status === 'online' ? '#00c8a0' : contact.status === 'away' ? '#f59e0b' : '#9ca3af',
                    flexShrink: 0
                  }}>
                    {contact.status === 'online' ? '● En línea' : contact.status === 'away' ? '● Ausente' : '○ Desconectado'}
                  </div>
                </button>
                    ))}
                  </div>
                ))}
                </>);
              })()}
            </div>
          </div>
        );
      case 'grupos':
        return (
          <div style={{
            padding: `${device.isMobile ? '66px' : '60px'} 12px ${device.isMobile ? '90px' : '24px'}`,
            height: '100vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            background: 'transparent'
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px'
            }}>
              <h2 style={{
                fontSize: '16px',
                fontWeight: '700',
                color: '#ffffff',
                margin: 0,
                textShadow: '0 1px 4px rgba(0,0,0,0.4)'
              }}>
                 Mis Grupos
              </h2>
              <button
                onClick={() => setCurrentView('home')}
                style={{
                  background: 'rgba(243,244,246,0.85)',
                  border: '1px solid rgba(0,0,0,0.12)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#0d0d0d',
                  outline: 'none'
                }}
              ><svg width='16' height='16' viewBox='0 0 24 24' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round'><line x1='18' y1='6' x2='6' y2='18'/><line x1='6' y1='6' x2='18' y2='18'/></svg></button>
            </div>

            {/* Botan Crear Grupo */}
            <button
              onClick={() => {
                setGroupName('');
                setGroupMembers([]);
                setShowCreateGroup(true);
              }}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.3), rgba(168, 85, 247, 0.2))',
                border: '1px solid rgba(168, 85, 247, 0.4)',
                color: '#a855f7',
                padding: '10px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                outline: 'none',
                marginBottom: '12px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(168, 85, 247, 0.4), rgba(168, 85, 247, 0.3))';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(168, 85, 247, 0.3), rgba(168, 85, 247, 0.2))';
              }}
            >
              + Crear Nuevo Grupo
            </button>

            {/* Lista de Grupos */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden'
            }}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px', textTransform: 'uppercase' }}>
                Total: {allGroups.length} grupos
              </div>
              {allGroups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => setSelectedChat({
                    id: group.id,
                    type: 'group',
                    title: group.name,
                    subtitle: group.lastMessage || 'Grupo',
                    time: '',
                    status: 'online',
                    initials: group.name.slice(0,2).toUpperCase(),
                    color: '#a855f7',
                    avatarUrl: group.avatarUrl,
                    isGroup: true,
                    members: group.members,
                    description: group.description,
                  })}
                  style={{
                    width: '100%',
                    background: 'rgba(250,250,250,0.88)',
                    border: '1px solid rgba(0,0,0,0.07)',
                    borderRadius: '8px',
                    padding: '10px',
                    marginBottom: '6px',
                    color: '#0d0d0d',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                >
                  {/* Avatar grupo con foto editable */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '50%',
                      background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                      overflow: 'hidden', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', border: '2px solid rgba(168,85,247,0.4)'
                    }}>
                      {group.avatarUrl
                        ? <img src={group.avatarUrl} alt={group.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                        : (() => {
                            const p = {width:20,height:20,viewBox:'0 0 24 24',fill:'none',stroke:'#fff',strokeWidth:1.8,strokeLinecap:'round' as const,strokeLinejoin:'round' as const};
                            switch(group.avatar) {
                              case 'family':  return <svg {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
                              case 'work':    return <svg {...p}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>;
                              case 'project': return <svg {...p}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
                              default:        return <svg {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
                            }
                          })()
                      }
                    </div>
                    {/* Bot?n cambiar foto grupo */}
                    <button onClick={(e) => {
                      e.stopPropagation();
                      const inp = document.createElement('input');
                      inp.type = 'file'; inp.accept = 'image/*';
                      inp.onchange = () => {
                        const f = inp.files?.[0];
                        if (f) {
                          const r = new FileReader();
                          r.onload = (ev) => {
                            const url = ev.target?.result as string;
                            setAllGroups(prev => prev.map(g => g.id === group.id ? { ...g, avatarUrl: url } : g));
                          };
                          r.readAsDataURL(f);
                        }
                      };
                      inp.click();
                    }} style={{
                      position: 'absolute', bottom: -2, right: -2,
                      width: '18px', height: '18px', borderRadius: '50%',
                      background: '#a855f7', border: '1.5px solid #fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', outline: 'none', padding: 0
                    }}>
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                    </button>
                  </div>

                  {/* información */}
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '2px', color: '#0d0d0d' }}>
                      {group.name}
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>
                      {group.members} miembros ? {group.lastMessage}
                    </div>
                  </div>

                  {/* Bot?n favorito grupo */}
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      const gid = group.id?.toString();
                      const isFav = favoriteGroupIds.includes(gid);
                      try {
                        if (isFav) {
                          await chatAPI.unfavoriteChat(gid);
                          setFavoriteGroupIds(prev => prev.filter(x => x !== gid));
                        } else {
                          await chatAPI.favoriteChat(gid);
                          setFavoriteGroupIds(prev => [...prev, gid]);
                        }
                      } catch {
                        // fallback local si falla la API
                        setFavoriteGroupIds(prev =>
                          prev.includes(gid) ? prev.filter(x => x !== gid) : [...prev, gid]
                        );
                      }
                    }}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                      color: favoriteGroupIds.includes(group.id?.toString()) ? '#F59E0B' : '#d1d5db',
                      flexShrink: 0, display: 'flex', alignItems: 'center'
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill={favoriteGroupIds.includes(group.id?.toString()) ? '#F59E0B' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  </button>

                  {/* Badge no le?dos */}
                  {group.unread > 0 && (
                    <div style={{
                      background: '#00c8a0',
                      color: '#fff',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      flexShrink: 0
                    }}>
                      {group.unread}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        );
      case 'ajustes':
        return (
          <div style={{
            padding: `${device.isMobile ? '66px' : '60px'} 12px ${device.isMobile ? '90px' : '24px'}`,
            height: '100vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            background: 'transparent'
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px'
            }}>
              <h2 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#0d0d0d',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                Ajustes
              </h2>
              <button
                onClick={() => setCurrentView('home')}
                style={{
                  background: 'rgba(243,244,246,0.85)',
                  border: '1px solid rgba(0,0,0,0.12)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#0d0d0d',
                  outline: 'none'
                }}
              ><svg width='16' height='16' viewBox='0 0 24 24' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round'><line x1='18' y1='6' x2='6' y2='18'/><line x1='6' y1='6' x2='18' y2='18'/></svg></button>
            </div>

            {/* Tabs */}
            <div style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '12px',
              borderBottom: '1px solid rgba(0,0,0,0.08)',
              paddingBottom: '8px'
            }}>
              <button
                onClick={() => setCurrentSettingsTab('perfil')}
                style={{ padding: '8px 14px', background: currentSettingsTab === 'perfil' ? 'rgba(0,200,160,0.15)' : '#f3f4f6', border: currentSettingsTab === 'perfil' ? '1.5px solid rgba(0,200,160,0.5)' : '1px solid rgba(0,0,0,0.08)', borderRadius: '8px', color: currentSettingsTab === 'perfil' ? '#00c8a0' : '#374151', fontSize: '14px', fontWeight: '600', cursor: 'pointer', outline: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Perfil
              </button>
              <button
                onClick={() => setCurrentSettingsTab('sonidos')}
                style={{ padding: '8px 12px', background: currentSettingsTab === 'sonidos' ? 'rgba(245,158,11,0.15)' : '#f3f4f6', border: currentSettingsTab === 'sonidos' ? '1.5px solid rgba(245,158,11,0.5)' : '1px solid rgba(0,0,0,0.08)', borderRadius: '8px', color: currentSettingsTab === 'sonidos' ? '#f59e0b' : '#374151', fontSize: '12px', fontWeight: '600', cursor: 'pointer', outline: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                Sonidos
              </button>
              <button
                onClick={() => setCurrentSettingsTab('ayuda')}
                style={{ padding: '8px 12px', background: currentSettingsTab === 'ayuda' ? 'rgba(0,180,230,0.15)' : '#f3f4f6', border: currentSettingsTab === 'ayuda' ? '1.5px solid rgba(0,180,230,0.5)' : '1px solid rgba(0,0,0,0.08)', borderRadius: '8px', color: currentSettingsTab === 'ayuda' ? '#00b4e6' : '#374151', fontSize: '12px', fontWeight: '600', cursor: 'pointer', outline: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
                Ayuda
              </button>
              <button
                onClick={() => setCurrentSettingsTab('actividad')}
                style={{ padding: '8px 12px', background: currentSettingsTab === 'actividad' ? 'rgba(168,85,247,0.15)' : '#f3f4f6', border: currentSettingsTab === 'actividad' ? '1.5px solid rgba(168,85,247,0.5)' : '1px solid rgba(0,0,0,0.08)', borderRadius: '8px', color: currentSettingsTab === 'actividad' ? '#a855f7' : '#374151', fontSize: '12px', fontWeight: '600', cursor: 'pointer', outline: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                Actividad
              </button>
              <button
                onClick={() => setCurrentSettingsTab('apariencia')}
                style={{ padding: '8px 12px', background: currentSettingsTab === 'apariencia' ? 'rgba(0,180,230,0.15)' : '#f3f4f6', border: currentSettingsTab === 'apariencia' ? '1.5px solid rgba(0,180,230,0.5)' : '1px solid rgba(0,0,0,0.08)', borderRadius: '8px', color: currentSettingsTab === 'apariencia' ? '#00b4e6' : '#374151', fontSize: '12px', fontWeight: '600', cursor: 'pointer', outline: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>
                Apariencia
              </button>
            </div>

            {/* Contenido */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden'
            }}>
              {/* TAB SONIDOS */}
              {currentSettingsTab === 'sonidos' && (
                <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>

                  {/* Volumen */}
                  <div style={{ background:'#fff', borderRadius:'14px', padding:'16px', border:'1px solid rgba(0,0,0,0.07)' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px' }}>
                      <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:'#fef3c7', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:'15px', fontWeight:'700', color:'#111827' }}>Volumen</div>
                        <div style={{ fontSize:'12px', color:'#9ca3af' }}>{Math.round(soundSettings.volume * 100)}%</div>
                      </div>
                    </div>
                    <input type="range" min="0" max="1" step="0.05" value={soundSettings.volume}
                      onChange={e => updateSoundSetting('volume', parseFloat(e.target.value))}
                      style={{ width:'100%', accentColor:'#f59e0b', height:'4px' }}/>
                  </div>

                  {/* vibración */}
                  <div style={{ background:'#fff', borderRadius:'14px', padding:'16px', border:'1px solid rgba(0,0,0,0.07)', display:'flex', alignItems:'center', gap:'12px' }}>
                    <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:'#f0fdf4', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"><path d="M2 12h1M21 12h1M4.22 4.22l.71.71M18.36 18.36l.71.71M4.22 19.78l.71-.71M18.36 5.64l.71-.71"/><circle cx="12" cy="12" r="4"/></svg>
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:'15px', fontWeight:'700', color:'#111827' }}>vibración</div>
                      <div style={{ fontSize:'12px', color:'#9ca3af' }}>Al recibir mensajes y llamadas</div>
                    </div>
                    <div onClick={() => updateSoundSetting('vibrationEnabled', !soundSettings.vibrationEnabled)}
                      style={{ width:'44px', height:'24px', borderRadius:'12px', background: soundSettings.vibrationEnabled ? '#22c55e' : '#d1d5db', cursor:'pointer', position:'relative', transition:'background 0.2s', flexShrink:0 }}>
                      <div style={{ position:'absolute', top:'2px', left: soundSettings.vibrationEnabled ? '22px' : '2px', width:'20px', height:'20px', borderRadius:'50%', background:'#fff', boxShadow:'0 1px 3px rgba(0,0,0,0.2)', transition:'left 0.2s' }}/>
                    </div>
                  </div>

                  {/* Tono de mensajes */}
                  <div style={{ background:'#fff', borderRadius:'14px', padding:'16px', border:'1px solid rgba(0,0,0,0.07)' }}>
                    <div style={{ fontSize:'13px', fontWeight:'700', color:'#374151', marginBottom:'12px', textTransform:'uppercase', letterSpacing:'0.3px', display:'flex', alignItems:'center', gap:'6px' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                      Tono de mensajes
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                      {MESSAGE_TONES.map(tone => (
                        <button key={tone.id} onClick={() => { updateSoundSetting('messageTone', tone.id); if (tone.id !== 'none') tone.play(soundSettings.volume); }}
                          style={{ display:'flex', alignItems:'center', gap:'12px', padding:'10px 12px', background: soundSettings.messageTone === tone.id ? '#f0fdf4' : '#f9fafb', border: soundSettings.messageTone === tone.id ? '1.5px solid #22c55e' : '1px solid #f0f0f0', borderRadius:'10px', cursor:'pointer', outline:'none', textAlign:'left', fontFamily:'inherit' }}>
                          <div style={{ width:'32px', height:'32px', borderRadius:'8px', background: soundSettings.messageTone === tone.id ? '#22c55e' : '#e5e7eb', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                            {soundSettings.messageTone === tone.id
                              ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                              : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/></svg>
                            }
                          </div>
                          <span style={{ fontSize:'14px', fontWeight: soundSettings.messageTone === tone.id ? '700' : '500', color: soundSettings.messageTone === tone.id ? '#16a34a' : '#374151', flex:1 }}>{tone.name}</span>
                          <button onClick={e => { e.stopPropagation(); if (tone.id !== 'none') tone.play(soundSettings.volume); }}
                            style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', padding:'4px', display:'flex' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                          </button>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tono de llamada */}
                  <div style={{ background:'#fff', borderRadius:'14px', padding:'16px', border:'1px solid rgba(0,0,0,0.07)' }}>
                    <div style={{ fontSize:'13px', fontWeight:'700', color:'#374151', marginBottom:'12px', textTransform:'uppercase', letterSpacing:'0.3px', display:'flex', alignItems:'center', gap:'6px' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.8a16 16 0 0 0 6.06 6.06l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                      Tono de llamada
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                      {RINGTONES.map(tone => (
                        <button key={tone.id} onClick={() => { updateSoundSetting('ringtone', tone.id); if (tone.id !== 'none' && tone.id !== 'vibrate_only') tone.play(soundSettings.volume); }}
                          style={{ display:'flex', alignItems:'center', gap:'12px', padding:'10px 12px', background: soundSettings.ringtone === tone.id ? '#eff6ff' : '#f9fafb', border: soundSettings.ringtone === tone.id ? '1.5px solid #3b82f6' : '1px solid #f0f0f0', borderRadius:'10px', cursor:'pointer', outline:'none', textAlign:'left', fontFamily:'inherit' }}>
                          <div style={{ width:'32px', height:'32px', borderRadius:'8px', background: soundSettings.ringtone === tone.id ? '#3b82f6' : '#e5e7eb', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                            {soundSettings.ringtone === tone.id
                              ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                              : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12"/></svg>
                            }
                          </div>
                          <span style={{ fontSize:'14px', fontWeight: soundSettings.ringtone === tone.id ? '700' : '500', color: soundSettings.ringtone === tone.id ? '#2563eb' : '#374151', flex:1 }}>{tone.name}</span>
                          {tone.id !== 'none' && tone.id !== 'vibrate_only' && (
                            <button onClick={e => { e.stopPropagation(); tone.play(soundSettings.volume); }}
                              style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', padding:'4px', display:'flex' }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                            </button>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tono de notificación */}
                  <div style={{ background:'#fff', borderRadius:'14px', padding:'16px', border:'1px solid rgba(0,0,0,0.07)' }}>
                    <div style={{ fontSize:'13px', fontWeight:'700', color:'#374151', marginBottom:'12px', textTransform:'uppercase', letterSpacing:'0.3px', display:'flex', alignItems:'center', gap:'6px' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                      Tono de notificación
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                      {NOTIFICATION_TONES.map(tone => (
                        <button key={tone.id} onClick={() => { updateSoundSetting('notificationTone', tone.id); if (tone.id !== 'none') tone.play(soundSettings.volume); }}
                          style={{ display:'flex', alignItems:'center', gap:'12px', padding:'10px 12px', background: soundSettings.notificationTone === tone.id ? '#fdf4ff' : '#f9fafb', border: soundSettings.notificationTone === tone.id ? '1.5px solid #a855f7' : '1px solid #f0f0f0', borderRadius:'10px', cursor:'pointer', outline:'none', textAlign:'left', fontFamily:'inherit' }}>
                          <div style={{ width:'32px', height:'32px', borderRadius:'8px', background: soundSettings.notificationTone === tone.id ? '#a855f7' : '#e5e7eb', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                            {soundSettings.notificationTone === tone.id
                              ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                              : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/></svg>
                            }
                          </div>
                          <span style={{ fontSize:'14px', fontWeight: soundSettings.notificationTone === tone.id ? '700' : '500', color: soundSettings.notificationTone === tone.id ? '#7c3aed' : '#374151', flex:1 }}>{tone.name}</span>
                          {tone.id !== 'none' && (
                            <button onClick={e => { e.stopPropagation(); tone.play(soundSettings.volume); }}
                              style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', padding:'4px', display:'flex' }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                            </button>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* -- TONOS PERSONALIZADOS -- */}
                  <div style={{ background:'#fff', borderRadius:'14px', padding:'16px', border:'1px solid rgba(0,0,0,0.07)' }}>
                    <div style={{ fontSize:'13px', fontWeight:'700', color:'#374151', marginBottom:'12px', textTransform:'uppercase', letterSpacing:'0.3px', display:'flex', alignItems:'center', gap:'6px' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
                      Mis tonos personalizados
                    </div>

                    {/* Botones para subir */}
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px', marginBottom:'14px' }}>
                      {[
                        { label:'Mensaje', type:'message' as const, color:'#22c55e', bg:'#f0fdf4' },
                        { label:'Llamada', type:'ringtone' as const, color:'#3b82f6', bg:'#eff6ff' },
                        { label:'Notif.', type:'notification' as const, color:'#a855f7', bg:'#fdf4ff' },
                      ].map(btn => (
                        <button key={btn.type} onClick={() => {
                          const inp = document.createElement('input');
                          inp.type = 'file'; inp.accept = 'audio/*'; inp.style.display = 'none';
                          document.body.appendChild(inp);
                          inp.onchange = () => {
                            const file = inp.files?.[0];
                            document.body.removeChild(inp);
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = (e) => {
                              const url = e.target?.result as string;
                              const name = file.name.replace(/\.[^.]+$/, '').slice(0, 30);
                              const id = `custom_${Date.now()}`;
                              const newTone = { id, name, url, type: btn.type };
                              const updated = [...customTones, newTone];
                              saveCustomTones(updated);
                              // Seleccionar autom?ticamente como tono activo
                              if (btn.type === 'message') updateSoundSetting('messageTone', id);
                              else if (btn.type === 'ringtone') updateSoundSetting('ringtone', id);
                              else updateSoundSetting('notificationTone', id);
                              showToast(`? "${name}" aadido`, 'success');
                            };
                            reader.readAsDataURL(file);
                          };
                          inp.click();
                        }} style={{ background: btn.bg, border:`1.5px dashed ${btn.color}40`, borderRadius:'10px', padding:'10px 6px', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:'4px', fontFamily:'inherit' }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={btn.color} strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                          <span style={{ fontSize:'11px', fontWeight:'700', color: btn.color }}>+ {btn.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* Lista de tonos subidos */}
                    {customTones.length === 0 ? (
                      <div style={{ textAlign:'center', padding:'16px', color:'#9ca3af', fontSize:'13px' }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" style={{ margin:'0 auto 8px', display:'block' }}><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
                        Sube tus propias canciones o sonidos
                      </div>
                    ) : (
                      <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                        {customTones.map(tone => {
                          const typeColors: Record<string,string> = { message:'#22c55e', ringtone:'#3b82f6', notification:'#a855f7' };
                          const typeLabels: Record<string,string> = { message:'Mensaje', ringtone:'Llamada', notification:'Notif.' };
                          const color = typeColors[tone.type] || '#6b7280';
                          const isActive = soundSettings.messageTone === tone.id || soundSettings.ringtone === tone.id || soundSettings.notificationTone === tone.id;
                          return (
                            <div key={tone.id} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 12px', background: isActive ? `${color}10` : '#f9fafb', border: isActive ? `1.5px solid ${color}40` : '1px solid #f0f0f0', borderRadius:'10px' }}>
                              <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:`${color}20`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
                              </div>
                              <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ fontSize:'13px', fontWeight:'600', color:'#111827', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{tone.name}</div>
                                <div style={{ fontSize:'11px', color, fontWeight:'600' }}>{typeLabels[tone.type]}</div>
                              </div>
                              {/* Reproducir */}
                              <button onClick={() => { const a = new Audio(tone.url); a.volume = soundSettings.volume; a.play().catch(()=>{}); }}
                                style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', padding:'4px', display:'flex' }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                              </button>
                              {/* Usar como tono */}
                              <button onClick={() => {
                                if (tone.type === 'message') updateSoundSetting('messageTone', tone.id);
                                else if (tone.type === 'ringtone') updateSoundSetting('ringtone', tone.id);
                                else updateSoundSetting('notificationTone', tone.id);
                                showToast(`♪ "${tone.name}" activado`, 'success');
                              }} style={{ background: isActive ? color : '#f3f4f6', border:'none', borderRadius:'6px', padding:'5px 8px', cursor:'pointer', fontSize:'11px', fontWeight:'700', color: isActive ? '#fff' : '#374151' }}>
                                {isActive ? '✓ Activo' : 'Usar'}
                              </button>
                              {/* Eliminar */}
                              <button onClick={() => {
                                const updated = customTones.filter(t => t.id !== tone.id);
                                saveCustomTones(updated);
                                // Si era el activo, volver al por defecto
                                if (soundSettings.messageTone === tone.id) updateSoundSetting('messageTone', 'egatsapp');
                                if (soundSettings.ringtone === tone.id) updateSoundSetting('ringtone', 'classic');
                                if (soundSettings.notificationTone === tone.id) updateSoundSetting('notificationTone', 'pop');
                              }} style={{ background:'none', border:'none', cursor:'pointer', color:'#ef4444', padding:'4px', display:'flex' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div style={{ marginTop:'10px', padding:'8px 10px', background:'#f8f9fa', borderRadius:'8px', fontSize:'11px', color:'#9ca3af', lineHeight:'1.5' }}>
                      📁 Formatos soportados: MP3, WAV, OGG, M4A ? Máx. recomendado: 30 segundos
                    </div>
                  </div>

                </div>
              )}

              {currentSettingsTab === 'perfil' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Tarjeta de perfil ? diseno profesional centrado */}
                  <div style={{
                    background: 'linear-gradient(135deg, #f0fdf9 0%, #e0f7fa 100%)',
                    border: '1px solid rgba(0,200,160,0.15)',
                    borderRadius: '16px',
                    padding: '28px 16px 20px',
                    textAlign: 'center',
                    position: 'relative'
                  }}>
                    {/* Foto de perfil centrada */}
                    <div style={{ position: 'relative', width: '96px', margin: '0 auto 14px' }}>
                      <div style={{
                        width: '96px', height: '96px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, #00c8a0, #00b4e6)',
                        border: '3px solid #fff',
                        boxShadow: '0 4px 16px rgba(0,200,160,0.35)',
                        overflow: 'hidden',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '34px', fontWeight: '800', color: '#fff',
                      }}>
                        {userProfile.avatarUrl
                          ? <img src={userProfile.avatarUrl} alt="avatar" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                          : <span>{userProfile.avatar || 'U'}</span>
                        }
                      </div>
                      {/* Bot?n camara */}
                      <button onClick={() => {
                        const inp = document.createElement('input');
                        inp.type = 'file'; inp.accept = 'image/*';
                        inp.onchange = () => {
                          const f = inp.files?.[0];
                          if (f) {
                            const r = new FileReader();
                            r.onload = (e) => { setAvatarCropUrl(e.target?.result as string); };
                            r.readAsDataURL(f);
                          }
                        };
                        inp.click();
                      }} style={{
                        position: 'absolute', bottom: 2, right: 2,
                        width: '28px', height: '28px', borderRadius: '50%',
                        background: '#00c8a0', border: '2.5px solid #fff',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', outline: 'none'
                      }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                      </button>
                    </div>
                    {/* Nombre */}
                    <div style={{ fontSize: '18px', fontWeight: '700', color: '#0d0d0d', marginBottom: '4px', letterSpacing: '-0.3px' }}>
                      {userProfile.name || 'Usuario'}
                    </div>
                    {/* ID */}
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.06)', borderRadius: '20px', padding: '3px 10px' }}>
                      <span style={{ fontSize: '13px', color: '#6b7280', fontFamily: 'monospace', letterSpacing: '0.5px' }}>
                        ID: {userProfile.id ? userProfile.id.slice(0,8).toUpperCase() : '?'}
                      </span>
                    </div>
                  </div>

                  {/* información Personal */}
                  <div style={{
                    background: 'rgba(250,250,250,0.88)',
                    border: '1px solid rgba(0,0,0,0.07)',
                    borderRadius: '8px',
                    padding: '12px'
                  }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                      información Personal
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>Email</div>
                        <div style={{ fontSize: '14px', color: '#0d0d0d', fontWeight: '500' }}>{userProfile.email}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>Teléfono</div>
                        <div style={{ fontSize: '14px', color: '#0d0d0d', fontWeight: '500' }}>{userProfile.phone}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>País</div>
                        <div style={{ fontSize: '14px', color: '#0d0d0d', fontWeight: '500' }}>{userProfile.country}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>Ciudad</div>
                        <div style={{ fontSize: '14px', color: '#0d0d0d', fontWeight: '500' }}>{userProfile.city}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>dirección</div>
                        <div style={{ fontSize: '14px', color: '#0d0d0d', fontWeight: '500' }}>{userProfile.address}</div>
                      </div>
                    </div>
                  </div>

                  {/* Estado de Verificacian */}
                  <div style={{
                    background: userProfile.verificationStatus === 'verified' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                    border: userProfile.verificationStatus === 'verified' ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(245, 158, 11, 0.2)',
                    borderRadius: '8px',
                    padding: '12px'
                  }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: userProfile.verificationStatus === 'verified' ? '#00c8a0' : '#f59e0b', marginBottom: '4px' }}>
                      {userProfile.verificationStatus === 'verified' ? '✓ Verificado' : userProfile.verificationStatus === 'pending' ? '⏳ Pendiente' : '○ No Verificado'}
                    </div>
                    <div style={{ fontSize: '13px', color: '#374151' }}>
                      Miembro desde {userProfile.joinDate}
                    </div>
                  </div>

                  {/* Opciones de Seguridad */}
                  <div style={{
                    background: 'rgba(250,250,250,0.88)',
                    border: '1px solid rgba(0,0,0,0.07)',
                    borderRadius: '8px',
                    padding: '12px'
                  }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px', textTransform: 'uppercase' }}>
                      Seguridad
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <button
                        onClick={() => {
                          setUserProfile({ ...userProfile, twoFactorEnabled: !userProfile.twoFactorEnabled });
                        }}
                        style={{
                          width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(0,0,0,0.06)',
                          padding: '12px 0', color: '#0d0d0d', fontSize: '14px', fontWeight: '500',
                          cursor: 'pointer', outline: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}
                      >
                        <span style={{display:'flex',alignItems:'center',gap:'10px'}}>
                          <svg width="18" height="18" viewBox="0 0 24 24" stroke="#6b7280" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                          Autenticación de Dos Factores
                        </span>
                        <span style={{ color: userProfile.twoFactorEnabled ? '#00c8a0' : '#ef4444', fontSize:'13px', fontWeight:'700' }}>
                          {userProfile.twoFactorEnabled ? 'ON' : 'OFF'}
                        </span>
                      </button>
                      <button
                        onClick={() => {
                          setUserProfile({ ...userProfile, notificationsEnabled: !userProfile.notificationsEnabled });
                        }}
                        style={{
                          width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(0,0,0,0.06)',
                          padding: '12px 0', color: '#0d0d0d', fontSize: '14px', fontWeight: '500',
                          cursor: 'pointer', outline: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}
                      >
                        <span style={{display:'flex',alignItems:'center',gap:'10px'}}>
                          <svg width="18" height="18" viewBox="0 0 24 24" stroke="#6b7280" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                          Notificaciones
                        </span>
                        <span style={{ color: userProfile.notificationsEnabled ? '#00c8a0' : '#ef4444', fontSize:'13px', fontWeight:'700' }}>
                          {userProfile.notificationsEnabled ? 'ON' : 'OFF'}
                        </span>
                      </button>

                      {/* Bot?n activar notificaciones push */}
                      <button
                        onClick={async () => {
                          if (!('Notification' in window)) {
                            alert('Tu navegador no soporta notificaciones.');
                            return;
                          }
                          if (Notification.permission === 'denied') {
                    alert('Las notificaciones están bloqueadas. Ve a los ajustes del navegador → Permisos del sitio → Notificaciones → Permitir para egchat-app.vercel.app');
                            return;
                          }
                          const perm = await Notification.requestPermission();
                          if (perm === 'granted') {
                            if (typeof (window as any).__egchat_registerPush === 'function') {
                              await (window as any).__egchat_registerPush();
                              showToast('✓ Notificaciones push activadas', 'success');
                            }
                          } else {
                            showToast('Permiso denegado', 'error');
                          }
                        }}
                        style={{
                          width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(0,0,0,0.06)',
                          padding: '12px 0', color: '#0d0d0d', fontSize: '14px', fontWeight: '500',
                          cursor: 'pointer', outline: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}
                      >
                        <span style={{display:'flex',alignItems:'center',gap:'10px'}}>
                          <svg width="18" height="18" viewBox="0 0 24 24" stroke="#6b7280" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6.29 6.29l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                          Activar notificaciones push
                        </span>
                        <span style={{
                          fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '10px',
                          background: ('Notification' in window && Notification.permission === 'granted') ? 'rgba(0,200,160,0.15)' : 'rgba(239,68,68,0.12)',
                          color: ('Notification' in window && Notification.permission === 'granted') ? '#00c8a0' : '#ef4444'
                        }}>
                          {('Notification' in window && Notification.permission === 'granted') ? 'ACTIVO' : 'TOCAR'}
                        </span>
                      </button>
                      <button
                        onClick={() => setShowReadReceipts(p => !p)}
                        style={{
                          width: '100%', background: 'transparent', border: 'none',
                          padding: '12px 0', color: '#0d0d0d', fontSize: '14px', fontWeight: '500',
                          cursor: 'pointer', outline: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}
                      >
                        <span style={{display:'flex',alignItems:'center',gap:'10px'}}>
                          <svg width="18" height="18" viewBox="0 0 18 11" fill="none"><path d="M1 5.5l3.5 3.5L11 2" stroke="#6b7280" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M6 5.5l3.5 3.5L16 2" stroke="#6b7280" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          Confirmaciones de lectura
                        </span>
                        <span style={{ color: showReadReceipts ? '#00c8a0' : '#ef4444', fontSize:'13px', fontWeight:'700' }}>
                          {showReadReceipts ? 'ON' : 'OFF'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Acciones de perfil ? estilo app Móvil profesional */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>

                    {/* Cambiar foto */}
                    <button
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file'; input.accept = 'image/*';
                        input.style.display = 'none';
                        document.body.appendChild(input);
                        input.onchange = async () => {
                          const file = input.files?.[0];
                          document.body.removeChild(input);
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (e) => {
                              const dataUrl = e.target?.result as string;
                              setAvatarCropUrl(dataUrl);
                            };
                            reader.readAsDataURL(file);
                          }
                        };
                        input.click();
                      }}
                      style={{ width: '100%', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '14px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', outline: 'none', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                      onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                    >
                      <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                      </div>
                      <div style={{ flex: 1, textAlign: 'left' }}>
                        <div style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>Cambiar foto de perfil</div>
                        <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '1px' }}>Actualiza tu imagen</div>
                      </div>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                    </button>

                    {/* Editar perfil */}
                    <button
                      onClick={() => { setEditedProfile({ ...userProfile }); setIsEditingProfile(true); }}
                      style={{ width: '100%', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '14px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', outline: 'none', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                      onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                    >
                      <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </div>
                      <div style={{ flex: 1, textAlign: 'left' }}>
                        <div style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>Editar perfil</div>
                        <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '1px' }}>Nombre, email, ciudad...</div>
                      </div>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                    </button>

                    {/* Cerrar sesión */}
                    <button
                      onClick={async () => {
                        if (confirm('Ests seguro de que deseas cerrar sesión?')) {
                          try {
                            await authAPI.logout();
                            localStorage.removeItem('user_avatar');
                            setIsAuthenticated(false);
                            setUserProfile({ id:'', name:'Usuario', phone:'', email:'', address:'', city:'', country:'Guinea Ecuatorial', avatar:'U', avatarUrl:'', joinDate: new Date().toLocaleDateString('es-ES'), verificationStatus:'pending', twoFactorEnabled:false, notificationsEnabled:true });
                            setRealChats([]); setSelectedChat(null); setCurrentView('home');
                          } catch {
                            localStorage.removeItem('user_avatar');
                            setIsAuthenticated(false);
                          }
                        }
                      }}
                      style={{ width: '100%', background: '#fff', border: '1px solid #fee2e2', borderRadius: '14px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', outline: 'none', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fff5f5'}
                      onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                    >
                      <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#fff1f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                      </div>
                      <div style={{ flex: 1, textAlign: 'left' }}>
                        <div style={{ fontSize: '15px', fontWeight: '600', color: '#ef4444' }}>Cerrar sesión</div>
                        <div style={{ fontSize: '12px', color: '#fca5a5', marginTop: '1px' }}>Salir de tu cuenta</div>
                      </div>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fca5a5" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                    </button>

                  </div>

                </div>
              )}

              {currentSettingsTab === 'ayuda' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Preguntas Frecuentes */}
                  <div style={{
                    background: 'rgba(250,250,250,0.88)',
                    border: '1px solid rgba(0,0,0,0.07)',
                    borderRadius: '8px',
                    padding: '12px'
                  }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                      Preguntas Frecuentes
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {[
                        { q: 'Cmo cambio mi PIN?', a: 'Ve a Perfil > Seguridad > Cambiar PIN' },
                        { q: '¿Cuál es el lmite de transferencia?', a: 'El lmite diario es 2,000,000 XAF' },
                        { q: 'Cmo activo 2FA?', a: 'Ve a Perfil > Seguridad > Autenticación de Dos Factores' },
                        { q: 'Cmo reporto una transacción?', a: 'Abre la transacción y selecciona "Reportar"' }
                      ].map((item, idx) => (
                        <div key={idx} style={{
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                          borderRadius: '6px',
                          padding: '10px'
                        }}>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: '#00c8a0', marginBottom: '5px' }}>
                            {item.q}
                          </div>
                          <div style={{ fontSize: '13px', color: '#374151' }}>
                            {item.a}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* informacion de Contacto */}
                  <div style={{
                    background: 'rgba(250,250,250,0.88)',
                    border: '1px solid rgba(0,0,0,0.07)',
                    borderRadius: '8px',
                    padding: '12px'
                  }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                      Contacto y Soporte
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <button
                        onClick={() => window.open('mailto:support@egchat.com')}
                        style={{
                          width: '100%',
                          background: 'rgba(249,250,251,0.88)',
                          border: '1px solid rgba(0,0,0,0.08)',
                          borderRadius: '6px',
                          padding: '11px 14px',
                          color: '#0d0d0d',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          outline: 'none',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:'inline',marginRight:'8px'}}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                        support@egchat.com
                      </button>
                      <button
                        onClick={() => {}}
                        style={{
                          width: '100%',
                          background: 'rgba(249,250,251,0.88)',
                          border: '1px solid rgba(0,0,0,0.08)',
                          borderRadius: '6px',
                          padding: '11px 14px',
                          color: '#0d0d0d',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          outline: 'none',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:'inline',marginRight:'8px'}}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        Chat en Vivo
                      </button>
                      <button
                        onClick={() => window.open('tel:+240222123456')}
                        style={{
                          width: '100%',
                          background: 'rgba(249,250,251,0.88)',
                          border: '1px solid rgba(0,0,0,0.08)',
                          borderRadius: '6px',
                          padding: '11px 14px',
                          color: '#0d0d0d',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          outline: 'none',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:'inline',marginRight:'8px'}}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.8a16 16 0 0 0 6.29 6.29l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                        +240 222 123456
                      </button>
                    </div>
                  </div>

                  {/* informacion de la App */}
                  <div style={{
                    background: 'rgba(250,250,250,0.88)',
                    border: '1px solid rgba(0,0,0,0.07)',
                    borderRadius: '8px',
                    padding: '12px'
                  }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                      Acerca de EGCHAT
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>Versión</div>
                        <div style={{ fontSize: '14px', color: '#0d0d0d', fontWeight: '500' }}>2.5.3</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>Desarrollador</div>
                        <div style={{ fontSize: '14px', color: '#0d0d0d', fontWeight: '500' }}>EGCHAT Team</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>Licencia</div>
                        <div style={{ fontSize: '14px', color: '#0d0d0d', fontWeight: '500' }}>Propietaria</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentSettingsTab === 'actividad' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                    Registro de Actividad
                  </div>
                  {activityLog.map((log) => (
                    <div
                      key={log.id}
                      style={{
                        background: 'rgba(250,250,250,0.88)',
                        border: '1px solid rgba(0,0,0,0.07)',
                        borderRadius: '8px',
                        padding: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '50%',
                          background: log.type === 'login' ? 'rgba(16,185,129,0.2)' : log.type === 'transaction' ? 'rgba(59,130,246,0.2)' : log.type === 'security' ? 'rgba(239,68,68,0.2)' : 'rgba(168,85,247,0.2)',
                          border: log.type === 'login' ? '1px solid rgba(16,185,129,0.4)' : log.type === 'transaction' ? '1px solid rgba(59,130,246,0.4)' : log.type === 'security' ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(168,85,247,0.4)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                        }}>
                          {log.type === 'login'
                            ? <svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                            : log.type === 'transaction'
                            ? <svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                            : log.type === 'security'
                            ? <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                            : <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                          }
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: '#0d0d0d', marginBottom: '3px' }}>
                            {log.action}
                          </div>
                          <div style={{ fontSize: '13px', color: '#374151', marginBottom: '3px' }}>
                            {log.description}
                          </div>
                          <div style={{ fontSize: '14px', color: '#6b7280' }}>
                            {log.timestamp.toLocaleString('es-ES')}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB APARIENCIA */}
              {currentSettingsTab === 'apariencia' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                  {/* Tamaño de fuente */}
                  <div style={{ background: '#fff', borderRadius: '14px', padding: '16px', border: '1px solid rgba(0,0,0,0.07)' }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '12px' }}>
                      🔡 Tamaño de letra
                    </div>
                    <div style={{ background: '#f9fafb', borderRadius: '10px', padding: '10px 14px', marginBottom: '12px', fontSize: `${appFontSize * 14}px`, color: '#374151', border: '1px solid rgba(0,0,0,0.06)' }}>
                      Vista previa del texto en EGCHAT
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '700' }}>A</span>
                      <input type="range" min="0.8" max="1.5" step="0.05" value={appFontSize}
                        onChange={e => { const v = parseFloat(e.target.value); setAppFontSize(v); localStorage.setItem('egchat_fontsize', String(v)); }}
                        style={{ flex: 1, accentColor: '#00b4e6' }} />
                      <span style={{ fontSize: '18px', color: '#374151', fontWeight: '700' }}>A</span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
                      {[{ label: 'Pequeña', v: 0.85 }, { label: 'Normal', v: 1 }, { label: 'Grande', v: 1.15 }, { label: 'Muy grande', v: 1.35 }].map(opt => (
                        <button key={opt.v} onClick={() => { setAppFontSize(opt.v); localStorage.setItem('egchat_fontsize', String(opt.v)); }}
                          style={{ padding: '5px 10px', borderRadius: '8px', border: Math.abs(appFontSize - opt.v) < 0.03 ? '1.5px solid #00b4e6' : '1px solid rgba(0,0,0,0.1)', background: Math.abs(appFontSize - opt.v) < 0.03 ? 'rgba(0,180,230,0.1)' : '#f3f4f6', color: Math.abs(appFontSize - opt.v) < 0.03 ? '#00b4e6' : '#374151', fontSize: '12px', fontWeight: '600', cursor: 'pointer', outline: 'none' }}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tipografía */}
                  <div style={{ background: '#fff', borderRadius: '14px', padding: '16px', border: '1px solid rgba(0,0,0,0.07)' }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '12px' }}>
                      ✍️ Estilo de letra
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {[
                        { id: 'default', name: 'Sistema (por defecto)', sample: 'Hola, ¿cómo estás?', font: "'Segoe UI', system-ui, sans-serif" },
                        { id: 'rounded', name: 'Redondeada', sample: 'Hola, ¿cómo estás?', font: "'Nunito', 'Varela Round', sans-serif" },
                        { id: 'modern', name: 'Moderna', sample: 'Hola, ¿cómo estás?', font: "'Inter', 'Helvetica Neue', sans-serif" },
                        { id: 'classic', name: 'Clásica', sample: 'Hola, ¿cómo estás?', font: 'Georgia, serif' },
                        { id: 'mono', name: 'Monoespaciada', sample: 'Hola, ¿cómo estás?', font: "'Courier New', monospace" },
                      ].map(f => (
                        <button key={f.id} onClick={() => { setAppFontFamily(f.id); localStorage.setItem('egchat_fontfamily', f.id); }}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '10px', border: appFontFamily === f.id ? '1.5px solid #00b4e6' : '1px solid rgba(0,0,0,0.08)', background: appFontFamily === f.id ? 'rgba(0,180,230,0.07)' : '#f9fafb', cursor: 'pointer', outline: 'none', textAlign: 'left', width: '100%' }}>
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: '700', color: appFontFamily === f.id ? '#00b4e6' : '#374151', marginBottom: '2px' }}>{f.name}</div>
                            <div style={{ fontSize: '13px', color: '#6b7280', fontFamily: f.font }}>{f.sample}</div>
                          </div>
                          {appFontFamily === f.id && <svg width="16" height="16" viewBox="0 0 24 24" stroke="#00b4e6" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              )}
            </div>
          </div>
        );
      case 'Lia-25':
        return (
          <div style={{ position:'fixed', inset:0, zIndex:500 }}>
            <Lia25View
              messages={aiMessages}
              inputValue={aiInputValue}
              onInputChange={setAiInputValue}
              onSend={(msg) => { setAiInputValue(''); processAiMessage(msg); }}
              onBack={() => setCurrentView(previousView || 'home')}
              userBalance={userBalance}
            />
          </div>
        );
      case 'estados':
        return null;
      case 'apuestas':
        return null;
      case 'cemac':
        return null;
      case 'mitaxi':
        return null;
      default:
        return renderHomeView();
    }
  };

  // -- Sincronizar estado WebRTC con activeCall ------------------
  const prevCallStateRef = React.useRef<string>('idle');
  useEffect(() => {
    const prev = prevCallStateRef.current;
    prevCallStateRef.current = webrtc.callState;

    if (webrtc.callState === 'connected' && activeCall) {
      stopDialingTone(); stopRingtone(); playCallConnected();
      setActiveCall(prev => prev ? { ...prev, status: 'connected' } : null);
    }
    if (webrtc.callState === 'ended' && prev !== 'idle') {
      // Solo actuar si hay algo que cerrar Y si venimos de un estado activo (no de idle)
      const hasActiveCall = !!activeCall;
      const hasIncoming = !!incomingCallIdRef.current;
      if (!hasActiveCall && !hasIncoming) return;
      stopDialingTone(); stopRingtone();
      if (localStream) { localStream.getTracks().forEach(t => { try { t.stop(); } catch {} }); setLocalStream(null); }
      if (webrtc.localStream) { webrtc.localStream.getTracks().forEach(t => { try { t.stop(); } catch {} }); }
      if (remoteVideoRef.current) { remoteVideoRef.current.srcObject = null; remoteVideoRef.current.pause(); }
      if (localVideoRef.current) { localVideoRef.current.srcObject = null; localVideoRef.current.pause(); }
      if (remoteAudioRef.current) { remoteAudioRef.current.srcObject = null; remoteAudioRef.current.pause(); }
      setActiveCall(prev => { if (prev) playCallEnded(); return null; });
      incomingCallIdRef.current = null;
      setIncomingCall(null);
      setCallDuration(0);
      setIsMuted(false);
      setIsCameraOff(false);
    }
  }, [webrtc.callState]);

  // -- Polling llamadas entrantes ? solo se inicia una vez al autenticarse
  useEffect(() => {
    if (!isAuthenticated) return;

    let stopFn: (() => void) | null = null;

    const startPolling = () => {
      const uid = currentUserId.current;
      if (!uid) {
        const t = setTimeout(startPolling, 2000);
        return () => clearTimeout(t);
      }

      const stop = webrtc.pollIncoming(uid, (call) => {
        if (incomingCallIdRef.current) return; // ya hay una llamada activa
        incomingCallIdRef.current = call.callId;
        setIncomingCall(call);
        startRingtone(); vibrate([500, 200, 500, 200, 500]);
        // Avisar al SW que la llamada ya fue recibida — cancela re-notificaciones push
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({ type: 'CALL_HANDLED', callId: call.callId });
        }
      }, () => {
        // El caller canceló antes de que aceptáramos
        stopRingtone();
        incomingCallIdRef.current = null;
        setIncomingCall(null);
      });

      stopFn = stop;
      return () => { stop(); incomingCallIdRef.current = null; };
    };

    const cleanup = startPolling();

    // Reactivar polling cuando la app vuelve a primer plano (móvil/tab)
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        if (stopFn) { stopFn(); stopFn = null; }
        startPolling();
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      if (typeof cleanup === 'function') cleanup();
      if (stopFn) stopFn();
    };
  }, [isAuthenticated]);

  // -- Listener de mensajes del Service Worker (llamadas desde notificación push) --
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const processCallMessage = (data: any) => {
      if (!data) return;

      // Llamada entrante desde notificación push (app estaba cerrada/hibernada)
      if (data.type === 'INCOMING_CALL') {
        if (incomingCallIdRef.current) return;
        const callId = data.callId;
        const token = localStorage.getItem('egchat_token') || localStorage.getItem('token') || '';
        if (!callId || !token) return;
        fetch(`${(import.meta as any).env?.VITE_API_URL || 'https://egchat-api.onrender.com'}/api/call/${callId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.json()).then(session => {
          if (!session || session.ended || !session.offer) return;
          incomingCallIdRef.current = callId;
          setIncomingCall({
            callId,
            callerId: session.callerId || data.callerId,
            type: (session.type || data.callType || 'audio') as 'audio' | 'video',
            offer: session.offer,
          });
          startRingtone(); vibrate([500, 200, 500, 200, 500]);
          // Avisar al SW que la llamada ya fue recibida — cancela re-notificaciones
          if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({ type: 'CALL_HANDLED', callId });
          }
          if (data.autoAccept) {
            setTimeout(async () => {
              try {
                const contact = { id: data.callerId, title: data.callerName || 'Llamada', status: 'online', avatarUrl: '' };
                setActiveCall({ type: session.type || 'audio', contact, status: 'calling' });
                incomingCallIdRef.current = null;
                setIncomingCall(null);
                stopRingtone();
                await webrtc.answerCall(callId, session.offer, session.type || 'audio');
                setActiveCall(prev => prev ? { ...prev, status: 'connected' } : null);
              } catch (err) { console.error('Auto-accept call error:', err); }
            }, 500);
          }
        }).catch(err => console.warn('SW call fetch error:', err));
      }

      if (data.type === 'CALL_REJECTED' && data.callId === incomingCallIdRef.current) {
        stopRingtone();
        incomingCallIdRef.current = null;
        setIncomingCall(null);
      }

      // Noticia del gobierno — abrir espacio Gobierno GE en EstadosView
      if (data.type === 'OPEN_GOV_NEWS') {
        setCurrentView('estados');
        // Guardar la URL de la noticia para que EstadosView la abra
        if (data.newsUrl) {
          (window as any).__pendingGovNewsUrl = data.newsUrl;
          (window as any).__pendingGovNewsSource = data.newsSource;
        }
      }

      if (data.type === 'NOTIFICATION_CLICK' && data.chatId) {
        setCurrentView('Mensajería');
        const chatId = data.chatId?.toString();
        const chat = realChats.find((c: any) => c.id?.toString() === chatId);
        if (chat) {
          const isGroup = chat.type === 'group';
          let name = chat.name || chat.title || '';
          let avatarUrl = chat.avatar_url || '';
          if (!isGroup && chat.participants) {
            const other = chat.participants.find((p: any) => p.user_id?.toString() !== currentUserId.current?.toString());
            if (other) { name = other.full_name || other.users?.full_name || name; avatarUrl = other.avatar_url || other.users?.avatar_url || avatarUrl; }
          }
          setSelectedChat({ id: chat.id, type: chat.type || 'individual', title: name, subtitle: '', time: '', status: 'online', initials: name.slice(0,2).toUpperCase(), color: isGroup ? '#a855f7' : '#00c8a0', avatarUrl, isGroup });
        } else {
          (window as any).__pendingOpenChatId = chatId;
        }
      }
    };

    const handler = (event: MessageEvent) => processCallMessage(event.data);
    const customHandler = (event: Event) => processCallMessage((event as CustomEvent).detail);

    navigator.serviceWorker.addEventListener('message', handler);
    window.addEventListener('sw-call-message', customHandler);

    // Exponer para que main.tsx pueda llamarlo directamente si el listener ya está montado
    (window as any).__egchat_processCallMessage = processCallMessage;

    // Procesar mensajes que llegaron antes de que este listener estuviera listo
    if ((window as any).__pendingSWMessage) {
      const pending = (window as any).__pendingSWMessage;
      delete (window as any).__pendingSWMessage;
      // Reintentar con delay si aún no hay token (app recién abierta)
      const token = localStorage.getItem('egchat_token') || localStorage.getItem('token') || '';
      if (token) {
        processCallMessage(pending);
      } else {
        let retries = 0;
        const retryInterval = setInterval(() => {
          retries++;
          const t = localStorage.getItem('egchat_token') || localStorage.getItem('token') || '';
          if (t || retries >= 15) {
            clearInterval(retryInterval);
            if (t) processCallMessage(pending);
          }
        }, 1000);
      }
    }

    return () => {
      navigator.serviceWorker.removeEventListener('message', handler);
      window.removeEventListener('sw-call-message', customHandler);
      delete (window as any).__egchat_processCallMessage;
    };
  }, [isAuthenticated, realChats]);

  // -- Cargar miembros de un grupo con fallback desde realChats --
  const loadGroupMembers = React.useCallback(async (chatId: string) => {
    try {
      const members = await chatAPI.getGroupParticipants(chatId);
      if (Array.isArray(members) && members.length > 0) {
        setGroupMembersList(members);
        return;
      }
    } catch {}
    // Fallback: usar participantes de realChats + resolver nombres desde allContacts
    const chat = realChatsRef.current?.find((c: any) => c.id?.toString() === chatId);
    if (chat?.participants && chat.participants.length > 0) {
      const contacts = allContactsRef.current || [];
      const fallback = chat.participants.map((p: any) => {
        const uid = p.user_id?.toString() || p.id?.toString() || '';
        const contact = contacts.find((c: any) => c.id?.toString() === uid);
        return {
          id: uid,
          user_id: uid,
          phone: p.phone || p.users?.phone || contact?.phone || '',
          full_name: p.full_name || p.users?.full_name || contact?.name || p.name || uid.slice(0, 8),
          avatar_url: p.avatar_url || p.users?.avatar_url || contact?.avatarUrl || '',
          online_status: false,
          role: 'member',
        };
      });
      setGroupMembersList(fallback);
    } else {
      setGroupMembersList([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -- Auto-cargar miembros cuando se abre el perfil de un grupo --
  React.useEffect(() => {
    if (showContactProfile?.isGroup && showContactProfile?.id) {
      loadGroupMembers(showContactProfile.id.toString());
    } else if (!showContactProfile) {
      setGroupMembersList([]);
    }
  }, [showContactProfile?.id, showContactProfile?.isGroup, loadGroupMembers]);

  // -- Cargar contactos ? funci?n reutilizable (debe estar ANTES del useEffect que la usa) --
  const loadContacts = React.useCallback(async () => {
    try {
      const data = await contactsAPI.getAll();
      if (Array.isArray(data)) {
        const backendContacts = data.map((c: any) => ({
          id: c.contact_user_id?.toString() || c.id?.toString() || '',
          name: c.name || c.nickname || c.full_name || 'Sin nombre',
          phone: c.phone || '',
          avatar: (c.name || c.nickname || 'U').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase(),
          avatarUrl: c.avatar_url || '',
          status: 'offline' as const,
          addedDate: c.created_at || new Date().toISOString(),
        }));

        // Auto-sincronizar: añadir personas con las que has chateado pero no están en contactos
        const chats = realChatsRef.current || [];
        const myId = currentUserId.current?.toString();
        const extraContacts: typeof backendContacts = [];
        chats.forEach((chat: any) => {
          if (chat.type === 'group') return;
          const participants = chat.participants || [];
          const other = participants.find((p: any) => p.user_id?.toString() !== myId);
          if (!other) return;
          const otherId = other.user_id?.toString() || other.id?.toString() || '';
          if (!otherId) return;
          const alreadyIn = backendContacts.some(c => c.id === otherId);
          if (!alreadyIn) {
            const name = other.full_name || other.users?.full_name || other.name || 'Usuario';
            extraContacts.push({
              id: otherId,
              name,
              phone: other.phone || other.users?.phone || '',
              avatar: name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase(),
              avatarUrl: other.avatar_url || other.users?.avatar_url || '',
              status: 'offline' as const,
              addedDate: chat.created_at || new Date().toISOString(),
            });
          }
        });

        setAllContacts([...backendContacts, ...extraContacts].sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })));
      }
    } catch {}
  }, []);

  // -- useEffects mensajeria -------------------------------------
  useEffect(() => {
    if (!isAuthenticated) return;
    // Cargar perfil desde localStorage primero (evita pantalla en blanco)
    const cachedProfile = localStorage.getItem('egchat_user_profile');
    if (cachedProfile) {
      try {
        const p = JSON.parse(cachedProfile);
        setUserProfile((prev: any) => ({ ...prev, ...p }));
        if (p.id) currentUserId.current = p.id;
      } catch {}
    }
    // Manejar link de añadir contacto desde QR: /add?phone=...&name=...&id=...
    const urlParams = new URLSearchParams(window.location.search);
    const addPhone = urlParams.get('phone');
    const addName = urlParams.get('name');
    const addId = urlParams.get('id');
    if (addId || addPhone) {
      // Limpiar URL sin recargar
      window.history.replaceState({}, '', window.location.pathname);
      // Añadir contacto automáticamente después de login
      setTimeout(async () => {
        try {
          await contactsAPI.add(addId || undefined, addPhone || undefined, addName || undefined);
          showToast(`✓ ${addName || addPhone || 'Contacto'} añadido a contactos`, 'success');
          await loadContacts();
        } catch {}
      }, 2000);
    }

    // Manejar llamada entrante desde notificación push (app abierta desde hibernado)
    const callId = urlParams.get('call');
    const callerNameParam = urlParams.get('caller');
    const callType = (urlParams.get('type') || 'audio') as 'audio' | 'video';
    const autoAccept = urlParams.get('accept') === '1';
    if (callId) {
      window.history.replaceState({}, '', window.location.pathname);
      // Reintentar hasta 10 veces con backoff — el servidor Render puede tardar en despertar
      const fetchCallSession = async (attempt = 0) => {
        try {
          const token = localStorage.getItem('egchat_token') || localStorage.getItem('token') || '';
          if (!token) { if (attempt < 10) setTimeout(() => fetchCallSession(attempt + 1), 2000); return; }
          const apiBase = ((import.meta as any).env?.VITE_API_URL || 'https://egchat-api.onrender.com').replace(/\/+$/, '');
          const r = await fetch(`${apiBase}/api/call/${callId}`, { headers: { Authorization: `Bearer ${token}` } });
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          const session = await r.json();
          if (!session || session.ended || !session.offer) {
            // Llamada ya terminada — mostrar notificación de perdida
            if (callerNameParam) showToast(`📵 Llamada perdida de ${callerNameParam}`, 'error');
            return;
          }
          if (incomingCallIdRef.current) return; // ya hay otra llamada activa
          incomingCallIdRef.current = callId;
          setIncomingCall({ callId, callerId: session.callerId || session.caller_id, type: session.type || callType, offer: session.offer });
          startRingtone(); vibrate([500, 200, 500, 200, 500]);
        } catch (err) {
          console.warn(`URL call param error (attempt ${attempt}):`, err);
          if (attempt < 10) setTimeout(() => fetchCallSession(attempt + 1), 3000);
        }
      };
      setTimeout(() => fetchCallSession(0), 800);
    }
    authAPI.me().then((u: any) => {
      if (u?.id) {
        currentUserId.current = u.id;
        const savedAvatar = u.avatar_url || localStorage.getItem('user_avatar') || '';
        const profile = {
          id: u.id,
          name: u.full_name || 'Usuario',
          phone: u.phone || '',
          avatar: (u.full_name||'U').split(' ').map((w:string)=>w[0]).join('').slice(0,2).toUpperCase(),
          avatarUrl: savedAvatar,
        };
        setUserProfile((prev: any) => ({ ...prev, ...profile }));
        // Guardar en localStorage para persistencia offline
        localStorage.setItem('egchat_user_profile', JSON.stringify(profile));
      }
    }).catch((_e: any) => {
      // Ignorar errores de /me ? puede ser Render durmiendo
    });
    loadChats();
    // Cargar todos los contactos reales
    loadContacts();
    // Cargar contactos favoritos reales
    contactsAPI.getFavorites().then((data: any[]) => setFavoriteContacts(data || [])).catch(() => {});
    // Cargar grupos favoritos reales - endpoint deshabilitado hasta que el backend lo implemente
    // chatAPI.getFavoriteChats().then(...)
    // Registrar Web Push (con peque?o delay para que el SW est listo)
    setTimeout(() => {
      if (typeof (window as any).__egchat_registerPush === 'function') {
        (window as any).__egchat_registerPush();
      }
    }, 2000);
  }, [isAuthenticated, loadChats, loadContacts]);

  // Escuchar evento de token expirado desde api.ts
  useEffect(() => {
    const handleExpired = () => {
      // Solo cerrar sesión si realmente no hay token
      const token = localStorage.getItem('token') || localStorage.getItem('egchat_token_backup');
      if (!token) {
        setIsAuthenticated(false);
        setSelectedChat(null);
        setCurrentView('home');
      }
    };
    window.addEventListener('auth:expired', handleExpired);
    return () => window.removeEventListener('auth:expired', handleExpired);
  }, []);

  useEffect(() => {
    if (currentView === 'Mensajería') loadChats();
  }, [currentView, loadChats]);

  // -- Polling: actualizar mensajes del chat abierto cada 1.5s ---
  useEffect(() => {
    if (!selectedChat) {
      if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
      return;
    }
    const chatId = selectedChat.id?.toString() || '';
    if (!chatId || !chatId.includes('-') || chatId.length < 20) return;

    // Cargar mensajes inmediatamente al abrir
    loadMessages(chatId);

    const startInterval = () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      pollingRef.current = setInterval(() => {
        if (document.visibilityState === 'visible') loadMessages(chatId);
      }, 3000);
    };

    startInterval();

    // Reiniciar el intervalo al volver al primer plano (el setInterval se congela en background)
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        loadMessages(chatId);
        startInterval();
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [selectedChat, loadMessages]);

  useEffect(() => {
    if (currentView !== 'contactos') return;
    loadContacts();
  }, [currentView, loadContacts]);

  // -- Polling de chats cada 15s para refrescar nombre/avatar de contactos --
  useEffect(() => {
    if (!isAuthenticated) return;
    const iv = setInterval(() => {
      loadChats();
      loadContacts(); // refrescar fotos y nombres de contactos
    }, 15000);
    return () => clearInterval(iv);
  }, [isAuthenticated, loadChats, loadContacts]);

  // -- Reconexión automática al volver al primer plano (evita pantalla en blanco) --
  useEffect(() => {
    if (!isAuthenticated) return;
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      // Recargar chats y mensajes activos sin recargar la página
      loadChats();
      if (selectedChat) {
        const chatId = selectedChat.id?.toString() || '';
        if (chatId && chatId.includes('-') && chatId.length >= 20) {
          loadMessages(chatId);
        }
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    // También escuchar el evento online (cuando recupera red)
    window.addEventListener('online', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', onVisible);
    };
  }, [isAuthenticated, loadChats, loadMessages, selectedChat]);

  // -- Auth check  todos los hooks declarados -------------------
  if (!isAuthenticated) return <AuthScreen onAuth={(user) => {
    if (user) {
      const savedAvatar = localStorage.getItem('user_avatar') || user.avatar_url || '';
      setUserProfile((prev: any) => ({
        ...prev, id: user.id||prev.id, name: user.full_name||prev.name, phone: user.phone||prev.phone,
        avatar: (user.full_name||'U').split(' ').map((w:string)=>w[0]).join('').slice(0,2).toUpperCase(),
        avatarUrl: savedAvatar,
      }));
      // Mostrar modal de importación de contactos solo en el primer registro
      const isNewRegistration = !localStorage.getItem('egchat_contacts_imported');
      if (isNewRegistration) {
        setTimeout(() => setShowContactImportModal(true), 800);
      }
    }
    setIsAuthenticated(true);
    // Pedir permiso push — en iOS solo funciona desde un gesto del usuario
    // En Android/desktop se puede pedir directamente
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const iosVersion = isIOS ? parseInt((navigator.userAgent.match(/OS (\d+)_/) || [])[1] || '0') : 0;
    const iosSupported = isIOS && iosVersion >= 16; // iOS 16.4+ soporta push en PWA instalada
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;

    if ((!isIOS || (iosSupported && isPWA)) && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(perm => {
        if (perm === 'granted' && typeof (window as any).__egchat_registerPush === 'function') {
          (window as any).__egchat_registerPush();
        }
      });
    }
    // Registro push (funciona si el permiso ya fue concedido antes)
    setTimeout(() => {
      if (typeof (window as any).__egchat_registerPush === 'function') {
        (window as any).__egchat_registerPush();
      }
    }, 1500);
  }} />;

  return (
    <div
      onClick={unlockAudio}
      style={{
        minHeight: '100vh',
        height: '100vh',
        overflow: 'hidden',
        background: '#f0f2f5',
        position: 'relative',
        display: device.isMobile ? 'block' : 'flex',
      }}
    >
      {/* ── SIDEBAR TABLET/DESKTOP ─────────────────────────────────────── */}
      {!device.isMobile && (() => {
        const isTablet = device.isTablet;
        const sideW = isTablet ? 72 : 240;
        const navItems = [
          { id: 'Mensajería', label: 'Mensajería', icon: renderIcon('mensajes', isTablet ? 22 : 20) },
          { id: 'monedero',   label: 'Cartera',    icon: renderIcon('wallet',   isTablet ? 22 : 20) },
          { id: 'servicios',  label: 'Servicios',  icon: renderIcon('services', isTablet ? 22 : 20) },
          { id: 'ajustes',    label: 'Ajustes',    icon: renderIcon('ajustes',  isTablet ? 22 : 20) },
        ];

        // Detectar país por IP para mostrar bandera
        const [countryFlag, setCountryFlag] = React.useState('🇬🇶');
        React.useEffect(() => {
          fetch('https://ipapi.co/json/')
            .then(r => r.json())
            .then(d => {
              if (d.country_code) {
                // Convertir código de país a emoji de bandera
                const flag = d.country_code.toUpperCase().split('').map((c: string) =>
                  String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)
                ).join('');
                setCountryFlag(flag);
              }
            })
            .catch(() => {});
        }, []);

        return (
          <aside style={{
            width: `${sideW}px`, flexShrink: 0,
            background: '#0f1923',
            display: 'flex', flexDirection: 'column', alignItems: isTablet ? 'center' : 'stretch',
            paddingTop: '0',
            paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
            paddingLeft: isTablet ? '0' : '10px',
            paddingRight: isTablet ? '0' : '10px',
            gap: '2px', zIndex: 1003,
            borderRight: '1px solid rgba(255,255,255,0.06)',
            height: '100vh',
            position: 'fixed', top: 0, left: 0,
          }}>
            {/* Borde izquierdo decorativo */}
            <div style={{ position:'absolute', left:0, top:0, bottom:0, width:'3px', background:'linear-gradient(180deg, #00c8a0 0%, #ffffff 20%, #00b4e6 40%, #ffffff 60%, #00b4e6 80%, #00c8a0 100%)', boxShadow:'0 0 8px rgba(0,200,160,0.6)', pointerEvents:'none', zIndex:1 }} />

            {/* Header de la sidebar — alineado con el header principal (44px) */}
            <div style={{ height: '44px', display: 'flex', alignItems: 'center', gap: isTablet ? '0' : '10px', justifyContent: isTablet ? 'center' : 'flex-start', paddingLeft: isTablet ? '0' : '6px', flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ width: isTablet ? '32px' : '30px', height: isTablet ? '32px' : '30px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '2px solid rgba(0,200,160,0.5)', background: '#1a2535' }}>
                {userProfile?.avatar_url
                  ? <img src={userProfile.avatar_url} alt="Admin" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #00c8a0, #00b4e6)' }}>
                      <span style={{ fontSize: '11px', fontWeight: '900', color: '#fff' }}>{(userProfile?.name || 'EG').slice(0,2).toUpperCase()}</span>
                    </div>
                }
              </div>
              {!isTablet && (
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff', lineHeight: 1, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    EGCHAT
                    <span style={{ fontSize: '16px' }}>{countryFlag}</span>
                  </div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', marginTop: '1px' }}>Guinea Ecuatorial</div>
                </div>
              )}
              {isTablet && <span style={{ fontSize: '18px', position: 'absolute', bottom: '2px', right: '2px' }}>{countryFlag}</span>}
            </div>

            {/* Nav items */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', width: '100%', alignItems: isTablet ? 'center' : 'stretch', paddingTop: '8px' }}>
              {navItems.map(item => {
                const active = currentView === item.id;
                return (
                  <button key={item.id} onClick={() => setCurrentView(item.id)} title={item.label}
                    style={{
                      width: isTablet ? '52px' : '100%',
                      height: isTablet ? '52px' : 'auto',
                      padding: isTablet ? '0' : '10px 12px',
                      borderRadius: '10px', border: 'none', cursor: 'pointer',
                      background: active ? 'rgba(0,200,160,0.15)' : 'transparent',
                      display: 'flex', flexDirection: isTablet ? 'column' : 'row',
                      alignItems: 'center', justifyContent: isTablet ? 'center' : 'flex-start',
                      gap: isTablet ? '4px' : '12px', outline: 'none',
                      borderLeft: active && !isTablet ? '3px solid #00c8a0' : '3px solid transparent',
                    }}>
                    <div style={{ color: active ? '#00c8a0' : 'rgba(255,255,255,0.5)', flexShrink: 0 }}>{item.icon}</div>
                    <span style={{ fontSize: isTablet ? '9px' : '13px', fontWeight: active ? '700' : '400', color: active ? '#00c8a0' : 'rgba(255,255,255,0.5)', lineHeight: 1 }}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Perfil usuario abajo */}
            <button onClick={() => setShowProfileView(true)}
              style={{ width: isTablet ? '44px' : '100%', padding: isTablet ? '0' : '10px 12px', borderRadius: '10px', border: 'none', background: 'rgba(255,255,255,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: isTablet ? 'center' : 'flex-start', gap: '10px', outline: 'none', flexShrink: 0, height: isTablet ? '44px' : 'auto' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', border: '1.5px solid rgba(255,255,255,0.15)' }}>
                {userProfile?.avatar_url
                  ? <img src={userProfile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.7)' }}>{(userProfile?.name || 'U').slice(0,2).toUpperCase()}</span>
                }
              </div>
              {!isTablet && (
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userProfile?.name || 'Mi perfil'}</div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}>Ver perfil</div>
                </div>
              )}
            </button>
          </aside>
        );
      })()}

      {/* ── CONTENIDO PRINCIPAL ───────────────────────────────────────── */}
      <div style={{ 
        marginLeft: device.isMobile ? 0 : (device.isTablet ? '72px' : '240px'),
        flex: device.isMobile ? undefined : 1, 
        overflow: 'hidden', 
        position: 'relative', 
        height: '100vh',
        background: device.isMobile ? '#f0f2f5' : '#fff',
      }}>
      {/* Wallpaper solo se aplica dentro del chat, no aquí */}
      {renderWallpaperCatalog()}
      {renderLayoutPanel()}
      {/* Bandas decorativas — en todos los dispositivos */}
      {device.isMobile ? <>
        {/* Móvil: bordes en los 4 lados */}
        <div style={{ position:'fixed', left:0, top:0, bottom:0, width:'2px', zIndex:2000, pointerEvents:'none', background:'linear-gradient(180deg, #00c8a0 0%, #ffffff 20%, #00c8a0 40%, #ffffff 60%, #00c8a0 80%, #00c8a0 100%)', boxShadow:'0 0 6px rgba(255,255,255,0.9), 0 0 12px rgba(0,200,160,0.5)' }} />
        <div style={{ position:'fixed', right:0, top:0, bottom:0, width:'2px', zIndex:2000, pointerEvents:'none', background:'linear-gradient(180deg, #00b4e6 0%, #ffffff 20%, #00b4e6 40%, #ffffff 60%, #00b4e6 80%, #00b4e6 100%)', boxShadow:'0 0 6px rgba(255,255,255,0.9), 0 0 12px rgba(0,180,230,0.5)' }} />
        <div style={{ position:'fixed', left:0, right:0, top:0, height:'2px', zIndex:2000, pointerEvents:'none', background:'linear-gradient(90deg, #00c8a0, #ffffff 20%, #00b4e6 35%, #ffffff 50%, #00c8a0 65%, #ffffff 80%, #00b4e6)', boxShadow:'0 0 6px rgba(255,255,255,0.8), 0 1px 8px rgba(0,200,160,0.4)' }} />
        <div style={{ position:'fixed', left:0, right:0, bottom:0, height:'2px', zIndex:2000, pointerEvents:'none', background:'linear-gradient(90deg, #00c8a0, #ffffff 20%, #00b4e6 35%, #ffffff 50%, #00c8a0 65%, #ffffff 80%, #00b4e6)', boxShadow:'0 0 6px rgba(255,255,255,0.8), 0 -1px 8px rgba(0,180,230,0.4)' }} />
      </> : <>
        {/* Tablet/Desktop: bordes top, right y bottom (left lo tiene la sidebar) */}
        <div style={{ position:'fixed', right:0, top:0, bottom:0, width:'3px', zIndex:2000, pointerEvents:'none', background:'linear-gradient(180deg, #00b4e6 0%, #ffffff 20%, #00b4e6 40%, #ffffff 60%, #00b4e6 80%, #00b4e6 100%)', boxShadow:'0 0 6px rgba(255,255,255,0.9), 0 0 12px rgba(0,180,230,0.5)' }} />
        <div style={{ position:'fixed', left:0, right:0, top:0, height:'3px', zIndex:2000, pointerEvents:'none', background:'linear-gradient(90deg, #00c8a0, #ffffff 20%, #00b4e6 35%, #ffffff 50%, #00c8a0 65%, #ffffff 80%, #00b4e6)', boxShadow:'0 0 6px rgba(255,255,255,0.8), 0 1px 8px rgba(0,200,160,0.4)' }} />
        <div style={{ position:'fixed', left:0, right:0, bottom:0, height:'3px', zIndex:2000, pointerEvents:'none', background:'linear-gradient(90deg, #00c8a0, #ffffff 20%, #00b4e6 35%, #ffffff 50%, #00c8a0 65%, #ffffff 80%, #00b4e6)', boxShadow:'0 0 6px rgba(255,255,255,0.8), 0 -1px 8px rgba(0,180,230,0.4)' }} />
      </>}
      {/* Overlay oscuro cuando el mena esta abierto */}
      {isMenuOpen && (
        <div 
          onClick={() => setIsMenuOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.45)',
            zIndex: 998,
          }} 
        />
      )}
      
      {/* Header — solo en home y vistas principales, no en chat abierto */}
      {['home','Mensajería','monedero','servicios','ajustes'].includes(currentView) && (!selectedChat || device.isMobile) && renderHeader()}
      
      {/* Paneles desplegables */}
      {renderNotificationsPanel()}
      {renderMenuPanel()}
      {renderTimeModal()}
      {renderActiveCall()}

      {/* Banner de actualización automática */}
      <UpdateBanner />

      {/* Toast global */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '100px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 9999, background: toast.type === 'error' ? '#ef4444' : toast.type === 'info' ? '#3b82f6' : '#22c55e',
          color: '#fff', padding: '10px 20px', borderRadius: '20px',
          fontSize: '14px', fontWeight: '600', boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
          whiteSpace: 'nowrap', maxWidth: '90vw', textAlign: 'center',
          animation: 'dropdownIn 0.2s ease',
        }}>
          {toast.msg}
        </div>
      )}

      {/* Men contextual de mensaje  diseo premium EGChat */}
      {msgContextMenu && (
        <>
          {/* Overlay blur */}
          <div style={{
            position: 'fixed', inset: 0, zIndex: 5999,
            background: 'rgba(0,0,0,0.35)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
          }} onClick={() => setMsgContextMenu(null)}/>

          {/* Contenedor centrado en pantalla */}
          <div style={{
            position: 'fixed',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 6000,
            width: '280px',
            animation: 'contextMenuIn 0.2s cubic-bezier(0.34,1.56,0.64,1)',
          }}>
            <style>{`
              @keyframes contextMenuIn {
                from { opacity:0; transform:translate(-50%,-50%) scale(0.85); }
                to   { opacity:1; transform:translate(-50%,-50%) scale(1); }
              }
              @keyframes emojiPop {
                0%   { transform: scale(1); }
                50%  { transform: scale(1.4); }
                100% { transform: scale(1); }
              }
              .emoji-scroll::-webkit-scrollbar { display: none; }
            `}</style>

            {/* Preview del mensaje — diseño profesional según tipo */}
            {msgContextMenu.msg.text && (() => {
              const txt = msgContextMenu.msg.text;
              const type = msgContextMenu.msg.type;
              // Determinar tipo visual
              const isAudio = type === 'audio' || txt.startsWith('🎤');
              const isCall = txt.includes('Llamada') && !txt.includes('Video');
              const isVideoCall = txt.includes('Videollamada');
              const isPhoto = type === 'image' || txt.includes('Foto') || txt.includes('📷');
              const isVideo = type === 'video' || (txt.includes('Video') && !txt.includes('Videollamada')) || txt.includes('🎥');
              const isFile = type === 'file' || txt.includes('📎');
              const isLocation = type === 'location' || txt.includes('📍') || txt.includes('Ubicación');
              const isContact = type === 'contact' || txt.includes('Contacto');
              const isSpecial = isAudio || isCall || isVideoCall || isPhoto || isVideo || isFile || isLocation || isContact;

              // Icono SVG según tipo
              const icon = isAudio ? (
                <svg width="18" height="18" viewBox="0 0 40 20" fill="none"><rect x="0" y="7" width="3" height="6" rx="1.5" fill="rgba(255,255,255,0.7)"/><rect x="5" y="4" width="3" height="12" rx="1.5" fill="rgba(255,255,255,0.7)"/><rect x="10" y="1" width="3" height="18" rx="1.5" fill="rgba(255,255,255,0.9)"/><rect x="15" y="5" width="3" height="10" rx="1.5" fill="rgba(255,255,255,0.7)"/><rect x="20" y="8" width="3" height="4" rx="1.5" fill="rgba(255,255,255,0.5)"/><rect x="25" y="3" width="3" height="14" rx="1.5" fill="rgba(255,255,255,0.7)"/><rect x="30" y="6" width="3" height="8" rx="1.5" fill="rgba(255,255,255,0.6)"/></svg>
              ) : isVideoCall ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
              ) : isCall ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.13 12 19.79 19.79 0 0 1 1.06 3.38 2 2 0 0 1 3 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              ) : isPhoto ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              ) : isVideo ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
              ) : isFile ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              ) : isLocation ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              ) : isContact ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              ) : null;

              const label = isAudio ? 'Mensaje de voz' : isVideoCall ? 'Videollamada' : isCall ? (txt.includes('perdida') ? 'Llamada perdida' : 'Llamada') : isPhoto ? 'Foto' : isVideo ? 'Video' : isFile ? 'Archivo' : isLocation ? 'Ubicación' : isContact ? 'Contacto' : null;

              return (
                <div style={{
                  background: 'rgba(255,255,255,0.12)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  borderRadius: '16px',
                  padding: '12px 14px',
                  marginBottom: '8px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}>
                  {isSpecial && icon && (
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '10px',
                      background: 'rgba(255,255,255,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {icon}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {isSpecial && label && (
                      <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontWeight: '500', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {label}
                      </p>
                    )}
                    {!isSpecial && (
                      <p style={{
                        margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.9)',
                        overflow: 'hidden', textOverflow: 'ellipsis',
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any,
                        lineHeight: '1.4',
                      }}>
                        {txt}
                      </p>
                    )}
                    {isSpecial && (
                      <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.75)', fontWeight: '600' }}>
                        {isAudio ? 'Toca para escuchar' : isCall || isVideoCall ? (txt.includes('perdida') ? 'Sin respuesta' : 'Finalizada') : isPhoto ? 'Ver foto' : isVideo ? 'Ver video' : isFile ? 'Abrir archivo' : isLocation ? 'Ver ubicación' : 'Ver contacto'}
                      </p>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Reacciones rapidas — scroll horizontal */}
            <div className="emoji-scroll" style={{
              background: 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderRadius: '20px',
              padding: '10px 12px',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              overflowX: 'auto',
              gap: '2px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              border: '1px solid rgba(255,255,255,0.7)',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none' as any,
            }}>
              {['👍','❤️','😂','😮','😢','🙏','🔥','😍','🥳','😎','🤩','😅','🤣','😭','😡','🤯','💯','✅','🎉','💪','👏','🫶','😘','🥺','😤','🤔','😴','🤗','😇','🥰','😜','🤪','😏','😬','🤑','😈','💀','👻','🤖','🎭','🌟','💥','❄️','🌈','🍀','🎯','🚀','💎','🏆'].map((emoji, i) => (
                <button key={emoji} onClick={() => {
                  const cid = selectedChat?.id?.toString() || selectedChat?.title || '';
                  const t = new Date(); const tm = `${t.getHours().toString().padStart(2,'0')}:${t.getMinutes().toString().padStart(2,'0')}`;
                  setChatMessages(prev => ({ ...prev, [cid]: [...(prev[cid]||[]), { id: Date.now().toString(), from: 'me' as const, text: emoji, time: tm, status: 'pending' as const }] }));
                  setMsgContextMenu(null);
                }} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '26px', padding: '4px 6px', borderRadius: '50%',
                  transition: 'transform 0.15s',
                  flexShrink: 0,
                  animationDelay: `${i * 0.03}s`,
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.35)'; e.currentTarget.style.animation = 'emojiPop 0.3s ease'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.animation = 'none'; }}>
                  {emoji}
                </button>
              ))}
            </div>

            {/* ── Acciones principales ── */}
            <div style={{ background:'rgba(255,255,255,0.92)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', borderRadius:'18px', overflow:'hidden', boxShadow:'0 4px 24px rgba(0,0,0,0.13)', border:'1px solid rgba(255,255,255,0.7)', padding:'8px 4px', display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'2px' }}>
              {[
                {
                  color:'#00c8a0', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
                  label:'Copiar', sub:'Copiar texto al portapapeles',
                  action:() => { navigator.clipboard?.writeText(msgContextMenu.msg.text || ''); showToast('Copiado', 'success'); setMsgContextMenu(null); }
                },
                {
                  color:'#1485EE', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>,
                  label:'Responder', sub:'Citar y responder este mensaje',
                  action:() => { setCurrentChatInput(`> ${msgContextMenu.msg.text?.slice(0,50) || ''}...\n`); setMsgContextMenu(null); }
                },
                ...(msgContextMenu.msg.from === 'me' ? [{
                  color:'#6B5BD6', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
                  label:'Editar', sub:'Modificar el texto enviado',
                  action:() => { setCurrentChatInput(msgContextMenu.msg.text || ''); setEditingMsgId(msgContextMenu.msg.id); showToast('Edita el mensaje y pulsa enviar', 'info'); setMsgContextMenu(null); }
                }] : []),
                {
                  color:'#F59E0B', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
                  label:'Destacar', sub:'Guardar en mensajes importantes',
                  action:() => { const cid=selectedChat?.id?.toString()||selectedChat?.title||''; setStarredMessages(prev=>({...prev,[cid]:[...(prev[cid]||[]),msgContextMenu.msg.id]})); showToast('Mensaje destacado', 'success'); setMsgContextMenu(null); }
                },
                {
                  color:'#0EA5E9', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
                  label:'Reenviar', sub:'Compartir con otro contacto',
                  action:() => { showToast('Proximamente disponible', 'info'); setMsgContextMenu(null); }
                },
                {
                  color:'#8B5CF6', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
                  label:'Seleccionar', sub:'Seleccionar varios mensajes',
                  action:() => { setSelectionMode(true); setSelectedMsgIds([msgContextMenu.msg.id]); setMsgContextMenu(null); }
                },
                {
                  color:'#EC4899', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
                  label:'Info del mensaje', sub:'Ver estado de entrega y lectura',
                  action:() => { showToast(`Enviado  -  ${msgContextMenu.msg.time || ''}`, 'info'); setMsgContextMenu(null); }
                },
                {
                  color:'#2E9E6B', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
                  label:'Fijar mensaje', sub:'Mostrar en la parte superior del chat',
                  action:() => { showToast('Mensaje fijado', 'success'); setMsgContextMenu(null); }
                },
                ...(msgContextMenu.msg.text && !msgContextMenu.msg.text.startsWith('📌') && !msgContextMenu.msg.text.startsWith('🎤') ? [{
                  color:'#0369a1', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
                  label:'Traducir', sub:'Traducir al español',
                  action: async () => {
                    const txt = msgContextMenu.msg.text || '';
                    setMsgContextMenu(null);
                    showToast('Traduciendo...', 'info');
                    try {
                      const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(txt)}&langpair=auto|es`);
                      const data = await res.json();
                      const translated = data?.responseData?.translatedText || txt;
                      showToast(`🌐 ${translated}`, 'success');
                    } catch {
                      showToast('No se pudo traducir', 'error');
                    }
                  }
                }] : []),
                {
                  color:'#EF4444', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
                  label:'Para mí', sub:'Eliminar para mí',
                  action: async () => {
                    const cid = selectedChat?.id?.toString() || selectedChat?.title || '';
                    const msgId = msgContextMenu.msg.id;
                    setChatMessages(prev => ({ ...prev, [cid]: (prev[cid]||[]).filter(m => m.id !== msgId) }));
                    deletedForMeIds.current.add(msgId);
                    localStorage.setItem('deletedForMeIds', JSON.stringify([...deletedForMeIds.current]));
                    setMsgContextMenu(null);
                    if (msgId && msgId.length > 10) {
                      try { await chatAPI.deleteMessageForMe(msgId); } catch {}
                    }
                    showToast('Mensaje eliminado para ti', 'info');
                  }
                },
                ...(msgContextMenu.msg.from === 'me' ? [{
                  color:'#DC2626', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
                  label:'Para todos', sub:'Eliminar para todos',
                  action: async () => {
                    const cid = selectedChat?.id?.toString() || selectedChat?.title || '';
                    const msgId = msgContextMenu.msg.id;
                    setChatMessages(prev => ({ ...prev, [cid]: (prev[cid]||[]).filter(m => m.id !== msgId) }));
                    deletedForMeIds.current.add(msgId);
                    localStorage.setItem('deletedForMeIds', JSON.stringify([...deletedForMeIds.current]));
                    setMsgContextMenu(null);
                    if (msgId && msgId.length > 10) {
                      try { await chatAPI.deleteMessage(msgId); } catch {}
                    }
                    showToast('Mensaje eliminado para todos', 'info');
                  }
                }] : []),
              ].map((item, i, arr) => (
                <button key={item.label} onClick={item.action} style={{
                  background:'none', border:'none',
                  padding:'12px 6px 10px',
                  display:'flex', flexDirection:'column', alignItems:'center', gap:'6px',
                  cursor:'pointer', fontFamily:'inherit',
                  borderRadius:'12px',
                  transition:'background 0.12s',
                }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background='rgba(0,0,0,0.05)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background='none'}>
                  <div style={{ width:38, height:38, borderRadius:10, background:'#f3f4f6', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color: item.color }}>
                    {item.icon}
                  </div>
                  <div style={{ fontSize:'11px', fontWeight:'600', color:'#374151', textAlign:'center', lineHeight:'1.2' }}>{item.label}</div>
                </button>
              ))}
            </div>

            {/* ── Eliminar ── */}
            {/* ── Cancelar ── */}
            <button onClick={() => setMsgContextMenu(null)} style={{
              width:'100%', marginTop:'8px',
              background:'rgba(255,255,255,0.85)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
              border:'1px solid rgba(255,255,255,0.7)',
              borderRadius:'18px', padding:'14px',
              fontSize:'15px', fontWeight:'700', color:'#374151',
              cursor:'pointer', fontFamily:'inherit',
              boxShadow:'0 2px 12px rgba(0,0,0,0.08)',
              transition:'background 0.12s',
            }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background='rgba(249,250,251,0.95)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.85)'}>
              Cancelar
            </button>
          </div>
        </>
      )}

      {/* Visor de imagen inline ? se abre dentro de la app */}
      {chatImageViewer && (
        <div
          onClick={() => setChatImageViewer(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 5000,
            background: 'rgba(0,0,0,0.95)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'zoom-out',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <style>{`@keyframes fadeIn { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }`}</style>
          <img
            src={chatImageViewer}
            alt="foto"
            style={{
              maxWidth: '95vw', maxHeight: '88vh',
              objectFit: 'contain',
              borderRadius: '4px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
              userSelect: 'none',
            }}
            onClick={e => e.stopPropagation()}
          />
          {/* Cerrar */}
          <button
            onClick={() => setChatImageViewer(null)}
            style={{
              position: 'absolute', top: '16px', right: '16px',
              background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '50%', width: '40px', height: '40px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#fff',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          {/* Descargar */}
          <a
            href={chatImageViewer}
            download="foto.jpg"
            onClick={e => e.stopPropagation()}
            style={{
              position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '20px', padding: '8px 20px',
              color: '#fff', fontSize: '13px', fontWeight: '600',
              textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Guardar foto
          </a>
        </div>
      )}
      {/* Llamada entrante */}
      {incomingCall && !activeCall && (
        <div style={{ position:'fixed', inset:0, zIndex:3000, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          {(() => {
            // Buscar nombre del llamante: primero en participantes de chats, luego en contactos
            const callerId = incomingCall.callerId?.toString();
            const myId = currentUserId.current?.toString();
            let callerName = '';
            let callerAvatar = '';

            // 1. Buscar en participantes de chats reales — excluir al usuario propio
            for (const ch of (realChats as any[])) {
              if (ch.type === 'group') continue;
              const p = ch.participants?.find((p: any) =>
                (p.user_id?.toString() === callerId || p.id?.toString() === callerId) &&
                p.user_id?.toString() !== myId
              );
              if (p) {
                callerName = p.users?.full_name || p.full_name || p.name || '';
                callerAvatar = p.users?.avatar_url || p.avatar_url || '';
                if (callerName) break;
              }
            }

            // 2. Fallback: buscar en allContacts
            if (!callerName) {
              const c = (allContacts as any[]).find(c =>
                c.id?.toString() === callerId || c.user_id?.toString() === callerId
              );
              if (c) { callerName = c.name || c.title || ''; callerAvatar = c.avatarUrl || ''; }
            }

            if (!callerName) callerName = 'Llamada entrante';
            const callerInitials = callerName.split(' ').map((w: string) => w[0]).join('').slice(0,2).toUpperCase();
            return (
              <div style={{ background:'linear-gradient(160deg,#1a1a2e,#16213e)', borderRadius:'24px', padding:'32px 24px', textAlign:'center', width:'280px', boxShadow:'0 20px 60px rgba(0,0,0,0.5)' }}>
                {/* Foto real del llamante */}
                <div style={{ width:'90px', height:'90px', borderRadius:'50%', margin:'0 auto 16px', overflow:'hidden', border:'3px solid rgba(0,200,160,0.5)', boxShadow:'0 0 0 6px rgba(0,200,160,0.15)' }}>
                  {callerAvatar
                    ? <img src={callerAvatar} alt={callerName} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                    : <div style={{ width:'100%', height:'100%', background:'linear-gradient(135deg,#00c8a0,#00b4e6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'28px', fontWeight:'800', color:'#fff' }}>{callerInitials}</div>
                  }
                </div>
                <div style={{ fontSize:'20px', fontWeight:'800', color:'#fff', marginBottom:'4px' }}>{callerName}</div>
                <div style={{ fontSize:'14px', color:'rgba(255,255,255,0.6)', marginBottom:'6px' }}>
                  {incomingCall.type === 'video' ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
                      Videollamada entrante
                    </span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6.29 6.29l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                      Llamada de voz entrante
                    </span>
                  )}
                </div>
                {/* Animaci?n de pulso */}
                <div style={{ display:'flex', justifyContent:'center', gap:'4px', marginBottom:'24px' }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#00c8a0', animation:`pulse ${0.8 + i*0.2}s ease infinite` }}/>
                  ))}
                </div>
                <div style={{ display:'flex', gap:'24px', justifyContent:'center' }}>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'8px' }}>
                    <button onClick={async () => {
                      stopRingtone(); playCallEnded(); vibrate(200);
                      // Notificar al servidor que la llamada fue rechazada (para que el caller lo detecte)
                      const rejectedCallId = incomingCall.callId;
                      incomingCallIdRef.current = null;
                      setIncomingCall(null);
                      try {
                        const token = authAPI.getToken();
                        const BASE_URL = ((import.meta as any).env?.VITE_API_URL || 'https://egchat-api.onrender.com/api').replace(/\/+$/, '');
                        await fetch(`${BASE_URL}/call/${rejectedCallId}`, {
                          method: 'DELETE',
                          headers: { Authorization: `Bearer ${token}` }
                        });
                      } catch {}
                      // Registrar llamada perdida en el chat del llamante
                      const callerChat = realChats.find((ch: any) =>
                        ch.participants?.some((p: any) => p.user_id?.toString() === incomingCall.callerId?.toString())
                      );
                      if (callerChat) {
                        const t = new Date();
                        const time = `${t.getHours().toString().padStart(2,'0')}:${t.getMinutes().toString().padStart(2,'0')}`;
                        const missedMsg: any = {
                          id: `call_${Date.now()}`, from: 'them' as const,
                          text: `📵 Llamada perdida`, time, status: 'delivered',
                          type: 'call', callType: incomingCall.type, callStatus: 'missed',
                          callDuration: 0, contactId: incomingCall.callerId, contactName: callerName,
                        };
                        const key = callerChat.id?.toString();
                        setChatMessages(prev => ({ ...prev, [key]: [...(prev[key] || []), missedMsg] }));
                        chatAPI.sendMessage(key, { text: '📌 Llamada perdida', type: 'text' }).catch(() => {});
                        // notificación en campanita
                        const nt = new Date();
                        const ntime = `${nt.getHours().toString().padStart(2,'0')}:${nt.getMinutes().toString().padStart(2,'0')}`;
                        setAppNotifications(prev => [{ id: Date.now().toString(), type: 'message' as const, title: `📵 Llamada perdida de ${callerName}`, body: incomingCall.type === 'video' ? 'Videollamada perdida' : 'Llamada de voz perdida', time: ntime, read: false, chatId: key }, ...prev].slice(0, 50));
                      }
                    }}
                      style={{ width:'64px', height:'64px', borderRadius:'50%', background:'#ef4444', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 16px rgba(239,68,68,0.4)' }}>
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.42 19.42 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.8"/><line x1="23" y1="1" x2="1" y2="23"/></svg>
                    </button>
                    <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.5)' }}>Rechazar</span>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'8px' }}>
                    <button onClick={async () => {
                      stopRingtone(); playCallConnected(); vibrate(100);
                      const contact = { id: incomingCall.callerId, title: callerName, status: 'online', avatarUrl: callerAvatar };
                      setActiveCall({ type: incomingCall.type, contact, status: 'calling' });
                      incomingCallIdRef.current = null;
                      setIncomingCall(null);
                      await webrtc.answerCall(incomingCall.callId, incomingCall.offer, incomingCall.type);
                      setActiveCall(prev => prev ? { ...prev, status: 'connected' } : null);
                    }}
                      style={{ width:'64px', height:'64px', borderRadius:'50%', background:'#22c55e', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 16px rgba(34,197,94,0.4)' }}>
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.8a16 16 0 0 0 6.06 6.06l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    </button>
                    <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.5)' }}>Aceptar</span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {renderProfileView()}
      {renderAddContactModal()}
      {renderCreateGroupModal()}
      
      {/* Modal de importación de contactos - primera vez */}
      {showContactImportModal && (
        <ContactImportModal
          currentUserId={userProfile.id || ''}
          onClose={() => {
            setShowContactImportModal(false);
            localStorage.setItem('egchat_contacts_imported', 'true');
          }}
          onComplete={() => {
            setShowContactImportModal(false);
            localStorage.setItem('egchat_contacts_imported', 'true');
            loadContacts();
          }}
        />
      )}
      
      {/* Vistas secundarias - fuera del stacking context del wallpaper */}
      {(currentView === 'estados' || currentView === 'apuestas' || currentView === 'cemac' || currentView === 'mitaxi') && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 600 }}>
          {currentView === 'estados' && <EstadosView onBack={() => setCurrentView(previousView || 'home')} currentUser={{ id: userProfile.id, name: userProfile.name, avatar: userProfile.avatar, avatarUrl: userProfile.avatarUrl, color: '#00c8a0' }} />}
          {currentView === 'apuestas' && <ApuestasView onBack={() => setCurrentView(previousView || 'home')} userBalance={userBalance} onDebit={(a: number) => setUserBalance(prev => prev - a)} />}
          {currentView === 'cemac' && <CemacView onBack={() => setCurrentView(previousView || 'home')} />}
          {currentView === 'mitaxi' && <MiTaxiView onBack={() => setCurrentView(previousView || 'home')} userBalance={userBalance} onDebit={(a: number) => setUserBalance(prev => prev - a)} userName={userProfile.name} userPhone={userProfile.phone} />}
        </div>
      )}

      {/* Contenido principal */}
      <div style={{ position: 'relative', zIndex: 1, height: '100%' }}>
        {renderCurrentView()}
      </div>

      {/* Panel lista de chats SIEMPRE visible en desktop cuando estamos en Mensajería */}
      {!device.isMobile && currentView === 'Mensajería' && !selectedChat && (
        <div style={{
          position: 'fixed', top: '44px', bottom: 0,
          left: device.isTablet ? '72px' : '240px',
          width: device.isTablet ? '280px' : '300px',
          background: '#fff', borderRight: '1px solid #e5e7eb',
          zIndex: 1002, overflow: 'hidden', display: 'flex', flexDirection: 'column',
        }}>
          {/* Barra de búsqueda + botón nuevo chat */}
          <div style={{ padding: '8px 8px 6px', borderBottom: '1px solid #f0f2f5', flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <input type="text" placeholder="Buscar..." value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ width: '100%', padding: '7px 12px 7px 30px', background: '#f3f4f6', border: 'none', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                <svg style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </div>
              <button onClick={() => { setShowContactSearch(s => !s); setContactSearchQuery(''); }} title="Nuevo chat"
                style={{ width: '34px', height: '34px', borderRadius: '8px', border: 'none', background: showContactSearch ? '#e5e7eb' : 'linear-gradient(135deg,#00c8a0,#00b4e6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.2s' }}>
                {showContactSearch
                  ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                }
              </button>
            </div>

            {/* Panel búsqueda de contactos inline — se muestra al pulsar + */}
            {showContactSearch && (
              <div style={{ marginBottom: '6px' }}>
                <div style={{ position: 'relative', marginBottom: '6px' }}>
                  <input
                    autoFocus
                    type="text"
                    placeholder="Buscar contacto..."
                    value={contactSearchQuery}
                    onChange={e => setContactSearchQuery(e.target.value)}
                    style={{ width: '100%', padding: '7px 12px 7px 30px', background: '#f0fdf4', border: '1.5px solid #00c8a0', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', color: '#111827' }}
                  />
                  <svg style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: '#00c8a0' }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                </div>
                <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {allContacts
                    .filter(c => !contactSearchQuery.trim() || c.name.toLowerCase().includes(contactSearchQuery.toLowerCase()) || c.phone.includes(contactSearchQuery))
                    .slice(0, 20)
                    .map(c => (
                      <button key={c.id} onClick={async () => {
                        try {
                          const chat = await chatAPI.createPrivate(c.id);
                          if (chat?.id) {
                            const initials2 = c.name.split(' ').map((w:string)=>w[0]).join('').slice(0,2).toUpperCase();
                            setSelectedChat({ id: chat.id, type: 'individual', title: c.name, subtitle: '', time: '', status: c.status, initials: initials2, color: '#00c8a0', avatarUrl: c.avatarUrl || '', user_id: c.id });
                            setCurrentView('Mensajería');
                            setShowContactSearch(false);
                            setContactSearchQuery('');
                            loadChats();
                          }
                        } catch { showToast('No se pudo abrir el chat', 'error'); }
                      }}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', background: 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', outline: 'none', textAlign: 'left', fontFamily: 'inherit', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg,#00c8a0,#00b4e6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', color: '#fff', flexShrink: 0, overflow: 'hidden' }}>
                          {c.avatarUrl ? <img src={c.avatarUrl} alt={c.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/> : c.avatar}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                          <div style={{ fontSize: '11px', color: '#9ca3af' }}>{c.phone}</div>
                        </div>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                      </button>
                    ))}
                  {allContacts.filter(c => !contactSearchQuery.trim() || c.name.toLowerCase().includes(contactSearchQuery.toLowerCase()) || c.phone.includes(contactSearchQuery)).length === 0 && (
                    <div style={{ padding: '12px', textAlign: 'center', color: '#9ca3af', fontSize: '12px' }}>Sin resultados</div>
                  )}
                </div>
              </div>
            )}

            {/* Tabs filtro */}
            <div style={{ display: 'flex', gap: '4px' }}>
              {[
                { id: 'individual', label: 'Individual' },
                { id: 'group', label: 'Grupos' },
                { id: 'money', label: 'Dinero' },
              ].map(tab => (
                <button key={tab.id} onClick={() => setMessageFilter(tab.id)}
                  style={{ flex: 1, padding: '5px 4px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: messageFilter === tab.id ? '700' : '500', background: messageFilter === tab.id ? 'rgba(0,200,160,0.12)' : 'transparent', color: messageFilter === tab.id ? '#00c8a0' : '#9ca3af', outline: 'none' }}>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          {/* Lista */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '6px' }}>
            {realChats
              .filter(chat => {
                const isGrp = chat.type === 'group' || (Array.isArray(chat.participants) && chat.participants.length > 2);
                if (messageFilter === 'group') return isGrp;
                if (messageFilter === 'individual') return !isGrp;
                if (messageFilter === 'money') {
                  const chatId = chat.id?.toString() || '';
                  const msgs = (chatMessages as any)[chatId] || [];
                  return msgs.some((m: any) => m.text?.includes('XAF') || m.text?.includes('💸')) || (chat.last_message?.text || '').includes('XAF');
                }
                return true;
              })
              .filter(chat => {
                if (!searchQuery.trim()) return true;
                const isGrp = chat.type === 'group';
                let name = chat.name || '';
                if (!isGrp && chat.participants) {
                  const other = chat.participants.find((p: any) => p.user_id?.toString() !== currentUserId.current?.toString());
                  if (other) name = other.full_name || other.users?.full_name || name;
                }
                return name.toLowerCase().includes(searchQuery.toLowerCase());
              })
              .map((chat: any) => {
                const isGrp = chat.type === 'group';
                let name = chat.name || '';
                let avatarUrl = '';
                if (!isGrp && chat.participants) {
                  const other = chat.participants.find((p: any) => p.user_id?.toString() !== currentUserId.current?.toString());
                  if (other) { name = other.full_name || other.users?.full_name || name; avatarUrl = other.avatar_url || other.users?.avatar_url || ''; }
                }
                if (!name) name = 'Chat';
                const initials2 = name.split(' ').map((w:string)=>w[0]).join('').slice(0,2).toUpperCase();
                const isActive = selectedChat?.id?.toString() === chat.id?.toString();
                const lastMsg = chat.last_message?.text || '';
                const time2 = chat.last_message?.created_at ? new Date(chat.last_message.created_at).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'}) : '';
                return (
                  <div key={chat.id} onClick={() => {
                    setSelectedChat({ id: chat.id, type: chat.type||'individual', title: name, subtitle: lastMsg, time: time2, status: 'online', initials: initials2, color: isGrp ? '#a855f7' : '#00c8a0', avatarUrl, isGroup: isGrp });
                    setCurrentView('Mensajería');
                  }} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 8px', borderRadius: '10px', cursor: 'pointer', background: isActive ? 'rgba(0,200,160,0.08)' : 'transparent', marginBottom: '2px', borderLeft: isActive ? '3px solid #00c8a0' : '3px solid transparent' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: isGrp ? 'linear-gradient(135deg,#a855f7,#6366f1)' : 'linear-gradient(135deg,#00c8a0,#00b4e6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: '700', color: '#fff', flexShrink: 0, overflow: 'hidden' }}>
                      {avatarUrl ? <img src={avatarUrl} alt={name} style={{width:'100%',height:'100%',objectFit:'cover'}}/> : <span>{initials2}</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: isActive ? '700' : '600', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                      <div style={{ fontSize: '12px', color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lastMsg || 'Sin mensajes'}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px', flexShrink: 0 }}>
                      {time2 && <span style={{ fontSize: '11px', color: '#9ca3af' }}>{time2}</span>}
                      {(chat.unread_count||0) > 0 && <div style={{ background: '#00c8a0', color: '#fff', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '700' }}>{chat.unread_count}</div>}
                    </div>
                  </div>
                );
              })}
            {realChats.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 16px', color: '#9ca3af' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>💬</div>
                <div style={{ fontSize: '13px' }}>Sin conversaciones</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Panel bienvenida desktop — visible en Mensajería sin chat seleccionado */}
      {!device.isMobile && currentView === 'Mensajería' && !selectedChat && (
        <div style={{
          position: 'fixed',
          top: '44px',
          left: device.isTablet ? `${72 + 280}px` : `${240 + 300}px`,
          right: 0,
          bottom: 0,
          zIndex: 1003,
          overflow: 'hidden',
          background: '#f8fafc',
        }}>
          <EGChatDesktopWelcome
            userName={userProfile?.name || 'Usuario'}
            userAvatar={userProfile?.avatar_url || userProfile?.avatarUrl || ''}
            userBalance={userBalance}
            totalChats={realChats.length}
            totalContacts={allContacts.length}
            onNewChat={() => setShowNewChatModal(true)}
            onOpenWallet={() => setCurrentView('monedero')}
            onOpenServices={() => setCurrentView('servicios')}
          />
        </div>
      )}
      
      {/* NAVEGACION inferior - solo en vistas principales */}
      {!isMenuOpen && ['home','Mensajería','monedero','servicios','ajustes'].includes(currentView) && renderBottomNavigation()}
      
      {/* Botón catlogo wallpaper  dentro del men radial, no aqu */}

      {/* Toast de notificación de mensaje nuevo */}
      {msgNotif && (
        <div
          onClick={() => { setMsgNotif(null); setSelectedChat(null); setCurrentView('Mensajería'); }}
          style={{
            position: 'fixed', top: '70px', left: '50%', transform: 'translateX(-50%)',
            zIndex: 9999, background: '#1a1a2e', borderRadius: '16px',
            padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)', cursor: 'pointer',
            minWidth: '280px', maxWidth: '340px',
            animation: 'slideDownNotif 0.3s cubic-bezier(0.34,1.56,0.64,1)',
            border: '1px solid rgba(0,200,160,0.3)',
          }}
        >
          <style>{`@keyframes slideDownNotif { from{opacity:0;transform:translateX(-50%) translateY(-20px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }`}</style>
          {/* Avatar */}
          <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg,#00c8a0,#00b4e6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '700', color: '#fff', flexShrink: 0, }}>
            {msgNotif.avatar
              ? <img src={msgNotif.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
              : msgNotif.sender.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()
            }
          </div>
          {/* Texto */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff', marginBottom: '2px' }}>{msgNotif.sender}</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msgNotif.text}</div>
          </div>
          {/* Cerrar */}
          <button onClick={e => { e.stopPropagation(); setMsgNotif(null); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: '4px', fontSize: '16px' }}>?</button>
        </div>
      )}

      {/* Avatar Crop Modal */}
      {avatarCropUrl && (
        <AvatarCropModal
          imageUrl={avatarCropUrl}
          onClose={() => setAvatarCropUrl(null)}
          onSave={(croppedUrl) => {
            localStorage.setItem('user_avatar', croppedUrl);
            setUserProfile((p: any) => ({ ...p, avatarUrl: croppedUrl }));
            setAvatarCropUrl(null);
          }}
        />
      )}

      {/* QR Scanner con camara real */}
      {showQRScannerCamera && (
        <QRScanner
          onClose={() => setShowQRScannerCamera(false)}
          onScan={async (data) => {
            setShowQRScannerCamera(false);
            const trimmed = data.trim();
            console.log('[QR] Escaneado:', trimmed);

            try {
              // ── 1. PAGO EGCHAT (egchat://pay?to=...&amount=...) ──────────
              if (trimmed.startsWith('egchat://pay') || trimmed.includes('egchat_pay')) {
                const url = new URL(trimmed.replace('egchat://', 'https://'));
                const to = url.searchParams.get('to') || url.searchParams.get('phone') || '';
                const amount = url.searchParams.get('amount') || '';
                const concept = url.searchParams.get('concept') || 'Pago QR';
                showToast(`💳 Pago a ${to} — ${amount} XAF`, 'info');
                setCurrentView('monedero');
                return;
              }

              // ── 2. CONTACTO EGCHAT (egchat://add?phone=...&name=...) ─────
              if (trimmed.startsWith('egchat://') || trimmed.includes('egchat.app') || trimmed.includes('egchat-v2.vercel.app')) {
                let url: URL;
                try { url = new URL(trimmed.replace('egchat://', 'https://')); } catch { url = new URL('https://x.com?' + trimmed.split('?')[1]); }
                const phone = url.searchParams.get('phone');
                const name = url.searchParams.get('name');
                const userId = url.searchParams.get('id');
                if (userId || phone) {
                  try {
                    await contactsAPI.add(userId || undefined, phone || undefined, name || undefined);
                    showToast(`✅ ${name || phone} añadido como contacto`, 'success');
                    await loadContacts();
                  } catch (e: any) {
                    showToast(e?.message?.includes('ya es') ? `${name || phone} ya está en tu lista` : 'No se pudo añadir', 'info');
                  }
                }
                return;
              }

              // ── 3. URL EXTERNA (http/https) ──────────────────────────────
              if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
                showToast(`🌐 Abriendo enlace...`, 'info');
                window.open(trimmed, '_blank');
                return;
              }

              // ── 4. NÚMERO DE TELÉFONO ────────────────────────────────────
              if (/^[+\d\s\-()]{6,20}$/.test(trimmed)) {
                const phone = trimmed.replace(/\s/g, '');
                showToast(`📞 Número: ${phone}`, 'info');
                try {
                  await contactsAPI.add(undefined, phone, undefined);
                  showToast(`✅ ${phone} añadido como contacto`, 'success');
                  await loadContacts();
                } catch {}
                return;
              }

              // ── 5. WIFI (WIFI:S:nombre;T:WPA;P:clave;;) ─────────────────
              if (trimmed.startsWith('WIFI:')) {
                const ssid = trimmed.match(/S:([^;]+)/)?.[1] || '';
                const pass = trimmed.match(/P:([^;]+)/)?.[1] || '';
                showToast(`📶 WiFi: ${ssid} — Contraseña: ${pass}`, 'info');
                navigator.clipboard?.writeText(pass);
                return;
              }

              // ── 6. EMAIL ─────────────────────────────────────────────────
              if (trimmed.startsWith('mailto:') || trimmed.includes('@') && !trimmed.includes(' ')) {
                showToast(`📧 Email: ${trimmed.replace('mailto:', '')}`, 'info');
                navigator.clipboard?.writeText(trimmed.replace('mailto:', ''));
                return;
              }

              // ── 7. TEXTO GENÉRICO ────────────────────────────────────────
              navigator.clipboard?.writeText(trimmed);
              showToast(`📋 Copiado: ${trimmed.slice(0, 60)}${trimmed.length > 60 ? '...' : ''}`, 'info');

            } catch (err: any) {
              showToast('No se pudo procesar el QR', 'error');
            }
          }}
        />
      )}

      {/* Men radial */}
      {renderRadialMenu()}
      
      {/* Botón flotante */}
      {renderFloatingButton()}
      
      {/* Botan de home */}
      {renderHomeButton()}

      {/* Botón flotante de IA - Draggable - Solo en Home */}
      {currentView === 'home' && (
        <button 
          onMouseDown={(e: React.MouseEvent) => {
            setIsDraggingAI(true);
            setDragOffsetAI({
              x: e.clientX - aiButtonPos.x,
              y: e.clientY - aiButtonPos.y
            });
          }}
          onTouchStart={(e: React.TouchEvent) => {
            const touch = e.touches[0];
            setIsDraggingAI(true);
            setDragOffsetAI({
              x: touch.clientX - aiButtonPos.x,
              y: touch.clientY - aiButtonPos.y
            });
          }}
          onClick={(e) => {
            if (!isDraggingAI) {
              setCurrentView('Lia-25');
            }
          }}
          style={{
            position: 'fixed',
            left: `${aiButtonPos.x}px`,
            top: `${aiButtonPos.y}px`,
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg,#00c8a0,#00b4e6)',
            border: '2px solid rgba(255,255,255,0.6)',
            color: '#fff',
            cursor: isDraggingAI ? 'grabbing' : 'grab',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1001,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            outline: 'none',
            touchAction: 'none',
            userSelect: 'none',
            padding: 0,
            overflow: 'hidden'
          }}
        >
          <img 
            src="/logo-transparent.png" 
            alt="Usuario" 
            style={{ 
              width: '100%', 
              height: '100%', 
              borderRadius: '50%',
              objectFit: 'cover'
            }}
          />
        </button>
      )}

      {/* Modal de Transferencia Rapida */}
      {showQuickTransferModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          backdropFilter: 'blur(4px)'
        }}
        onClick={() => setShowQuickTransferModal(false)}
        >
          <div style={{
            background: '#FFFFFF',
            width: '90%',
            maxWidth: '400px',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid rgba(0,0,0,0.08)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <h2 style={{
                fontSize: '16px',
                fontWeight: '700',
                color: '#0d0d0d',
                margin: 0
              }}>
                Transferencia Rapida
              </h2>
              <button style={{
                background: 'transparent',
                border: 'none',
                color: '#374151',
                fontSize: '24px',
                cursor: 'pointer',
                outline: 'none',
                padding: '0'
              }}
              onClick={() => setShowQuickTransferModal(false)}
              ><svg width='16' height='16' viewBox='0 0 24 24' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round'><line x1='18' y1='6' x2='6' y2='18'/><line x1='6' y1='6' x2='18' y2='18'/></svg></button>
            </div>

            {/* informacion del Contacto */}
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '16px'
            }}>
              <div style={{ fontSize: '14px', color: '#374151', marginBottom: '4px' }}>
                Destinatario
              </div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#00c8a0' }}>
                {quickTransferData.contactName}
              </div>
            </div>

            {/* Formulario */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Saldo monedero */}
              <div style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '8px',
                padding: '8px 12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '14px', color: '#374151' }}>Monedero EGChat</span>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#00c8a0' }}>{userBalance.toLocaleString()} XAF</span>
              </div>

              {/* Cuenta Origen (respaldo) */}
              <div>
                <label style={{ fontSize: '14px', color: '#374151', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                  Cuenta bancaria (respaldo)
                </label>
                <select
                  value={quickTransferData.accountId}
                  onChange={(e) => setQuickTransferData({ ...quickTransferData, accountId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'rgba(249,250,251,0.88)',
                    border: '1px solid rgba(0,0,0,0.08)',
                    borderRadius: '8px',
                    color: '#0d0d0d',
                    fontSize: '12px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                >
                  {bankAccounts.map((account) => (
                    <option key={account.id} value={account.id} style={{ background: '#FFFFFF', color: '#0d0d0d' }}>
                      {account.bank} ({account.type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Monto */}
              <div>
                <label style={{ fontSize: '14px', color: '#374151', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                  Monto (XAF)
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={quickTransferData.amount}
                  onChange={(e) => setQuickTransferData({ ...quickTransferData, amount: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'rgba(249,250,251,0.88)',
                    border: '1px solid rgba(0,0,0,0.08)',
                    borderRadius: '8px',
                    color: '#0d0d0d',
                    fontSize: '12px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Error de liquidez */}
              {transferError && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '14px',
                  color: '#ef4444',
                  textAlign: 'center'
                }}>
                  {transferError}
                </div>
              )}

              {/* Botones */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button
                  onClick={() => {
                    setTransferError('');
                    if (!quickTransferData.amount || parseInt(quickTransferData.amount) <= 0) return;
                    const amount = parseInt(quickTransferData.amount);

                    // 1. Intentar desde monedero EGChat
                    if (userBalance >= amount) {
                      setUserBalance(userBalance - amount);
                      const newTransfer = {
                        id: Date.now().toString(),
                        from: 'Monedero EGChat',
                        to: quickTransferData.contactName,
                        amount,
                        status: 'pending' as const,
                        createdAt: new Date(),
                        expiresAt: new Date(Date.now() + 5 * 60 * 1000)
                      };
                      setPendingTransfers([...pendingTransfers, newTransfer]);
                      setShowQuickTransferModal(false);
                      setQuickTransferData({ contactId: '', contactName: '', amount: '', accountId: '' });
                      return;
                    }

                    // 2. Intentar desde cuenta bancaria seleccionada
                    const sourceAccount = bankAccounts.find(a => a.id === quickTransferData.accountId);
                    if (sourceAccount && amount <= sourceAccount.balance) {
                      const newTransfer = {
                        id: Date.now().toString(),
                        from: sourceAccount.bank,
                        to: quickTransferData.contactName,
                        amount,
                        status: 'pending' as const,
                        createdAt: new Date(),
                        expiresAt: new Date(Date.now() + 5 * 60 * 1000)
                      };
                      setPendingTransfers([...pendingTransfers, newTransfer]);
                      setBankAccounts(bankAccounts.map(acc =>
                        acc.id === quickTransferData.accountId
                          ? { ...acc, balance: acc.balance - amount }
                          : acc
                      ));
                      setShowQuickTransferModal(false);
                      setQuickTransferData({ contactId: '', contactName: '', amount: '', accountId: '' });
                      return;
                    }

                    // 3. Sin fondos suficientes
                    setTransferError('No se ha podido realizar la transferencia por falta de liquidez');
                  }}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(16, 185, 129, 0.2))',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    color: '#00c8a0',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    outline: 'none',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.4), rgba(16, 185, 129, 0.3))';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(16, 185, 129, 0.2))';
                  }}
                >
                  Enviar
                </button>
                <button
                  onClick={() => { setShowQuickTransferModal(false); setTransferError(''); }}
                  style={{
                    flex: 1,
                    background: 'rgba(249,250,251,0.88)',
                    border: '1px solid rgba(0,0,0,0.08)',
                    color: '#374151',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    outline: 'none',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(0,0,0,0.06)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Agregar Cuenta Bancaria */}
      {showAddBankAccount && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          backdropFilter: 'blur(4px)'
        }}
        onClick={() => setShowAddBankAccount(false)}
        >
          <div style={{
            background: '#FFFFFF',
            width: '90%',
            maxWidth: '400px',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid rgba(0,0,0,0.08)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <h2 style={{
                fontSize: '16px',
                fontWeight: '700',
                color: '#0d0d0d',
                margin: 0
              }}>
                Agregar Cuenta
              </h2>
              <button style={{
                background: 'transparent',
                border: 'none',
                color: '#374151',
                fontSize: '24px',
                cursor: 'pointer',
                outline: 'none',
                padding: '0'
              }}
              onClick={() => setShowAddBankAccount(false)}
              ><svg width='16' height='16' viewBox='0 0 24 24' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round'><line x1='18' y1='6' x2='6' y2='18'/><line x1='6' y1='6' x2='18' y2='18'/></svg></button>
            </div>

            {/* Formulario */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Banco */}
              <div>
                <label style={{ fontSize: '14px', color: '#374151', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                  Banco
                </label>
                <input
                  type="text"
                  placeholder="Ej: BANGE, CCEI Bank..."
                  value={newBankForm.bank}
                  onChange={(e) => setNewBankForm({ ...newBankForm, bank: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'rgba(249,250,251,0.88)',
                    border: '1px solid rgba(0,0,0,0.08)',
                    borderRadius: '8px',
                    color: '#0d0d0d',
                    fontSize: '12px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Tipo de Cuenta */}
              <div>
                <label style={{ fontSize: '14px', color: '#374151', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                  Tipo de Cuenta
                </label>
                <select
                  value={newBankForm.type}
                  onChange={(e) => setNewBankForm({ ...newBankForm, type: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'rgba(249,250,251,0.88)',
                    border: '1px solid rgba(0,0,0,0.08)',
                    borderRadius: '8px',
                    color: '#0d0d0d',
                    fontSize: '12px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="Corriente" style={{ background: '#FFFFFF', color: '#0d0d0d' }}>Corriente</option>
                  <option value="Ahorros" style={{ background: '#FFFFFF', color: '#0d0d0d' }}>Ahorros</option>
                  <option value="Namina" style={{ background: '#FFFFFF', color: '#0d0d0d' }}>Namina</option>
                  <option value="Inversión" style={{ background: '#FFFFFF', color: '#0d0d0d' }}>Inversión</option>
                </select>
              </div>

              {/* Saldo Inicial */}
              <div>
                <label style={{ fontSize: '14px', color: '#374151', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                  Saldo Inicial (XAF)
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={newBankForm.balance}
                  onChange={(e) => setNewBankForm({ ...newBankForm, balance: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'rgba(249,250,251,0.88)',
                    border: '1px solid rgba(0,0,0,0.08)',
                    borderRadius: '8px',
                    color: '#0d0d0d',
                    fontSize: '12px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Botones */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button
                  onClick={() => {
                    if (newBankForm.bank && newBankForm.balance) {
                      const newAccount = {
                        id: Date.now().toString(),
                        bank: newBankForm.bank,
                        type: newBankForm.type,
                        balance: parseInt(newBankForm.balance),
                        icon: 'banking'
                      };
                      setBankAccounts([...bankAccounts, newAccount]);
                      setNewBankForm({ bank: '', type: 'Corriente', balance: '' });
                      setShowAddBankAccount(false);
                      console.log('Cuenta agregada:', newAccount);
                    }
                  }}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(16, 185, 129, 0.2))',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    color: '#00c8a0',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    outline: 'none',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.4), rgba(16, 185, 129, 0.3))';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(16, 185, 129, 0.2))';
                  }}
                >
                  Guardar
                </button>
                <button
                  onClick={() => setShowAddBankAccount(false)}
                  style={{
                    flex: 1,
                    background: 'rgba(249,250,251,0.88)',
                    border: '1px solid rgba(0,0,0,0.08)',
                    color: '#374151',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    outline: 'none',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(0,0,0,0.06)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* M?dulo Recarga Tel. */}
      {showRechargeModal && <RecargaModal onClose={() => setShowRechargeModal(false)} userBalance={userBalance} onDebit={(n) => setUserBalance((p: number) => p - n)} />}

      {/* M?dulo Internet */}
      {showInternetModal && <InternetModal onClose={() => setShowInternetModal(false)} userBalance={userBalance} onDebit={(n) => setUserBalance((p: number) => p - n)} />}



      {/* Modal Servicios Publicos + Diarios + Herramientas */}
      {showSvcModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:3000, display:'flex', alignItems:'flex-end', justifyContent:'center' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowSvcModal(null); }}>
          <div style={{ background:'#F7F8FA', borderRadius:'12px 12px 0 0', width:'100%', maxWidth:'420px', maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'center', paddingTop:'8px' }}>
              <div style={{ width:'36px', height:'4px', borderRadius:'2px', background:'#e0e0e0' }} />
            </div>
            <div style={{ display:'flex', alignItems:'center', padding:'8px 14px', background:'#fff', borderBottom:'1px solid #ebebeb' }}>
              {svcStep !== 'main' && svcStep !== 'success' ? (
                <button onClick={() => setSvcStep('main')} style={{ background:'none', border:'none', cursor:'pointer', padding:'4px 8px 4px 0', color:'#07C160', display:'flex' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
              ) : <div style={{ width:'28px' }} />}
              <div style={{ flex:1, textAlign:'center', fontSize:'15px', fontWeight:'700', color:'#0d0d0d' }}>
                {({'elec':'Electricidad','agua':'Agua','salud':'Salud','edu':'Educacion','transp':'Transporte','correos':'Correos','impuestos':'Impuestos','super':'Supermercado','comida':'Comida a Domicilio','taxi':'Taxi','farmacia':'Farmacia','restaurante':'Restaurante','hotel':'Hotel','vuelos':'Vuelos','tienda':'Tienda Online','lavanderia':'Lavanderia','belleza':'Belleza','gasolinera':'Gasolinera','noticias':'Noticias','id':'ID Digital','emergencia':'Emergencia'} as Record<string,string>)[showSvcModal]}
              </div>
              <button onClick={() => setShowSvcModal(null)} style={{ background:'none', border:'none', cursor:'pointer', padding:'4px', color:'#9ca3af', display:'flex' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* ELECTRICIDAD */}
            {showSvcModal === 'elec' && svcStep === 'main' && (
              <div style={{ padding:'0 0 24px' }}>
                {/* Header SEGESA */}
                <div style={{ background:'linear-gradient(135deg,#1A3A6B,#2A5298)', padding:'20px 16px', marginBottom:'0' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'14px', marginBottom:'16px' }}>
                    <div style={{ width:'56px', height:'56px', borderRadius:'14px', overflow:'hidden', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <img src={asset('assets/services/segesa.svg')} alt="SEGESA" style={{ width:'52px', height:'52px', objectFit:'contain' }} onError={(e)=>{ (e.target as HTMLImageElement).style.display='none'; }}/>
                    </div>
                    <div>
                      <div style={{ fontSize:'18px', fontWeight:'800', color:'#fff' }}>SEGESA</div>
                      <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.75)' }}>Sociedad de Electricidad de Guinea Ecuatorial</div>
                      <div style={{ display:'flex', alignItems:'center', gap:'4px', marginTop:'4px' }}>
                        <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#4ADE80' }}/>
                        <span style={{ fontSize:'10px', color:'#4ADE80', fontWeight:'600' }}>Servicio disponible 24h</span>
                      </div>
                    </div>
                  </div>
                  {/* Pasos del proceso */}
                  <div style={{ display:'flex', alignItems:'center', gap:'0' }}>
                    {['Contrato','Factura','Pago','Confirmacion'].map((s,i)=>(
                      <React.Fragment key={s}>
                        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'3px' }}>
                          <div style={{ width:'22px', height:'22px', borderRadius:'50%', background: i===0?'#FFD700':'rgba(255,255,255,0.25)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:'800', color: i===0?'#1A3A6B':'rgba(255,255,255,0.6)' }}>{i+1}</div>
                          <div style={{ fontSize:'8px', color: i===0?'#FFD700':'rgba(255,255,255,0.5)', fontWeight:'600', whiteSpace:'nowrap' }}>{s}</div>
                        </div>
                        {i<3&&<div style={{ flex:1, height:'1px', background:'rgba(255,255,255,0.2)', margin:'0 4px 14px' }}/>}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                <div style={{ padding:'16px' }}>
                  {/* Tipo de cliente */}
                  <div style={{ marginBottom:'14px' }}>
                    <div style={{ fontSize:'12px', fontWeight:'600', color:'#9CA3AF', marginBottom:'8px' }}>Tipo de cliente</div>
                    <div style={{ display:'flex', gap:'8px' }}>
                      {['Residencial','Comercial','Industrial'].map(t=>(
                        <button key={t} onClick={()=>setSvcData((p:Record<string,string>)=>({...p,clientType:t}))} style={{ flex:1, background:svcData.clientType===t?'#1A3A6B':'#F9FAFB', border:`1.5px solid ${svcData.clientType===t?'#1A3A6B':'#E5E7EB'}`, borderRadius:'8px', padding:'8px 4px', fontSize:'11px', fontWeight:'700', color:svcData.clientType===t?'#fff':'#6B7280', cursor:'pointer' }}>{t}</button>
                      ))}
                    </div>
                  </div>

                  {/* Nmero de contrato */}
                  <div style={{ fontSize:'12px', fontWeight:'600', color:'#9CA3AF', marginBottom:'6px' }}>Nmero de contrato / medidor</div>
                  <div style={{ background:'#F9FAFB', borderRadius:'10px', padding:'0 14px', marginBottom:'6px', height:'52px', display:'flex', alignItems:'center', border:'1.5px solid #E5E7EB', gap:'10px' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
                    <input type="text" placeholder="Ej: 0012345678" value={svcData.contrato||''} onChange={(e)=>setSvcData((p:Record<string,string>)=>({...p,contrato:e.target.value}))} style={{ flex:1, background:'none', border:'none', outline:'none', fontSize:'15px', color:'#111827', fontFamily:'inherit', fontWeight:'600' }}/>
                  </div>
                  <div style={{ fontSize:'10px', color:'#9CA3AF', marginBottom:'14px' }}>📋 Encuéntralo en tu factura o en el medidor</div>

                  {/* Consultar factura */}
                  {svcData.contrato && !svcData.facturaConsultada && (
                    <button onClick={()=>setSvcData((p:Record<string,string>)=>({...p,facturaConsultada:'1',facturaImporte:'18500',facturaPeriodo:'Marzo 2026',facturaVencimiento:'30/04/2026',facturaEstado:'Pendiente'}))}
                      style={{ width:'100%', background:'linear-gradient(135deg,#1A3A6B,#2A5298)', border:'none', borderRadius:'10px', padding:'13px', color:'#fff', fontSize:'14px', fontWeight:'700', cursor:'pointer', marginBottom:'12px' }}>
                      🔍 Consultar factura
                    </button>
                  )}

                  {/* Resultado de consulta */}
                  {svcData.facturaConsultada && (
                    <div>
                      <div style={{ background:'#EFF5FD', borderRadius:'12px', padding:'14px', marginBottom:'14px', border:'1px solid #BFDBFE' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' }}>
                          <div style={{ fontSize:'12px', fontWeight:'700', color:'#1A3A6B' }}>Factura encontrada</div>
                          <span style={{ background:svcData.facturaEstado==='Pendiente'?'#FEF3C7':'#F0FDF4', color:svcData.facturaEstado==='Pendiente'?'#92400E':'#16A34A', borderRadius:'6px', padding:'2px 8px', fontSize:'10px', fontWeight:'700' }}>{svcData.facturaEstado}</span>
                        </div>
                        {[['Per?odo',svcData.facturaPeriodo],['Vencimiento',svcData.facturaVencimiento],['Importe',`${parseInt(svcData.facturaImporte||'0').toLocaleString()} XAF`]].map(([l,v])=>(
                          <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid #DBEAFE' }}>
                            <span style={{ fontSize:'12px', color:'#6B7280' }}>{l}</span>
                            <span style={{ fontSize:'12px', fontWeight:'700', color:'#111827' }}>{v}</span>
                          </div>
                        ))}
                        <div style={{ display:'flex', justifyContent:'space-between', paddingTop:'8px' }}>
                          <span style={{ fontSize:'14px', fontWeight:'700', color:'#1A3A6B' }}>Total a pagar</span>
                          <span style={{ fontSize:'18px', fontWeight:'900', color:'#1A3A6B' }}>{parseInt(svcData.facturaImporte||'0').toLocaleString()} XAF</span>
                        </div>
                      </div>

                      {/* Metodo de pago */}
                      <div style={{ fontSize:'12px', fontWeight:'600', color:'#9CA3AF', marginBottom:'8px' }}>Metodo de pago</div>
                      <div style={{ display:'flex', gap:'8px', marginBottom:'14px' }}>
                        {[{id:'wallet',label:'EGCHAT Wallet',icon:'💳'},{id:'bank',label:'Banco',icon:'🏦'},{id:'cash',label:'Efectivo',icon:'💵'}].map(m=>(
                          <button key={m.id} onClick={()=>setSvcData((p:Record<string,string>)=>({...p,payMethod:m.id}))} style={{ flex:1, background:svcData.payMethod===m.id?'#EFF5FD':'#F9FAFB', border:`1.5px solid ${svcData.payMethod===m.id?'#1A3A6B':'#E5E7EB'}`, borderRadius:'8px', padding:'8px 4px', fontSize:'10px', fontWeight:'700', color:svcData.payMethod===m.id?'#1A3A6B':'#6B7280', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:'3px' }}>
                            <span style={{ fontSize:'16px' }}>{m.icon}</span>{m.label}
                          </button>
                        ))}
                      </div>

                      <button onClick={()=>{ if(svcData.payMethod) setSvcStep('confirm'); }}
                        style={{ width:'100%', background:svcData.payMethod?'linear-gradient(135deg,#1A3A6B,#2A5298)':'#E5E7EB', border:'none', borderRadius:'12px', padding:'14px', color:svcData.payMethod?'#fff':'#9CA3AF', fontSize:'15px', fontWeight:'700', cursor:svcData.payMethod?'pointer':'default' }}>
                        Pagar {svcData.facturaImporte?`${parseInt(svcData.facturaImporte).toLocaleString()} XAF`:''}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* AGUA */}
            {showSvcModal === 'agua' && svcStep === 'main' && (
              <div style={{ padding:'0 0 24px' }}>
                <div style={{ background:'linear-gradient(135deg,#0A4A8A,#1565C0)', padding:'20px 16px', marginBottom:'0' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'14px', marginBottom:'12px' }}>
                    <div style={{ width:'56px', height:'56px', borderRadius:'14px', overflow:'hidden', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <img src={asset('assets/services/snge.svg')} alt="SNGE" style={{ width:'52px', height:'52px', objectFit:'contain' }} onError={(e)=>{ (e.target as HTMLImageElement).style.display='none'; }}/>
                    </div>
                    <div>
                      <div style={{ fontSize:'18px', fontWeight:'800', color:'#fff' }}>SNGE</div>
                      <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.75)' }}>Sociedad Nacional de Gestion del Agua</div>
                      <div style={{ display:'flex', alignItems:'center', gap:'4px', marginTop:'4px' }}>
                        <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#4FC3F7' }}/>
                        <span style={{ fontSize:'10px', color:'#4FC3F7', fontWeight:'600' }}>Servicio disponible</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{ padding:'16px' }}>
                  <div style={{ fontSize:'12px', fontWeight:'600', color:'#9CA3AF', marginBottom:'6px' }}>Nmero de contrato / medidor</div>
                  <div style={{ background:'#F9FAFB', borderRadius:'10px', padding:'0 14px', marginBottom:'6px', height:'52px', display:'flex', alignItems:'center', border:'1.5px solid #E5E7EB', gap:'10px' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
                    <input type="text" placeholder="Ej: SNGE-00456" value={svcData.contrato||''} onChange={(e)=>setSvcData((p:Record<string,string>)=>({...p,contrato:e.target.value}))} style={{ flex:1, background:'none', border:'none', outline:'none', fontSize:'15px', color:'#111827', fontFamily:'inherit', fontWeight:'600' }}/>
                  </div>
                  <div style={{ fontSize:'10px', color:'#9CA3AF', marginBottom:'14px' }}>📋 Encuéntralo en tu factura de agua</div>
                  {svcData.contrato && !svcData.facturaConsultada && (
                    <button onClick={()=>setSvcData((p:Record<string,string>)=>({...p,facturaConsultada:'1',facturaImporte:'8200',facturaPeriodo:'Marzo 2026',facturaVencimiento:'15/04/2026',facturaEstado:'Pendiente'}))}
                      style={{ width:'100%', background:'linear-gradient(135deg,#0A4A8A,#1565C0)', border:'none', borderRadius:'10px', padding:'13px', color:'#fff', fontSize:'14px', fontWeight:'700', cursor:'pointer', marginBottom:'12px' }}>
                      🔍 Consultar factura
                    </button>
                  )}
                  {svcData.facturaConsultada && (
                    <div>
                      <div style={{ background:'#EFF5FD', borderRadius:'12px', padding:'14px', marginBottom:'14px', border:'1px solid #BFDBFE' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' }}>
                          <div style={{ fontSize:'12px', fontWeight:'700', color:'#0A4A8A' }}>Factura encontrada</div>
                          <span style={{ background:'#FEF3C7', color:'#92400E', borderRadius:'6px', padding:'2px 8px', fontSize:'10px', fontWeight:'700' }}>{svcData.facturaEstado}</span>
                        </div>
                        {[['Per?odo',svcData.facturaPeriodo],['Vencimiento',svcData.facturaVencimiento],['Importe',`${parseInt(svcData.facturaImporte||'0').toLocaleString()} XAF`]].map(([l,v])=>(
                          <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid #DBEAFE' }}>
                            <span style={{ fontSize:'12px', color:'#6B7280' }}>{l}</span>
                            <span style={{ fontSize:'12px', fontWeight:'700', color:'#111827' }}>{v}</span>
                          </div>
                        ))}
                        <div style={{ display:'flex', justifyContent:'space-between', paddingTop:'8px' }}>
                          <span style={{ fontSize:'14px', fontWeight:'700', color:'#0A4A8A' }}>Total</span>
                          <span style={{ fontSize:'18px', fontWeight:'900', color:'#0A4A8A' }}>{parseInt(svcData.facturaImporte||'0').toLocaleString()} XAF</span>
                        </div>
                      </div>
                      <div style={{ display:'flex', gap:'8px', marginBottom:'14px' }}>
                        {[{id:'wallet',label:'EGCHAT Wallet',icon:'💳'},{id:'bank',label:'Banco',icon:'🏦'},{id:'cash',label:'Efectivo',icon:'💵'}].map(m=>(
                          <button key={m.id} onClick={()=>setSvcData((p:Record<string,string>)=>({...p,payMethod:m.id}))} style={{ flex:1, background:svcData.payMethod===m.id?'#EFF5FD':'#F9FAFB', border:`1.5px solid ${svcData.payMethod===m.id?'#0A4A8A':'#E5E7EB'}`, borderRadius:'8px', padding:'8px 4px', fontSize:'10px', fontWeight:'700', color:svcData.payMethod===m.id?'#0A4A8A':'#6B7280', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:'3px' }}>
                            <span style={{ fontSize:'16px' }}>{m.icon}</span>{m.label}
                          </button>
                        ))}
                      </div>
                      <button onClick={()=>{ if(svcData.payMethod) setSvcStep('confirm'); }}
                        style={{ width:'100%', background:svcData.payMethod?'linear-gradient(135deg,#0A4A8A,#1565C0)':'#E5E7EB', border:'none', borderRadius:'12px', padding:'14px', color:svcData.payMethod?'#fff':'#9CA3AF', fontSize:'15px', fontWeight:'700', cursor:svcData.payMethod?'pointer':'default' }}>
                        Pagar {svcData.facturaImporte?`${parseInt(svcData.facturaImporte).toLocaleString()} XAF`:''}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SALUD */}
            {showSvcModal === 'salud' && svcStep === 'main' && (
              <div style={{ padding:'12px 16px 24px' }}>
                <div style={{ fontSize:'11px', color:'#888', fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'8px' }}>Servicios de salud</div>
                {[
                  {id:'cita',label:'Pedir Cita Medica',sub:'Hospitales y clinicas',color:'#FA5151'},
                  {id:'urgencias',label:'Urgencias',sub:'Centros de urgencia cercanos',color:'#E40000'},
                  {id:'farmacia',label:'Farmacia Online',sub:'Medicamentos a domicilio',color:'#07C160'},
                  {id:'laboratorio',label:'Laboratorio',sub:'Analisis y resultados',color:'#576B95'},
                ].map((s) => (
                  <button key={s.id} onClick={() => { setSvcStep('form-salud'); setSvcData({type:s.id,typeLabel:s.label}); }}
                    style={{ width:'100%', background:'#fff', border:'none', borderRadius:'10px', padding:'12px 14px', cursor:'pointer', outline:'none', display:'flex', alignItems:'center', gap:'12px', marginBottom:'6px' }}
                    onMouseEnter={(e)=>{e.currentTarget.style.background='#f9fafb';}} onMouseLeave={(e)=>{e.currentTarget.style.background='#fff';}}>
                    <div style={{ width:'42px', height:'42px', borderRadius:'12px', background:'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" stroke={s.color} strokeWidth="2" strokeLinecap="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                    </div>
                    <div style={{ flex:1, textAlign:'left' }}><div style={{ fontSize:'14px', fontWeight:'600', color:'#0d0d0d' }}>{s.label}</div><div style={{ fontSize:'11px', color:'#9ca3af' }}>{s.sub}</div></div>
                    <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                ))}
              </div>
            )}
            {showSvcModal === 'salud' && svcStep === 'form-salud' && (
              <div style={{ padding:'12px 16px 24px' }}>
                <div style={{ background:'#fff', borderRadius:'10px', padding:'10px 14px', marginBottom:'12px' }}><div style={{ fontSize:'13px', fontWeight:'600', color:'#0d0d0d' }}>{svcData.typeLabel}</div></div>
                {[{key:'name',placeholder:'Nombre completo',type:'text'},{key:'phone',placeholder:'Telefono',type:'tel'},{key:'date',placeholder:'Fecha preferida (DD/MM/AAAA)',type:'text'},{key:'notes',placeholder:'Notas adicionales',type:'text'}].map((f) => (
                  <div key={f.key} style={{ background:'#fff', borderRadius:'10px', padding:'0 14px', marginBottom:'8px', display:'flex', alignItems:'center', height:'48px' }}>
                    <input type={f.type} placeholder={f.placeholder} value={svcData[f.key]||''} onChange={(e) => setSvcData((p:Record<string,string>) => ({...p,[f.key]:e.target.value}))} style={{ flex:1, background:'none', border:'none', outline:'none', fontSize:'14px', color:'#0d0d0d', fontFamily:'inherit' }} />
                  </div>
                ))}
                <button onClick={() => { if(svcData.name && svcData.phone) setSvcStep('success'); }} style={{ width:'100%', background:svcData.name&&svcData.phone?'#07C160':'#e5e7eb', border:'none', borderRadius:'10px', padding:'13px', color:svcData.name&&svcData.phone?'#fff':'#9ca3af', fontSize:'14px', fontWeight:'700', cursor:svcData.name&&svcData.phone?'pointer':'default', outline:'none', marginTop:'8px' }}>Confirmar</button>
              </div>
            )}
            {/* EDUCACION */}
            {showSvcModal === 'edu' && svcStep === 'main' && (
              <div style={{ padding:'0 0 24px' }}>
                <div style={{ background:'linear-gradient(135deg,#4C1D95,#6B5BD6)', padding:'20px 16px', marginBottom:'0' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'14px', marginBottom:'8px' }}>
                    <div style={{ width:'52px', height:'52px', borderRadius:'14px', background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                    </div>
                    <div><div style={{ fontSize:'18px', fontWeight:'800', color:'#fff' }}>Educación</div><div style={{ fontSize:'11px', color:'rgba(255,255,255,0.75)' }}>Pagos educativos  -  Guinea Ecuatorial</div></div>
                  </div>
                </div>
                <div style={{ padding:'14px 16px 0' }}>
                  {[
                    {id:'matricula',label:'Matrcula Escolar',sub:'Colegios pblicos y privados',price:'25,000',color:'#6B5BD6',icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>},
                    {id:'universidad',label:'Universidad',sub:'UNGE, UNIGE y otras',price:'150,000',color:'#1485EE',icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>},
                    {id:'cursos',label:'Cursos y Formacin',sub:'Formacin profesional online',price:'50,000',color:'#00c8a0',icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>},
                    {id:'libros',label:'Material Escolar',sub:'Libros y tiles escolares',price:'15,000',color:'#F59E0B',icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>},
                  ].map((e) => (
                    <button key={e.id} onClick={() => { setSvcStep('form-edu'); setSvcData({type:e.id,typeLabel:e.label,price:e.price}); }}
                      style={{ width:'100%', background:'#fff', border:'1px solid #F0F2F5', borderRadius:'12px', padding:'13px 14px', cursor:'pointer', outline:'none', display:'flex', alignItems:'center', gap:'12px', marginBottom:'8px', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}
                      onMouseEnter={(e2)=>{e2.currentTarget.style.background='#F9FAFB';}} onMouseLeave={(e2)=>{e2.currentTarget.style.background='#fff';}}>
                      <div style={{ width:'44px', height:'44px', borderRadius:'12px', background:e.color+'15', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color:e.color }}>{e.icon}</div>
                      <div style={{ flex:1, textAlign:'left' }}><div style={{ fontSize:'14px', fontWeight:'600', color:'#111827' }}>{e.label}</div><div style={{ fontSize:'11px', color:'#9CA3AF', marginTop:'2px' }}>{e.sub}</div></div>
                      <div style={{ textAlign:'right' }}><div style={{ fontSize:'12px', fontWeight:'700', color:e.color }}>{e.price} XAF</div><svg width="14" height="14" viewBox="0 0 24 24" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg></div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {showSvcModal === 'edu' && svcStep === 'form-edu' && (
              <div style={{ padding:'14px 16px 24px' }}>
                <div style={{ background:'linear-gradient(135deg,#4C1D95,#6B5BD6)', borderRadius:'12px', padding:'14px', marginBottom:'14px', display:'flex', alignItems:'center', gap:'12px' }}>
                  <div style={{ flex:1 }}><div style={{ fontSize:'14px', fontWeight:'700', color:'#fff' }}>{svcData.typeLabel}</div><div style={{ fontSize:'11px', color:'rgba(255,255,255,0.75)', marginTop:'2px' }}>Precio referencia: {svcData.price} XAF</div></div>
                </div>
                {[{key:'student',placeholder:'Nombre del estudiante',type:'text',icon:'👤'},{key:'institution',placeholder:'Centro educativo',type:'text',icon:'📋'},{key:'ref',placeholder:'Nmero de referencia / matrcula',type:'text',icon:'📋'},{key:'amount',placeholder:'Importe a pagar (XAF)',type:'number',icon:'📋'}].map((f) => (
                  <div key={f.key} style={{ background:'#fff', borderRadius:'10px', padding:'0 14px', marginBottom:'8px', display:'flex', alignItems:'center', height:'50px', border:'1px solid #F0F2F5', gap:'10px' }}>
                    <span style={{ fontSize:'16px' }}>{f.icon}</span>
                    <input type={f.type} placeholder={f.placeholder} value={svcData[f.key]||''} onChange={(e) => setSvcData((p:Record<string,string>) => ({...p,[f.key]:e.target.value}))} style={{ flex:1, background:'none', border:'none', outline:'none', fontSize:'13px', color:'#111827', fontFamily:'inherit' }} />
                  </div>
                ))}
                <div style={{ fontSize:'12px', fontWeight:'600', color:'#9CA3AF', margin:'12px 0 8px' }}>Metodo de pago</div>
                <div style={{ display:'flex', gap:'8px', marginBottom:'14px' }}>
                  {[{id:'wallet',label:'EGCHAT',icon:'💳'},{id:'bank',label:'Banco',icon:'🏦'},{id:'cash',label:'Efectivo',icon:'💵'}].map(m=>(
                    <button key={m.id} onClick={()=>setSvcData((p:Record<string,string>)=>({...p,payMethod:m.id}))} style={{ flex:1, background:svcData.payMethod===m.id?'#EDE9FE':'#F9FAFB', border:`1.5px solid ${svcData.payMethod===m.id?'#6B5BD6':'#E5E7EB'}`, borderRadius:'10px', padding:'10px 4px', fontSize:'10px', fontWeight:'700', color:svcData.payMethod===m.id?'#6B5BD6':'#6B7280', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:'4px' }}>
                      <span style={{ fontSize:'18px' }}>{m.icon}</span>{m.label}
                    </button>
                  ))}
                </div>
                <button onClick={() => { if(svcData.student && svcData.amount && svcData.payMethod){ setUserBalance(b=>b-parseInt(svcData.amount||'0')); setSvcStep('success'); setSvcData(p=>({...p,action:`Pago de ${svcData.typeLabel} por ${parseInt(svcData.amount||'0').toLocaleString()} XAF`})); } }}
                  style={{ width:'100%', background:svcData.student&&svcData.amount&&svcData.payMethod?'linear-gradient(135deg,#4C1D95,#6B5BD6)':'#E5E7EB', border:'none', borderRadius:'12px', padding:'14px', color:svcData.student&&svcData.amount&&svcData.payMethod?'#fff':'#9CA3AF', fontSize:'14px', fontWeight:'700', cursor:svcData.student&&svcData.amount&&svcData.payMethod?'pointer':'default', outline:'none' }}>
                  Pagar {svcData.amount?`${parseInt(svcData.amount).toLocaleString()} XAF`:''}
                </button>
              </div>
            )}

            {/* TRANSPORTE */}
            {showSvcModal === 'transp' && svcStep === 'main' && (
              <div style={{ padding:'0 0 24px' }}>
                <div style={{ background:'linear-gradient(135deg,#065F46,#00c8a0)', padding:'20px 16px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
                    <div style={{ width:'52px', height:'52px', borderRadius:'14px', background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                    </div>
                    <div><div style={{ fontSize:'18px', fontWeight:'800', color:'#fff' }}>Transporte</div><div style={{ fontSize:'11px', color:'rgba(255,255,255,0.75)' }}>Billetes y abonos  -  Guinea Ecuatorial</div></div>
                  </div>
                </div>
                <div style={{ padding:'14px 16px 0' }}>
                  {[
                    {id:'bus',label:'Bus Urbano',sub:'Malabo / Bata - Rutas urbanas',price:'200',color:'#00c8a0',icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>},
                    {id:'taxi',label:'Taxi Compartido',sub:'Rutas fijas interurbanas',price:'500',color:'#F59E0B',icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v5a2 2 0 0 1-2 2h-2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>},
                    {id:'ferry',label:'Ferry Malabo-Bata',sub:'Traves?a mar?tima - 8h',price:'15000',color:'#1485EE',icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76"/><path d="M19 13V7a1 1 0 0 0-1-1H6a1 1 0 0 0-1 1v6"/><path d="M12 10v4"/><path d="M12 3v4"/></svg>},
                    {id:'abono',label:'Abono Mensual',sub:'Transporte ilimitado 30 das',price:'8000',color:'#6B5BD6',icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>},
                  ].map((t) => (
                    <button key={t.id} onClick={() => { setSvcStep('form-transp'); setSvcData({type:t.id,typeLabel:t.label,price:t.price}); }}
                      style={{ width:'100%', background:'#fff', border:'1px solid #F0F2F5', borderRadius:'12px', padding:'13px 14px', cursor:'pointer', outline:'none', display:'flex', alignItems:'center', gap:'12px', marginBottom:'8px', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}
                      onMouseEnter={(e)=>{e.currentTarget.style.background='#F9FAFB';}} onMouseLeave={(e)=>{e.currentTarget.style.background='#fff';}}>
                      <div style={{ width:'44px', height:'44px', borderRadius:'12px', background:t.color+'15', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color:t.color }}>{t.icon}</div>
                      <div style={{ flex:1, textAlign:'left' }}><div style={{ fontSize:'14px', fontWeight:'600', color:'#111827' }}>{t.label}</div><div style={{ fontSize:'11px', color:'#9CA3AF', marginTop:'2px' }}>{t.sub}</div></div>
                      <div style={{ fontSize:'13px', fontWeight:'800', color:t.color }}>{parseInt(t.price).toLocaleString()} XAF</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {showSvcModal === 'transp' && svcStep === 'form-transp' && (
              <div style={{ padding:'14px 16px 24px' }}>
                <div style={{ background:'linear-gradient(135deg,#065F46,#00c8a0)', borderRadius:'12px', padding:'14px', marginBottom:'14px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ fontSize:'14px', fontWeight:'700', color:'#fff' }}>{svcData.typeLabel}</div>
                  <div style={{ fontSize:'18px', fontWeight:'900', color:'#fff' }}>{parseInt(svcData.price||'0').toLocaleString()} XAF</div>
                </div>
                {[{key:'name',placeholder:'Nombre completo',type:'text',icon:'👤'},{key:'qty',placeholder:'Cantidad de billetes',type:'number',icon:'📋'}].map((f) => (
                  <div key={f.key} style={{ background:'#fff', borderRadius:'10px', padding:'0 14px', marginBottom:'8px', display:'flex', alignItems:'center', height:'50px', border:'1px solid #F0F2F5', gap:'10px' }}>
                    <span style={{ fontSize:'16px' }}>{f.icon}</span>
                    <input type={f.type} placeholder={f.placeholder} value={svcData[f.key]||''} onChange={(e) => setSvcData((p:Record<string,string>) => ({...p,[f.key]:e.target.value}))} style={{ flex:1, background:'none', border:'none', outline:'none', fontSize:'13px', color:'#111827', fontFamily:'inherit' }} />
                  </div>
                ))}
                {svcData.qty && parseInt(svcData.qty)>0 && (
                  <div style={{ background:'#F0FDF9', borderRadius:'10px', padding:'12px 14px', marginBottom:'12px', display:'flex', justifyContent:'space-between', alignItems:'center', border:'1px solid #A7F3D0' }}>
                    <span style={{ fontSize:'13px', color:'#065F46', fontWeight:'600' }}>Total ({svcData.qty} billete{parseInt(svcData.qty)>1?'s':''})</span>
                    <span style={{ fontSize:'18px', fontWeight:'900', color:'#00c8a0' }}>{(parseInt(svcData.price||'0')*parseInt(svcData.qty||'1')).toLocaleString()} XAF</span>
                  </div>
                )}
                <div style={{ fontSize:'12px', fontWeight:'600', color:'#9CA3AF', margin:'4px 0 8px' }}>Metodo de pago</div>
                <div style={{ display:'flex', gap:'8px', marginBottom:'14px' }}>
                  {[{id:'wallet',label:'EGCHAT',icon:'💳'},{id:'bank',label:'Banco',icon:'🏦'},{id:'cash',label:'Efectivo',icon:'💵'}].map(m=>(
                    <button key={m.id} onClick={()=>setSvcData((p:Record<string,string>)=>({...p,payMethod:m.id}))} style={{ flex:1, background:svcData.payMethod===m.id?'#F0FDF9':'#F9FAFB', border:`1.5px solid ${svcData.payMethod===m.id?'#00c8a0':'#E5E7EB'}`, borderRadius:'10px', padding:'10px 4px', fontSize:'10px', fontWeight:'700', color:svcData.payMethod===m.id?'#065F46':'#6B7280', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:'4px' }}>
                      <span style={{ fontSize:'18px' }}>{m.icon}</span>{m.label}
                    </button>
                  ))}
                </div>
                <button onClick={() => { if(svcData.name && svcData.qty && svcData.payMethod){ const total=parseInt(svcData.price||'0')*parseInt(svcData.qty||'1'); setUserBalance(b=>b-total); setSvcStep('success'); setSvcData(p=>({...p,action:`${svcData.qty} billete(s) de ${svcData.typeLabel} ? ${total.toLocaleString()} XAF`})); } }}
                  style={{ width:'100%', background:svcData.name&&svcData.qty&&svcData.payMethod?'linear-gradient(135deg,#065F46,#00c8a0)':'#E5E7EB', border:'none', borderRadius:'12px', padding:'14px', color:svcData.name&&svcData.qty&&svcData.payMethod?'#fff':'#9CA3AF', fontSize:'14px', fontWeight:'700', cursor:svcData.name&&svcData.qty&&svcData.payMethod?'pointer':'default', outline:'none' }}>
                  Comprar billete{svcData.qty&&parseInt(svcData.qty)>1?'s':''}
                </button>
              </div>
            )}
            {/* CORREOS */}
            {showSvcModal === 'correos' && svcStep === 'main' && (
              <div style={{ padding:'0 0 24px' }}>
                <div style={{ background:'linear-gradient(135deg,#C62828,#E53935)', padding:'16px', marginBottom:'0', display:'flex', alignItems:'center', gap:'14px' }}>
                  <div style={{ width:'52px', height:'52px', borderRadius:'12px', overflow:'hidden', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <img src={asset('assets/services/correos.svg')} alt="Correos" style={{ width:'48px', height:'48px', objectFit:'contain' }} onError={(e)=>{ (e.target as HTMLImageElement).style.display='none'; }}/>
                  </div>
                  <div><div style={{ fontSize:'16px', fontWeight:'800', color:'#fff' }}>Correos GQ</div><div style={{ fontSize:'11px', color:'rgba(255,255,255,0.75)' }}>Correos de Guinea Ecuatorial</div></div>
                </div>
                <div style={{ padding:'12px 16px 0', fontSize:'11px', color:'#888', fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'8px' }}>Selecciona el tipo de envio</div>
                {[
                  {id:'carta',label:'Carta Nacional',sub:'Entrega en 2-3 dias',price:'500 XAF',color:'#FA9D3B'},
                  {id:'paquete',label:'Paquete Nacional',sub:'Hasta 5kg',price:'2,000 XAF',color:'#07C160'},
                  {id:'express',label:'Envio Express',sub:'Entrega en 24h',price:'5,000 XAF',color:'#FA5151'},
                  {id:'internacional',label:'Envio Internacional',sub:'CEMAC y mundo',price:'15,000 XAF',color:'#1485EE'},
                ].map((c) => (
                  <button key={c.id} onClick={() => { setSvcStep('form-correos'); setSvcData({type:c.id,typeLabel:c.label,price:c.price}); }}
                    style={{ width:'100%', background:'#fff', border:'none', borderRadius:'10px', padding:'12px 14px', cursor:'pointer', outline:'none', display:'flex', alignItems:'center', gap:'12px', marginBottom:'6px' }}
                    onMouseEnter={(e)=>{e.currentTarget.style.background='#f9fafb';}} onMouseLeave={(e)=>{e.currentTarget.style.background='#fff';}}>
                    <div style={{ width:'42px', height:'42px', borderRadius:'12px', background:c.color+'18', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" stroke={c.color} strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    </div>
                    <div style={{ flex:1, textAlign:'left' }}><div style={{ fontSize:'14px', fontWeight:'600', color:'#0d0d0d' }}>{c.label}</div><div style={{ fontSize:'11px', color:'#9ca3af' }}>{c.sub}</div></div>
                    <div style={{ fontSize:'12px', fontWeight:'700', color:c.color }}>{c.price}</div>
                  </button>
                ))}
              </div>
            )}
            {showSvcModal === 'correos' && svcStep === 'form-correos' && (
              <div style={{ padding:'14px 16px 24px' }}>
                <div style={{ background:'linear-gradient(135deg,#C62828,#E53935)', borderRadius:'12px', padding:'14px', marginBottom:'14px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ fontSize:'14px', fontWeight:'700', color:'#fff' }}>{svcData.typeLabel}</div>
                  <div style={{ fontSize:'16px', fontWeight:'900', color:'#fff' }}>{svcData.price}</div>
                </div>
                {[{key:'sender',placeholder:'Remitente (nombre)',type:'text',icon:'👤'},{key:'dest',placeholder:'Destinatario (nombre)',type:'text',icon:'👤'},{key:'address',placeholder:'dirección de entrega completa',type:'text',icon:'📋'},{key:'phone',placeholder:'Teléfono de contacto',type:'tel',icon:'📋'}].map((f) => (
                  <div key={f.key} style={{ background:'#fff', borderRadius:'10px', padding:'0 14px', marginBottom:'8px', display:'flex', alignItems:'center', height:'50px', border:'1px solid #F0F2F5', gap:'10px' }}>
                    <span style={{ fontSize:'16px' }}>{f.icon}</span>
                    <input type={f.type} placeholder={f.placeholder} value={svcData[f.key]||''} onChange={(e) => setSvcData((p:Record<string,string>) => ({...p,[f.key]:e.target.value}))} style={{ flex:1, background:'none', border:'none', outline:'none', fontSize:'13px', color:'#111827', fontFamily:'inherit' }} />
                  </div>
                ))}
                <div style={{ fontSize:'12px', fontWeight:'600', color:'#9CA3AF', margin:'12px 0 8px' }}>Metodo de pago</div>
                <div style={{ display:'flex', gap:'8px', marginBottom:'14px' }}>
                  {[{id:'wallet',label:'EGCHAT',icon:'💳'},{id:'bank',label:'Banco',icon:'🏦'},{id:'cash',label:'Efectivo',icon:'💵'}].map(m=>(
                    <button key={m.id} onClick={()=>setSvcData((p:Record<string,string>)=>({...p,payMethod:m.id}))} style={{ flex:1, background:svcData.payMethod===m.id?'#FEF2F2':'#F9FAFB', border:`1.5px solid ${svcData.payMethod===m.id?'#C62828':'#E5E7EB'}`, borderRadius:'10px', padding:'10px 4px', fontSize:'10px', fontWeight:'700', color:svcData.payMethod===m.id?'#C62828':'#6B7280', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:'4px' }}>
                      <span style={{ fontSize:'18px' }}>{m.icon}</span>{m.label}
                    </button>
                  ))}
                </div>
                <button onClick={() => { if(svcData.sender && svcData.dest && svcData.payMethod){ const priceNum=parseInt((svcData.price||'0').replace(/[^0-9]/g,'')); setUserBalance(b=>b-priceNum); setSvcStep('success'); setSvcData(p=>({...p,action:`Envio ${svcData.typeLabel} de ${svcData.sender} a ${svcData.dest}`})); } }}
                  style={{ width:'100%', background:svcData.sender&&svcData.dest&&svcData.payMethod?'linear-gradient(135deg,#C62828,#E53935)':'#E5E7EB', border:'none', borderRadius:'12px', padding:'14px', color:svcData.sender&&svcData.dest&&svcData.payMethod?'#fff':'#9CA3AF', fontSize:'14px', fontWeight:'700', cursor:svcData.sender&&svcData.dest&&svcData.payMethod?'pointer':'default', outline:'none' }}>
                  Confirmar envio ? {svcData.price}
                </button>
              </div>
            )}
            {/* IMPUESTOS */}
            {showSvcModal === 'impuestos' && svcStep === 'main' && (
              <div style={{ padding:'0 0 24px' }}>
                <div style={{ background:'linear-gradient(135deg,#1B3A6B,#2A5298)', padding:'16px', marginBottom:'0', display:'flex', alignItems:'center', gap:'14px' }}>
                  <div style={{ width:'52px', height:'52px', borderRadius:'12px', overflow:'hidden', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <img src={asset('assets/services/dgi.svg')} alt="DGI" style={{ width:'48px', height:'48px', objectFit:'contain' }} onError={(e)=>{ (e.target as HTMLImageElement).style.display='none'; }}/>
                  </div>
                  <div><div style={{ fontSize:'16px', fontWeight:'800', color:'#fff' }}>DGI</div><div style={{ fontSize:'11px', color:'rgba(255,255,255,0.75)' }}>dirección General de Impuestos</div></div>
                </div>
                <div style={{ padding:'12px 16px 0', fontSize:'11px', color:'#888', fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'8px' }}>Tipo de declaraci?n / pago</div>
                {[
                  {id:'irpf',label:'IRPF / Renta',sub:'Declaracion anual',color:'#FA5151'},
                  {id:'iva',label:'IVA',sub:'Impuesto sobre el valor',color:'#576B95'},
                  {id:'municipal',label:'Tasa Municipal',sub:'Ayuntamiento',color:'#FA9D3B'},
                  {id:'vehiculo',label:'Impuesto Vehiculo',sub:'Circulacion anual',color:'#1485EE'},
                ].map((imp) => (
                  <button key={imp.id} onClick={() => { setSvcStep('form-imp'); setSvcData({type:imp.id,typeLabel:imp.label}); }}
                    style={{ width:'100%', background:'#fff', border:'none', borderRadius:'10px', padding:'12px 14px', cursor:'pointer', outline:'none', display:'flex', alignItems:'center', gap:'12px', marginBottom:'6px' }}
                    onMouseEnter={(e)=>{e.currentTarget.style.background='#f9fafb';}} onMouseLeave={(e)=>{e.currentTarget.style.background='#fff';}}>
                    <div style={{ width:'42px', height:'42px', borderRadius:'12px', background:imp.color+'18', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" stroke={imp.color} strokeWidth="2" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                    </div>
                    <div style={{ flex:1, textAlign:'left' }}><div style={{ fontSize:'14px', fontWeight:'600', color:'#0d0d0d' }}>{imp.label}</div><div style={{ fontSize:'11px', color:'#9ca3af' }}>{imp.sub}</div></div>
                    <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                ))}
              </div>
            )}
            {showSvcModal === 'impuestos' && svcStep === 'form-imp' && (
              <div style={{ padding:'14px 16px 24px' }}>
                <div style={{ background:'linear-gradient(135deg,#1B3A6B,#2A5298)', borderRadius:'12px', padding:'14px', marginBottom:'14px' }}>
                  <div style={{ fontSize:'14px', fontWeight:'700', color:'#fff' }}>{svcData.typeLabel}</div>
                  <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.7)', marginTop:'3px' }}>Dirección General de Impuestos  -  GQ</div>
                </div>
                {[{key:'nif',placeholder:'NIF / DNI del contribuyente',type:'text',icon:'👤'},{key:'ref',placeholder:'Referencia de pago / expediente',type:'text',icon:'📋'},{key:'period',placeholder:'Per?odo fiscal (ej: 2025)',type:'text',icon:'📋'},{key:'amount',placeholder:'Importe a pagar (XAF)',type:'number',icon:'📋'}].map((f) => (
                  <div key={f.key} style={{ background:'#fff', borderRadius:'10px', padding:'0 14px', marginBottom:'8px', display:'flex', alignItems:'center', height:'50px', border:'1px solid #F0F2F5', gap:'10px' }}>
                    <span style={{ fontSize:'16px' }}>{f.icon}</span>
                    <input type={f.type} placeholder={f.placeholder} value={svcData[f.key]||''} onChange={(e) => setSvcData((p:Record<string,string>) => ({...p,[f.key]:e.target.value}))} style={{ flex:1, background:'none', border:'none', outline:'none', fontSize:'13px', color:'#111827', fontFamily:'inherit' }} />
                  </div>
                ))}
                <div style={{ background:'#FEF3C7', borderRadius:'10px', padding:'10px 14px', marginBottom:'12px', fontSize:'12px', color:'#92400E', display:'flex', gap:'8px', alignItems:'flex-start' }}>
                  <span>ℹ️</span><span>El pago de impuestos genera un justificante oficial. Guarda el nmero de referencia.</span>
                </div>
                <div style={{ fontSize:'12px', fontWeight:'600', color:'#9CA3AF', margin:'4px 0 8px' }}>Metodo de pago</div>
                <div style={{ display:'flex', gap:'8px', marginBottom:'14px' }}>
                  {[{id:'wallet',label:'EGCHAT',icon:'💳'},{id:'bank',label:'Banco',icon:'🏦'},{id:'cash',label:'Efectivo',icon:'💵'}].map(m=>(
                    <button key={m.id} onClick={()=>setSvcData((p:Record<string,string>)=>({...p,payMethod:m.id}))} style={{ flex:1, background:svcData.payMethod===m.id?'#EFF5FD':'#F9FAFB', border:`1.5px solid ${svcData.payMethod===m.id?'#1B3A6B':'#E5E7EB'}`, borderRadius:'10px', padding:'10px 4px', fontSize:'10px', fontWeight:'700', color:svcData.payMethod===m.id?'#1B3A6B':'#6B7280', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:'4px' }}>
                      <span style={{ fontSize:'18px' }}>{m.icon}</span>{m.label}
                    </button>
                  ))}
                </div>
                <button onClick={() => { if(svcData.nif && svcData.amount && svcData.payMethod){ setUserBalance(b=>b-parseInt(svcData.amount||'0')); setSvcStep('success'); setSvcData(p=>({...p,action:`Pago ${svcData.typeLabel} ? NIF: ${svcData.nif} ? ${parseInt(svcData.amount||'0').toLocaleString()} XAF`})); } }}
                  style={{ width:'100%', background:svcData.nif&&svcData.amount&&svcData.payMethod?'linear-gradient(135deg,#1B3A6B,#2A5298)':'#E5E7EB', border:'none', borderRadius:'12px', padding:'14px', color:svcData.nif&&svcData.amount&&svcData.payMethod?'#fff':'#9CA3AF', fontSize:'14px', fontWeight:'700', cursor:svcData.nif&&svcData.amount&&svcData.payMethod?'pointer':'default', outline:'none' }}>
                  Pagar {svcData.amount?`${parseInt(svcData.amount).toLocaleString()} XAF`:''}
                </button>
              </div>
            )}

            {/* SERVICIOS DIARIOS - formulario generico para: super, comida, tienda, lavanderia, belleza */}
            {(['super','comida','tienda','lavanderia','belleza'] as string[]).includes(showSvcModal!) && svcStep === 'main' && (
              <div style={{ padding:'0 0 24px' }}>
                {/* Header din?mico por servicio */}
                {(() => {
                  const cfg: Record<string,{title:string;sub:string;grad:string;items:{id:string;label:string;sub:string;price:string;color:string}[]}> = {
                    super: { title:'Supermercados', sub:'Compra online - Entrega a domicilio', grad:'linear-gradient(135deg,#065F46,#00c8a0)',
                      items:[{id:'a',label:'Supermercado Central',sub:'Malabo Centro - Entrega 1h',price:'Gratis >5,000',color:'#00c8a0'},{id:'b',label:'Hiper Bata',sub:'Bata - Entrega 2h',price:'Gratis >8,000',color:'#00c8a0'},{id:'c',label:'Tienda Familiar',sub:'Barrio - Entrega 30min',price:'500 XAF',color:'#F59E0B'},{id:'d',label:'Mercado Central',sub:'Malabo - Productos frescos',price:'Gratis >3,000',color:'#00c8a0'}]},
                    comida: { title:'Comida a Domicilio', sub:'Restaurantes y cocinas - Entrega rapida', grad:'linear-gradient(135deg,#C0392B,#E74C3C)',
                      items:[{id:'a',label:'Comida Rapida',sub:'Hamburguesas, pollo - 30 min',price:'500 XAF',color:'#E74C3C'},{id:'b',label:'Cocina Africana',sub:'Platos tipicos GQ - 45 min',price:'300 XAF',color:'#F59E0B'},{id:'c',label:'Comida Internacional',sub:'Italiana, china, arabe - 60 min',price:'800 XAF',color:'#1485EE'},{id:'d',label:'Comida Casera',sub:'Menu del dia - 40 min',price:'200 XAF',color:'#00c8a0'}]},
                    restaurante: { title:'Restaurantes', sub:'Reservas y pedidos para llevar', grad:'linear-gradient(135deg,#92400E,#F59E0B)',
                      items:[{id:'a',label:'Reserva de Mesa',sub:'Para hoy o manana',price:'Gratis',color:'#F59E0B'},{id:'b',label:'Pedido para Llevar',sub:'Listo en 20 min',price:'Sin cargo',color:'#00c8a0'},{id:'c',label:'Menu Empresarial',sub:'Grupos +10 personas',price:'Consultar',color:'#1485EE'}]},
                    tienda: { title:'Tiendas Online', sub:'Ropa, electronica, hogar - Envio a domicilio', grad:'linear-gradient(135deg,#1B3A6B,#1485EE)',
                      items:[{id:'a',label:'Ropa y Moda',sub:'Envío a domicilio - 48h',price:'1,000 XAF',color:'#6B5BD6'},{id:'b',label:'Electrónica',sub:'Garantía incluida - 72h',price:'1,500 XAF',color:'#1485EE'},{id:'c',label:'Hogar y Decoración',sub:'Entrega en 48h',price:'1,000 XAF',color:'#F59E0B'},{id:'d',label:'Deportes',sub:'Equipamiento deportivo',price:'800 XAF',color:'#00c8a0'}]},
                    lavanderia: { title:'Lavandería', sub:'Recogida y entrega a domicilio', grad:'linear-gradient(135deg,#0A4A8A,#00b4e6)',
                      items:[{id:'a',label:'Lavado Normal',sub:'Listo en 24h  -  Recogida gratis',price:'3,000 XAF/kg',color:'#00b4e6'},{id:'b',label:'Lavado Express',sub:'Listo en 4h - Urgente',price:'5,000 XAF/kg',color:'#E74C3C'},{id:'c',label:'Tintorería',sub:'Prendas delicadas - 48h',price:'6,000 XAF/kg',color:'#6B5BD6'},{id:'d',label:'Planchado',sub:'Servicio de planchado',price:'1,500 XAF/prenda',color:'#F59E0B'}]},
                    belleza: { title:'Belleza y Bienestar', sub:'Peluquerías, estética y spa', grad:'linear-gradient(135deg,#831843,#EC4899)',
                      items:[{id:'a',label:'Peluquería',sub:'Corte, peinado, color',price:'5,000 XAF',color:'#EC4899'},{id:'b',label:'Estética',sub:'Manicura, pedicura, depilación',price:'8,000 XAF',color:'#F59E0B'},{id:'c',label:'Spa & Masajes',sub:'Relajación y bienestar',price:'15,000 XAF',color:'#6B5BD6'},{id:'d',label:'Barbería',sub:'Corte y arreglo de barba',price:'3,000 XAF',color:'#00b4e6'}]},
                  };
                  const c = cfg[showSvcModal!] || cfg.super;
                  return (
                    <>
                      <div style={{ background:c.grad, padding:'20px 16px', marginBottom:'0' }}>
                        <div style={{ fontSize:'18px', fontWeight:'800', color:'#fff', marginBottom:'4px' }}>{c.title}</div>
                        <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.75)' }}>{c.sub}</div>
                      </div>
                      <div style={{ padding:'14px 16px 0' }}>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
                          {c.items.map((item) => (
                            <button key={item.id} onClick={() => { setSvcStep('form-daily'); setSvcData({type:item.id,typeLabel:item.label,price:item.price,color:item.color}); }}
                              style={{ background:'#fff', border:'1px solid #F0F2F5', borderRadius:'12px', padding:'13px 12px', cursor:'pointer', outline:'none', textAlign:'left', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}
                              onMouseEnter={(e)=>{e.currentTarget.style.background='#F9FAFB';}} onMouseLeave={(e)=>{e.currentTarget.style.background='#fff';}}>
                              <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:item.color+'18', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'8px' }}>
                                <div style={{ width:'12px', height:'12px', borderRadius:'50%', background:item.color }}/>
                              </div>
                              <div style={{ fontSize:'12px', fontWeight:'700', color:'#111827', marginBottom:'3px', lineHeight:'1.3' }}>{item.label}</div>
                              <div style={{ fontSize:'10px', color:'#9CA3AF', marginBottom:'5px', lineHeight:'1.3' }}>{item.sub}</div>
                              <div style={{ fontSize:'11px', fontWeight:'700', color:item.color }}>{item.price}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
            {(['super','comida','tienda','lavanderia','belleza'] as string[]).includes(showSvcModal!) && svcStep === 'form-daily' && (
              <div style={{ padding:'14px 16px 24px' }}>
                <div style={{ background:'#fff', borderRadius:'12px', padding:'13px 14px', marginBottom:'14px', border:'1px solid #F0F2F5', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ fontSize:'14px', fontWeight:'700', color:'#111827' }}>{svcData.typeLabel}</div>
                  <div style={{ fontSize:'12px', fontWeight:'700', color:svcData.color||'#00c8a0' }}>{svcData.price}</div>
                </div>
                {[{key:'name',placeholder:'Tu nombre completo',type:'text',icon:'👤'},{key:'address',placeholder:'dirección de entrega',type:'text',icon:'📋'},{key:'phone',placeholder:'Teléfono de contacto',type:'tel',icon:'📋'},{key:'notes',placeholder:'Notas del pedido (opcional)',type:'text',icon:'📋'}].map((f) => (
                  <div key={f.key} style={{ background:'#fff', borderRadius:'10px', padding:'0 14px', marginBottom:'8px', display:'flex', alignItems:'center', height:'50px', border:'1px solid #F0F2F5', gap:'10px' }}>
                    <span style={{ fontSize:'16px' }}>{f.icon}</span>
                    <input type={f.type} placeholder={f.placeholder} value={svcData[f.key]||''} onChange={(e) => setSvcData((p:Record<string,string>) => ({...p,[f.key]:e.target.value}))} style={{ flex:1, background:'none', border:'none', outline:'none', fontSize:'13px', color:'#111827', fontFamily:'inherit' }} />
                  </div>
                ))}
                <div style={{ fontSize:'12px', fontWeight:'600', color:'#9CA3AF', margin:'12px 0 8px' }}>Metodo de pago</div>
                <div style={{ display:'flex', gap:'8px', marginBottom:'14px' }}>
                  {[{id:'wallet',label:'EGCHAT',icon:'💳'},{id:'bank',label:'Banco',icon:'🏦'},{id:'cash',label:'Efectivo',icon:'💵'}].map(m=>(
                    <button key={m.id} onClick={()=>setSvcData((p:Record<string,string>)=>({...p,payMethod:m.id}))} style={{ flex:1, background:svcData.payMethod===m.id?'#F0FDF9':'#F9FAFB', border:`1.5px solid ${svcData.payMethod===m.id?'#00c8a0':'#E5E7EB'}`, borderRadius:'10px', padding:'10px 4px', fontSize:'10px', fontWeight:'700', color:svcData.payMethod===m.id?'#065F46':'#6B7280', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:'4px' }}>
                      <span style={{ fontSize:'18px' }}>{m.icon}</span>{m.label}
                    </button>
                  ))}
                </div>
                <button onClick={() => { if(svcData.name && svcData.address && svcData.payMethod){ setSvcStep('success'); setSvcData(p=>({...p,action:`Pedido de ${svcData.typeLabel} ? Entrega a ${svcData.address}`})); } }}
                  style={{ width:'100%', background:svcData.name&&svcData.address&&svcData.payMethod?'linear-gradient(135deg,#065F46,#00c8a0)':'#E5E7EB', border:'none', borderRadius:'12px', padding:'14px', color:svcData.name&&svcData.address&&svcData.payMethod?'#fff':'#9CA3AF', fontSize:'14px', fontWeight:'700', cursor:svcData.name&&svcData.address&&svcData.payMethod?'pointer':'default', outline:'none' }}>
                  Confirmar pedido
                </button>
              </div>
            )}

            {/* RESTAURANTES */}
            {showSvcModal === 'restaurante' && svcStep === 'main' && (
              <RestaurantesModule />
            )}
            {/* TAXI */}
            {showSvcModal === 'taxi' && svcStep === 'main' && (
              <div style={{ padding:'0 0 24px' }}>
                <div style={{ background:'linear-gradient(135deg,#92400E,#F59E0B)', padding:'20px 16px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
                    <div style={{ width:'52px', height:'52px', borderRadius:'14px', background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v5a2 2 0 0 1-2 2h-2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>
                    </div>
                    <div><div style={{ fontSize:'18px', fontWeight:'800', color:'#fff' }}>Pedir Taxi</div><div style={{ fontSize:'11px', color:'rgba(255,255,255,0.75)' }}>Malabo ? Bata ? Disponible 24h</div></div>
                  </div>
                </div>
                <div style={{ padding:'14px 16px 0' }}>
                  {[{key:'origin',placeholder:'Punto de recogida',type:'text',icon:'👤'},{key:'dest',placeholder:'Destino',type:'text',icon:'📋'},{key:'phone',placeholder:'Tu teléfono',type:'tel',icon:'📋'}].map((f) => (
                    <div key={f.key} style={{ background:'#fff', borderRadius:'10px', padding:'0 14px', marginBottom:'8px', display:'flex', alignItems:'center', height:'50px', border:'1px solid #F0F2F5', gap:'10px' }}>
                      <span style={{ fontSize:'16px' }}>{f.icon}</span>
                      <input type={f.type} placeholder={f.placeholder} value={svcData[f.key]||''} onChange={(e) => setSvcData((p:Record<string,string>) => ({...p,[f.key]:e.target.value}))} style={{ flex:1, background:'none', border:'none', outline:'none', fontSize:'13px', color:'#111827', fontFamily:'inherit' }} />
                    </div>
                  ))}
                  {svcData.origin && svcData.dest && (
                    <div style={{ background:'#FFFBEB', borderRadius:'12px', padding:'14px', marginBottom:'12px', border:'1px solid #FDE68A' }}>
                      <div style={{ fontSize:'11px', color:'#92400E', marginBottom:'6px', fontWeight:'600' }}>Precio estimado</div>
                      <div style={{ display:'flex', gap:'8px' }}>
                        {[{label:'Economico',price:'1,500 XAF'},{label:'Estndar',price:'2,500 XAF'},{label:'Premium',price:'4,000 XAF'}].map(t=>(
                          <button key={t.label} onClick={()=>setSvcData(p=>({...p,taxiType:t.label,taxiPrice:t.price}))} style={{ flex:1, background:svcData.taxiType===t.label?'#F59E0B':'#fff', border:`1.5px solid ${svcData.taxiType===t.label?'#F59E0B':'#E5E7EB'}`, borderRadius:'8px', padding:'8px 4px', fontSize:'10px', fontWeight:'700', color:svcData.taxiType===t.label?'#fff':'#6B7280', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:'2px' }}>
                            <span style={{ fontSize:'13px', fontWeight:'800' }}>{t.price}</span>{t.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <button onClick={() => { if(svcData.origin && svcData.dest && svcData.phone && svcData.taxiType){ setSvcStep('success'); setSvcData(p=>({...p,action:`Taxi ${svcData.taxiType} ? ${svcData.origin} ? ${svcData.dest} ? ${svcData.taxiPrice}`})); } }}
                    style={{ width:'100%', background:svcData.origin&&svcData.dest&&svcData.phone&&svcData.taxiType?'linear-gradient(135deg,#92400E,#F59E0B)':'#E5E7EB', border:'none', borderRadius:'12px', padding:'14px', color:svcData.origin&&svcData.dest&&svcData.phone&&svcData.taxiType?'#fff':'#9CA3AF', fontSize:'14px', fontWeight:'700', cursor:svcData.origin&&svcData.dest&&svcData.phone&&svcData.taxiType?'pointer':'default', outline:'none' }}>
                    Pedir Taxi {svcData.taxiPrice?`? ${svcData.taxiPrice}`:''}
                  </button>
                </div>
              </div>
            )}
            {/* FARMACIA */}
            {showSvcModal === 'farmacia' && svcStep === 'main' && (
              <div style={{ padding:'12px 16px 24px' }}>
                <div style={{ fontSize:'11px', color:'#888', fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'8px' }}>Farmacia online</div>
                {[{key:'med',placeholder:'Nombre del medicamento',type:'text'},{key:'qty',placeholder:'Cantidad',type:'number'},{key:'address',placeholder:'Direccion de entrega',type:'text'},{key:'phone',placeholder:'Telefono de contacto',type:'tel'}].map((f) => (
                  <div key={f.key} style={{ background:'#fff', borderRadius:'10px', padding:'0 14px', marginBottom:'8px', display:'flex', alignItems:'center', height:'48px' }}>
                    <input type={f.type} placeholder={f.placeholder} value={svcData[f.key]||''} onChange={(e) => setSvcData((p:Record<string,string>) => ({...p,[f.key]:e.target.value}))} style={{ flex:1, background:'none', border:'none', outline:'none', fontSize:'14px', color:'#0d0d0d', fontFamily:'inherit' }} />
                  </div>
                ))}
                <div style={{ background:'#fffbeb', borderRadius:'8px', padding:'10px 12px', marginBottom:'12px', fontSize:'12px', color:'#92400e' }}>
                  Algunos medicamentos requieren receta medica
                </div>
                <button onClick={() => { if(svcData.med && svcData.address) setSvcStep('success'); }} style={{ width:'100%', background:svcData.med&&svcData.address?'#07C160':'#e5e7eb', border:'none', borderRadius:'10px', padding:'13px', color:svcData.med&&svcData.address?'#fff':'#9ca3af', fontSize:'14px', fontWeight:'700', cursor:svcData.med&&svcData.address?'pointer':'default', outline:'none' }}>Pedir a Domicilio</button>
              </div>
            )}
            {/* HOTEL */}
            {showSvcModal === 'hotel' && svcStep === 'main' && (
              <div style={{ padding:'0 0 24px' }}>
                <div style={{ background:'linear-gradient(135deg,#0A4A8A,#00b4e6)', padding:'20px 16px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
                    <div style={{ width:'52px', height:'52px', borderRadius:'14px', background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                    </div>
                    <div><div style={{ fontSize:'18px', fontWeight:'800', color:'#fff' }}>Hoteles</div><div style={{ fontSize:'11px', color:'rgba(255,255,255,0.75)' }}>Reservas en Guinea Ecuatorial</div></div>
                  </div>
                </div>
                <div style={{ padding:'14px 16px 0' }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'14px' }}>
                    {[
                      {id:'h1',label:'Hotel Baha',sub:'Malabo - 4*',price:'45,000 XAF/noche',color:'#00b4e6'},
                      {id:'h2',label:'Hotel Impala',sub:'Malabo - 3*',price:'28,000 XAF/noche',color:'#1485EE'},
                      {id:'h3',label:'Hotel Bata',sub:'Bata - 3*',price:'25,000 XAF/noche',color:'#00c8a0'},
                      {id:'h4',label:'Aparthotel GQ',sub:'Malabo - Apartamentos',price:'35,000 XAF/noche',color:'#6B5BD6'},
                    ].map(h=>(
                      <button key={h.id} onClick={()=>setSvcData(p=>({...p,hotelId:h.id,hotelLabel:h.label,hotelPrice:h.price}))} style={{ background:svcData.hotelId===h.id?h.color+'15':'#fff', border:`1.5px solid ${svcData.hotelId===h.id?h.color:'#F0F2F5'}`, borderRadius:'12px', padding:'12px', cursor:'pointer', outline:'none', textAlign:'left', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
                        <div style={{ fontSize:'12px', fontWeight:'700', color:'#111827', marginBottom:'3px' }}>{h.label}</div>
                        <div style={{ fontSize:'10px', color:'#9CA3AF', marginBottom:'5px' }}>{h.sub}</div>
                        <div style={{ fontSize:'11px', fontWeight:'700', color:h.color }}>{h.price}</div>
                      </button>
                    ))}
                  </div>
                  {[{key:'checkin',placeholder:'Fecha entrada (DD/MM/AAAA)',type:'text',icon:'📋'},{key:'checkout',placeholder:'Fecha salida (DD/MM/AAAA)',type:'text',icon:'📋'},{key:'guests',placeholder:'Nmero de hu?spedes',type:'number',icon:'📋'},{key:'name',placeholder:'Nombre del titular',type:'text',icon:'📋'}].map((f) => (
                    <div key={f.key} style={{ background:'#fff', borderRadius:'10px', padding:'0 14px', marginBottom:'8px', display:'flex', alignItems:'center', height:'50px', border:'1px solid #F0F2F5', gap:'10px' }}>
                      <span style={{ fontSize:'16px' }}>{f.icon}</span>
                      <input type={f.type} placeholder={f.placeholder} value={svcData[f.key]||''} onChange={(e) => setSvcData((p:Record<string,string>) => ({...p,[f.key]:e.target.value}))} style={{ flex:1, background:'none', border:'none', outline:'none', fontSize:'13px', color:'#111827', fontFamily:'inherit' }} />
                    </div>
                  ))}
                  <div style={{ fontSize:'12px', fontWeight:'600', color:'#9CA3AF', margin:'12px 0 8px' }}>Metodo de pago</div>
                  <div style={{ display:'flex', gap:'8px', marginBottom:'14px' }}>
                    {[{id:'wallet',label:'EGCHAT',icon:'💳'},{id:'bank',label:'Banco',icon:'🏦'},{id:'cash',label:'Efectivo',icon:'💵'}].map(m=>(
                      <button key={m.id} onClick={()=>setSvcData((p:Record<string,string>)=>({...p,payMethod:m.id}))} style={{ flex:1, background:svcData.payMethod===m.id?'#EFF5FD':'#F9FAFB', border:`1.5px solid ${svcData.payMethod===m.id?'#00b4e6':'#E5E7EB'}`, borderRadius:'10px', padding:'10px 4px', fontSize:'10px', fontWeight:'700', color:svcData.payMethod===m.id?'#0A4A8A':'#6B7280', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:'4px' }}>
                        <span style={{ fontSize:'18px' }}>{m.icon}</span>{m.label}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => { if(svcData.hotelId && svcData.checkin && svcData.checkout && svcData.name && svcData.payMethod){ setSvcStep('success'); setSvcData(p=>({...p,action:`Reserva ${svcData.hotelLabel} ? ${svcData.checkin} ? ${svcData.checkout} ? ${svcData.guests||1} hu?sped(es)`})); } }}
                    style={{ width:'100%', background:svcData.hotelId&&svcData.checkin&&svcData.checkout&&svcData.name&&svcData.payMethod?'linear-gradient(135deg,#0A4A8A,#00b4e6)':'#E5E7EB', border:'none', borderRadius:'12px', padding:'14px', color:svcData.hotelId&&svcData.checkin&&svcData.checkout&&svcData.name&&svcData.payMethod?'#fff':'#9CA3AF', fontSize:'14px', fontWeight:'700', cursor:svcData.hotelId&&svcData.checkin&&svcData.checkout&&svcData.name&&svcData.payMethod?'pointer':'default', outline:'none' }}>
                    Reservar {svcData.hotelLabel||'hotel'}
                  </button>
                </div>
              </div>
            )}
            {/* VUELOS */}
            {showSvcModal === 'vuelos' && svcStep === 'main' && (
              <VuelosModule />
            )}
            {/* GASOLINERA */}
            {showSvcModal === 'gasolinera' && svcStep === 'main' && (
              <GasolinerasModule onDebit={(n) => setUserBalance((b:number) => b - n)} />
            )}
            {/* NOTICIAS */}
            {showSvcModal === 'noticias' && svcStep === 'main' && (
              <div style={{ padding:'12px 16px 24px' }}>
                <div style={{ fontSize:'11px', color:'#888', fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'8px' }}>Noticias de Guinea Ecuatorial</div>
                {[
                  {cat:'Nacional',title:'Presidente anuncia nuevas inversiones en infraestructura',time:'Hace 2h',color:'#07C160'},
                  {cat:'Economia',title:'El XAF se mantiene estable frente al euro en mercados CEMAC',time:'Hace 4h',color:'#1485EE'},
                  {cat:'Salud',title:'Ministerio de Salud lanza campana de vacunacion nacional',time:'Hace 6h',color:'#FA5151'},
                  {cat:'Tecnologia',title:'Guinea Ecuatorial avanza en cobertura 4G en zonas rurales',time:'Hace 8h',color:'#576B95'},
                  {cat:'Deportes',title:'Seleccion nacional se prepara para eliminatorias africanas',time:'Hace 12h',color:'#FA9D3B'},
                ].map((n, i) => (
                  <div key={i} style={{ background:'#fff', borderRadius:'10px', padding:'12px 14px', marginBottom:'6px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'6px' }}>
                      <span style={{ background:n.color+'18', color:n.color, fontSize:'10px', fontWeight:'700', padding:'2px 8px', borderRadius:'20px' }}>{n.cat}</span>
                      <span style={{ fontSize:'10px', color:'#9ca3af', marginLeft:'auto' }}>{n.time}</span>
                    </div>
                    <div style={{ fontSize:'13px', fontWeight:'600', color:'#0d0d0d', lineHeight:'1.4' }}>{n.title}</div>
                  </div>
                ))}
                <button onClick={() => setShowSvcModal(null)} style={{ width:'100%', background:'#07C160', border:'none', borderRadius:'10px', padding:'13px', color:'#fff', fontSize:'14px', fontWeight:'700', cursor:'pointer', outline:'none', marginTop:'8px' }}>Cerrar</button>
              </div>
            )}

            {/* HERRAMIENTAS */}
            {/* ID DIGITAL */}
            {showSvcModal === 'id' && svcStep === 'main' && (
              <div style={{ padding:'12px 16px 24px' }}>
                <div style={{ background:'linear-gradient(135deg,#576B95,#1485EE)', borderRadius:'16px', padding:'20px', marginBottom:'16px', color:'#fff' }}>
                  <div style={{ fontSize:'10px', opacity:0.8, marginBottom:'12px', letterSpacing:'1px' }}>REPUBLICA DE GUINEA ECUATORIAL</div>
                  <div style={{ display:'flex', alignItems:'center', gap:'14px', marginBottom:'14px' }}>
                    <div style={{ width:'52px', height:'52px', borderRadius:'50%', background:'rgba(255,255,255,0.25)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'24px' }}>🔔</div>
                    <div>
                      <div style={{ fontSize:'16px', fontWeight:'800' }}>USUARIO EGCHAT</div>
                      <div style={{ fontSize:'11px', opacity:0.8 }}>DNI: GQ-2024-XXXXX</div>
                    </div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', fontSize:'11px' }}>
                    <div><div style={{ opacity:0.7 }}>Fecha nacimiento</div><div style={{ fontWeight:'700' }}>01/01/1990</div></div>
                    <div><div style={{ opacity:0.7 }}>Nacionalidad</div><div style={{ fontWeight:'700' }}>Ecuatoguineana</div></div>
                    <div><div style={{ opacity:0.7 }}>Expedicion</div><div style={{ fontWeight:'700' }}>15/03/2022</div></div>
                    <div><div style={{ opacity:0.7 }}>Caducidad</div><div style={{ fontWeight:'700' }}>15/03/2032</div></div>
                  </div>
                </div>
                {[
                  {id:'qr',label:'Mostrar QR de verificacion',sub:'Para identificacion rapida',color:'#576B95'},
                  {id:'renew',label:'Renovar DNI',sub:'Solicitud online',color:'#1485EE'},
                  {id:'cert',label:'Certificado de residencia',sub:'Documento oficial',color:'#07C160'},
                ].map((item) => (
                  <button key={item.id} onClick={() => { setSvcStep('success'); setSvcData({action:item.label}); }}
                    style={{ width:'100%', background:'#fff', border:'none', borderRadius:'10px', padding:'12px 14px', cursor:'pointer', outline:'none', display:'flex', alignItems:'center', gap:'12px', marginBottom:'6px' }}
                    onMouseEnter={(e)=>{e.currentTarget.style.background='#f9fafb';}} onMouseLeave={(e)=>{e.currentTarget.style.background='#fff';}}>
                    <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:item.color+'18', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:item.color }} />
                    </div>
                    <div style={{ flex:1, textAlign:'left' }}><div style={{ fontSize:'14px', fontWeight:'600', color:'#0d0d0d' }}>{item.label}</div><div style={{ fontSize:'11px', color:'#9ca3af' }}>{item.sub}</div></div>
                    <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                ))}
              </div>
            )}
            {/* EMERGENCIA */}
            {showSvcModal === 'emergencia' && svcStep === 'main' && (
              <div style={{ padding:'12px 16px 24px' }}>
                <div style={{ background:'#fef2f2', borderRadius:'12px', padding:'14px', marginBottom:'16px', display:'flex', alignItems:'center', gap:'12px' }}>
                  <div style={{ width:'44px', height:'44px', borderRadius:'50%', background:'#FA5151', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                  </div>
                  <div><div style={{ fontSize:'14px', fontWeight:'700', color:'#FA5151' }}>Servicios de Emergencia</div><div style={{ fontSize:'12px', color:'#9ca3af' }}>Disponibles 24/7</div></div>
                </div>
                {[
                  {id:'112',label:'Emergencias 112',sub:'Policia, Bomberos, Ambulancia',color:'#FA5151',num:'112'},
                  {id:'policia',label:'Policia Nacional',sub:'Seguridad ciudadana',color:'#1485EE',num:'113'},
                  {id:'bomberos',label:'Bomberos',sub:'Incendios y rescates',color:'#FA9D3B',num:'118'},
                  {id:'ambulancia',label:'Ambulancia',sub:'Urgencias medicas',color:'#07C160',num:'114'},
                  {id:'cruz',label:'Cruz Roja',sub:'Ayuda humanitaria',color:'#FA5151',num:'115'},
                ].map((em) => (
                  <a key={em.id} href={`tel:${em.num}`}
                    style={{ width:'100%', background:'#fff', border:'none', borderRadius:'10px', padding:'12px 14px', cursor:'pointer', outline:'none', display:'flex', alignItems:'center', gap:'12px', marginBottom:'6px', textDecoration:'none' }}>
                    <div style={{ width:'42px', height:'42px', borderRadius:'12px', background:em.color+'18', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" stroke={em.color} strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.06 6.06l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    </div>
                    <div style={{ flex:1 }}><div style={{ fontSize:'14px', fontWeight:'600', color:'#0d0d0d' }}>{em.label}</div><div style={{ fontSize:'11px', color:'#9ca3af' }}>{em.sub}</div></div>
                    <div style={{ fontSize:'18px', fontWeight:'800', color:em.color }}>{em.num}</div>
                  </a>
                ))}
              </div>
            )}

            {/* CONFIRMAR generico */}
            {svcStep === 'confirm' && (
              <div style={{ padding:'12px 16px 24px' }}>
                <div style={{ background:'#fff', borderRadius:'10px', overflow:'hidden', marginBottom:'12px' }}>
                  {Object.entries(svcData).filter(([k]) => k !== 'type').map(([k, v], i, arr) => (
                    <div key={k} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 16px', borderBottom: i < arr.length-1 ? '1px solid #f5f5f5' : 'none' }}>
                      <span style={{ fontSize:'13px', color:'#9ca3af', textTransform:'capitalize' }}>{k}</span>
                      <span style={{ fontSize:'13px', fontWeight:'700', color:'#0d0d0d' }}>{v}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => setSvcStep('success')} style={{ width:'100%', background:'#07C160', border:'none', borderRadius:'10px', padding:'13px', color:'#fff', fontSize:'14px', fontWeight:'700', cursor:'pointer', outline:'none', marginBottom:'8px' }}>Confirmar</button>
                <button onClick={() => setShowSvcModal(null)} style={{ width:'100%', background:'none', border:'none', padding:'10px', color:'#9ca3af', fontSize:'13px', cursor:'pointer', outline:'none' }}>Cancelar</button>
              </div>
            )}
            {/* EXITO */}
            {svcStep === 'success' && (
              <div style={{ padding:'32px 16px 40px', textAlign:'center' }}>
                <div style={{ width:'80px', height:'80px', borderRadius:'50%', background:'linear-gradient(135deg,#00c8a0,#00b4e6)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', boxShadow:'0 8px 24px rgba(0,200,160,0.3)' }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div style={{ fontSize:'20px', fontWeight:'800', color:'#111827', marginBottom:'8px' }}>¡Solicitud enviada!</div>
                <div style={{ fontSize:'13px', color:'#9CA3AF', marginBottom:'20px', lineHeight:'1.5', padding:'0 16px' }}>
                  {svcData.action || 'La operación se ha procesado correctamente'}
                </div>
                <div style={{ background:'#F0FDF9', borderRadius:'14px', padding:'16px', marginBottom:'24px', textAlign:'left', border:'1px solid #A7F3D0' }}>
                  <div style={{ fontSize:'11px', fontWeight:'700', color:'#065F46', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'10px' }}>Referencia</div>
                  <div style={{ fontSize:'13px', fontWeight:'800', color:'#111827', fontFamily:'monospace' }}>EGC-{Date.now().toString().slice(-8)}</div>
                  <div style={{ fontSize:'11px', color:'#9CA3AF', marginTop:'4px' }}>Guarda este nmero para seguimiento</div>
                </div>
                <button onClick={() => { setShowSvcModal(null); setSvcStep('main'); setSvcData({}); }}
                  style={{ width:'100%', background:'linear-gradient(135deg,#00c8a0,#00b4e6)', border:'none', borderRadius:'12px', padding:'14px', color:'#fff', fontSize:'14px', fontWeight:'700', cursor:'pointer', outline:'none' }}>
                  Listo
                </button>
              </div>
            )}

          </div>
        </div>
      )}
      {/* Modal Servicios Financieros */}
      {showFinModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:3000, display:'flex', alignItems:'flex-end', justifyContent:'center' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowFinModal(null); }}>
          <div style={{ background:'#F7F8FA', borderRadius:'12px 12px 0 0', width:'100%', maxWidth:'420px', maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'center', paddingTop:'8px' }}>
              <div style={{ width:'36px', height:'4px', borderRadius:'2px', background:'#e0e0e0' }} />
            </div>
            {/* Header */}
            <div style={{ display:'flex', alignItems:'center', padding:'8px 14px', background:'#fff', borderBottom:'1px solid #ebebeb' }}>
              {finStep !== 'main' && finStep !== 'success' ? (
                <button onClick={() => setFinStep('main')} style={{ background:'none', border:'none', cursor:'pointer', padding:'4px 8px 4px 0', color:'#07C160', display:'flex' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
              ) : <div style={{ width:'28px' }} />}
              <div style={{ flex:1, textAlign:'center', fontSize:'15px', fontWeight:'700', color:'#0d0d0d' }}>
                {showFinModal === 'transfer' && 'Transferencia'}
                {showFinModal === 'loan' && 'Prestamos'}
                {showFinModal === 'insurance' && 'Seguros'}
                {showFinModal === 'bills' && 'Pago de Facturas'}
                {showFinModal === 'invest' && 'Inversiones'}
                {showFinModal === 'cards' && 'Tarjetas'}
              </div>
              <button onClick={() => setShowFinModal(null)} style={{ background:'none', border:'none', cursor:'pointer', padding:'4px', color:'#9ca3af', display:'flex' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* TRANSFERENCIA */}
            {showFinModal === 'transfer' && finStep === 'main' && (
              <div style={{ padding:'12px 16px 24px' }}>
                <div style={{ fontSize:'11px', color:'#888', fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'8px' }}>Tipo de transferencia</div>
                {[
                  { id:'local',  svg:<svg width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>, label:'Transferencia Local',    sub:'Entre cuentas del mismo banco',  color:'#1485EE' },
                  { id:'inter',  svg:<svg width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>, label:'Transferencia Interna',   sub:'Entre bancos de Guinea Ec.',     color:'#07C160' },
                  { id:'intl',   svg:<svg width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>, label:'Transferencia CEMAC',     sub:'Camerun, Gabon, Congo...',       color:'#576B95' },
                  { id:'mobile', svg:<svg width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>, label:'Pago Móvil',              sub:'Enviar a numero de telefono',    color:'#FA9D3B' },
                ].map((t) => (
                  <button key={t.id} onClick={() => { setFinStep('transfer-form'); setFinData({ type: t.id, typeLabel: t.label }); }}
                    style={{ width:'100%', background:'#fff', border:'none', borderRadius:'10px', padding:'12px 14px', cursor:'pointer', outline:'none', display:'flex', alignItems:'center', gap:'12px', marginBottom:'6px' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#f9fafb'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}>
                    <div style={{ width:'42px', height:'42px', borderRadius:'12px', background:'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{t.svg}</div>
                    <div style={{ flex:1, textAlign:'left' }}>
                      <div style={{ fontSize:'14px', fontWeight:'600', color:'#0d0d0d' }}>{t.label}</div>
                      <div style={{ fontSize:'11px', color:'#9ca3af' }}>{t.sub}</div>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                ))}
                <div style={{ marginTop:'16px', background:'#fff', borderRadius:'10px', padding:'12px 14px' }}>
                  <div style={{ fontSize:'11px', color:'#9ca3af', marginBottom:'4px' }}>Saldo disponible</div>
                  <div style={{ fontSize:'22px', fontWeight:'800', color:'#0d0d0d', cursor:'pointer', userSelect:'none' }} onClick={() => toggleBalanceVisible('fin-transfer')}>
                    {isBalanceVisible('fin-transfer') ? <>{userBalance.toLocaleString()} <span style={{ fontSize:'13px', fontWeight:'500', color:'#9ca3af' }}>XAF</span></> : <span style={{ letterSpacing:'4px', color:'#d1d5db' }}>● ● ● ●</span>}
                    <span style={{ fontSize:'11px', color:'#9ca3af', marginLeft:'6px' }}>{isBalanceVisible('fin-transfer') ? '🙈' : '👁'}</span>
                  </div>
                </div>
              </div>
            )}
            {showFinModal === 'transfer' && finStep === 'transfer-form' && (
              <div style={{ padding:'12px 16px 24px' }}>
                <div style={{ background:'#fff', borderRadius:'10px', padding:'10px 14px', marginBottom:'12px', display:'flex', alignItems:'center', gap:'8px' }}>
                  <div style={{ fontSize:'12px', color:'#9ca3af' }}>Tipo:</div>
                  <div style={{ fontSize:'13px', fontWeight:'600', color:'#0d0d0d' }}>{finData.typeLabel}</div>
                </div>
                {[
                  { key:'recipient', placeholder:'Destinatario / IBAN / Telefono', type:'text',   icon:<svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
                  { key:'amount',    placeholder:'Monto (XAF)',                     type:'number', icon:<svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
                  { key:'concept',   placeholder:'Concepto (opcional)',              type:'text',   icon:<svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> },
                ].map((f) => (
                  <div key={f.key} style={{ background:'#fff', borderRadius:'10px', padding:'0 14px', marginBottom:'8px', display:'flex', alignItems:'center', height:'48px', gap:'10px' }}>
                    {f.icon}
                    <input type={f.type} placeholder={f.placeholder} value={finData[f.key] || ''}
                      onChange={(e) => setFinData((prev: Record<string,string>) => ({ ...prev, [f.key]: e.target.value }))}
                      style={{ flex:1, background:'none', border:'none', outline:'none', fontSize:'14px', color:'#0d0d0d', fontFamily:'inherit' }} />
                  </div>
                ))}
                <button onClick={() => { if (finData.recipient && finData.amount) setFinStep('confirm'); }}
                  style={{ width:'100%', background: finData.recipient && finData.amount ? '#07C160' : '#e5e7eb', border:'none', borderRadius:'10px', padding:'13px', color: finData.recipient && finData.amount ? '#fff' : '#9ca3af', fontSize:'14px', fontWeight:'700', cursor: finData.recipient && finData.amount ? 'pointer' : 'default', outline:'none', marginTop:'8px' }}>
                  Continuar
                </button>
              </div>
            )}

            {/* PRESTAMOS */}
            {showFinModal === 'loan' && finStep === 'main' && (
              <div style={{ padding:'12px 16px 24px' }}>
                <div style={{ fontSize:'11px', color:'#888', fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'8px' }}>Tipo de prestamo</div>
                {[
                  { id:'personal', label:'Prestamo Personal',   sub:'Hasta 5,000,000 XAF',  rate:'12% anual', color:'#FA9D3B' },
                  { id:'negocio',  label:'Prestamo Negocio',    sub:'Hasta 50,000,000 XAF', rate:'9% anual',  color:'#1485EE' },
                  { id:'hipoteca', label:'Hipoteca',            sub:'Hasta 200,000,000 XAF',rate:'7% anual',  color:'#576B95' },
                  { id:'micro',    label:'Microcredito',        sub:'Hasta 500,000 XAF',    rate:'15% anual', color:'#07C160' },
                ].map((l) => (
                  <button key={l.id} onClick={() => { setFinStep('loan-form'); setFinData({ type: l.id, typeLabel: l.label, rate: l.rate }); }}
                    style={{ width:'100%', background:'#fff', border:'none', borderRadius:'10px', padding:'12px 14px', cursor:'pointer', outline:'none', display:'flex', alignItems:'center', gap:'12px', marginBottom:'6px' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#f9fafb'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}>
                    <div style={{ width:'42px', height:'42px', borderRadius:'12px', background:'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" stroke={l.color} strokeWidth="2" strokeLinecap="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>
                    </div>
                    <div style={{ flex:1, textAlign:'left' }}>
                      <div style={{ fontSize:'14px', fontWeight:'600', color:'#0d0d0d' }}>{l.label}</div>
                      <div style={{ fontSize:'11px', color:'#9ca3af' }}>{l.sub} ? {l.rate}</div>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                ))}
              </div>
            )}
            {showFinModal === 'loan' && finStep === 'loan-form' && (
              <div style={{ padding:'12px 16px 24px' }}>
                <div style={{ background:'#fff', borderRadius:'10px', padding:'10px 14px', marginBottom:'12px' }}>
                  <div style={{ fontSize:'12px', color:'#9ca3af' }}>Tipo: <span style={{ color:'#0d0d0d', fontWeight:'600' }}>{finData.typeLabel}</span></div>
                  <div style={{ fontSize:'12px', color:'#9ca3af', marginTop:'2px' }}>Tasa: <span style={{ color:'#07C160', fontWeight:'600' }}>{finData.rate}</span></div>
                </div>
                {[
                  { key:'amount',   placeholder:'Monto solicitado (XAF)', type:'number' },
                  { key:'months',   placeholder:'Plazo en meses (6-60)',   type:'number' },
                  { key:'income',   placeholder:'Ingreso mensual (XAF)',   type:'number' },
                  { key:'purpose',  placeholder:'Proposito del prestamo',  type:'text'   },
                ].map((f) => (
                  <div key={f.key} style={{ background:'#fff', borderRadius:'10px', padding:'0 14px', marginBottom:'8px', display:'flex', alignItems:'center', height:'48px' }}>
                    <input type={f.type} placeholder={f.placeholder} value={finData[f.key] || ''}
                      onChange={(e) => setFinData((prev: Record<string,string>) => ({ ...prev, [f.key]: e.target.value }))}
                      style={{ flex:1, background:'none', border:'none', outline:'none', fontSize:'14px', color:'#0d0d0d', fontFamily:'inherit' }} />
                  </div>
                ))}
                {finData.amount && finData.months && (
                  <div style={{ background:'#f0fdf4', borderRadius:'10px', padding:'12px 14px', marginBottom:'12px' }}>
                    <div style={{ fontSize:'11px', color:'#9ca3af', marginBottom:'4px' }}>Cuota mensual estimada</div>
                    <div style={{ fontSize:'20px', fontWeight:'800', color:'#07C160' }}>
                      {Math.round((parseInt(finData.amount || '0') * 1.12) / parseInt(finData.months || '1')).toLocaleString()} XAF
                    </div>
                  </div>
                )}
                <button onClick={() => { if (finData.amount && finData.months) setFinStep('confirm'); }}
                  style={{ width:'100%', background: finData.amount && finData.months ? '#07C160' : '#e5e7eb', border:'none', borderRadius:'10px', padding:'13px', color: finData.amount && finData.months ? '#fff' : '#9ca3af', fontSize:'14px', fontWeight:'700', cursor: finData.amount && finData.months ? 'pointer' : 'default', outline:'none' }}>
                  Solicitar
                </button>
              </div>
            )}

            {/* SEGUROS */}
            {showFinModal === 'insurance' && finStep === 'main' && (
              <div style={{ padding:'12px 16px 24px' }}>
                <div style={{ fontSize:'11px', color:'#888', fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'8px' }}>Tipo de seguro</div>
                {[
                  { id:'vida',   label:'Seguro de Vida',      sub:'Cobertura familiar completa', price:'5,000 XAF/mes',  color:'#07C160' },
                  { id:'salud',  label:'Seguro de Salud',     sub:'Hospitalizacion y consultas',  price:'8,000 XAF/mes',  color:'#FA5151' },
                  { id:'auto',   label:'Seguro de Vehiculo',  sub:'Todo riesgo o terceros',       price:'12,000 XAF/mes', color:'#1485EE' },
                  { id:'hogar',  label:'Seguro del Hogar',    sub:'Robo, incendio, inundacion',   price:'4,000 XAF/mes',  color:'#FA9D3B' },
                  { id:'viaje',  label:'Seguro de Viaje',     sub:'Cobertura internacional',      price:'2,500 XAF/viaje',color:'#576B95' },
                ].map((s) => (
                  <button key={s.id} onClick={() => { setFinStep('insurance-form'); setFinData({ type: s.id, typeLabel: s.label, price: s.price }); }}
                    style={{ width:'100%', background:'#fff', border:'none', borderRadius:'10px', padding:'12px 14px', cursor:'pointer', outline:'none', display:'flex', alignItems:'center', gap:'12px', marginBottom:'6px' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#f9fafb'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}>
                    <div style={{ width:'42px', height:'42px', borderRadius:'12px', background:'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" stroke={s.color} strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    </div>
                    <div style={{ flex:1, textAlign:'left' }}>
                      <div style={{ fontSize:'14px', fontWeight:'600', color:'#0d0d0d' }}>{s.label}</div>
                      <div style={{ fontSize:'11px', color:'#9ca3af' }}>{s.sub}</div>
                    </div>
                    <div style={{ fontSize:'11px', fontWeight:'700', color:s.color, textAlign:'right', flexShrink:0 }}>{s.price}</div>
                  </button>
                ))}
              </div>
            )}
            {showFinModal === 'insurance' && finStep === 'insurance-form' && (
              <div style={{ padding:'12px 16px 24px' }}>
                <div style={{ background:'#fff', borderRadius:'10px', padding:'10px 14px', marginBottom:'12px' }}>
                  <div style={{ fontSize:'13px', fontWeight:'600', color:'#0d0d0d' }}>{finData.typeLabel}</div>
                  <div style={{ fontSize:'12px', color:'#07C160', fontWeight:'600', marginTop:'2px' }}>{finData.price}</div>
                </div>
                {[
                  { key:'name',  placeholder:'Nombre completo',    type:'text'   },
                  { key:'dni',   placeholder:'DNI / Pasaporte',    type:'text'   },
                  { key:'phone', placeholder:'Telefono de contacto',type:'tel'   },
                  { key:'email', placeholder:'Correo electronico', type:'email'  },
                ].map((f) => (
                  <div key={f.key} style={{ background:'#fff', borderRadius:'10px', padding:'0 14px', marginBottom:'8px', display:'flex', alignItems:'center', height:'48px' }}>
                    <input type={f.type} placeholder={f.placeholder} value={finData[f.key] || ''}
                      onChange={(e) => setFinData((prev: Record<string,string>) => ({ ...prev, [f.key]: e.target.value }))}
                      style={{ flex:1, background:'none', border:'none', outline:'none', fontSize:'14px', color:'#0d0d0d', fontFamily:'inherit' }} />
                  </div>
                ))}
                <button onClick={() => { if (finData.name && finData.phone) setFinStep('success'); }}
                  style={{ width:'100%', background: finData.name && finData.phone ? '#07C160' : '#e5e7eb', border:'none', borderRadius:'10px', padding:'13px', color: finData.name && finData.phone ? '#fff' : '#9ca3af', fontSize:'14px', fontWeight:'700', cursor: finData.name && finData.phone ? 'pointer' : 'default', outline:'none', marginTop:'8px' }}>
                  Contratar Seguro
                </button>
              </div>
            )}

            {/* PAGO DE FACTURAS */}
            {showFinModal === 'bills' && finStep === 'main' && (
              <div style={{ padding:'12px 16px 24px' }}>
                <div style={{ fontSize:'11px', color:'#888', fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'8px' }}>Selecciona servicio</div>
                {[
                  { id:'elec',  label:'Electricidad',  sub:'SEGESA / ENERGE',    color:'#FA9D3B' },
                  { id:'agua',  label:'Agua',           sub:'SNGE',               color:'#1485EE' },
                  { id:'gas',   label:'Gas',            sub:'GEPetrol',           color:'#FA5151' },
                  { id:'tv',    label:'TV / Cable',     sub:'Canal+ / DStv',      color:'#576B95' },
                  { id:'tax',   label:'Impuestos',      sub:'DGI / Hacienda',     color:'#07C160' },
                  { id:'edu',   label:'Educacion',      sub:'Colegios / Univ.',   color:'#576B95' },
                  { id:'other', label:'Otro',           sub:'Referencia manual',  color:'#9ca3af' },
                ].map((b) => (
                  <button key={b.id} onClick={() => { setFinStep('bills-form'); setFinData({ type: b.id, typeLabel: b.label }); }}
                    style={{ width:'100%', background:'#fff', border:'none', borderRadius:'10px', padding:'12px 14px', cursor:'pointer', outline:'none', display:'flex', alignItems:'center', gap:'12px', marginBottom:'6px' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#f9fafb'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}>
                    <div style={{ width:'42px', height:'42px', borderRadius:'12px', background:'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" stroke={b.color} strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                    </div>
                    <div style={{ flex:1, textAlign:'left' }}>
                      <div style={{ fontSize:'14px', fontWeight:'600', color:'#0d0d0d' }}>{b.label}</div>
                      <div style={{ fontSize:'11px', color:'#9ca3af' }}>{b.sub}</div>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                ))}
              </div>
            )}
            {showFinModal === 'bills' && finStep === 'bills-form' && (
              <div style={{ padding:'12px 16px 24px' }}>
                <div style={{ background:'#fff', borderRadius:'10px', padding:'10px 14px', marginBottom:'12px' }}>
                  <div style={{ fontSize:'13px', fontWeight:'600', color:'#0d0d0d' }}>{finData.typeLabel}</div>
                </div>
                {[
                  { key:'ref',    placeholder:'Numero de referencia / Contrato', type:'text'   },
                  { key:'amount', placeholder:'Monto a pagar (XAF)',             type:'number' },
                ].map((f) => (
                  <div key={f.key} style={{ background:'#fff', borderRadius:'10px', padding:'0 14px', marginBottom:'8px', display:'flex', alignItems:'center', height:'48px' }}>
                    <input type={f.type} placeholder={f.placeholder} value={finData[f.key] || ''}
                      onChange={(e) => setFinData((prev: Record<string,string>) => ({ ...prev, [f.key]: e.target.value }))}
                      style={{ flex:1, background:'none', border:'none', outline:'none', fontSize:'14px', color:'#0d0d0d', fontFamily:'inherit' }} />
                  </div>
                ))}
                <button onClick={() => { if (finData.ref && finData.amount) setFinStep('confirm'); }}
                  style={{ width:'100%', background: finData.ref && finData.amount ? '#07C160' : '#e5e7eb', border:'none', borderRadius:'10px', padding:'13px', color: finData.ref && finData.amount ? '#fff' : '#9ca3af', fontSize:'14px', fontWeight:'700', cursor: finData.ref && finData.amount ? 'pointer' : 'default', outline:'none', marginTop:'8px' }}>
                  Continuar
                </button>
              </div>
            )}

            {/* INVERSIONES */}
            {showFinModal === 'invest' && finStep === 'main' && (
              <div style={{ padding:'12px 16px 24px' }}>
                <div style={{ fontSize:'11px', color:'#888', fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'8px' }}>Productos de inversión</div>
                {[
                  { id:'plazo',  label:'Depósito a Plazo',   sub:'3-24 meses',       rate:'+6% anual',  color:'#07C160' },
                  { id:'fondos', label:'Fondos de Inversión', sub:'Cartera diversif.', rate:'+8-12% anual',color:'#1485EE' },
                  { id:'bonos',  label:'Bonos del Estado',   sub:'Renta fija CEMAC',  rate:'+5% anual',  color:'#576B95' },
                  { id:'acciones',label:'Acciones BVMAC',   sub:'Bolsa de Libreville',rate:'Variable',  color:'#FA9D3B' },
                ].map((inv) => (
                  <button key={inv.id} onClick={() => { setFinStep('invest-form'); setFinData({ type: inv.id, typeLabel: inv.label, rate: inv.rate }); }}
                    style={{ width:'100%', background:'#fff', border:'none', borderRadius:'10px', padding:'12px 14px', cursor:'pointer', outline:'none', display:'flex', alignItems:'center', gap:'12px', marginBottom:'6px' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#f9fafb'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}>
                    <div style={{ width:'42px', height:'42px', borderRadius:'12px', background:'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" stroke={inv.color} strokeWidth="2" strokeLinecap="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
                    </div>
                    <div style={{ flex:1, textAlign:'left' }}>
                      <div style={{ fontSize:'14px', fontWeight:'600', color:'#0d0d0d' }}>{inv.label}</div>
                      <div style={{ fontSize:'11px', color:'#9ca3af' }}>{inv.sub}</div>
                    </div>
                    <div style={{ fontSize:'12px', fontWeight:'700', color:inv.color }}>{inv.rate}</div>
                  </button>
                ))}
                <div style={{ background:'#fff', borderRadius:'10px', padding:'12px 14px', marginTop:'8px' }}>
                  <div style={{ fontSize:'11px', color:'#9ca3af', marginBottom:'4px' }}>Saldo disponible para invertir</div>
                  <div style={{ fontSize:'22px', fontWeight:'800', color:'#0d0d0d', cursor:'pointer', userSelect:'none' }} onClick={() => toggleBalanceVisible('fin-invest')}>
                    {isBalanceVisible('fin-invest') ? <>{userBalance.toLocaleString()} <span style={{ fontSize:'13px', fontWeight:'500', color:'#9ca3af' }}>XAF</span></> : <span style={{ letterSpacing:'4px', color:'#d1d5db' }}>● ● ● ●</span>}
                    <span style={{ fontSize:'11px', color:'#9ca3af', marginLeft:'6px' }}>{isBalanceVisible('fin-invest') ? '🙈' : '👁'}</span>
                  </div>
                </div>
              </div>
            )}
            {showFinModal === 'invest' && finStep === 'invest-form' && (
              <div style={{ padding:'12px 16px 24px' }}>
                <div style={{ background:'#fff', borderRadius:'10px', padding:'10px 14px', marginBottom:'12px' }}>
                  <div style={{ fontSize:'13px', fontWeight:'600', color:'#0d0d0d' }}>{finData.typeLabel}</div>
                  <div style={{ fontSize:'12px', color:'#07C160', fontWeight:'600', marginTop:'2px' }}>Rendimiento: {finData.rate}</div>
                </div>
                {[
                  { key:'amount', placeholder:'Monto a invertir (XAF)', type:'number' },
                  { key:'months', placeholder:'Plazo en meses',          type:'number' },
                ].map((f) => (
                  <div key={f.key} style={{ background:'#fff', borderRadius:'10px', padding:'0 14px', marginBottom:'8px', display:'flex', alignItems:'center', height:'48px' }}>
                    <input type={f.type} placeholder={f.placeholder} value={finData[f.key] || ''}
                      onChange={(e) => setFinData((prev: Record<string,string>) => ({ ...prev, [f.key]: e.target.value }))}
                      style={{ flex:1, background:'none', border:'none', outline:'none', fontSize:'14px', color:'#0d0d0d', fontFamily:'inherit' }} />
                  </div>
                ))}
                {finData.amount && finData.months && (
                  <div style={{ background:'#f0fdf4', borderRadius:'10px', padding:'12px 14px', marginBottom:'12px' }}>
                    <div style={{ fontSize:'11px', color:'#9ca3af', marginBottom:'4px' }}>Ganancia estimada</div>
                    <div style={{ fontSize:'20px', fontWeight:'800', color:'#07C160' }}>
                      +{Math.round(parseInt(finData.amount || '0') * 0.08 * parseInt(finData.months || '0') / 12).toLocaleString()} XAF
                    </div>
                  </div>
                )}
                <button onClick={() => { if (finData.amount && finData.months) setFinStep('confirm'); }}
                  style={{ width:'100%', background: finData.amount && finData.months ? '#07C160' : '#e5e7eb', border:'none', borderRadius:'10px', padding:'13px', color: finData.amount && finData.months ? '#fff' : '#9ca3af', fontSize:'14px', fontWeight:'700', cursor: finData.amount && finData.months ? 'pointer' : 'default', outline:'none' }}>
                  Invertir
                </button>
              </div>
            )}

            {/* TARJETAS */}
            {showFinModal === 'cards' && finStep === 'main' && (
              <div style={{ padding:'12px 16px 24px' }}>
                <div style={{ fontSize:'11px', color:'#888', fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'8px' }}>Mis tarjetas</div>
                <div style={{ background:'linear-gradient(135deg,#00c8a0,#00b4e6)', borderRadius:'16px', padding:'20px', marginBottom:'12px', color:'#fff', position:'relative', overflow:'hidden' }}>
                  <div style={{ fontSize:'11px', opacity:0.8, marginBottom:'8px' }}>EGChat Pay</div>
                  <div style={{ fontSize:'20px', fontWeight:'800', letterSpacing:'2px', marginBottom:'16px' }}>**** **** **** 4821</div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
                    <div>
                      <div style={{ fontSize:'10px', opacity:0.7 }}>TITULAR</div>
                      <div style={{ fontSize:'13px', fontWeight:'700' }}>USUARIO EGCHAT</div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontSize:'10px', opacity:0.7 }}>VENCE</div>
                      <div style={{ fontSize:'13px', fontWeight:'700' }}>12/28</div>
                    </div>
                  </div>
                </div>
                {[
                  { id:'block',   label:'Bloquear / Desbloquear', sub:'Activar o pausar la tarjeta',  color:'#FA5151' },
                  { id:'limit',   label:'Cambiar limite',         sub:'Ajustar limite de gasto',      color:'#FA9D3B' },
                  { id:'pin',     label:'Cambiar PIN',            sub:'Actualizar PIN de seguridad',  color:'#576B95' },
                  { id:'virtual', label:'Tarjeta Virtual',        sub:'Para compras online',          color:'#1485EE' },
                  { id:'new',     label:'Solicitar nueva tarjeta',sub:'Debito o credito',             color:'#07C160' },
                ].map((c) => (
                  <button key={c.id} onClick={() => { setFinStep('success'); setFinData({ action: c.label }); }}
                    style={{ width:'100%', background:'#fff', border:'none', borderRadius:'10px', padding:'12px 14px', cursor:'pointer', outline:'none', display:'flex', alignItems:'center', gap:'12px', marginBottom:'6px' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#f9fafb'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}>
                    <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:c.color+'18', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:c.color }} />
                    </div>
                    <div style={{ flex:1, textAlign:'left' }}>
                      <div style={{ fontSize:'14px', fontWeight:'600', color:'#0d0d0d' }}>{c.label}</div>
                      <div style={{ fontSize:'11px', color:'#9ca3af' }}>{c.sub}</div>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                ))}
              </div>
            )}

            {/* CONFIRMAR (transferencia, facturas, inversion) */}
            {finStep === 'confirm' && (
              <div style={{ padding:'12px 16px 24px' }}>
                <div style={{ background:'#fff', borderRadius:'10px', overflow:'hidden', marginBottom:'12px' }}>
                  {Object.entries(finData).filter(([k]) => !['type'].includes(k)).map(([k, v], i, arr) => (
                    <div key={k} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 16px', borderBottom: i < arr.length-1 ? '1px solid #f5f5f5' : 'none' }}>
                      <span style={{ fontSize:'13px', color:'#9ca3af', textTransform:'capitalize' }}>{k}</span>
                      <span style={{ fontSize:'13px', fontWeight:'700', color:'#0d0d0d' }}>{v}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => setFinStep('success')}
                  style={{ width:'100%', background:'#07C160', border:'none', borderRadius:'10px', padding:'13px', color:'#fff', fontSize:'14px', fontWeight:'700', cursor:'pointer', outline:'none', marginBottom:'8px' }}>
                  Confirmar
                </button>
                <button onClick={() => setShowFinModal(null)}
                  style={{ width:'100%', background:'none', border:'none', padding:'10px', color:'#9ca3af', fontSize:'13px', cursor:'pointer', outline:'none' }}>
                  Cancelar
                </button>
              </div>
            )}

            {/* EXITO */}
            {finStep === 'success' && (
              <div style={{ padding:'28px 16px 32px', textAlign:'center' }}>
                <div style={{ width:'64px', height:'64px', borderRadius:'50%', background:'#f0fdf4', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
                  <svg width="30" height="30" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div style={{ fontSize:'17px', fontWeight:'700', color:'#0d0d0d', marginBottom:'6px' }}>
                  {showFinModal === 'transfer' && 'Transferencia enviada'}
                  {showFinModal === 'loan' && 'Solicitud enviada'}
                  {showFinModal === 'insurance' && 'Seguro contratado'}
                  {showFinModal === 'bills' && 'Pago realizado'}
                  {showFinModal === 'invest' && 'Inversión activada'}
                  {showFinModal === 'cards' && 'Operacion completada'}
                </div>
                <div style={{ fontSize:'13px', color:'#9ca3af', marginBottom:'24px' }}>
                  {finData.action || 'La operacion se ha procesado correctamente'}
                </div>
                <button onClick={() => setShowFinModal(null)}
                  style={{ width:'100%', background:'#07C160', border:'none', borderRadius:'10px', padding:'13px', color:'#fff', fontSize:'14px', fontWeight:'700', cursor:'pointer', outline:'none' }}>
                  Listo
                </button>
              </div>
            )}

          </div>
        </div>
      )}
      {/* Modal de QR */}

      {showQRModal && (() => {
        const seed = qrType === 'receive'
          ? `egchat://pay/${userProfile.id}`
          : `egchat://pay?amount=${qrAmount}&concept=${qrConcept}`;
        const hash = seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
        const cells = Array.from({ length: 21 }, (_, row) =>
          Array.from({ length: 21 }, (_, col) => {
            const inCorner = (r: number, c: number, or: number, oc: number) =>
              r >= or && r <= or + 6 && c >= oc && c <= oc + 6 &&
              !(r > or && r < or + 6 && c > oc && c < oc + 6) ||
              (r >= or + 2 && r <= or + 4 && c >= oc + 2 && c <= oc + 4);
            if (inCorner(row, col, 0, 0) || inCorner(row, col, 0, 14) || inCorner(row, col, 14, 0) || inCorner(row, col, 14, 14)) return true;
            if (row === 6 && col >= 7 && col <= 13 && col % 2 === 1) return true;
            if (col === 6 && row >= 7 && row <= 13 && row % 2 === 1) return true;
            return ((row * 21 + col + hash) % 3 === 0) && !(row < 9 && col < 9) && !(row < 9 && col > 12) && !(row > 12 && col < 9) && !(row > 12 && col > 12) && !(row === 6) && !(col === 6);
          })
        );
        const accentColor = qrType === 'receive' ? '#00c8a0' : '#00b4e6';
        const gradBg = qrType === 'receive'
          ? 'linear-gradient(135deg, #00c8a0, #059669)'
          : 'linear-gradient(135deg, #00b4e6, #2563eb)';
        return (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, backdropFilter: 'blur(6px)' }}
            onClick={() => setShowQRModal(false)}>
            <div style={{ background: 'rgba(255,255,255,0.35)', backdropFilter: 'blur(28px) saturate(200%)', WebkitBackdropFilter: 'blur(28px) saturate(200%)', width: '85%', maxWidth: '320px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', border: '1.5px solid rgba(255,255,255,0.6)' }}
              onClick={(e) => e.stopPropagation()}>
              <div style={{ background: gradBg, padding: '18px 18px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '17px', fontWeight: '800', color: 'white' }}>{qrType === 'receive' ? 'Recibir dinero' : 'Realizar pago'}</div>
                  <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.75)', marginTop: '2px' }}>{qrType === 'receive' ? 'Muestra este QR para recibir' : 'Genera tu QR de cobro'}</div>
                </div>
                <button onClick={() => setShowQRModal(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', outline: 'none', color: 'white', fontSize: '16px' }}>x</button>
              </div>
              <div style={{ padding: '18px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
                  <div style={{ background: 'white', padding: '12px', borderRadius: '12px', border: `2px solid ${accentColor}30` }}>
                    <div style={{ display: 'grid', gridTemplateColumns: `repeat(21, 8px)`, gap: '1px' }}>
                      {cells.flat().map((filled, i) => (
                        <div key={i} style={{ width: '8px', height: '8px', background: filled ? '#0d0d0d' : 'transparent', borderRadius: '1px' }} />
                      ))}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#0d0d0d' }}>{userProfile.name}</div>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>{userProfile.phone}</div>
                  </div>
                  {qrType === 'pay' && (
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input type="number" value={qrAmount} onChange={(e) => setQrAmount(e.target.value)} placeholder="Monto (XAF)"
                        style={{ width: '100%', padding: '10px 14px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', color: '#0d0d0d', outline: 'none', fontFamily: 'inherit' }} />
                      <input type="text" value={qrConcept} onChange={(e) => setQrConcept(e.target.value)} placeholder="Concepto (opcional)"
                        style={{ width: '100%', padding: '10px 14px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', color: '#0d0d0d', outline: 'none', fontFamily: 'inherit' }} />
                    </div>
                  )}
                  <button onClick={() => setShowQRModal(false)} style={{ width: '100%', background: gradBg, border: 'none', borderRadius: '12px', padding: '12px', color: '#fff', fontSize: '14px', fontWeight: '700', cursor: 'pointer', outline: 'none' }}>Cerrar</button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal PIN */}
      {showPINModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 3500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: '20px', padding: '28px 24px', width: '85%', maxWidth: '320px', textAlign: 'center' }}>
            <div style={{ fontSize: '16px', fontWeight: '700', color: '#0d0d0d', marginBottom: '6px' }}>Verificacion PIN</div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '20px' }}>Ingresa tu PIN de seguridad</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
              {[0,1,2,3].map(i => (
                <div key={i} style={{ width: '14px', height: '14px', borderRadius: '50%', background: pinInput.length > i ? '#00c8a0' : '#e5e7eb', border: '2px solid ' + (pinInput.length > i ? '#00c8a0' : '#d1d5db') }} />
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '12px' }}>
              {['1','2','3','4','5','6','7','8','9','','0','<'].map((k, i) => (
                <button key={i} onClick={() => {
                  if (k === '<') { setPinInput(p => p.slice(0,-1)); }
                  else if (k !== '' && pinInput.length < 4) {
                    const next = pinInput + k;
                    setPinInput(next);
                    if (next.length === 4) {
                      if (next === userPIN) { setShowPINModal(false); setPinInput(''); if (pendingOperation) { pendingOperation(); setPendingOperation(null); } }
                      else { setPinAttempts(p => p+1); setPinInput(''); }
                    }
                  }
                }}
                style={{ background: k === '' ? 'transparent' : '#f9fafb', border: 'none', borderRadius: '12px', padding: '16px', fontSize: '18px', fontWeight: '600', color: '#0d0d0d', cursor: k === '' ? 'default' : 'pointer', outline: 'none' }}>
                  {k === '<' ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><line x1="18" y1="9" x2="12" y2="15"/><line x1="12" y1="9" x2="18" y2="15"/></svg>
                  ) : k}
                </button>
              ))}
            </div>
            {pinAttempts > 0 && <div style={{ fontSize: '14px', color: '#ef4444', marginBottom: '8px' }}>PIN incorrecto. Intento {pinAttempts}/3</div>}
            <button onClick={() => { setShowPINModal(false); setPinInput(''); setPendingOperation(null); }}
              style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '13px', cursor: 'pointer', outline: 'none' }}>Cancelar</button>
          </div>
        </div>
      )}

      {/* -- MODAL CANALES --------------------------------------------------- */}
      {showCanalesModal && <CanalesModal onClose={() => setShowCanalesModal(false)} userBalance={userBalance} onDebit={(n) => setUserBalance((p: number) => p - n)} />}

      {/* -- PANEL INTEGRANTES DEL GRUPO ------------------------------------- */}
      {showGroupMembersPanel && selectedChat?.isGroup && (
        <div style={{ position: 'fixed', inset: 0, background: '#F0F2F5', zIndex: 4500, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)', padding: '10px 16px', paddingTop: 'calc(10px + env(safe-area-inset-top, 44px))', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0, boxShadow: '0 2px 12px rgba(168,85,247,0.3)' }}>
            <button onClick={() => setShowGroupMembersPanel(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', padding: '4px', display: 'flex' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>Integrantes</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)' }}>{selectedChat.title}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '20px', padding: '4px 10px', fontSize: '12px', fontWeight: '700', color: '#fff' }}>
              {groupMembersList.length} miembros
            </div>
          </div>

          {/* Lista de integrantes */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loadingGroupMembers ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0', flexDirection: 'column', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', border: '3px solid #e5e7eb', borderTopColor: '#a855f7', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <div style={{ fontSize: '13px', color: '#9ca3af' }}>Cargando integrantes...</div>
              </div>
            ) : groupMembersList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 16px', color: '#9ca3af' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.4" strokeLinecap="round" style={{ margin: '0 auto 12px', display: 'block' }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>Sin integrantes</div>
              </div>
            ) : (
              <div style={{ background: '#fff', marginTop: '8px' }}>
                {[...groupMembersList]
                  .sort((a, b) => {
                    // Admins primero
                    const aAdmin = a.role === 'admin' ? 0 : 1;
                    const bAdmin = b.role === 'admin' ? 0 : 1;
                    if (aAdmin !== bAdmin) return aAdmin - bAdmin;
                    const aName = (a.full_name || '').trim();
                    const bName = (b.full_name || '').trim();
                    // Sin nombre real → al final
                    const aHasName = /^[a-zA-ZÀ-ÿ]/.test(aName) ? 0 : 1;
                    const bHasName = /^[a-zA-ZÀ-ÿ]/.test(bName) ? 0 : 1;
                    if (aHasName !== bHasName) return aHasName - bHasName;
                    return aName.localeCompare(bName, 'es', { sensitivity: 'base' });
                  })
                  .map((member, idx) => {
                  const name = member.full_name || member.phone || 'Miembro';
                  const initials = name.slice(0, 2).toUpperCase();
                  const isMe = member.user_id === (window as any).__currentUserId;
                  const isInMyContacts = allContacts.some(c => c.id === member.user_id || c.phone === member.phone);
                  return (
                    <div key={member.id || idx} style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {/* Avatar */}
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          <div style={{ width: '46px', height: '46px', borderRadius: '50%', background: 'linear-gradient(135deg, #a855f7, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                            {member.avatar_url
                              ? <img src={member.avatar_url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : <span style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>{initials}</span>
                            }
                          </div>
                          {member.online_status && (
                            <div style={{ position: 'absolute', bottom: '1px', right: '1px', width: '11px', height: '11px', borderRadius: '50%', background: '#22c55e', border: '2px solid #fff' }} />
                          )}
                        </div>
                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {isMe ? 'Tú' : name}
                            </span>
                            {member.role === 'admin' && (
                              <span style={{ fontSize: '9px', fontWeight: '700', color: '#a855f7', background: '#F3E8FF', borderRadius: '4px', padding: '1px 5px', flexShrink: 0 }}>ADMIN</span>
                            )}
                          </div>
                          <div style={{ fontSize: '12px', color: member.online_status ? '#22c55e' : '#9ca3af', marginTop: '1px' }}>
                            {member.online_status ? '● En línea' : member.phone || '○ Desconectado'}
                          </div>
                        </div>
                        {/* Acciones — solo para otros miembros */}
                        {!isMe && (
                          <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                            {/* Mensaje privado */}
                            <button
                              title="Mensaje privado"
                              onClick={async () => {
                                setShowGroupMembersPanel(false);
                                try {
                                  const chat = await chatAPI.createPrivate(member.user_id);
                                  if (chat?.id) {
                                    setSelectedChat({
                                      id: chat.id, type: 'individual', title: name,
                                      subtitle: 'Chat privado', time: '', status: member.online_status ? 'online' : 'offline',
                                      initials, color: '#00c8a0', avatarUrl: member.avatar_url, user_id: member.user_id
                                    });
                                    setCurrentView('Mensajería');
                                    loadChats();
                                  }
                                } catch { showToast('No se pudo abrir el chat', 'error'); }
                              }}
                              style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#EFF6FF', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', outline: 'none' }}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                            </button>
                            {/* Añadir a contactos */}
                            {!isInMyContacts && (
                              <button
                                title="Añadir a contactos"
                                onClick={async () => {
                                  try {
                                    await contactsAPI.add(member.user_id, member.phone, name);
                                    await loadContacts();
                                    showToast(`${name} añadido a contactos`, 'success');
                                  } catch { showToast('No se pudo añadir el contacto', 'error'); }
                                }}
                                style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#F0FDF4', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', outline: 'none' }}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* -- MODAL BANCOS ---------------------------------------------------- */}
      {showBancosModal && <BancosModal onClose={() => { setShowBancosModal(false); setBancosInitScreen('home'); }} userBalance={userBalance} onDebit={(n: number) => setUserBalance((p: number) => p - n)} initScreen={bancosInitScreen} />}

      {/* -- MODAL SEGUROS --------------------------------------------------- */}
      {showSegurosModal && <SegurosModal onClose={() => setShowSegurosModal(false)} userBalance={userBalance} onDebit={(n: number) => setUserBalance((p: number) => p - n)} />}

      {/* -- MODAL FACTURAS -------------------------------------------------- */}
      {showFacturasModal && <FacturasModal onClose={() => setShowFacturasModal(false)} userBalance={userBalance} onDebit={(n: number) => setUserBalance((p: number) => p - n)} />}

      {/* -- CENTRO DE ACTIVIDAD --------------------------------------------- */}
      {showActividadModal && <ActividadModal onClose={() => setShowActividadModal(false)} userBalance={userBalance} transactionHistory={transactionHistory} />}

      {/* -- M?DULO SALUD ---------------------------------------------------- */}
      {showSaludModal && <SaludModal onClose={() => { setShowSaludModal(false); setSaludInitTab('hospitales'); }} userBalance={userBalance} onDebit={(n: number) => setUserBalance((p: number) => p - n)} initTab={saludInitTab} />}

      {/* -- M?DULO SUPERMERCADO --------------------------------------------- */}
      {showSuperModal && <SupermercadosModal onClose={() => setShowSuperModal(false)} userBalance={userBalance} onDebit={(n: number) => setUserBalance((p: number) => p - n)} />}


      {/* -- PERFIL DE CONTACTO ---------------------------------------------- */}
      {showContactProfile && (
        <ContactProfileModal
          contact={showContactProfile}
          onClose={() => setShowContactProfile(null)}
          mutedChats={mutedChats}
          blockedChats={blockedChats}
          pinnedChats={pinnedChats}
          chatMessages={chatMessages}
          allGroups={allGroups}
          userBalance={userBalance}
          isFavorite={favoriteContacts.some((f: any) => f.id?.toString() === showContactProfile.id?.toString())}
          onMuteToggle={(id) => setMutedChats(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])}
          onBlockToggle={(id) => setBlockedChats(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])}
          onPinToggle={(id) => setPinnedChats(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])}
          onClearChat={(id) => setChatMessages(prev => ({ ...prev, [id]: [] }))}
          onDeleteContact={(id) => setAllContacts(prev => prev.filter(c => c.id !== id))}
          onOpenWallpaper={() => setShowWallpaperCatalog(true)}
          isInContacts={allContacts.some(c => c.id === showContactProfile.id?.toString())}
          onAddContact={async () => {
            const cp = showContactProfile;
            const phone = cp.phone || cp.subtitle || '';
            const name = cp.title || cp.name || '';
            try {
              await contactsAPI.add(cp.id, phone || undefined, name || undefined);
              await loadContacts();
              showToast(`${name} anadido a contactos`, 'success');
            } catch { showToast('No se pudo anadir el contacto', 'error'); }
          }}
          onSendMoney={(contact) => { setQuickTransferData({ contactId: contact.id?.toString() || '', contactName: contact.title || contact.name, amount: '', accountId: bankAccounts[0]?.id || '' }); setShowQuickTransferModal(true); }}
          onStartCall={(type, contact) => startCall(type, contact)}
          onFavoriteToggle={async (id, isFav) => {
            try {
              if (isFav) {
                await contactsAPI.favorite(id);
                const updated = await contactsAPI.getFavorites();
                setFavoriteContacts(updated || []);
              } else {
                await contactsAPI.unfavorite(id);
                setFavoriteContacts(prev => prev.filter((f: any) => f.id?.toString() !== id));
              }
            } catch {}
          }}
          onAddGroupMembers={() => {
            if (showContactProfile?.isGroup) {
              // Abrir modal de añadir miembros al grupo
              setShowContactProfile(null);
              setGroupMembers([]);
              setGroupName(showContactProfile.title || showContactProfile.name || '');
              // Usar showCreateGroup en modo "añadir" — guardamos el chatId del grupo
              (window as any).__addMembersToGroupId = showContactProfile.id?.toString();
              setShowCreateGroup(true);
            }
          }}
          groupMembers={showContactProfile?.isGroup ? groupMembersList : []}
          currentUserId={currentUserId.current?.toString()}
          onAddMemberToContacts={async (member: any) => {
            try {
              const name = member.full_name || member.phone || 'Miembro';
              await contactsAPI.add(member.user_id, member.phone, name);
              await loadContacts();
              showToast(`${name} añadido a contactos`, 'success');
            } catch { showToast('No se pudo añadir el contacto', 'error'); }
          }}
          onRemoveGroupMember={async (userId: string) => {
            if (!showContactProfile?.id) return;
            try {
              await chatAPI.addGroupMembers(showContactProfile.id, []);
              // Recargar miembros
              const members = await chatAPI.getGroupParticipants(showContactProfile.id);
              setGroupMembersList(members || []);
              showToast('Miembro eliminado', 'success');
            } catch { showToast('No se pudo eliminar el miembro', 'error'); }
          }}
          onPromoteToAdmin={async (userId: string) => {
            showToast('Administrador asignado', 'success');
            setGroupMembersList(prev => prev.map(m =>
              m.user_id?.toString() === userId ? { ...m, role: 'admin' } : m
            ));
          }}
          onLeaveGroup={async () => {
            if (!showContactProfile?.id) return;
            try {
              await chatAPI.deleteChat(showContactProfile.id);
              await loadChats();
              showToast('Saliste del grupo', 'success');
            } catch { showToast('No se pudo salir del grupo', 'error'); }
          }}
          onDeleteGroup={async () => {
            if (!showContactProfile?.id) return;
            try {
              await chatAPI.deleteChat(showContactProfile.id);
              setAllGroups(prev => prev.filter(g => g.id?.toString() !== showContactProfile.id?.toString()));
              await loadChats();
              showToast('Grupo eliminado', 'success');
            } catch { showToast('No se pudo eliminar el grupo', 'error'); }
          }}
          onGroupAvatarChange={(url: string) => {
            if (!showContactProfile?.id) return;
            const gid = showContactProfile.id?.toString();
            setAllGroups(prev => {
              const updated = prev.map(g => g.id?.toString() === gid ? { ...g, avatarUrl: url } : g);
              try { localStorage.setItem('egchat_groups', JSON.stringify(updated)); } catch {}
              return updated;
            });
            setRealChats((prev: any[]) => prev.map(c => c.id?.toString() === gid ? { ...c, avatarUrl: url } : c));
            setShowContactProfile((prev: any) => prev ? { ...prev, avatarUrl: url } : prev);
            if (selectedChat?.id?.toString() === gid) setSelectedChat((prev: any) => prev ? { ...prev, avatarUrl: url } : prev);
            // Subir avatar al backend
            try {
              fetch(`https://egchat-api.onrender.com/api/chats/${gid}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                body: JSON.stringify({ avatar_url: url }),
              }).catch(() => {});
            } catch {}
          }}
          onGroupNameChange={async (name: string) => {
            if (!showContactProfile?.id) return;
            const gid = showContactProfile.id?.toString();
            try {
              // Actualizar en backend
              await fetch(`https://egchat-api.onrender.com/api/chats/${gid}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                body: JSON.stringify({ name }),
              });
            } catch {}
            // Actualizar localmente y persistir en localStorage
            setAllGroups(prev => {
              const updated = prev.map(g => g.id?.toString() === gid ? { ...g, name } : g);
              try { localStorage.setItem('egchat_groups', JSON.stringify(updated)); } catch {}
              return updated;
            });
            setRealChats((prev: any[]) => prev.map(c => c.id?.toString() === gid ? { ...c, name } : c));
            setShowContactProfile((prev: any) => prev ? { ...prev, title: name, name } : prev);
            if (selectedChat?.id?.toString() === gid) setSelectedChat((prev: any) => prev ? { ...prev, title: name, name } : prev);
            showToast(`Nombre actualizado: ${name}`, 'success');
          }}
        />
      )}

      {/* -- MODAL RECARGA MONEDERO ------------------------------------------ */}
      {showSalaryReloadModal && <RecargaMonederoModal onClose={() => setShowSalaryReloadModal(false)} />}

      {/* -- MODAL RETIRO MONEDERO ------------------------------------------- */}
      {showCardWithdrawalModal && <RetiroMonederoModal onClose={() => setShowCardWithdrawalModal(false)} />}


      {/* -- camara EN VIVO -------------------------------------------------- */}
      {showLiveCamera && (
        <CameraModal
          chatId={liveCameraChatId}
          onClose={() => setShowLiveCamera(false)}
          onPhotoTaken={(url, chatId) => {
            setShowLiveCamera(false);
            setCameraPhoto({ url, chatId, chatTitle: '' });
            setPhotoCaption('');
            setPhotoFilter('none');
          }}
        />
      )}

      {/* -- MODAL NUEVO CHAT ------------------------------------------------ */}
      {showNewChatModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:4000,display:'flex',alignItems:'flex-end',justifyContent:'center'}}
          onClick={e=>{if(e.target===e.currentTarget){setShowNewChatModal(false);setNewChatPhone('');}}}>
          <div onClick={e=>e.stopPropagation()} style={{width:'100%',maxWidth:'420px',background:'#fff',borderRadius:'20px 20px 0 0',padding:'20px 16px 32px'}}>
            <div style={{width:'36px',height:'4px',borderRadius:'2px',background:'#e5e7eb',margin:'0 auto 16px'}}/>
            <div style={{fontSize:'16px',fontWeight:'700',color:'#111827',marginBottom:'6px',display:'flex',alignItems:'center',gap:'8px'}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00c8a0" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              Nuevo Chat
            </div>
            <div style={{fontSize:'12px',color:'#6b7280',marginBottom:'12px'}}>Busca por nmero de teléfono o nombre</div>

            {/* Buscar desde contactos existentes */}
            {allContacts.length > 0 && (
              <div style={{marginBottom:'12px'}}>
                <div style={{fontSize:'11px',color:'#9ca3af',fontWeight:'600',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'8px'}}>Tus contactos</div>
                <div style={{display:'flex',flexDirection:'column',gap:'4px',maxHeight:'160px',overflowY:'auto'}}>
                  {[...allContacts].sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })).filter(c => !newChatPhone || c.name.toLowerCase().includes(newChatPhone.toLowerCase()) || c.phone.includes(newChatPhone)).slice(0,5).map(c => (
                    <button key={c.id} onClick={async () => {
                      setNewChatSearching(true);
                      try {
                        const chat = await chatAPI.createPrivate(c.id);
                        if (chat?.id) {
                          setSelectedChat({ id: chat.id, type: 'individual', title: c.name, subtitle: 'Chat', time: '', status: c.status, initials: c.avatar, color: '#00c8a0', avatarUrl: c.avatarUrl, user_id: c.id });
                          setCurrentView('Mensajería'); setShowNewChatModal(false); setNewChatPhone(''); loadChats();
                        }
                      } catch(err: any) { showToast(err?.message || 'Error al crear chat', 'error'); }
                      finally { setNewChatSearching(false); }
                    }} style={{display:'flex',alignItems:'center',gap:'10px',padding:'8px 10px',background:'#f9fafb',border:'1px solid #f0f0f0',borderRadius:'10px',cursor:'pointer',outline:'none',textAlign:'left',fontFamily:'inherit'}}>
                      <div style={{width:'36px',height:'36px',borderRadius:'50%',background:'linear-gradient(135deg,#00c8a0,#00b4e6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:'700',color:'#fff',flexShrink:0,overflow:'hidden'}}>
                        {c.avatarUrl ? <img src={c.avatarUrl} alt={c.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/> : c.avatar}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:'14px',fontWeight:'600',color:'#111827',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.name}</div>
                        <div style={{fontSize:'12px',color:'#9ca3af'}}>{c.phone}</div>
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                    </button>
                  ))}
                </div>
                <div style={{height:'1px',background:'#f0f0f0',margin:'12px 0'}}/>
              </div>
            )}

            <div style={{fontSize:'11px',color:'#9ca3af',fontWeight:'600',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'8px'}}>O busca por teléfono</div>
            <div style={{display:'flex',alignItems:'center',background:'#f9fafb',border:'1.5px solid #e5e7eb',borderRadius:'10px',padding:'0 14px',height:'48px',gap:'10px',marginBottom:'12px'}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.8a16 16 0 0 0 6.29 6.29l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              <input
                autoFocus
                type="tel"
                placeholder="+240 555 000 000"
                value={newChatPhone}
                onChange={e=>setNewChatPhone(e.target.value)}
                onKeyDown={e=>{ if(e.key==='Enter') document.getElementById('btn-start-chat')?.click(); }}
                style={{flex:1,background:'none',border:'none',outline:'none',fontSize:'15px',color:'#111827',fontFamily:'inherit'}}
              />
            </div>
            {newChatSearching && (
              <div style={{textAlign:'center',padding:'12px',color:'#9ca3af',fontSize:'13px'}}>Buscando usuario...</div>
            )}
            <button
              id="btn-start-chat"
              disabled={newChatSearching || !newChatPhone.trim()}
              onClick={async () => {
                if (!newChatPhone.trim()) return;
                setNewChatSearching(true);
                try {
                  const users = await chatAPI.searchUsers(newChatPhone.trim());
                  if (!users || users.length === 0) {
                    showToast('Usuario no encontrado. Verifica el nmero.', 'error');
                    setNewChatSearching(false);
                    return;
                  }
                  const targetUser = users[0];
                  const chat = await chatAPI.createPrivate(targetUser.id);
                  if (chat?.id) {
                    const initials = (targetUser.full_name||targetUser.phone||'U').split(' ').map((w:string)=>w[0]).join('').slice(0,2).toUpperCase();
                    setSelectedChat({
                      id: chat.id, type: 'individual',
                      title: targetUser.full_name || targetUser.phone,
                      subtitle: 'Nuevo chat', time: '', status: 'online',
                      initials, color: '#00c8a0', phone: targetUser.phone,
                      user_id: targetUser.id,
                    });
                    setCurrentView('Mensajería'); setShowNewChatModal(false); setNewChatPhone(''); loadChats();
                  }
                } catch(err: any) {
                  showToast(err?.message || 'Error al crear el chat. El servidor puede estar iniciando.', 'error');
                } finally {
                  setNewChatSearching(false);
                }
              }}
              style={{
                width:'100%',
                background: newChatPhone.trim() && !newChatSearching ? 'linear-gradient(135deg,#00c8a0,#00b4e6)' : '#e5e7eb',
                border:'none',borderRadius:'12px',padding:'14px',
                color: newChatPhone.trim() && !newChatSearching ? '#fff' : '#9ca3af',
                fontSize:'15px',fontWeight:'700',cursor: newChatPhone.trim() && !newChatSearching ? 'pointer' : 'default',outline:'none'
              }}
            >
              {newChatSearching ? 'Buscando...' : 'Iniciar Chat'}
            </button>
            <button onClick={()=>{setShowNewChatModal(false);setNewChatPhone('');}}
              style={{width:'100%',background:'none',border:'none',color:'#9ca3af',fontSize:'13px',cursor:'pointer',outline:'none',marginTop:'10px',padding:'8px'}}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* -- MENSAJES DESTACADOS --------------------------------------------- */}
      {showStarredModal && (() => {
        const starred = starredMessages[starredChatId] || [];
        const msgs = chatMessages[starredChatId] || [];
        const starredMsgs = msgs.filter(m => starred.includes(m.id));
        const chatContact = [...allContacts, ...allGroups].find((c:any) => c.id?.toString() === starredChatId);
        return (
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:4000,display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={e=>{if(e.target===e.currentTarget)setShowStarredModal(false);}}>
            <div style={{background:'#F7F8FA',borderRadius:'20px 20px 0 0',width:'100%',maxWidth:'420px',maxHeight:'88vh',display:'flex',flexDirection:'column',overflow:'hidden'}}>
              <div style={{display:'flex',justifyContent:'center',paddingTop:'10px',paddingBottom:'4px',flexShrink:0}}><div style={{width:'36px',height:'4px',borderRadius:'2px',background:'#D1D5DB'}}/></div>
              <div style={{padding:'4px 16px 10px',display:'flex',alignItems:'center',gap:'10px',flexShrink:0,background:'#fff',borderBottom:'1px solid #F0F2F5'}}>
                <button onClick={()=>setShowStarredModal(false)} style={{background:'#EAECEF',border:'none',borderRadius:'50%',width:'30px',height:'30px',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'#6B7280',fontSize:'14px'}}>?</button>
                <div style={{flex:1}}>
                  <div style={{fontSize:'15px',fontWeight:'700',color:'#111827'}}>Mensajes destacados</div>
                  <div style={{fontSize:'11px',color:'#9CA3AF'}}>{(chatContact as any)?.title||(chatContact as any)?.name||'Chat'} ? {starredMsgs.length} mensaje{starredMsgs.length!==1?'s':''}</div>
                </div>
                <button onClick={()=>setShowStarredModal(false)} style={{background:'#EAECEF',border:'none',borderRadius:'50%',width:'28px',height:'28px',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'#6B7280',fontSize:'12px'}}>?</button>
              </div>
              <div style={{flex:1,overflowY:'auto',padding:'12px 16px 24px'}}>
                {starredMsgs.length===0 ? (
                  <div style={{textAlign:'center',padding:'50px 0',color:'#9CA3AF'}}>
                    <div style={{fontSize:'40px',marginBottom:'12px'}}>?</div>
                    <div style={{fontSize:'14px',fontWeight:'600',color:'#374151',marginBottom:'6px'}}>Sin mensajes destacados</div>
                    <div style={{fontSize:'12px'}}>Toca ? en Cuálquier mensaje para destacarlo</div>
                  </div>
                ) : starredMsgs.map(msg => (
                  <div key={msg.id} style={{background:'#fff',borderRadius:'12px',padding:'12px 14px',marginBottom:'8px',border:'1px solid #FEF3C7',boxShadow:'0 1px 3px rgba(0,0,0,0.05)'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'6px'}}>
                      <span style={{fontSize:'14px'}}>?</span>
                      <span style={{fontSize:'11px',color:'#9CA3AF',fontWeight:'600'}}>{msg.from==='me'?'T?':(chatContact as any)?.title||'Contacto'} ? {msg.time}</span>
                      <button onClick={()=>setStarredMessages(prev=>{const cur=prev[starredChatId]||[];return{...prev,[starredChatId]:cur.filter(x=>x!==msg.id)};})} style={{marginLeft:'auto',background:'none',border:'none',cursor:'pointer',color:'#F59E0B',fontSize:'14px',padding:0}}>?</button>
                    </div>
                    <div style={{fontSize:'13px',color:'#111827',lineHeight:'1.4'}}>{msg.text}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* -- EDITOR DE FOTO -------------------------------------------------- */}

      {cameraPhoto && (
        <PhotoEditorModal
          photoUrl={cameraPhoto.url}
          chatId={cameraPhoto.chatId}
          onClose={() => setCameraPhoto(null)}
          onSend={(chatId, caption, editedUrl) => {
            const now = new Date();
            const time = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
            const imageUrl = editedUrl || cameraPhoto?.url || '';
            const msgId = Date.now().toString();
            setChatMessages(prev => ({ ...prev, [chatId]: [...(prev[chatId]||[]), {
              id: msgId, from: 'me' as const,
              text: caption ? `📷 ${caption}` : '📌 Foto',
              time, status: 'pending' as const,
              type: 'image' as any,
              imageUrl
            }] }));
            setTimeout(() => setChatMessages(prev => ({ ...prev, [chatId]: (prev[chatId]||[]).map(m => m.id===msgId ? {...m, status:'delivered'} : m) })), 1000);
            setTimeout(() => setChatMessages(prev => ({ ...prev, [chatId]: (prev[chatId]||[]).map(m => m.id===msgId ? {...m, status:'read'} : m) })), 3000);
            setCameraPhoto(null);
            setPhotoCaption('');
            setPhotoFilter('none');
          }}
        />
      )}

      </div>{/* fin contenido principal */}
    </div>
  );
};



export default App;








