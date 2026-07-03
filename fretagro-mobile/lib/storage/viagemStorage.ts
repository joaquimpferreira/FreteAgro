// lib/storage/viagemStorage.ts
// Layer: lib — no imports from hooks/, components/, or app/
// MMKV-backed persistence for the active trip state.
// Called on every Zustand store mutation and at app hydration (T016/T017).

import { MMKV } from 'react-native-mmkv'
import type { ViagemAtiva } from '@fretagro/types'

const storage = new MMKV({ id: 'viagem_ativa' })
const VIAGEM_KEY = 'viagem_ativa'

/**
 * Persists the active trip to MMKV.
 * Pass null to clear the stored trip (e.g., after successful sync and close).
 */
export function saveViagem(viagem: ViagemAtiva | null): void {
  if (viagem === null) {
    storage.delete(VIAGEM_KEY)
  } else {
    storage.set(VIAGEM_KEY, JSON.stringify(viagem))
  }
}

/**
 * Loads the active trip from MMKV.
 * Returns null if no trip is stored or the stored value cannot be parsed.
 */
export function loadViagem(): ViagemAtiva | null {
  const raw = storage.getString(VIAGEM_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as ViagemAtiva
  } catch {
    return null
  }
}
