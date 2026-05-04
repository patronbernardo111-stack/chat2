# Patrones de Desarrollo - React Native

## Componentes reutilizables obligatorios
- Button — TouchableOpacity con variantes (primary, secondary, outline)
- Input — TextInput con label, error y validación
- Avatar — Image con fallback a iniciales
- Card — View con sombra y bordes redondeados
- LoadingSpinner — ActivityIndicator estilizado
- EmptyState — View con icono y mensaje

## Separación por features
```
egchat-mobile/
  app/
    (auth)/
      login.tsx
      register.tsx
      forgot-password.tsx
    (tabs)/
      index.tsx          # Chat list
      wallet.tsx         # Wallet
      contacts.tsx       # Contactos
      services.tsx       # Servicios diarios
      profile.tsx        # Perfil
  components/
    chat/                # ChatBubble, MessageInput, ChatHeader
    wallet/              # BalanceCard, TransactionItem
    contacts/            # ContactItem, ContactSearch
    ui/                  # Button, Input, Avatar, Card (compartidos)
```

## Estado con Zustand
```typescript
// store/authStore.ts
// store/chatStore.ts
// store/walletStore.ts
// store/contactsStore.ts
```

## API calls centralizadas
```
services/
  api.ts           # Cliente axios/fetch con interceptors
  auth.service.ts  # Login, registro, logout
  chat.service.ts  # Mensajes, conversaciones
  wallet.service.ts
  contacts.service.ts
  supabase.ts      # Cliente Supabase inicializado
```
