# Diseño de API - Supabase para Nativa

## Backend
- Supabase exclusivo para toda la lógica de backend
- URL: https://dptpdifjqgzccjauhodq.supabase.co
- No acceso directo a DB desde la UI
- Row Level Security (RLS) activado en todas las tablas

## SDKs oficiales
- Android: supabase-kt (Kotlin Multiplatform)
- iOS: supabase-swift

## Autenticación
- Login con teléfono + contraseña (custom auth via REST)
- Token JWT almacenado de forma segura:
  - Android: EncryptedSharedPreferences
  - iOS: Keychain
- Refresh automático de sesión

## Chat en tiempo real
- Supabase Realtime subscriptions por canal de chat
- Canal: `realtime:public:messages:chat_id=eq.{chatId}`
- Evento: INSERT → nuevo mensaje
- Presencia de usuarios con Supabase Presence

## Configuración Android (build.gradle)
```kotlin
implementation("io.github.jan-tennert.supabase:postgrest-kt:2.x")
implementation("io.github.jan-tennert.supabase:realtime-kt:2.x")
implementation("io.github.jan-tennert.supabase:storage-kt:2.x")
implementation("io.ktor:ktor-client-android:2.x")
```

## Configuración iOS (Package.swift)
```swift
.package(url: "https://github.com/supabase/supabase-swift", from: "2.0.0")
```

## Variables de entorno
### Android (local.properties o BuildConfig)
```
SUPABASE_URL=https://dptpdifjqgzccjauhodq.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### iOS (Config.xcconfig)
```
SUPABASE_URL = https://dptpdifjqgzccjauhodq.supabase.co
SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Reglas de seguridad
- Nunca incluir service_role key en la app nativa
- Solo usar anon key en el cliente
- Toda operación privilegiada va por el backend (Render API)
- Validar tokens en el servidor antes de operaciones sensibles

## Endpoints del backend (Render)
- Base URL: https://chat2-0x2c.onrender.com
- Auth: POST /api/auth/login, /api/auth/register
- Chat: GET/POST /api/chats, /api/chats/:id/messages
- Wallet: GET/POST /api/wallet, /api/transactions
- Contacts: GET/POST /api/contacts
