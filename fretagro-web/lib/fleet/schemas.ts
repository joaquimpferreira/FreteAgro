// lib/fleet/schemas.ts — Zod schemas for trucks (caminhões) and drivers (motoristas)
// Used by Route Handlers (server-side) and React Hook Form resolvers (client-side).
// Principle VI: all user inputs sanitised with Zod before DB queries.

import { z } from 'zod'
import { placaSchema, whatsappSchema, percentualComissaoSchema } from '@/lib/utils/validators'

// ─── Caminhão (Truck) ─────────────────────────────────────────────────────────

export const tipoCarroceriaEnum = z.enum(
  ['graneleiro', 'tanque', 'bau', 'plataforma', 'outro'],
  { errorMap: () => ({ message: 'Tipo de carroceria inválido.' }) },
)

export const caminhaoCreateSchema = z.object({
  placa:      placaSchema,
  modelo:     z.string().min(2, 'Modelo deve ter pelo menos 2 caracteres.').max(100),
  ano:        z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
  carroceria: tipoCarroceriaEnum.optional(),
})

export type CaminhaoCreateInput = z.infer<typeof caminhaoCreateSchema>

export const caminhaoUpdateSchema = z.object({
  placa:       placaSchema.optional(),
  modelo:      z.string().min(2).max(100).optional(),
  ano:         z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
  carroceria:  tipoCarroceriaEnum.optional(),
  // bind/unbind driver — null explicitly unbinds
  motoristaId: z.string().cuid('ID de motorista inválido.').nullable().optional(),
})

export type CaminhaoUpdateInput = z.infer<typeof caminhaoUpdateSchema>

// ─── Motorista (Driver) ───────────────────────────────────────────────────────

export const tipoContratoEnum = z.enum(
  ['autonomo', 'clt'],
  { errorMap: () => ({ message: 'Tipo de contrato inválido. Use autonomo ou clt.' }) },
)

export const motoristaCreateSchema = z.object({
  nome:               z.string().min(2, 'Nome deve ter pelo menos 2 caracteres.').max(100),
  cpf:                z
    .string()
    .optional()
    .transform((val) => (val ? val.replace(/\D/g, '') : undefined))
    .refine(
      (val) => val === undefined || val.length === 11,
      { message: 'CPF deve ter 11 dígitos.' },
    ),
  whatsapp:           whatsappSchema,
  percentualComissao: percentualComissaoSchema,
  tipoContrato:       tipoContratoEnum.optional().default('autonomo'),
})

export type MotoristaCreateInput = z.infer<typeof motoristaCreateSchema>

export const motoristaUpdateSchema = z.object({
  nome:               z.string().min(2).max(100).optional(),
  cpf:                z
    .string()
    .optional()
    .transform((val) => (val ? val.replace(/\D/g, '') : undefined))
    .refine(
      (val) => val === undefined || val.length === 11,
      { message: 'CPF deve ter 11 dígitos.' },
    ),
  whatsapp:           whatsappSchema.optional(),
  percentualComissao: percentualComissaoSchema.optional(),
  tipoContrato:       tipoContratoEnum.optional(),
})

export type MotoristaUpdateInput = z.infer<typeof motoristaUpdateSchema>
