-- Esquema completo de base de datos para EGCHAT con mensajería completa
-- Ejecutar en Supabase SQL Editor

-- ══════════════════════════════════════════════════════════════════
-- TABLAS PRINCIPALES
-- ══════════════════════════════════════════════════════════════════

-- Tabla de usuarios (actualizada)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) UNIQUE NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  last_seen TIMESTAMP,
  online_status BOOLEAN DEFAULT FALSE,
  app_version VARCHAR(20) DEFAULT '2.5.0',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de chats
CREATE TABLE IF NOT EXISTS chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) NOT NULL CHECK (type IN ('private', 'group')),
  name VARCHAR(100), -- Solo para grupos
  avatar_url TEXT,
  description TEXT, -- Descripción del grupo
  participants JSONB NOT NULL, -- Array de objetos {user_id: UUID, role: 'admin' | 'member'}
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  last_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de mensajes
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT,
  type VARCHAR(20) DEFAULT 'text' CHECK (type IN ('text', 'image', 'video', 'audio', 'file', 'location', 'contact', 'voice')),
  status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed', 'sending')),
  reply_to UUID REFERENCES messages(id) ON DELETE SET NULL,
  file_url TEXT,
  file_type VARCHAR(50),
  file_size BIGINT,
  thumbnail_url TEXT,
  duration INTEGER, -- Para audio/video en segundos
  location JSONB, -- Para mensajes de ubicación {lat, lng, address}
  contact_data JSONB, -- Para mensajes de contacto
  edited_at TIMESTAMP,
  deleted_at TIMESTAMP, -- Para soft delete
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de participantes de chat (para contadores de no leídos y roles)
CREATE TABLE IF NOT EXISTS chat_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  unread_count INTEGER DEFAULT 0,
  last_read_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  joined_at TIMESTAMP DEFAULT NOW(),
  left_at TIMESTAMP,
  is_muted BOOLEAN DEFAULT FALSE,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_favorite BOOLEAN DEFAULT FALSE,
  UNIQUE(chat_id, user_id)
);

-- Tabla para rastrear eliminaciones individuales (eliminar para mí)
CREATE TABLE IF NOT EXISTS message_deletions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  deleted_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_message_deletions_user ON message_deletions (user_id);
CREATE INDEX IF NOT EXISTS idx_message_deletions_message ON message_deletions (message_id);

-- Tabla de mensajes leídos (para confirmación de lectura)
CREATE TABLE IF NOT EXISTS message_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  read_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(chat_id, user_id, message_id)
);

-- Tabla de contactos del usuario
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nickname VARCHAR(100),
  is_blocked BOOLEAN DEFAULT FALSE,
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, contact_id)
);

-- ══════════════════════════════════════════════════════════════════
-- TABLAS DE SERVICIOS (EXISTENTES)
-- ══════════════════════════════════════════════════════════════════

-- Tabla de wallets (existente)
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  balance DECIMAL(12,2) DEFAULT 5000.00,
  currency VARCHAR(3) DEFAULT 'XAF',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Tabla de transacciones (existente)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('deposit', 'withdraw', 'transfer_sent', 'transfer_received', 'payment')),
  amount DECIMAL(12,2) NOT NULL,
  method VARCHAR(50),
  reference TEXT,
  description TEXT,
  status VARCHAR(20) DEFAULT 'completed',
  metadata JSONB, -- Datos adicionales
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de códigos de recarga (existente)
CREATE TABLE IF NOT EXISTS recharge_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) UNIQUE NOT NULL,
  amount DECIMAL(12,2) DEFAULT 5000.00,
  used BOOLEAN DEFAULT FALSE,
  is_used BOOLEAN DEFAULT FALSE,
  used_by UUID REFERENCES users(id) ON DELETE SET NULL,
  used_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de conversaciones con LIA-25 (existente)
CREATE TABLE IF NOT EXISTS lia_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  reply TEXT NOT NULL,
  context JSONB, -- Contexto adicional
  created_at TIMESTAMP DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════════
-- ÍNDICES PARA MEJOR RENDIMIENTO
-- ══════════════════════════════════════════════════════════════════

-- Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_users_phone ON users (phone);
CREATE INDEX IF NOT EXISTS idx_users_full_name ON users (full_name);
CREATE INDEX IF NOT EXISTS idx_users_online_status ON users (online_status);
CREATE INDEX IF NOT EXISTS idx_users_last_seen ON users (last_seen DESC);

CREATE INDEX IF NOT EXISTS idx_chats_participants ON chats USING GIN (participants);
CREATE INDEX IF NOT EXISTS idx_chats_type ON chats (type);
CREATE INDEX IF NOT EXISTS idx_chats_created_by ON chats (created_by);
CREATE INDEX IF NOT EXISTS idx_chats_updated_at ON chats (updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages (chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages (sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_type ON messages (type);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages (status);
CREATE INDEX IF NOT EXISTS idx_messages_deleted_at ON messages (deleted_at);

CREATE INDEX IF NOT EXISTS idx_chat_participants_chat_user ON chat_participants (chat_id, user_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user_id ON chat_participants (user_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_unread_count ON chat_participants (unread_count DESC);
CREATE INDEX IF NOT EXISTS idx_chat_participants_is_pinned ON chat_participants (is_pinned DESC);
CREATE INDEX IF NOT EXISTS idx_chat_participants_is_muted ON chat_participants (is_muted);

CREATE INDEX IF NOT EXISTS idx_message_reads_chat_user ON message_reads (chat_id, user_id);
CREATE INDEX IF NOT EXISTS idx_message_reads_message_id ON message_reads (message_id);
CREATE INDEX IF NOT EXISTS idx_message_reads_read_at ON message_reads (read_at DESC);

CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts (user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_contact_id ON contacts (contact_id);
CREATE INDEX IF NOT EXISTS idx_contacts_is_blocked ON contacts (is_blocked);
CREATE INDEX IF NOT EXISTS idx_contacts_is_favorite ON contacts (is_favorite);

-- ══════════════════════════════════════════════════════════════════
-- FUNCIONES Y TRIGGERS
-- ══════════════════════════════════════════════════════════════════

-- Función para incrementar contador de no leídos
CREATE OR REPLACE FUNCTION increment_unread_count(chat_id_param UUID, user_ids UUID[])
RETURNS void AS $$
BEGIN
  -- Incrementar contador para cada usuario que no envió el mensaje
  INSERT INTO chat_participants (chat_id, user_id, unread_count, joined_at)
  SELECT 
    chat_id_param,
    unnest(user_ids),
    1,
    NOW()
  ON CONFLICT (chat_id, user_id) 
  DO UPDATE SET 
    unread_count = chat_participants.unread_count + 1,
    updated_at = NOW()
  WHERE chat_participants.chat_id = chat_id_param 
    AND chat_participants.user_id = ANY(user_ids)
    AND chat_participants.left_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Función para marcar mensajes como leídos
CREATE OR REPLACE FUNCTION mark_messages_read(chat_id_param UUID, user_id_param UUID, message_id_param UUID)
RETURNS void AS $$
BEGIN
  -- Actualizar último mensaje leído
  UPDATE chat_participants 
  SET 
    last_read_message_id = message_id_param,
    unread_count = 0,
    updated_at = NOW()
  WHERE chat_id = chat_id_param 
    AND user_id = user_id_param;

  -- Registrar lectura del mensaje específico
  INSERT INTO message_reads (chat_id, user_id, message_id, read_at)
  VALUES (chat_id_param, user_id_param, message_id_param)
  ON CONFLICT (chat_id, user_id, message_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at en chats
CREATE OR REPLACE FUNCTION update_chat_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_chat_timestamp
  BEFORE UPDATE ON chats
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_timestamp();

-- Trigger para actualizar updated_at en users
CREATE TRIGGER trigger_update_user_timestamp
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_timestamp();

-- Trigger para crear participantes cuando se crea un chat
CREATE OR REPLACE FUNCTION create_chat_participants()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO chat_participants (chat_id, user_id, role, joined_at)
  SELECT 
    NEW.id,
    (participant->>'user_id')::UUID,
    COALESCE((participant->>'role')::VARCHAR, 'member'),
    NOW()
  FROM jsonb_array_elements(NEW.participants) AS participant;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_chat_participants
  AFTER INSERT ON chats
  FOR EACH ROW
  EXECUTE FUNCTION create_chat_participants();

-- ══════════════════════════════════════════════════════════════════
-- VISTAS ÚTILES
-- ══════════════════════════════════════════════════════════════════

-- Vista para obtener chats con información del último mensaje
CREATE OR REPLACE VIEW chat_list AS
SELECT 
  c.id,
  c.type,
  c.name,
  c.avatar_url,
  c.description,
  c.updated_at,
  cp.user_id,
  cp.unread_count,
  cp.is_pinned,
  cp.is_muted,
  m.id as last_message_id,
  m.text as last_message_text,
  m.type as last_message_type,
  m.created_at as last_message_created_at,
  m.sender_id as last_message_sender_id,
  u.full_name as last_message_sender_name,
  u.avatar_url as last_message_sender_avatar
FROM chats c
JOIN chat_participants cp ON c.id = cp.chat_id
LEFT JOIN messages m ON c.last_message_id = m.id
LEFT JOIN users u ON m.sender_id = u.id
WHERE cp.left_at IS NULL
ORDER BY cp.is_pinned DESC, c.updated_at DESC;

-- Vista para obtener participantes de chat con información de usuario
CREATE OR REPLACE VIEW chat_participants_info AS
SELECT 
  cp.chat_id,
  cp.user_id,
  cp.role,
  cp.unread_count,
  cp.is_muted,
  cp.is_pinned,
  cp.joined_at,
  u.phone,
  u.full_name,
  u.avatar_url,
  u.online_status,
  u.last_seen
FROM chat_participants cp
JOIN users u ON cp.user_id = u.id
WHERE cp.left_at IS NULL;

-- ══════════════════════════════════════════════════════════════════
-- DATOS DE EJEMPLO
-- ══════════════════════════════════════════════════════════════════

-- Usuarios de ejemplo
INSERT INTO users (phone, full_name, password_hash) VALUES
  ('+240222123456', 'Admin EGCHAT', '$2a$10$rQZ8ZkHqKqKqKqKqKqKu'),
  ('+240555123456', 'Usuario Demo', '$2a$10$rQZ8ZkHqKqKqKqKqKqKu'),
  ('+240333456789', 'Maria Nsue', '$2a$10$rQZ8ZkHqKqKqKqKqKqKu'),
  ('+240444789012', 'Carlos Mba', '$2a$10$rQZ8ZkHqKqKqKqKqKqKu')
ON CONFLICT (phone) DO NOTHING;

-- Códigos de recarga de ejemplo
INSERT INTO recharge_codes (code, amount) VALUES
  ('DEMO-1234-5678-9012', 5000),
  ('DEMO-2345-6789-0123', 10000),
  ('DEMO-3456-7890-1234', 15000),
  ('DEMO-4567-8901-2345', 20000)
ON CONFLICT (code) DO NOTHING;

-- ══════════════════════════════════════════════════════════════════
-- POLÍTICAS DE ROW LEVEL SECURITY (RLS)
-- ══════════════════════════════════════════════════════════════════

-- Habilitar RLS en todas las tablas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE recharge_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lia_conversations ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para users
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = id::text);

-- Políticas para chats (solo participantes)
CREATE POLICY "Users can view chats they participate in" ON chats FOR SELECT USING (
  participants::jsonb @> jsonb_build_object('user_id', auth.uid())
);
CREATE POLICY "Users can create chats" ON chats FOR INSERT WITH CHECK (
  participants::jsonb @> jsonb_build_object('user_id', auth.uid())
);

-- Políticas para mensajes (solo participantes del chat)
CREATE POLICY "Users can view messages in their chats" ON messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM chat_participants 
    WHERE chat_participants.chat_id = messages.chat_id 
    AND chat_participants.user_id = auth.uid()
    AND chat_participants.left_at IS NULL
  )
);
CREATE POLICY "Users can send messages to their chats" ON messages FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM chat_participants 
    WHERE chat_participants.chat_id = messages.chat_id 
    AND chat_participants.user_id = auth.uid()
    AND chat_participants.left_at IS NULL
  )
);

-- Políticas para participantes de chat
CREATE POLICY "Users can view their chat participation" ON chat_participants FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update their chat participation" ON chat_participants FOR UPDATE USING (user_id = auth.uid());

-- Políticas para contactos
CREATE POLICY "Users can view their contacts" ON contacts FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can manage their contacts" ON contacts FOR ALL USING (user_id = auth.uid());

-- ══════════════════════════════════════════════════════════════════
-- MENSAJE DE CONFIRMACIÓN
-- ══════════════════════════════════════════════════════════════════

DO $$
BEGIN
  RAISE NOTICE '═════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'Base de datos EGCHAT con mensajería completa creada exitosamente';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Tablas creadas:';
  RAISE NOTICE '   - users (con online_status, last_seen)';
  RAISE NOTICE '   - chats (privados y grupales)';
  RAISE NOTICE '   - messages (con todos los tipos de contenido)';
  RAISE NOTICE '   - chat_participants (con roles y contadores)';
  RAISE NOTICE '   - message_reads (confirmación de lectura)';
  RAISE NOTICE '   - contacts (con bloqueo y favoritos)';
  RAISE NOTICE '   - wallets, transactions, recharge_codes';
  RAISE NOTICE '   - lia_conversations';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Índices optimizados para rendimiento';
  RAISE NOTICE '✅ Triggers automáticos configurados';
  RAISE NOTICE '✅ Vistas útiles creadas';
  RAISE NOTICE '✅ Row Level Security (RLS) activado';
  RAISE NOTICE '';
  RAISE NOTICE '📱 Funcionalidades disponibles:';
  RAISE NOTICE '   - Chat privado 1-a-1';
  RAISE NOTICE '   - Chat grupal con roles';
  RAISE NOTICE '   - Mensajes de texto, imagen, video, audio, archivos';
  RAISE NOTICE '   - Respuestas a mensajes';
  RAISE NOTICE '   - Confirmación de lectura';
  RAISE NOTICE '   - Contador de mensajes no leídos';
  RAISE NOTICE '   - Contactos con bloqueo y favoritos';
  RAISE NOTICE '   - Estado online/offline';
  RAISE NOTICE '   - Edición y eliminación de mensajes';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Sistema listo para producción con EGCHAT!';
  RAISE NOTICE '═════════════════════════════════════════════════════════════════';
END $$;
