# Auth Migration — Web → React Native

> Diseño de la migración del sistema de autenticación web a React Native.
> No modifica el backend — solo cambia cómo el cliente maneja tokens y sesión.

---

## Diferencias clave Web vs React Native

| Aspecto | Web | React Native |
|---------|-----|-------------|
| Storage del token | `localStorage` | `expo-secure-store` |
| Backup del token | `egchat_token_backup` en localStorage | No necesario (SecureStore es persistente) |
| Verificación de sesión | Síncrona (`!!localStorage.getItem`) | Asíncrona (`await SecureStore.getItemAsync`) |
| Expiración del token | Verificación manual del JWT payload | Igual + manejo de 401 automático |
| Sincronización entre tabs | `window.addEventListener('storage')` | No aplica en móvil |
| Redirección al login | `window.location` / React Router | `router.replace('/(auth)/login')` |
| Interceptor 401 | `window.dispatchEvent('auth:expired')` | `clearToken()` + redirect directo |

---

## Estado actual en React Native (`egchat-mobile/src/api.ts`)

### Problema 1 — AsyncStorage no es seguro para tokens
```typescript
// ❌ Actual — token en AsyncStorage (no cifrado)
const getToken = async () => AsyncStorage.getItem('token');
```

### Problema 2 — BASE URL hardcodeada al servidor antiguo
```typescript
// ❌ Actual
const DEFAULT_BASE = 'https://egchat-api.onrender.com';

// ✅ Debe ser
const BASE = process.env.EXPO_PUBLIC_API_URL || 'https://chat2-0x2c.onrender.com';
```

### Problema 3 — Sin timeout ni reintentos
```typescript
// ❌ Actual — fetch sin timeout
const res = await fetch(`${BASE}${path}`, { ... });

// ✅ Debe tener timeout de 15-20s igual que la web
```

### Problema 4 — `isAuthenticated` es async pero el layout lo usa como sync
```typescript
// ❌ Actual en _layout.tsx
authAPI.isAuthenticated().then(auth => { ... })
// Esto funciona pero puede causar flash de pantalla
```

---

## Diseño propuesto

### Estructura de archivos
```
egchat-mobile/src/
  auth/
    storage.ts       → SecureStore wrapper (get/set/clear token)
    authAPI.ts       → Llamadas HTTP de auth
    authStore.ts     → Zustand store (estado global de sesión)
    useAuth.ts       → Hook para componentes
  api.ts             → Cliente HTTP base (con timeout y reintentos)
```

### 1. storage.ts — Token seguro
```
Responsabilidad: guardar/leer/borrar el JWT de forma segura
Librería: expo-secure-store
Operaciones:
  - getToken(): Promise<string | null>
  - setToken(token: string): Promise<void>
  - clearToken(): Promise<void>
```

### 2. authAPI.ts — Endpoints
```
Responsabilidad: llamadas HTTP al backend
Endpoints:
  - login(phone, password) → { token, user }
  - register(data) → { token, user }
  - logout() → void
  - me() → User
  - sendVerification(phone) → { sent }
  - verifyCode(phone, code) → { verified }
  - resetPassword(phone, code, newPassword) → { success }
```

### 3. authStore.ts — Estado global con Zustand
```
Estado:
  - user: User | null
  - isAuthenticated: boolean
  - isLoading: boolean

Acciones:
  - initialize() → leer token de SecureStore, llamar /me si existe
  - login(phone, password) → llamar API, guardar token, setUser
  - register(data) → llamar API, guardar token, setUser
  - logout() → llamar API, borrar token, clearUser
```

### 4. useAuth.ts — Hook
```
Expone:
  - user, isAuthenticated, isLoading
  - login(), register(), logout()
  - Manejo de errores tipado
```

---

## Flujo de inicialización

```
App arranca (_layout.tsx)
    │
    ▼
authStore.initialize()
    │
    ├── SecureStore.getItem('token') → null
    │       └── router.replace('/(auth)/login')
    │
    └── SecureStore.getItem('token') → "eyJ..."
            │
            ▼
        GET /api/auth/me (con token)
            │
            ├── 200 OK → setUser(data) → router.replace('/(tabs)')
            │
            └── 401 → clearToken() → router.replace('/(auth)/login')
```

---

## Flujo de login

```
LoginScreen
    │
    ▼
authStore.login(phone, password)
    │
    ▼
POST /api/auth/login
    │
    ├── 200 → setToken(token) + setUser(user) → /(tabs)
    │
    ├── 401 → error "Credenciales incorrectas"
    │
    └── network error → error "Sin conexión"
```

---

## Flujo de logout

```
Cualquier pantalla
    │
    ▼
authStore.logout()
    │
    ├── POST /api/auth/logout (best-effort, ignorar error)
    │
    ├── SecureStore.deleteItem('token')
    │
    ├── clearUser() en el store
    │
    └── router.replace('/(auth)/login')
```

---

## Manejo de 401 en cualquier request

```
Cualquier request HTTP
    │
    ▼
res.status === 401
    │
    ├── clearToken()
    │
    ├── authStore.clearUser()
    │
    └── router.replace('/(auth)/login')
        (usando un ref global al router de Expo)
```

---

## Migración del `api.ts` actual

### Cambios necesarios
1. Reemplazar `AsyncStorage` por `expo-secure-store`
2. Actualizar `BASE` a `EXPO_PUBLIC_API_URL`
3. Añadir timeout de 15s (GET) / 20s (POST)
4. Añadir reintentos (2 intentos con backoff)
5. Añadir interceptor 401 que limpia sesión y redirige

### Sin cambios
- Estructura de endpoints (mismos paths que la web)
- Formato de request/response (idéntico al web)
- Lógica de negocio (login, register, etc.)

---

## Dependencias necesarias

```json
// Ya instaladas en egchat-mobile/package.json ✓
"expo-secure-store": "~14.0.0"
"@react-native-async-storage/async-storage": "^2.1.0"

// Por instalar
"zustand": "^4.x"  // para authStore
```

---

## Pantallas de auth a implementar

| Pantalla | Ruta | Estado |
|----------|------|--------|
| Login | `/(auth)/login` | ✅ Implementada |
| Registro | `/(auth)/register` | ⏳ Pendiente |
| Recuperar contraseña | `/(auth)/forgot-password` | ⏳ Pendiente |
| Verificar código | `/(auth)/verify-code` | ⏳ Pendiente |
| Nueva contraseña | `/(auth)/new-password` | ⏳ Pendiente |

---

## Próximos pasos (en orden)

1. Actualizar `src/api.ts` — SecureStore + timeout + reintentos + interceptor 401
2. Crear `src/auth/authStore.ts` — Zustand store
3. Crear `src/auth/useAuth.ts` — hook
4. Actualizar `app/_layout.tsx` — usar authStore.initialize()
5. Implementar pantalla de Registro
6. Implementar pantalla de Recuperar contraseña
