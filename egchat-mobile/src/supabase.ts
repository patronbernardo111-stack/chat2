// Cliente Supabase para React Native
// Usado para: Realtime subscriptions (mensajes en tiempo real)
// NO usado para: auth (usamos JWT custom via Render API)

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://dptpdifjqgzccjauhodq.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: false,  // No usamos Supabase Auth
    persistSession: false,    // No usamos Supabase Auth
    detectSessionInUrl: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// ── Suscripción a mensajes nuevos en un chat ──────────────────────
export const subscribeToChat = (
  chatId: string,
  onNewMessage: (message: any) => void
) => {
  const channel = supabase
    .channel(`chat:${chatId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${chatId}`,
      },
      (payload) => {
        onNewMessage(payload.new);
      }
    )
    .subscribe();

  // Retorna función para desuscribirse
  return () => {
    supabase.removeChannel(channel);
  };
};

// ── Suscripción a actualizaciones de chats del usuario ───────────
export const subscribeToUserChats = (
  userId: string,
  onChatUpdated: () => void
) => {
  const channel = supabase
    .channel(`user-chats:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'chat_participants',
        filter: `user_id=eq.${userId}`,
      },
      () => onChatUpdated()
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'chats',
      },
      () => onChatUpdated()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
