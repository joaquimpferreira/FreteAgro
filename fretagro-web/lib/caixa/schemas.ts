// lib/caixa/schemas.ts — Zod validation schemas for Caixa (US5, FR-030)
// Layer: lib — no imports from hooks/, components/, or app/.

import { z } from 'zod'

/**
 * TipoLancamento values available for avulso cash-flow entries.
 * Mirrors the Prisma TipoLancamento enum.
 * Principle VI: all inputs validated at API boundary.
 */
export const TIPOS_LANCAMENTO_AVULSO = [
  'combustivel',
  'borracharia',
  'patio',
  'pedagio',
  'oficina',
  'vale',
  'adiantamento',
  'salario',
  'ipva',
  'seguro',
  'outro',
] as const

export type TipoLancamentoAvulso = (typeof TIPOS_LANCAMENTO_AVULSO)[number]

/**
 * Schema for POST /api/caixa — manual avulso outflow entry (FR-030).
 *
 * `valor` must be a non-negative integer in centavos.
 * `data`  must be a valid ISO date string (YYYY-MM-DD).
 */
export const lancamentoCaixaSchema = z.object({
  tipo: z.enum(TIPOS_LANCAMENTO_AVULSO, {
    errorMap: () => ({
      message: `tipo deve ser um de: ${TIPOS_LANCAMENTO_AVULSO.join(', ')}`,
    }),
  }),
  descricao: z.string().max(200).optional(),
  /** Centavos — must be ≥ 0 (FR-030: contract specifies valor ≥ 0) */
  valor: z
    .number({ invalid_type_error: 'valor deve ser um número inteiro.' })
    .int('valor deve ser um inteiro em centavos.')
    .min(0, 'valor deve ser ≥ 0.'),
  /** ISO date string YYYY-MM-DD */
  data: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'data deve estar no formato YYYY-MM-DD.'),
})

export type LancamentoCaixaInput = z.infer<typeof lancamentoCaixaSchema>

/**
 * Schema for GET /api/caixa query params.
 * `from` and `to` are required ISO date strings.
 */
export const caixaQuerySchema = z.object({
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'from deve estar no formato YYYY-MM-DD.'),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'to deve estar no formato YYYY-MM-DD.'),
})

export type CaixaQuery = z.infer<typeof caixaQuerySchema>
