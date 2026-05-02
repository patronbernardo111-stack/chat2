// Service Worker v20260502-v2 — Web Push + llamadas + mensajes + auto-renovación + caché offline + force-update
const CACHE = 'egchat-v20260502-moomwrst';
const API_BASE = 'https://egchat-api.onrender.com';
const VAPID_PUBLIC_KEY = 'BNeDJFYqIX59vgqEKxWfrI263knyPGHafMEK_WrMPeYaIm8bn62vcOah7hDlgIek4R4utB82g-cT9CwAtGn0wUs';

// Assets que se cachean en la instalación (app shell — críticos para arranque)
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/logo-transparent.png',
  '/img.jpg',
  '/manifest.json',
];

self.addEventListener('install', e => {
  // skipWaiting automático para que los cambios se apliquen de inmediato
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(PRECACHE_ASSETS).catch(() => {}))
  );
});

self.addEventListener('message', (e) => {
  // Solo hacer skipWaiting si el cliente lo pide explícitamente (actualización manual)
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
      .then(() => self.clients.claim()) // Tomar control inmediato de todas las pestañas
  );
});

// ── ESTRATEGIA DE CACHÉ PARA REDES LENTAS (2G/3G Guinea Ecuatorial) ─────────
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // No interceptar: esquemas no soportados por Cache API (chrome-extension, etc.)
  if (!url.protocol.startsWith('http')) return;

  // No interceptar: API calls, push, supabase, websockets
  if (
    url.hostname.includes('egchat-api') ||
    url.hostname.includes('supabase') ||
    url.hostname.includes('onrender.com') ||
    e.request.method !== 'GET'
  ) return;

  // Estrategia para assets JS/CSS/imágenes: Network First con fallback a caché
  // Garantiza que siempre se cargue la versión más reciente si hay conexión
  if (
    url.pathname.match(/\.(js|css|woff2?|ttf|otf|eot)$/) ||
    url.pathname.startsWith('/assets/')
  ) {
    e.respondWith(
      caches.open(CACHE).then(async cache => {
        try {
          const response = await fetch(e.request);
          if (response.ok) cache.put(e.request, response.clone());
          return response;
        } catch {
          // Sin red → usar caché
          const cached = await cache.match(e.request);
          return cached || new Response('', { status: 408 });
        }
      })
    );
    return;
  }

  // Estrategia para imágenes: Cache First con fallback
  if (url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico|avif)$/)) {
    e.respondWith(
      caches.open(CACHE).then(async cache => {
        const cached = await cache.match(e.request);
        if (cached) return cached;
        try {
          const response = await fetch(e.request);
          if (response.ok) cache.put(e.request, response.clone());
          return response;
        } catch {
          // Sin red y sin caché — devolver imagen vacía
          return new Response('', { status: 408 });
        }
      })
    );
    return;
  }

  // Estrategia para HTML (navegación): Network First con fallback a caché
  if (e.request.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('.html')) {
    e.respondWith(
      fetch(e.request)
        .then(response => {
          if (response.ok) {
            // Clonar ANTES de devolver para evitar "body already used"
            const cloned = response.clone();
            caches.open(CACHE).then(cache => cache.put(e.request, cloned));
          }
          return response;
        })
        .catch(async () => {
          // Sin red → servir desde caché (modo offline)
          const cached = await caches.match('/index.html') || await caches.match('/');
          return cached || new Response('Sin conexión', { status: 503 });
        })
    );
    return;
  }
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
  const isGovNews = data.notificationType === 'government_news';
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
    : isGovNews
    ? {
        body: data.body || 'Nueva noticia oficial',
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        tag: data.tag || 'gov-news',
        renotify: true,
        requireInteraction: false,
        silent: false,
        data: {
          url: data.url || '/?view=estados&espacio=e1',
          notificationType: 'government_news',
          newsUrl: data.newsUrl || '',
          newsSource: data.newsSource || '',
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
      const targetUrl = notifData.url || '/';
      for (const w of wins) {
        if (w.url.includes(self.location.origin) && 'focus' in w) {
          // Si es noticia del gobierno, navegar al espacio Gobierno GE
          if (notifData.notificationType === 'government_news') {
            w.postMessage({ type: 'OPEN_GOV_NEWS', newsUrl: notifData.newsUrl, newsSource: notifData.newsSource });
          } else {
            w.postMessage({ type: 'NOTIFICATION_CLICK', chatId: notifData.chatId });
          }
          return w.focus();
        }
      }
      return clients.openWindow(targetUrl);
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
