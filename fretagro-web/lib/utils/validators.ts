// lib/utils/validators.ts — Zod schemas for Brazilian data formats
// Used both client-side (RHF resolvers) and server-side (Route Handler input validation).
// Principle VI: all user inputs sanitised with Zod before DB queries.

import { z } from 'zod'

// ─── UF (estado) ─────────────────────────────────────────────────────────────
const UFS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
] as const

export const estadoSchema = z.enum(UFS, {
  errorMap: () => ({ message: 'Estado inválido. Use a sigla UF (ex: SP, MG).' }),
})

// ─── Placa ────────────────────────────────────────────────────────────────────
// Accepts: ABC-1234 (legacy) or ABC1D23 (Mercosul) — case insensitive
const PLACA_LEGACY    = /^[A-Za-z]{3}-?\d{4}$/
const PLACA_MERCOSUL  = /^[A-Za-z]{3}\d[A-Za-z]\d{2}$/

export const placaSchema = z.string().refine(
  (val) => {
    const clean = val.toUpperCase().replace(/-/g, '')
    return PLACA_LEGACY.test(val) || PLACA_MERCOSUL.test(clean)
  },
  { message: 'Placa inválida. Use o formato ABC-1234 ou ABC1D23 (Mercosul).' },
)

// ─── WhatsApp ────────────────────────────────────────────────────────────────
// Expects 10 or 11 digits; allows formatted input (parentheses, spaces, hyphens)
export const whatsappSchema = z
  .string()
  .transform((val) => val.replace(/\D/g, ''))
  .pipe(
    z.string().length(11, 'WhatsApp deve ter 11 dígitos (DDD + 9 dígitos).'),
  )

// ─── Email ───────────────────────────────────────────────────────────────────
export const emailSchema = z
  .string()
  .email('E-mail inválido.')
  .max(255, 'E-mail muito longo.')
  .toLowerCase()

// ─── Senha ───────────────────────────────────────────────────────────────────
export const senhaSchema = z
  .string()
  .min(8, 'A senha deve ter pelo menos 8 caracteres.')
  .max(72, 'A senha não pode ter mais de 72 caracteres.')

// ─── Percentual de comissão ───────────────────────────────────────────────────
export const percentualComissaoSchema = z
  .number()
  .int('O percentual deve ser um número inteiro.')
  .min(0, 'O percentual não pode ser negativo.')
  .max(100, 'O percentual não pode ser maior que 100.')

// ─── Valor em centavos ────────────────────────────────────────────────────────
export const valorCentavosSchema = z
  .number()
  .int('O valor deve ser em centavos inteiros.')
  .min(0, 'O valor não pode ser negativo.')

// ─── KM ─────────────────────────────────────────────────────────────────────
export const kmSchema = z
  .number()
  .int('A quilometragem deve ser um número inteiro.')
  .min(0, 'A quilometragem não pode ser negativa.')
