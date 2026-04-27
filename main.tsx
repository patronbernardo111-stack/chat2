import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import initSelectionErrorHandler from './selectionErrorHandler';
import { WalletProvider } from './WalletSystem';

initSelectionErrorHandler();

// ── Service Worker + Web Push ─────────────────────────────────────────────
const VAPID_PUBLIC_KEY = 'BNeDJFYqIX59vgqEKxWfrI263knyPGHafMEK_WrMPeYaIm8bn62vcOah7hDlgIek4R4utB82g-cT9CwAtGn0wUs';
const API_BASE = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) || 'https://egchat-api.onrender.com';

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; i++) {
    view[i] = rawData.charCodeAt(i);
  }
  return buffer;
}

async function registerPush(registration: ServiceWorkerRegistration) {
  try {
    // Si el permiso no está concedido, pedirlo
    if (Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;
    }

    // Suscribirse al push
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    // Enviar suscripción al backend
    const token = localStorage.getItem('token') || localStorage.getItem('auth_token') || localStorage.getItem('egchat_token') || localStorage.getItem('egchat_token_backup') || '';
    if (!token) { console.warn('Push: no token found'); return; }

    const resp = await fetch(`${API_BASE}/api/push/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ subscription: subscription.toJSON() }),
    });
    if (resp.ok) {
      console.log('Push subscription registered successfully');
    } else {
      console.warn('Push subscription failed:', await resp.text());
    }
  } catch (e) {
    console.warn('Push subscription failed:', e);
  }
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      // Desregistrar SWs viejos que no sean el nuestro
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        if (!reg.active?.scriptURL?.includes('/sw.js')) {
          await reg.unregister();
        }
      }

      // Registrar nuestro SW
      const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });

      // Forzar activación inmediata si hay una nueva versión esperando
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed') {
              newWorker.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        }
      });

      // Escuchar mensajes del SW (click en notificación)
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'NOTIFICATION_CLICK') {
          window.dispatchEvent(new CustomEvent('sw-notification-click', { detail: event.data }));
        }
        // SW actualizado — recargar solo una vez
        if (event.data?.type === 'SW_UPDATED') {
          if (!sessionStorage.getItem('sw_reloaded')) {
            sessionStorage.setItem('sw_reloaded', '1');
            window.location.reload();
          }
        }
        // Bufferizar mensajes de llamada para cuando App.tsx aún no esté listo
        if (event.data?.type === 'INCOMING_CALL' || event.data?.type === 'CALL_REJECTED') {
          (window as any).__pendingSWMessage = event.data;
          window.dispatchEvent(new CustomEvent('sw-call-message', { detail: event.data }));
        }
      });

      // Suscribirse al push cuando el usuario ya esté autenticado
      // Intentar inmediatamente y también cuando el token aparezca
      const trySubscribe = () => {
        const token = localStorage.getItem('token') || localStorage.getItem('auth_token') || localStorage.getItem('egchat_token') || '';
        if (token) registerPush(registration);
      };

      trySubscribe();

      // Reintentar cada 5s hasta que haya token (máx 60s)
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        trySubscribe();
        if (attempts >= 12) clearInterval(interval);
      }, 5000);

    } catch (e) {
      console.warn('SW registration failed:', e);
    }
  });
}

// Exportar función para que App.tsx pueda re-suscribir tras login
(window as any).__egchat_registerPush = async () => {
  if (!('serviceWorker' in navigator)) return;
  const reg = await navigator.serviceWorker.ready;
  await registerPush(reg);
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WalletProvider>
      <App />
    </WalletProvider>
  </React.StrictMode>
);
