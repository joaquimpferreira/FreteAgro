// lib/auth/config.ts — Next-Auth v5 (Auth.js) configuration
// Principle II: ALL authentication logic is centralised here.
// Session checks outside this module are forbidden (constitution §II).

import NextAuth, { type NextAuthConfig } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/db/supabase'
import { prisma } from '@/lib/db/prisma'

// ─── Driver authorization helpers (US7 / FR-040) ─────────────────────────────

/**
 * Verifies that a motorista session is authorised to read/write a given frete.
 * A driver may only access fretes that belong to the caminhão they are bound to.
 * Owners (role === 'dono') pass unconditionally.
 *
 * @returns `null` when access is allowed, or a 403-typed error string otherwise.
 */
export async function assertDriverFreteAccess(opts: {
  role: string
  motoristaId?: string | null
  freteId: string
  frotaId: string
}): Promise<'FORBIDDEN' | null> {
  // Owners have full access to their fleet
  if (opts.role !== 'motorista') return null

  if (!opts.motoristaId) return 'FORBIDDEN'

  // Find the caminhão bound to this driver within the fleet
  const caminhao = await prisma.caminhao.findFirst({
    where: { motoristaId: opts.motoristaId, frotaId: opts.frotaId },
    select: { id: true },
  })
  if (!caminhao) return 'FORBIDDEN'

  // Confirm the frete belongs to that caminhão (and to the fleet)
  const frete = await prisma.frete.findFirst({
    where: { id: opts.freteId, caminhaoId: caminhao.id, frotaId: opts.frotaId },
    select: { id: true },
  })
  if (!frete) return 'FORBIDDEN'

  return null
}

/**
 * Verifies that a motorista session is authorised to create a frete for a given caminhão.
 * The driver may only use the caminhão they are currently bound to.
 * Owners pass unconditionally.
 *
 * @returns `null` when access is allowed, or 'FORBIDDEN' otherwise.
 */
export async function assertDriverCaminhaoAccess(opts: {
  role: string
  motoristaId?: string | null
  caminhaoId: string
  frotaId: string
}): Promise<'FORBIDDEN' | null> {
  if (opts.role !== 'motorista') return null

  if (!opts.motoristaId) return 'FORBIDDEN'

  const caminhao = await prisma.caminhao.findFirst({
    where: { id: opts.caminhaoId, motoristaId: opts.motoristaId, frotaId: opts.frotaId },
    select: { id: true },
  })

  return caminhao ? null : 'FORBIDDEN'
}

// Input validation schema for login credentials
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const authConfig: NextAuthConfig = {
  // JWT strategy (no DB adapter — Supabase Auth owns the identity)
  session: { strategy: 'jwt' },

  pages: {
    signIn: '/login',
    error:  '/login',
  },

  providers: [
    CredentialsProvider({
      name: 'Credenciais',
      credentials: {
        email:    { label: 'E-mail',  type: 'email'    },
        password: { label: 'Senha',   type: 'password' },
      },
      async authorize(credentials) {
        // Validate shape before touching Supabase
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        // Authenticate against Supabase Auth
        const supabase = createServerSupabaseClient()
        const { data, error } = await supabase.auth.signInWithPassword({
          email:    parsed.data.email,
          password: parsed.data.password,
        })
        if (error || !data.user) return null

        // Load application-level user row (role, fleet)
        const appUser = await prisma.user.findUnique({
          where: { email: parsed.data.email },
          include: { frota: true },
        })
        if (!appUser) return null

        // Locate motoristaId for drivers (used in RLS JWT claim)
        let motoristaId: string | undefined
        if (appUser.role === 'motorista') {
          const motorista = await prisma.motorista.findFirst({
            where: { whatsapp: appUser.whatsapp, frotaId: appUser.frota?.id ?? '' },
          })
          motoristaId = motorista?.id
        }

        return {
          id:          appUser.id,
          name:        appUser.nome,
          email:       appUser.email,
          role:        appUser.role,
          frotaId:     appUser.frota?.id ?? '',
          motoristaId: motoristaId ?? null,
        }
      },
    }),
  ],

  callbacks: {
    // Persist application claims into the JWT
    async jwt({ token, user }) {
      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const u = user as any
        token.id          = u.id
        token.role        = u.role
        token.frotaId     = u.frotaId
        token.motoristaId = u.motoristaId
      }
      return token
    },

    // Expose claims on the session object (used by Server Components / hooks)
    async session({ session, token }) {
      if (token) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const s = session as any
        s.user.id          = token.id ?? token.sub
        s.user.role        = token.role
        s.user.frotaId     = token.frotaId
        s.user.motoristaId = token.motoristaId
      }
      return session
    },
  },
}

// Export the Auth.js handler and helpers
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)
