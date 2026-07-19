// hooks/useViagemAtiva.ts
// US7: Derives active trip state from Zustand store for the home screen.
// Synchronous — reads MMKV-backed Zustand store; no network call.
// All derived values are available within 2 s of app open (SC-003).
//
// Layer: hooks — may import from store/ and @fretagro/types only.

import { useViagemStore } from '../store/viagemStore'
import type { ViagemAtiva } from '@fretagro/types'

// ─────────────────────────────────────────────────────────────────────────────
// Return type
// ─────────────────────────────────────────────────────────────────────────────

export interface ViagemAtivaState {
  /** True when there is an ongoing trip in the Zustand store */
  isViagemAtiva: boolean
  /** Full ViagemAtiva object or null when no active trip */
  viagemAtiva: ViagemAtiva | null
  /**
   * Human-readable route string for display on the home screen.
   * Format: "origem → destino"
   * Null when there is no active trip or origin/destination are absent.
   */
  tripRoute: string | null
  /** True when local mutations have not yet been synced to Supabase */
  pendenteSincronizacao: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Reads the Zustand store (hydrated from MMKV at app startup) and returns
 * a derived snapshot of the active trip suitable for the home screen (US7).
 *
 * This hook is intentionally synchronous and makes no network requests.
 * It relies on the store being hydrated by hidratarFromStorage() in app/_layout.tsx.
 */
export function useViagemAtiva(): ViagemAtivaState {
  const viagem = useViagemStore((s) => s.viagem)

  const isViagemAtiva = viagem != null

  const tripRoute: string | null =
    viagem?.origem && viagem?.destino
      ? `${viagem.origem} → ${viagem.destino}`
      : null

  const pendenteSincronizacao = viagem?.pendenteSincronizacao ?? false

  return {
    isViagemAtiva,
    viagemAtiva: viagem,
    tripRoute,
    pendenteSincronizacao,
  }
}
