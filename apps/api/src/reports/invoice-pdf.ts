import PDFDocument from 'pdfkit';
import type { Invoice, ShopProfile } from '@erp/shared';

const money = (n: number): string =>
  n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Page geometry (A4, 40pt margins → 515pt content width from x=40 to x=555).
const LEFT = 40;
const RIGHT = 555;

/** Renders an invoice to a PDF buffer with aligned columns. */
export function renderInvoicePdf(
  invoice: Invoice,
  shop: ShopProfile,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const text = (
      s: string,
      x: number,
      y: number,
      w: number,
      align: 'left' | 'right' | 'center' = 'left',
      opts: { size?: number; color?: string; bold?: boolean } = {},
    ) => {
      doc
        .font(opts.bold ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(opts.size ?? 9)
        .fillColor(opts.color ?? '#111111')
        .text(s, x, y, { width: w, align, lineBreak: false });
    };

    // ---------- Header ----------
    text(shop.name, LEFT, 40, 300, 'left', { size: 20, bold: true });
    let hy = 64;
    const shopLines = [shop.address, shop.phone && `Ph: ${shop.phone}`, shop.gstin && `GSTIN: ${shop.gstin}`]
      .filter(Boolean) as string[];
    for (const line of shopLines) {
      text(line, LEFT, hy, 300, 'left', { size: 9, color: '#555555' });
      hy += 13;
    }

    text('TAX INVOICE', RIGHT - 200, 40, 200, 'right', { size: 14, bold: true });
    text(invoice.invoiceNo, RIGHT - 200, 60, 200, 'right', { size: 11, bold: true });
    text(`Date: ${invoice.invoiceDate}`, RIGHT - 200, 76, 200, 'right', { size: 9, color: '#555555' });

    let y = Math.max(hy, 96) + 8;
    doc.moveTo(LEFT, y).lineTo(RIGHT, y).lineWidth(1).strokeColor('#cccccc').stroke();
    y += 10;

    // ---------- Bill to ----------
    text('Bill To', LEFT, y, 200, 'left', { size: 9, color: '#888888', bold: true });
    text(invoice.customerName ?? '-', LEFT, y + 13, 300, 'left', { size: 11, bold: true });
    y += 40;

    // ---------- Line-item table ----------
    // Column x-positions and widths (right edge 555).
    const col = {
      desc: { x: LEFT, w: 150 },
      metal: { x: 190, w: 60 },
      net: { x: 250, w: 55 },
      rate: { x: 305, w: 65 },
      making: { x: 370, w: 60 },
      wast: { x: 430, w: 55 },
      total: { x: 485, w: 70 },
    };
    const headerY = y;
    doc.rect(LEFT, headerY - 2, RIGHT - LEFT, 18).fill('#f1f1f1');
    text('Description', col.desc.x + 4, headerY + 2, col.desc.w, 'left', { color: '#444', bold: true });
    text('Metal', col.metal.x, headerY + 2, col.metal.w, 'left', { color: '#444', bold: true });
    text('Net g', col.net.x, headerY + 2, col.net.w, 'right', { color: '#444', bold: true });
    text('Rate', col.rate.x, headerY + 2, col.rate.w, 'right', { color: '#444', bold: true });
    text('Making', col.making.x, headerY + 2, col.making.w, 'right', { color: '#444', bold: true });
    text('Wastage', col.wast.x, headerY + 2, col.wast.w, 'right', { color: '#444', bold: true });
    text('Amount', col.total.x, headerY + 2, col.total.w - 4, 'right', { color: '#444', bold: true });
    y = headerY + 20;

    for (const l of invoice.lines) {
      if (y > 740) {
        doc.addPage();
        y = 50;
      }
      text(l.description, col.desc.x + 4, y, col.desc.w, 'left');
      text(`${l.metal} ${l.purity}`, col.metal.x, y, col.metal.w, 'left', { size: 8, color: '#555' });
      text(l.netWeightGram.toFixed(3), col.net.x, y, col.net.w, 'right');
      text(money(l.ratePerGram), col.rate.x, y, col.rate.w, 'right');
      text(money(l.makingAmount), col.making.x, y, col.making.w, 'right');
      text(money(l.wastageAmount), col.wast.x, y, col.wast.w, 'right');
      text(money(l.lineTotal), col.total.x, y, col.total.w - 4, 'right', { bold: true });
      y += 16;
      doc.moveTo(LEFT, y - 3).lineTo(RIGHT, y - 3).lineWidth(0.5).strokeColor('#eeeeee').stroke();
    }

    // ---------- Old gold ----------
    if (invoice.oldGoldLines.length > 0) {
      y += 6;
      text('Old gold / exchange', LEFT, y, 300, 'left', { size: 9, color: '#888', bold: true });
      y += 14;
      for (const g of invoice.oldGoldLines) {
        text(`${g.description} (${g.metal}, ${g.grossWeightGram.toFixed(3)} g)`, col.desc.x + 4, y, 320, 'left', { color: '#555' });
        text(`- ${money(g.value)}`, col.total.x, y, col.total.w - 4, 'right', { color: '#555' });
        y += 15;
      }
    }

    // ---------- Totals block (right aligned) ----------
    y += 10;
    const labelX = 350;
    const labelW = 120;
    const valX = 475;
    const valW = 80;
    const totalRow = (label: string, value: string, bold = false) => {
      text(label, labelX, y, labelW, 'right', { bold });
      text(value, valX, y, valW, 'right', { bold });
      y += 16;
    };
    totalRow('Subtotal', money(invoice.subtotal));
    totalRow(`CGST (${invoice.cgstPercent}%)`, money(invoice.cgst));
    totalRow(`SGST (${invoice.sgstPercent}%)`, money(invoice.sgst));
    if (invoice.oldGoldValue > 0) totalRow('Old gold', `- ${money(invoice.oldGoldValue)}`);
    if (invoice.roundOff !== 0) totalRow('Round off', money(invoice.roundOff));
    doc.moveTo(labelX, y).lineTo(RIGHT, y).lineWidth(1).strokeColor('#999999').stroke();
    y += 6;
    text('Grand Total', labelX, y, labelW, 'right', { size: 12, bold: true });
    text(`Rs. ${money(invoice.grandTotal)}`, valX, y, valW, 'right', { size: 12, bold: true });
    y += 28;

    if (invoice.notes) {
      text(`Notes: ${invoice.notes}`, LEFT, y, RIGHT - LEFT, 'left', { size: 9, color: '#666' });
    }

    doc.end();
  });
}
