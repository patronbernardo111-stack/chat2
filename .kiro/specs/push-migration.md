# Push Notifications Migration — Web → React Native

## Sistema actual en la web

### Service Worker (sw.js)
- Recibe push events via Web Push API
- Muestra notificaciones con `self.registration.showNotification()`
- Payload: `{ title, body, icon, tag, url, chatId }`

### Backend (Render API)
- Tabla `push_subscriptions` — suscripciones Web Push (VAPID)
- Tabla `expo_push_tokens` — tokens Expo para móvil
- Al enviar mensaje: `sendPushToUser(uid, payload)` → envía a ambas tablas
- Librería: `web-push` para Web Push, Expo Push API para móvil

### Flujo web
```
Usuario abre app → SW registra suscripción → POST /api/push/subscribe
Mensaje nuevo → backend → web-push → SW → notificación del navegador
```

---

## Sistema nativo con Expo (FCM + APNs)

### Por qué Expo Notifications en lugar de FCM/APNs directo
- Expo abstrae FCM (Android) y APNs (iOS) en una sola API
- El token Expo funciona en ambas plataformas
- Ya instalado: `expo-notifications ~0.29.0`
- Ya configurado en `app.json`: canal, icono, sonido

### Flujo nativo
```
App arranca → requestPermissions() → getExpoPushToken()
    │
    ▼
POST /api/push/register-expo { token, platform }
    │
    ▼
Backend guarda en expo_push_tokens (user_id, token)
    │
    ▼
Mensaje nuevo → backend → Expo Push API → FCM/APNs → dispositivo
```

---

## Implementación

### 1. Registro de token (src/notifications.ts — ya existe)

```typescript
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

export async function registerForPushNotifications(): Promise<string | null> {
  // Solo en dispositivo físico
  if (!Device.isDevice) return null;

  // Pedir permisos
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;

  // Canal Android
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('egchat-messages', {
      name: 'Mensajes EGCHAT',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'notification.wav',
    });
  }

  // Obtener token Expo
  const token = await Notifications.getExpoPushTokenAsync({
    projectId: '6200ec00-54d7-4ef4-a348-56e80a1452f6', // EAS project ID
  });

  return token.data;
}
```

### 2. Asociar token al usuario

```typescript
// Llamar después del login exitoso
export async function savePushToken(token: string): Promise<void> {
  const platform = Platform.OS; // 'android' | 'ios'
  await post('/api/push/register-expo', { token, platform });
}
```

### 3. Endpoint backend necesario

```javascript
// POST /api/push/register-expo
app.post('/api/push/register-expo', auth, async (req, res) => {
  const { token, platform } = req.body;
  await supabase.from('expo_push_tokens').upsert({
    user_id: req.user.id,
    token,
    platform,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'token' });
  res.json({ ok: true });
});
```

### 4. Envío desde backend (ya implementado parcialmente)

```javascript
// Usar Expo Push API
const { Expo } = require('expo-server-sdk');
const expo = new Expo();

async function sendExpoPush(tokens, payload) {
  const messages = tokens
    .filter(t => Expo.isExpoPushToken(t))
    .map(token => ({
      to: token,
      sound: 'default',
      title: payload.title,
      body: payload.body,
      data: { chatId: payload.chatId },
      channelId: 'egchat-messages',
    }));
  await expo.sendPushNotificationsAsync(messages);
}
```

---

## Manejo de notificaciones

### Foreground (app abierta)
```typescript
// Mostrar banner dentro de la app
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});
```

### Background / Killed (app cerrada)
- FCM/APNs entrega la notificación directamente al SO
- Al tocar la notificación → app abre → `getLastNotificationResponseAsync()`
- Navegar al chat correspondiente con `chatId` del payload

### Listeners (en _layout.tsx)
```typescript
// Notificación recibida en foreground
const sub1 = Notifications.addNotificationReceivedListener(notification => {
  const chatId = notification.request.content.data?.chatId;
  // Actualizar badge o lista de chats
});

// Usuario toca la notificación
const sub2 = Notifications.addNotificationResponseReceivedListener(response => {
  const chatId = response.notification.request.content.data?.chatId;
  if (chatId) router.push(`/chat/${chatId}`);
});

return () => { sub1.remove(); sub2.remove(); };
```

---

## Estado actual en egchat-mobile

| Componente | Estado |
|-----------|--------|
| `expo-notifications` instalado | ✅ |
| `app.json` configurado (canal, icono, sonido) | ✅ |
| `google-services.json` presente | ✅ |
| `src/notifications.ts` con `registerForPushNotifications` | ✅ |
| `_layout.tsx` llama a `registerForPushNotifications` | ✅ |
| Endpoint `/api/push/register-expo` en backend | ⏳ Pendiente |
| `expo-server-sdk` en backend | ⏳ Pendiente |
| Listeners de navegación en `_layout.tsx` | ⏳ Pendiente |

---

## Próximos pasos

1. Añadir `expo-server-sdk` al backend (`egchat-api/package.json`)
2. Crear endpoint `POST /api/push/register-expo` en `egchat-api/index.js`
3. Actualizar `sendPushToUser` para usar Expo Push API
4. Añadir listeners de navegación en `_layout.tsx`
5. Probar con build de desarrollo (`expo run:android`)
