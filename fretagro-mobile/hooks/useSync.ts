// hooks/useSync.ts
// Layer: hooks — may import from lib/ and store/ only; not from components/ or app/
// Drives automatic background sync when connectivity is restored.
//
// useSyncStatus() is the primary export — use it in _layout.tsx (T043) and anywhere
// that needs to read pendingCount or isSyncing state.
//
// Drain triggers:
//   1. On connectivity transition: offline → online (via useConectividade)
//   2. On initial mount if already connected and queue is non-empty (catches pending
//      ops left from a previous session that ended while online)
//   3. On AppState 'active' (app foregrounded) — wired externally in _layout.tsx (T043)

import { useCallback, useEffect, useRef, useState } from 'react'
import { useConectividade } from './useConectividade'
import { drain, getPendingCount } from '../lib/sync/syncQueue'
import { useViagemStore } from '../store/viagemStore'

export interface SyncStatus {
  pendingCount: number
  isSyncing: boolean
}

export function useSyncStatus(): SyncStatus {
  const { isConnected } = useConectividade()
  const wasConnected = useRef(isConnected)
  // Guard against concurrent drain() calls
  const isSyncingRef = useRef(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [pendingCount, setPendingCount] = useState(() => getPendingCount())
  const marcarSincronizado = useViagemStore((s) => s.marcarSincronizado)

  const runDrain = useCallback(() => {
    if (isSyncingRef.current) return
    isSyncingRef.current = true
    setIsSyncing(true)
    drain()
      .then(() => {
        marcarSincronizado()
      })
      .catch(() => {
        // Per-op errors are handled inside drain(); nothing to propagate here
      })
      .finally(() => {
        setPendingCount(getPendingCount())
        isSyncingRef.current = false
        setIsSyncing(false)
      })
  }, [marcarSincronizado])

  // Drain when connectivity transitions from offline → online
  useEffect(() => {
    if (isConnected && !wasConnected.current) {
      runDrain()
    }
    wasConnected.current = isConnected
  }, [isConnected, runDrain])

  // Drain on mount if already connected and queue is non-empty
  useEffect(() => {
    if (isConnected && getPendingCount() > 0) {
      runDrain()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Refresh pendingCount when connectivity changes (may change after offline-only ops)
  useEffect(() => {
    setPendingCount(getPendingCount())
  }, [isConnected])

  return { pendingCount, isSyncing }
}
