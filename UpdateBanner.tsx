// UpdateBanner.tsx — Fuerza actualización de la PWA
import React, { useEffect, useState } from 'react';

const forceUpdate = async () => {
  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r => r.unregister()));
    }
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    }
  } catch {}
  window.location.reload();
};

export const UpdateBanner: React.FC = () => {
  const [hasUpdate, setHasUpdate] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.ready.then(reg => {
      if (reg.waiting) setHasUpdate(true);
      reg.addEventListener('updatefound', () => {
        const nw = reg.installing;
        if (!nw) return;
        nw.addEventListener('statechange', () => {
          if (nw.state === 'installed' && navigator.serviceWorker.controller) setHasUpdate(true);
        });
      });
    });

    // ELIMINADO: controllerchange → reload() automático
    // Esto causaba que el SW disparara un reload completo de la página en iOS
    // cada vez que se activaba (skipWaiting + clients.claim), causando el parpadeo.
    // Ahora el reload solo ocurre cuando el usuario toca el banner manualmente.
  }, []);

  return (
    <>
      {/* Banner cuando hay actualización — solo visible si hay update real */}
      {hasUpdate && (
        <div onClick={forceUpdate} style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 99999,
          background: 'linear-gradient(90deg,#00c8a0,#00b4e6)',
          color: '#fff', padding: '10px 16px', textAlign: 'center',
          fontSize: '14px', fontWeight: '700', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          Nueva versión disponible — Toca aquí para actualizar
        </div>
      )}

      {/* Botón flotante SIEMPRE visible — esquina inferior derecha */}
      <button onClick={forceUpdate} title="Limpiar caché y actualizar app"
        style={{
          position: 'fixed', bottom: '90px', right: '12px', zIndex: 9998,
          background: 'rgba(0,200,160,0.9)', border: 'none', borderRadius: '50%',
          width: '40px', height: '40px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', boxShadow: '0 2px 12px rgba(0,200,160,0.4)',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
          <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
        </svg>
      </button>
    </>
  );
};
