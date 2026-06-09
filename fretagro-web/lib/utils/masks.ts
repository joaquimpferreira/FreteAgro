// lib/utils/masks.ts — input formatting masks for Brazilian data formats
// Used in React Hook Form controllers at the input boundary only.

/**
 * Formats a plate string as user types.
 * Supports both legacy (ABC-1234) and Mercosul (ABC1D23) formats.
 */
export function maskPlaca(value: string): string {
  const raw = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7)
  if (raw.length <= 3) return raw
  return raw.slice(0, 3) + '-' + raw.slice(3)
}

/**
 * Formats a Brazilian phone/WhatsApp number: (11) 99999-9999
 * Handles both 10-digit (landline) and 11-digit (mobile) numbers.
 */
export function maskWhatsapp(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits.length ? `(${digits}` : ''
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

/**
 * Formats a CPF: 000.000.000-00
 */
export function maskCpf(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  }
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

/**
 * Formats a CNPJ: 00.000.000/0000-00
 */
export function maskCnpj(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 14)
  if (digits.length <= 2) return digits
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`
  if (digits.length <= 8) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`
  }
  if (digits.length <= 12) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`
  }
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`
}

/**
 * Formats a monetary value for display in an input field: "1.500,00"
 * Input is in centavos; returns a reais string without the R$ prefix.
 */
export function maskMoeda(centavos: number): string {
  return (centavos / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}
