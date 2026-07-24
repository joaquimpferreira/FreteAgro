<div align="center">

# 🚜 FreteAgro — Wiki do Projeto

**Plataforma SaaS para gestão operacional e financeira de frotas de transporte agrícola.**

Painel web para o dono da frota + aplicativo mobile para o motorista de campo, com sincronização automática offline-first entre os dois.

</div>

---

> 📌 **Sobre esta Wiki.** Enquanto o [`README.md`](https://github.com/) do repositório é o **guia técnico de execução** (como instalar, rodar e contribuir), esta Wiki é a **documentação de engenharia e de gestão do projeto**: motivação, requisitos, metodologia, arquitetura, testes, DevOps e lições aprendidas. Os dois documentos são complementares e têm propósitos diferentes.

## 🧭 Navegação

| Página | Conteúdo |
|--------|----------|
| **[Introdução (Home)](Home)** | Visão geral, motivação e telas do sistema |
| **[Requisitos](Requisitos)** | Histórias de usuário, requisitos não-funcionais e status de entrega |
| **[Gestão do Projeto](Gestão-do-Projeto)** | Metodologia, papéis, números do projeto, backlog e burndown |
| **[Análise e Projeto do Software](Análise-e-Projeto-do-Software)** | Arquitetura, componentes, diagramas e propriedades de projeto |
| **[Testes e Qualidade](Testes-e-Qualidade)** | Estratégia de testes, ferramentas e cobertura |
| **[DevOps](DevOps)** | Implantação, entrega contínua e práticas de CI/CD |
| **[Conclusão](Conclusão)** | Lições aprendidas e dificuldades encontradas |

---

## 📖 O que é o FreteAgro

O **FreteAgro** é uma plataforma **SaaS multi-tenant** que digitaliza e centraliza o controle operacional e financeiro de frotas de caminhões que transportam cargas agrícolas — grãos, óleo de soja, farelo, fertilizantes e similares — no Brasil.

O sistema é composto por **duas aplicações que compartilham a mesma base de dados**:

| Aplicação | Público | O que faz |
|-----------|---------|-----------|
| **`fretagro-web`** | Dono da frota | Painel de gestão: cadastro de frota, registro de fretes, acerto financeiro com o motorista, caixa da frota, dashboard e relatórios (PDF/Excel). |
| **`fretagro-mobile`** | Motorista de campo | App **offline-first**: iniciar viagens, registrar trechos/km, lançar despesas e abastecimentos com foto, consultar saldo e acertos. |

O motorista trabalha **100% offline**; os dados são sincronizados automaticamente com o backend (Supabase) assim que a conectividade é restabelecida — o dono vê os dados no painel web em segundos.

### O problema que resolvemos

Donos de frota controlam hoje viagens, despesas e pagamentos de motoristas em **planilhas Excel e grupos de WhatsApp**. O acerto financeiro com o motorista — que recebe um percentual do frete, com deduções de vales, adiantamentos e despesas — é feito **manualmente, de cabeça ou no papel**, gerando conflitos, erros de conta e nenhuma visão em tempo real da saúde financeira da frota.

### A solução em uma frase

> Substituir o Excel + WhatsApp + papel na cabine por um fluxo digital único: **o motorista registra a viagem no celular (mesmo sem sinal) → o dono acompanha, faz o acerto com cálculo automático e emite o comprovante em PDF.**

---

## 💡 Motivação — por que desenvolvemos este software

A escolha do FreteAgro como tema de projeto foi motivada por três fatores:

1. **Dor real e não atendida.** O transporte rodoviário de cargas agrícolas é um setor gigante no Brasil, mas a gestão da pequena e média frota ainda é feita em ferramentas genéricas (Excel, WhatsApp) que não conversam entre si. A dor do **acerto financeiro manual** — fonte de conflito entre dono e motorista — é concreta, recorrente e cara.

2. **Desafio técnico rico e completo.** O domínio exige resolver problemas de engenharia interessantes e diversos em um único produto: **multi-tenancy** com isolamento de dados, **aritmética financeira exata** (centavos inteiros, sem erro de arredondamento), **arquitetura offline-first** com sincronização automática e resolução de conflitos, e um **monorepo** com contratos de tipos compartilhados entre web e mobile.

3. **Produto de ponta a ponta.** Permite exercitar o ciclo completo de engenharia de software — da especificação (Spec-Kit) ao design de arquitetura em camadas, passando por testes automatizados, quality gates e pipeline de entrega — em duas plataformas distintas (Next.js e React Native/Expo) que compartilham lógica de negócio.

Em resumo: um problema **relevante para o usuário** combinado a um espaço técnico **desafiador o suficiente** para demonstrar boas práticas de engenharia de software.

---

## 🖼️ Telas do sistema

> 🔧 **Ação necessária:** substitua os blocos abaixo por prints reais das telas. No GitHub Wiki, faça upload das imagens (arraste para o editor) e ajuste os caminhos. Sugestão de organização em `wiki/img/`.

### Painel Web (`fretagro-web`) — Dono da frota

| Tela | Print |
|------|-------|
| **Login / Cadastro** | `![Login](img/web-login.png)` |
| **Dashboard** (KPIs, gráficos, alertas) | `![Dashboard](img/web-dashboard.png)` |
| **Gestão da Frota** (caminhões e motoristas) | `![Frota](img/web-frota.png)` |
| **Registro de Fretes** | `![Fretes](img/web-fretes.png)` |
| **Acerto Financeiro** (comissão + deduções) | `![Acerto](img/web-acerto.png)` |
| **Caixa da Frota** | `![Caixa](img/web-caixa.png)` |

### Aplicativo Mobile (`fretagro-mobile`) — Motorista

| Tela | Print |
|------|-------|
| **Home** (viagem ativa + saldo + indicador offline) | `![Home](img/mobile-home.png)` |
| **Iniciar viagem** | `![Iniciar](img/mobile-iniciar.png)` |
| **Viagem em curso** (trechos/km) | `![EmCurso](img/mobile-em-curso.png)` |
| **Abastecimento / Despesa** (com foto da nota) | `![Despesa](img/mobile-despesa.png)` |
| **Meu Acerto** (saldo e histórico) | `![Acerto](img/mobile-acerto.png)` |

---

## 🗺️ Stack tecnológica (resumo)

| Camada | Web (`fretagro-web`) | Mobile (`fretagro-mobile`) |
|--------|----------------------|-----------------------------|
| Framework | Next.js 14 (App Router) | Expo SDK 51 + Expo Router v3 |
| Linguagem | TypeScript strict | TypeScript strict |
| UI | Tailwind CSS + Shadcn/UI | NativeWind v4 |
| Estado | React Server Components + hooks | Zustand + MMKV (offline) |
| Dados | Prisma ORM → Supabase Postgres | Supabase JS Client + MMKV |
| Auth | Next-Auth v5 (bridge Supabase Auth) | Supabase Auth + expo-secure-store |
| Testes | Vitest + Playwright | Jest + React Native Testing Library |
| Deploy | Vercel | EAS Build (Android) |

Ambos consomem o mesmo projeto **Supabase** (PostgreSQL + Auth + Storage), com isolamento multi-tenant via **Row-Level Security (RLS)**. A lógica de negócio compartilhada vive no pacote `@fretagro/types` (`packages/shared`).

---

<div align="center">
<sub>FreteAgro • Projeto acadêmico de Engenharia de Software • Documentação viva mantida nesta Wiki</sub>
</div>
