// lib/auth/config.ts — Next-Auth v5 (Auth.js) configuration
// Principle II: ALL authentication logic is centralised here.
// Session checks outside this module are forbidden (constitution §II).

import NextAuth, { type NextAuthConfig } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/db/supabase'
import { prisma } from '@/lib/db/prisma'

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
