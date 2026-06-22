// lib/api/idempotency.ts — Client-supplied idempotency key support
// Prevents duplicate writes when the mobile app replays a synced request (FR-041, SC-004).
//
// Protocol:
//   Client sends:  X-Idempotency-Key: <uuid>   (max 128 chars)
//   First request: processes normally, caches {status, body} for TTL_MS
//   Duplicate:     returns the cached response with the same status code
//
// Production note: this uses a process-scoped in-memory store which works
// correctly for single-instance Node.js deployments (local + single Vercel
// instance). For multi-instance/serverless at scale replace the store with
// a Redis SET NX with TTL or a Postgres-backed idempotency table.

import { NextResponse } from 'next/server'

/** How long (ms) a processed key is remembered. Default: 24 h. */
const TTL_MS = 24 * 60 * 60 * 1000

interface CachedEntry {
  status: number
  body: unknown
  expiresAt: number
}

// Module-level singleton — reused across requests within the same process.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const store = new Map<string, CachedEntry>()

/** Maximum allowed key length (prevents memory exhaustion). */
const MAX_KEY_LENGTH = 128

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Extracts and validates the X-Idempotency-Key header.
 * Returns `null` when the header is absent (idempotency is opt-in).
 */
export function extractIdempotencyKey(req: Request): string | null {
  const key = req.headers.get('X-Idempotency-Key')
  if (!key) return null
  // Truncate silently rather than rejecting so clients sending long keys still work
  return key.slice(0, MAX_KEY_LENGTH)
}

/**
 * Looks up a previously processed key.
 * Returns a NextResponse replay when found, or `null` when the key is new.
 */
export function checkIdempotency(key: string | null): NextResponse | null {
  if (!key) return null

  const entry = store.get(key)
  if (!entry) return null

  // Evict expired entries on read
  if (Date.now() > entry.expiresAt) {
    store.delete(key)
    return null
  }

  // Replay the original response
  return NextResponse.json(entry.body, { status: entry.status })
}

/**
 * Stores the result of a processed request against its idempotency key.
 * No-op when `key` is null.
 */
export function storeIdempotencyResult(
  key: string | null,
  status: number,
  body: unknown,
): void {
  if (!key) return

  store.set(key, { status, body, expiresAt: Date.now() + TTL_MS })

  // Passive eviction: remove stale entries when the store grows large
  if (store.size > 10_000) {
    const now = Date.now()
    for (const [k, v] of store) {
      if (now > v.expiresAt) store.delete(k)
    }
  }
}
