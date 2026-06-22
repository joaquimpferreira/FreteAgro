// lib/auth/schemas.ts — Zod schemas for authentication & onboarding
// Used by Route Handlers (server-side) and React Hook Form resolvers (client-side).
// Principle VI: all user inputs sanitised with Zod before DB queries.

import { z } from 'zod'
import { emailSchema, senhaSchema, whatsappSchema, estadoSchema } from '@/lib/utils/validators'

// ─── Owner Registration ───────────────────────────────────────────────────────
// POST /api/auth/cadastro — step 1 (dados pessoais) + step 2 (dados da frota) combined
// FR-001, FR-002

export const cadastroSchema = z.object({
  // Step 1: personal data
  nome:     z.string().min(2, 'Nome deve ter pelo menos 2 caracteres.').max(100),
  email:    emailSchema,
  whatsapp: whatsappSchema,
  senha:    senhaSchema,
  // Step 2: fleet data
  frotaNome: z.string().min(2, 'Nome da frota deve ter pelo menos 2 caracteres.').max(100),
  estado:    estadoSchema,
  cnpjCpf:   z
    .string()
    .optional()
    .transform((val) => (val ? val.replace(/\D/g, '') : undefined))
    .refine(
      (val) => val === undefined || val.length === 11 || val.length === 14,
      { message: 'CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos.' },
    ),
})

export type CadastroInput = z.infer<typeof cadastroSchema>

// ─── Step 1 only (for multi-step form on client) ─────────────────────────────
export const cadastroStep1Schema = z.object({
  nome:     z.string().min(2, 'Nome deve ter pelo menos 2 caracteres.').max(100),
  email:    emailSchema,
  whatsapp: whatsappSchema,
  senha:    senhaSchema,
  confirmarSenha: senhaSchema,
}).refine((data) => data.senha === data.confirmarSenha, {
  message: 'As senhas não coincidem.',
  path: ['confirmarSenha'],
})

export type CadastroStep1Input = z.infer<typeof cadastroStep1Schema>

// ─── Step 2 only (for multi-step form on client) ─────────────────────────────
export const cadastroStep2Schema = z.object({
  frotaNome: z.string().min(2, 'Nome da frota deve ter pelo menos 2 caracteres.').max(100),
  estado:    estadoSchema,
  cnpjCpf:   z
    .string()
    .optional()
    .transform((val) => (val ? val.replace(/\D/g, '') : undefined))
    .refine(
      (val) => val === undefined || val === '' || val.length === 11 || val.length === 14,
      { message: 'CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos.' },
    ),
})

export type CadastroStep2Input = z.infer<typeof cadastroStep2Schema>

// ─── Login ───────────────────────────────────────────────────────────────────
// POST /api/auth/login — handled by Next-Auth Credentials provider
// FR-003

export const loginSchema = z.object({
  email: emailSchema,
  senha: senhaSchema,
})

export type LoginInput = z.infer<typeof loginSchema>

// ─── Password Recovery ───────────────────────────────────────────────────────
// POST /api/auth/recuperar-senha — no account enumeration (FR-005)

export const recuperarSenhaSchema = z.object({
  email: emailSchema,
})

export type RecuperarSenhaInput = z.infer<typeof recuperarSenhaSchema>

// ─── Driver Activation ───────────────────────────────────────────────────────
// POST /api/auth/motorista/ativar — token from WhatsApp invite (FR-006, FR-007)

export const motoristaAtivarSchema = z.object({
  token: z.string().min(1, 'Token de ativação é obrigatório.'),
  senha: senhaSchema,
})

export type MotoristaAtivarInput = z.infer<typeof motoristaAtivarSchema>
