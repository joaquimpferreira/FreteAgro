// lib/excel/gerarRelatorio.ts — Excel financial report generator
// US6 — FR-036, SC-009 · uses SheetJS (xlsx)
// Server-side only. Returns a Buffer containing the .xlsx bytes.
// Principle IV: all money in centavos; converted to reais for display.

import * as XLSX from 'xlsx'
import type { RelatorioData } from '@/lib/dashboard/aggregates'

// ── Helpers ───────────────────────────────────────────────────────────────────

function r(centavos: number): number {
  return Math.round(centavos) / 100
}

function fmtDate(iso: string | null): string {
  if (!iso) return '-'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

const TIPO_LABEL: Record<string, string> = {
  combustivel:  'Diesel / Combustível',
  borracharia:  'Borracharia',
  patio:        'Pátio',
  pedagio:      'Pedágio',
  oficina:      'Oficina',
  vale:         'Vale',
  adiantamento: 'Adiantamento',
  salario:      'Salário',
  ipva:         'IPVA',
  seguro:       'Seguro',
  outro:        'Outro',
}

const BRL = '"R$ "#,##0.00'
const INT = '#,##0'
const PCT = '0.0%'

// ── Sheet builder ─────────────────────────────────────────────────────────────

type Row = Array<{ v: string | number | null; bold?: boolean; numFmt?: string; align?: string }>

/**
 * Writes rows into a worksheet using cell-address notation (SheetJS standard).
 * Each element in a row is { v, bold?, numFmt?, align? }.
 */
function buildSheet(rows: Row[], colWidths: number[]): XLSX.WorkSheet {
  const ws: XLSX.WorkSheet = {}
  let maxRow = 0
  let maxCol = 0

  for (let ri = 0; ri < rows.length; ri++) {
    const row = rows[ri]
    for (let ci = 0; ci < row.length; ci++) {
      const cell = row[ci]
      if (cell == null) continue
      const addr = XLSX.utils.encode_cell({ r: ri, c: ci })
      const v = cell.v ?? ''
      const t = typeof v === 'number' ? 'n' : 's'
      const xlsCell: XLSX.CellObject = { v, t }
      if (cell.numFmt) xlsCell.z = cell.numFmt
      ws[addr] = xlsCell
      if (ci > maxCol) maxCol = ci
    }
    if (row.length > 0 && maxRow < ri) maxRow = ri
  }

  ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: maxRow, c: maxCol } })
  ws['!cols'] = colWidths.map(wch => ({ wch }))
  return ws
}

// ── Main export ────────────────────────────────────────────────────────────────

export function gerarRelatorioExcel(data: RelatorioData): Buffer {
  const wb = XLSX.utils.book_new()

  const periodoStr = `${fmtDate(data.periodo.from)} a ${fmtDate(data.periodo.to)}`

  // ── Sheet 1: Resumo ────────────────────────────────────────────────────────
  const resumoRows: Row[] = [
    [{ v: 'FreteAgro — Relatório Financeiro', bold: true }],
    [{ v: '' }],
    [{ v: 'Frota' },     { v: data.frotaNome, bold: true }],
    [{ v: 'Período' },   { v: periodoStr }],
    [{ v: 'Fretes' },    { v: data.totalFretes, numFmt: INT }],
    [{ v: 'KM Total' },  { v: data.totalKm, numFmt: INT }],
    [{ v: '' }],
    [{ v: 'RESUMO FINANCEIRO', bold: true }],
    [{ v: '' }],
    [{ v: 'Receita Bruta' },    { v: r(data.totalReceitas),  numFmt: BRL, bold: true }],
    [{ v: 'Total Despesas' },   { v: r(data.totalDespesas),  numFmt: BRL, bold: true }],
    [{ v: 'Comissões Pagas' },  { v: r(data.totalComissoes), numFmt: BRL, bold: true }],
    [{ v: '' }],
    [{ v: 'Lucro Líquido' },    { v: r(data.lucroLiquido),   numFmt: BRL, bold: true }],
    [{ v: 'Margem' },           { v: data.margem / 100,      numFmt: PCT }],
    [{ v: '' }],
    [{ v: 'DESPESAS POR CATEGORIA', bold: true }],
    [{ v: 'Categoria', bold: true }, { v: 'Total (R$)', bold: true }, { v: '% Despesas', bold: true }, { v: '% Receita', bold: true }],
    ...data.despesasPorCategoria.map(c => {
      const pctRec = data.totalReceitas > 0 ? c.total / data.totalReceitas : 0
      return [
        { v: TIPO_LABEL[c.categoria] ?? c.categoria },
        { v: r(c.total), numFmt: BRL },
        { v: c.percentual / 100, numFmt: PCT },
        { v: pctRec, numFmt: PCT },
      ] as Row[number][]
    }),
    [
      { v: 'TOTAL', bold: true },
      { v: r(data.totalDespesas), numFmt: BRL, bold: true },
      { v: 1, numFmt: PCT, bold: true },
      { v: data.totalReceitas > 0 ? data.totalDespesas / data.totalReceitas : 0, numFmt: PCT, bold: true },
    ],
  ]
  XLSX.utils.book_append_sheet(wb, buildSheet(resumoRows, [24, 20, 14, 14]), 'Resumo')

  // ── Sheet 2: Por Viagem ────────────────────────────────────────────────────
  const viagemRows: Row[] = [
    [{ v: 'Por Viagem — ' + periodoStr, bold: true }],
    [{ v: '' }],
    [
      { v: 'Nº', bold: true },
      { v: 'Data', bold: true },
      { v: 'Origem', bold: true },
      { v: 'Destino', bold: true },
      { v: 'Tipo Carga', bold: true },
      { v: 'Caminhão', bold: true },
      { v: 'Motorista', bold: true },
      { v: 'KM Total', bold: true },
      { v: 'Valor Bruto', bold: true },
      { v: 'Diesel', bold: true },
      { v: 'Pedágio', bold: true },
      { v: 'Vale', bold: true },
      { v: 'Adiantamento', bold: true },
      { v: 'Outros', bold: true },
      { v: 'Total Desp.', bold: true },
      { v: 'Comissão %', bold: true },
      { v: 'Comissão R$', bold: true },
      { v: 'Deduções', bold: true },
      { v: 'Saldo Motorista', bold: true },
      { v: 'Lucro Frota', bold: true },
    ],
    ...data.fretes.map(f => [
      { v: f.numero, numFmt: INT },
      { v: fmtDate(f.dataInicio) },
      { v: f.origem },
      { v: f.destino },
      { v: f.tipoCarga },
      { v: f.caminhaoPlaca },
      { v: f.motoristaNome ?? '-' },
      { v: f.kmTotal ?? 0, numFmt: INT },
      { v: r(f.valorBruto), numFmt: BRL },
      { v: r(f.diesel),     numFmt: BRL },
      { v: r(f.pedagio),    numFmt: BRL },
      { v: r(f.vale),       numFmt: BRL },
      { v: r(f.adiantamento), numFmt: BRL },
      { v: r(f.outros),     numFmt: BRL },
      { v: r(f.totalDespesasFrete), numFmt: BRL, bold: true },
      { v: (f.percentualComissao ?? 0) / 100, numFmt: PCT },
      { v: f.valorComissao != null ? r(f.valorComissao) : '', numFmt: BRL },
      { v: f.totalDeducoes != null ? r(f.totalDeducoes) : '', numFmt: BRL },
      { v: f.saldoFinal    != null ? r(f.saldoFinal)    : '', numFmt: BRL },
      { v: r(f.lucroFrota), numFmt: BRL, bold: true },
    ] as Row[number][]),
    // Totals
    [
      { v: 'TOTAL', bold: true }, { v: '' }, { v: '' }, { v: '' }, { v: '' }, { v: '' }, { v: '' },
      { v: data.totalKm, numFmt: INT, bold: true },
      { v: r(data.totalReceitas), numFmt: BRL, bold: true },
      { v: r(data.fretes.reduce((s, f) => s + f.diesel, 0)),       numFmt: BRL, bold: true },
      { v: r(data.fretes.reduce((s, f) => s + f.pedagio, 0)),      numFmt: BRL, bold: true },
      { v: r(data.fretes.reduce((s, f) => s + f.vale, 0)),         numFmt: BRL, bold: true },
      { v: r(data.fretes.reduce((s, f) => s + f.adiantamento, 0)), numFmt: BRL, bold: true },
      { v: r(data.fretes.reduce((s, f) => s + f.outros, 0)),       numFmt: BRL, bold: true },
      { v: r(data.totalDespesas),  numFmt: BRL, bold: true },
      { v: '' },
      { v: r(data.totalComissoes), numFmt: BRL, bold: true },
      { v: '' },
      { v: '' },
      { v: r(data.lucroLiquido), numFmt: BRL, bold: true },
    ],
  ]
  XLSX.utils.book_append_sheet(wb, buildSheet(viagemRows, [
    5, 12, 22, 22, 14, 10, 20, 10,
    13, 13, 13, 13, 14, 13, 13, 12, 13, 13, 15, 13,
  ]), 'Por Viagem')

  // ── Sheet 3: Despesas Detalhadas ──────────────────────────────────────────
  const despRows: Row[] = [
    [{ v: 'Despesas Detalhadas — ' + periodoStr, bold: true }],
    [{ v: '' }],
    [
      { v: 'Nº Viagem', bold: true },
      { v: 'Data', bold: true },
      { v: 'Rota', bold: true },
      { v: 'Caminhão', bold: true },
      { v: 'Motorista', bold: true },
      { v: 'Categoria', bold: true },
      { v: 'Valor (R$)', bold: true },
    ],
  ]

  for (const f of data.fretes) {
    const rota = `${f.origem} → ${f.destino}`
    const cats = [
      { tipo: 'combustivel',  valor: f.diesel },
      { tipo: 'pedagio',      valor: f.pedagio },
      { tipo: 'vale',         valor: f.vale },
      { tipo: 'adiantamento', valor: f.adiantamento },
      { tipo: 'outro',        valor: f.outros },
    ].filter(c => c.valor > 0)

    for (const cat of cats) {
      despRows.push([
        { v: f.numero, numFmt: INT },
        { v: fmtDate(f.dataInicio) },
        { v: rota },
        { v: f.caminhaoPlaca },
        { v: f.motoristaNome ?? '-' },
        { v: TIPO_LABEL[cat.tipo] ?? cat.tipo },
        { v: r(cat.valor), numFmt: BRL },
      ])
    }
  }

  if (data.lancamentosAvulsos.length > 0) {
    despRows.push([{ v: 'DESPESAS AVULSAS (sem frete)', bold: true }])
    for (const l of data.lancamentosAvulsos) {
      despRows.push([
        { v: '-' }, { v: '-' }, { v: 'Avulso' }, { v: '-' }, { v: '-' },
        { v: TIPO_LABEL[l.tipo] ?? l.tipo },
        { v: r(l.valor), numFmt: BRL },
      ])
    }
  }

  XLSX.utils.book_append_sheet(wb, buildSheet(despRows, [10, 12, 32, 12, 20, 22, 14]), 'Despesas Detalhadas')

  // ── Sheet 4: Acertos dos Motoristas ──────────────────────────────────────
  const acertoRows: Row[] = [
    [{ v: 'Acertos dos Motoristas — ' + periodoStr, bold: true }],
    [{ v: '' }],
    [
      { v: 'Motorista', bold: true },
      { v: 'Fretes no Período', bold: true },
      { v: 'Total Comissão', bold: true },
      { v: 'Total Deduções', bold: true },
      { v: 'Saldo a Pagar', bold: true },
    ],
    ...data.motoristas.map(m => [
      { v: m.nome, bold: true },
      { v: m.totalFretes, numFmt: INT },
      { v: r(m.totalComissao), numFmt: BRL },
      { v: r(m.totalDeducoes), numFmt: BRL },
      { v: r(m.saldoFinal),    numFmt: BRL, bold: true },
    ] as Row[number][]),
    [
      { v: 'TOTAL', bold: true },
      { v: data.totalFretes, numFmt: INT, bold: true },
      { v: r(data.totalComissoes), numFmt: BRL, bold: true },
      { v: r(data.motoristas.reduce((s, m) => s + m.totalDeducoes, 0)), numFmt: BRL, bold: true },
      { v: r(data.motoristas.reduce((s, m) => s + m.saldoFinal, 0)),    numFmt: BRL, bold: true },
    ],
  ]
  XLSX.utils.book_append_sheet(wb, buildSheet(acertoRows, [24, 18, 18, 18, 18]), 'Acertos Motoristas')

  // ── Sheet 5: Por Categoria ────────────────────────────────────────────────
  const catRows2: Row[] = [
    [{ v: 'Despesas por Categoria — ' + periodoStr, bold: true }],
    [{ v: '' }],
    [
      { v: 'Categoria', bold: true },
      { v: 'Total (R$)', bold: true },
      { v: '% das Despesas', bold: true },
      { v: '% da Receita', bold: true },
    ],
    ...data.despesasPorCategoria.map(c => {
      const pctRec = data.totalReceitas > 0 ? c.total / data.totalReceitas : 0
      return [
        { v: TIPO_LABEL[c.categoria] ?? c.categoria },
        { v: r(c.total), numFmt: BRL },
        { v: c.percentual / 100, numFmt: PCT },
        { v: pctRec, numFmt: PCT },
      ] as Row[number][]
    }),
    [
      { v: 'TOTAL', bold: true },
      { v: r(data.totalDespesas), numFmt: BRL, bold: true },
      { v: 1, numFmt: PCT, bold: true },
      { v: data.totalReceitas > 0 ? data.totalDespesas / data.totalReceitas : 0, numFmt: PCT, bold: true },
    ],
  ]
  XLSX.utils.book_append_sheet(wb, buildSheet(catRows2, [26, 16, 16, 16]), 'Por Categoria')

  // ── Write ─────────────────────────────────────────────────────────────────
  const arrayBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  return Buffer.from(arrayBuffer)
}

