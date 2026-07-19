/**
 * lib/sync/syncViagem.ts
 * Layer: lib — no imports from hooks/, components/, or app/
 * Handles Supabase persistence for trip (frete) and leg (trecho) operations.
 *
 * Called by syncQueue.ts for operations in the VIAGEM group:
 *   CREATE_VIAGEM, CREATE_TRECHO, CLOSE_TRECHO, CLOSE_VIAGEM
 *
 * INSERT operations use upsert with ignoreDuplicates: true
 *   → equivalent to ON CONFLICT (id) DO NOTHING — safe for idempotent retries.
 *
 * UPDATE operations (CLOSE_*) use .update().eq('id', …)
 *   → last-write wins; only the mobile client writes these fields.
 */

import { supabase } from '../supabase/client'
import type { OperacaoPendente } from '../storage/queueStorage'

export async function syncViagemOp(op: OperacaoPendente): Promise<void> {
  switch (op.tipo) {
    case 'CREATE_VIAGEM': {
      // INSERT INTO fretes … ON CONFLICT (id) DO NOTHING
      // Fields: id, frotaId, caminhaoId, motoristaId?, origem, destino,
      //         tipoCarga, kmInicial, dataInicio, valorBruto, status
      const { error } = await supabase
        .from('fretes')
        .upsert(op.payload, { onConflict: 'id', ignoreDuplicates: true })
      if (error) throw error
      break
    }

    case 'CREATE_TRECHO': {
      // INSERT INTO trechos_km … ON CONFLICT (id) DO NOTHING
      // Fields: id, tipo, kmInicial, ordem, freteId, frotaId, createdAt
      const { error } = await supabase
        .from('trechos_km')
        .upsert(op.payload, { onConflict: 'id', ignoreDuplicates: true })
      if (error) throw error
      break
    }

    case 'CLOSE_TRECHO': {
      // UPDATE trechos_km SET kmFinal, kmRodado, fechadoEm WHERE id = …
      const { id, ...fields } = op.payload as { id: string; [key: string]: unknown }
      const { error } = await supabase
        .from('trechos_km')
        .update(fields)
        .eq('id', id)
      if (error) throw error
      break
    }

    case 'CLOSE_VIAGEM': {
      // UPDATE fretes SET status, dataFim WHERE id = …
      const { id, ...fields } = op.payload as { id: string; [key: string]: unknown }
      const { error } = await supabase
        .from('fretes')
        .update(fields)
        .eq('id', id)
      if (error) throw error
      break
    }

    default:
      break
  }
}
