// Service Worker v20260427d — Web Push + llamadas + mensajes + auto-update
const CACHE = 'egchat-v20260427d';
const VAPID_PUBLIC_KEY = 'BNeDJFYqIX59vgqEKxWfrI263knyPGHafMEK_WrMPeYaIm8bn62vcOah7hDlgIek4R4utB82g-cT9CwAtGn0wUs';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('message', (e) => {
  if (e.data?.type === 'SKIP_WAITING') self.skipWaiting();
  // La app avisa que ya procesó la llamada
  if (e.data?.type === 'CALL_HANDLED') {
    const callId = e.data.callId;
    // Cerrar la notificación de llamada si sigue visible
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
        // Notificar a todos los clientes que el SW se actualizó
        self.clients.matchAll({ type: 'window' }).then(clients => {
          clients.forEach(client => client.postMessage({ type: 'SW_UPDATED' }));
        });
      })
  );
});

// Solo interceptar para excluir páginas HTML estáticas
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.pathname.endsWith('.html')) return;
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

  const options = isCall
    ? {
        body: data.body || 'Llamada entrante',
        icon: data.icon || '/favicon.svg',
        badge: '/favicon.svg',
        tag: `call-${data.callId || Date.now()}`,
        renotify: false,                       // NO reanimar — evita parpadeo
        requireInteraction: true,              // No desaparece sola
        silent: false,
        vibrate: [500, 200, 500, 200, 500, 200, 500, 200, 500],
        data: {
          url: '/',
          callId: data.callId,
          callerId: data.callerId,
          callerName: data.callerName,
          callType: data.callType || 'audio',
          notificationType: 'incoming_call',
          receivedAt: Date.now(),
        },
        actions: [
          { action: 'accept', title: '✅ Aceptar' },
          { action: 'reject', title: '❌ Rechazar' },
        ],
      }
    : {
        body: data.body || 'Tienes un nuevo mensaje',
        icon: data.icon || '/favicon.svg',
        badge: '/favicon.svg',
        tag: data.tag || 'egchat-msg',
        renotify: true,
        requireInteraction: false,
        silent: false,
        vibrate: [200, 100, 200],
        data: {
          url: data.url || '/',
          chatId: data.chatId || null,
          notificationType: 'message',
        },
        actions: [
          { action: 'open',    title: '💬 Abrir' },
          { action: 'dismiss', title: 'Ignorar' },
        ],
      };

  e.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// ── CLICK EN NOTIFICACIÓN ───────────────────────────────────────────────────
self.addEventListener('notificationclick', e => {
  e.notification.close();

  const notifData = e.notification.data || {};
  const action = e.action;

  // Cancelar renotificaciones al interactuar
  if (notifData.callId) {
    self.registration.getNotifications({ tag: `call-${notifData.callId}` })
      .then(ns => ns.forEach(n => n.close()));
  }

  // ── Llamada ──
  if (notifData.notificationType === 'incoming_call') {
    if (action === 'reject') {
      // Notificar a la app que rechazó la llamada
      e.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(wins => {
          for (const w of wins) {
            w.postMessage({ type: 'CALL_REJECTED', callId: notifData.callId });
          }
        })
      );
      return;
    }

    // Aceptar o tocar la notificación — abrir app y pasar datos de llamada
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

        // Buscar ventana ya abierta de la app
        for (const w of wins) {
          if (w.url.includes(self.location.origin)) {
            w.postMessage(msg);
            if ('focus' in w) w.focus();
            return;
          }
        }

        // No hay ventana abierta — abrir una nueva con params en URL
        const url = `/?call=${notifData.callId}&caller=${encodeURIComponent(notifData.callerName || '')}&type=${notifData.callType || 'audio'}${action === 'accept' ? '&accept=1' : ''}`;
        const newWin = await clients.openWindow(url);
        // Enviar el mensaje en múltiples intentos para asegurar que llegue
        // (la app puede tardar en cargar cuando el teléfono estaba hibernado)
        if (newWin) {
          setTimeout(() => { try { newWin.postMessage(msg); } catch {} }, 2000);
          setTimeout(() => { try { newWin.postMessage(msg); } catch {} }, 4000);
          setTimeout(() => { try { newWin.postMessage(msg); } catch {} }, 7000);
        }
      })
    );
    return;
  }

  // ── Mensaje ──
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

// ── CIERRE DE NOTIFICACIÓN (timeout de llamada) ─────────────────────────────
self.addEventListener('notificationclose', e => {
  const notifData = e.notification.data || {};
  if (notifData.notificationType === 'incoming_call') {
    // Informar a la app que la notificación fue cerrada (llamada perdida)
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(wins => {
      for (const w of wins) {
        w.postMessage({ type: 'CALL_MISSED', callId: notifData.callId });
      }
    });
  }
});
