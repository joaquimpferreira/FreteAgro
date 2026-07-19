/**
 * lib/sync/syncDespesas.ts
 * Layer: lib — no imports from hooks/, components/, or app/
 * Handles Supabase persistence for expense operations.
 *
 * Called by syncQueue.ts for operations in the DESPESAS group:
 *   CREATE_ABASTECIMENTO, CREATE_LANCAMENTO
 *
 * INSERT operations use upsert with ignoreDuplicates: true
 *   → equivalent to ON CONFLICT (id) DO NOTHING — safe for idempotent retries.
 */

import { supabase } from '../supabase/client'
import type { OperacaoPendente } from '../storage/queueStorage'

export async function syncDespesasOp(op: OperacaoPendente): Promise<void> {
  switch (op.tipo) {
    case 'CREATE_ABASTECIMENTO': {
      // INSERT INTO abastecimentos … ON CONFLICT (id) DO NOTHING
      // Fields: id, subtipo, litros, precoPorLitro, valorTotal, local?,
      //         kmAtual?, fotoUrl?, trechoId?, freteId, frotaId, createdAt
      const { error } = await supabase
        .from('abastecimentos')
        .upsert(op.payload, { onConflict: 'id', ignoreDuplicates: true })
      if (error) throw error
      break
    }

    case 'CREATE_LANCAMENTO': {
      // INSERT INTO lancamentos … ON CONFLICT (id) DO NOTHING
      // Fields: id, tipo, valor, descricao?, fotoUrl?, deducaoAcerto,
      //         freteId?, frotaId, createdAt
      const { error } = await supabase
        .from('lancamentos')
        .upsert(op.payload, { onConflict: 'id', ignoreDuplicates: true })
      if (error) throw error
      break
    }

    default:
      break
  }
}
