-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('dono', 'motorista');

-- CreateEnum
CREATE TYPE "TipoCarroceria" AS ENUM ('graneleiro', 'tanque', 'bau', 'plataforma', 'outro');

-- CreateEnum
CREATE TYPE "TipoContrato" AS ENUM ('autonomo', 'clt');

-- CreateEnum
CREATE TYPE "StatusAtivo" AS ENUM ('ativo', 'inativo');

-- CreateEnum
CREATE TYPE "TipoCarga" AS ENUM ('grao', 'oleo_soja', 'farelo', 'fertilizante', 'outro');

-- CreateEnum
CREATE TYPE "StatusFrete" AS ENUM ('em_andamento', 'concluido', 'acerto_pendente', 'acerto_realizado');

-- CreateEnum
CREATE TYPE "TipoLancamento" AS ENUM ('combustivel', 'borracharia', 'patio', 'pedagio', 'oficina', 'vale', 'adiantamento', 'salario', 'ipva', 'seguro', 'outro');

-- CreateEnum
CREATE TYPE "StatusAcerto" AS ENUM ('pendente', 'realizado');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'dono',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "frotas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cnpjCpf" TEXT,
    "estado" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ownerId" TEXT NOT NULL,

    CONSTRAINT "frotas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "caminhoes" (
    "id" TEXT NOT NULL,
    "placa" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "ano" INTEGER,
    "carroceria" "TipoCarroceria",
    "status" "StatusAtivo" NOT NULL DEFAULT 'ativo',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "frotaId" TEXT NOT NULL,
    "motoristaId" TEXT,

    CONSTRAINT "caminhoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "motoristas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT,
    "whatsapp" TEXT NOT NULL,
    "percentualComissao" INTEGER NOT NULL,
    "tipoContrato" "TipoContrato" NOT NULL DEFAULT 'autonomo',
    "status" "StatusAtivo" NOT NULL DEFAULT 'ativo',
    "appAtivado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "frotaId" TEXT NOT NULL,

    CONSTRAINT "motoristas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fretes" (
    "id" TEXT NOT NULL,
    "origem" TEXT NOT NULL,
    "destino" TEXT NOT NULL,
    "tipoCarga" "TipoCarga" NOT NULL,
    "kmInicial" INTEGER NOT NULL,
    "kmFinal" INTEGER,
    "valorBruto" INTEGER NOT NULL,
    "status" "StatusFrete" NOT NULL DEFAULT 'em_andamento',
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "frotaId" TEXT NOT NULL,
    "caminhaoId" TEXT NOT NULL,

    CONSTRAINT "fretes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lancamentos" (
    "id" TEXT NOT NULL,
    "tipo" "TipoLancamento" NOT NULL,
    "descricao" TEXT,
    "valor" INTEGER NOT NULL,
    "fotoUrl" TEXT,
    "deducaoAcerto" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "freteId" TEXT,
    "frotaId" TEXT NOT NULL,

    CONSTRAINT "lancamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "acertos" (
    "id" TEXT NOT NULL,
    "valorFrete" INTEGER NOT NULL,
    "percentualComissao" INTEGER NOT NULL,
    "valorComissao" INTEGER NOT NULL,
    "totalDeducoes" INTEGER NOT NULL,
    "saldoFinal" INTEGER NOT NULL,
    "status" "StatusAcerto" NOT NULL DEFAULT 'pendente',
    "comprovanteUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "realizadoEm" TIMESTAMP(3),
    "freteId" TEXT NOT NULL,
    "motoristaId" TEXT NOT NULL,

    CONSTRAINT "acertos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "frotas_ownerId_key" ON "frotas"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "caminhoes_placa_key" ON "caminhoes"("placa");

-- CreateIndex
CREATE UNIQUE INDEX "caminhoes_motoristaId_key" ON "caminhoes"("motoristaId");

-- CreateIndex
CREATE UNIQUE INDEX "acertos_freteId_key" ON "acertos"("freteId");

-- AddForeignKey
ALTER TABLE "frotas" ADD CONSTRAINT "frotas_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "caminhoes" ADD CONSTRAINT "caminhoes_frotaId_fkey" FOREIGN KEY ("frotaId") REFERENCES "frotas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "caminhoes" ADD CONSTRAINT "caminhoes_motoristaId_fkey" FOREIGN KEY ("motoristaId") REFERENCES "motoristas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "motoristas" ADD CONSTRAINT "motoristas_frotaId_fkey" FOREIGN KEY ("frotaId") REFERENCES "frotas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fretes" ADD CONSTRAINT "fretes_frotaId_fkey" FOREIGN KEY ("frotaId") REFERENCES "frotas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fretes" ADD CONSTRAINT "fretes_caminhaoId_fkey" FOREIGN KEY ("caminhaoId") REFERENCES "caminhoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lancamentos" ADD CONSTRAINT "lancamentos_freteId_fkey" FOREIGN KEY ("freteId") REFERENCES "fretes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lancamentos" ADD CONSTRAINT "lancamentos_frotaId_fkey" FOREIGN KEY ("frotaId") REFERENCES "frotas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acertos" ADD CONSTRAINT "acertos_freteId_fkey" FOREIGN KEY ("freteId") REFERENCES "fretes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acertos" ADD CONSTRAINT "acertos_motoristaId_fkey" FOREIGN KEY ("motoristaId") REFERENCES "motoristas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
