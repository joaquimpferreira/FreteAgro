// components/dashboard/FretesRecentesTable.tsx — Recent freights mini-table (US6, FR-033)
// Displays the last 5 freights with status, route, and driver info.
// Server Component — no interactivity; data passed as props.

import Link from 'next/link'
import { formatMoeda } from '@/lib/finance/formatMoeda'
import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export interface FretesRecentesItem {
  id: string
  origem: string
  destino: string
  status: string
  valorBruto: number
  dataInicio: string
  motoristaNome: string | null
  caminhaoPlaca: string
}

interface FretesRecentesTableProps {
  fretes: FretesRecentesItem[]
}

const STATUS_LABELS: Record<string, string> = {
  em_andamento:    'Em andamento',
  concluido:       'Concluído',
  acerto_pendente: 'Acerto pendente',
  acerto_realizado:'Acerto realizado',
}

const STATUS_CLASSES: Record<string, string> = {
  em_andamento:    'border-blue-400/30 bg-blue-400/10 text-blue-300',
  concluido:       'border-success-400/30 bg-success-400/10 text-success-300',
  acerto_pendente: 'border-warning-400/30 bg-warning-400/10 text-warning-300',
  acerto_realizado:'border-primary/30 bg-primary/10 text-primary',
}

export function FretesRecentesTable({ fretes }: FretesRecentesTableProps) {
  if (fretes.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Nenhum frete registrado ainda.
      </p>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="h-8">Rota</TableHead>
          <TableHead className="hidden h-8 sm:table-cell">Motorista</TableHead>
          <TableHead className="hidden h-8 md:table-cell">Placa</TableHead>
          <TableHead className="hidden h-8 sm:table-cell">Data</TableHead>
          <TableHead className="h-8">Status</TableHead>
          <TableHead className="h-8 text-right">Valor</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {fretes.map((f) => (
          <TableRow key={f.id}>
            <TableCell className="py-1.5">
              <Link
                href={`/fretes/${f.id}`}
                className="font-medium text-foreground hover:text-primary hover:underline"
              >
                {f.origem} → {f.destino}
              </Link>
            </TableCell>
            <TableCell className="hidden py-1.5 sm:table-cell text-muted-foreground">
              {f.motoristaNome ?? '—'}
            </TableCell>
            <TableCell className="hidden py-1.5 md:table-cell text-muted-foreground">
              {f.caminhaoPlaca}
            </TableCell>
            <TableCell className="hidden py-1.5 sm:table-cell text-muted-foreground">
              {new Date(f.dataInicio).toLocaleDateString('pt-BR')}
            </TableCell>
            <TableCell className="py-1.5">
              <Badge
                variant="outline"
                className={cn(STATUS_CLASSES[f.status])}
              >
                {STATUS_LABELS[f.status] ?? f.status}
              </Badge>
            </TableCell>
            <TableCell className="py-1.5 text-right tabular-nums font-medium">
              {formatMoeda(f.valorBruto)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
