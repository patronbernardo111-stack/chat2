# Stack Técnico - Migración a React Native

## Stack
- React Native (con Expo)
- Supabase (backend y base de datos)
- TypeScript

## Reglas
- No usar HTML ni CSS
- Solo componentes nativos de React Native (View, Text, TouchableOpacity, etc.)
- Estilos con StyleSheet.create() o NativeWind

## Arquitectura
- Modular por pantallas y componentes
- Mantener la lógica de negocio de la web adaptada a móvil
- Navegación con React Navigation
- Estado global con Zustand o Context API

## Estructura de carpetas
```
src/
  screens/       # Pantallas principales
  components/    # Componentes reutilizables
  services/      # Llamadas a API y Supabase
  store/         # Estado global
  navigation/    # Configuración de navegación
  utils/         # Utilidades compartidas
  types/         # Tipos TypeScript
```
