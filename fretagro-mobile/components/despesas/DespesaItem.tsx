// components/despesas/DespesaItem.tsx
// Read-only expense or refuel row, for trip history.
// Handles both Lancamento (general expense) and Abastecimento (fuel).
//
// The per-type color coding this row used to carry is gone. It assigned five
// different hues to expense types on a screen read in direct sun, where the
// driver cannot reliably tell them apart and where hue meant nothing anyway —
// a pedágio is not "muted" and an oficina is not "destructive". The type is
// now a written chip, and the only figure that carries color is the money.
//
// The receipt thumbnail renders only when the parent has resolved a signed URL
// for the storage path (private bucket).
//
// Layer: components — imports from components/ui and @fretagro/types only.

import { View, Image } from 'react-native'
import type { TipoLancamento, SubtipoAbastecimento } from '@fretagro/types'
import { Text } from '../ui/Text'
import { Chip } from '../ui/Chip'
import { Surface } from '../ui/Surface'
import { formatLitros, formatPrecoLitro, formatReais } from '../../lib/utils/format'
import { shape, space } from '../../lib/theme'
import { makeStyles } from '../../lib/theme/ThemeProvider'

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

const SUBTIPO_LABELS: Record<SubtipoAbastecimento, string> = {
  diesel: 'Diesel',
  arla: 'Arla 32',
}

interface DespesaItemBase {
  /** Centavos. */
  valor: number
  descricao?: string
  /**
   * Signed URL resolved at display time by the parent screen.
   * NOT a raw storage path — the bucket is private.
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

export function DespesaItem(props: DespesaItemProps) {
  const styles = useStyles()
  const { valor, descricao, signedPhotoUrl } = props

  const label =
    props.kind === 'abastecimento'
      ? SUBTIPO_LABELS[props.subtipo]
      : LANCAMENTO_LABELS[props.tipo]

  return (
    <Surface level={1} radius="medium" padding="base" style={styles.card}>
      <View style={styles.header}>
        <Chip
          label={label}
          tone="neutral"
          icon={props.kind === 'abastecimento' ? 'water-outline' : 'receipt-outline'}
        />
        <Text role="figureSmall">{formatReais(valor)}</Text>
      </View>

      {props.kind === 'abastecimento' && (
        <Text role="bodySmall" tone="variant">
          {formatLitros(props.litros)} × {formatPrecoLitro(props.precoPorLitro)}
        </Text>
      )}

      {descricao != null && descricao !== '' && (
        <Text role="bodyMedium" tone="variant">
          {descricao}
        </Text>
      )}

      {signedPhotoUrl != null && (
        <Image
          source={{ uri: signedPhotoUrl }}
          style={styles.photo}
          resizeMode="cover"
          accessibilityLabel={`Foto da nota de ${label}`}
        />
      )}
    </Surface>
  )
}

const useStyles = makeStyles(({ colors }) => ({
  card: {
    gap: space.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
  photo: {
    width: '100%',
    height: 160,
    borderRadius: shape.small,
    backgroundColor: colors.surfaceContainerHigh,
    marginTop: space.xs,
  },
}))
