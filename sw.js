// sw.js — Network-first strategy para assets JS/CSS
// Esto garantiza que los usuarios siempre reciban el bundle más reciente
// y no queden atrapados con versiones viejas en caché.

const CACHE = 'egchat-v20260101-000000'; // actualizado por vite en cada build

// Install: activar inmediatamente sin esperar a que se cierre la pestaña vieja
self.addEventListener('install', event => {
  self.skipWaiting();
});

// Activate: limpiar todos los caches viejos y tomar control inmediatamente
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Fetch: network-first para JS/CSS/HTML, cache-first para imágenes/fuentes
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo manejar requests del mismo origen
  if (url.origin !== location.origin) return;

  const isAsset = /\.(js|css|html)(\?.*)?$/.test(url.pathname);

  if (isAsset) {
    // Network-first: siempre intenta la red primero
    event.respondWith(
      fetch(request)
        .then(response => {
          // Guardar en caché solo si la respuesta es válida
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE).then(cache => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          // Fallback a caché si no hay red
          return caches.match(request).then(cached => {
            if (cached) return cached;
            // Si es HTML y no hay caché, devolver index.html
            if (request.destination === 'document') {
              return caches.match('/index.html');
            }
          });
        })
    );
  } else {
    // Cache-first para imágenes, fuentes, SVGs
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE).then(cache => cache.put(request, clone));
          }
          return response;
        });
      })
    );
  }
});

// Push notifications
self.addEventListener('push', event => {
  const data = event.data ? event.data.json().catch(() => ({})) : {};
  const title = data.title || 'EGCHAT';
  const options = {
    body: data.body || 'Tienes una nueva notificación',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    vibrate: [100, 50, 100],
    data: { url: data.url || '/' },
    actions: [
      { action: 'open',  title: 'Ver'    },
      { action: 'close', title: 'Cerrar' },
    ],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'close') return;
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const existing = list.find(c => c.url === url && 'focus' in c);
      if (existing) return existing.focus();
      return clients.openWindow(url);
    })
  );
});
