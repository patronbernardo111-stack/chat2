# Patrones de Desarrollo - Nativa

## Componentes reutilizables obligatorios

### Android (Compose)
- EGButton — botón primario con variantes (filled, outlined, text)
- EGTextField — campo de texto con validación y error state
- EGAvatar — imagen de perfil con fallback a iniciales
- EGCard — contenedor con elevación y bordes redondeados
- EGLoadingIndicator — CircularProgressIndicator estilizado
- EGEmptyState — estado vacío con icono y mensaje

### iOS (SwiftUI)
- EGButton — ButtonStyle personalizado con variantes
- EGTextField — TextField con validación y error label
- EGAvatar — AsyncImage con fallback a iniciales
- EGCard — ViewModifier con sombra y bordes
- EGLoadingView — ProgressView estilizado
- EGEmptyState — VStack con icono SF Symbol y mensaje

## Separación por features (igual en Android e iOS)
```
features/
  auth/       # Login, registro, recuperación de contraseña
  chat/       # Conversaciones, mensajes, grupos
  wallet/     # Saldo, transacciones, recargas, transferencias
  contacts/   # Lista, añadir, bloquear contactos
  profile/    # Ver y editar perfil, avatar
  services/   # Taxi, pagos de servicios, bancos
  states/     # Estados/stories
  map/        # MapView nativo
```

## Estado por módulo
### Android
- AuthViewModel → usuario, token, estado de sesión
- ChatViewModel → conversaciones, mensajes, SSE/Realtime
- WalletViewModel → saldo, transacciones
- ContactsViewModel → lista de contactos

### iOS
- AuthViewModel: ObservableObject → @Published user, isLoggedIn
- ChatViewModel: ObservableObject → @Published conversations, messages
- WalletViewModel: ObservableObject → @Published balance, transactions

## Llamadas a API centralizadas
- Android: Repository pattern — ViewModel → Repository → SupabaseService
- iOS: Service pattern — ViewModel → Service → Supabase SDK
- Nunca llamar a Supabase directamente desde una View/Composable
