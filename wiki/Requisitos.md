# Requisitos

Esta página apresenta as **histórias de usuário** (requisitos funcionais), os **requisitos não-funcionais** e o **status de entrega** de cada história do FreteAgro.

O projeto foi especificado seguindo o fluxo **Spec-Kit**, dividido em duas especificações:

- **`specs/001-frete-agro-saas/`** — plataforma web (dono da frota) — 7 histórias (P1–P7)
- **`specs/002-fretagro-mobile/`** — app do motorista — 8 histórias (P1–P8)

As prioridades são numeradas por ordem de dependência e valor de negócio (P1 = mais crítico).

---

## 1. Histórias de Usuário — Plataforma Web (`fretagro-web`)

> Formato: *"Como \<papel\>, quero \<objetivo\> para \<benefício\>."*

### US-W1 — Autenticação e Onboarding `P1` 🎯 MVP

> **Como** dono de frota, **quero** me cadastrar, fazer login e ser guiado nos primeiros passos, **para** começar a usar o sistema sem abandono; e **como** motorista, **quero** ativar minha conta por convite de WhatsApp, **para** acessar o app sem me registrar do zero.

**Critérios de aceite (resumo):** cadastro de dono (nome, e-mail único, WhatsApp, senha, nome da frota, estado); login por perfil; recuperação de senha por e-mail; convite do motorista via WhatsApp; rotas protegidas redirecionam para login; tela de boas-vindas guiada no primeiro acesso.

**Requisitos cobertos:** FR-001 a FR-008, FR-014.

---

### US-W2 — Gestão da Frota (caminhões e motoristas) `P2`

> **Como** dono de frota, **quero** cadastrar caminhões e motoristas e vincular exatamente um motorista a cada caminhão, **para** organizar minha frota digitalmente sem perder histórico.

**Critérios de aceite (resumo):** cadastro de caminhão (placa, modelo, carroceria); cadastro de motorista (nome, WhatsApp, % de comissão) com convite automático; vínculo **1 caminhão = 1 motorista** (tentativa de vínculo duplo é bloqueada); edição e inativação (soft-delete) preservando histórico; alerta de caminhão sem motorista.

**Requisitos cobertos:** FR-009 a FR-013, FR-015.

---

### US-W3 — Registro de Fretes `P3`

> **Como** dono de frota, **quero** registrar viagens com dados operacionais e lançar despesas com comprovante fotográfico, **para** substituir o papel na cabine e a planilha.

**Critérios de aceite (resumo):** registro de frete (origem, destino, tipo de carga, caminhão, motorista, km inicial/final, valor bruto); lançamento de despesas por categoria com foto da nota; ciclo de status (em andamento → concluído → acerto pendente → acerto realizado); filtros por período/motorista/status/rota; soft-delete de fretes com vínculo financeiro.

**Requisitos cobertos:** FR-016 a FR-020.

---

### US-W4 — Acerto Financeiro com Motorista `P4` ⭐ Diferencial

> **Como** dono de frota, **quero** calcular automaticamente o valor devido ao motorista, lançar deduções e gerar comprovante em PDF, **para** eliminar o cálculo manual e os conflitos do acerto.

**Critérios de aceite (resumo):** comissão calculada como `valor bruto × percentual`; lançamento de deduções (vales, adiantamentos, despesas de oficina); resumo com detalhamento e saldo líquido; confirmação altera status para "acerto realizado"; geração de comprovante em PDF; histórico por motorista.

**Requisitos cobertos:** FR-021 a FR-028.

---

### US-W5 — Caixa da Frota `P5`

> **Como** dono de frota, **quero** ver o extrato financeiro completo (entradas e saídas por categoria) e o lucro líquido do período, **para** saber se a frota está dando lucro.

**Critérios de aceite (resumo):** extrato consolidado com entradas (fretes) e saídas por categoria; lançamento de saídas avulsas; lucro líquido real (receitas − despesas); composição de despesas por categoria com % sobre o total.

**Requisitos cobertos:** FR-029 a FR-032.

---

### US-W6 — Dashboard e Relatórios `P6`

> **Como** dono de frota, **quero** ver KPIs e gráficos consolidados e exportar relatórios, **para** decidir sobre a frota com base em evidências.

**Critérios de aceite (resumo):** KPIs do período (receita bruta, total de fretes, despesas, lucro líquido); gráficos de receita vs. despesa e composição de despesas; alertas (acertos pendentes, caminhões sem motorista); filtro de período; exportação em PDF e Excel.

**Requisitos cobertos:** FR-033 a FR-036.

---

### US-W7 — Suporte de API ao App do Motorista `P7`

> **Como** motorista, **quero** que meus registros de campo cheguem ao painel do dono, **para** que a entrada de dados deixe de ser manual.

**Critérios de aceite (resumo):** contratos de API consumidos pelo app mobile; modelos `TrechoKm` e `Abastecimento` escritos exclusivamente pelo mobile e lidos pela web; sincronização visível no painel do dono.

**Requisitos cobertos:** FR-037 a FR-041 (lado servidor).

---

## 2. Histórias de Usuário — App Mobile (`fretagro-mobile`)

### US-M1 — Ativação de Conta e Login `P1` 🎯 MVP

> **Como** motorista, **quero** ativar minha conta pelo link de convite do WhatsApp e permanecer logado, **para** acessar o app rapidamente sem me registrar.

**Critérios de aceite (resumo):** ativação por deep link com definição de senha; sessão persistente entre reinícios; nome da frota exibido na tela de login; erro em senha incorreta; logout no perfil; **sem auto-registro**.

**Requisitos cobertos:** FR-001 a FR-004 (mobile).

---

### US-M2 — Registrar Viagem Completa (início → trechos → encerramento) `P2`

> **Como** motorista, **quero** iniciar a viagem, registrar o km em cada waypoint e encerrar com resumo, **para** substituir o papel e o WhatsApp.

**Critérios de aceite (resumo):** início com origem, destino, tipo de carga, km inicial e valor bruto (da Carta Frete, opcional); caminhão pré-preenchido do perfil; cálculo automático de `km_rodado` por trecho; `media_consumo` quando há abastecimento de diesel; resumo antes de encerrar; **imutabilidade** de trechos e viagens encerradas; restauração do estado ativo após force-close; bloqueio de segunda viagem simultânea; bloqueio se não houver caminhão vinculado.

**Requisitos cobertos:** FR-008 a FR-017 (mobile).

---

### US-M3 — Registrar Despesas Durante a Viagem `P3`

> **Como** motorista, **quero** lançar abastecimentos e despesas gerais com foto, **para** dar visibilidade de custos ao dono sem o álbum do WhatsApp.

**Critérios de aceite (resumo):** abastecimento de diesel/Arla com `valor = litros × preço/litro` (cálculo automático, entrada manual proibida); despesas gerais (borracharia, pátio, pedágio); foto da nota comprimida e opcional; lista de despesas com total corrente; validação de litros/preço > 0.

**Requisitos cobertos:** FR-018 a FR-025 (mobile).

---

### US-M4 — Operação Offline e Sincronização Automática `P4` ⭐ Restrição central

> **Como** motorista em campo sem sinal, **quero** que todas as ações funcionem offline e sincronizem sozinhas ao reconectar, **para** não perder dados nem depender de internet.

**Critérios de aceite (resumo):** iniciar viagem, avançar trecho e lançar despesa funcionam em modo avião; dados salvos localmente (MMKV) imediatamente; indicador offline permanentemente visível; sincronização automática ao reconectar (sem ação manual); tela de itens pendentes; resolução de conflito **last-write-wins** por timestamp.

**Requisitos cobertos:** FR-026 a FR-028 (mobile).

---

### US-M5 — Histórico de Viagens `P5`

> **Como** motorista, **quero** consultar minhas viagens passadas com detalhes, **para** ter registro em caso de disputa.

**Critérios de aceite (resumo):** lista de viagens encerradas (data, rota, status do acerto); detalhe com todos os trechos e despesas (valores e fotos); acerto vinculado quando houver.

**Requisitos cobertos:** FR-029, FR-030 (mobile).

---

### US-M6 — Meu Acerto (resumo financeiro) `P6`

> **Como** motorista, **quero** ver meu saldo pendente e o histórico de acertos, **para** não precisar ligar para o dono a cada dúvida.

**Critérios de aceite (resumo):** saldo pendente (comissão, deduções, líquido a receber); histórico de acertos realizados com data e valor; comprovante visualizável; **dados somente-leitura** no app (edição é exclusiva da web).

**Requisitos cobertos:** FR-031 a FR-034 (mobile).

---

### US-M7 — Home: Viagem Ativa e Status `P7`

> **Como** motorista, **quero** ver na home se há viagem ativa, meu saldo e o status de conexão, **para** reduzir passos de navegação.

**Critérios de aceite (resumo):** banner de viagem ativa com atalho "Continuar"; estado vazio com CTA "Iniciar viagem"; indicador offline; saldo pendente visível sem navegar.

**Requisitos cobertos:** FR-005 a FR-007 (mobile).

---

### US-M8 — Perfil do Motorista `P8`

> **Como** motorista, **quero** ver meus dados cadastrais e sair do app, **para** confirmar que estão corretos.

**Critérios de aceite (resumo):** exibe nome, WhatsApp, caminhão (placa + modelo) e % de comissão; botão de logout.

**Requisitos cobertos:** FR-035, FR-036 (mobile).

---

## 3. Status de Entrega das Histórias

Legenda: ✅ Entregue · 🟡 Parcial · ⛔ Não entregue

### Plataforma Web

| ID | História | Prioridade | Entregue? | Evidência |
|----|----------|:---------:|:--------:|-----------|
| US-W1 | Autenticação e Onboarding | P1 | ✅ | `app/(auth)/*`, `lib/auth/`, E2E `e2e/auth.spec.ts` |
| US-W2 | Gestão da Frota | P2 | ✅ | `app/(dashboard)/frota/`, `lib/fleet/`, E2E `e2e/frota.spec.ts` |
| US-W3 | Registro de Fretes | P3 | ✅ | `app/(dashboard)/fretes/`, E2E `e2e/fretes.spec.ts` |
| US-W4 | Acerto Financeiro | P4 | ✅ | `lib/finance/calcularAcerto.ts`, `app/(dashboard)/acertos/`, E2E `e2e/acertos.spec.ts` |
| US-W5 | Caixa da Frota | P5 | ✅ | `lib/caixa/`, `app/(dashboard)/caixa/`, E2E `e2e/caixa.spec.ts` |
| US-W6 | Dashboard e Relatórios | P6 | ✅ | `app/(dashboard)/page.tsx`, `lib/excel/`, E2E `e2e/dashboard.spec.ts` |
| US-W7 | Suporte de API ao Mobile | P7 | ✅ | `app/api/*`, modelos `TrechoKm`/`Abastecimento`, E2E `e2e/mobile-sync.spec.ts` |

**Todas as 7 histórias da web foram entregues** — as 101 tarefas da `specs/001-frete-agro-saas/tasks.md` estão concluídas.

### App Mobile

| ID | História | Prioridade | Entregue? | Evidência |
|----|----------|:---------:|:--------:|-----------|
| US-M1 | Ativação de Conta e Login | P1 | ✅ | `app/(auth)/`, `lib/auth/mobileAuth.ts` |
| US-M2 | Registrar Viagem Completa | P2 | ✅ | `app/(app)/viagem/`, `lib/viagem/`, `store/viagemStore.ts` |
| US-M3 | Registrar Despesas | P3 | ✅ | `app/(app)/despesas/`, `lib/camera/capturarNota.ts` |
| US-M4 | Offline e Sincronização | P4 | ✅ | `lib/sync/`, `lib/storage/`, `hooks/useSync.ts`, `useConectividade.ts` |
| US-M5 | Histórico de Viagens | P5 | ✅ | `app/(app)/historico/` |
| US-M6 | Meu Acerto | P6 | ✅ | `app/(app)/acerto/`, `hooks/useAcerto.ts` |
| US-M7 | Home: Viagem Ativa | P7 | ✅ | `app/(app)/index.tsx` |
| US-M8 | Perfil do Motorista | P8 | ✅ | `app/(app)/perfil.tsx` |

**Todas as 8 histórias do mobile foram entregues** — as 68 tarefas da `specs/002-fretagro-mobile/tasks.md` estão concluídas.

> **Resumo de entrega:** **15 de 15 histórias entregues (100%)**. Nenhuma história ficou fora do escopo. Detalhes sobre o que foi planejado × executado estão em [Gestão do Projeto](Gestão-do-Projeto).

---

## 4. Requisitos Não-Funcionais (RNF)

Os requisitos não-funcionais foram derivados das seções *Success Criteria*, *Assumptions* e das restrições de arquitetura (constituição do projeto) das especificações.

### 4.1 Precisão e Integridade Financeira

| ID | Requisito | Origem |
|----|-----------|--------|
| RNF-01 | Todo valor monetário é armazenado como **inteiro em centavos**; conversão para reais ocorre apenas na camada de exibição (`formatMoeda.ts`). | Constituição |
| RNF-02 | O cálculo do acerto é **exato**: único arredondamento permitido é `valorComissao = Math.round(valorBruto × percentual / 100)`; `saldoFinal` não sofre arredondamento adicional (SC-002). | FR-021 |
| RNF-03 | O total de abastecimento é **sempre calculado** (`litros × preço/litro`), nunca digitado manualmente. | FR-019 |

### 4.2 Segurança e Isolamento (Multi-tenancy)

| ID | Requisito | Origem |
|----|-----------|--------|
| RNF-04 | Isolamento total entre frotas: **zero acesso cruzado** garantido por **Row-Level Security (RLS)** no Postgres + guards em `lib/` (SC-008). | FR-008 |
| RNF-05 | Rotas autenticadas protegidas; sessão inválida/expirada redireciona para login (web) ou tela de login (mobile). | FR-004 |
| RNF-06 | Token de autenticação do motorista armazenado **apenas** em `expo-secure-store` (SecureStore). | Constituição M |
| RNF-07 | Permissão de câmera solicitada **on-demand** (ao tocar "Foto da nota"), nunca no launch do app. | FR-024 |

### 4.3 Disponibilidade Offline e Sincronização

| ID | Requisito | Origem |
|----|-----------|--------|
| RNF-08 | Todas as ações de escrita do motorista funcionam **100% offline** (MMKV persiste antes de qualquer chamada de rede). | FR-026 |
| RNF-09 | Sincronização **automática** ao reconectar, sem ação manual; conflitos resolvidos por **last-write-wins** (timestamp). | FR-027 |
| RNF-10 | Dados registrados offline aparecem no painel do dono em **até 30 s** após reconexão (SC-003 / SC-004). | SC |
| RNF-11 | Trechos e viagens encerradas são **imutáveis** (100% de enforcement) (SC-007). | FR-014, FR-015 |

### 4.4 Desempenho

| ID | Requisito | Origem |
|----|-----------|--------|
| RNF-12 | Dashboard renderiza KPIs em **< 3 s** para frotas de até 50 caminhões e 12 meses de histórico (SC-005). | SC-005 |
| RNF-13 | Comprovante em PDF gerado em **< 10 s** após confirmação do acerto (SC-006). | SC-006 |
| RNF-14 | Home do app exibe saldo pendente em **< 2 s**, mesmo offline (SC-009). | SC-009 |
| RNF-15 | Suporta frotas de **até 200 caminhões** sem degradação perceptível; listas > 50 linhas paginadas no servidor. | Assumptions |

### 4.5 Usabilidade e Acessibilidade

| ID | Requisito | Origem |
|----|-----------|--------|
| RNF-16 | Fluxo completo (frete + despesas + acerto) executável em **< 5 min** sem planilha/WhatsApp (SC-001). | SC-001 |
| RNF-17 | Registro de despesa com foto no app em **< 90 s** (SC-006 mobile). | SC |
| RNF-18 | Contraste **WCAG AA**; alvos de toque **≥ 44 px** no mobile. | Constituição |
| RNF-19 | Painel web responsivo a partir de **375 px**; fluxo principal otimizado para desktop. | Assumptions |

### 4.6 Compatibilidade e Manutenibilidade

| ID | Requisito | Origem |
|----|-----------|--------|
| RNF-20 | App suporta **Android 8.0+** e **iOS 14.0+** (>95% dos smartphones no Brasil) (SC-010). | SC-010 |
| RNF-21 | **TypeScript strict** em web, mobile e pacote compartilhado; zero erros de tipo como quality gate. | Constituição |
| RNF-22 | Arquitetura em camadas com fluxo de dependência unidirecional: `types → lib → hooks → components → app`. | Constituição |
| RNF-23 | Nenhuma cor hexadecimal fora dos arquivos de **design tokens** (fonte única de verdade visual). | Constituição |
| RNF-24 | Lógica de negócio compartilhada centralizada em `@fretagro/types` (zero duplicação entre web e mobile). | Constituição |

---

## 5. Fora de Escopo (v1)

Definido explicitamente nas *Assumptions* das specs:

- Integração com **rastreamento GPS** de veículos (km é manual).
- **Processamento de pagamentos** (o sistema é de controle/comprovação; a transferência ocorre fora — PIX, dinheiro).
- **Migração automática** de dados legados (Excel anterior).
- Integração direta com **sistemas contábeis/ERP**.
- **iOS** como plataforma primária (Android é o alvo v1; iOS é Fase 2).
- Múltiplos acertos parciais por frete (um acerto por frete).
