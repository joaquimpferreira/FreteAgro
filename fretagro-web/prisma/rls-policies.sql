-- ──────────────────────────────────────────────────────────────────────────────
-- FreteAgro — Row-Level Security Policies (corrigido camelCase)
-- Apply AFTER prisma migrate dev:
--   pnpm prisma db execute --file prisma/rls-policies.sql
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
-- users
-- ──────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;

CREATE POLICY "users_select_own"
  ON users FOR SELECT
  USING (id = auth.uid()::text);

CREATE POLICY "users_update_own"
  ON users FOR UPDATE
  USING (id = auth.uid()::text);

-- ──────────────────────────────────────────────────────────────────────────────
-- frotas
-- ──────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "frotas_owner_all" ON frotas;

CREATE POLICY "frotas_owner_all"
  ON frotas FOR ALL
  USING ("ownerId" = auth.uid()::text);

-- ──────────────────────────────────────────────────────────────────────────────
-- Helper: retorna o frotaId do dono autenticado (web/owner path)
-- ──────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION current_frota_id()
  RETURNS text
  LANGUAGE sql STABLE
  SECURITY DEFINER
AS $$
  SELECT id FROM frotas WHERE "ownerId" = auth.uid()::text LIMIT 1;
$$;

-- ──────────────────────────────────────────────────────────────────────────────
-- Helper: retorna o id do motorista autenticado (mobile path)
-- Uses supabaseUserId which is the Supabase Auth UUID stored on the motorista row.
-- ──────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION current_motorista_id()
  RETURNS text
  LANGUAGE sql STABLE
  SECURITY DEFINER
AS $$
  SELECT id FROM motoristas WHERE "supabaseUserId" = auth.uid()::text LIMIT 1;
$$;

-- ──────────────────────────────────────────────────────────────────────────────
-- caminhoes
-- ──────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "caminhoes_fleet_all"        ON caminhoes;
DROP POLICY IF EXISTS "caminhoes_motorista_select" ON caminhoes;

CREATE POLICY "caminhoes_fleet_all"
  ON caminhoes FOR ALL
  USING ("frotaId" = current_frota_id());

-- Motorista can read their own assigned truck
CREATE POLICY "caminhoes_motorista_select"
  ON caminhoes FOR SELECT
  USING ("motoristaId" = current_motorista_id());

-- ──────────────────────────────────────────────────────────────────────────────
-- motoristas
-- ──────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "motoristas_fleet_all"   ON motoristas;
DROP POLICY IF EXISTS "motoristas_self_select" ON motoristas;

CREATE POLICY "motoristas_fleet_all"
  ON motoristas FOR ALL
  USING ("frotaId" = current_frota_id());

-- Motorista can read their own row (mobile: supabaseUserId = auth.uid())
CREATE POLICY "motoristas_self_select"
  ON motoristas FOR SELECT
  USING (
    "supabaseUserId" = auth.uid()::text
    OR "frotaId" = current_frota_id()
  );

-- ──────────────────────────────────────────────────────────────────────────────
-- fretes
-- ──────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "fretes_fleet_all"        ON fretes;
DROP POLICY IF EXISTS "fretes_motorista_select" ON fretes;
DROP POLICY IF EXISTS "fretes_motorista_insert" ON fretes;
DROP POLICY IF EXISTS "fretes_motorista_update" ON fretes;

CREATE POLICY "fretes_fleet_all"
  ON fretes FOR ALL
  USING ("frotaId" = current_frota_id());

CREATE POLICY "fretes_motorista_select"
  ON fretes FOR SELECT
  USING (
    "caminhaoId" IN (
      SELECT c.id FROM caminhoes c
      WHERE c."motoristaId" = current_motorista_id()
    )
  );

CREATE POLICY "fretes_motorista_insert"
  ON fretes FOR INSERT
  WITH CHECK (
    "caminhaoId" IN (
      SELECT c.id FROM caminhoes c
      WHERE c."motoristaId" = current_motorista_id()
    )
  );

CREATE POLICY "fretes_motorista_update"
  ON fretes FOR UPDATE
  USING (
    "caminhaoId" IN (
      SELECT c.id FROM caminhoes c
      WHERE c."motoristaId" = current_motorista_id()
    )
  );

-- ──────────────────────────────────────────────────────────────────────────────
-- lancamentos
-- ──────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "lancamentos_fleet_all"        ON lancamentos;
DROP POLICY IF EXISTS "lancamentos_motorista_insert" ON lancamentos;

CREATE POLICY "lancamentos_fleet_all"
  ON lancamentos FOR ALL
  USING ("frotaId" = current_frota_id());

CREATE POLICY "lancamentos_motorista_insert"
  ON lancamentos FOR INSERT
  WITH CHECK (
    "freteId" IN (
      SELECT f.id FROM fretes f
      JOIN caminhoes c ON c.id = f."caminhaoId"
      WHERE c."motoristaId" = current_motorista_id()
    )
  );

-- ──────────────────────────────────────────────────────────────────────────────
-- acertos
-- ──────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "acertos_fleet_all"        ON acertos;
DROP POLICY IF EXISTS "acertos_motorista_select" ON acertos;

CREATE POLICY "acertos_fleet_all"
  ON acertos FOR ALL
  USING (
    "freteId" IN (SELECT id FROM fretes WHERE "frotaId" = current_frota_id())
  );

CREATE POLICY "acertos_motorista_select"
  ON acertos FOR SELECT
  USING (
    "motoristaId" = current_motorista_id()
  );

-- ──────────────────────────────────────────────────────────────────────────────
-- trechos_km
-- Written exclusively by fretagro-mobile via offline sync queue.
-- Fleet owner: full access. Driver: select/insert/update own trip legs.
-- ──────────────────────────────────────────────────────────────────────────────
ALTER TABLE trechos_km ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "trechos_km_fleet_all"          ON trechos_km;
DROP POLICY IF EXISTS "trechos_km_motorista_select"   ON trechos_km;
DROP POLICY IF EXISTS "trechos_km_motorista_insert"   ON trechos_km;
DROP POLICY IF EXISTS "trechos_km_motorista_update"   ON trechos_km;

CREATE POLICY "trechos_km_fleet_all"
  ON trechos_km FOR ALL
  USING ("frotaId" = current_frota_id());

CREATE POLICY "trechos_km_motorista_select"
  ON trechos_km FOR SELECT
  USING (
    "freteId" IN (
      SELECT f.id FROM fretes f
      JOIN caminhoes c ON c.id = f."caminhaoId"
      WHERE c."motoristaId" = current_motorista_id()
    )
  );

CREATE POLICY "trechos_km_motorista_insert"
  ON trechos_km FOR INSERT
  WITH CHECK (
    "freteId" IN (
      SELECT f.id FROM fretes f
      JOIN caminhoes c ON c.id = f."caminhaoId"
      WHERE c."motoristaId" = current_motorista_id()
    )
  );

CREATE POLICY "trechos_km_motorista_update"
  ON trechos_km FOR UPDATE
  USING (
    "freteId" IN (
      SELECT f.id FROM fretes f
      JOIN caminhoes c ON c.id = f."caminhaoId"
      WHERE c."motoristaId" = current_motorista_id()
    )
  );

-- ──────────────────────────────────────────────────────────────────────────────
-- abastecimentos
-- Written exclusively by fretagro-mobile via offline sync queue.
-- Fleet owner: full access. Driver: select/insert own refuels.
-- ──────────────────────────────────────────────────────────────────────────────
ALTER TABLE abastecimentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "abastecimentos_fleet_all"        ON abastecimentos;
DROP POLICY IF EXISTS "abastecimentos_motorista_select" ON abastecimentos;
DROP POLICY IF EXISTS "abastecimentos_motorista_insert" ON abastecimentos;

CREATE POLICY "abastecimentos_fleet_all"
  ON abastecimentos FOR ALL
  USING ("frotaId" = current_frota_id());

CREATE POLICY "abastecimentos_motorista_select"
  ON abastecimentos FOR SELECT
  USING (
    "freteId" IN (
      SELECT f.id FROM fretes f
      JOIN caminhoes c ON c.id = f."caminhaoId"
      WHERE c."motoristaId" = current_motorista_id()
    )
  );

CREATE POLICY "abastecimentos_motorista_insert"
  ON abastecimentos FOR INSERT
  WITH CHECK (
    "freteId" IN (
      SELECT f.id FROM fretes f
      JOIN caminhoes c ON c.id = f."caminhaoId"
      WHERE c."motoristaId" = current_motorista_id()
    )
  );
