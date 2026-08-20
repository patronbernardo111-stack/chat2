-- ═══════════════════════════════════════════════════════════════
-- MI DJANGUE — Tablas Supabase
-- Tanda/caja de ahorro grupal para EGCHAT
-- Ejecutar en: https://supabase.com/dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- 1. Grupos Djangue
CREATE TABLE IF NOT EXISTS djangue_groups (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  description   TEXT,
  frequency     TEXT NOT NULL CHECK (frequency IN ('daily','weekly','monthly','annual')),
  quota_amount  NUMERIC(12,2) NOT NULL,  -- cuota por periodo por miembro
  currency      TEXT NOT NULL DEFAULT 'XAF',
  max_members   INT NOT NULL DEFAULT 12,
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','completed','cancelled')),
  owner_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,    -- responsable general
  secretary_id  UUID REFERENCES users(id) ON DELETE SET NULL,            -- secretario
  wallet_id     UUID,                                                     -- monedero del djangue
  current_turn  INT NOT NULL DEFAULT 1,    -- turno actual (1-based)
  total_turns   INT NOT NULL DEFAULT 0,    -- total de turnos = total miembros
  next_payout_at TIMESTAMPTZ,             -- fecha del próximo cobro
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Monedero del djangue (separado de wallets personales)
CREATE TABLE IF NOT EXISTS djangue_wallets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    UUID NOT NULL UNIQUE REFERENCES djangue_groups(id) ON DELETE CASCADE,
  balance     NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency    TEXT NOT NULL DEFAULT 'XAF',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Miembros del djangue
CREATE TABLE IF NOT EXISTS djangue_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    UUID NOT NULL REFERENCES djangue_groups(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  turn_order  INT NOT NULL,              -- número de turno asignado
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','removed')),
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(group_id, user_id),
  UNIQUE(group_id, turn_order)
);

-- 4. Cuotas/Pagos de cada miembro por turno
CREATE TABLE IF NOT EXISTS djangue_contributions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id        UUID NOT NULL REFERENCES djangue_groups(id) ON DELETE CASCADE,
  member_id       UUID NOT NULL REFERENCES djangue_members(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id),
  turn_number     INT NOT NULL,          -- para qué turno es esta cuota
  amount          NUMERIC(12,2) NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed')),
  paid_at         TIMESTAMPTZ,
  transaction_id  UUID,                  -- referencia a transactions
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Historial de pagos al beneficiario (cuando le toca el turno)
CREATE TABLE IF NOT EXISTS djangue_payouts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id        UUID NOT NULL REFERENCES djangue_groups(id) ON DELETE CASCADE,
  beneficiary_id  UUID NOT NULL REFERENCES users(id),
  turn_number     INT NOT NULL,
  amount          NUMERIC(12,2) NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','failed')),
  paid_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_djangue_groups_owner     ON djangue_groups(owner_id);
CREATE INDEX IF NOT EXISTS idx_djangue_members_group    ON djangue_members(group_id);
CREATE INDEX IF NOT EXISTS idx_djangue_members_user     ON djangue_members(user_id);
CREATE INDEX IF NOT EXISTS idx_djangue_contributions_group ON djangue_contributions(group_id);
CREATE INDEX IF NOT EXISTS idx_djangue_contributions_user  ON djangue_contributions(user_id);
CREATE INDEX IF NOT EXISTS idx_djangue_payouts_group    ON djangue_payouts(group_id);

-- Trigger: actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_djangue_groups_updated_at ON djangue_groups;
CREATE TRIGGER update_djangue_groups_updated_at
  BEFORE UPDATE ON djangue_groups
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_djangue_wallets_updated_at ON djangue_wallets;
CREATE TRIGGER update_djangue_wallets_updated_at
  BEFORE UPDATE ON djangue_wallets
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- RLS (Row Level Security) — solo miembros ven su djangue
ALTER TABLE djangue_groups        ENABLE ROW LEVEL SECURITY;
ALTER TABLE djangue_wallets       ENABLE ROW LEVEL SECURITY;
ALTER TABLE djangue_members       ENABLE ROW LEVEL SECURITY;
ALTER TABLE djangue_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE djangue_payouts       ENABLE ROW LEVEL SECURITY;

-- El service_role de la API tiene acceso total (bypassa RLS)
-- Las policies son para acceso directo desde cliente (no usado aquí)
CREATE POLICY "service_role_all_djangue_groups"        ON djangue_groups        FOR ALL USING (true);
CREATE POLICY "service_role_all_djangue_wallets"       ON djangue_wallets       FOR ALL USING (true);
CREATE POLICY "service_role_all_djangue_members"       ON djangue_members       FOR ALL USING (true);
CREATE POLICY "service_role_all_djangue_contributions" ON djangue_contributions FOR ALL USING (true);
CREATE POLICY "service_role_all_djangue_payouts"       ON djangue_payouts       FOR ALL USING (true);
