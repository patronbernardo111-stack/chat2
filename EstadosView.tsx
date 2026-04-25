import React, { useState, useRef, useEffect, useCallback } from 'react';

interface Reaction { emoji: string; count: number; reacted: boolean; }
interface Reply { id: string; user: string; text: string; time: string; }
interface StoryMedia { type: 'text' | 'video' | 'clip'; content: string; bg: string; emoji?: string; music?: string; duration?: number; }
interface Story {
  id: string; userId: string; userName: string; avatar: string; color: string;
  media: StoryMedia[]; time: string; seen: boolean; views: number;
  reactions: Reaction[]; replies: Reply[]; trending?: boolean; isLive?: boolean;
  publishedAt: number; // timestamp ms
}
interface EspacioPost { id: string; author: string; avatar: string; color: string; text: string; time: string; likes: number; comments: number; liked: boolean; }
interface Espacio { id: string; name: string; cover: string; emoji: string; description: string; type: 'publico' | 'comunidad'; followers: number; following: boolean; posts: EspacioPost[]; }
interface Props { onBack: () => void; }
type CreateMode = 'text' | 'video' | 'clip' | 'live' | null;

const NOW = Date.now();
const H = 3600000; // 1 hora en ms

const STORIES: Story[] = [
  { id: '1', userId: 'me', userName: 'Mi estado', avatar: 'JP', color: '#00c8a0', media: [], time: '', seen: false, views: 0, reactions: [], replies: [], publishedAt: NOW },
  { id: '2', userId: '2', userName: 'Maria Lopez', avatar: 'ML', color: '#ec4899', media: [
    { type: 'text', content: 'Buenos dias Guinea!', bg: 'linear-gradient(135deg,#f472b6,#ec4899)', emoji: '🌅', music: 'Afrobeat Vibes' },
    { type: 'text', content: 'Desayuno en Malabo', bg: 'linear-gradient(135deg,#f59e0b,#ef4444)', emoji: '☕' },
    { type: 'text', content: 'Hoy es un gran dia', bg: 'linear-gradient(135deg,#8b5cf6,#ec4899)', emoji: '💯', music: 'Makossa Mix' },
    { type: 'text', content: 'Guinea Ecuatorial', bg: 'linear-gradient(135deg,#059669,#0369a1)', emoji: '🇬🇶' },
    { type: 'text', content: 'Hasta manana amigos', bg: 'linear-gradient(135deg,#1e1b4b,#312e81)', emoji: '🌙' },
  ], time: '10m', seen: false, views: 47, reactions: [{ emoji: '❤️', count: 12, reacted: false }, { emoji: '🔥', count: 8, reacted: false }], replies: [{ id: 'r1', user: 'Carlos', text: 'Buenos dias!', time: '8m' }], trending: true, publishedAt: NOW - 10 * 60000 },
  { id: '3', userId: '3', userName: 'Carlos Mba', avatar: 'CM', color: '#f59e0b', media: [
    { type: 'text', content: 'Malabo siempre hermosa', bg: 'linear-gradient(135deg,#f59e0b,#ef4444)', emoji: '🌍' },
    { type: 'text', content: 'Partido de futbol hoy', bg: 'linear-gradient(135deg,#10b981,#059669)', emoji: '⚽', music: 'Guinea Hits' },
    { type: 'text', content: 'Victoria! 3-0', bg: 'linear-gradient(135deg,#f59e0b,#d97706)', emoji: '🏆' },
  ], time: '25m', seen: false, views: 89, reactions: [{ emoji: '❤️', count: 20, reacted: false }, { emoji: '🔥', count: 15, reacted: false }], replies: [], trending: true, publishedAt: NOW - 25 * 60000 },
  { id: '4', userId: '4', userName: 'Ana Nguema', avatar: 'AN', color: '#8b5cf6', media: [{ type: 'text', content: 'Nuevo dia, nuevas metas', bg: 'linear-gradient(135deg,#8b5cf6,#6366f1)', emoji: '💪', music: 'Motivacion Mix' }], time: '1h', seen: true, views: 134, reactions: [{ emoji: '💪', count: 30, reacted: false }], replies: [], publishedAt: NOW - 1 * H },
  { id: '5', userId: '5', userName: 'Pedro Esono', avatar: 'PE', color: '#06b6d4', media: [{ type: 'text', content: 'GE siempre en mi corazon', bg: 'linear-gradient(135deg,#06b6d4,#3b82f6)', emoji: '❤️' }], time: '2h', seen: true, views: 201, reactions: [{ emoji: '❤️', count: 45, reacted: true }], replies: [], publishedAt: NOW - 2 * H },
  { id: '6', userId: '6', userName: 'Sofia Abeso', avatar: 'SA', color: '#10b981', media: [{ type: 'text', content: 'Fin de semana perfecto', bg: 'linear-gradient(135deg,#10b981,#059669)', emoji: '☀️' }], time: '3h', seen: true, views: 312, reactions: [{ emoji: '☀️', count: 55, reacted: false }], replies: [], trending: true, publishedAt: NOW - 3 * H },
];

const EXPIRY = 24 * H; // 24 horas

const timeAgo = (ts: number): string => {
  const diff = Date.now() - ts;
  if (diff < 60000) return 'ahora';
  if (diff < H) return `${Math.floor(diff / 60000)}m`;
  if (diff < 24 * H) return `${Math.floor(diff / H)}h`;
  return '24h';
};

const timeLeft = (ts: number): string => {
  const remaining = EXPIRY - (Date.now() - ts);
  if (remaining <= 0) return 'Expirado';
  const h = Math.floor(remaining / H);
  const m = Math.floor((remaining % H) / 60000);
  if (h > 0) return `${h}h ${m}m restantes`;
  return `${m}m restantes`;
};

const ESPACIOS: Espacio[] = [
  { id: 'e1', name: 'Gobierno GE', cover: 'linear-gradient(135deg,#1e3a5f,#0369a1)', emoji: '🏛️', description: 'Noticias y comunicados oficiales del Gobierno de Guinea Ecuatorial', type: 'publico', followers: 48200, following: true, posts: [
    { id: 'p1', author: 'Gobierno GE', avatar: '🏛️', color: '#0369a1', text: 'Nueva infraestructura vial en Malabo. El presidente inaugura el tramo norte de la autopista.', time: '2h', likes: 1240, comments: 89, liked: false },
    { id: 'p2', author: 'Gobierno GE', avatar: '🏛️', color: '#0369a1', text: 'Convocatoria de becas universitarias 2026. Plazo hasta el 30 de abril.', time: '5h', likes: 3400, comments: 210, liked: true },
  ]},
  { id: 'e2', name: 'Musica GQ', cover: 'linear-gradient(135deg,#7c3aed,#db2777)', emoji: '🎵', description: 'Lo mejor de la musica de Guinea Ecuatorial y Africa Central', type: 'comunidad', followers: 12800, following: false, posts: [
    { id: 'p3', author: 'DJ Malabo', avatar: 'DM', color: '#7c3aed', text: 'Nueva mezcla de Afrobeat + Makossa disponible ahora', time: '1h', likes: 567, comments: 43, liked: false },
    { id: 'p4', author: 'Bata Sounds', avatar: 'BS', color: '#db2777', text: 'Concierto en vivo este sabado en la Plaza de la Independencia. Entrada libre', time: '3h', likes: 892, comments: 156, liked: false },
    { id: 'p5', author: 'AfroGE', avatar: 'AG', color: '#f59e0b', text: 'Votad: cual es el mejor artista de GE este 2026? Comentad abajo', time: '6h', likes: 1100, comments: 340, liked: true },
  ]},
  { id: 'e3', name: 'Mercado Malabo', cover: 'linear-gradient(135deg,#059669,#0d9488)', emoji: '🛒', description: 'Compra, vende e intercambia en Guinea Ecuatorial', type: 'comunidad', followers: 31500, following: true, posts: [
    { id: 'p6', author: 'Tienda Nguema', avatar: 'TN', color: '#059669', text: 'Vendo moto Honda 2023 en perfecto estado. 850.000 XAF. Contactar por mensaje privado', time: '30m', likes: 23, comments: 8, liked: false },
    { id: 'p7', author: 'Moda GE', avatar: 'MG', color: '#0d9488', text: 'Nueva coleccion de telas africanas. Precios desde 5.000 XAF', time: '2h', likes: 145, comments: 32, liked: false },
  ]},
  { id: 'e4', name: 'Deportes GQ', cover: 'linear-gradient(135deg,#dc2626,#f59e0b)', emoji: '⚽', description: 'Futbol, baloncesto y todos los deportes de Guinea Ecuatorial', type: 'publico', followers: 22100, following: false, posts: [
    { id: 'p8', author: 'FutbolGE', avatar: 'FG', color: '#dc2626', text: 'Nzalang Nacional convocatoria para la Copa Africa 2026. Lista de 23 jugadores publicada', time: '4h', likes: 4200, comments: 520, liked: false },
    { id: 'p9', author: 'BasketGE', avatar: 'BG', color: '#f59e0b', text: 'Liga Nacional de Baloncesto arranca el proximo mes. 8 equipos', time: '8h', likes: 890, comments: 67, liked: false },
  ]},
  { id: 'e5', name: 'Tecnologia GE', cover: 'linear-gradient(135deg,#1e40af,#7c3aed)', emoji: '💻', description: 'Innovacion, startups y tecnologia en Guinea Ecuatorial', type: 'comunidad', followers: 8900, following: true, posts: [
    { id: 'p10', author: 'TechMalabo', avatar: 'TM', color: '#1e40af', text: 'EGCHAT lanza Espacio Dulce, MiTaxi y CEMAC Market. La super-app de GE sigue creciendo', time: '1h', likes: 678, comments: 94, liked: true },
  ]},
];

const BG_OPTIONS = [
  'linear-gradient(135deg,#f472b6,#ec4899)', 'linear-gradient(135deg,#00c8a0,#00b4e6)',
  'linear-gradient(135deg,#f59e0b,#ef4444)', 'linear-gradient(135deg,#8b5cf6,#6366f1)',
  'linear-gradient(135deg,#06b6d4,#3b82f6)', 'linear-gradient(135deg,#10b981,#059669)',
  'linear-gradient(135deg,#374151,#111827)', 'linear-gradient(135deg,#7c3aed,#db2777)',
];
const EMOJI_OPTIONS = ['🔥','❤️','😍','💪','🌍','☀️','🎉','💯','🙌','✨','🇬🇶','🎵'];
const MUSIC_OPTIONS = ['Afrobeat Vibes','Makossa Mix','Chill Sunday','Motivacion Mix','Guinea Hits','Sin musica'];

const formatFollowers = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : String(n);

// ─── Pool de noticias simuladas por espacio ───────────────────────────────────
const NEWS_POOL: Record<string, { author: string; avatar: string; color: string; text: string }[]> = {
  e1: [
    { author: 'Gobierno GE', avatar: '🏛️', color: '#0369a1', text: 'El Ministerio de Sanidad anuncia nueva campana de vacunacion gratuita en todo el territorio nacional.' },
    { author: 'Gobierno GE', avatar: '🏛️', color: '#0369a1', text: 'Aprobado el presupuesto nacional 2026. Prioridad en educacion e infraestructuras.' },
    { author: 'Presidencia GE', avatar: '🏛️', color: '#1e3a5f', text: 'El Presidente recibe a delegacion de inversores internacionales en el Palacio del Pueblo.' },
    { author: 'Ministerio Educacion', avatar: '📚', color: '#0369a1', text: 'Apertura de 12 nuevas escuelas en zonas rurales de Bioko Sur y Litoral.' },
    { author: 'Gobierno GE', avatar: '🏛️', color: '#0369a1', text: 'Guinea Ecuatorial firma acuerdo de cooperacion energetica con tres paises africanos.' },
    { author: 'Ministerio Interior', avatar: '🛡️', color: '#1e3a5f', text: 'Nuevo sistema de identificacion digital para ciudadanos. Tramite disponible en todas las delegaciones.' },
  ],
  e2: [
    { author: 'DJ Malabo', avatar: 'DM', color: '#7c3aed', text: 'Nuevo tema disponible: "Malabo de Noche" feat. Artistas de Camerun y GE. Escuchalo ahora.' },
    { author: 'AfroGE Records', avatar: 'AG', color: '#db2777', text: 'Festival de Musica Africana en Bata confirmado para julio 2026. Mas de 20 artistas.' },
    { author: 'Bata Sounds', avatar: 'BS', color: '#db2777', text: 'Colaboracion historica: artistas de GE, Camerun y Gabon graban album conjunto.' },
    { author: 'Radio Malabo', avatar: 'RM', color: '#7c3aed', text: 'Top 10 canciones mas escuchadas esta semana en Guinea Ecuatorial. El Makossa lidera.' },
    { author: 'AfroGE', avatar: 'AG', color: '#f59e0b', text: 'Nuevo estudio de grabacion profesional abre en Malabo. Precios accesibles para artistas locales.' },
  ],
  e3: [
    { author: 'Mercado Central', avatar: 'MC', color: '#059669', text: 'Precios del mercado hoy: Yuca 500 XAF/kg, Platano 300 XAF, Pescado fresco desde 1.200 XAF.' },
    { author: 'Importaciones GE', avatar: 'IG', color: '#0d9488', text: 'Nuevo lote de electrodomesticos disponible en el puerto de Malabo. Precios competitivos.' },
    { author: 'Tienda Nguema', avatar: 'TN', color: '#059669', text: 'OFERTA: Telefono Samsung A55 nuevo, 180.000 XAF. Solo esta semana.' },
    { author: 'Moda GE', avatar: 'MG', color: '#0d9488', text: 'Coleccion de ropa tradicional para fiestas patrias. Reserva ya tu traje.' },
    { author: 'Mercado Malabo', avatar: 'MM', color: '#059669', text: 'Se busca local comercial en zona centro Malabo. Contactar por mensaje privado.' },
  ],
  e4: [
    { author: 'FutbolGE', avatar: 'FG', color: '#dc2626', text: 'Nzalang Nacional 2-0 en el primer tiempo. Partido en curso contra Camerun.' },
    { author: 'BasketGE', avatar: 'BG', color: '#f59e0b', text: 'Malabo Kings gana la final de la Liga Nacional de Baloncesto 2026. Campeon!' },
    { author: 'FutbolGE', avatar: 'FG', color: '#dc2626', text: 'Nuevo estadio de futbol en Bata: capacidad para 15.000 espectadores. Obras al 70%.' },
    { author: 'DeportesGE', avatar: 'DG', color: '#f59e0b', text: 'Atleta guineana clasifica para los Juegos Africanos 2026 en atletismo.' },
    { author: 'FutbolGE', avatar: 'FG', color: '#dc2626', text: 'Convocatoria Sub-20: 25 jugadores seleccionados para el torneo CEMAC juvenil.' },
  ],
  e5: [
    { author: 'TechMalabo', avatar: 'TM', color: '#1e40af', text: 'EGCHAT supera los 500.000 usuarios activos. La app mas descargada de Guinea Ecuatorial.' },
    { author: 'StartupGE', avatar: 'SG', color: '#7c3aed', text: 'Primera incubadora de startups de GE abre convocatoria. 10 proyectos seleccionados recibiran financiacion.' },
    { author: 'TechMalabo', avatar: 'TM', color: '#1e40af', text: 'Cobertura 5G llega a Malabo y Bata. Velocidades de hasta 1Gbps disponibles.' },
    { author: 'InnovaGE', avatar: 'IG', color: '#7c3aed', text: 'Estudiantes de la UNGE desarrollan app de pagos moviles para el mercado local.' },
    { author: 'TechMalabo', avatar: 'TM', color: '#1e40af', text: 'Taller gratuito de programacion para jovenes en Malabo. Inscripciones abiertas.' },
  ],
};

// Devuelve un post nuevo aleatorio para un espacio dado
const getRandomPost = (espacioId: string): EspacioPost => {
  const pool = NEWS_POOL[espacioId] ?? [];
  const item = pool[Math.floor(Math.random() * pool.length)];
  return {
    id: `auto-${Date.now()}-${Math.random()}`,
    author: item.author,
    avatar: item.avatar,
    color: item.color,
    text: item.text,
    time: 'ahora',
    likes: Math.floor(Math.random() * 200),
    comments: Math.floor(Math.random() * 40),
    liked: false,
  };
};
// ─────────────────────────────────────────────────────────────────────────────

const ESPACIO_ICONS: Record<string, React.ReactNode> = {
  'Gobierno GE': <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"><path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 10v11M12 10v11M16 10v11"/></svg>,
  'Musica GQ': <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>,
  'Mercado Malabo': <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
  'Deportes GQ': <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M2 12h20"/></svg>,
  'Tecnologia GE': <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>,
};

const EspacioIcon: React.FC<{ name: string }> = ({ name }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.9 }}>
    {ESPACIO_ICONS[name] ?? <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>}
  </div>
);

const Icon = {
  back: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  close: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  send: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  text: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  clip: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>,
  video: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>,
  live: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49"/><path d="M7.76 7.76a6 6 0 0 0 0 8.49"/><path d="M20.07 4.93a10 10 0 0 1 0 14.14"/><path d="M3.93 4.93a10 10 0 0 0 0 14.14"/></svg>,
  eye: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  music: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>,
  chat: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  plus: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  stop: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>,
  rec: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="8" fill="currentColor"/></svg>,
  heart: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  comment: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
};

// ─── Subcomponente editor de video (evita hooks dentro de IIFE) ───────────────
interface VideoEditorProps {
  recordedUrl: string;
  recordSeconds: number;
  videoFilter: string; setVideoFilter: (v: string) => void;
  videoOverlay: string; setVideoOverlay: (v: string) => void;
  videoCaption: string; setVideoCaption: (v: string) => void;
  videoSpeed: number; setVideoSpeed: (v: number) => void;
  videoMuted: boolean; setVideoMuted: (v: boolean) => void;
  trimStart: number; setTrimStart: (v: number) => void;
  trimEnd: number; setTrimEnd: (v: number) => void;
  editVideoRef: React.RefObject<HTMLVideoElement | null>;
  VIDEO_FILTERS: { id: string; label: string; css: string }[];
  VIDEO_OVERLAYS: { id: string; label: string }[];
  onNewTake: () => void;
  onPublish: () => void;
}

const VideoEditor: React.FC<VideoEditorProps> = ({
  recordedUrl, videoFilter, setVideoFilter, videoOverlay, setVideoOverlay,
  videoCaption, setVideoCaption, videoSpeed, setVideoSpeed, videoMuted, setVideoMuted,
  trimStart, setTrimStart, trimEnd, setTrimEnd, editVideoRef,
  VIDEO_FILTERS, VIDEO_OVERLAYS, onNewTake, onPublish,
}) => {
  const [editorTab, setEditorTab] = useState<'filtros' | 'efectos' | 'texto' | 'recorte' | 'audio'>('filtros');
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#0a0a0a' }}>
      {/* Preview */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <video ref={editVideoRef} src={recordedUrl} loop autoPlay muted={videoMuted}
          style={{ width: '100%', height: '100%', objectFit: 'contain', filter: VIDEO_FILTERS.find(f => f.id === videoFilter)?.css || 'none' }}
          onLoadedMetadata={e => { (e.target as HTMLVideoElement).playbackRate = videoSpeed; }} />
        {videoOverlay && <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: '64px', pointerEvents: 'none', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))' }}>{videoOverlay}</div>}
        {videoCaption && <div style={{ position: 'absolute', bottom: '20px', left: '16px', right: '16px', background: 'rgba(0,0,0,0.55)', borderRadius: '8px', padding: '8px 12px', color: '#fff', fontSize: '14px', fontWeight: '600', textAlign: 'center', lineHeight: 1.4 }}>{videoCaption}</div>}
        {videoSpeed !== 1 && <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.6)', borderRadius: '8px', padding: '3px 8px', color: '#00c8a0', fontSize: '12px', fontWeight: '800' }}>{videoSpeed}x</div>}
      </div>
      {/* Herramientas */}
      <div style={{ background: '#111', borderTop: '1px solid #222', flexShrink: 0 }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #222' }}>
          {([
            { id: 'filtros', label: 'Filtros', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg> },
            { id: 'efectos', label: 'Efectos', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
            { id: 'texto',   label: 'Texto',   icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg> },
            { id: 'recorte', label: 'Recorte', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="6" y1="2" x2="6" y2="22"/><line x1="18" y1="2" x2="18" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/></svg> },
            { id: 'audio',   label: 'Audio',   icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg> },
          ] as const).map(t => (
            <button key={t.id} onClick={() => setEditorTab(t.id)} style={{ flex: 1, padding: '10px 4px', background: 'none', border: 'none', cursor: 'pointer', color: editorTab === t.id ? '#00c8a0' : '#666', fontSize: '10px', fontWeight: '700', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', borderBottom: editorTab === t.id ? '2px solid #00c8a0' : '2px solid transparent' }}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>
        <div style={{ padding: '12px 12px 8px', minHeight: '80px' }}>
          {editorTab === 'filtros' && (
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
              {VIDEO_FILTERS.map(f => (
                <div key={f.id} onClick={() => setVideoFilter(f.id)} style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  <div style={{ width: '52px', height: '52px', borderRadius: '10px', background: 'linear-gradient(135deg,#1a1a2e,#16213e)', border: `2px solid ${videoFilter === f.id ? '#00c8a0' : '#333'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', filter: f.css }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  </div>
                  <span style={{ fontSize: '10px', color: videoFilter === f.id ? '#00c8a0' : '#666', fontWeight: videoFilter === f.id ? '700' : '400' }}>{f.label}</span>
                </div>
              ))}
            </div>
          )}
          {editorTab === 'efectos' && (
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
              {VIDEO_OVERLAYS.map(o => (
                <div key={o.id} onClick={() => setVideoOverlay(o.id)} style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  <div style={{ width: '52px', height: '52px', borderRadius: '10px', background: '#1a1a1a', border: `2px solid ${videoOverlay === o.id ? '#00c8a0' : '#333'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: o.id ? '24px' : '12px', color: '#666' }}>
                    {o.id || <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>}
                  </div>
                  <span style={{ fontSize: '10px', color: videoOverlay === o.id ? '#00c8a0' : '#666', fontWeight: videoOverlay === o.id ? '700' : '400' }}>{o.label}</span>
                </div>
              ))}
            </div>
          )}
          {editorTab === 'texto' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input value={videoCaption} onChange={e => setVideoCaption(e.target.value)} placeholder="Escribe un texto sobre el video..." maxLength={80} style={{ width: '100%', padding: '10px 12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
              {videoCaption && <button onClick={() => setVideoCaption('')} style={{ alignSelf: 'flex-start', padding: '4px 10px', background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '8px', color: '#aaa', fontSize: '11px', cursor: 'pointer' }}>Quitar texto</button>}
            </div>
          )}
          {editorTab === 'recorte' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '11px', color: '#666', fontWeight: '600' }}>INICIO — {trimStart}%</div>
              <input type="range" min={0} max={trimEnd - 5} value={trimStart} onChange={e => setTrimStart(Number(e.target.value))} style={{ width: '100%', accentColor: '#00c8a0' }} />
              <div style={{ fontSize: '11px', color: '#666', fontWeight: '600' }}>FIN — {trimEnd}%</div>
              <input type="range" min={trimStart + 5} max={100} value={trimEnd} onChange={e => setTrimEnd(Number(e.target.value))} style={{ width: '100%', accentColor: '#00c8a0' }} />
              <div style={{ height: '6px', background: '#222', borderRadius: '3px', position: 'relative' }}>
                <div style={{ position: 'absolute', left: `${trimStart}%`, right: `${100 - trimEnd}%`, top: 0, bottom: 0, background: '#00c8a0', borderRadius: '3px' }} />
              </div>
            </div>
          )}
          {editorTab === 'audio' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', color: '#ccc', fontWeight: '600' }}>Silenciar audio original</span>
                <button onClick={() => setVideoMuted(!videoMuted)} style={{ width: '44px', height: '24px', borderRadius: '12px', background: videoMuted ? '#00c8a0' : '#333', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                  <div style={{ position: 'absolute', top: '2px', left: videoMuted ? '22px' : '2px', width: '20px', height: '20px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                </button>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#666', fontWeight: '600', marginBottom: '8px' }}>VELOCIDAD</div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[0.5, 0.75, 1, 1.5, 2].map(s => (
                    <button key={s} onClick={() => { setVideoSpeed(s); if (editVideoRef.current) editVideoRef.current.playbackRate = s; }} style={{ flex: 1, padding: '7px 0', borderRadius: '8px', border: `1.5px solid ${videoSpeed === s ? '#00c8a0' : '#333'}`, background: videoSpeed === s ? 'rgba(0,200,160,0.15)' : '#1a1a1a', color: videoSpeed === s ? '#00c8a0' : '#666', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                      {s}x
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Botones acción */}
      <div style={{ padding: '10px 16px 90px', background: '#0a0a0a', display: 'flex', gap: '10px', flexShrink: 0 }}>
        <button onClick={onNewTake} style={{ flex: 1, padding: '13px', background: 'rgba(255,255,255,0.08)', border: '1px solid #333', borderRadius: '12px', color: '#fff', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>
          Nueva toma
        </button>
        <button onClick={onPublish} style={{ flex: 1, padding: '13px', background: '#00c8a0', border: 'none', borderRadius: '12px', color: '#fff', cursor: 'pointer', fontWeight: '700', fontSize: '14px' }}>
          Publicar
        </button>
      </div>
    </div>
  );
};
// ─────────────────────────────────────────────────────────────────────────────

export const EstadosView: React.FC<Props> = ({ onBack }) => {
  const [stories, setStories] = useState<Story[]>(STORIES);
  const [viewing, setViewing] = useState<Story | null>(null);
  const [slideIdx, setSlideIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [replyText, setReplyText] = useState('');
  const [showReplies, setShowReplies] = useState(false);
  const [activeTab, setActiveTab] = useState<'recientes' | 'vistos' | 'dulce'>('recientes');
  const [espacios, setEspacios] = useState<Espacio[]>(ESPACIOS);
  const [activeEspacio, setActiveEspacio] = useState<Espacio | null>(null);
  const [createMode, setCreateMode] = useState<CreateMode>(null);
  const [newText, setNewText] = useState('');
  const [newBg, setNewBg] = useState(BG_OPTIONS[0]);
  const [newEmoji, setNewEmoji] = useState('');
  const [newMusic, setNewMusic] = useState('Sin musica');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState('');
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [isLive, setIsLive] = useState(false);
  const [liveViewers, setLiveViewers] = useState(0);
  const [camError, setCamError] = useState('');
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [creatingEspacio, setCreatingEspacio] = useState(false);
  const [newEspacioStep, setNewEspacioStep] = useState<1 | 2>(1);
  const [newEspacioType, setNewEspacioType] = useState<'publico' | 'comunidad'>('publico');
  const [newEspacioName, setNewEspacioName] = useState('');
  const [newEspacioDesc, setNewEspacioDesc] = useState('');
  const [newEspacioCover, setNewEspacioCover] = useState(0);

  // Auto-actualización Espacio Dulce
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());
  const [newPostsBadge, setNewPostsBadge] = useState<Record<string, number>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Editor de video
  const [processingVideo, setProcessingVideo] = useState(false);
  const [videoFilter, setVideoFilter] = useState('none');
  const [videoOverlay, setVideoOverlay] = useState('');
  const [videoCaption, setVideoCaption] = useState('');
  const [videoSpeed, setVideoSpeed] = useState(1);
  const [videoMuted, setVideoMuted] = useState(false);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(100);
  const editVideoRef = useRef<HTMLVideoElement>(null);

  const VIDEO_FILTERS: { id: string; label: string; css: string }[] = [
    { id: 'none',    label: 'Original', css: 'none' },
    { id: 'vivid',   label: 'Vivo',     css: 'saturate(1.8) contrast(1.1)' },
    { id: 'warm',    label: 'Calido',   css: 'sepia(0.4) saturate(1.4) brightness(1.05)' },
    { id: 'cool',    label: 'Frio',     css: 'hue-rotate(200deg) saturate(1.2)' },
    { id: 'bw',      label: 'B&N',      css: 'grayscale(1)' },
    { id: 'fade',    label: 'Fade',     css: 'brightness(1.15) saturate(0.7) contrast(0.9)' },
    { id: 'drama',   label: 'Drama',    css: 'contrast(1.4) saturate(1.3) brightness(0.9)' },
    { id: 'vintage', label: 'Vintage',  css: 'sepia(0.6) contrast(1.1) brightness(0.95) saturate(0.8)' },
    { id: 'neon',    label: 'Neon',     css: 'saturate(2.5) hue-rotate(30deg) contrast(1.2)' },
    { id: 'sunset',  label: 'Sunset',   css: 'sepia(0.3) saturate(2) hue-rotate(-20deg) brightness(1.1)' },
  ];

  const VIDEO_OVERLAYS = [
    { id: '', label: 'Ninguno' },
    { id: '🔥', label: 'Fuego' },
    { id: '✨', label: 'Brillo' },
    { id: '🌊', label: 'Ola' },
    { id: '🎵', label: 'Musica' },
    { id: '💫', label: 'Estrella' },
    { id: '🇬🇶', label: 'GE' },
  ];

  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const mediaRec = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const recTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const liveTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { stopCam(); if (progressTimer.current) clearInterval(progressTimer.current); }, []);
  useEffect(() => { if (cameraStream && videoRef.current) videoRef.current.srcObject = cameraStream; }, [cameraStream, createMode]);

  // Limpieza automática cada minuto — elimina estados expirados (>24h)
  useEffect(() => {
    const tick = setInterval(() => {
      setStories(prev => prev.map(s =>
        s.userId !== 'me' && Date.now() - s.publishedAt > EXPIRY
          ? { ...s, media: [] }  // vacía los slides, mantiene el contacto
          : s
      ));
    }, 60000);
    return () => clearInterval(tick);
  }, []);

  // Auto-actualización Espacio Dulce — cada 30s inyecta un post nuevo en un espacio aleatorio
  useEffect(() => {
    const autoUpdate = setInterval(() => {
      const ids = Object.keys(NEWS_POOL);
      const targetId = ids[Math.floor(Math.random() * ids.length)];
      const newPost = getRandomPost(targetId);
      setEspacios(prev => prev.map(e =>
        e.id === targetId ? { ...e, posts: [newPost, ...e.posts].slice(0, 20) } : e
      ));
      setActiveEspacio(prev =>
        prev?.id === targetId ? { ...prev, posts: [newPost, ...prev.posts].slice(0, 20) } : prev
      );
      setNewPostsBadge(prev => ({ ...prev, [targetId]: (prev[targetId] ?? 0) + 1 }));
      setLastUpdated(Date.now());
    }, 30000);
    return () => clearInterval(autoUpdate);
  }, []);

  const stopCam = useCallback(() => {
    cameraStream?.getTracks().forEach(t => t.stop());
    setCameraStream(null);
    if (recTimer.current) clearInterval(recTimer.current);
    if (liveTimer.current) clearInterval(liveTimer.current);
    setIsRecording(false); setIsLive(false); setRecordSeconds(0); setLiveViewers(0);
  }, [cameraStream]);

  const startCam = async () => {
    setCamError('');
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true });
      setCameraStream(s);
    } catch { setCamError('Sin acceso a la camara. Verifica los permisos.'); }
  };

  const openCreate = async (mode: CreateMode) => {
    setCreateMode(mode); setRecordedUrl(''); setRecordSeconds(0); setCamError('');
    if (mode !== 'text') await startCam();
  };

  const closeCreate = () => { stopCam(); setCreateMode(null); setNewText(''); setNewEmoji(''); setNewMusic('Sin musica'); setRecordedUrl(''); };

  const startRec = () => {
    if (!cameraStream) return;
    chunks.current = [];
    const mr = new MediaRecorder(cameraStream, { mimeType: 'video/webm;codecs=vp8,opus' });
    mr.ondataavailable = e => { if (e.data.size > 0) chunks.current.push(e.data); };
    mr.onstop = () => {
      const b = new Blob(chunks.current, { type: 'video/webm' });
      const url = URL.createObjectURL(b);
      setProcessingVideo(false);
      setRecordedUrl(url);
    };
    const max = createMode === 'clip' ? 15 : 60;
    mr.start(); mediaRec.current = mr; setIsRecording(true); setRecordSeconds(0);
    recTimer.current = setInterval(() => setRecordSeconds(s => {
      if (s + 1 >= max) { stopRec(); return max; }
      return s + 1;
    }), 1000);
  };

  const stopRec = () => {
    if (recTimer.current) { clearInterval(recTimer.current); recTimer.current = null; }
    setIsRecording(false);
    if (mediaRec.current && mediaRec.current.state !== 'inactive') {
      setProcessingVideo(true);
      mediaRec.current.stop();
    }
  };

  const startLive = () => {
    setIsLive(true); setLiveViewers(1);
    liveTimer.current = setInterval(() => setLiveViewers(v => v + Math.floor(Math.random() * 3)), 2000);
  };

  const stopLive = () => {
    if (liveTimer.current) clearInterval(liveTimer.current);
    setIsLive(false);
    setStories(prev => prev.map(s => s.userId === 'me' ? { ...s, media: [...s.media, { type: 'text' as const, content: `En vivo terminado - ${liveViewers} espectadores`, bg: 'linear-gradient(135deg,#dc2626,#7c3aed)' }], time: 'ahora', publishedAt: Date.now() } : s));
    closeCreate();
  };

  const publishVideo = () => {
    if (!recordedUrl) return;
    setStories(prev => prev.map(s => s.userId === 'me' ? { ...s, media: [...s.media, { type: createMode as 'video' | 'clip', content: recordedUrl, bg: '#000', duration: recordSeconds }], time: 'ahora', publishedAt: Date.now() } : s));
    closeCreate();
  };

  const publishText = () => {
    if (!newText.trim()) return;
    setStories(prev => prev.map(s => s.userId === 'me' ? { ...s, media: [...s.media, { type: 'text' as const, content: newText, bg: newBg, emoji: newEmoji, music: newMusic !== 'Sin musica' ? newMusic : undefined }], time: 'ahora', publishedAt: Date.now() } : s));
    closeCreate();
  };

  const COVER_OPTIONS = [
    'linear-gradient(135deg,#1e3a5f,#0369a1)',
    'linear-gradient(135deg,#7c3aed,#db2777)',
    'linear-gradient(135deg,#059669,#0d9488)',
    'linear-gradient(135deg,#dc2626,#f59e0b)',
    'linear-gradient(135deg,#1e40af,#7c3aed)',
    'linear-gradient(135deg,#374151,#111827)',
    'linear-gradient(135deg,#00c8a0,#00b4e6)',
    'linear-gradient(135deg,#f59e0b,#ef4444)',
  ];

  const publishEspacio = () => {
    if (!newEspacioName.trim()) return;
    const nuevo: Espacio = {
      id: `e${Date.now()}`,
      name: newEspacioName.trim(),
      cover: COVER_OPTIONS[newEspacioCover],
      emoji: newEspacioType === 'publico' ? '📢' : '👥',
      description: newEspacioDesc.trim() || `${newEspacioType === 'publico' ? 'Canal' : 'Comunidad'} creado por ti`,
      type: newEspacioType,
      followers: 1,
      following: true,
      posts: [],
    };
    setEspacios(prev => [nuevo, ...prev]);
    setCreatingEspacio(false);
    setNewEspacioStep(1);
    setNewEspacioName('');
    setNewEspacioDesc('');
    setNewEspacioCover(0);
    setActiveEspacio(nuevo);
  };

  const startProgress = () => {
    if (progressTimer.current) clearInterval(progressTimer.current);
    setProgress(0);
    progressTimer.current = setInterval(() => setProgress(p => { if (p >= 100) { clearInterval(progressTimer.current!); return 100; } return p + 2; }), 100);
  };

  const openStory = (s: Story) => {
    if (s.userId === 'me' || !s.media.length) return;
    setViewing({ ...s, views: s.views + 1 }); setSlideIdx(0); setShowReplies(false);
    setStories(prev => prev.map(x => x.id === s.id ? { ...x, seen: true, views: x.views + 1 } : x));
    startProgress();
  };

  const closeViewer = () => { if (progressTimer.current) clearInterval(progressTimer.current); setViewing(null); };

  const goSlide = (dir: 'prev' | 'next') => {
    if (!viewing) return;
    if (dir === 'prev' && slideIdx > 0) { setSlideIdx(slideIdx - 1); startProgress(); }
    else if (dir === 'next' && slideIdx < viewing.media.length - 1) { setSlideIdx(slideIdx + 1); startProgress(); }
    else if (dir === 'next') closeViewer();
  };

  const react = (storyId: string, emoji: string) => {
    const upd = (s: Story) => s.id === storyId ? { ...s, reactions: s.reactions.map(r => r.emoji === emoji ? { ...r, count: r.reacted ? r.count - 1 : r.count + 1, reacted: !r.reacted } : r) } : s;
    setStories(prev => prev.map(upd)); setViewing(prev => prev ? upd(prev) : null);
  };

  const sendReply = () => {
    if (!replyText.trim() || !viewing) return;
    const r: Reply = { id: Date.now().toString(), user: 'Tu', text: replyText.trim(), time: 'ahora' };
    setStories(prev => prev.map(s => s.id === viewing.id ? { ...s, replies: [...s.replies, r] } : s));
    setViewing(prev => prev ? { ...prev, replies: [...prev.replies, r] } : null);
    setReplyText('');
  };

  const openMyStory = () => {
    const myStory = stories.find(s => s.userId === 'me')!;
    if (myStory.media.length === 0) { openCreate('text'); return; }
    setViewing({ ...myStory, userName: 'Mi estado' });
    setSlideIdx(0); setShowReplies(false);
    startProgress();
  };

  const [myStoryMenu, setMyStoryMenu] = useState(false);
  const [slideMenu, setSlideMenu] = useState(false);
  const [editingSlide, setEditingSlide] = useState<number | null>(null);
  const [editText, setEditText] = useState('');

  const deleteSlide = (idx: number) => {
    setStories(prev => prev.map(s => s.userId === 'me'
      ? { ...s, media: s.media.filter((_, i) => i !== idx) }
      : s
    ));
    if (viewing?.userId === 'me') {
      const newMedia = viewing.media.filter((_, i) => i !== idx);
      if (newMedia.length === 0) { closeViewer(); return; }
      setViewing({ ...viewing, media: newMedia });
      setSlideIdx(Math.min(idx, newMedia.length - 1));
      startProgress();
    }
    setSlideMenu(false);
  };

  const saveEditSlide = () => {
    if (editingSlide === null || !editText.trim()) return;
    setStories(prev => prev.map(s => s.userId === 'me'
      ? { ...s, media: s.media.map((m, i) => i === editingSlide ? { ...m, content: editText } : m) }
      : s
    ));
    if (viewing?.userId === 'me') {
      setViewing({ ...viewing, media: viewing.media.map((m, i) => i === editingSlide ? { ...m, content: editText } : m) });
    }
    setEditingSlide(null);
    setEditText('');
  };

  const deleteAllMyStory = () => {
    setStories(prev => prev.map(s => s.userId === 'me' ? { ...s, media: [], time: '' } : s));
    setMyStoryMenu(false);
    if (viewing?.userId === 'me') closeViewer();
  };

  const manualRefresh = () => {
    setIsRefreshing(true);
    // Simula latencia de red (600ms) y luego inyecta 1-2 posts nuevos
    setTimeout(() => {
      const ids = Object.keys(NEWS_POOL);
      const count = Math.random() > 0.4 ? 2 : 1;
      for (let i = 0; i < count; i++) {
        const targetId = ids[Math.floor(Math.random() * ids.length)];
        const newPost = getRandomPost(targetId);
        setEspacios(prev => prev.map(e =>
          e.id === targetId ? { ...e, posts: [newPost, ...e.posts].slice(0, 20) } : e
        ));
        setActiveEspacio(prev =>
          prev?.id === targetId ? { ...prev, posts: [newPost, ...prev.posts].slice(0, 20) } : prev
        );
      }
      setNewPostsBadge({});
      setLastUpdated(Date.now());
      setIsRefreshing(false);
    }, 600);
  };

  const sinceUpdate = (): string => {
    const diff = Date.now() - lastUpdated;
    if (diff < 60000) return 'ahora mismo';
    if (diff < H) return `hace ${Math.floor(diff / 60000)}m`;
    return `hace ${Math.floor(diff / H)}h`;
  };

  const toggleFollow = (espacioId: string) => {
    setEspacios(prev => prev.map(e => e.id === espacioId
      ? { ...e, following: !e.following, followers: e.following ? e.followers - 1 : e.followers + 1 }
      : e
    ));
    setActiveEspacio(prev => prev?.id === espacioId
      ? { ...prev, following: !prev.following, followers: prev.following ? prev.followers - 1 : prev.followers + 1 }
      : prev
    );
  };

  const toggleLikePost = (espacioId: string, postId: string) => {
    const key = `${espacioId}-${postId}`;
    const wasLiked = likedPosts[key] ?? false;
    setLikedPosts(prev => ({ ...prev, [key]: !wasLiked }));
    const updatePosts = (posts: EspacioPost[]) => posts.map(p => p.id === postId
      ? { ...p, likes: wasLiked ? p.likes - 1 : p.likes + 1, liked: !wasLiked }
      : p
    );
    setEspacios(prev => prev.map(e => e.id === espacioId ? { ...e, posts: updatePosts(e.posts) } : e));
    setActiveEspacio(prev => prev?.id === espacioId ? { ...prev, posts: updatePosts(prev.posts) } : prev);
  };

  const me = stories.find(s => s.userId === 'me')!;
  const recent = stories.filter(s => s.userId !== 'me' && !s.seen);
  const seen = stories.filter(s => s.userId !== 'me' && s.seen);
  const displayed = activeTab === 'recientes' ? recent : seen;
  const maxSec = createMode === 'clip' ? 15 : 60;

  return (
    <div style={{ height: '100vh', background: '#fff', display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* Header */}
      <div style={{ paddingTop: 'max(52px, env(safe-area-inset-top))', paddingLeft: '16px', paddingRight: '16px', paddingBottom: '0', background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '12px' }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#00c8a0', cursor: 'pointer', padding: '4px', display: 'flex', marginLeft: '-4px' }}>{Icon.back}</button>
          <span style={{ fontSize: '18px', fontWeight: '700', color: '#111', flex: 1 }}>Estados</span>
        </div>
        <div style={{ display: 'flex', borderBottom: '2px solid #f0f0f0' }}>
          {(['recientes', 'vistos', 'dulce'] as const).map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={{ flex: 1, padding: '10px 0', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: activeTab === t ? '#00c8a0' : '#888', borderBottom: activeTab === t ? '2px solid #00c8a0' : '2px solid transparent', marginBottom: '-2px' }}>
              {t === 'recientes' ? `Recientes (${recent.length})` : t === 'vistos' ? `Vistos (${seen.length})` : '✦ Espacio Dulce'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', background: '#fff' }}>

        {/* Contenido por pestaña */}
        {activeTab === 'dulce' ? (
          <div style={{ padding: '16px' }}>
            {/* Barra de estado — actualización automática */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', padding: '8px 12px', background: '#f0fdf9', borderRadius: '10px', border: '1px solid #d1fae5' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#00c8a0', boxShadow: '0 0 0 2px rgba(0,200,160,0.25)', animation: 'pulse 2s infinite' }} />
                <span style={{ fontSize: '12px', color: '#059669', fontWeight: '600' }}>En vivo · {sinceUpdate()}</span>
              </div>
              <button onClick={manualRefresh} disabled={isRefreshing} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', cursor: isRefreshing ? 'default' : 'pointer', color: isRefreshing ? '#aaa' : '#00c8a0', fontSize: '12px', fontWeight: '700', padding: '2px 6px' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: isRefreshing ? 'spin 0.6s linear infinite' : 'none' }}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                {isRefreshing ? 'Actualizando...' : 'Actualizar'}
              </button>
            </div>
            <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} } @keyframes spin { to{transform:rotate(360deg)} }`}</style>
            {/* Botón crear espacio */}
            <button onClick={() => { setCreatingEspacio(true); setNewEspacioStep(1); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', borderRadius: '12px', border: '1.5px dashed #d0d0d0', background: '#fafafa', cursor: 'pointer', marginBottom: '20px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg,#00c8a0,#00b4e6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#111' }}>Crear espacio</div>
                <div style={{ fontSize: '11px', color: '#999', marginTop: '1px' }}>Canal o comunidad publica</div>
              </div>
            </button>
            {/* Sección Canales */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#111' }}>Canales</span>
                <span style={{ fontSize: '12px', color: '#00c8a0', fontWeight: '600' }}>Ver todos</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {espacios.filter(e => e.type === 'publico').map(esp => (
                  <div key={esp.id} onClick={() => { setActiveEspacio(esp); setNewPostsBadge(prev => ({ ...prev, [esp.id]: 0 })); }} style={{ borderRadius: '14px', overflow: 'hidden', border: `1px solid ${newPostsBadge[esp.id] ? '#00c8a0' : '#ebebeb'}`, cursor: 'pointer', background: '#fff', boxShadow: newPostsBadge[esp.id] ? '0 2px 8px rgba(0,200,160,0.18)' : '0 1px 3px rgba(0,0,0,0.06)', transition: 'all 0.2s' }}>
                    {/* Banner */}
                    <div style={{ height: '64px', background: esp.cover, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <EspacioIcon name={esp.name} />
                      {(newPostsBadge[esp.id] ?? 0) > 0 && (
                        <div style={{ position: 'absolute', top: '6px', right: '6px', background: '#ef4444', borderRadius: '10px', minWidth: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px', fontSize: '10px', fontWeight: '800', color: '#fff' }}>
                          {newPostsBadge[esp.id]}
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div style={{ padding: '10px 10px 12px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#111', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{esp.name}</div>
                      <div style={{ fontSize: '11px', color: '#999', marginBottom: '8px' }}>{formatFollowers(esp.followers)} seguidores</div>
                      <button onClick={e => { e.stopPropagation(); toggleFollow(esp.id); }}
                        style={{ width: '100%', padding: '6px 0', borderRadius: '8px', border: `1px solid ${esp.following ? '#e0e0e0' : '#00c8a0'}`, background: esp.following ? '#f7f7f7' : '#00c8a0', color: esp.following ? '#666' : '#fff', fontSize: '11px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        {esp.following
                          ? <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>Siguiendo</>
                          : <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Seguir</>
                        }
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Sección Comunidades */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#111' }}>Comunidades</span>
                <span style={{ fontSize: '12px', color: '#00c8a0', fontWeight: '600' }}>Ver todas</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {espacios.filter(e => e.type === 'comunidad').map(esp => (
                  <div key={esp.id} onClick={() => { setActiveEspacio(esp); setNewPostsBadge(prev => ({ ...prev, [esp.id]: 0 })); }} style={{ borderRadius: '14px', overflow: 'hidden', border: `1px solid ${newPostsBadge[esp.id] ? '#00c8a0' : '#ebebeb'}`, cursor: 'pointer', background: '#fff', boxShadow: newPostsBadge[esp.id] ? '0 2px 8px rgba(0,200,160,0.18)' : '0 1px 3px rgba(0,0,0,0.06)', transition: 'all 0.2s' }}>
                    <div style={{ height: '64px', background: esp.cover, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <EspacioIcon name={esp.name} />
                      {(newPostsBadge[esp.id] ?? 0) > 0 && (
                        <div style={{ position: 'absolute', top: '6px', right: '6px', background: '#ef4444', borderRadius: '10px', minWidth: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px', fontSize: '10px', fontWeight: '800', color: '#fff' }}>
                          {newPostsBadge[esp.id]}
                        </div>
                      )}
                    </div>
                    <div style={{ padding: '10px 10px 12px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#111', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{esp.name}</div>
                      <div style={{ fontSize: '11px', color: '#999', marginBottom: '8px' }}>{formatFollowers(esp.followers)} miembros</div>
                      <button onClick={e => { e.stopPropagation(); toggleFollow(esp.id); }}
                        style={{ width: '100%', padding: '6px 0', borderRadius: '8px', border: `1px solid ${esp.following ? '#e0e0e0' : '#00c8a0'}`, background: esp.following ? '#f7f7f7' : '#00c8a0', color: esp.following ? '#666' : '#fff', fontSize: '11px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        {esp.following
                          ? <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>Unido</>
                          : <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Unirse</>
                        }
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Mi estado — solo en pestaña Recientes */}
            {activeTab === 'recientes' && (
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #f5f5f5' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ position: 'relative', cursor: 'pointer' }} onClick={openMyStory}>
                    <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: me.media.length ? 'linear-gradient(135deg,#00c8a0,#00b4e6)' : '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px', fontWeight: '700', color: me.media.length ? '#fff' : '#9ca3af' }}>{me.avatar}</div>
                    <div style={{ position: 'absolute', bottom: 0, right: 0, width: '20px', height: '20px', borderRadius: '50%', background: '#00c8a0', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '15px', fontWeight: '600', color: '#111' }}>Mi estado</div>
                    <div style={{ fontSize: '12px', color: '#888', marginTop: '1px' }}>{me.media.length ? `${me.media.length} publicacion${me.media.length > 1 ? 'es' : ''} · ${timeLeft(me.publishedAt)}` : 'Toca para anadir estado'}</div>
                  </div>
                  {/* Botones acción */}
                  <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                    {([{ mode: 'clip' as CreateMode, icon: Icon.clip, color: '#f59e0b' }, { mode: 'video' as CreateMode, icon: Icon.video, color: '#06b6d4' }, { mode: 'live' as CreateMode, icon: Icon.live, color: '#ef4444' }]).map(b => (
                      <button key={b.mode} onClick={() => openCreate(b.mode)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: b.color, padding: '6px', display: 'flex', borderRadius: '50%' }}>{b.icon}</button>
                    ))}
                    {/* Menú opciones */}
                    <div style={{ position: 'relative' }}>
                      <button onClick={() => setMyStoryMenu(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', padding: '6px', display: 'flex', borderRadius: '50%' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
                      </button>
                      {myStoryMenu && (
                        <>
                          <div onClick={() => setMyStoryMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />
                          <div style={{ position: 'absolute', right: 0, top: '36px', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', border: '1px solid #f0f0f0', zIndex: 100, minWidth: '180px', overflow: 'hidden' }}>
                            <button onClick={() => { openCreate('text'); setMyStoryMenu(false); }} style={{ width: '100%', padding: '13px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#111', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #f5f5f5' }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00c8a0" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                              Anadir estado
                            </button>
                            <button onClick={() => { openMyStory(); setMyStoryMenu(false); }} style={{ width: '100%', padding: '13px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#111', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #f5f5f5' }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                              Ver mi estado
                            </button>
                            {me.media.length > 0 && (
                              <button onClick={deleteAllMyStory} style={{ width: '100%', padding: '13px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#e53935', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e53935" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                                Eliminar todo
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {displayed.length === 0 ? (
              <div style={{ padding: '40px 16px', textAlign: 'center', color: '#bbb', fontSize: '13px' }}>
                {activeTab === 'recientes' ? 'No hay estados nuevos' : 'No has visto ningun estado aun'}
              </div>
            ) : (
              displayed.map(s => (
                <div key={s.id} onClick={() => openStory(s)} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid #f9f9f9' }}>
                  <div style={{ padding: '2.5px', borderRadius: '50%', background: s.seen ? '#e5e7eb' : 'linear-gradient(135deg,#00c8a0,#00b4e6)', flexShrink: 0 }}>
                    <div style={{ width: '46px', height: '46px', borderRadius: '50%', background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: '700', color: '#fff', border: '2px solid #fff' }}>{s.avatar}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '15px', fontWeight: s.seen ? '400' : '600', color: s.seen ? '#555' : '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.userName}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                      <span style={{ fontSize: '12px', color: '#aaa' }}>hace {timeAgo(s.publishedAt)}</span>
                      <span style={{ color: '#ccc' }}>·</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '12px', color: '#aaa' }}>{Icon.eye} {s.views}</span>
                      {s.media[0]?.music && <span style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#aaa' }}>{Icon.music}</span>}
                    </div>
                  </div>
                  {s.trending && <span style={{ fontSize: '10px', color: '#ef4444', fontWeight: '700', background: '#fef2f2', padding: '2px 7px', borderRadius: '10px', flexShrink: 0 }}>TOP</span>}
                </div>
              ))
            )}
          </>
        )}
      </div>

      {/* VISOR DE ESTADO */}
      {viewing && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 3000, background: '#000', display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, sans-serif' }}>
          <div style={{ position: 'absolute', inset: 0, background: viewing.media[slideIdx]?.bg || '#111', opacity: 0.15, filter: 'blur(50px)' }} />
          <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Zonas tap */}
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '40%', zIndex: 1 }} onClick={() => goSlide('prev')} />
            <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '40%', zIndex: 1 }} onClick={() => goSlide('next')} />
            {/* Barras progreso */}
            <div style={{ display: 'flex', gap: '3px', paddingTop: 'max(48px, env(safe-area-inset-top))', paddingLeft: '12px', paddingRight: '12px', paddingBottom: '8px', position: 'relative', zIndex: 2 }}>
              {viewing.media.map((_, i) => (
                <div key={i} style={{ flex: 1, height: '2px', borderRadius: '2px', background: 'rgba(255,255,255,0.3)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: '#fff', width: i < slideIdx ? '100%' : i === slideIdx ? `${progress}%` : '0%', transition: 'width 0.1s linear' }} />
                </div>
              ))}
            </div>
            {/* Header visor */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 14px 10px', position: 'relative', zIndex: 3 }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: viewing.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', color: '#fff', border: '2px solid rgba(255,255,255,0.4)', flexShrink: 0 }}>{viewing.avatar}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>{viewing.userName}</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>hace {timeAgo(viewing.publishedAt)}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>{Icon.eye} {viewing.views}</span>
                </div>
              </div>
              {/* Opciones slide — solo mi estado */}
              {viewing.userId === 'me' && (
                <div style={{ position: 'relative' }}>
                  <button onClick={() => setSlideMenu(v => !v)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '34px', height: '34px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
                  </button>
                  {slideMenu && (
                    <>
                      <div onClick={() => setSlideMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 3099 }} />
                      <div style={{ position: 'absolute', right: 0, top: '40px', background: '#1a1a1a', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.4)', zIndex: 3100, minWidth: '190px', overflow: 'hidden' }}>
                        {viewing.media[slideIdx]?.type === 'text' && (
                          <button onClick={() => { setEditingSlide(slideIdx); setEditText(viewing.media[slideIdx].content); setSlideMenu(false); }} style={{ width: '100%', padding: '13px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#fff', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#00c8a0" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            Editar texto
                          </button>
                        )}
                        <button onClick={() => { openCreate('text'); setSlideMenu(false); }} style={{ width: '100%', padding: '13px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#fff', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#00c8a0" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                          Anadir slide
                        </button>
                        <button onClick={() => deleteSlide(slideIdx)} style={{ width: '100%', padding: '13px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#ff5252', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ff5252" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                          Eliminar este slide
                        </button>
                        <button onClick={() => { deleteAllMyStory(); setSlideMenu(false); }} style={{ width: '100%', padding: '13px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#ff5252', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ff5252" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                          Eliminar todo
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
              <button onClick={closeViewer} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '34px', height: '34px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{Icon.close}</button>
            </div>
            {/* Contenido slide */}
            <div style={{ flex: 1, margin: '0 10px', borderRadius: '18px', overflow: 'hidden', background: viewing.media[slideIdx]?.bg || '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px', position: 'relative' }}>
              {(viewing.media[slideIdx]?.type === 'video' || viewing.media[slideIdx]?.type === 'clip') ? (
                <video src={viewing.media[slideIdx].content} autoPlay controls style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <>
                  {viewing.media[slideIdx]?.emoji && <div style={{ fontSize: '72px' }}>{viewing.media[slideIdx].emoji}</div>}
                  <div style={{ fontSize: '22px', fontWeight: '800', color: '#fff', textAlign: 'center', padding: '0 28px', lineHeight: 1.4, textShadow: '0 2px 12px rgba(0,0,0,0.4)' }}>{viewing.media[slideIdx]?.content}</div>
                  {viewing.media[slideIdx]?.music && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'rgba(0,0,0,0.35)', padding: '7px 14px', borderRadius: '24px' }}>
                      <span style={{ color: 'rgba(255,255,255,0.7)', display: 'flex' }}>{Icon.music}</span>
                      <span style={{ fontSize: '12px', color: '#fff', fontWeight: '500' }}>{viewing.media[slideIdx].music}</span>
                    </div>
                  )}
                </>
              )}
              {viewing.media.length > 1 && (
                <div style={{ position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '5px' }}>
                  {viewing.media.map((_, i) => <div key={i} style={{ width: i === slideIdx ? '16px' : '6px', height: '6px', borderRadius: '3px', background: i === slideIdx ? '#fff' : 'rgba(255,255,255,0.35)', transition: 'all 0.2s' }} />)}
                </div>
              )}
            </div>
            {/* Reacciones */}
            {viewing.reactions.length > 0 && (
              <div style={{ padding: '10px 14px 4px', display: 'flex', gap: '8px', position: 'relative', zIndex: 3 }}>
                {viewing.reactions.map(r => (
                  <button key={r.emoji} onClick={() => react(viewing.id, r.emoji)} style={{ background: r.reacted ? 'rgba(0,200,160,0.2)' : 'rgba(255,255,255,0.08)', border: `1.5px solid ${r.reacted ? '#00c8a0' : 'rgba(255,255,255,0.15)'}`, borderRadius: '22px', padding: '6px 12px', cursor: 'pointer', color: '#fff', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    {r.emoji}<span style={{ fontSize: '12px', color: r.reacted ? '#00c8a0' : 'rgba(255,255,255,0.65)', fontWeight: '600' }}>{r.count}</span>
                  </button>
                ))}
              </div>
            )}
            {/* Respuestas */}
            <div style={{ padding: '6px 12px 32px', position: 'relative', zIndex: 3 }}>
              {viewing.replies.length > 0 && (
                <button onClick={() => setShowReplies(!showReplies)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '12px', padding: '4px 0', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
                  {Icon.chat}<span>{viewing.replies.length} respuesta{viewing.replies.length !== 1 ? 's' : ''}</span><span style={{ fontSize: '10px' }}>{showReplies ? '▲' : '▼'}</span>
                </button>
              )}
              {showReplies && (
                <div style={{ marginBottom: '8px', display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '80px', overflowY: 'auto' }}>
                  {viewing.replies.map(r => (
                    <div key={r.id} style={{ background: 'rgba(255,255,255,0.07)', borderRadius: '12px', padding: '7px 12px', fontSize: '12px', color: '#fff' }}>
                      <span style={{ fontWeight: '700', color: '#00c8a0' }}>{r.user}</span>{'  '}{r.text}
                      <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', marginLeft: '6px' }}>{r.time}</span>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Responder..." onKeyDown={e => e.key === 'Enter' && sendReply()} style={{ flex: 1, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: '24px', padding: '10px 16px', color: '#fff', fontSize: '13px', outline: 'none' }} />
                <button onClick={sendReply} style={{ background: 'linear-gradient(135deg,#00c8a0,#00b4e6)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{Icon.send}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VISOR ESPACIO DULCE */}
      {activeEspacio && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: '#f5f5f5', display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, sans-serif' }}>
          {/* Banner header */}
          <div style={{ background: activeEspacio.cover, paddingTop: 'max(48px, env(safe-area-inset-top))', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 16px 14px' }}>
              <button onClick={() => setActiveEspacio(null)} style={{ background: 'rgba(0,0,0,0.25)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{Icon.back}</button>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#fff', letterSpacing: '-0.2px' }}>{activeEspacio.name}</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginTop: '1px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#4ade80' }} />
                  {activeEspacio.type === 'publico' ? 'Canal' : 'Comunidad'} · {formatFollowers(activeEspacio.followers)} {activeEspacio.type === 'publico' ? 'seguidores' : 'miembros'} · {sinceUpdate()}
                </div>
              </div>
              <button onClick={() => toggleFollow(activeEspacio.id)}
                style={{ padding: '6px 14px', borderRadius: '20px', border: '1.5px solid rgba(255,255,255,0.5)', background: activeEspacio.following ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.95)', color: activeEspacio.following ? '#fff' : '#111', fontSize: '12px', fontWeight: '700', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                {activeEspacio.following
                  ? <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>{activeEspacio.type === 'publico' ? 'Siguiendo' : 'Unido'}</>
                  : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>{activeEspacio.type === 'publico' ? 'Seguir' : 'Unirse'}</>
                }
              </button>
            </div>
          </div>
          {/* Descripcion */}
          <div style={{ background: '#fff', padding: '12px 16px', borderBottom: '1px solid #ebebeb', flexShrink: 0 }}>
            <div style={{ fontSize: '12px', color: '#666', lineHeight: 1.5 }}>{activeEspacio.description}</div>
          </div>
          {/* Posts */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {activeEspacio.posts.map(post => {
              const key = `${activeEspacio.id}-${post.id}`;
              const isLiked = likedPosts[key] ?? post.liked;
              return (
                <div key={post.id} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #ebebeb', padding: '14px 14px 10px', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: post.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', color: '#fff', flexShrink: 0 }}>{post.avatar}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#111' }}>{post.author}</div>
                      <div style={{ fontSize: '11px', color: '#bbb' }}>hace {post.time}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: '14px', color: '#222', lineHeight: 1.55, marginBottom: '12px' }}>{post.text}</div>
                  <div style={{ display: 'flex', gap: '20px', borderTop: '1px solid #f2f2f2', paddingTop: '10px' }}>
                    <button onClick={() => toggleLikePost(activeEspacio.id, post.id)} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', cursor: 'pointer', color: isLiked ? '#e53935' : '#aaa', fontSize: '13px', fontWeight: '600', padding: 0 }}>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill={isLiked ? '#e53935' : 'none'} stroke={isLiked ? '#e53935' : '#aaa'} strokeWidth="2" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                      <span style={{ color: isLiked ? '#e53935' : '#999' }}>{post.likes + (isLiked && !post.liked ? 1 : !isLiked && post.liked ? -1 : 0)}</span>
                    </button>
                    <button style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: '13px', fontWeight: '600', padding: 0 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                      <span style={{ color: '#999' }}>{post.comments}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CREAR TEXTO */}
      {createMode === 'text' && (
        <div style={{ position: 'fixed', inset: 0, background: '#fff', zIndex: 3000, display: 'flex', flexDirection: 'column' }}>
          <div style={{ paddingTop: 'max(52px, env(safe-area-inset-top))', paddingLeft: '16px', paddingRight: '16px', paddingBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #f0f0f0' }}>
            <button onClick={closeCreate} style={{ background: 'none', border: 'none', color: '#00c8a0', cursor: 'pointer', padding: '4px', display: 'flex' }}>{Icon.back}</button>
            <span style={{ fontSize: '17px', fontWeight: '700', color: '#111', flex: 1 }}>Nuevo estado</span>
            <button onClick={publishText} style={{ background: '#00c8a0', border: 'none', borderRadius: '20px', padding: '7px 18px', color: '#fff', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>Publicar</button>
          </div>
          <div style={{ margin: '16px', height: '200px', borderRadius: '16px', background: newBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px' }}>
            {newEmoji && <div style={{ fontSize: '44px' }}>{newEmoji}</div>}
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#fff', textAlign: 'center', padding: '0 20px', lineHeight: 1.4 }}>{newText || 'Escribe algo...'}</div>
            {newMusic !== 'Sin musica' && <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.85)', background: 'rgba(0,0,0,0.25)', padding: '3px 10px', borderRadius: '12px' }}>🎵 {newMusic}</div>}
          </div>
          <div style={{ display: 'flex', gap: '8px', padding: '0 16px', overflowX: 'auto', marginBottom: '12px' }}>
            {BG_OPTIONS.map((bg, i) => <div key={i} onClick={() => setNewBg(bg)} style={{ width: '30px', height: '30px', borderRadius: '50%', background: bg, flexShrink: 0, cursor: 'pointer', border: newBg === bg ? '3px solid #00c8a0' : '3px solid transparent', boxSizing: 'border-box' }} />)}
          </div>
          <div style={{ display: 'flex', gap: '6px', padding: '0 16px', overflowX: 'auto', marginBottom: '12px' }}>
            {EMOJI_OPTIONS.map(e => <button key={e} onClick={() => setNewEmoji(newEmoji === e ? '' : e)} style={{ fontSize: '20px', background: newEmoji === e ? '#e6faf7' : 'none', border: newEmoji === e ? '1.5px solid #00c8a0' : '1.5px solid #f0f0f0', borderRadius: '10px', padding: '4px 7px', cursor: 'pointer', flexShrink: 0 }}>{e}</button>)}
          </div>
          <div style={{ padding: '0 16px', marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: '600', color: '#aaa', textTransform: 'uppercase', marginBottom: '6px' }}>Musica</div>
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto' }}>
              {MUSIC_OPTIONS.map(m => <button key={m} onClick={() => setNewMusic(m)} style={{ padding: '6px 12px', borderRadius: '16px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: '600', whiteSpace: 'nowrap', background: newMusic === m ? '#00c8a0' : '#f5f5f5', color: newMusic === m ? '#fff' : '#555', flexShrink: 0 }}>{m}</button>)}
            </div>
          </div>
          <div style={{ padding: '0 16px', flex: 1 }}>
            <textarea value={newText} onChange={e => setNewText(e.target.value)} placeholder="Que quieres compartir?" maxLength={200} style={{ width: '100%', minHeight: '80px', background: '#f9f9f9', border: '1px solid #e5e7eb', borderRadius: '12px', color: '#111', fontSize: '15px', padding: '12px', outline: 'none', resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
          </div>
        </div>
      )}

      {/* GRABAR */}
      {(createMode === 'clip' || createMode === 'video') && (
        <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 3000, display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, paddingTop: 'max(48px, env(safe-area-inset-top))', paddingLeft: '16px', paddingRight: '16px', paddingBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)' }}>
            <button onClick={closeCreate} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '34px', height: '34px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{Icon.back}</button>
            <span style={{ fontSize: '15px', fontWeight: '700', color: '#fff', flex: 1 }}>{createMode === 'clip' ? 'Clip · máx 15s' : 'Video · máx 60s'}</span>
            {chunks.current.length > 0 && !isRecording && (
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.15)', padding: '3px 10px', borderRadius: '10px' }}>
                {recordSeconds}s grabados
              </span>
            )}
          </div>

          {camError ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '24px' }}>
              <div style={{ fontSize: '36px' }}>📷</div>
              <div style={{ color: '#ef4444', fontSize: '13px', textAlign: 'center' }}>{camError}</div>
              <button onClick={startCam} style={{ padding: '10px 24px', background: '#00c8a0', border: 'none', borderRadius: '12px', color: '#fff', cursor: 'pointer', fontWeight: '700' }}>Reintentar</button>
            </div>
          ) : recordedUrl ? (
            /* Editor de video — subcomponente para respetar reglas de hooks */
            <VideoEditor
              recordedUrl={recordedUrl}
              recordSeconds={recordSeconds}
              videoFilter={videoFilter} setVideoFilter={setVideoFilter}
              videoOverlay={videoOverlay} setVideoOverlay={setVideoOverlay}
              videoCaption={videoCaption} setVideoCaption={setVideoCaption}
              videoSpeed={videoSpeed} setVideoSpeed={setVideoSpeed}
              videoMuted={videoMuted} setVideoMuted={setVideoMuted}
              trimStart={trimStart} setTrimStart={setTrimStart}
              trimEnd={trimEnd} setTrimEnd={setTrimEnd}
              editVideoRef={editVideoRef}
              VIDEO_FILTERS={VIDEO_FILTERS}
              VIDEO_OVERLAYS={VIDEO_OVERLAYS}
              onNewTake={() => { setRecordedUrl(''); setRecordSeconds(0); chunks.current = []; setVideoFilter('none'); setVideoOverlay(''); setVideoCaption(''); setVideoSpeed(1); setVideoMuted(false); setTrimStart(0); setTrimEnd(100); }}
              onPublish={publishVideo}
            />
          ) : processingVideo ? (
            /* Estado intermedio mientras se genera el Blob */
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', background: '#0a0a0a' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '3px solid #333', borderTop: '3px solid #00c8a0', animation: 'spin 0.8s linear infinite' }} />
              <span style={{ color: '#aaa', fontSize: '14px', fontWeight: '600' }}>Procesando video...</span>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : (
            /* Cámara activa — controles tipo TikTok */
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
              <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', filter: VIDEO_FILTERS.find(f => f.id === videoFilter)?.css || 'none' }} />

              {/* Barra de progreso */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'rgba(255,255,255,0.2)' }}>
                <div style={{ height: '100%', background: isRecording ? '#ef4444' : '#00c8a0', width: `${(recordSeconds / maxSec) * 100}%`, transition: 'width 0.5s linear' }} />
              </div>

              {/* Contador */}
              {isRecording && (
                <div style={{ position: 'absolute', top: '110px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.5)', borderRadius: '20px', padding: '5px 14px', display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#ef4444', animation: 'pulse 1s infinite' }} />
                  <span style={{ color: '#fff', fontSize: '13px', fontWeight: '700' }}>{recordSeconds}s / {maxSec}s</span>
                </div>
              )}

              {/* Overlay emoji seleccionado */}
              {videoOverlay && <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: '72px', pointerEvents: 'none', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))' }}>{videoOverlay}</div>}

              {/* Controles laterales derecha — estilo TikTok */}
              <div style={{ position: 'absolute', right: '12px', top: '110px', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
                {/* Voltear cámara */}
                <button onClick={async () => {
                  if (!cameraStream) return;
                  const currentFacing = (cameraStream.getVideoTracks()[0].getSettings() as any).facingMode || 'user';
                  cameraStream.getTracks().forEach(t => t.stop());
                  try {
                    const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: currentFacing === 'user' ? 'environment' : 'user' }, audio: true });
                    setCameraStream(s);
                  } catch {}
                }} style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(0,0,0,0.45)', border: '1.5px solid rgba(255,255,255,0.25)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', color: '#fff' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 4v6h6"/><path d="M23 20v-6h-6"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>
                  <span style={{ fontSize: '8px', fontWeight: '700' }}>Voltear</span>
                </button>

                {/* Velocidad */}
                <button onClick={() => setVideoSpeed(s => s === 1 ? 0.5 : s === 0.5 ? 2 : 1)} style={{ width: '44px', height: '44px', borderRadius: '50%', background: videoSpeed !== 1 ? 'rgba(0,200,160,0.4)' : 'rgba(0,0,0,0.45)', border: `1.5px solid ${videoSpeed !== 1 ? '#00c8a0' : 'rgba(255,255,255,0.25)'}`, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', color: videoSpeed !== 1 ? '#00c8a0' : '#fff' }}>
                  <span style={{ fontSize: '14px', fontWeight: '900' }}>{videoSpeed}x</span>
                  <span style={{ fontSize: '8px', fontWeight: '700' }}>Vel.</span>
                </button>

                {/* Filtros rápidos */}
                <button onClick={() => { const idx = VIDEO_FILTERS.findIndex(f => f.id === videoFilter); setVideoFilter(VIDEO_FILTERS[(idx + 1) % VIDEO_FILTERS.length].id); }} style={{ width: '44px', height: '44px', borderRadius: '50%', background: videoFilter !== 'none' ? 'rgba(139,92,246,0.4)' : 'rgba(0,0,0,0.45)', border: `1.5px solid ${videoFilter !== 'none' ? '#8b5cf6' : 'rgba(255,255,255,0.25)'}`, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', color: videoFilter !== 'none' ? '#c4b5fd' : '#fff' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>
                  <span style={{ fontSize: '8px', fontWeight: '700' }}>{VIDEO_FILTERS.find(f => f.id === videoFilter)?.label || 'Filtro'}</span>
                </button>

                {/* Sticker / Emoji overlay */}
                <button onClick={() => { const emojis = ['🔥','✨','🌊','🎵','💫','🇬🇶','❤️','😍','💪','🌍']; const idx = emojis.indexOf(videoOverlay); setVideoOverlay(idx === -1 ? emojis[0] : idx === emojis.length - 1 ? '' : emojis[idx + 1]); }} style={{ width: '44px', height: '44px', borderRadius: '50%', background: videoOverlay ? 'rgba(245,158,11,0.4)' : 'rgba(0,0,0,0.45)', border: `1.5px solid ${videoOverlay ? '#f59e0b' : 'rgba(255,255,255,0.25)'}`, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', color: '#fff', fontSize: videoOverlay ? '20px' : '14px' }}>
                  {videoOverlay || <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M8 13s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg><span style={{ fontSize: '8px', fontWeight: '700' }}>Sticker</span></>}
                </button>

                {/* Temporizador */}
                <button onClick={() => { /* Cuenta regresiva 3s antes de grabar */
                  let count = 3;
                  const el = document.createElement('div');
                  el.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;z-index:9999;pointer-events:none;';
                  el.innerHTML = `<div style="font-size:120px;font-weight:900;color:#fff;text-shadow:0 4px 20px rgba(0,0,0,0.5);animation:none">${count}</div>`;
                  document.body.appendChild(el);
                  const t = setInterval(() => {
                    count--;
                    if (count <= 0) { clearInterval(t); document.body.removeChild(el); startRec(); }
                    else (el.firstChild as HTMLElement).textContent = String(count);
                  }, 1000);
                }} style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(0,0,0,0.45)', border: '1.5px solid rgba(255,255,255,0.25)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', color: '#fff' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <span style={{ fontSize: '8px', fontWeight: '700' }}>3s</span>
                </button>
              </div>

              {/* Filtros en tiempo real — barra inferior izquierda */}
              {!isRecording && (
                <div style={{ position: 'absolute', left: '12px', bottom: '110px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {VIDEO_FILTERS.slice(0, 5).map(f => (
                    <button key={f.id} onClick={() => setVideoFilter(f.id)} style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(0,0,0,0.5)', border: `2px solid ${videoFilter === f.id ? '#00c8a0' : 'rgba(255,255,255,0.2)'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: videoFilter === f.id ? '#00c8a0' : '#aaa', fontSize: '9px', fontWeight: '700', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ width: '20px', height: '20px', borderRadius: '4px', background: 'linear-gradient(135deg,#1a1a2e,#16213e)', filter: f.css }} />
                      <span>{f.label}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Controles inferiores */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: '86px', paddingTop: '20px', background: 'linear-gradient(to top, rgba(0,0,0,0.55), transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '32px' }}>
                {/* Descartar */}
                <button onClick={() => { setRecordSeconds(0); chunks.current = []; }} style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', opacity: isRecording ? 0.3 : 1 }} disabled={isRecording}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                </button>

                {/* Botón grabar principal */}
                <button onClick={isRecording ? stopRec : startRec} style={{ width: '76px', height: '76px', borderRadius: '50%', background: isRecording ? '#ef4444' : '#fff', border: `5px solid ${isRecording ? 'rgba(239,68,68,0.35)' : 'rgba(255,255,255,0.35)'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isRecording ? '#fff' : '#111', boxShadow: '0 4px 24px rgba(0,0,0,0.5)', transition: 'all 0.15s' }}>
                  {isRecording ? Icon.stop : Icon.rec}
                </button>

                {/* Confirmar */}
                <button onClick={() => { if (isRecording) stopRec(); }} style={{ width: '44px', height: '44px', borderRadius: '50%', background: isRecording ? 'rgba(0,200,160,0.25)' : 'rgba(255,255,255,0.08)', border: `1.5px solid ${isRecording ? '#00c8a0' : 'rgba(255,255,255,0.2)'}`, cursor: isRecording ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isRecording ? '#00c8a0' : '#444' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* LIVE */}
      {createMode === 'live' && (
        <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 3000, display: 'flex', flexDirection: 'column' }}>
          <div style={{ paddingTop: 'max(52px, env(safe-area-inset-top))', paddingLeft: '16px', paddingRight: '16px', paddingBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick={isLive ? undefined : closeCreate} style={{ background: 'none', border: 'none', color: '#fff', cursor: isLive ? 'default' : 'pointer', padding: '4px', display: 'flex', opacity: isLive ? 0.3 : 1 }}>{Icon.back}</button>
            <span style={{ fontSize: '16px', fontWeight: '700', color: '#fff', flex: 1 }}>{isLive ? 'EN VIVO' : 'Iniciar en vivo'}</span>
            {isLive && <div style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid #ef4444', borderRadius: '12px', padding: '4px 10px', fontSize: '12px', color: '#ef4444', fontWeight: '700' }}>👁 {liveViewers}</div>}
          </div>
          {camError ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
              <div style={{ fontSize: '36px' }}>📷</div>
              <div style={{ color: '#ef4444', fontSize: '13px' }}>{camError}</div>
              <button onClick={startCam} style={{ padding: '10px 24px', background: '#00c8a0', border: 'none', borderRadius: '12px', color: '#fff', cursor: 'pointer', fontWeight: '700' }}>Reintentar</button>
            </div>
          ) : (
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', filter: VIDEO_FILTERS.find(f => f.id === videoFilter)?.css || 'none' }} />
                {isLive && <div style={{ position: 'absolute', top: '14px', left: '14px', background: '#ef4444', borderRadius: '6px', padding: '3px 10px', fontSize: '11px', color: '#fff', fontWeight: '800' }}>LIVE</div>}
                {isLive && <div style={{ position: 'absolute', top: '14px', right: '14px', background: 'rgba(0,0,0,0.5)', borderRadius: '10px', padding: '4px 10px', fontSize: '12px', color: '#fff' }}>👁 {liveViewers} viendo</div>}
                {videoOverlay && <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: '64px', pointerEvents: 'none' }}>{videoOverlay}</div>}
                {videoCaption && <div style={{ position: 'absolute', bottom: '16px', left: '16px', right: '16px', background: 'rgba(0,0,0,0.55)', borderRadius: '8px', padding: '8px 12px', color: '#fff', fontSize: '14px', fontWeight: '600', textAlign: 'center' }}>{videoCaption}</div>}
              </div>

              {/* Herramientas LIVE */}
              <div style={{ background: '#111', borderTop: '1px solid #222', padding: '10px 12px' }}>
                {/* Filtros rápidos */}
                <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', marginBottom: '10px', paddingBottom: '2px' }}>
                  {VIDEO_FILTERS.map(f => (
                    <button key={f.id} onClick={() => setVideoFilter(f.id)} style={{ flexShrink: 0, padding: '5px 10px', borderRadius: '8px', border: `1.5px solid ${videoFilter === f.id ? '#00c8a0' : '#333'}`, background: videoFilter === f.id ? 'rgba(0,200,160,0.15)' : '#1a1a1a', color: videoFilter === f.id ? '#00c8a0' : '#666', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
                      {f.label}
                    </button>
                  ))}
                </div>
                {/* Efectos + texto + botón acción */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', flex: 1 }}>
                    {VIDEO_OVERLAYS.map(o => (
                      <button key={o.id} onClick={() => setVideoOverlay(o.id)} style={{ flexShrink: 0, width: '36px', height: '36px', borderRadius: '8px', border: `1.5px solid ${videoOverlay === o.id ? '#00c8a0' : '#333'}`, background: videoOverlay === o.id ? 'rgba(0,200,160,0.15)' : '#1a1a1a', fontSize: o.id ? '18px' : '10px', color: '#666', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {o.id || <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Input texto en directo */}
                <input value={videoCaption} onChange={e => setVideoCaption(e.target.value)} placeholder="Texto en pantalla..." maxLength={60} style={{ width: '100%', marginTop: '8px', padding: '8px 12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontSize: '12px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
              </div>

              {/* Botón iniciar/terminar */}
              <div style={{ paddingBottom: '86px', paddingTop: '14px', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {!isLive
                  ? <button onClick={startLive} style={{ padding: '14px 36px', background: '#ef4444', border: 'none', borderRadius: '30px', color: '#fff', fontSize: '15px', fontWeight: '800', cursor: 'pointer' }}>Iniciar en vivo</button>
                  : <button onClick={stopLive} style={{ padding: '14px 36px', background: 'rgba(239,68,68,0.25)', border: '2px solid #ef4444', borderRadius: '30px', color: '#fff', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>Terminar</button>
                }
              </div>
            </div>
          )}
        </div>
      )}
      {/* CREAR ESPACIO */}
      {creatingEspacio && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2500, background: '#fff', display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, sans-serif' }}>
          {/* Header */}
          <div style={{ paddingTop: 'max(52px, env(safe-area-inset-top))', paddingLeft: '16px', paddingRight: '16px', paddingBottom: '14px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button onClick={() => newEspacioStep === 2 ? setNewEspacioStep(1) : setCreatingEspacio(false)} style={{ background: 'none', border: 'none', color: '#00c8a0', cursor: 'pointer', padding: '4px', display: 'flex' }}>{Icon.back}</button>
            <span style={{ fontSize: '17px', fontWeight: '700', color: '#111', flex: 1 }}>
              {newEspacioStep === 1 ? 'Tipo de espacio' : 'Configura tu espacio'}
            </span>
            {/* Indicador pasos */}
            <div style={{ display: 'flex', gap: '4px' }}>
              {[1, 2].map(s => (
                <div key={s} style={{ width: s === newEspacioStep ? '18px' : '6px', height: '6px', borderRadius: '3px', background: s <= newEspacioStep ? '#00c8a0' : '#e0e0e0', transition: 'all 0.2s' }} />
              ))}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px' }}>
            {newEspacioStep === 1 ? (
              /* Paso 1 — elegir tipo */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '13px', color: '#888', marginBottom: '4px', lineHeight: 1.5 }}>
                  Elige como quieres que funcione tu espacio
                </div>
                {([
                  { type: 'publico' as const, label: 'Canal', sub: 'Solo tu publicas. Los seguidores leen y reaccionan.', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6 6l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16.92z"/></svg> },
                  { type: 'comunidad' as const, label: 'Comunidad', sub: 'Todos los miembros pueden publicar y participar.', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
                ] as const).map(opt => (
                  <div key={opt.type} onClick={() => setNewEspacioType(opt.type)} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', borderRadius: '14px', border: `2px solid ${newEspacioType === opt.type ? '#00c8a0' : '#ebebeb'}`, background: newEspacioType === opt.type ? '#f0fdf9' : '#fff', cursor: 'pointer', transition: 'all 0.15s' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: newEspacioType === opt.type ? '#00c8a0' : '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: newEspacioType === opt.type ? '#fff' : '#888', flexShrink: 0 }}>
                      {opt.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '15px', fontWeight: '700', color: '#111', marginBottom: '2px' }}>{opt.label}</div>
                      <div style={{ fontSize: '12px', color: '#888', lineHeight: 1.4 }}>{opt.sub}</div>
                    </div>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${newEspacioType === opt.type ? '#00c8a0' : '#ddd'}`, background: newEspacioType === opt.type ? '#00c8a0' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {newEspacioType === opt.type && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Paso 2 — nombre, descripción, portada */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Preview portada */}
                <div style={{ height: '100px', borderRadius: '14px', background: COVER_OPTIONS[newEspacioCover], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>
                    {newEspacioName || (newEspacioType === 'publico' ? 'Mi Canal' : 'Mi Comunidad')}
                  </span>
                </div>
                {/* Selector portada */}
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#555', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Color de portada</div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {COVER_OPTIONS.map((c, i) => (
                      <div key={i} onClick={() => setNewEspacioCover(i)} style={{ width: '36px', height: '36px', borderRadius: '10px', background: c, cursor: 'pointer', border: newEspacioCover === i ? '3px solid #00c8a0' : '3px solid transparent', boxSizing: 'border-box', boxShadow: newEspacioCover === i ? '0 0 0 1px #00c8a0' : 'none' }} />
                    ))}
                  </div>
                </div>
                {/* Nombre */}
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#555', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Nombre *</div>
                  <input value={newEspacioName} onChange={e => setNewEspacioName(e.target.value)} placeholder={newEspacioType === 'publico' ? 'Ej: Noticias GE' : 'Ej: Futbol Malabo'} maxLength={40} style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1.5px solid #e5e7eb', fontSize: '15px', color: '#111', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', background: '#fafafa' }} />
                </div>
                {/* Descripción */}
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#555', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Descripcion</div>
                  <textarea value={newEspacioDesc} onChange={e => setNewEspacioDesc(e.target.value)} placeholder="De que trata este espacio..." maxLength={120} rows={3} style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1.5px solid #e5e7eb', fontSize: '14px', color: '#111', outline: 'none', resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit', background: '#fafafa' }} />
                </div>
              </div>
            )}
          </div>

          {/* Botón acción */}
          <div style={{ padding: '12px 16px 90px', borderTop: '1px solid #f0f0f0' }}>
            {newEspacioStep === 1 ? (
              <button onClick={() => setNewEspacioStep(2)} style={{ width: '100%', padding: '14px', background: '#00c8a0', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>
                Continuar
              </button>
            ) : (
              <button onClick={publishEspacio} disabled={!newEspacioName.trim()} style={{ width: '100%', padding: '14px', background: newEspacioName.trim() ? '#00c8a0' : '#e0e0e0', border: 'none', borderRadius: '12px', color: newEspacioName.trim() ? '#fff' : '#aaa', fontSize: '15px', fontWeight: '700', cursor: newEspacioName.trim() ? 'pointer' : 'default' }}>
                Crear {newEspacioType === 'publico' ? 'canal' : 'comunidad'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* MODAL EDITAR TEXTO SLIDE */}
      {editingSlide !== null && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 4000, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-end', fontFamily: '-apple-system, sans-serif' }}>
          <div style={{ width: '100%', background: '#fff', borderRadius: '20px 20px 0 0', padding: '20px 16px 36px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ fontSize: '16px', fontWeight: '700', color: '#111' }}>Editar texto</span>
              <button onClick={() => setEditingSlide(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', padding: '4px' }}>{Icon.close}</button>
            </div>
            <textarea value={editText} onChange={e => setEditText(e.target.value)} maxLength={200} autoFocus style={{ width: '100%', minHeight: '90px', background: '#f5f5f5', border: '1px solid #e5e7eb', borderRadius: '12px', color: '#111', fontSize: '15px', padding: '12px', outline: 'none', resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit', marginBottom: '12px' }} />
            <button onClick={saveEditSlide} style={{ width: '100%', padding: '13px', background: '#00c8a0', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>Guardar</button>
          </div>
        </div>
      )}
    </div>
  );
};

