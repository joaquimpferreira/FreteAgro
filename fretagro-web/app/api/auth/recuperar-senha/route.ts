// app/api/auth/recuperar-senha/route.ts — Password recovery handler
// FR-005: no account enumeration — always returns 200 regardless of whether
// the email exists in the system.

import { createServerSupabaseClient } from '@/lib/db/supabase'
import { validateBody } from '@/lib/api/validate'
import { ok } from '@/lib/api/errors'
import { recuperarSenhaSchema } from '@/lib/auth/schemas'

export async function POST(req: Request) {
  // Validate input — 422 on bad format, but still no enumeration
  const { data, error } = await validateBody(req, recuperarSenhaSchema)
  if (error) return error

  // Trigger password-reset email via Supabase Auth (fire-and-forget)
  // Errors are intentionally swallowed to prevent account enumeration.
  const supabase = createServerSupabaseClient()
  await supabase.auth.resetPasswordForEmail(data.email, {
    redirectTo: `${process.env.NEXTAUTH_URL ?? ''}/nova-senha`,
  })

  // Always return 200 — do NOT reveal whether the email exists (FR-005)
  return ok({ message: 'Se o e-mail estiver cadastrado, você receberá as instruções em breve.' })
}
