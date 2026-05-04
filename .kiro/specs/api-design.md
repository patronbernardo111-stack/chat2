# Diseño de API - React Native

## Backend
- Render API: https://chat2-0x2c.onrender.com
- Auth: JWT custom (NO Supabase Auth — el backend usa bcrypt + JWT propio)
- Supabase: base de datos accedida SOLO via Render API, nunca directo desde la app

## Cliente HTTP (src/api.ts) — implementado
- Token en `expo-secure-store` (cifrado en el dispositivo)
- Timeout: 15s GET / 20s POST (igual que la web)
- Reintentos: 2 intentos con backoff exponencial en errores de red
- Interceptor 401: limpia token + redirige al login automáticamente
- Keep-alive: ping a /health cada 4 minutos (evita que Render duerma)

## Endpoints de Auth implementados
```
POST /api/auth/login          → { token, user }
POST /api/auth/register       → { token, user }
POST /api/auth/logout         → { message }
GET  /api/auth/me             → User
PUT  /api/auth/profile        → User
POST /api/auth/check-phone    → { exists }
POST /api/auth/send-verification → { sent }
POST /api/auth/verify-code    → { verified }
POST /api/auth/reset-password → { success }
```

## Endpoints de Chat implementados
```
GET  /api/chats                          → Chat[]
GET  /api/chats/:id/messages             → Message[]
POST /api/chats/:id/messages             → Message
POST /api/chats/private                  → Chat
POST /api/chats/group                    → Chat
POST /api/chats/:id/read                 → void
GET  /api/contacts/search?q=             → User[]
DELETE /api/messages/:id                 → void
DELETE /api/messages/:id/for-me          → void
```

## Endpoints de Wallet implementados
```
GET  /api/wallet/balance                 → { balance, currency }
GET  /api/wallet/transactions            → { transactions[], total }
POST /api/wallet/deposit                 → { balance, transaction }
POST /api/wallet/withdraw                → { balance, transaction }
POST /api/wallet/transfer                → { balance, transaction }
POST /api/wallet/recharge-code           → { balance, amount }
```

## Chat en tiempo real
- Actualmente: polling via `loadChats()` con RefreshControl (pull to refresh)
- Próximo paso: Supabase Realtime subscriptions para mensajes nuevos
- Canal: `supabase.channel('messages').on('INSERT', ...)` filtrado por chat_id

## Reglas de seguridad
- Solo `anon key` de Supabase en la app (para Realtime futuro)
- `service_role key` NUNCA en el cliente
- Token JWT en `expo-secure-store` (cifrado, no accesible fuera de la app)
- Interceptor 401 limpia token automáticamente si expira
