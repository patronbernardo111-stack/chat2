// EGChatDesktopWelcome.tsx — Panel de bienvenida desktop EGCHAT
import React, { useState, useEffect } from 'react';

interface Props {
  userName?: string;
  userAvatar?: string;
  userBalance?: number;
  totalChats?: number;
  totalContacts?: number;
  onNewChat?: () => void;
  onOpenWallet?: () => void;
  onOpenServices?: () => void;
}

const TIPS = [
  'Envía dinero a tus contactos directamente desde el chat',
  'Usa Lia-25 para consultar tu saldo y hacer transferencias por voz',
  'Activa las notificaciones para no perderte ningún mensaje',
  'Escanea el QR de un contacto para añadirlo instantáneamente',
  'Los grupos soportan hasta 256 participantes',
  'Puedes recargar tu teléfono desde la sección Servicios',
];

export const EGChatDesktopWelcome: React.FC<Props> = ({
  userName = 'Usuario',
  userAvatar,
  userBalance = 0,
  totalChats = 0,
  totalContacts = 0,
  onNewChat,
  onOpenWallet,
  onOpenServices,
}) => {
  const [tipIdx, setTipIdx] = useState(0);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setTipIdx(i => (i + 1) % TIPS.length), 5000);
    return () => clearInterval(t);
  }, []);

  const hour = time.getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';
  const firstName = userName.split(' ')[0];
  const initials = userName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#f8fafc',
      padding: '32px',
      gap: '24px',
      overflowY: 'auto',
    }}>
      {/* Avatar del usuario — sin fondo de color, solo la foto */}
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '88px', height: '88px', borderRadius: '50%',
          margin: '0 auto 14px',
          overflow: 'hidden',
          border: '3px solid #e5e7eb',
          background: '#f3f4f6',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        }}>
          {userAvatar
            ? <img src={userAvatar} alt={userName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: '28px', fontWeight: '700', color: '#6b7280' }}>{initials}</span>
          }
        </div>
        <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', margin: '0 0 4px' }}>
          {greeting}, {firstName} 👋
        </h1>
        <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>
          {time.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          {' · '}
          {time.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '12px', width: '100%', maxWidth: '460px' }}>
        {[
          { label: 'Conversaciones', value: totalChats, color: '#00b4e6',
            icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
          { label: 'Contactos', value: totalContacts, color: '#00c8a0',
            icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
          { label: 'Saldo XAF', value: userBalance.toLocaleString(), color: '#f59e0b',
            icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
        ].map(stat => (
          <div key={stat.label} style={{
            flex: 1, background: '#fff', borderRadius: '14px', padding: '16px 10px',
            textAlign: 'center', boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
            border: '1px solid #f0f0f0',
          }}>
            <div style={{ color: stat.color, display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>{stat.icon}</div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: stat.color, lineHeight: 1 }}>{stat.value}</div>
            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Acciones */}
      <div style={{ display: 'flex', gap: '10px', width: '100%', maxWidth: '460px' }}>
        <button onClick={onNewChat} style={{
          flex: 1, padding: '12px 8px', borderRadius: '12px', border: 'none', cursor: 'pointer',
          background: 'linear-gradient(135deg, #00c8a0, #00b4e6)',
          color: '#fff', fontSize: '13px', fontWeight: '700',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
          boxShadow: '0 3px 12px rgba(0,200,160,0.25)',
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          Nuevo chat
        </button>
        <button onClick={onOpenWallet} style={{
          flex: 1, padding: '12px 8px', borderRadius: '12px',
          border: '1.5px solid #e5e7eb', cursor: 'pointer',
          background: '#fff', color: '#374151', fontSize: '13px', fontWeight: '600',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#00c8a0" strokeWidth="2.5" strokeLinecap="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
          Cartera
        </button>
        <button onClick={onOpenServices} style={{
          flex: 1, padding: '12px 8px', borderRadius: '12px',
          border: '1.5px solid #e5e7eb', cursor: 'pointer',
          background: '#fff', color: '#374151', fontSize: '13px', fontWeight: '600',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
          Servicios
        </button>
      </div>

      {/* Tip */}
      <div style={{
        width: '100%', maxWidth: '460px',
        background: '#fff', borderRadius: '12px',
        padding: '14px 16px', border: '1px solid #e5e7eb',
        display: 'flex', alignItems: 'flex-start', gap: '10px',
        boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
      }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(0,200,160,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00c8a0" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <div>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#00c8a0', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Consejo EGCHAT</div>
          <div style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.5 }}>{TIPS[tipIdx]}</div>
        </div>
      </div>

      <div style={{ fontSize: '11px', color: '#d1d5db' }}>EGCHAT v2.5 · Guinea Ecuatorial 🇬🇶</div>
    </div>
  );
};

export default EGChatDesktopWelcome;
