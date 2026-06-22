// app/api/auth/motorista/ativar/route.ts — Driver activation handler
// FR-006, FR-007: driver sets password from WhatsApp invite link.
// No self-registration — the driver record is pre-created by the owner.
// Token is a Supabase OTP generated when the owner registers the driver.

import { prisma } from '@/lib/db/prisma'
import { createServerSupabaseClient } from '@/lib/db/supabase'
import { validateBody } from '@/lib/api/validate'
import { ok, unauthorized, internalError } from '@/lib/api/errors'
import { motoristaAtivarSchema } from '@/lib/auth/schemas'

export async function POST(req: Request) {
  // 1. Validate input
  const { data, error } = await validateBody(req, motoristaAtivarSchema)
  if (error) return error

  const { token, senha } = data

  const supabase = createServerSupabaseClient()

  // 2. Verify the invite token and exchange it for a session
  //    The token is a Supabase OTP hash embedded in the WhatsApp invite link.
  const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
    token_hash: token,
    type: 'invite',
  })

  if (verifyError || !verifyData.user) {
    return unauthorized('Token de ativação inválido ou expirado.')
  }

  const supabaseUserId = verifyData.user.id
  const email = verifyData.user.email

  if (!email) {
    return unauthorized('Token de ativação inválido.')
  }

  // 3. Update password via admin client
  const { error: pwError } = await supabase.auth.admin.updateUserById(supabaseUserId, {
    password: senha,
  })

  if (pwError) {
    console.error('[POST /api/auth/motorista/ativar] Password update error:', pwError)
    return internalError()
  }

  try {
    // 4. Find the corresponding Motorista record by email (User row) and set appAtivado = true
    //    Also ensure a User row exists for the driver (role = motorista)
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      // Create User row if it doesn't exist yet (driver invited via Supabase Auth)
      await prisma.user.create({
        data: {
          id:       supabaseUserId,
          nome:     verifyData.user.user_metadata?.nome ?? 'Motorista',
          email,
          whatsapp: verifyData.user.user_metadata?.whatsapp ?? '',
          role:     'motorista',
        },
      })
    }

    // Find and activate the matching Motorista record
    const motorista = await prisma.motorista.findFirst({
      where: {
        whatsapp: { equals: verifyData.user.user_metadata?.whatsapp ?? '' },
        appAtivado: false,
      },
    })

    if (!motorista) {
      // Driver may already be activated or record not found — still return success
      return ok({ motoristaId: null, appAtivado: true })
    }

    const updated = await prisma.motorista.update({
      where: { id: motorista.id },
      data: { appAtivado: true },
    })

    return ok({ motoristaId: updated.id, appAtivado: true })
  } catch (err) {
    console.error('[POST /api/auth/motorista/ativar] DB error:', err)
    return internalError()
  }
}
