// lib/auth/mobileAuth.ts
// Layer: lib — no imports from hooks/, components/, or app/
// Single permitted import point for ALL Supabase auth operations (constitution M-II).
// No app/ screen, component, or hook may import the Supabase client directly for auth.

import { supabase } from '../supabase/client'

/**
 * Signs in the driver with email and password.
 * Credentials are defined by the fleet owner via the web app.
 * Returns the session on success; throws on invalid credentials.
 */
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw error
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
