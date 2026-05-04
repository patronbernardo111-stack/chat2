# EGCHAT Auth Logic — Tech Design Spec

> Análisis completo del sistema de autenticación web y su equivalente en React Native.
> Base URL: `https://chat2-0x2c.onrender.com`

---

## 1. Arquitectura general

```
┌─────────────────┐     JWT Token      ┌──────────────────┐
│   App (RN/Web)  │ ◄────────────────► │   Render API     │
│                 │   Bearer Auth       │  (Express + JWT) │
│  AsyncStorage   │                    │                  │
│  (token)        │                    │  Supabase DB     │
└─────────────────┘                    └──────────────────┘
```

- Auth basada en **JWT** (no Supabase Auth)
- Token expira en **30 días** (`expiresIn: '30d'`)
- Token se guarda en `localStorage` (web) / `AsyncStorage` (React Native)
- No hay refresh token — si expira, el usuario debe hacer login de nuevo

---

## 2. Registro

### Endpoint
```
POST /api/auth/register
```

### Request body
```json
{
  "phone": "+240222123456",
  "password": "minimo6chars",
  "full_name": "Nombre Apellido",
  "avatar_url": "https://..." // opcional
}
```

### Validaciones del backend
- `phone`, `password`, `full_name` son requeridos
- Si el teléfono ya existe → `409 Conflict`
- Password se hashea con `bcrypt` (10 rounds)

### Response exitosa `201`
```json
{
  "token": "eyJhbGci...",
  "user": {
    "id": "uuid",
    "phone": "+240222123456",
    "full_name": "Nombre Apellido",
    "avatar_url": null,
    "app_version": "2.5.0"
  }
}
```

### Efectos secundarios
- Se crea automáticamente un `wallet` con saldo inicial de **5000 XAF**
- El token se guarda inmediatamente en storage

### Flujo React Native
```typescript
// 1. Llamar al endpoint
const res = await authAPI.register({ full_name, phone, password });

// 2. El token se guarda automáticamente en AsyncStorage
// (dentro de authAPI.register → await setToken(res.token))

// 3. Navegar a la app principal
router.replace('/(tabs)');
```

### Errores posibles
| Código | Mensaje | Causa |
|--------|---------|-------|
| 400 | "phone, password y full_name son requeridos" | Campos vacíos |
| 409 | "El teléfono ya está registrado" | Duplicado |
| 500 | Error interno | Fallo de DB |

---

## 3. Login

### Endpoint
```
POST /api/auth/login
```

### Request body
```json
{
  "phone": "+240222123456",
  "password": "micontraseña"
}
```

### Proceso del backend
1. Busca usuario por `phone` en Supabase
2. Compara password con `bcrypt.compare()`
3. Actualiza `last_login` en la DB
4. Genera JWT con `{ id, phone }` y expira en 30 días

### Response exitosa `200`
```json
{
  "token": "eyJhbGci...",
  "user": {
    "id": "uuid",
    "phone": "+240222123456",
    "full_name": "Nombre Apellido",
    "avatar_url": "https://...",
    "app_version": "2.5.0"
  }
}
```

### Flujo React Native
```typescript
// 1. Llamar al endpoint
const res = await authAPI.login(fullPhone, password);
// fullPhone = countryCode + phone (ej: "+240" + "222123456")

// 2. Token guardado automáticamente en AsyncStorage
// 3. Navegar
router.replace('/(tabs)');
```

### Errores posibles
| Código | Mensaje | Causa |
|--------|---------|-------|
| 400 | "phone y password son requeridos" | Campos vacíos |
| 401 | "Credenciales incorrectas" | Usuario no existe o password incorrecto |
| 500 | Error interno | Fallo de DB |

---

## 4. Logout

### Endpoint
```
POST /api/auth/logout
```
Requiere: `Authorization: Bearer <token>`

### Proceso
- El backend solo responde `{ message: 'Sesión cerrada' }`
- No hay blacklist de tokens — el logout es solo del lado cliente
- El cliente elimina el token de storage

### Flujo React Native
```typescript
await authAPI.logout();
// Internamente: await clearToken() → AsyncStorage.removeItem('token')
router.replace('/(auth)/login');
```

---

## 5. Recuperación de contraseña

### Paso 1 — Enviar código SMS
```
POST /api/auth/send-verification
Body: { "phone": "+240222123456" }
```
- Verifica que el usuario existe
- Genera código de 6 dígitos aleatorio
- Lo guarda en memoria del servidor (Map) con TTL de **10 minutos**
- Si Twilio está configurado, envía SMS real
- Si no, el código aparece en los logs del servidor

### Paso 2 — Verificar código
```
POST /api/auth/verify-code
Body: { "phone": "+240222123456", "code": "123456" }
```
Response: `{ "verified": true }` o error 400

### Paso 3 — Nueva contraseña
```
POST /api/auth/reset-password
Body: { "phone": "+240222123456", "code": "123456", "newPassword": "nuevapass" }
```
- Verifica el código de nuevo
- Hashea la nueva contraseña con bcrypt
- Actualiza en Supabase
- Invalida el código usado

### Flujo React Native (3 pasos)
```typescript
// Paso 1
await authAPI.sendVerification(fullPhone, 'sms');
setStep(2);

// Paso 2
const { verified } = await authAPI.verifyCode(fullPhone, code);
if (verified) setStep(3);

// Paso 3
await authAPI.resetPassword(fullPhone, code, newPassword);
router.replace('/(auth)/login');
```

---

## 6. Verificación de sesión activa

### Endpoint
```
GET /api/auth/me
Authorization: Bearer <token>
```

### Response
```json
{
  "id": "uuid",
  "phone": "+240222123456",
  "full_name": "Nombre",
  "avatar_url": "...",
  "created_at": "2026-01-01T00:00:00Z",
  "app_version": "2.5.0"
}
```

### Uso en React Native (al arrancar la app)
```typescript
// _layout.tsx
const isAuth = await authAPI.isAuthenticated();
// isAuthenticated() = !!(await AsyncStorage.getItem('token'))

if (isAuth) {
  router.replace('/(tabs)');
} else {
  router.replace('/(auth)/login');
}
```

---

## 7. Middleware de autenticación (backend)

El backend tiene dos middlewares:

### `auth` — para rutas protegidas normales
```javascript
// Acepta token de:
// 1. Header: Authorization: Bearer <token>
// 2. Header: x-auth-token: <token>
// 3. Query param: ?_t=<token>
```

### `authFromQuery` — para SSE (chat en tiempo real)
```javascript
// Acepta token de:
// 1. Query param: ?token=<token>
// 2. Header Authorization
// 3. Header x-auth-token
// 4. Query param: ?_t=<token>
```

---

## 8. Almacenamiento del token

### Web
```typescript
// Doble almacenamiento para resiliencia
localStorage.setItem('token', token);
localStorage.setItem('egchat_token_backup', token);

// Recuperación con fallback automático
const getToken = () => {
  return localStorage.getItem('token')
    || localStorage.getItem('egchat_token_backup')
    || '';
};
```

### React Native
```typescript
// AsyncStorage (equivalente a localStorage en RN)
await AsyncStorage.setItem('token', token);
await AsyncStorage.getItem('token');
await AsyncStorage.removeItem('token');
```

### Seguridad recomendada para producción
```typescript
// Usar expo-secure-store en lugar de AsyncStorage para el token
import * as SecureStore from 'expo-secure-store';
await SecureStore.setItemAsync('token', token);
const token = await SecureStore.getItemAsync('token');
```

---

## 9. Manejo de errores 401

### Web
```typescript
// En el cliente HTTP (api.ts)
if (res.status === 401) {
  if (!getToken()) window.dispatchEvent(new CustomEvent('auth:expired'));
  throw new Error(message);
}
```

### React Native
```typescript
// En el cliente HTTP (src/api.ts)
if (res.status === 401) {
  await clearToken();
  throw new Error('Sesión expirada');
}
// El _layout.tsx detecta que no hay token y redirige al login
```

---

## 10. Estructura del JWT

El token JWT contiene:
```json
{
  "id": "uuid-del-usuario",
  "phone": "+240222123456",
  "iat": 1234567890,
  "exp": 1234567890
}
```

- Firmado con `JWT_SECRET` (variable de entorno en Render)
- Expira en 30 días
- El backend verifica con múltiples secrets para compatibilidad:
  ```javascript
  const secrets = [JWT_SECRET, JWT_SECRET_FALLBACK];
  for (const secret of secrets) {
    try { return jwt.verify(token, secret); } catch {}
  }
  ```

---

## 11. Implementación en React Native — authAPI completo

```typescript
// egchat-mobile/src/api.ts — versión mejorada con SecureStore

import * as SecureStore from 'expo-secure-store';

const BASE = process.env.EXPO_PUBLIC_API_URL || 'https://chat2-0x2c.onrender.com';

const getToken = () => SecureStore.getItemAsync('token');
const setToken = (t: string) => SecureStore.setItemAsync('token', t);
const clearToken = () => SecureStore.deleteItemAsync('token');

export const authAPI = {
  login: async (phone: string, password: string) => {
    const res = await post<{ token: string; user: any }>('/api/auth/login', { phone, password });
    if (res.token) await setToken(res.token);
    return res;
  },
  register: async (data: { full_name: string; phone: string; password: string; avatar_url?: string }) => {
    const res = await post<{ token: string; user: any }>('/api/auth/register', data);
    if (res.token) await setToken(res.token);
    return res;
  },
  logout: async () => {
    try { await post('/api/auth/logout', {}); } catch {}
    await clearToken();
  },
  me: () => get<any>('/api/auth/me'),
  sendVerification: (phone: string) =>
    post<{ sent: boolean }>('/api/auth/send-verification', { phone }),
  verifyCode: (phone: string, code: string) =>
    post<{ verified: boolean }>('/api/auth/verify-code', { phone, code }),
  resetPassword: (phone: string, code: string, newPassword: string) =>
    post<{ success: boolean }>('/api/auth/reset-password', { phone, code, newPassword }),
  isAuthenticated: async () => !!(await getToken()),
};
```

---

## 12. Flujo completo de sesión en React Native

```
App arranca
    │
    ▼
_layout.tsx → authAPI.isAuthenticated()
    │
    ├── token existe → router.replace('/(tabs)')
    │
    └── no token → router.replace('/(auth)/login')
                        │
                        ├── Login exitoso → setToken() → /(tabs)
                        │
                        ├── Registro → setToken() → /(tabs)
                        │
                        └── 401 en cualquier request → clearToken() → /(auth)/login
```
