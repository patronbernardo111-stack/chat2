# Patrones de Desarrollo - React Native

## Componentes reutilizables (implementados en src/components/ui/)
- `EGButton` — TouchableOpacity con 5 variantes + animación spring al presionar
- `EGInput` — TextInput con label flotante animado, error state, toggle password
- `EGAvatar` — Image con fallback a iniciales coloreadas
- `EGCard` — View con sombra configurable, presionable opcional
- `EGErrorMessage` — Mensaje de error estilizado

## Importación
```typescript
import { EGButton, EGAvatar, EGInput, EGCard, EGErrorMessage } from '../../src/components/ui';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../../src/theme';
```

## Estructura de pantallas
```
app/
  (auth)/
    login.tsx           # ✅ Completo
    register.tsx        # ✅ Completo (3 pasos)
    forgot-password.tsx # ✅ Completo (3 pasos)
  (tabs)/
    index.tsx           # ✅ Lista de chats con FlatList + RefreshControl
    monedero.tsx        # ⏳ Pendiente
    servicios.tsx       # ⏳ Pendiente
    lia.tsx             # ⏳ Pendiente
    ajustes.tsx         # ⏳ Pendiente
```

## Pantallas pendientes (en orden de prioridad)
1. Chat abierto — `app/chat/[id].tsx`
2. Monedero — `app/(tabs)/monedero.tsx`
3. Ajustes/Perfil — `app/(tabs)/ajustes.tsx`
4. Servicios — `app/(tabs)/servicios.tsx`
5. Lia-25 — `app/(tabs)/lia.tsx`

## Patrón de pantalla estándar
```typescript
export default function MiPantalla() {
  // 1. Estado local con useState
  // 2. Llamadas a API con async/await + try/catch
  // 3. SafeAreaView como contenedor raíz
  // 4. KeyboardAvoidingView si hay inputs
  // 5. ScrollView o FlatList para contenido
  // 6. Estilos con StyleSheet.create() usando el design system
}
```

## Manejo de errores en pantallas
```typescript
try {
  const data = await someAPI.call();
} catch (e: any) {
  const msg = e.message || '';
  if (msg.includes('fetch') || msg.includes('network')) {
    setError('Error de conexión. Verifica tu internet.');
  } else if (msg.includes('401')) {
    // El interceptor global ya maneja esto
  } else {
    setError(msg || 'Error inesperado.');
  }
}
```

## Navegación con Expo Router
```typescript
import { router } from 'expo-router';

router.replace('/(tabs)');        // Reemplaza (no vuelve atrás)
router.push('/(auth)/login');     // Apila
router.back();                    // Vuelve atrás
router.push(`/chat/${id}`);       // Ruta dinámica
```
