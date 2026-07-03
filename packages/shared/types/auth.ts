// types/auth.ts — authentication and session types
// Layer: types — no imports from lib/, hooks/, components/, or app/

export type UserRole = 'dono' | 'motorista'

export interface AppUser {
  id: string
  nome: string
  email: string
  whatsapp: string
  role: UserRole
  createdAt: string
}

// Extends the Next-Auth session with application-specific claims
export interface AppSession {
  user: AppUser
  // Tenant identifier — every DB query is scoped by this
  frotaId: string
  // motoristaId is set only when role = 'motorista'
  motoristaId?: string
}

export interface CadastroDonoInput {
  nome: string
  email: string
  whatsapp: string
  senha: string
  nomeFreota: string
  estado: string
}

export interface LoginInput {
  email: string
  senha: string
}

export interface RecuperarSenhaInput {
  email: string
}

export interface MotoristaAtivarInput {
  token: string
  senha: string
}
