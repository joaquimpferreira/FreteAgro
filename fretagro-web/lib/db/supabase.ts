// Supabase client factories — lib/db/supabase.ts
// Principle VI: SUPABASE_SERVICE_ROLE_KEY is server-only; never bundled.
// Three separate factories:
//   createServerSupabaseClient — for Server Components, Route Handlers (SSR)
//   createBrowserSupabaseClient — for Client Components (browser)
//   createAdminSupabaseClient — server-only, uses service role for auth.admin operations

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// ─── Server client (Server Components / Route Handlers) ─────────────────────
// Call this inside a Server Component or Route Handler where cookies() is
// available. Uses anon key by default; pass useServiceRole = true for
// trusted server-to-server calls that bypass RLS (lib/ must re-apply frotaId).
export function createServerSupabaseClient(useServiceRole = false) {
  const cookieStore = cookies()
  const key = useServiceRole
    ? process.env.SUPABASE_SERVICE_ROLE_KEY!
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch {
          // Ignore: called from a Server Component where cookie mutation is
          // not allowed; Next-Auth middleware handles session refresh.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: '', ...options })
        } catch {
          // Same as above
        }
      },
    },
  })
}

// ─── Browser client (Client Components) ─────────────────────────────────────
// Safe to call in "use client" files; only uses NEXT_PUBLIC_ keys.
export function createBrowserSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

// ─── Admin client (server-only Route Handlers) ────────────────────────────────
// Uses the service role key — bypasses RLS and can call auth.admin.* methods.
// NEVER call this from Client Components or expose to the browser.
export function createAdminSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}
