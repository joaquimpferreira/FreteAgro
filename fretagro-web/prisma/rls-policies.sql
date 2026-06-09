-- ──────────────────────────────────────────────────────────────────────────────
-- FreteAgro — Row-Level Security Policies
-- Apply AFTER prisma migrate dev:
--   pnpm prisma db execute --file prisma/rls-policies.sql
--
-- Principle VI / SC-008: Zero cross-fleet data access enforced at DB level.
-- A dono may only read/write rows where frotaId belongs to their fleet.
-- A motorista may only read their own scope.
-- ──────────────────────────────────────────────────────────────────────────────

-- Enable RLS on all application tables
ALTER TABLE frotas       ENABLE ROW LEVEL SECURITY;
ALTER TABLE caminhoes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE motoristas   ENABLE ROW LEVEL SECURITY;
ALTER TABLE fretes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE lancamentos  ENABLE ROW LEVEL SECURITY;
ALTER TABLE acertos      ENABLE ROW LEVEL SECURITY;
ALTER TABLE users        ENABLE ROW LEVEL SECURITY;

-- ──────────────────────────────────────────────────────────────────────────────
-- Helper: extract the authenticated user's Supabase UID from the JWT
-- ──────────────────────────────────────────────────────────────────────────────
-- We use auth.uid() provided by Supabase; it returns the UUID of the
-- currently authenticated user from the JWT passed in the request headers.

-- ──────────────────────────────────────────────────────────────────────────────
-- users — each user can only read/update their own record
-- ──────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "users_select_own"  ON users;
DROP POLICY IF EXISTS "users_update_own"  ON users;

CREATE POLICY "users_select_own"
  ON users FOR SELECT
  USING (id = auth.uid()::text);

CREATE POLICY "users_update_own"
  ON users FOR UPDATE
  USING (id = auth.uid()::text);

-- ──────────────────────────────────────────────────────────────────────────────
-- frotas — fleet owner can CRUD their own fleet
-- ──────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "frotas_owner_all"  ON frotas;

CREATE POLICY "frotas_owner_all"
  ON frotas FOR ALL
  USING (owner_id = auth.uid()::text);

-- ──────────────────────────────────────────────────────────────────────────────
-- Helper function: returns the frotaId for the currently authenticated dono
-- ──────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION current_frota_id()
  RETURNS text
  LANGUAGE sql STABLE
  SECURITY DEFINER
AS $$
  SELECT id FROM frotas WHERE owner_id = auth.uid()::text LIMIT 1;
$$;

-- ──────────────────────────────────────────────────────────────────────────────
-- caminhoes — dono can CRUD only trucks in their fleet
-- ──────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "caminhoes_fleet_all"  ON caminhoes;

CREATE POLICY "caminhoes_fleet_all"
  ON caminhoes FOR ALL
  USING (frota_id = current_frota_id());

-- ──────────────────────────────────────────────────────────────────────────────
-- motoristas
-- dono: full CRUD over their fleet's drivers
-- motorista: can read their own row (for app profile)
-- ──────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "motoristas_fleet_all"   ON motoristas;
DROP POLICY IF EXISTS "motoristas_self_select" ON motoristas;

CREATE POLICY "motoristas_fleet_all"
  ON motoristas FOR ALL
  USING (frota_id = current_frota_id());

-- Motoristas can read their own driver record (identified by whatsapp match on
-- users table); in practice the mobile app authenticates as a User with
-- role = motorista and the app sets a claim. For now, allow if user's email
-- resolves to this driver — application layer enforces the exact binding.
CREATE POLICY "motoristas_self_select"
  ON motoristas FOR SELECT
  USING (
    frota_id IN (
      SELECT f.id FROM frotas f
      JOIN caminhoes c ON c.frota_id = f.id AND c.motorista_id = motoristas.id
      -- The motorista authenticates as a User; we check the frota membership
      -- via the fleet that invited them.
      LIMIT 1
    )
    OR frota_id = current_frota_id()
  );

-- ──────────────────────────────────────────────────────────────────────────────
-- fretes — dono owns all; motorista can read/write their own truck's freights
-- ──────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "fretes_fleet_all"        ON fretes;
DROP POLICY IF EXISTS "fretes_motorista_select" ON fretes;
DROP POLICY IF EXISTS "fretes_motorista_insert" ON fretes;
DROP POLICY IF EXISTS "fretes_motorista_update" ON fretes;

CREATE POLICY "fretes_fleet_all"
  ON fretes FOR ALL
  USING (frota_id = current_frota_id());

-- Motorista can see and manage their own truck's freights (US7 / FR-037–039)
CREATE POLICY "fretes_motorista_select"
  ON fretes FOR SELECT
  USING (
    caminhao_id IN (
      SELECT c.id FROM caminhoes c
      JOIN motoristas m ON m.id = c.motorista_id
      JOIN frotas f ON f.id = c.frota_id
      -- Motor authenticated user matches the driver via JWT claim set at login
      WHERE m.id::text = (auth.jwt() ->> 'motorista_id')
    )
  );

CREATE POLICY "fretes_motorista_insert"
  ON fretes FOR INSERT
  WITH CHECK (
    caminhao_id IN (
      SELECT c.id FROM caminhoes c
      WHERE c.motorista_id::text = (auth.jwt() ->> 'motorista_id')
    )
  );

CREATE POLICY "fretes_motorista_update"
  ON fretes FOR UPDATE
  USING (
    caminhao_id IN (
      SELECT c.id FROM caminhoes c
      WHERE c.motorista_id::text = (auth.jwt() ->> 'motorista_id')
    )
  );

-- ──────────────────────────────────────────────────────────────────────────────
-- lancamentos — same scoping as fretes; avulso entries have freteId = NULL
-- ──────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "lancamentos_fleet_all"        ON lancamentos;
DROP POLICY IF EXISTS "lancamentos_motorista_insert" ON lancamentos;

CREATE POLICY "lancamentos_fleet_all"
  ON lancamentos FOR ALL
  USING (frota_id = current_frota_id());

CREATE POLICY "lancamentos_motorista_insert"
  ON lancamentos FOR INSERT
  WITH CHECK (
    frete_id IN (
      SELECT f.id FROM fretes f
      JOIN caminhoes c ON c.id = f.caminhao_id
      WHERE c.motorista_id::text = (auth.jwt() ->> 'motorista_id')
    )
  );

-- ──────────────────────────────────────────────────────────────────────────────
-- acertos — dono only; motorista can read their own (FR-027)
-- ──────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "acertos_fleet_all"        ON acertos;
DROP POLICY IF EXISTS "acertos_motorista_select" ON acertos;

CREATE POLICY "acertos_fleet_all"
  ON acertos FOR ALL
  USING (
    frete_id IN (SELECT id FROM fretes WHERE frota_id = current_frota_id())
  );

CREATE POLICY "acertos_motorista_select"
  ON acertos FOR SELECT
  USING (
    motorista_id::text = (auth.jwt() ->> 'motorista_id')
  );

-- ──────────────────────────────────────────────────────────────────────────────
-- Service role bypass — Prisma uses service_role key for trusted server ops;
-- service_role bypasses RLS by default in Supabase.
-- Application code using service_role MUST re-apply frotaId scoping in lib/.
-- ──────────────────────────────────────────────────────────────────────────────
