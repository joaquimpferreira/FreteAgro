// lib/auth/mobileAuth.ts
// Layer: lib — no imports from hooks/, components/, or app/
// Single permitted import point for ALL Supabase auth operations (constitution M-II).
// No app/ screen, component, or hook may import the Supabase client directly for auth.

import { supabase } from '../supabase/client'

/**
 * Signs in the driver with email and password.
 * Credentials are defined by the fleet owner via the web app.
 * Returns the session on success; throws on invalid credentials or when the
 * authenticated Supabase user has no linked `motoristas` row (e.g. the fleet
 * owner's own account) — the mobile app is driver-only.
 */
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw error

  const { data: motorista, error: motoristaError } = await supabase
    .from('motoristas')
    .select('id')
    .eq('supabaseUserId', data.user.id)
    .maybeSingle()

  if (motoristaError || !motorista) {
    await supabase.auth.signOut()
    throw new Error(
      'Esta conta não tem acesso de motorista. Peça ao dono da frota para cadastrar seu acesso.',
    )
  }

  return data.session
}

/**
 * Signs out the current driver and clears the persisted session from SecureStore.
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

/**
 * Returns the current session (null if unauthenticated).
 * Used in layout guards to redirect to login when no session exists.
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session
}
