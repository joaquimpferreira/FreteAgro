// components/despesas/DespesaItem.tsx
// Read-only expense/refuel row for history display.
// Handles both Lancamento (general expense) and Abastecimento (fuel refuel).
// Optional receipt photo thumbnail: rendered only when fotoUrl (storage path) is present
// and a signed URL has been resolved by the parent for display (private bucket).
// Layer: components — imports from components/ui and @fretagro/types only.

import { View, Text, Image } from 'react-native'
import type { TipoLancamento, SubtipoAbastecimento } from '@fretagro/types'
import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'

type BadgeVariant = 'default' | 'success' | 'warning' | 'destructive' | 'muted'

// ─────────────────────────────────────────────────────────────────────────────
// Label maps
// ─────────────────────────────────────────────────────────────────────────────
const LANCAMENTO_LABELS: Record<TipoLancamento, string> = {
  combustivel: 'Combustível',
  borracharia: 'Borracharia',
  patio: 'Pátio',
  pedagio: 'Pedágio',
  oficina: 'Oficina',
  vale: 'Vale',
  adiantamento: 'Adiantamento',
  salario: 'Salário',
  ipva: 'IPVA',
  seguro: 'Seguro',
  outro: 'Outro',
}

const LANCAMENTO_VARIANT: Record<TipoLancamento, BadgeVariant> = {
  combustivel: 'warning',
  borracharia: 'destructive',
  patio: 'muted',
  pedagio: 'muted',
  oficina: 'destructive',
  vale: 'default',
  adiantamento: 'default',
  salario: 'success',
  ipva: 'muted',
  seguro: 'muted',
  outro: 'default',
}

const SUBTIPO_LABELS: Record<SubtipoAbastecimento, string> = {
  diesel: 'Diesel',
  arla: 'Arla 32',
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function centavosToReais(centavos: number): string {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────
interface DespesaItemBase {
  valor: number // centavos
  descricao?: string
  /**
   * Signed URL resolved at display time by the parent screen.
   * NOT a raw storage path (private bucket — paths must be converted via createSignedUrl).
   */
  signedPhotoUrl?: string | null
}

interface LancamentoItem extends DespesaItemBase {
  kind: 'lancamento'
  tipo: TipoLancamento
}

interface AbastecimentoItem extends DespesaItemBase {
  kind: 'abastecimento'
  subtipo: SubtipoAbastecimento
  litros: number
  precoPorLitro: number
}

export type DespesaItemProps = LancamentoItem | AbastecimentoItem

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export function DespesaItem(props: DespesaItemProps) {
  const { valor, descricao, signedPhotoUrl } = props

  const badgeLabel =
    props.kind === 'abastecimento'
      ? SUBTIPO_LABELS[props.subtipo]
      : LANCAMENTO_LABELS[props.tipo]

  const badgeVariant: BadgeVariant =
    props.kind === 'abastecimento' ? 'warning' : LANCAMENTO_VARIANT[props.tipo]

  return (
    <Card className="gap-3">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2 flex-1">
          <Badge label={badgeLabel} variant={badgeVariant} />
          {props.kind === 'abastecimento' && (
            <Text className="text-gray-400 text-xs">
              {props.litros.toFixed(2)} L × R${props.precoPorLitro.toFixed(3)}/L
            </Text>
          )}
        </View>
        <Text className="text-white font-semibold text-base">
          {centavosToReais(valor)}
        </Text>
      </View>

      {descricao ? (
        <Text className="text-gray-400 text-sm">{descricao}</Text>
      ) : null}

      {signedPhotoUrl ? (
        <Image
          source={{ uri: signedPhotoUrl }}
          className="w-full rounded-xl"
          style={{ height: 140 }}
          resizeMode="cover"
        />
      ) : null}
    </Card>
  )
}
