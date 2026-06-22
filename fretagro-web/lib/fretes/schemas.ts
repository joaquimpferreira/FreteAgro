// lib/fretes/schemas.ts — Zod schemas for fretes (freights) and lançamentos (expenses)
// Used by Route Handlers (server-side) and React Hook Form resolvers (client-side).
// Principle VI: all user inputs sanitised with Zod before DB queries.

import { z } from 'zod'
import { valorCentavosSchema, kmSchema } from '@/lib/utils/validators'

// ─── Tipo de Carga (Cargo Type) ────────────────────────────────────────────────

export const tipoCargaEnum = z.enum(
  ['grao', 'oleo_soja', 'farelo', 'fertilizante', 'outro'],
  { errorMap: () => ({ message: 'Tipo de carga inválido.' }) },
)

// ─── Tipo de Lançamento (Expense Type) ────────────────────────────────────────

export const tipoLancamentoEnum = z.enum(
  ['combustivel', 'borracharia', 'patio', 'pedagio', 'oficina', 'vale', 'adiantamento', 'salario', 'ipva', 'seguro', 'outro'],
  { errorMap: () => ({ message: 'Tipo de lançamento inválido.' }) },
)

// ─── Status de Frete ──────────────────────────────────────────────────────────

export const statusFreteEnum = z.enum(
  ['em_andamento', 'concluido', 'acerto_pendente', 'acerto_realizado'],
  { errorMap: () => ({ message: 'Status de frete inválido.' }) },
)

// ─── Frete Create ─────────────────────────────────────────────────────────────

export const freteCreateSchema = z.object({
  caminhaoId: z.string().cuid('ID de caminhão inválido.'),
  origem:     z.string().min(2, 'Origem deve ter pelo menos 2 caracteres.').max(200),
  destino:    z.string().min(2, 'Destino deve ter pelo menos 2 caracteres.').max(200),
  tipoCarga:  tipoCargaEnum,
  kmInicial:  kmSchema,
  // valorBruto in centavos — must be ≥ 0 (FR-016)
  valorBruto: valorCentavosSchema,
  dataInicio: z.string().datetime({ message: 'Data de início inválida (use ISO 8601).' }),
})

export type FreteCreateInput = z.infer<typeof freteCreateSchema>

// ─── Frete Update (PATCH) ─────────────────────────────────────────────────────

export const freteUpdateSchema = z.object({
  kmFinal:   kmSchema.optional(),
  dataFim:   z.string().datetime({ message: 'Data de fim inválida (use ISO 8601).' }).optional(),
  status:    statusFreteEnum.optional(),
  origem:    z.string().min(2).max(200).optional(),
  destino:   z.string().min(2).max(200).optional(),
  tipoCarga: tipoCargaEnum.optional(),
  valorBruto: valorCentavosSchema.optional(),
})

export type FreteUpdateInput = z.infer<typeof freteUpdateSchema>

// ─── Lançamento Create ────────────────────────────────────────────────────────

export const lancamentoCreateSchema = z.object({
  tipo:          tipoLancamentoEnum,
  valor:         valorCentavosSchema,
  descricao:     z.string().max(500).optional(),
  deducaoAcerto: z.boolean().default(false),
  // fotoUrl set after Storage upload — optional at create time
  fotoUrl:       z.string().url('URL de foto inválida.').optional(),
})

export type LancamentoCreateInput = z.infer<typeof lancamentoCreateSchema>
