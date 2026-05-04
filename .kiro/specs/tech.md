# Stack Técnico - Migración a React Native

## Stack actual (implementado)
- React Native 0.76.5 + Expo SDK 52
- TypeScript
- Expo Router v4 (navegación basada en archivos)
- StyleSheet.create() para estilos (no NativeWind — no instalado)
- expo-secure-store para tokens JWT
- Sin Zustand por ahora — estado local con useState por pantalla

## Backend
- Render API: https://chat2-0x2c.onrender.com (mismo que la web)
- Auth: JWT custom (NO Supabase Auth)
- Supabase: solo para base de datos (acceso via Render API, no directo desde la app)

## Reglas
- No modificar ningún archivo del proyecto web original
- No usar HTML ni CSS — solo componentes React Native
- Estilos con StyleSheet.create() usando el design system en src/theme/
- Toda la lógica de negocio reutilizada de la web adaptada a RN

## Estructura de carpetas real
```
egchat-mobile/
  app/
    _layout.tsx           # Root layout — verifica sesión al arrancar
    (auth)/
      _layout.tsx
      login.tsx           # ✅ Implementado
      register.tsx        # ✅ Implementado
      forgot-password.tsx # ✅ Implementado
    (tabs)/
      _layout.tsx
      index.tsx           # ✅ Lista de chats
      monedero.tsx        # ⏳ Pendiente
      servicios.tsx       # ⏳ Pendiente
      lia.tsx             # ⏳ Pendiente
      ajustes.tsx         # ⏳ Pendiente
  src/
    api.ts                # ✅ Cliente HTTP completo (SecureStore + timeout + reintentos)
    theme/
      colors.ts           # ✅ Paleta completa
      typography.ts       # ✅ Escala tipográfica
      spacing.ts          # ✅ Espaciados, radios, sombras
      index.ts            # ✅ Barrel export
    components/
      ui/
        EGButton.tsx      # ✅ 5 variantes + animación spring
        EGAvatar.tsx      # ✅ Imagen o iniciales
        EGInput.tsx       # ✅ Label flotante + toggle password
        EGCard.tsx        # ✅ Sombras configurables
        EGErrorMessage.tsx # ✅
        index.ts          # ✅ Barrel export
```

## Variables de entorno (.env)
```
EXPO_PUBLIC_API_URL=https://chat2-0x2c.onrender.com
EXPO_PUBLIC_SUPABASE_URL=https://dptpdifjqgzccjauhodq.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...anon_key
```

## Dependencias clave instaladas
```json
"expo": "~52.0.0"
"expo-router": "~4.0.0"
"expo-secure-store": "~14.0.0"
"expo-image-picker": "~16.0.0"
"expo-camera": "~16.0.0"
"expo-notifications": "~0.29.0"
"expo-location": "~18.0.0"
"@supabase/supabase-js": "^2.39.0"
"react-native-safe-area-context": "4.12.0"
"react-native-gesture-handler": "~2.20.0"
```
