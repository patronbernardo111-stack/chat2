# Chat Logic — Tech Design Spec

> Análisis del sistema de chat web y diseño de la implementación en React Native.

---

## Modelo de datos

### Message
```typescript
interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  text?: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'file' | 'location' | 'call';
  status: 'sent' | 'delivered' | 'read' | 'failed' | 'pending';
  reply_to?: string;          // ID del mensaje al que responde
  file_url?: string;
  file_type?: string;
  file_size?: number;
  thumbnail_url?: string;
  duration?: number;          // Para audio/video
  created_at: string;         // ISO timestamp
  updated_at?: string;
  edited?: boolean;
  sender?: {
    id: string;
    phone: string;
    full_name: string;
    avatar_url?: string;
  };
}
```

### Chat
```typescript
interface Chat {
  id: string;
  type: 'private' | 'group';
  name?: string;              // Solo grupos
  avatar_url?: string;
  created_by?: string;
  participants: Participant[];
  last_message?: Message;
  unread_count: number;
  updated_at: string;
}

interface Participant {
  user_id: string;
  full_name?: string;
  avatar_url?: string;
  phone?: string;
}
```

---

## Flujo de mensajes

### Enviar mensaje
```
Usuario escribe → presiona enviar
    │
    ▼
1. Añadir mensaje optimista al estado local (status: 'pending')
    │
    ▼
2. POST /api/chats/:chatId/messages { text, type }
    │
    ├── Éxito → actualizar mensaje con ID real (status: 'sent')
    │           actualizar last_message en la lista de chats
    │
    └── Error → marcar mensaje como 'failed', mostrar opción de reintentar
```

### Recibir mensajes en tiempo real
```
Supabase Realtime subscription activa
    │
    ▼
INSERT en tabla messages (chat_id = chatId actual)
    │
    ▼
onNewMessage(payload.new)
    │
    ├── Si el mensaje es del usuario actual → ignorar (ya está en estado local)
    │
    └── Si es de otro usuario → añadir al estado + scroll al fondo
                                + marcar como leído si el chat está abierto
```

### Cargar mensajes históricos
```
GET /api/chats/:chatId/messages?page=1&limit=50
    │
    ▼
Ordenar ASC por created_at (antiguo arriba, nuevo abajo)
    │
    ▼
Scroll automático al fondo al cargar
    │
    ▼
Paginación: cargar más al hacer scroll hacia arriba (page=2, page=3...)
```

---

## Tiempo real — Supabase Realtime

### Suscripción al chat abierto
```typescript
// Al abrir un chat
const unsubscribe = subscribeToChat(chatId, (newMessage) => {
  if (newMessage.sender_id !== currentUserId) {
    setMessages(prev => [...prev, newMessage]);
    markAsRead(chatId, newMessage.id);
  }
});

// Al cerrar el chat
return () => unsubscribe();
```

### Suscripción a la lista de chats
```typescript
// En la pantalla de lista de chats
const unsubscribe = subscribeToUserChats(userId, () => {
  loadChats(); // Recargar lista cuando hay cambios
});
```

---

## Indicadores de estado de mensaje

| Estado | Icono | Descripción |
|--------|-------|-------------|
| `pending` | ○ | Enviando... |
| `sent` | ✓ | Enviado al servidor |
| `delivered` | ✓✓ (gris) | Entregado al destinatario |
| `read` | ✓✓ (azul) | Leído por el destinatario |
| `failed` | ❌ | Error al enviar |

---

## Acciones sobre mensajes

### Menú contextual (long press)
- **Copiar** — copia el texto al portapapeles
- **Responder** — añade referencia al mensaje original
- **Editar** (solo propios) — modifica el texto
- **Eliminar para todos** (solo propios) — `DELETE /api/messages/:id`
- **Eliminar para mí** — `DELETE /api/messages/:id/for-me`

---

## Tipos de mensajes soportados

| Tipo | Descripción | Render |
|------|-------------|--------|
| `text` | Texto plano | Burbuja con texto |
| `image` | Imagen | Thumbnail + imagen completa al tap |
| `file` | Archivo | Icono + nombre + tamaño |
| `audio` | Audio | Player con duración |
| `call` | Registro de llamada | Icono + tipo + dirección |

---

## Burbujas de chat

### Mensaje propio
```
Alineación: derecha
Color: #95EC69 (verde claro)
Border radius: 18px 18px 4px 18px (esquina inferior derecha recortada)
```

### Mensaje ajeno
```
Alineación: izquierda
Color: #FFFFFF (blanco)
Border radius: 18px 18px 18px 4px (esquina inferior izquierda recortada)
Sombra: 0 1px 2px rgba(0,0,0,0.08)
```

### Separadores de fecha
```
Formato: "Hoy", "Ayer", "Lunes", "12 enero"
Estilo: pill centrado con fondo semitransparente oscuro
```

---

## Estructura de pantallas en React Native

### Lista de chats — `app/(tabs)/index.tsx` ✅
- FlatList con ChatItem
- RefreshControl (pull to refresh)
- SearchBar inline
- Supabase Realtime para actualizaciones

### Chat abierto — `app/chat/[id].tsx` ⏳ Pendiente
```
SafeAreaView
  ├── ChatHeader (back + avatar + nombre + estado + acciones)
  ├── FlatList invertida (mensajes)
  │   └── MessageBubble (propio/ajeno)
  └── KeyboardAvoidingView
      └── MessageInput (attach + camera + text + send)
```

---

## Implementación React Native — puntos clave

### FlatList invertida para mensajes
```typescript
// Más eficiente que ScrollView para listas largas
<FlatList
  data={[...messages].reverse()} // Invertir para mostrar nuevo abajo
  inverted                        // FlatList invertida
  keyExtractor={item => item.id}
  renderItem={({ item }) => <MessageBubble message={item} />}
/>
```

### KeyboardAvoidingView para el input
```typescript
<KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  keyboardVerticalOffset={headerHeight}
>
  <MessageInput />
</KeyboardAvoidingView>
```

### Mensaje optimista (UX instantánea)
```typescript
const sendMessage = async (text: string) => {
  // 1. Añadir inmediatamente con ID temporal
  const tempMsg = { id: `temp-${Date.now()}`, text, status: 'pending', ... };
  setMessages(prev => [...prev, tempMsg]);

  try {
    // 2. Enviar al servidor
    const real = await chatAPI.sendMessage(chatId, { text, type: 'text' });
    // 3. Reemplazar temporal con real
    setMessages(prev => prev.map(m => m.id === tempMsg.id ? real : m));
  } catch {
    // 4. Marcar como fallido
    setMessages(prev => prev.map(m => m.id === tempMsg.id ? { ...m, status: 'failed' } : m));
  }
};
```

---

## Pendiente de implementar

1. `app/chat/[id].tsx` — pantalla de chat abierto
2. Supabase Realtime en lista de chats
3. Paginación de mensajes (scroll hacia arriba)
4. Envío de imágenes con expo-image-picker
5. Grabación de audio con expo-av
6. Llamadas WebRTC (fase posterior)
