# Diseño de API - Supabase

## Backend exclusivo
- Uso exclusivo de Supabase para todo el backend
- No acceso directo a base de datos desde la UI
- Toda lógica de datos pasa por `src/services/`

## Autenticación
- Auth con Supabase Auth (email/phone)
- Token almacenado de forma segura con expo-secure-store
- Refresh automático de sesión

## Chat en tiempo real
- Mensajes con Supabase Realtime subscriptions
- Canal por conversación: `supabase.channel('chat:${chatId}')`
- Eventos: INSERT en tabla messages
- Presencia de usuarios con Supabase Presence

## Estructura de services
```
src/services/
  supabase.ts       # Cliente Supabase inicializado
  auth.service.ts   # Login, registro, logout
  chat.service.ts   # Mensajes, conversaciones
  wallet.service.ts # Saldo, transacciones
  contacts.service.ts # Contactos
  user.service.ts   # Perfil de usuario
```

## Variables de entorno
```
EXPO_PUBLIC_SUPABASE_URL=https://dptpdifjqgzccjauhodq.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

## Reglas
- No exponer service_role key en el cliente móvil
- Usar solo la anon key en la app
- Row Level Security (RLS) activado en todas las tablas
