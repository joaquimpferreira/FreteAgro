// lib/pdf/gerarRelatorio.ts — PDF financial report generator
// US6 — FR-036, SC-009 · jsPDF (Node.js compatible)
// Server-side only. Returns a Buffer containing the PDF bytes.
// Principle IV: all money in centavos; converted to reais via formatMoeda.

import { jsPDF } from 'jspdf'
import { formatMoeda } from '@/lib/finance/formatMoeda'
import type { RelatorioData } from '@/lib/dashboard/aggregates'

// ── Constants ─────────────────────────────────────────────────────────────────

const PAGE_W  = 297  // A4 landscape width  (mm)
const PAGE_H  = 210  // A4 landscape height (mm)
const M       = 14   // margin
const C_W     = PAGE_W - M * 2  // content width

// Brand palette (RGB)
const BRAND   = [26,  86, 219] as const   // blue-600
const DARK    = [15,  23,  42] as const   // slate-900
const MUTED   = [100,116,139] as const    // slate-500
const GREEN   = [22, 163, 74] as const    // green-600
const RED     = [220, 38,  38] as const   // red-600
const ORANGE  = [234, 88,  12] as const   // orange-600
const ALT     = [241,245,249] as const    // slate-100 (alt row)
const WHITE   = [255,255,255] as const
const BORDER  = [203,213,225] as const    // slate-300

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

// ── Helpers ───────────────────────────────────────────────────────────────────

type RGB = readonly [number, number, number]

function fmtDate(iso: string | null): string {
  if (!iso) return '-'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function fmtKm(n: number | null): string {
  if (n == null) return '-'
  return n.toLocaleString('pt-BR') + ' km'
}

function fmtPct(n: number): string {
  return n.toFixed(1) + '%'
}

// ── Types ───────────────────────────────────────────────────────────────────────

type TableCell = { text: string; color?: RGB; bold?: boolean }

// ── PDF class wrapper ─────────────────────────────────────────────────────────

class Report {
  doc: jsPDF
  y = 0

  constructor() {
    this.doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  }

  setColor(rgb: RGB, type: 'fill' | 'text' | 'draw' = 'text') {
    if (type === 'fill') this.doc.setFillColor(rgb[0], rgb[1], rgb[2])
    else if (type === 'draw') this.doc.setDrawColor(rgb[0], rgb[1], rgb[2])
    else this.doc.setTextColor(rgb[0], rgb[1], rgb[2])
  }

  text(str: string, x: number, opts: { align?: 'left'|'right'|'center'; maxWidth?: number } = {}) {
    this.doc.text(str, x, this.y, { align: opts.align ?? 'left', maxWidth: opts.maxWidth })
  }

  needsPage(needed = 10) {
    if (this.y + needed > PAGE_H - 12) {
      this.doc.addPage()
      this.y = M
      return true
    }
    return false
  }

  hLine(color: RGB = BORDER) {
    this.setColor(color, 'draw')
    this.doc.setLineWidth(0.2)
    this.doc.line(M, this.y, M + C_W, this.y)
  }

  sectionTitle(title: string) {
    this.needsPage(14)
    this.y += 6
    this.doc.setFontSize(11)
    this.doc.setFont('helvetica', 'bold')
    this.setColor(DARK)
    this.doc.text(title, M, this.y)
    this.y += 2
    this.hLine(BRAND)
    this.y += 5
  }

  // Draws a table. Returns the new y position.
  table(headers: Array<{ label: string; w: number; align?: 'left'|'right'|'center' }>,
        rows: Array<Array<TableCell>>,
        rowH = 6.5) {

    const headerH = 7

    const drawRow = (
      cells: Array<TableCell>,
      rowY: number,
      bg: RGB | null,
    ) => {
      let x = M
      if (bg) {
        this.setColor(bg, 'fill')
        this.doc.rect(M, rowY - rowH + 1.5, C_W, rowH, 'F')
      }
      for (let ci = 0; ci < headers.length; ci++) {
        const h = headers[ci]
        const cell = cells[ci] ?? { text: '' }
        this.doc.setFontSize(7.5)
        this.doc.setFont('helvetica', cell.bold ? 'bold' : 'normal')
        this.setColor(cell.color ?? DARK)
        // clip text to column width
        const maxW = h.w - 2
        const align = h.align ?? 'left'
        const tx = align === 'right' ? x + h.w - 1 : align === 'center' ? x + h.w / 2 : x + 1
        this.doc.text(cell.text, tx, rowY, { align, maxWidth: maxW })
        x += h.w
      }
      // bottom border
      this.setColor(BORDER, 'draw')
      this.doc.setLineWidth(0.15)
      this.doc.line(M, rowY + 1.5, M + C_W, rowY + 1.5)
    }

    // Header
    this.needsPage(headerH + rowH)
    this.setColor(BRAND, 'fill')
    this.doc.rect(M, this.y, C_W, headerH, 'F')
    let hx = M
    for (const h of headers) {
      this.doc.setFontSize(8)
      this.doc.setFont('helvetica', 'bold')
      this.setColor(WHITE)
      const tx = h.align === 'right' ? hx + h.w - 1 : h.align === 'center' ? hx + h.w / 2 : hx + 1
      this.doc.text(h.label, tx, this.y + 4.5, { align: h.align ?? 'left', maxWidth: h.w - 2 })
      hx += h.w
    }
    this.y += headerH

    // Data rows
    for (let ri = 0; ri < rows.length; ri++) {
      this.needsPage(rowH + 2)
      drawRow(rows[ri], this.y + rowH - 1.5, ri % 2 === 1 ? ALT : null)
      this.y += rowH
    }
    this.y += 2
  }
}

// ── Cover band & header ────────────────────────────────────────────────────────

function drawCover(rep: Report, data: RelatorioData) {
  const doc = rep.doc

  // Top brand band
  rep.setColor(BRAND, 'fill')
  doc.rect(0, 0, PAGE_W, 28, 'F')

  // Logo area text
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  rep.setColor(WHITE)
  doc.text('FreteAgro', M, 13)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Relatório Financeiro', M, 20)

  // Right: fleet & period
  doc.setFontSize(9)
  rep.setColor([200, 220, 255])
  doc.text(data.frotaNome, PAGE_W - M, 10, { align: 'right' })
  doc.text(`${fmtDate(data.periodo.from)} a ${fmtDate(data.periodo.to)}`, PAGE_W - M, 16, { align: 'right' })
  doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')}`, PAGE_W - M, 22, { align: 'right' })

  rep.y = 36
}

// ── KPI cards ─────────────────────────────────────────────────────────────────

function drawKpis(rep: Report, data: RelatorioData) {
  const doc = rep.doc

  const cards: Array<{ label: string; value: string; color: RGB; sub?: string }> = [
    { label: 'Receita Bruta',   value: formatMoeda(data.totalReceitas),  color: GREEN },
    { label: 'Total Despesas',  value: formatMoeda(data.totalDespesas),  color: RED },
    { label: 'Comissões Pagas', value: formatMoeda(data.totalComissoes), color: ORANGE },
    { label: 'Lucro Líquido',   value: formatMoeda(data.lucroLiquido),   color: data.lucroLiquido >= 0 ? GREEN : RED, sub: `Margem ${fmtPct(data.margem)}` },
    { label: 'Total Fretes',    value: String(data.totalFretes),         color: BRAND },
    { label: 'KM Rodados',      value: fmtKm(data.totalKm),              color: BRAND },
  ]

  const cardW  = C_W / cards.length
  const cardH  = 22
  let cx = M

  for (const c of cards) {
    // card bg
    rep.setColor(WHITE, 'fill')
    rep.setColor(BORDER, 'draw')
    doc.setLineWidth(0.3)
    doc.roundedRect(cx, rep.y, cardW - 2, cardH, 2, 2, 'FD')

    // color top stripe
    rep.setColor(c.color, 'fill')
    doc.rect(cx, rep.y, cardW - 2, 3, 'F')

    // label
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'normal')
    rep.setColor(MUTED)
    doc.text(c.label, cx + 3, rep.y + 9)

    // value
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    rep.setColor(c.color)
    doc.text(c.value, cx + (cardW - 2) / 2, rep.y + 16, { align: 'center', maxWidth: cardW - 6 })

    // sub
    if (c.sub) {
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      rep.setColor(MUTED)
      doc.text(c.sub, cx + (cardW - 2) / 2, rep.y + 20, { align: 'center' })
    }

    cx += cardW
  }
  rep.y += cardH + 6
}

// ── Main ───────────────────────────────────────────────────────────────────────

export function gerarRelatorioPdf(data: RelatorioData): Buffer {
  const rep = new Report()

  drawCover(rep, data)
  drawKpis(rep, data)

  // ── Section 1: Por Viagem ─────────────────────────────────────────────────
  rep.sectionTitle('Viagens no Período')

  const viagemHeaders = [
    { label: 'Nº',          w: 8,  align: 'center' as const },
    { label: 'Data',        w: 18, align: 'center' as const },
    { label: 'Origem → Destino', w: 48 },
    { label: 'Placa',       w: 15, align: 'center' as const },
    { label: 'Motorista',   w: 30 },
    { label: 'KM',          w: 16, align: 'right'  as const },
    { label: 'Bruto',       w: 22, align: 'right'  as const },
    { label: 'Diesel',      w: 18, align: 'right'  as const },
    { label: 'Pedágio',     w: 18, align: 'right'  as const },
    { label: 'Outros',      w: 16, align: 'right'  as const },
    { label: 'Comissão',    w: 20, align: 'right'  as const },
    { label: 'Lucro Frota', w: 0,  align: 'right'  as const },
  ]
  // fill last column width
  const usedW = viagemHeaders.slice(0, -1).reduce((s, h) => s + h.w, 0)
  viagemHeaders[viagemHeaders.length - 1].w = C_W - usedW

  const viagemRows: TableCell[][] = data.fretes.map(f => [
    { text: String(f.numero) },
    { text: fmtDate(f.dataInicio) },
    { text: `${f.origem} → ${f.destino}` },
    { text: f.caminhaoPlaca },
    { text: f.motoristaNome ?? '-' },
    { text: f.kmTotal != null ? f.kmTotal.toLocaleString('pt-BR') : '-' },
    { text: formatMoeda(f.valorBruto), color: GREEN as RGB },
    { text: f.diesel    > 0 ? formatMoeda(f.diesel)    : '-' },
    { text: f.pedagio   > 0 ? formatMoeda(f.pedagio)   : '-' },
    { text: f.outros + f.vale + f.adiantamento > 0
        ? formatMoeda(f.outros + f.vale + f.adiantamento) : '-' },
    { text: f.valorComissao != null ? formatMoeda(f.valorComissao) : '-', color: ORANGE as RGB },
    { text: formatMoeda(f.lucroFrota), bold: true, color: (f.lucroFrota >= 0 ? GREEN : RED) as RGB },
  ])

  // Totals row
  viagemRows.push([
    { text: 'TOTAL', bold: true },
    { text: '' }, { text: '' }, { text: '' }, { text: '' },
    { text: fmtKm(data.totalKm), bold: true },
    { text: formatMoeda(data.totalReceitas), bold: true, color: GREEN as RGB },
    { text: formatMoeda(data.fretes.reduce((s, f) => s + f.diesel, 0)) },
    { text: formatMoeda(data.fretes.reduce((s, f) => s + f.pedagio, 0)) },
    { text: formatMoeda(data.fretes.reduce((s, f) => s + f.outros + f.vale + f.adiantamento, 0)) },
    { text: formatMoeda(data.totalComissoes), color: ORANGE as RGB, bold: true },
    { text: formatMoeda(data.lucroLiquido), bold: true, color: (data.lucroLiquido >= 0 ? GREEN : RED) as RGB },
  ])

  rep.table(viagemHeaders, viagemRows)

  // ── Section 2: Despesas por Categoria ─────────────────────────────────────
  rep.needsPage(40)
  rep.sectionTitle('Despesas por Categoria')

  const colW = (C_W - 60) / 2
  const catHeaders = [
    { label: 'Categoria',        w: 60 },
    { label: 'Total',            w: colW, align: 'right'  as const },
    { label: '% Despesas',       w: colW, align: 'right'  as const },
    { label: '% Receita',        w: 0,    align: 'right'  as const },
  ]
  catHeaders[3].w = C_W - 60 - colW * 2

  const catRows: TableCell[][] = data.despesasPorCategoria.map(c => {
    const pctRec = data.totalReceitas > 0
      ? Math.round((c.total / data.totalReceitas) * 1000) / 10
      : 0
    return [
      { text: TIPO_LABEL[c.categoria] ?? c.categoria },
      { text: formatMoeda(c.total), color: RED as RGB },
      { text: fmtPct(c.percentual) },
      { text: fmtPct(pctRec) },
    ]
  })
  catRows.push([
    { text: 'TOTAL', bold: true },
    { text: formatMoeda(data.totalDespesas), bold: true, color: RED as RGB },
    { text: '100%', bold: true },
    { text: fmtPct(data.totalReceitas > 0 ? Math.round(data.totalDespesas / data.totalReceitas * 1000) / 10 : 0), bold: true },
  ])
  rep.table(catHeaders, catRows)

  // ── Section 3: Acertos dos Motoristas ────────────────────────────────────
  if (data.motoristas.length > 0) {
    rep.needsPage(30)
    rep.sectionTitle('Acertos dos Motoristas')

    const mColW = C_W / 5
    const motHeaders = [
      { label: 'Motorista',         w: mColW * 1.5 },
      { label: 'Fretes',            w: mColW * 0.5, align: 'center' as const },
      { label: 'Total Comissão',    w: mColW, align: 'right' as const },
      { label: 'Total Deduções',    w: mColW, align: 'right' as const },
      { label: 'Saldo a Pagar',     w: 0,     align: 'right' as const },
    ]
    motHeaders[4].w = C_W - mColW * 1.5 - mColW * 0.5 - mColW * 2
    const motRows: TableCell[][] = data.motoristas.map(m => [
      { text: m.nome, bold: true },
      { text: String(m.totalFretes) },
      { text: formatMoeda(m.totalComissao), color: ORANGE as RGB },
      { text: formatMoeda(m.totalDeducoes) },
      { text: formatMoeda(m.saldoFinal), bold: true, color: (m.saldoFinal >= 0 ? GREEN : RED) as RGB },
    ])
    motRows.push([
      { text: 'TOTAL', bold: true },
      { text: String(data.totalFretes), bold: true },
      { text: formatMoeda(data.totalComissoes), bold: true, color: ORANGE as RGB },
      { text: formatMoeda(data.motoristas.reduce((s, m) => s + m.totalDeducoes, 0)), bold: true },
      { text: formatMoeda(data.motoristas.reduce((s, m) => s + m.saldoFinal, 0)), bold: true },
    ])
    rep.table(motHeaders, motRows)
  }

  // ── Footer on every page ──────────────────────────────────────────────────
  const totalPages = (rep.doc.internal as { getNumberOfPages?: () => number }).getNumberOfPages?.() ?? 1
  for (let p = 1; p <= totalPages; p++) {
    rep.doc.setPage(p)
    rep.setColor([203, 213, 225], 'draw')
    rep.doc.setLineWidth(0.3)
    rep.doc.line(M, PAGE_H - 10, PAGE_W - M, PAGE_H - 10)
    rep.doc.setFontSize(7)
    rep.doc.setFont('helvetica', 'normal')
    rep.setColor(MUTED)
    rep.doc.text(
      `FreteAgro — ${data.frotaNome} — ${fmtDate(data.periodo.from)} a ${fmtDate(data.periodo.to)}`,
      M, PAGE_H - 6,
    )
    rep.doc.text(`Pág. ${p} / ${totalPages}`, PAGE_W - M, PAGE_H - 6, { align: 'right' })
  }

  const arrayBuffer = rep.doc.output('arraybuffer')
  return Buffer.from(arrayBuffer)
}
