import React, { useEffect, useState } from 'react';

// Versión actual de la app — incrementar en cada release
export const APP_VERSION = '2.5.2';

interface Props {
  onUpdate?: () => void;
}

export const UpdateBanner: React.FC<Props> = ({ onUpdate }) => {
  const [show, setShow] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const checkForUpdate = async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration('/sw.js');
        if (!reg) return;

        // Ya hay un SW esperando (actualización lista)
        if (reg.waiting) {
          setWaitingWorker(reg.waiting);
          setShow(true);
          return;
        }

        // Escuchar cuando se encuentre una nueva versión
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setWaitingWorker(newWorker);
              setShow(true);
            }
          });
        });

        // Forzar chequeo de actualización
        reg.update().catch(() => {});
      } catch {}
    };

    checkForUpdate();

    // Chequear cada 5 minutos en background
    const interval = setInterval(checkForUpdate, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Escuchar mensaje del SW cuando se activa
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'SW_UPDATED') {
        setShow(false);
        window.location.reload();
      }
    };
    navigator.serviceWorker?.addEventListener('message', handler);
    return () => navigator.serviceWorker?.removeEventListener('message', handler);
  }, []);

  const handleUpdate = () => {
    setUpdating(true);
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      // Recargar tras activación
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      }, { once: true });
    } else {
      window.location.reload();
    }
    onUpdate?.();
  };

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
      zIndex: 9999, width: 'calc(100% - 32px)', maxWidth: 400,
      background: 'linear-gradient(135deg, #00c8a0, #00a882)',
      borderRadius: 16, padding: '14px 16px',
      boxShadow: '0 8px 32px rgba(0,200,160,0.4)',
      display: 'flex', alignItems: 'center', gap: 12,
      animation: 'slideUpBanner 0.4s cubic-bezier(0.34,1.56,0.64,1)',
    }}>
      <style>{`
        @keyframes slideUpBanner {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Icono */}
      <div style={{
        width: 40, height: 40, borderRadius: 12,
        background: 'rgba(255,255,255,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        {updating ? (
          <div style={{ width: 20, height: 20, border: '2.5px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
        )}
      </div>

      {/* Texto */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: '#fff', fontWeight: 700, fontSize: 14, lineHeight: 1.3 }}>
          {updating ? 'Instalando actualización...' : '¡Nueva versión disponible!'}
        </div>
        <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 }}>
          {updating ? 'La app se reiniciará en un momento' : 'Toca para instalar y mejorar la app'}
        </div>
      </div>

      {/* Botón */}
      {!updating && (
        <button
          onClick={handleUpdate}
          style={{
            background: '#fff', border: 'none', borderRadius: 10,
            padding: '8px 14px', color: '#00a882', fontWeight: 700,
            fontSize: 13, cursor: 'pointer', flexShrink: 0,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}
        >
          Instalar
        </button>
      )}

      {/* Cerrar */}
      {!updating && (
        <button
          onClick={() => setShow(false)}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', padding: 4, flexShrink: 0 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      )}
    </div>
  );
};
