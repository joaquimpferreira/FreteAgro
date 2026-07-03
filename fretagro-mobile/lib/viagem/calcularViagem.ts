// lib/viagem/calcularViagem.ts
// Layer: lib — no imports from hooks/, components/, or app/
// Aggregate km calculations for a completed or in-progress trip.

import type { TrechoKm, Abastecimento } from '@fretagro/types'

/**
 * Total km driven on empty legs (tipo = 'vazio').
 * Only sums legs that have been closed (kmRodado present).
 */
export function kmTotalVazio(trechos: TrechoKm[]): number {
  return trechos
    .filter((t) => t.tipo === 'vazio' && t.kmRodado != null)
    .reduce((acc, t) => acc + (t.kmRodado ?? 0), 0)
}

/**
 * Total km driven on loaded legs (tipo = 'carregado').
 * Only sums legs that have been closed (kmRodado present).
 */
export function kmTotalCarregado(trechos: TrechoKm[]): number {
  return trechos
    .filter((t) => t.tipo === 'carregado' && t.kmRodado != null)
    .reduce((acc, t) => acc + (t.kmRodado ?? 0), 0)
}

/**
 * Total km across all legs (vazio + carregado).
 */
export function kmTotalViagem(trechos: TrechoKm[]): number {
  return kmTotalVazio(trechos) + kmTotalCarregado(trechos)
}

/**
 * Fuel economy for a single closed leg (diesel only).
 * mediaDiesel = trecho.kmRodado / litrosDiesel
 *
 * @param trecho         A closed leg (kmRodado must be set)
 * @param litrosDiesel   Total diesel liters for this leg
 * @returns km/l or null if the leg is open or litros is zero
 */
export function mediaDiesel(
  trecho: TrechoKm,
  litrosDiesel: number,
): number | null {
  if (trecho.kmRodado == null || litrosDiesel <= 0) return null
  return trecho.kmRodado / litrosDiesel
}

/**
 * Computes mediaDiesel for a leg using the refuels linked to it.
 * Filters to diesel-only abastecimentos where trechoId matches the given leg.
 */
export function mediaDieselParaTrecho(
  trecho: TrechoKm,
  abastecimentos: Abastecimento[],
): number | null {
  const litrosDiesel = abastecimentos
    .filter((a) => a.trechoId === trecho.id && a.subtipo === 'diesel')
    .reduce((acc, a) => acc + a.litros, 0)
  return mediaDiesel(trecho, litrosDiesel)
}
