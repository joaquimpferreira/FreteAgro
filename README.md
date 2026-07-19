<div align="center">

# 🚜 FreteAgro

**Plataforma SaaS para gestão operacional e financeira de frotas de transporte agrícola.**

Painel web para o dono da frota + aplicativo mobile para o motorista de campo, com sincronização automática entre os dois.

[![Node](https://img.shields.io/badge/node-%E2%89%A520_LTS-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![pnpm](https://img.shields.io/badge/pnpm-%E2%89%A59-F69220?logo=pnpm&logoColor=white)](https://pnpm.io)
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=next.js&logoColor=white)](https://nextjs.org)
[![Expo](https://img.shields.io/badge/Expo-SDK_51-000020?logo=expo&logoColor=white)](https://expo.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)

</div>

---

## 📖 Sobre o projeto

Donos de frota de caminhões que transportam cargas agrícolas (grãos, óleo de soja, farelo, fertilizantes) controlam viagens, despesas e pagamentos de motoristas em **planilhas Excel e grupos de WhatsApp**. O acerto financeiro com o motorista — que recebe um percentual do frete, com deduções de vales, adiantamentos e despesas — é feito manualmente, gerando conflitos e erros.

O **FreteAgro** digitaliza e centraliza esse controle em duas frentes que compartilham a mesma base de dados:

| Aplicação | Público | Função |
|-----------|---------|--------|
| **`fretagro-web`** | Dono da frota | Painel de gestão: frota, fretes, acertos, caixa, dashboard e relatórios |
| **`fretagro-mobile`** | Motorista de campo | App offline-first: iniciar viagens, registrar trechos/km, lançar despesas e abastecimentos, consultar saldo |

O motorista trabalha **100% offline**; os dados são sincronizados com o Supabase automaticamente quando a conectividade é restaurada.

---

## 🧱 Arquitetura do monorepo

Este é um monorepo gerenciado com **pnpm workspaces**.

```
frete-agro/
├── fretagro-web/          # Painel web — Next.js 14 (App Router)
├── fretagro-mobile/       # App do motorista — React Native / Expo SDK 51
├── packages/
│   └── shared/            # @fretagro/types — contratos TS + regras financeiras compartilhadas
├── design-system/         # Design tokens (Rayna UI v1.0) — CSS + TS + docs
├── specs/                 # Especificações Spec-Kit (001 web, 002 mobile)
├── pnpm-workspace.yaml
└── package.json           # Raiz (private, packageManager: pnpm@9.15.0)
```

### Pacote compartilhado `@fretagro/types`

`packages/shared` é um pacote TypeScript **zero-dependency** consumido por web **e** mobile. Ele centraliza:

- **Tipos de domínio** (`types/`): `frota`, `frete`, `viagem` (`TrechoKm`, `Abastecimento`, `ViagemAtiva`), `acerto`, `auth`.
- **Regras financeiras** (`lib/finance/calcularAcerto.ts`): a fórmula de acerto vive aqui e é usada pela web (escrita) e lida pelo mobile (somente leitura), garantindo uma única fonte de verdade.

> **Fluxo de dados chave:** os modelos `TrechoKm` e `Abastecimento` são escritos **exclusivamente pelo app mobile** e lidos pelo painel web. A gestão de frota (motoristas, caminhões, acertos) é **exclusiva do painel web**.

---

## 🗺️ Stack tecnológica

| Camada | Web (`fretagro-web`) | Mobile (`fretagro-mobile`) |
|--------|----------------------|-----------------------------|
| Framework | Next.js 14 (App Router) | Expo SDK 51 + Expo Router v3 |
| Linguagem | TypeScript strict | TypeScript strict |
| UI | Tailwind CSS + Shadcn/UI | NativeWind v4 (Tailwind p/ RN) |
| Estado | React Server Components + hooks | Zustand + MMKV (offline) |
| Dados | Prisma ORM → Supabase Postgres | Supabase JS Client + MMKV |
| Auth | Next-Auth v5 (bridge Supabase Auth) | Supabase Auth + expo-secure-store |
| Testes | Vitest + Playwright | Jest + React Native Testing Library |
| Deploy | Vercel | EAS Build (Android) |

Ambos usam o mesmo projeto **Supabase** (PostgreSQL + Auth + Storage) com isolamento multi-tenant via **Row-Level Security**.

---

## 🚀 Início rápido

### Pré-requisitos

- **Node.js** ≥ 20 LTS
- **pnpm** ≥ 9 — `corepack enable && corepack prepare pnpm@latest --activate`
- Um projeto **[Supabase](https://supabase.com)** (URL + anon key + service role key)
- Para o mobile: **Android Studio** (emulador/AVD API 33+) ou dispositivo físico com depuração USB

### 1. Clonar e instalar (na raiz)

```bash
git clone <repo-url> frete-agro
cd frete-agro
pnpm install          # instala as dependências de TODOS os pacotes do workspace
```

> O `pnpm install` na raiz é obrigatório: ele resolve o link `workspace:*` do `@fretagro/types` para web e mobile.

### 2. Escolha o que rodar

| Quero rodar... | Vá para |
|----------------|---------|
| O painel web | [`fretagro-web/README.md`](fretagro-web/README.md) |
| O app mobile | [`fretagro-mobile/README.md`](fretagro-mobile/README.md) |

Cada pacote tem seu próprio README com instruções detalhadas de ambiente, variáveis e execução.

---

## 🧪 Qualidade

Cada pacote define seus próprios _quality gates_. Resumo:

```bash
# Web
pnpm --filter fretagro-web tsc        # zero erros de tipo (strict)
pnpm --filter fretagro-web lint       # ESLint
pnpm --filter fretagro-web test       # Vitest (unit)
pnpm --filter fretagro-web test:e2e   # Playwright (E2E + 375px mobile)

# Mobile
pnpm --filter fretagro-mobile tsc     # zero erros de tipo (strict)
pnpm --filter fretagro-mobile test    # Jest + RN Testing Library

# Shared
pnpm --filter @fretagro/types test    # regras financeiras
```

---

## 🎨 Design System

O design system (**Rayna UI v1.0**) é compartilhado e documentado em [`design-system/DESIGN_SYSTEM.md`](design-system/DESIGN_SYSTEM.md).

- **CSS variables:** `design-system/tokens.css`
- **TypeScript:** `design-system/tokens.ts`
- Tema **dark** em ambas as aplicações; nenhuma cor hexadecimal fora dos arquivos de tokens.

---

## 📐 Especificações

O projeto segue o fluxo **Spec-Kit**. As especificações completas (user stories, plano, data model, contratos, tarefas) estão em:

- [`specs/001-frete-agro-saas/`](specs/001-frete-agro-saas/) — plataforma web
- [`specs/002-fretagro-mobile/`](specs/002-fretagro-mobile/) — app do motorista

---

## 📄 Licença

Projeto privado. Todos os direitos reservados.
