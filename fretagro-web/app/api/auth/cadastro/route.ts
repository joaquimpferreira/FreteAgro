// app/api/auth/cadastro/route.ts — Owner registration handler
// FR-001: creates a User + Frota record for a new fleet owner.
// FR-002: hashes password via Supabase Auth; no raw passwords in DB.
// Returns 201 on success, 409 EMAIL_TAKEN, 422 on validation errors.

import { prisma } from '@/lib/db/prisma'
import { createServerSupabaseClient } from '@/lib/db/supabase'
import { validateBody } from '@/lib/api/validate'
import { conflict, created, internalError } from '@/lib/api/errors'
import { cadastroSchema } from '@/lib/auth/schemas'

export async function POST(req: Request) {
  // 1. Validate request body
  const { data, error } = await validateBody(req, cadastroSchema)
  if (error) return error

  const { nome, email, whatsapp, senha, frotaNome, estado, cnpjCpf } = data

  // 2. Check for duplicate email (application-level, before Supabase call)
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return conflict('EMAIL_TAKEN', 'E-mail já cadastrado.')
  }

  // 3. Create the Supabase Auth user (password hashed by Supabase; FR-002)
  // useServiceRole=true required: auth.admin.createUser() is an admin-only API
  const supabase = createServerSupabaseClient(true)
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true, // auto-confirm for owner registration
  })

  if (authError || !authData.user) {
    // Supabase reports duplicate emails here too — map to 409
    if (authError?.message?.toLowerCase().includes('already registered')) {
      return conflict('EMAIL_TAKEN', 'E-mail já cadastrado.')
    }
    console.error('[POST /api/auth/cadastro] Supabase error:', authError)
    return internalError()
  }

  try {
    // 4. Create User + Frota in a single transaction (FR-001, FR-002)
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          id:       authData.user.id, // align Prisma ID with Supabase Auth UUID
          nome,
          email,
          whatsapp,
          role: 'dono',
        },
      })

      const frota = await tx.frota.create({
        data: {
          nome:    frotaNome,
          estado,
          cnpjCpf: cnpjCpf ?? null,
          ownerId: user.id,
        },
      })

      return { user, frota }
    })

    return created({
      userId:  result.user.id,
      frotaId: result.frota.id,
      role:    'dono' as const,
    })
  } catch (err) {
    // Rollback Supabase Auth user if DB transaction fails
    await supabase.auth.admin.deleteUser(authData.user.id)
    console.error('[POST /api/auth/cadastro] DB transaction error:', err)
    return internalError()
  }
}
