// components/dashboard/ExtratoTable.tsx — Period cash-flow statement table (US5)
// Displays receitas and despesas rows for the selected period.
// Server Component — no interactivity; data passed as props.

import { formatMoeda } from '@/lib/finance/formatMoeda'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// ─── TIPO label map ───────────────────────────────────────────────────────────

const TIPO_LABELS: Record<string, string> = {
  entrada:      'Receita de Frete',
  comissao:     'Comissão Motorista',
  combustivel:  'Combustível',
  borracharia:  'Borracharia',
  patio:        'Pátio',
  pedagio:      'Pedágio',
  oficina:      'Oficina',
  vale:         'Vale',
  adiantamento: 'Adiantamento',
  salario:      'Salário',
  ipva:         'IPVA',
  seguro:       'Seguro',
  manutencao:   'Manutenção',
  outro:        'Outro',
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ExtratoReceitaItem {
  freteId: string
  valor: number
  data: string
}

export interface ExtratoCategoriaItem {
  categoria: string
  total: number
  percentual: number
}

interface ExtratoTableProps {
  receitas: { total: number; itens: ExtratoReceitaItem[] }
  despesasPorCategoria: ExtratoCategoriaItem[]
  totalDespesas: number
  lucroLiquido: number
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ExtratoTable({
  receitas,
  despesasPorCategoria,
  totalDespesas,
  lucroLiquido,
}: ExtratoTableProps) {
  const isLucro = lucroLiquido >= 0

  return (
    <div className="rounded-card border border-grey-800 bg-surface">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Descrição</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead className="text-right hidden sm:table-cell">%</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {/* ── Receitas section ─────────────────────────────────────────── */}
          <TableRow className="bg-surface-elevated/30 pointer-events-none">
            <TableCell
              colSpan={3}
              className="py-2 px-4 text-caption font-semibold uppercase tracking-wider text-grey-400"
            >
              Entradas
            </TableCell>
          </TableRow>
          {receitas.itens.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-grey-500 italic">
                Nenhuma receita neste período.
              </TableCell>
            </TableRow>
          ) : (
            receitas.itens.map((item) => (
              <TableRow key={item.freteId}>
                <TableCell>
                  <span className="font-medium text-grey-100">Receita de Frete</span>
                  <span className="block text-caption text-grey-500">{item.data}</span>
                </TableCell>
                <TableCell className="text-right font-semibold text-success-400">
                  + {formatMoeda(item.valor)}
                </TableCell>
                <TableCell className="text-right text-grey-400 hidden sm:table-cell">—</TableCell>
              </TableRow>
            ))
          )}

          {/* ── Subtotal receitas ─────────────────────────────────────────── */}
          <TableRow className="bg-surface-elevated/20 pointer-events-none">
            <TableCell className="font-semibold text-grey-200">Total Receitas</TableCell>
            <TableCell className="text-right font-bold text-success-400">
              {formatMoeda(receitas.total)}
            </TableCell>
            <TableCell className="hidden sm:table-cell" />
          </TableRow>

          {/* ── Despesas section ─────────────────────────────────────────── */}
          <TableRow className="bg-surface-elevated/30 pointer-events-none">
            <TableCell
              colSpan={3}
              className="py-2 px-4 text-caption font-semibold uppercase tracking-wider text-grey-400"
            >
              Saídas
            </TableCell>
          </TableRow>
          {despesasPorCategoria.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-grey-500 italic">
                Nenhuma despesa neste período.
              </TableCell>
            </TableRow>
          ) : (
            despesasPorCategoria.map((cat) => (
              <TableRow key={cat.categoria}>
                <TableCell className="font-medium text-grey-100">
                  {TIPO_LABELS[cat.categoria] ?? cat.categoria}
                </TableCell>
                <TableCell className="text-right font-semibold text-brand-orange">
                  − {formatMoeda(cat.total)}
                </TableCell>
                <TableCell className="text-right text-grey-400 hidden sm:table-cell">
                  {cat.percentual.toFixed(1)}%
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>

        {/* ── Footer: totals ────────────────────────────────────────────────── */}
        <TableFooter>
          <TableRow>
            <TableCell className="font-semibold text-grey-200">Total Despesas</TableCell>
            <TableCell className="text-right font-bold text-brand-orange">
              − {formatMoeda(totalDespesas)}
            </TableCell>
            <TableCell className="hidden sm:table-cell" />
          </TableRow>
          <TableRow>
            <TableCell className="font-bold text-grey-50 text-p-md">Lucro Líquido</TableCell>
            <TableCell
              className={`text-right font-bold text-p-md ${
                isLucro ? 'text-success-400' : 'text-error-400'
              }`}
            >
              {formatMoeda(lucroLiquido)}
            </TableCell>
            <TableCell className="hidden sm:table-cell" />
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  )
}
