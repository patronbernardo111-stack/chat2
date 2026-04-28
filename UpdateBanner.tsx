import React, { useEffect, useState } from 'react';

// Versión actual de la app — incrementar en cada release
export const APP_VERSION = '2.5.2';

interface Props {
  onUpdate?: () => void;
}

export const UpdateBanner: React.FC<Props> = ({ onUpdate }) => {
  const [showBanner, setShowBanner] = useState(false);
  const [pendingWorker, setPendingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const applyUpdate = (worker: ServiceWorker) => {
      setPendingWorker(worker);
      setShowBanner(true);
    };

    const doReload = (worker: ServiceWorker) => {
      worker.postMessage({ type: 'SKIP_WAITING' });
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        onUpdate?.();
        window.location.reload();
      }, { once: true });
    };

    const checkForUpdate = async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration('/sw.js');
        if (!reg) return;
        if (reg.waiting) { applyUpdate(reg.waiting); return; }
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              applyUpdate(newWorker);
            }
          });
        });
        reg.update().catch(() => {});
      } catch {}
    };

    checkForUpdate();
    const interval = setInterval(checkForUpdate, 5 * 60 * 1000);

    // Auto-actualizar cuando la app va a background (usuario no lo ve)
    const onVisibility = () => {
      if (document.visibilityState === 'hidden' && pendingWorker) {
        doReload(pendingWorker);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [pendingWorker]);

  if (!showBanner || !pendingWorker) return null;

  const doReloadNow = () => {
    pendingWorker.postMessage({ type: 'SKIP_WAITING' });
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      onUpdate?.();
      window.location.reload();
    }, { once: true });
  };

  return (
    <div style={{
      position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)',
      zIndex: 99999, display: 'flex', alignItems: 'center', gap: '10px',
      background: '#111827', color: '#fff', borderRadius: '14px',
      padding: '10px 16px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      fontSize: '13px', fontWeight: '600', maxWidth: '320px', width: 'calc(100% - 32px)',
      animation: 'slideUp 0.3s ease',
    }}>
      <style>{`@keyframes slideUp { from { opacity:0; transform:translateX(-50%) translateY(20px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }`}</style>
      <span style={{ fontSize: '18px' }}>🆕</span>
      <span style={{ flex: 1 }}>Nueva versión disponible</span>
      <button
        onClick={doReloadNow}
        style={{
          background: '#00c8a0', border: 'none', borderRadius: '8px',
          padding: '6px 12px', color: '#fff', fontSize: '12px',
          fontWeight: '700', cursor: 'pointer', flexShrink: 0,
        }}
      >
        Actualizar
      </button>
      <button
        onClick={() => setShowBanner(false)}
        style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '2px', fontSize: '16px', flexShrink: 0 }}
      >
        ✕
      </button>
    </div>
  );
};
