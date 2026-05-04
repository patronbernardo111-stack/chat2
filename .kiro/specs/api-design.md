# Diseño de API - React Native

## Backend
- Render API: https://chat2-0x2c.onrender.com (mismo que la web)
- Supabase: https://dptpdifjqgzccjauhodq.supabase.co
- No acceso directo a DB desde componentes

## Autenticación
- Login/registro via Render API (/api/auth/login, /api/auth/register)
- Token JWT almacenado con expo-secure-store
- Refresh automático al iniciar la app

## Chat en tiempo real
- Supabase Realtime subscriptions (mismo canal que la web)
- Canal: messages INSERT por chat_id
- Fallback: polling cada 3s si Realtime falla

## Servicios reutilizables de la web
Los siguientes archivos de la web pueden adaptarse directamente:
- api.ts → services/api.ts (cambiar fetch por axios)
- translations.ts → constants/translations.ts (igual)
- Tipos de datos → types/ (igual, son TypeScript puro)

## Configuración Supabase en RN
```typescript
// services/supabase.ts
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
    }
  }
)
```

## Reglas de seguridad
- Solo anon key en la app móvil
- service_role key nunca en el cliente
- Tokens en expo-secure-store, nunca en AsyncStorage sin cifrar
