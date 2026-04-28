import React, { useEffect } from 'react';

// Gestión silenciosa de actualizaciones del SW — sin recargas visibles al usuario
const UpdateManager: React.FC = () => {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleMessage = (event: MessageEvent) => {
      // SW_UPDATED: solo recargar si la app está en background
      if (event.data?.type === 'SW_UPDATED') {
        if (document.visibilityState === 'hidden') {
          window.location.reload();
        } else {
          // Esperar a que vaya a background — con guard para no disparar múltiples veces
          let scheduled = false;
          const onHide = () => {
            if (scheduled) return;
            if (document.visibilityState === 'hidden') {
              scheduled = true;
              document.removeEventListener('visibilitychange', onHide);
              window.location.reload();
            }
          };
          document.addEventListener('visibilitychange', onHide);
          // Cancelar si pasan 30 min sin ir a background
          setTimeout(() => document.removeEventListener('visibilitychange', onHide), 30 * 60 * 1000);
        }
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
  }, []);

  return null;
};

export default UpdateManager;
