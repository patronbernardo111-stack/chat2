import React, { useState, useEffect, useRef, useCallback } from 'react';
import { chatAPI } from './api';
import { Avatar } from './Avatar';

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface Msg {
  id: string;
  from: 'me' | 'them';
  text: string;
  time: string;
  timestamp?: string;
  created_at?: string;
  status?: 'pending' | 'delivered' | 'read';
  type?: 'text' | 'image' | 'audio' | 'file' | 'call';
  imageUrl?: string;
  audioUrl?: string;
  fileUrl?: string;
  fileName?: string;
  editing?: boolean;
  edited?: boolean;
}

interface ChatContact {
  id: string;
  title: string;
  subtitle?: string;
  status?: 'online' | 'offline' | 'away';
  avatarUrl?: string;
  initials?: string;
  color?: string;
  isGroup?: boolean;
  members?: number;
  user_id?: string;
}

interface Props {
  chat: ChatContact;
  messages: Msg[];
  currentUserId: string;
  onBack: () => void;
  onSendMessage: (text: string) => Promise<void>;
  onSendFile?: (file: File) => Promise<void>;
  onDeleteMessage?: (msgId: string) => void;
  onDeleteMessageForMe?: (msgId: string) => void;
  onEditMessage?: (msgId: string, newText: string) => void;
  onStartCall?: (type: 'audio' | 'video') => void;
  onOpenCamera?: () => void;
  onOpenWallpaper?: () => void;
  onOpenProfile?: () => void;
  wallpaperStyle?: React.CSSProperties;
  wallpaperContent?: React.ReactNode;
  selectedWallpaper?: string;
  showReadReceipts?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getMsgTs = (m: Msg): number => {
  if (m.created_at) { const d = new Date(m.created_at); if (!isNaN(d.getTime())) return d.getTime(); }
  if (m.timestamp)  { const d = new Date(m.timestamp);  if (!isNaN(d.getTime())) return d.getTime(); }
  const numId = parseInt((m.id?.toString() || '').replace(/\D/g, '') || '0');
  if (numId > 1_000_000_000_000) return numId;
  return 0;
};

const getDateLabel = (m: Msg): string => {
  const ts = getMsgTs(m);
  if (!ts) return 'Hoy';
  const msgDate = new Date(ts);
  if (isNaN(msgDate.getTime())) return 'Hoy';
  const today = new Date();
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  if (msgDate.toDateString() === today.toDateString()) return 'Hoy';
  if (msgDate.toDateString() === yesterday.toDateString()) return 'Ayer';
  const diffDays = Math.floor((today.getTime() - msgDate.getTime()) / 86400000);
  if (diffDays < 7) return msgDate.toLocaleDateString('es-ES', { weekday: 'long' }).replace(/^\w/, c => c.toUpperCase());
  return msgDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
};

const makeTime = () => {
  const n = new Date();
  return `${n.getHours().toString().padStart(2,'0')}:${n.getMinutes().toString().padStart(2,'0')}`;
};

// ─── Componente principal ─────────────────────────────────────────────────────
export const ChatConversation: React.FC<Props> = ({
  chat, messages, currentUserId,
  onBack, onSendMessage, onSendFile,
  onDeleteMessage, onDeleteMessageForMe, onEditMessage,
  onStartCall, onOpenCamera, onOpenWallpaper, onOpenProfile,
  wallpaperStyle, wallpaperContent, selectedWallpaper,
  showReadReceipts = true,
}) => {
  const [input, setInput] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ msg: Msg; x: number; y: number } | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isNearBottomRef = useRef(true);

  // Ordenar mensajes ASC (antiguo arriba, nuevo abajo)
  const sorted = [...messages].sort((a, b) => getMsgTs(a) - getMsgTs(b));

  // Scroll al fondo al montar y cuando llegan mensajes nuevos — SIEMPRE
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    });
  }, [sorted.length]);

  // Scroll al fondo al abrir el chat
  useEffect(() => {
    setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, 100);
  }, [chat.id]);

  // Detectar si el usuario está cerca del fondo
  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
    isNearBottomRef.current = dist < 150;
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;

    if (editingId) {
      onEditMessage?.(editingId, text);
      setEditingId(null);
      setInput('');
      return;
    }

    setInput('');
    // Scroll inmediato al enviar
    requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    });
    await onSendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    if (e.key === 'Escape' && editingId) { setEditingId(null); setInput(''); }
  };

  const startEdit = (msg: Msg) => {
    setEditingId(msg.id);
    setInput(msg.text);
    setContextMenu(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleLongPress = (msg: Msg, e: React.TouchEvent) => {
    const touch = e.touches[0];
    const timer = setTimeout(() => setContextMenu({ msg, x: touch.clientX, y: touch.clientY }), 500);
    const cancel = () => clearTimeout(timer);
    e.currentTarget.addEventListener('touchend', cancel, { once: true });
    e.currentTarget.addEventListener('touchmove', cancel, { once: true });
  };

  // ─── Render de burbuja ───────────────────────────────────────────────────────
  const renderBubble = (msg: Msg) => {
    const isMe = msg.from === 'me';
    const bg = isMe
      ? (selectedWallpaper && selectedWallpaper !== 'none' ? 'rgba(217,253,211,0.92)' : '#d9fdd3')
      : (selectedWallpaper && selectedWallpaper !== 'none' ? 'rgba(255,255,255,0.92)' : '#ffffff');
    const radius = isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px';

    // ── Burbuja de llamada — compacta y profesional ──
    if (msg.type === 'call') {
      const isVideo = msg.text?.toLowerCase().includes('video');
      const isOutgoing = msg.text?.toLowerCase().includes('saliente') || msg.text?.toLowerCase().includes('outgoing');
      const isMissed = msg.text?.toLowerCase().includes('perdida') || msg.text?.toLowerCase().includes('missed');
      const iconColor = isMissed ? '#ef4444' : isMe ? '#00c8a0' : '#6b7280';
      const label = isVideo
        ? (isOutgoing ? 'Videollamada saliente' : isMissed ? 'Videollamada perdida' : 'Videollamada recibida')
        : (isOutgoing ? 'Llamada saliente' : isMissed ? 'Llamada perdida' : 'Llamada recibida');
      return (
        <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: '2px' }}>
          <div style={{
            background: isMe ? '#d9fdd3' : '#fff',
            borderRadius: radius,
            padding: '7px 10px 6px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
            display: 'flex', alignItems: 'center', gap: '8px',
            minWidth: '150px', maxWidth: '210px',
          }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: `${iconColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {isVideo
                ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
                : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.13 12 19.79 19.79 0 0 1 1.06 3.38 2 2 0 0 1 3 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              }
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                {isOutgoing
                  ? <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2.5" strokeLinecap="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
                  : <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2.5" strokeLinecap="round"><line x1="17" y1="7" x2="7" y2="17"/><polyline points="17 17 7 17 7 7"/></svg>
                }
                <span style={{ fontSize: '12px', fontWeight: '600', color: isMissed ? '#ef4444' : '#111827' }}>{label}</span>
              </div>
              <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '1px' }}>{isVideo ? 'Videollamada' : 'Llamada de voz'}</div>
            </div>
            <span style={{ fontSize: '10px', color: '#9ca3af', flexShrink: 0, alignSelf: 'flex-end' }}>{msg.time}</span>
          </div>
        </div>
      );
    }

    // ── Burbuja normal ──
    return (
      <div
        key={msg.id}
        style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: '2px' }}
        onContextMenu={e => { e.preventDefault(); setContextMenu({ msg, x: e.clientX, y: e.clientY }); }}
        onTouchStart={e => handleLongPress(msg, e)}
      >
        <div style={{
          maxWidth: '72%', background: bg, borderRadius: radius,
          padding: msg.imageUrl ? '4px 4px 7px' : '8px 12px 6px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.12)',
          opacity: msg.editing ? 0.6 : 1,
          transition: 'opacity 0.2s',
        }}>
          {/* Imagen */}
          {msg.imageUrl && (
            <img src={msg.imageUrl} alt="" style={{ width: '100%', maxWidth: '260px', borderRadius: '12px', display: 'block' }} />
          )}

          {/* Texto */}
          {msg.text && (
            <p style={{ margin: 0, fontSize: '15px', color: '#111827', lineHeight: 1.45, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
              {msg.text}
            </p>
          )}

          {/* Meta: hora + estado + editado */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', marginTop: '3px' }}>
            {msg.edited && <span style={{ fontSize: '10px', color: '#9ca3af' }}>editado</span>}
            <span style={{ fontSize: '11px', color: '#9ca3af' }}>{msg.time}</span>
            {isMe && showReadReceipts && (
              <span style={{ fontSize: '12px', color: msg.status === 'read' ? '#53bdeb' : '#9ca3af' }}>
                {msg.status === 'pending' ? '○' : msg.status === 'delivered' ? '✓✓' : msg.status === 'read' ? '✓✓' : '✓'}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', background: '#fff', zIndex: 1100 }}>

      {/* Header */}
      <div style={{
        background: '#fff',
        borderBottom: 'none',
        flexShrink: 0, zIndex: 10,
        paddingTop: 'env(safe-area-inset-top, 0px)',
        marginTop: 0,
      }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '6px 8px 6px 4px',
        background: '#fff',
      }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 2px', color: '#374151', display: 'flex', flexShrink: 0 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>

        <div style={{ cursor: 'pointer', flexShrink: 0 }} onClick={onOpenProfile}>
          <Avatar name={chat.title} size={38} status={chat.status as any} showStatus={!chat.isGroup} photo={chat.avatarUrl} />
        </div>

        <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={onOpenProfile}>
          <div style={{ fontSize: '15px', fontWeight: '700', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{chat.title}</div>
          <div style={{ fontSize: '11px', color: chat.status === 'online' ? '#00c8a0' : '#9ca3af' }}>
            {chat.isGroup ? `${chat.members || ''} miembros` : chat.status === 'online' ? '● En línea' : 'Desconectado'}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0px', flexShrink: 0 }}>
          {onStartCall && (
            <>
              <button onClick={() => onStartCall('audio')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', color: '#54656f', display: 'flex' }}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.13 12 19.79 19.79 0 0 1 1.06 3.38 2 2 0 0 1 3 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              </button>
              <button onClick={() => onStartCall('video')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', color: '#54656f', display: 'flex' }}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
              </button>
            </>
          )}
          {onOpenCamera && (
            <button onClick={onOpenCamera} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', color: '#54656f', display: 'flex' }}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            </button>
          )}
          <button onClick={() => setShowMenu(p => !p)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', color: '#54656f', display: 'flex' }}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
          </button>
        </div>
      </div>
      </div>

      {/* Área de mensajes — patrón EGCHAT */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{ flex: 1, overflowY: 'scroll', overflowX: 'hidden', WebkitOverflowScrolling: 'touch', position: 'relative', ...(wallpaperStyle || { background: '#f0f2f5' }) }}
      >
        {wallpaperContent}
        {/* Contenedor interior con flex-end — mensajes pegados al fondo */}
        <div style={{ position: 'relative', zIndex: 1, minHeight: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '8px 10px', gap: '2px' }}>
          {sorted.map((msg, i) => {
            const label = getDateLabel(msg);
            const prevLabel = i > 0 ? getDateLabel(sorted[i - 1]) : null;
            const showDate = label !== prevLabel;
            return (
              <React.Fragment key={msg.id}>
                {showDate && (
                  <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0 4px' }}>
                    <span style={{ background: 'rgba(0,0,0,0.18)', color: '#fff', fontSize: '11px', fontWeight: '600', padding: '3px 12px', borderRadius: '10px' }}>
                      {label}
                    </span>
                  </div>
                )}
                {renderBubble(msg)}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Indicador de edición */}
      {editingId && (
        <div style={{ background: '#fff7ed', borderTop: '2px solid #f59e0b', padding: '6px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <span style={{ fontSize: '13px', color: '#92400e', fontWeight: '600' }}>✏️ Editando mensaje</span>
          <button onClick={() => { setEditingId(null); setInput(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#92400e', fontSize: '18px' }}>×</button>
        </div>
      )}

      {/* Input */}
      <div style={{
        flexShrink: 0, background: '#fff', borderTop: '1px solid rgba(0,0,0,0.07)',
        padding: '8px 10px',
        paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
        display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        <input ref={fileInputRef} type="file" accept="image/*,video/*,audio/*,.pdf,.doc,.docx" style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f && onSendFile) onSendFile(f); e.target.value = ''; }} />

        <button onClick={() => fileInputRef.current?.click()}
          style={{ background: '#f3f4f6', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6b7280', flexShrink: 0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: '#f3f4f6', borderRadius: '22px', minHeight: '44px', padding: '0 14px', gap: '6px' }}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={editingId ? 'Edita el mensaje...' : 'Escribe un mensaje...'}
            style={{ flex: 1, background: 'none', border: 'none', fontSize: '15px', color: '#111827', outline: 'none', fontFamily: 'inherit' }}
          />
        </div>

        <button
          onClick={handleSend}
          disabled={!input.trim()}
          style={{
            background: input.trim() ? 'linear-gradient(135deg,#00c8a0,#00b4e6)' : '#e5e7eb',
            border: 'none', borderRadius: '50%', width: '44px', height: '44px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: input.trim() ? 'pointer' : 'default', color: '#fff', flexShrink: 0,
          }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </div>

      {/* Menú contextual */}
      {contextMenu && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 5999, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }} onClick={() => setContextMenu(null)} />
          <div style={{ position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', zIndex: 6000, width: '260px', background: '#fff', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            {[
              { label: 'Copiar', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>, action: () => { navigator.clipboard?.writeText(contextMenu.msg.text || ''); setContextMenu(null); } },
              { label: 'Responder', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>, action: () => { setInput(`> ${contextMenu.msg.text?.slice(0,40)}...\n`); setContextMenu(null); inputRef.current?.focus(); } },
              ...(contextMenu.msg.from === 'me' ? [
                { label: 'Editar', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>, action: () => startEdit(contextMenu.msg) },
                { label: 'Eliminar para todos', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>, action: () => { onDeleteMessage?.(contextMenu.msg.id); setContextMenu(null); }, danger: true },
                { label: 'Eliminar para mí', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>, action: () => { onDeleteMessageForMe?.(contextMenu.msg.id); setContextMenu(null); }, danger: true },
              ] : [
                { label: 'Eliminar para mí', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>, action: () => { onDeleteMessageForMe?.(contextMenu.msg.id); setContextMenu(null); }, danger: true },
              ]),
            ].map(item => (
              <button key={item.label} onClick={item.action} style={{ width: '100%', background: 'none', border: 'none', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '15px', color: (item as any).danger ? '#ef4444' : '#111827', borderBottom: '1px solid #f3f4f6', fontFamily: 'inherit' }}>
                <span style={{ display: 'flex', alignItems: 'center', color: (item as any).danger ? '#ef4444' : '#6b7280' }}>{item.icon}</span>{item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ChatConversation;
