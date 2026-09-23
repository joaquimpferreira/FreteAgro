// lib/utils/format.ts
// pt-BR display formatting, in one place.
//
// `formatReais` existed as a private copy in five screens before this module.
// They agreed, but nothing kept them agreeing — and money that renders one way
// on the home screen and another on the settlement is exactly the kind of
// inconsistency the driver reads as the app being wrong about his pay.
//
// Money is integer centavos everywhere in this codebase (constitution).
// Nothing here rounds: these functions display a value, they never compute one.

/** 123456 → "R$ 1.234,56" */
export function formatReais(centavos: number): string {
  return (centavos / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

/** 128940 → "128.940 km" */
export function formatKm(km: number): string {
  return `${km.toLocaleString('pt-BR')} km`
}

/** 180.5 → "180,5 L" */
export function formatLitros(litros: number): string {
  return `${litros.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} L`
}

/** 6.5 → "R$ 6,50/L" */
export function formatPrecoLitro(preco: number): string {
  return `${preco.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  })}/L`
}

/** ISO string → "11/09/2026" */
export function formatDate(iso: string | Date): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/** ISO string → "11 set, 14:32" — for a queued record the driver needs to place in his day. */
export function formatDateTime(iso: string | Date): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** 2.85 → "2,85 km/L" */
export function formatMedia(kmPorLitro: number): string {
  return `${kmPorLitro.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} km/L`
}
