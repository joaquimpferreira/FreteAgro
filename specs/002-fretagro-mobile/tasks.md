---
description: "Task list for FreteAgro Mobile — App do Motorista"
---

# Tasks: FreteAgro Mobile — App do Motorista

**Input**: Design documents from `specs/002-fretagro-mobile/`

**Prerequisites**: plan.md ✅ · spec.md ✅ · research.md ✅ · data-model.md ✅ · contracts/screens.md ✅ · quickstart.md ✅

**Tests**: Unit tests required per constitution Mobile Quality Gate #3 — see Phase 12 (Unit Tests) below.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete sibling task)
- **[Story]**: Which user story this task belongs to (US1–US8)
- Exact file paths are included in every description

## Path Conventions

| Scope | Root |
|---|---|
| Monorepo config | `pnpm-workspace.yaml`, root `package.json` |
| Mobile app | `fretagro-mobile/` |
| Shared types/finance | `packages/shared/` |
| Web app | `fretagro-web/` |

---

## Phase 1: Setup (Monorepo Scaffolding)

**Purpose**: Project initialization — directory structure, package manifests, build tooling. No business logic, no UI.

- [X] T001 Initialize fretagro-mobile Expo package with package.json (Expo SDK 51 + NativeWind v4 + Zustand + MMKV + Supabase deps), app.config.ts (EXPO_PUBLIC_SUPABASE_URL/KEY env vars, deep link scheme "fretagroapp://"), and babel.config.js (babel-plugin-nativewind) in fretagro-mobile/
- [X] T002 [P] Initialize packages/shared (@fretagro/types) package with package.json (name: "@fretagro/types", private: true, zero runtime deps), tsconfig.json (strict: true), and empty types/ and lib/finance/ directories in packages/shared/
- [X] T003 Register fretagro-mobile and packages/shared as workspace packages in pnpm-workspace.yaml; add "@fretagro/types": "workspace:*" to fretagro-mobile/package.json and fretagro-web/package.json
- [X] T004 [P] Configure NativeWind v4 tailwind.config.js in fretagro-mobile/ importing color tokens from design-system/tokens.ts (background #0D0D0D, surface #161616, primary #22C55E) and set content glob to cover app/ and components/
- [X] T005 [P] Configure EAS build profiles in fretagro-mobile/eas.json: development (debug APK, internal), preview (release APK, internal), production (release APK, store); add @fretagro/types path alias to fretagro-mobile/tsconfig.json ("@fretagro/types": ["../packages/shared/types/index.ts"])

**Checkpoint**: `pnpm install` succeeds; `npx expo start --android` launches dev server; package graph resolves @fretagro/types from packages/shared.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema, shared type contracts, Supabase client, MMKV storage, business-logic guards, Zustand store, app layout skeleton, and reusable UI primitives. ALL tasks here must complete before any user story begins.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T006 Extend fretagro-web/prisma/schema.prisma with TrechoKm model (id: cuid, tipo: String "vazio"|"carregado", kmInicial: Int, kmFinal: Int?, kmRodado: Int?, ordem: Int, fechadoEm: DateTime?, freteId: String FK, frotaId: String FK, createdAt: DateTime, @@map("trechos_km")) and Abastecimento model (id: cuid, subtipo: String "diesel"|"arla", litros: Decimal, precoPorLitro: Decimal, valorTotal: Int centavos, local: String?, kmAtual: Int?, fotoUrl: String?, trechoId: String? FK optional reference to trechos_km (enables mediaDiesel calculation per FR-013 — populate with current open leg id at registration), freteId: String FK, frotaId: String FK, createdAt: DateTime, @@map("abastecimentos")); add back-relations trechos TrechoKm[] and abastecimentos Abastecimento[] to both Frete and Frota models; also confirm — and add if absent — that the existing Frete model contains: origem String, destino String, tipoCarga String, kmInicial Int, valorBruto Int (centavos); these fields are required by T040 mobile INSERT
- [X] T007 Generate Prisma migration for TrechoKm and Abastecimento by running `npx prisma migrate dev --name add_trecho_km_abastecimento` then `npx prisma generate` in fretagro-web/; confirm migration file created under fretagro-web/prisma/migrations/
- [X] T008 [P] Add RLS policies for trechos_km (frota isolation: USING (frota_id = current_setting('app.current_frota_id')::text)) and abastecimentos (same pattern) to fretagro-web/prisma/rls-policies.sql following the existing fretes/lancamentos policy structure; enable RLS on both tables
- [X] T009 Create packages/shared/types/viagem.ts exporting TrechoKm interface (id, tipo, kmInicial, kmFinal?, kmRodado?, ordem, freteId, frotaId, fechadoEm?, createdAt), Abastecimento interface (id, subtipo, litros, precoPorLitro, valorTotal centavos, local?, kmAtual?, fotoUrl?, trechoId?: string optional FK to TrechoKm — enables mediaDiesel association per FR-013, freteId, frotaId, createdAt), ViagemAtiva interface (freteId, trechos, trechoAtualIndex, despesas, abastecimentos, ultimaSincronizacao?, pendenteSincronizacao); create packages/shared/types/index.ts re-exporting all types from viagem.ts and any existing frota.ts, frete.ts, acerto.ts, auth.ts files
- [X] T010 [P] Create packages/shared/lib/finance/calcularAcerto.ts implementing valorComissao = Math.round(valorFrete × percentualComissao / 100) and saldoFinal = valorComissao − totalDeducoes (all values in centavos; saldoFinal has no additional rounding per constitution IV)
- [X] T011 Implement fretagro-mobile/lib/supabase/client.ts: configure @supabase/supabase-js v2 with a custom storage adapter backed by expo-secure-store (getItemAsync/setItemAsync/deleteItemAsync); set autoRefreshToken: true, persistSession: true; read EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY from process.env. Also create fretagro-mobile/lib/auth/mobileAuth.ts encapsulating ALL Supabase auth operations: export signIn(email: string, password: string), verifyInviteToken(token: string), setPassword(password: string), signOut(), getSession() — each delegates to the supabase client from client.ts and is the single permitted import point for auth. No app/ screen or hook may import the Supabase client directly for auth purposes (constitution M-II)
- [X] T012 [P] Implement fretagro-mobile/lib/storage/viagemStorage.ts: MMKV instance with key 'viagem_ativa'; export saveViagem(v: ViagemAtiva | null): void (JSON.stringify) and loadViagem(): ViagemAtiva | null (JSON.parse); called on every Zustand store mutation and at app hydration
- [X] T013 [P] Implement fretagro-mobile/lib/storage/queueStorage.ts: MMKV instance with key 'sync_queue'; OperacaoPendente interface (id: cuid, tipo: OperacaoTipo, payload: Record<string,unknown>, updatedAt: ISO string, tentativas: number); export enqueue, dequeueAll, peek, replaceAll; types: CREATE_VIAGEM, CREATE_TRECHO, CLOSE_TRECHO, CREATE_ABASTECIMENTO, CREATE_LANCAMENTO, CLOSE_VIAGEM
- [X] T014 Implement fretagro-mobile/lib/viagem/calcularTrecho.ts: guard kmFinal > kmInicial (throw ValidationError "km final deve ser maior que km inicial"); guard fechadoEm != null → throw ImmutabilityError; guard new leg blocked if prior open leg exists for same freteId; compute kmRodado = kmFinal − kmInicial on closure only; export fecharTrecho(trecho, kmFinal): TrechoKm
- [X] T015 [P] Implement fretagro-mobile/lib/viagem/calcularViagem.ts: kmTotalVazio = Σ kmRodado where tipo = 'vazio'; kmTotalCarregado = Σ kmRodado where tipo = 'carregado'; kmTotalViagem = kmTotalVazio + kmTotalCarregado; mediaDiesel(trecho, litrosDiesel) = trecho.kmRodado / litrosDiesel (diesel only, not arla); export all functions
- [X] T016 Implement fretagro-mobile/store/viagemStore.ts: Zustand store with ViagemAtiva | null state; mutations: iniciarViagem(params) generates a new cuid as freteId, creates the Frete record locally (origem, destino, tipoCarga, kmInicial, caminhaoId, motoristaId, frotaId, valorBruto from Carta Frete, dataInicio = now()) + opens first vazio trecho + enqueues CREATE_VIAGEM then CREATE_TRECHO; avancarTrecho(kmFinal) calls calcularTrecho.fecharTrecho + enqueues CLOSE_TRECHO; abrirNovoTrecho(tipo, kmInicial) opens next leg + enqueues CREATE_TRECHO; encerrarViagem(kmFinal) closes last leg + sets pendenteSincronizacao = true + enqueues CLOSE_TRECHO + CLOSE_VIAGEM; registrarAbastecimento computes valorTotal = Math.round(litros × precoPorLitro × 100) and automatically sets trechoId = viagem.trechos[viagem.trechoAtualIndex].id (the current open leg id — enables mediaDiesel per FR-013) + enqueues CREATE_ABASTECIMENTO; registrarDespesa enqueues CREATE_LANCAMENTO; marcarSincronizado sets pendenteSincronizacao = false; hidratarFromStorage reads viagemStorage.loadViagem(); every mutation calls viagemStorage.saveViagem after state update
- [X] T017 Create fretagro-mobile/app/_layout.tsx: call SplashScreen.preventAutoHideAsync at module level; on mount call useViagemStore.hidratarFromStorage(); hide SplashScreen after hydration; wrap tree in SafeAreaProvider; export Stack root navigator
- [X] T018 [P] Create fretagro-mobile/app/(auth)/_layout.tsx: Stack navigator for login and ativar screens; no auth guard; accessible when unauthenticated; render OfflineBanner (from components/ui/OfflineBanner.tsx) above the Stack content so the offline indicator is visible on all auth screens (FR-007 requires offline indicator on every screen)
- [X] T019 Create fretagro-mobile/app/(app)/_layout.tsx: on mount call mobileAuth.getSession() (from lib/auth/mobileAuth.ts — never import supabase client directly M-II); if no session → Redirect to /(auth)/login; Tabs navigator with four tabs: Início (index), Histórico (historico), Acerto (acerto), Perfil (perfil) with appropriate tab bar icons; add TODO comment: // TODO(T043): call useSync on mount and on AppState foreground event
- [X] T020 [P] Create fretagro-mobile/components/ui/Button.tsx, Input.tsx, Badge.tsx, Card.tsx: NativeWind v4 styled; all Pressable/TouchableOpacity have min-h-[44px]; dark theme tokens (bg-background, bg-surface, text-white, border-surface); Button supports variant (primary, secondary, destructive)
- [X] T021 [P] Create fretagro-mobile/components/ui/OfflineBanner.tsx: reads useConectividade(); when isConnected = false renders a permanently visible banner (cannot be hidden by other UI state); reads pendingCount from useSync (once available) to show "X itens pendentes de sincronização"
- [X] T022 Implement fretagro-mobile/hooks/useConectividade.ts: call Network.getNetworkStateAsync() on mount; subscribe to Network.addNetworkStateListener; return { isConnected: boolean }; cleanup listener on unmount

**Checkpoint**: App compiles with `npx tsc --noEmit`; launches on emulator; navigates to /(auth)/login when no session exists; OfflineBanner appears in airplane mode.

---

## Phase 3: User Story 1 — Account Activation & Login (Priority: P1) 🎯 MVP

**Goal**: A driver activates their account via a WhatsApp invite deep link, sets a password, logs in, and remains logged in across app restarts until explicit logout.

**Independent Test**: Open `fretagroapp://ativar?token=<JWT>` → set password → confirm fleet name on login screen → log in → close app → reopen → land on home screen without credentials. Wrong password shows inline error and creates no session.

- [X] T023 [US1] Create login screen in fretagro-mobile/app/(auth)/login.tsx: read frotaNome from AsyncStorage key 'frota_nome' (stored during account activation in T024); show frotaNome above form (falls back to empty string if not yet set); email + password inputs; call mobileAuth.signIn(email, password) (from lib/auth/mobileAuth.ts — never import supabase client directly per M-II); on success navigate to /(app)/; on error display inline error message (no session created); no self-registration path
- [X] T024 [P] [US1] Create account activation screen in fretagro-mobile/app/(auth)/ativar.tsx: read token and frotaNome from route params (both encoded by the invite deep link — frotaNome is the primary mechanism for FR-003, no unauthenticated Supabase query needed); call mobileAuth.verifyInviteToken(token) (from lib/auth/mobileAuth.ts — never import supabase client directly per M-II); on success persist frotaNome to AsyncStorage key 'frota_nome' so login.tsx can display it; show password-set form; call mobileAuth.setPassword(password); on success navigate to /(auth)/login; on expired/invalid token show error screen "Link inválido ou expirado. Solicite um novo convite ao dono da frota."
- [X] T025 [US1] Add Android deep-link intent-filter for scheme "fretagroapp" host "ativar" in fretagro-mobile/app.config.ts (intentFilters in android.intentFilters); verify deep link opens ativar.tsx with token param on emulator

**Checkpoint**: US1 fully functional — driver can activate account from invite link, log in, remain logged in on app restart, and see fleet name on login screen.

---

## Phase 4: User Story 2 — Register a Complete Trip (Priority: P2)

**Goal**: A driver starts a trip, advances through legs recording km at each waypoint, views auto-calculated leg summaries, and closes the trip. Closed trips are immutable. Active trip is restored after force-close.

**Independent Test**: Start trip (origem, destino, tipoCarga, kmInicial) → advance × 2 recording kmFinal each time → view closed-leg km_rodado values → close trip → resumo shows kmTotalVazio, kmTotalCarregado, kmTotalViagem correctly. Driver with no truck is blocked from starting.

- [X] T026 [US2] Create TrechoCard component in fretagro-mobile/components/viagem/TrechoCard.tsx: displays tipo badge (vazio|carregado), kmInicial, kmFinal, kmRodado, mediaDiesel (if available for diesel leg); closed style with muted colors to indicate immutability; used in em-curso.tsx leg history list
- [X] T027 [P] [US2] Create TrechoAtual component in fretagro-mobile/components/viagem/TrechoAtual.tsx: displays current open leg tipo + kmInicial; shows "Avançar trecho" and "Encerrar viagem" CTAs; reads current trecho from useViagemStore
- [X] T028 [P] [US2] Create ViagemResumo component in fretagro-mobile/components/viagem/ViagemResumo.tsx: lists all trechos (TrechoCard); shows kmTotalVazio, kmTotalCarregado, kmTotalViagem (from calcularViagem); shows total expenses sum; used in encerrar.tsx confirmation and resumo.tsx
- [X] T029 [US2] Create "Start Trip" screen in fretagro-mobile/app/(app)/viagem/iniciar.tsx: inputs for origem (string), destino (string), tipoCarga (enum: grao|cana|soja|outros), kmInicial (int > 0), valorBruto (optional decimal in reais, converted to centavos on submit — from Carta Frete; shows helper text "Valor da Carta Frete"; defaults to R$ 0,00 if left blank); caminhaoId pre-filled from Supabase driver profile; block with message if active trip exists (FR-010); block with message if driver has no caminhaoId (FR-009); on submit call useViagemStore.iniciarViagem → navigate to /(app)/viagem/em-curso
- [X] T030 [US2] Create "Active Trip Panel" screen in fretagro-mobile/app/(app)/viagem/em-curso.tsx: shows TrechoAtual (open leg), TrechoCard list (closed legs), running expense total (Σ despesas.valor + Σ abastecimentos.valorTotal ÷ 100), OfflineBanner, pending sync indicator (pendenteSincronizacao from store); action buttons: "Avançar trecho" → /(app)/viagem/avancar-trecho, "Encerrar viagem" → /(app)/viagem/encerrar, "Abastecer" → /(app)/despesas/abastecimento, "Despesa" → /(app)/despesas/geral; blocked if no active trip
- [X] T031 [US2] Create "Advance Leg" screen in fretagro-mobile/app/(app)/viagem/avancar-trecho.tsx: inputs: kmFinal (int, validated > current leg kmInicial with inline error), tipoProximoTrecho (vazio|carregado); on submit call useViagemStore.avancarTrecho(kmFinal) then abrirNovoTrecho(tipo, kmFinal); navigate back to /(app)/viagem/em-curso on success
- [X] T032 [US2] Create "Close Trip" screen in fretagro-mobile/app/(app)/viagem/encerrar.tsx: input: kmFinal (int) for the last open leg; validates kmFinal > current kmInicial; shows ViagemResumo confirmation screen before submit; on confirm call useViagemStore.encerrarViagem(kmFinal); navigate to /(app)/viagem/resumo on success
- [X] T033 [US2] Create "Trip Summary" screen in fretagro-mobile/app/(app)/viagem/resumo.tsx: reads closed ViagemAtiva from Zustand store; shows ViagemResumo with all trechos (kmRodado, mediaDiesel), all expenses, km totals; "Ir para histórico" → /(app)/historico, "Ir para início" → /(app)/; read-only, no edit actions

**Checkpoint**: US2 fully functional — complete 3-leg trip (base→carregamento→descarregamento→base) works offline; km_rodado correct per leg; trip is immutable once encerrada; app-force-close restores active trip from MMKV.

---

## Phase 5: User Story 3 — Register Expenses During a Trip (Priority: P3)

**Goal**: A driver records diesel/Arla refuels and general expenses during an active trip. Refuel total is computed automatically. Photos are optional and compressed. Running total is always visible.

**Independent Test**: Record diesel refuel (litros=80, preco=6.50) → valorTotal=R$520.00 shown automatically. Record Arla refuel, pedágio, borracharia with photo. Expense list shows 4 items, correct running total. Submitting litros=0 is rejected.

- [X] T034 [US3] Implement fretagro-mobile/lib/camera/capturarNota.ts: call ImagePicker.requestCameraPermissionsAsync() on-demand only (never at app launch per FR-024); launch camera via ImagePicker.launchCameraAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.7 }); resize via ImageManipulator to maxWidth=800, maxHeight=800, compress=0.7; upload compressed URI to Supabase Storage bucket 'recibos' (private); return the **storage path** (e.g. 'recibos/{frotaId}/{freteId}/{uuid}.jpg') — NOT a signed URL (signed URLs expire; storage paths are permanent and safe to store in DB); signed URLs are generated at display time by T045/T050 via supabase.storage.from('recibos').createSignedUrl(path, 3600); handle permission denied gracefully
- [X] T035 [P] [US3] Create FotoNota component in fretagro-mobile/components/despesas/FotoNota.tsx: "Foto da nota" Pressable (min-h-[44px]); on tap calls capturarNota.ts; shows compressed photo thumbnail if captured or placeholder icon if not; optional — parent form can submit without photo
- [X] T036 [P] [US3] Create DespesaItem component in fretagro-mobile/components/despesas/DespesaItem.tsx: displays expense category badge (combustivel|borracharia|pátio|pedágio), subcategory for combustivel (diesel|arla), value in reais (÷100), optional description, optional receipt photo thumbnail; non-interactive (history display only)
- [X] T037 [US3] Create fuel refuel screen in fretagro-mobile/app/(app)/despesas/abastecimento.tsx: inputs: subtipo (diesel|arla toggle), litros (decimal > 0), precoPorLitro (decimal > 0), local (optional string — posto name per FR-018; optional because driver may not know it), kmAtual (optional int — km at refuel point per FR-018; optional because driver may record later), FotoNota; compute valorTotal = Math.round(litros × precoPorLitro × 100) in real time and display in reais; reject litros ≤ 0 or precoPorLitro ≤ 0 with validation errors (FR-021); on submit call useViagemStore.registrarAbastecimento (store automatically sets trechoId from current open leg per T016, enabling mediaDiesel per FR-013); navigate back to /(app)/viagem/em-curso
- [X] T038 [US3] Create general expense screen in fretagro-mobile/app/(app)/despesas/geral.tsx: inputs: tipo (borracharia|pátio|pedágio picker), valor (int centavos, > 0), descricao (optional string), FotoNota; reject valor ≤ 0; on submit call useViagemStore.registrarDespesa; navigate back to /(app)/viagem/em-curso

**Checkpoint**: US3 fully functional — all four expense types recorded during active trip; valorTotal computed, not entered; photo compresses to ≤ 800px; running total in em-curso is correct.

---

## Phase 6: User Story 4 — Offline Operation & Automatic Sync (Priority: P4)

**Goal**: All driver write actions complete without internet. Data syncs automatically to Supabase when connectivity is restored. Offline indicator and pending count always visible.

**Independent Test**: Airplane mode → start trip, add 2 expenses, advance leg → OfflineBanner visible, pendingCount > 0 → reconnect → sync completes within 30 s → pendingCount = 0 → rows appear in Supabase trechos_km and abastecimentos tables.

- [X] T039 [US4] Implement fretagro-mobile/lib/sync/syncQueue.ts: drain OperacaoPendente[] from queueStorage in FIFO order; for each operation dispatch to syncViagem or syncDespesas based on tipo; on Supabase success dequeue the item; on failure increment tentativas; move to dead-letter (separate MMKV key 'sync_dead_letter') after tentativas ≥ 3; export drain(): Promise<void> and getPendingCount(): number; add a JSDoc block at the top of the file documenting the conflict resolution strategy (M-III requirement): CREATE operations (CREATE_VIAGEM, CREATE_TRECHO, CREATE_ABASTECIMENTO, CREATE_LANCAMENTO) use ON CONFLICT DO NOTHING — idempotent retries are safe; UPDATE operations (CLOSE_TRECHO, CLOSE_VIAGEM) are last-write because only the mobile client writes these fields; dead-letter queue captures operations failing ≥ 3 times to prevent silent data loss
- [X] T040 [P] [US4] Implement fretagro-mobile/lib/sync/syncViagem.ts: handle CREATE_VIAGEM → Supabase INSERT INTO fretes (id, frotaId, caminhaoId, motoristaId, origem, destino, tipoCarga, kmInicial, dataInicio, valorBruto, status='em_andamento') ON CONFLICT (id) DO NOTHING (prerequisite: T006 must confirm these columns exist in the Frete model before implementing); handle CREATE_TRECHO → Supabase INSERT INTO trechos_km ON CONFLICT (id) DO NOTHING; handle CLOSE_TRECHO → Supabase UPDATE trechos_km SET kmFinal, kmRodado, fechadoEm WHERE id; handle CLOSE_VIAGEM → Supabase UPDATE fretes SET status='concluido', dataFim WHERE id; all operations use payload from OperacaoPendente
- [X] T041 [P] [US4] Implement fretagro-mobile/lib/sync/syncDespesas.ts: handle CREATE_ABASTECIMENTO → Supabase INSERT INTO abastecimentos ON CONFLICT (id) DO NOTHING; handle CREATE_LANCAMENTO → Supabase INSERT INTO lancamentos ON CONFLICT (id) DO NOTHING; all operations use payload from OperacaoPendente
- [X] T042 [US4] Implement fretagro-mobile/hooks/useSync.ts: subscribe to useConectividade(); when isConnected transitions to true → call syncQueue.drain(); on drain completion call useViagemStore.marcarSincronizado(); expose pendingCount from syncQueue.getPendingCount(); export useSyncStatus() → { pendingCount, isSyncing }
- [X] T058 [P] [US4] Create pending sync list component in fretagro-mobile/components/ui/PendingSyncList.tsx: renders a FlatList of OperacaoPendente[] items obtained via queueStorage.peek() (read-only, no dequeue); each row shows operation tipo translated to PT-BR (CREATE_VIAGEM → "Nova viagem", CREATE_TRECHO → "Trecho de viagem", CREATE_ABASTECIMENTO → "Abastecimento", CREATE_LANCAMENTO → "Despesa", CLOSE_TRECHO → "Fechamento de trecho", CLOSE_VIAGEM → "Encerramento de viagem") and updatedAt as relative time; accessible via "Ver pendentes (N)" Pressable on OfflineBanner when pendingCount > 0 (opens in a Modal); fulfills FR-028 “view a list of items pending synchronization”
- [X] T043 [US4] Update fretagro-mobile/app/(app)/_layout.tsx completing the TODO placeholder left by T019: call useSync on mount and on app foreground (AppState.addEventListener('change', state → state === 'active')); pass pendingCount to OfflineBanner; wire OfflineBanner's "Ver pendentes" Pressable to open PendingSyncList (T058) in a Modal; confirm useConectividade → useSync → marcarSincronizado chain works end-to-end

**Checkpoint**: US4 fully functional — offline write → reconnect → auto-sync round-trip verified on emulator; Supabase tables receive all queued operations; OfflineBanner hides after sync completes; pendingCount reaches 0.

---

## Phase 7: User Story 5 — Trip History & Detail (Priority: P5)

**Goal**: A driver sees all their closed trips (date, route, acerto status) and can tap into the full detail: all legs with km, all expenses with values and photos.

**Independent Test**: 3 closed trips → history list shows date, origem→destino, acerto status → tap one trip → detail shows all trechos (kmRodado, tipo), all expenses/refuels with values, acerto summary if present.

- [X] T044 [US5] Create trip history screen in fretagro-mobile/app/(app)/historico/index.tsx: fetch closed Frete records for current motorista from Supabase (filtered by motoristaId, status=concluido); render FlatList with date, origem→destino route string, acerto status badge (pendente|realizado); tap row → navigate to /(app)/historico/[id]; show empty state when no closed trips
- [X] T045 [US5] Create trip detail screen in fretagro-mobile/app/(app)/historico/[id].tsx: fetch Frete + TrechoKm[] + Lancamento[] + Abastecimento[] + Acerto? for given freteId from Supabase; display all trechos with tipo badge, kmRodado, mediaDiesel (filter abastecimentos where trechoId = trecho.id and subtipo = 'diesel' per T009/T016, then compute kmRodado / litros); for each Abastecimento or Lancamento with a fotoUrl (storage path), generate a signed URL at render time via supabase.storage.from('recibos').createSignedUrl(fotoUrl, 3600) before passing to the DespesaItem photo thumbnail (storage paths are stored, never raw signed URLs — see T034); if Acerto exists and status=realizado show acerto summary (valorComissao, totalDeducoes, saldoFinal)

**Checkpoint**: US5 fully functional — history list and detail screen show correct synced data for all closed trips; acerto summary visible when present.

---

## Phase 8: User Story 6 — My Acerto: Financial Summary (Priority: P6)

**Goal**: A driver views their current pending acerto balance (commission, deductions, net receivable) and history of settled acertos with receipts. Read-only — no edits in mobile.

**Independent Test**: Open "Meu Acerto" → pending balance correct (valorComissao, totalDeducoes, saldoFinal) → tap settled acerto → receipt image visible.

- [X] T046 [US6] Implement fretagro-mobile/hooks/useAcerto.ts: fetch Acerto records for current motorista from Supabase; derive pendingBalance by summing open acertos (status=pendente: valorComissao, totalDeducoes, saldoFinal); return { pendingBalance, acertoHistory: Acerto[], loading: boolean }; data is read-only (FR-034)
- [X] T047 [P] [US6] Create SaldoCard component in fretagro-mobile/components/acerto/SaldoCard.tsx: Card displaying valorComissao (label "Comissão bruta"), totalDeducoes (label "Deduções"), saldoFinal (label "A receber", emphasized); all values displayed in reais (÷100); dark theme
- [X] T048 [P] [US6] Create AcertoItem component in fretagro-mobile/components/acerto/AcertoItem.tsx: row showing saldoFinal in reais, settlement date formatted in pt-BR, status badge (realizado green); tappable with min-h-[44px]
- [X] T049 [US6] Create acerto index screen in fretagro-mobile/app/(app)/acerto/index.tsx: shows SaldoCard with pendingBalance from useAcerto; FlatList of settled acertos using AcertoItem; tap row → /(app)/acerto/[id]; empty state when no acertos; read-only, no edit or new-acerto actions
- [X] T050 [US6] Create acerto detail screen in fretagro-mobile/app/(app)/acerto/[id].tsx: fetch full Acerto record from Supabase including comprovanteUrl (storage path in private bucket); display settlement breakdown (valorComissao, each deduction, saldoFinal); if comprovanteUrl present generate a signed URL at render time via supabase.storage.from('comprovantes').createSignedUrl(comprovanteUrl, 3600) and render receipt image using Image component (do not use comprovanteUrl directly as it is a private bucket path, not a public URL); read-only

**Checkpoint**: US6 fully functional — pending balance and acerto history correctly sourced from Supabase; receipt image displays when URL present; no write actions possible.

---

## Phase 9: User Story 7 — Home Screen: Active Trip & Status (Priority: P7)

**Goal**: The home screen entry point — active trip banner, pending acerto balance, and permanent offline indicator when offline.

**Independent Test**: With active trip → banner shows origem→destino + "Continuar" CTA. Without active trip → shows "Nenhuma viagem em andamento" + "Iniciar viagem" CTA. Pending saldoFinal visible. Airplane mode → OfflineBanner present. All within 2 s of app open (data from MMKV, not network).

- [X] T051 [US7] Implement fretagro-mobile/hooks/useViagemAtiva.ts: derives from useViagemStore: isViagemAtiva (boolean), viagemAtiva (ViagemAtiva | null), tripRoute (string "origem → destino" | null), pendenteSincronizacao (boolean); synchronous (reads Zustand store, no network); returns within 2 s because Zustand hydrates from MMKV at startup
- [X] T052 [US7] Create home screen in fretagro-mobile/app/(app)/index.tsx: reads useViagemAtiva → if active show banner with tripRoute and "Continuar" CTA (navigate to /(app)/viagem/em-curso), else show "Nenhuma viagem em andamento" and "Iniciar viagem" CTA (navigate to /(app)/viagem/iniciar); reads useAcerto().pendingBalance → show saldoFinal in reais; OfflineBanner always rendered; all data visible offline (MMKV + cached Supabase) within 2 s

**Checkpoint**: US7 fully functional — home screen reflects all three states (active trip, no trip, offline); pending balance visible without navigating to Acerto tab.

---

## Phase 10: User Story 8 — Driver Profile (Priority: P8)

**Goal**: The driver views their name, WhatsApp, linked truck, and commission rate, and can log out.

**Independent Test**: Profile screen shows nome, whatsapp, truck plate + model, percentualComissao matching web registration → tap "Sair" → confirm → login screen shown, session cleared.

- [X] T053 [US8] Create profile screen in fretagro-mobile/app/(app)/perfil.tsx: fetch authenticated Motorista record (nome, whatsapp, percentualComissao) and linked Caminhao (placa, modelo) from Supabase using session user ID; display all four fields; "Sair" Pressable (min-h-[44px], destructive style) → confirm via Alert.alert → call mobileAuth.signOut() (from lib/auth/mobileAuth.ts — never import supabase client directly per M-II) → clear Zustand store via useViagemStore.getState().hidratarFromStorage() passing null → Redirect to /(auth)/login

**Checkpoint**: US8 fully functional — profile data matches web registration; logout clears session and Zustand store; app redirects to login.

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Non-story-specific quality improvements and final validation. No new features.

- [X] T054 Add expo-haptics feedback calls (Haptics.impactAsync(Heavy) on confirm actions) in fretagro-mobile/app/(app)/viagem/iniciar.tsx (trip started), avancar-trecho.tsx (leg advanced), encerrar.tsx (trip closed), despesas/abastecimento.tsx (refuel saved), despesas/geral.tsx (expense saved)
- [X] T055 Validate FlatList performance settings on all unbounded lists: add keyExtractor, initialNumToRender={10}, maxToRenderPerBatch={5} in fretagro-mobile/app/(app)/historico/index.tsx, acerto/index.tsx, and the expense list section in viagem/em-curso.tsx
- [X] T056 Update fretagro-web to consume @fretagro/types from packages/shared: add "@fretagro/types": "workspace:*" to fretagro-web/package.json; add path alias in fretagro-web/tsconfig.json; before making changes, scan all files under fretagro-web/types/ for any existing TrechoKm, Abastecimento, or ViagemAtiva definitions — remove duplicates found (constitution M-I: redeclaring locally a type that exists in the shared package is forbidden)
- [X] T057 Final validation: run `pnpm install` from repo root; run `npx tsc --noEmit` in packages/shared and fretagro-mobile; run `npx expo start --android` and confirm app opens on login screen without errors; run `npx tsc --noEmit` in fretagro-web to confirm zero TypeScript errors after schema and type changes; **timing gates (SC-003, SC-009)**: with device offline — open app and measure time until home screen shows pending balance (must be ≤ 2 s); with device online after offline session — measure time from reconnect until sync completes and pendingCount reaches 0 (must be ≤ 30 s)

**Checkpoint**: All 8 user stories independently functional; TypeScript compiles with zero errors in all packages; Expo dev server starts cleanly; haptics fire on all trip-state transitions; timing gates pass (home ≤ 2 s offline, sync ≤ 30 s on reconnect).

---

## Phase 12: Unit Tests (Constitution M Quality Gate #3)

**Purpose**: Unit tests for all `lib/` and `hooks/` modules as required by constitution Mobile Quality Gate #3: “All new `lib/` and `hooks/` code has at least one unit test.” Uses Jest + React Native Testing Library. MMKV and Supabase are mocked. Tests must pass with `jest --coverage` in fretagro-mobile/.

- [X] T059 [P] Write unit tests for fretagro-mobile/lib/viagem/calcularTrecho.ts in fretagro-mobile/\_\_tests\_\_/lib/viagem/calcularTrecho.test.ts: test fecharTrecho computes kmRodado = kmFinal − kmInicial; test ValidationError thrown when kmFinal ≤ kmInicial; test ImmutabilityError thrown when fechadoEm is already set; test guard blocks new leg when prior open leg exists for same freteId
- [X] T060 [P] Write unit tests for fretagro-mobile/lib/viagem/calcularViagem.ts in fretagro-mobile/\_\_tests\_\_/lib/viagem/calcularViagem.test.ts: test kmTotalVazio sums only vazio legs; test kmTotalCarregado sums only carregado legs; test kmTotalViagem = kmTotalVazio + kmTotalCarregado; test mediaDiesel = kmRodado / litrosDiesel; test mediaDiesel not computed for arla subtype
- [X] T061 [P] Write unit tests for packages/shared/lib/finance/calcularAcerto.ts in packages/shared/\_\_tests\_\_/calcularAcerto.test.ts: test valorComissao = Math.round(valorFrete × percentualComissao / 100); test saldoFinal = valorComissao − totalDeducoes with no additional rounding; test edge cases: zero commission rate, zero deductions, large values with fractional cents
- [X] T062 [P] Write unit tests for fretagro-mobile/lib/sync/syncQueue.ts in fretagro-mobile/\_\_tests\_\_/lib/sync/syncQueue.test.ts: mock queueStorage and Supabase client; test drain processes operations in FIFO order; test failed operation increments tentativas; test operation with tentativas ≥ 3 moves to dead-letter queue; test getPendingCount returns correct count
- [X] T063 [P] Write unit tests for fretagro-mobile/lib/storage/queueStorage.ts in fretagro-mobile/\_\_tests\_\_/lib/storage/queueStorage.test.ts: mock MMKV; test enqueue adds item to end of queue; test dequeueAll returns and clears all items; test peek returns items without removing; test replaceAll replaces queue contents atomically
- [X] T064 [P] Write unit tests for fretagro-mobile/lib/storage/viagemStorage.ts in fretagro-mobile/\_\_tests\_\_/lib/storage/viagemStorage.test.ts: mock MMKV; test saveViagem serializes ViagemAtiva to JSON; test loadViagem deserializes and returns ViagemAtiva; test saveViagem(null) clears the key; test loadViagem returns null when key is empty
- [X] T065 [P] Write unit tests for fretagro-mobile/hooks/useConectividade.ts in fretagro-mobile/\_\_tests\_\_/hooks/useConectividade.test.ts: mock expo-network; test returns isConnected: true when network is available; test returns isConnected: false when network is unavailable; test updates state when network state listener fires
- [X] T066 [P] Write unit tests for fretagro-mobile/hooks/useSync.ts in fretagro-mobile/\_\_tests\_\_/hooks/useSync.test.ts: mock useConectividade and syncQueue; test drain is called when isConnected transitions from false to true; test marcarSincronizado is called after drain completes; test pendingCount matches syncQueue.getPendingCount()
- [X] T067 [P] Write unit tests for fretagro-mobile/hooks/useAcerto.ts in fretagro-mobile/\_\_tests\_\_/hooks/useAcerto.test.ts: mock Supabase; test pendingBalance sums valorComissao of all status=pendente acertos; test totalDeducoes and saldoFinal computed correctly; test acertoHistory contains only settled acertos
- [X] T068 [P] Write unit tests for fretagro-mobile/hooks/useViagemAtiva.ts in fretagro-mobile/\_\_tests\_\_/hooks/useViagemAtiva.test.ts: mock useViagemStore; test isViagemAtiva is true when store has active trip; test tripRoute returns "origem → destino" string; test pendenteSincronizacao reflects store value; test all values are synchronous (no network call)

**Checkpoint**: `jest --coverage` exits with zero failures in fretagro-mobile/ and packages/shared/; all `lib/` and `hooks/` modules covered by at least one test (constitution M Quality Gate #3).

---

## Dependencies

```
Phase 1 (Setup) → Phase 2 (Foundational) → all user story phases

US1 (P1) → US2 (P2) → US3 (P3) → US4 (P4) → US5 (P5)
                         ↘ US4 (P4) ↗
US1 (P1) → US6 (P6)
US1 (P1) → US7 (P7)   [also depends on US2 Zustand store + US6 useAcerto hook]
US1 (P1) → US8 (P8)

Critical path: Phase 1 → Phase 2 → US1 → US2 → US4
```

### Parallel Execution Opportunities

| Phase | Parallel tasks |
|---|---|
| Phase 1 | T002 ∥ T004 ∥ T005 (after T001 + T003) |
| Phase 2 | T008 ∥ T009 ∥ T010 ∥ T012 ∥ T013 (after T006+T007); T015 ∥ T016 (after T014); T018 ∥ T020 ∥ T021 ∥ T022 (after T011) |
| Phase 3 (US1) | T023 ∥ T024 (after Phase 2 complete) |
| Phase 4 (US2) | T026 ∥ T027 ∥ T028 (components first, parallel); then T029 → T030 → T031 → T032 → T033 |
| Phase 5 (US3) | T035 ∥ T036 (after T034) |
| Phase 6 (US4) | T040 ∥ T041 (after T039 structure defined) |
| Phase 8 (US6) | T047 ∥ T048 (after T046) |
| Phase 9 (US7) | T051 ∥ T052 (after Phase 2 + US1 complete) |

---

## Implementation Strategy

### MVP Scope (deliver first — Phases 1–4)

Complete after T033. Delivers:
- Account activation and persistent login (US1)
- Full trip start → advance legs → close flow (US2)
- Offline persistence via MMKV (Phase 2 foundational)

Not yet included: expenses, sync, history, acerto, home screen, profile.

### Increment 2 (Phases 5–6)

Add US3 (expenses) and US4 (offline sync). Delivers:
- Complete offline-first field workflow: record refuels + general expenses, auto-sync when reconnected.

### Increment 3 (Phases 7–10)

Add US5 (history), US6 (acerto), US7 (home screen), US8 (profile). Delivers:
- Full v1 feature set — all 8 user stories functional.

### Increment 4 (Phase 11)

Polish, performance validation, and cross-package type consolidation. Delivers:
- Production-ready app.
