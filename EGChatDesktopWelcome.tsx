// EGChatDesktopWelcome.tsx
// Panel de bienvenida para desktop cuando no hay chat seleccionado
// Diseño 100% original EGCHAT — no inspirado en ninguna app existente
import React, { useState, useEffect } from 'react';

interface Props {
  userName?: string;
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

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f0fdf4 100%)',
      padding: '40px 32px',
      gap: '32px',
    }}>
      {/* Logo animado */}
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '80px', height: '80px', borderRadius: '24px',
          background: 'linear-gradient(135deg, #00c8a0, #00b4e6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
          boxShadow: '0 8px 32px rgba(0,200,160,0.3)',
        }}>
          <span style={{ fontSize: '32px', fontWeight: '900', color: '#fff', letterSpacing: '-2px' }}>EG</span>
        </div>
        <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#111827', margin: '0 0 4px' }}>
          {greeting}, {firstName} 👋
        </h1>
        <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
          {time.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })} · {time.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      {/* Stats rápidas */}
      <div style={{ display: 'flex', gap: '16px', width: '100%', maxWidth: '480px' }}>
        {[
          { label: 'Conversaciones', value: totalChats, icon: '💬', color: '#00b4e6' },
          { label: 'Contactos', value: totalContacts, icon: '👥', color: '#00c8a0' },
          { label: 'Saldo XAF', value: userBalance.toLocaleString(), icon: '💰', color: '#f59e0b' },
        ].map(stat => (
          <div key={stat.label} style={{
            flex: 1, background: '#fff', borderRadius: '16px', padding: '16px 12px',
            textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            border: `1px solid ${stat.color}20`,
          }}>
            <div style={{ fontSize: '24px', marginBottom: '6px' }}>{stat.icon}</div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '500' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Acciones rápidas */}
      <div style={{ display: 'flex', gap: '12px', width: '100%', maxWidth: '480px' }}>
        <button onClick={onNewChat} style={{
          flex: 1, padding: '14px', borderRadius: '14px', border: 'none', cursor: 'pointer',
          background: 'linear-gradient(135deg, #00c8a0, #00b4e6)',
          color: '#fff', fontSize: '14px', fontWeight: '700',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          boxShadow: '0 4px 16px rgba(0,200,160,0.3)',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="10" y1="10" x2="14" y2="10"/></svg>
          Nuevo chat
        </button>
        <button onClick={onOpenWallet} style={{
          flex: 1, padding: '14px', borderRadius: '14px', border: '1.5px solid #00c8a020', cursor: 'pointer',
          background: '#fff', color: '#00c8a0', fontSize: '14px', fontWeight: '700',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
          Cartera
        </button>
        <button onClick={onOpenServices} style={{
          flex: 1, padding: '14px', borderRadius: '14px', border: '1.5px solid #8b5cf620', cursor: 'pointer',
          background: '#fff', color: '#8b5cf6', fontSize: '14px', fontWeight: '700',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
          Servicios
        </button>
      </div>

      {/* Tip rotativo */}
      <div style={{
        width: '100%', maxWidth: '480px',
        background: 'rgba(0,200,160,0.08)', borderRadius: '12px',
        padding: '14px 16px', border: '1px solid rgba(0,200,160,0.2)',
        display: 'flex', alignItems: 'flex-start', gap: '10px',
      }}>
        <span style={{ fontSize: '18px', flexShrink: 0 }}>💡</span>
        <div>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#00c8a0', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Consejo EGCHAT</div>
          <div style={{ fontSize: '13px', color: '#374151', lineHeight: 1.5 }}>{TIPS[tipIdx]}</div>
        </div>
      </div>

      {/* Marca */}
      <div style={{ fontSize: '12px', color: '#d1d5db', textAlign: 'center' }}>
        EGCHAT v2.5 · Guinea Ecuatorial 🇬🇶
      </div>
    </div>
  );
};

export default EGChatDesktopWelcome;
