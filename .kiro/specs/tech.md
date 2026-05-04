# Stack Técnico - Migración a React Native

## Stack
- React Native + Expo SDK 51+
- TypeScript
- Expo Router (navegación basada en archivos)
- NativeWind v4 (Tailwind CSS para React Native)
- Zustand (estado global)
- Supabase JS SDK v2 (mismo que la web)

## Reglas
- No modificar ningún archivo del proyecto web original
- No usar HTML ni CSS — solo componentes React Native
- Estilos con NativeWind o StyleSheet.create()
- Toda la lógica de negocio reutilizada de la web adaptada a RN

## Estructura de carpetas
```
egchat-mobile/
  app/                  # Expo Router — rutas como archivos
    (auth)/             # Pantallas de autenticación
    (tabs)/             # Navegación principal con tabs
      index.tsx         # Chat
      wallet.tsx        # Wallet
      contacts.tsx      # Contactos
      services.tsx      # Servicios
      profile.tsx       # Perfil
  components/           # Componentes reutilizables
  services/             # Llamadas a Supabase y API
  store/                # Zustand stores
  hooks/                # Custom hooks
  types/                # Tipos TypeScript
  constants/            # Colores, tamaños, config
  assets/               # Imágenes, fuentes, iconos
```

## Variables de entorno
```
EXPO_PUBLIC_API_URL=https://chat2-0x2c.onrender.com
EXPO_PUBLIC_SUPABASE_URL=https://dptpdifjqgzccjauhodq.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
