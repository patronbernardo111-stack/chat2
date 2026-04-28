// Service Worker v20260427f — Web Push + llamadas + mensajes + auto-renovación
const CACHE = 'egchat-v20260427f';
const API_BASE = 'https://egchat-api.onrender.com';
const VAPID_PUBLIC_KEY = 'BNeDJFYqIX59vgqEKxWfrI263knyPGHafMEK_WrMPeYaIm8bn62vcOah7hDlgIek4R4utB82g-cT9CwAtGn0wUs';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('message', (e) => {
  if (e.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (e.data?.type === 'CALL_HANDLED') {
    const callId = e.data.callId;
    if (callId) {
      self.registration.getNotifications({ tag: `call-${callId}` }).then(notifs => {
        notifs.forEach(n => n.close());
      });
    }
  }
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
      .then(() => {
        // Notificar a los clientes que el SW está activo — SIN disparar reload
        // (NO enviar SW_UPDATED — causa reload/flash en iOS y móviles)
        return self.clients.matchAll({ type: 'window' }).then(clients => {
          clients.forEach(client => client.postMessage({ type: 'SW_READY' }));
        });
      })
  );
});

self.addEventListener('fetch', e => {
  // No interceptar nada — solo dejar pasar
});

// ── AUTO-RENOVACIÓN DE SUSCRIPCIÓN PUSH ─────────────────────────────────────
// Se dispara cuando el navegador invalida la suscripción (teléfono hibernado, etc.)
self.addEventListener('pushsubscriptionchange', e => {
  e.waitUntil(
    (async () => {
      try {
        // Re-suscribirse con la misma clave VAPID
        const newSubscription = await self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: VAPID_PUBLIC_KEY,
        });

        // Obtener token del cliente para enviar al backend
        const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        let token = '';
        for (const client of clients) {
          // Pedir el token al cliente
          const channel = new MessageChannel();
          const tokenPromise = new Promise(resolve => {
            channel.port1.onmessage = e => resolve(e.data?.token || '');
            setTimeout(() => resolve(''), 2000);
          });
          client.postMessage({ type: 'GET_TOKEN' }, [channel.port2]);
          token = await tokenPromise;
          if (token) break;
        }

        if (!token) return; // Sin token no podemos renovar

        await fetch(`${API_BASE}/api/push/subscribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ subscription: newSubscription.toJSON() }),
        });
      } catch (err) {
        console.warn('pushsubscriptionchange renewal failed:', err);
      }
    })()
  );
});

// ── PUSH NOTIFICATIONS ──────────────────────────────────────────────────────
self.addEventListener('push', e => {
  let data = {};
  try {
    data = e.data ? e.data.json() : {};
  } catch {
    data = { title: 'EGChat', body: e.data ? e.data.text() : 'Nueva notificación' };
  }

  const isCall = data.notificationType === 'incoming_call';
  const title = data.title || 'EGChat';

  // iOS no soporta: vibrate, actions, requireInteraction
  // Usamos opciones compatibles con todos los sistemas
  const options = isCall
    ? {
        body: data.body || 'Llamada entrante',
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        tag: `call-${data.callId || Date.now()}`,
        renotify: false,
        requireInteraction: true,
        silent: false,
        data: {
          url: '/',
          callId: data.callId,
          callerId: data.callerId,
          callerName: data.callerName,
          callType: data.callType || 'audio',
          notificationType: 'incoming_call',
        },
      }
    : {
        body: data.body || 'Tienes un nuevo mensaje',
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        tag: data.tag || 'egchat-msg',
        renotify: true,
        requireInteraction: false,
        silent: false,
        data: {
          url: data.url || '/',
          chatId: data.chatId || null,
          notificationType: 'message',
        },
      };

  e.waitUntil(self.registration.showNotification(title, options));
});

// ── CLICK EN NOTIFICACIÓN ───────────────────────────────────────────────────
self.addEventListener('notificationclick', e => {
  e.notification.close();

  const notifData = e.notification.data || {};
  const action = e.action;

  if (notifData.notificationType === 'incoming_call') {
    if (action === 'reject') {
      e.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(wins => {
          for (const w of wins) {
            w.postMessage({ type: 'CALL_REJECTED', callId: notifData.callId });
          }
        })
      );
      return;
    }

    e.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async wins => {
        const msg = {
          type: 'INCOMING_CALL',
          callId: notifData.callId,
          callerId: notifData.callerId,
          callerName: notifData.callerName,
          callType: notifData.callType,
          autoAccept: action === 'accept',
        };

        for (const w of wins) {
          if (w.url.includes(self.location.origin)) {
            w.postMessage(msg);
            if ('focus' in w) w.focus();
            return;
          }
        }

        const url = `/?call=${notifData.callId}&caller=${encodeURIComponent(notifData.callerName || '')}&type=${notifData.callType || 'audio'}${action === 'accept' ? '&accept=1' : ''}`;
        const newWin = await clients.openWindow(url);
        if (newWin) {
          setTimeout(() => { try { newWin.postMessage(msg); } catch {} }, 2000);
          setTimeout(() => { try { newWin.postMessage(msg); } catch {} }, 5000);
        }
      })
    );
    return;
  }

  if (action === 'dismiss') return;

  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(wins => {
      for (const w of wins) {
        if (w.url.includes(self.location.origin) && 'focus' in w) {
          w.postMessage({ type: 'NOTIFICATION_CLICK', chatId: notifData.chatId });
          return w.focus();
        }
      }
      return clients.openWindow(notifData.url || '/');
    })
  );
});

// ── CIERRE DE NOTIFICACIÓN ───────────────────────────────────────────────────
self.addEventListener('notificationclose', e => {
  const notifData = e.notification.data || {};
  if (notifData.notificationType === 'incoming_call') {
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(wins => {
      for (const w of wins) {
        w.postMessage({ type: 'CALL_MISSED', callId: notifData.callId });
      }
    });
  }
});
