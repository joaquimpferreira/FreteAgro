<div align="center">

# 💻 FreteAgro Web — Plataforma SaaS para Gestão de Frota Agrícola

**Painel web para gestão operacional e financeira de frotas de transporte agrícola.**

Frota, fretes, acertos financeiros, caixa e relatórios — tudo em um dashboard dark, multi-tenant e mobile-friendly.

</div>

---

## 📑 Índice

- [Visão geral](#-visão-geral)
- [Funcionalidades por módulo](#-funcionalidades-por-módulo)
- [Tech Stack](#-tech-stack)
- [Pré-requisitos](#-pré-requisitos)
- [Setup](#-setup)
- [Variáveis de ambiente](#-variáveis-de-ambiente)
- [Rodando o app](#-rodando-o-app)
- [Quality Gates](#-quality-gates)
- [Estrutura do projeto](#-estrutura-do-projeto)
- [Princípios de arquitetura](#-princípios-de-arquitetura)
- [Banco de dados & multi-tenancy](#-banco-de-dados--multi-tenancy)
- [Design System](#-design-system)
- [Deploy](#-deploy)
- [Troubleshooting](#-troubleshooting)

---

## 🎯 Visão geral

O `fretagro-web` é o painel usado pelo **dono da frota**. Faz parte do monorepo FreteAgro (veja o [README raiz](../README.md)) e compartilha o banco Supabase e os tipos (`@fretagro/types`) com o app mobile do motorista.

O dono cadastra caminhões e motoristas, registra fretes com despesas, calcula o **acerto financeiro** com o motorista (comissão − deduções), controla o **caixa** da frota e acompanha indicadores no **dashboard**. Os dados de campo (trechos/km e abastecimentos) chegam automaticamente do app mobile.

---

## 🧩 Funcionalidades por módulo

| Módulo | Descrição | Código |
|--------|-----------|--------|
| **Autenticação & Onboarding** | Cadastro do dono, login, recuperação de senha, guia de primeiros passos | `app/(auth)/`, `lib/auth/` |
| **Gestão de frota** | Caminhões e motoristas; regra **1 caminhão = 1 motorista ativo** | `lib/fleet/`, `components/frota/` |
| **Fretes** | Registro de viagens, despesas com comprovante, status; soft-delete com histórico | `lib/fretes/`, `components/fretes/` |
| **Acerto financeiro** | Comissão automática, deduções (vales/adiantamentos), saldo líquido, comprovante PDF | `lib/finance/`, `lib/pdf/`, `components/acertos/` |
| **Caixa da frota** | Extrato de entradas/saídas por categoria, lucro líquido do período | `lib/caixa/`, `components/dashboard/` |
| **Dashboard & Relatórios** | Indicadores, gráficos de tendência (Recharts), export Excel/PDF | `lib/dashboard/`, `lib/excel/`, `lib/pdf/` |
| **Notificações** | Convite do motorista por WhatsApp (provider-agnostic) | `lib/notifications/` |

---

## 🗺️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router, TypeScript strict) |
| Database | Supabase PostgreSQL via Prisma ORM |
| Auth | Next-Auth v5 (Auth.js) bridged to Supabase Auth |
| Styling | Tailwind CSS + Shadcn/UI (dark theme) |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Reports | jsPDF + xlsx (SheetJS) |
| Testing | Vitest (unit) + Playwright (E2E + 375px mobile) |
| Deploy | Vercel |

---

## ✅ Pré-requisitos

- **Node.js** 20 LTS
- **pnpm** ≥ 9 (`npm install -g pnpm` ou `corepack enable`)
- Um projeto **[Supabase](https://supabase.com)** (PostgreSQL + Auth + Storage)
- `psql` (opcional, para aplicar as políticas de RLS via terminal)

---

## ⚙️ Setup

> Instale a partir da **raiz do monorepo** para resolver o link `workspace:*` do `@fretagro/types`.

```bash
# 1. Clonar e instalar dependências (na raiz do monorepo)
pnpm install

# 2. Copiar as variáveis de ambiente
cd fretagro-web
cp .env.example .env.local
# Edite .env.local e preencha todos os valores (veja os comentários no arquivo)

# 3. Gerar o Prisma client + rodar as migrations
pnpm prisma generate
pnpm prisma migrate dev

# 4. Aplicar as políticas de Row-Level Security (isolamento multi-tenant)
pnpm prisma db execute --file prisma/rls-policies.sql

# 5. Subir o servidor de desenvolvimento
pnpm dev   # http://localhost:3000
```

---

## 🔐 Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha os valores. Todas as variáveis obrigatórias estão documentadas com placeholders no `.env.example`.

| Variável | Escopo | Descrição |
|----------|--------|-----------|
| `DATABASE_URL` | server | Supabase Postgres via PgBouncer (porta 6543) |
| `DIRECT_URL` | server | Conexão direta ao Postgres para `prisma migrate` (porta 5432) |
| `NEXT_PUBLIC_SUPABASE_URL` | browser + server | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser + server | Anon key do Supabase (pode expor) |
| `SUPABASE_SERVICE_ROLE_KEY` | **server only** | Service role key — nunca expor ao cliente |
| `NEXTAUTH_SECRET` | server | Segredo de assinatura JWT (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | server | URL canônica do app (ex.: `http://localhost:3000`) |
| `WHATSAPP_API_URL` | server | Endpoint do provedor WhatsApp (ver `lib/notifications/whatsapp.ts`) |
| `WHATSAPP_API_TOKEN` | server | Token de auth do provedor WhatsApp |

> **Segurança**: `SUPABASE_SERVICE_ROLE_KEY` e `NEXTAUTH_SECRET` são server-only. Nunca use em Client Components nem exponha ao browser.

---

## ▶️ Rodando o app

```bash
pnpm dev              # servidor de desenvolvimento (http://localhost:3000)
pnpm build            # build de produção
pnpm start            # servir o build de produção
pnpm prisma:studio    # abrir o Prisma Studio (inspecionar o banco)
```

---

## 🧪 Quality Gates

Todos os gates devem passar antes de mergear na `main`:

```bash
pnpm tsc --noEmit   # Gate 1: zero erros de TypeScript (strict mode)
pnpm lint           # Gate 2: nenhum erro de ESLint
pnpm test           # Gate 3: Vitest unit tests (lib/finance, lib/utils)
pnpm test:e2e       # Gate 5: Playwright E2E incl. snapshot mobile 375px
```

---

## 📁 Estrutura do projeto

```
fretagro-web/
├── app/                   # Next.js App Router: páginas e API routes
│   ├── (auth)/            # Páginas públicas (login, cadastro, recuperar-senha)
│   ├── (dashboard)/       # Páginas protegidas do dashboard
│   └── api/               # REST API route handlers
├── components/            # Componentes React (UI primitives + módulos de feature)
├── hooks/                 # React hooks (data fetching, state)
├── lib/                   # Lógica de negócio e utilidades
│   ├── api/               # Helpers de API (errors, pagination, tenant guard, validate)
│   ├── auth/              # Config Next-Auth, schemas Zod
│   ├── caixa/             # Lógica de fluxo de caixa
│   ├── db/                # Singleton Prisma + clients Supabase
│   ├── finance/           # Cálculos financeiros (centavos, fórmula de acerto)
│   ├── fleet/             # Regras de frota/caminhão/motorista
│   ├── fretes/            # Schemas e lógica de fretes
│   ├── notifications/     # Módulo de notificação WhatsApp
│   ├── pdf/               # Geração de comprovantes em PDF
│   ├── storage/           # Helpers do Supabase Storage
│   └── utils/             # Utilidades (masks, validators, chartColors)
├── prisma/
│   ├── schema.prisma      # Schema do banco
│   ├── migrations/        # Histórico de migrations
│   └── rls-policies.sql   # Políticas de Row-Level Security
├── types/                 # Tipos TS compartilhados e enums de domínio
└── e2e/                   # Testes E2E Playwright
```

---

## 🏛 Princípios de arquitetura

1. **Disciplina de camadas** — `types/` → `lib/` → `hooks/` → `components/` → `app/` (unidirecional)
2. **Server Components por padrão** — `"use client"` exige comentário justificando
3. **Design tokens** — sem hex hardcoded fora de `tailwind.config.ts`, `design-system/tokens.ts` e `lib/utils/chartColors.ts`
4. **Centavos inteiros** — todo valor monetário é `Int` (centavos); conversão para reais só em `lib/finance/formatMoeda.ts`
5. **1 caminhão = 1 motorista ativo** — no DB (`Caminhao.motoristaId @unique`) e na camada lib
6. **Isolamento multi-tenant** — RLS do Supabase + guard `lib/api/tenant.ts`; recursos escopados por `frotaId`
7. **Paginação server-side** — listas > 50 linhas usam `parsePagination` / `buildPaginatedResponse` de `lib/api/pagination.ts` (cap: 50)

---

## 🗄 Banco de dados & multi-tenancy

- **Prisma** é a fonte de verdade do schema (`prisma/schema.prisma`); migrations em `prisma/migrations/`.
- Os modelos `TrechoKm` e `Abastecimento` são **escritos exclusivamente pelo app mobile** e apenas lidos aqui.
- **Row-Level Security** (`prisma/rls-policies.sql`) garante que uma frota nunca veja dados de outra — reaplique após criar novas tabelas.
- Use `DIRECT_URL` (porta 5432) para `prisma migrate` e `DATABASE_URL` (PgBouncer, 6543) em runtime.

---

## 🎨 Design System

Veja [`../design-system/DESIGN_SYSTEM.md`](../design-system/DESIGN_SYSTEM.md) para a referência completa (tokens de cor, tipografia, espaçamento, componentes, tema dark).

Arquivos de tokens:
- **CSS variables**: `design-system/tokens.css`
- **TypeScript**: `design-system/tokens.ts`
- **Tema Tailwind**: `fretagro-web/tailwind.config.ts`
- **Cores de gráfico**: `fretagro-web/lib/utils/chartColors.ts` (tokens SVG do Recharts)

Setup do Shadcn/UI documentado em [`SHADCN_SETUP.md`](SHADCN_SETUP.md).

---

## 🚢 Deploy

O deploy alvo é a **Vercel**:

1. Conecte o repositório e defina o **root directory** como `fretagro-web`.
2. Configure todas as variáveis de ambiente (seção acima) no painel da Vercel.
3. Build command: `pnpm build` · Install command: `pnpm install` (na raiz do workspace).
4. Garanta que as migrations e as políticas de RLS já foram aplicadas no Supabase de produção.

---

## 🩺 Troubleshooting

| Sintoma | Causa provável | Solução |
|---------|----------------|---------|
| `@fretagro/types` não resolve | `pnpm install` rodado só na pasta web | Rode `pnpm install` na **raiz** do monorepo |
| `prisma migrate` falha na conexão | Usando a URL com PgBouncer | Use a `DIRECT_URL` (porta 5432) para migrations |
| Dados de outra frota aparecem | RLS não aplicada em tabela nova | Reaplique `prisma/rls-policies.sql` |
| `NEXTAUTH_SECRET` ausente em produção | Env não configurada | Gere com `openssl rand -base64 32` e configure na Vercel |
| Snapshot E2E mobile falha | Mudança visual em 375px | Revise o layout e atualize o snapshot do Playwright |

---

## 📐 Cenários de validação

Veja [`../specs/001-frete-agro-saas/quickstart.md`](../specs/001-frete-agro-saas/quickstart.md) para os cenários end-to-end V1–V7 cobrindo todas as user stories.

---

## 🔗 Referências

- [README raiz do monorepo](../README.md)
- [App mobile do motorista](../fretagro-mobile/README.md)
- [Especificação da plataforma](../specs/001-frete-agro-saas/spec.md) · [Quickstart](../specs/001-frete-agro-saas/quickstart.md)
- [Design System](../design-system/DESIGN_SYSTEM.md)
