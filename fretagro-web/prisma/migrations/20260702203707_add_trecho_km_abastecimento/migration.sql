-- Migration: add_trecho_km_abastecimento
-- Adds TrechoKm and Abastecimento tables for the fretagro-mobile app
-- Also adds back-relations (trechos, abastecimentos) on Frete and Frota,
-- and a denormalized motoristaId on Frete for efficient driver queries.

-- Add motoristaId to fretes (denormalized for mobile driver queries)
ALTER TABLE "fretes" ADD COLUMN "motoristaId" TEXT;

-- TrechoKm — a single leg of a trip
CREATE TABLE "trechos_km" (
    "id"        TEXT NOT NULL,
    "tipo"      TEXT NOT NULL,
    "kmInicial" INTEGER NOT NULL,
    "kmFinal"   INTEGER,
    "kmRodado"  INTEGER,
    "ordem"     INTEGER NOT NULL,
    "fechadoEm" TIMESTAMP(3),
    "freteId"   TEXT NOT NULL,
    "frotaId"   TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trechos_km_pkey" PRIMARY KEY ("id")
);

-- Abastecimento — fuel refuel event
CREATE TABLE "abastecimentos" (
    "id"            TEXT NOT NULL,
    "subtipo"       TEXT NOT NULL,
    "litros"        DECIMAL(65,30) NOT NULL,
    "precoPorLitro" DECIMAL(65,30) NOT NULL,
    "valorTotal"    INTEGER NOT NULL,
    "local"         TEXT,
    "kmAtual"       INTEGER,
    "fotoUrl"       TEXT,
    "trechoId"      TEXT,
    "freteId"       TEXT NOT NULL,
    "frotaId"       TEXT NOT NULL,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "abastecimentos_pkey" PRIMARY KEY ("id")
);

-- Foreign keys for trechos_km
ALTER TABLE "trechos_km" ADD CONSTRAINT "trechos_km_freteId_fkey"
    FOREIGN KEY ("freteId") REFERENCES "fretes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "trechos_km" ADD CONSTRAINT "trechos_km_frotaId_fkey"
    FOREIGN KEY ("frotaId") REFERENCES "frotas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Foreign keys for abastecimentos
ALTER TABLE "abastecimentos" ADD CONSTRAINT "abastecimentos_trechoId_fkey"
    FOREIGN KEY ("trechoId") REFERENCES "trechos_km"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "abastecimentos" ADD CONSTRAINT "abastecimentos_freteId_fkey"
    FOREIGN KEY ("freteId") REFERENCES "fretes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "abastecimentos" ADD CONSTRAINT "abastecimentos_frotaId_fkey"
    FOREIGN KEY ("frotaId") REFERENCES "frotas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
