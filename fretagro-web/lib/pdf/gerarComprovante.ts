// PDF receipt generator for driver settlement (acerto) — FR-025, SC-006
// Uses jsPDF. Server-side only (no "use client").
// Returns a Buffer containing the PDF bytes.
// Principle IV: all money is centavos; display via formatMoeda.

import { jsPDF } from 'jspdf';
import { formatMoeda } from '../finance/formatMoeda';

export interface DeducaoComprovante {
  tipo: string;
  descricao: string | null;
  valor: number; // centavos
}

export interface ComprovanteInput {
  // Driver
  motoristaNome: string;
  motoristaWhatsapp: string;
  percentualComissao: number;

  // Freight
  freteId: string;
  origem: string;
  destino: string;
  tipoCarga: string;
  dataInicio: Date;
  dataFim: Date | null;

  // Settlement
  acertoId: string;
  valorFrete: number; // centavos
  valorComissao: number; // centavos
  deducoes: DeducaoComprovante[];
  totalDeducoes: number; // centavos
  saldoFinal: number; // centavos
  createdAt: Date;
}

/**
 * Generates a PDF receipt for a driver settlement.
 * Returns the PDF as a Buffer for upload to Supabase Storage.
 */
export function gerarComprovante(input: ComprovanteInput): Buffer {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  const line = (extraY = 4) => {
    y += extraY;
    doc.setDrawColor(200);
    doc.line(margin, y, margin + contentWidth, y);
    y += 4;
  };

  const text = (label: string, value: string, bold = false) => {
    doc.setFontSize(10);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.text(label, margin, y);
    doc.text(value, margin + contentWidth, y, { align: 'right' });
    y += 6;
  };

  const heading = (title: string) => {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin, y);
    y += 7;
  };

  // ── Header ──────────────────────────────────────────────────────────────────
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('FreteAgro', margin, y);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Comprovante de Acerto', margin + contentWidth, y, { align: 'right' });
  y += 4;
  line();

  // ── Driver info ──────────────────────────────────────────────────────────────
  heading('Motorista');
  text('Nome', input.motoristaNome);
  text('WhatsApp', input.motoristaWhatsapp);
  text('Comissão', `${input.percentualComissao}%`);
  line();

  // ── Freight info ─────────────────────────────────────────────────────────────
  heading('Frete');
  text('ID do Frete', input.freteId.slice(-8).toUpperCase());
  text('Rota', `${input.origem} → ${input.destino}`);
  text('Tipo de Carga', input.tipoCarga);
  text('Data Início', input.dataInicio.toLocaleDateString('pt-BR'));
  if (input.dataFim) {
    text('Data Fim', input.dataFim.toLocaleDateString('pt-BR'));
  }
  text('Valor Bruto do Frete', formatMoeda(input.valorFrete));
  line();

  // ── Commission & deductions ──────────────────────────────────────────────────
  heading('Cálculo do Acerto');
  text(
    `Comissão (${input.percentualComissao}% de ${formatMoeda(input.valorFrete)})`,
    formatMoeda(input.valorComissao),
  );

  if (input.deducoes.length > 0) {
    y += 2;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Deduções:', margin, y);
    y += 5;

    for (const ded of input.deducoes) {
      const label = `  • ${ded.tipo}${ded.descricao ? ` — ${ded.descricao}` : ''}`;
      text(label, `(${formatMoeda(ded.valor)})`);
    }
  }

  text('Total de Deduções', `(${formatMoeda(input.totalDeducoes)})`);
  line();

  // ── Final balance ────────────────────────────────────────────────────────────
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Saldo Final', margin, y);
  doc.text(formatMoeda(input.saldoFinal), margin + contentWidth, y, { align: 'right' });
  y += 8;
  line();

  // ── Footer ───────────────────────────────────────────────────────────────────
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const emitidoEm = `Emitido em ${new Date(input.createdAt).toLocaleString('pt-BR')}`;
  doc.text(emitidoEm, margin, y);
  doc.text(`Acerto ID: ${input.acertoId}`, margin + contentWidth, y, { align: 'right' });

  return Buffer.from(doc.output('arraybuffer'));
}
