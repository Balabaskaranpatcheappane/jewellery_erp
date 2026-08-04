import PDFDocument from 'pdfkit';
import type { Invoice } from '@erp/shared';

const inr = (n: number): string =>
  'Rs. ' + n.toLocaleString('en-IN', { minimumFractionDigits: 2 });

/** Renders an invoice to a PDF buffer using PDFKit. */
export function renderInvoicePdf(
  invoice: Invoice,
  shopName = 'Jewelry ERP',
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    doc.fontSize(20).text(shopName, { align: 'left' });
    doc.fontSize(10).fillColor('#666').text('Tax Invoice', { align: 'left' });
    doc
      .fillColor('#000')
      .fontSize(14)
      .text(invoice.invoiceNo, 0, 40, { align: 'right' });
    doc
      .fontSize(10)
      .fillColor('#666')
      .text(`Date: ${invoice.invoiceDate}`, { align: 'right' })
      .fillColor('#000');

    doc.moveDown(2);
    doc.fontSize(11).text(`Bill to: ${invoice.customerName ?? '-'}`);
    doc.moveDown(1);

    // Line-item table
    const top = doc.y;
    const cols = [40, 220, 300, 360, 430, 500];
    const header = ['Description', 'Net (g)', 'Rate', 'Making', 'Wastage', 'Total'];
    doc.fontSize(9).fillColor('#666');
    header.forEach((h, i) =>
      doc.text(h, cols[i], top, { width: (cols[i + 1] ?? 555) - cols[i] }),
    );
    doc.fillColor('#000');
    let y = top + 16;
    doc.moveTo(40, y - 4).lineTo(555, y - 4).strokeColor('#ddd').stroke();

    for (const l of invoice.lines) {
      const row = [
        l.description,
        l.netWeightGram.toFixed(3),
        inr(l.ratePerGram),
        inr(l.makingAmount),
        inr(l.wastageAmount),
        inr(l.lineTotal),
      ];
      row.forEach((cell, i) =>
        doc
          .fontSize(9)
          .text(cell, cols[i], y, { width: (cols[i + 1] ?? 555) - cols[i] }),
      );
      y += 18;
      if (y > 720) {
        doc.addPage();
        y = 60;
      }
    }
    doc.moveTo(40, y).lineTo(555, y).strokeColor('#ddd').stroke();
    y += 10;

    // Old gold
    for (const g of invoice.oldGoldLines) {
      doc
        .fontSize(9)
        .fillColor('#666')
        .text(`Old gold: ${g.description}`, cols[0], y)
        .text(`- ${inr(g.value)}`, cols[5], y, { width: 55 })
        .fillColor('#000');
      y += 16;
    }

    // Totals
    y += 6;
    const totals: Array<[string, string]> = [
      ['Subtotal', inr(invoice.subtotal)],
      [`CGST (${invoice.cgstPercent}%)`, inr(invoice.cgst)],
      [`SGST (${invoice.sgstPercent}%)`, inr(invoice.sgst)],
    ];
    if (invoice.oldGoldValue > 0)
      totals.push(['Old gold', `- ${inr(invoice.oldGoldValue)}`]);
    if (invoice.roundOff !== 0)
      totals.push(['Round off', inr(invoice.roundOff)]);
    for (const [label, value] of totals) {
      doc.fontSize(10).text(label, 360, y).text(value, 470, y, { width: 85, align: 'right' });
      y += 16;
    }
    doc.moveTo(360, y).lineTo(555, y).strokeColor('#999').stroke();
    y += 6;
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Grand Total', 360, y)
      .text(inr(invoice.grandTotal), 470, y, { width: 85, align: 'right' })
      .font('Helvetica');

    if (invoice.notes) {
      doc.moveDown(2).fontSize(9).fillColor('#666').text(`Notes: ${invoice.notes}`);
    }

    doc.end();
  });
}
