// lib/utils/validators.test.ts — Quality Gate 3 unit tests for validators
import { describe, it, expect } from 'vitest'
import {
  placaSchema,
  whatsappSchema,
  emailSchema,
  senhaSchema,
  percentualComissaoSchema,
  valorCentavosSchema,
  kmSchema,
  estadoSchema,
} from './validators'

// ─── placaSchema ──────────────────────────────────────────────────────────────
describe('placaSchema', () => {
  it('accepts legacy format ABC-1234', () => {
    expect(placaSchema.safeParse('ABC-1234').success).toBe(true)
  })

  it('accepts Mercosul format ABC1D23', () => {
    expect(placaSchema.safeParse('ABC1D23').success).toBe(true)
  })

  it('accepts legacy without hyphen', () => {
    expect(placaSchema.safeParse('ABC1234').success).toBe(true)
  })

  it('rejects too short', () => {
    expect(placaSchema.safeParse('AB1234').success).toBe(false)
  })

  it('rejects all digits', () => {
    expect(placaSchema.safeParse('1234567').success).toBe(false)
  })
})

// ─── whatsappSchema ───────────────────────────────────────────────────────────
describe('whatsappSchema', () => {
  it('accepts formatted 11-digit mobile number', () => {
    expect(whatsappSchema.safeParse('(11) 99999-9999').success).toBe(true)
  })

  it('accepts raw 11 digits', () => {
    expect(whatsappSchema.safeParse('11999999999').success).toBe(true)
  })

  it('rejects 10 digits (no leading 9 for mobile)', () => {
    // Must be exactly 11
    expect(whatsappSchema.safeParse('1199999999').success).toBe(false)
  })

  it('rejects empty string', () => {
    expect(whatsappSchema.safeParse('').success).toBe(false)
  })
})

// ─── emailSchema ──────────────────────────────────────────────────────────────
describe('emailSchema', () => {
  it('accepts valid email', () => {
    expect(emailSchema.safeParse('dono@frota.com.br').success).toBe(true)
  })

  it('normalises to lowercase', () => {
    const result = emailSchema.safeParse('DONO@FROTA.COM.BR')
    expect(result.success && result.data).toBe('dono@frota.com.br')
  })

  it('rejects missing @', () => {
    expect(emailSchema.safeParse('notanemail').success).toBe(false)
  })
})

// ─── senhaSchema ──────────────────────────────────────────────────────────────
describe('senhaSchema', () => {
  it('accepts password >= 8 chars', () => {
    expect(senhaSchema.safeParse('Str0ng!!').success).toBe(true)
  })

  it('rejects password < 8 chars', () => {
    expect(senhaSchema.safeParse('short').success).toBe(false)
  })
})

// ─── percentualComissaoSchema ─────────────────────────────────────────────────
describe('percentualComissaoSchema', () => {
  it('accepts 0', () => expect(percentualComissaoSchema.safeParse(0).success).toBe(true))
  it('accepts 12', () => expect(percentualComissaoSchema.safeParse(12).success).toBe(true))
  it('accepts 100', () => expect(percentualComissaoSchema.safeParse(100).success).toBe(true))
  it('rejects 101', () => expect(percentualComissaoSchema.safeParse(101).success).toBe(false))
  it('rejects -1', () => expect(percentualComissaoSchema.safeParse(-1).success).toBe(false))
  it('rejects float', () => expect(percentualComissaoSchema.safeParse(12.5).success).toBe(false))
})

// ─── valorCentavosSchema ──────────────────────────────────────────────────────
describe('valorCentavosSchema', () => {
  it('accepts 0', () => expect(valorCentavosSchema.safeParse(0).success).toBe(true))
  it('accepts 15000', () => expect(valorCentavosSchema.safeParse(15000).success).toBe(true))
  it('rejects -1', () => expect(valorCentavosSchema.safeParse(-1).success).toBe(false))
  it('rejects float', () => expect(valorCentavosSchema.safeParse(150.50).success).toBe(false))
})

// ─── kmSchema ─────────────────────────────────────────────────────────────────
describe('kmSchema', () => {
  it('accepts 0', () => expect(kmSchema.safeParse(0).success).toBe(true))
  it('accepts 100000', () => expect(kmSchema.safeParse(100000).success).toBe(true))
  it('rejects negative', () => expect(kmSchema.safeParse(-1).success).toBe(false))
  it('rejects float', () => expect(kmSchema.safeParse(100.5).success).toBe(false))
})

// ─── estadoSchema ─────────────────────────────────────────────────────────────
describe('estadoSchema', () => {
  it('accepts SP', () => expect(estadoSchema.safeParse('SP').success).toBe(true))
  it('accepts MT', () => expect(estadoSchema.safeParse('MT').success).toBe(true))
  it('rejects XX', () => expect(estadoSchema.safeParse('XX').success).toBe(false))
  it('rejects lowercase sp', () => expect(estadoSchema.safeParse('sp').success).toBe(false))
})
