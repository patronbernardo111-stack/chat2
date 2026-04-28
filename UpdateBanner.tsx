import React, { useEffect, useState } from 'react';

// Versión actual de la app — incrementar en cada release
export const APP_VERSION = '2.5.2';

interface Props {
  onUpdate?: () => void;
}

// Actualización completamente silenciosa — sin banner, auto-instala en background
export const UpdateBanner: React.FC<Props> = ({ onUpdate }) => {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const applyUpdate = (worker: ServiceWorker) => {
      worker.postMessage({ type: 'SKIP_WAITING' });
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        onUpdate?.();
        // Recargar solo si está en background para no interrumpir al usuario
        if (document.visibilityState === 'hidden') {
          window.location.reload();
        } else {
          const onHide = () => {
            document.removeEventListener('visibilitychange', onHide);
            window.location.reload();
          };
          document.addEventListener('visibilitychange', onHide);
        }
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
    return () => clearInterval(interval);
  }, []);

  return null; // Sin UI — actualización invisible
};
