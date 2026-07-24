# Conclusão

Esta página reúne as **lições aprendidas** em termos de práticas de engenharia de software e as **dificuldades** enfrentadas durante o desenvolvimento do FreteAgro.

---

## 1. Lições Aprendidas (práticas de Engenharia de Software)

### 1.1 Especificar antes de codar reduz retrabalho

O uso do **Spec-Driven Development (Spec-Kit)** — `spec → plan → tasks → implement` — provou que investir tempo em especificação **paga dividendos**. Com requisitos funcionais numerados (FR-xxx) rastreáveis até tarefas atômicas (`tasks.md`), o time evitou ambiguidade e retrabalho. Resultado prático: **100% das 15 histórias e 169 tarefas entregues**, sem cortes de escopo.

### 1.2 Arquitetura em camadas é um investimento em testabilidade

Impor o fluxo unidirecional `types → lib → hooks → components → app` manteve a **lógica de negócio isolada em `lib/`**, testável sem montar UI. Foi o que permitiu concentrar a cobertura de testes exatamente onde o risco é maior (finanças, cálculo de km, sincronização).

### 1.3 Fonte única de verdade evita bugs silenciosos

Duas decisões se destacaram:
- **Dinheiro sempre em centavos inteiros**, com conversão para reais num único lugar (`formatMoeda`). Eliminou por construção os erros de ponto flutuante — o cálculo do acerto é exato (SC-002).
- **Regra financeira compartilhada** em `@fretagro/types`, importada por web e mobile. Zero duplicação: uma mudança na fórmula se propaga automaticamente.

### 1.4 Offline-first é uma decisão de arquitetura, não um "recurso"

Tratar a rede como **opcional desde o início** (persistir em MMKV antes de qualquer chamada, enfileirar operações, sincronizar depois) foi essencial. Tentar "adicionar offline depois" teria exigido reescrever o fluxo de dados. A lição: **restrições não-funcionais críticas devem moldar a arquitetura desde o dia 1**.

### 1.5 Monorepo alinha contratos entre plataformas

Compartilhar tipos via `pnpm workspace` fez o compilador TypeScript atuar como **guardião do contrato** entre web e mobile: uma mudança em um tipo de domínio quebra o build de quem estiver desatualizado — o erro aparece em tempo de compilação, não em produção.

### 1.6 Segurança em profundidade

Garantir o isolamento entre frotas em **duas camadas independentes** (RLS no banco + guards em `lib/`) e a regra "1 caminhão = 1 motorista" tanto no schema (`@unique`) quanto na lógica, mostrou o valor da **defesa em profundidade**: se uma camada falhar, a outra ainda protege.

### 1.7 Quality Gates objetivos destravam o "pronto"

Definir *Definition of Done* como uma checklist verificável (tsc, lint, testes, E2E) removeu a subjetividade do "está pronto?". Cada história teve um **teste independente** explícito, o que facilitou revisões e a *Sprint Review*.

---

## 2. Dificuldades Encontradas

### 2.1 Acoplamento temporal entre web e mobile

A maior dificuldade foi a **dependência de ordem** entre as plataformas: a API de suporte ao mobile (US-W7) só pôde ser finalizada quando o contrato de sincronização do app estabilizou, causando um **transbordo controlado** da Sprint 1 para a Sprint 2. Antecipar os contratos compartilhados reduziu, mas não eliminou, esse acoplamento.

### 2.2 Sincronização offline e resolução de conflitos

Projetar a fila de sincronização e a estratégia **last-write-wins** por timestamp exigiu cuidado com casos de borda: formulário parcialmente preenchido ao perder conexão, mesmo registro editado offline e na web, armazenamento local criticamente baixo. Cada um virou um *edge case* explícito na spec e um teste.

### 2.3 Imutabilidade de trechos e viagens

Garantir que trechos/viagens encerradas **nunca** sejam reabertos (SC-007, 100% de enforcement) exigiu guards na camada `lib/` que lançam erro **antes** de qualquer persistência — e não apenas esconder botões na UI. Foi preciso testar explicitamente as tentativas de violação.

### 2.4 Modelagem financeira precisa

Manter tudo em centavos inteiros e definir o **único ponto de arredondamento** (comissão) foi conceitualmente simples, mas exigiu disciplina para não introduzir conversões para `float` em nenhum ponto intermediário do fluxo.

### 2.5 Complexidade de duas plataformas com um só domínio

Desenvolver simultaneamente Next.js (web) e Expo/React Native (mobile) — com ecossistemas de UI, roteamento e estado diferentes (Shadcn vs. NativeWind, App Router vs. Expo Router, RSC vs. Zustand) — aumentou a carga cognitiva. O pacote compartilhado ajudou a manter a **coerência do domínio** apesar das diferenças de plataforma.

### 2.6 Configuração de ambiente offline para testes

Reproduzir cenários de conectividade instável (modo avião, reconexão) de forma determinística nos testes do mobile foi trabalhoso, exigindo mocks de rede e de MMKV.

---

## 3. Retrospectiva — o que manter e o que melhorar

| Manter ✅ | Melhorar 🔧 |
|-----------|-------------|
| Spec-Driven Development (rastreabilidade FR → tarefa) | Automatizar os Quality Gates em CI (GitHub Actions) |
| Arquitetura em camadas + pacote compartilhado | Elevar a cobertura de testes das telas mobile |
| Dinheiro em centavos + ponto único de arredondamento | Antecipar ainda mais os contratos entre web e mobile |
| Offline-first desde o dia 1 | Adicionar monitoramento/observabilidade em produção |
| Defesa em profundidade (RLS + guards) | Formalizar E2E do mobile (Maestro) |

---

## 4. Resultado Final

O FreteAgro atingiu seu objetivo: **substituir Excel + WhatsApp + papel** por um fluxo digital único, com o motorista registrando viagens offline e o dono fazendo o acerto financeiro com **cálculo automático e exato** e comprovante em PDF. Todas as histórias planejadas foram entregues, e as decisões de arquitetura tomadas no início sustentaram a qualidade e a evolução do produto ao longo das sprints.

---

<div align="center">
<sub>← Volte para a <a href="Home">Introdução</a> · Veja a <a href="Análise-e-Projeto-do-Software">Arquitetura</a> · Consulte os <a href="Requisitos">Requisitos</a></sub>
</div>
