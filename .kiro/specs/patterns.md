# Patrones de Desarrollo - React Native

## Componentes reutilizables obligatorios
- Button — botón primario con variantes
- Input — campo de texto con validación
- Avatar — imagen de perfil con fallback
- Card — contenedor con sombra
- LoadingSpinner — indicador de carga
- EmptyState — estado vacío con mensaje

## Separación por features
```
src/
  features/
    auth/         # Login, registro, recuperación
    chat/         # Conversaciones, mensajes
    wallet/       # Saldo, transacciones, recargas
    contacts/     # Lista y gestión de contactos
    profile/      # Perfil de usuario
    services/     # Servicios diarios (taxi, pagos, etc.)
```

## Estado separado por módulos
- authStore     → usuario autenticado, token
- chatStore     → conversaciones, mensajes activos
- walletStore   → saldo, historial de transacciones
- contactsStore → lista de contactos

## API calls centralizadas en services
- Toda llamada a Supabase va en `src/services/`
- Los componentes nunca llaman directamente a Supabase
- Usar hooks personalizados para encapsular la lógica
- Manejo de errores centralizado en cada service
