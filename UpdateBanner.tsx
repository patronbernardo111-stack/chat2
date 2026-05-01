// UpdateBanner.tsx — Fuerza actualización de la PWA cuando hay nueva versión
import React, { useEffect, useState } from 'react';

export const UpdateBanner: React.FC = () => {
  const [show, setShow] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    // Detectar cuando hay un SW nuevo esperando
    navigator.serviceWorker.ready.then(reg => {
      if (reg.waiting) {
        setShow(true);
      }
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setShow(true);
          }
        });
      });
    });

    // Cuando el SW toma control, recargar
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  }, []);

  const forceUpdate = async () => {
    setUpdating(true);
    try {
      // 1. Desregistrar todos los SW
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.unregister()));
      }
      // 2. Limpiar todos los caches
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
      // 3. Recargar forzado
      window.location.reload();
    } catch {
      window.location.reload();
    }
  };

  // Siempre mostrar el botón de actualización en la esquina (pequeño)
  // para que el usuario pueda forzar actualización cuando quiera
  return (
    <>
      {/* Banner cuando hay actualización disponible */}
      {show && (
        <div style={{
          position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 9999, background: '#00c8a0', color: '#fff',
          padding: '12px 20px', borderRadius: '24px',
          fontSize: '14px', fontWeight: '700',
          boxShadow: '0 4px 20px rgba(0,200,160,0.4)',
          display: 'flex', alignItems: 'center', gap: '10px',
          cursor: 'pointer', whiteSpace: 'nowrap',
          animation: 'dropdownIn 0.3s ease',
        }} onClick={forceUpdate}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          {updating ? 'Actualizando...' : '¡Nueva versión disponible! Toca para actualizar'}
        </div>
      )}

      {/* Botón pequeño siempre visible para forzar actualización */}
      <button
        onClick={forceUpdate}
        title="Forzar actualización de la app"
        style={{
          position: 'fixed', bottom: '80px', right: '8px',
          zIndex: 9998, background: 'rgba(0,0,0,0.15)',
          border: 'none', borderRadius: '50%',
          width: '28px', height: '28px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', opacity: 0.5,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
          <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
        </svg>
      </button>
    </>
  );
};
