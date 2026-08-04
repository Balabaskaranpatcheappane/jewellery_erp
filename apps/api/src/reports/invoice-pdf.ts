import PDFDocument from 'pdfkit';
import type { Invoice, ShopProfile } from '@erp/shared';

const money = (n: number): string =>
  n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// A4 geometry with 40pt margins.
const PAGE_W = 595.28;
const LEFT = 40;
const RIGHT = 555;
const GOLD = '#C9A227';
const INK = '#1a1a1a';
const MUTED = '#666666';
const LINE = '#dddddd';

/* ---------------------------- amount in words --------------------------- */
const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen',
];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function twoDigit(n: number): string {
  if (n < 20) return ONES[n];
  return `${TENS[Math.floor(n / 10)]}${n % 10 ? ' ' + ONES[n % 10] : ''}`;
}
function threeDigit(n: number): string {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  return `${h ? ONES[h] + ' Hundred' + (rest ? ' ' : '') : ''}${rest ? twoDigit(rest) : ''}`;
}
function amountInWords(amount: number): string {
  const rupees = Math.floor(amount);
  if (rupees === 0) return 'Zero Rupees Only';
  const crore = Math.floor(rupees / 10000000);
  const lakh = Math.floor((rupees % 10000000) / 100000);
  const thousand = Math.floor((rupees % 100000) / 1000);
  const hundred = rupees % 1000;
  const parts: string[] = [];
  if (crore) parts.push(`${twoDigit(crore)} Crore`);
  if (lakh) parts.push(`${twoDigit(lakh)} Lakh`);
  if (thousand) parts.push(`${twoDigit(thousand)} Thousand`);
  if (hundred) parts.push(threeDigit(hundred));
  return `${parts.join(' ')} Rupees Only`;
}

/** Renders an invoice to a nicely designed PDF buffer. */
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

    const put = (
      s: string,
      x: number,
      y: number,
      w: number,
      align: 'left' | 'right' | 'center' = 'left',
      o: { size?: number; color?: string; bold?: boolean } = {},
    ) =>
      doc
        .font(o.bold ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(o.size ?? 9)
        .fillColor(o.color ?? INK)
        .text(s, x, y, { width: w, align, lineBreak: false });

    // Top gold accent bar
    doc.rect(0, 0, PAGE_W, 6).fill(GOLD);

    // Header — shop (left) + invoice meta (right)
    put(shop.name, LEFT, 34, 320, 'left', { size: 22, bold: true });
    let hy = 62;
    for (const l of [shop.address, shop.phone && `Ph: ${shop.phone}`, shop.gstin && `GSTIN: ${shop.gstin}`].filter(
      Boolean,
    ) as string[]) {
      put(l, LEFT, hy, 320, 'left', { size: 9, color: MUTED });
      hy += 13;
    }
    put('TAX INVOICE', RIGHT - 220, 34, 220, 'right', { size: 15, bold: true, color: GOLD });
    put(invoice.invoiceNo, RIGHT - 220, 56, 220, 'right', { size: 11, bold: true });
    put(`Date: ${invoice.invoiceDate}`, RIGHT - 220, 72, 220, 'right', { size: 9, color: MUTED });

    let y = Math.max(hy, 96) + 6;

    // Bill To band
    doc.rect(LEFT, y, RIGHT - LEFT, 34).fill('#f7f6f2');
    put('BILL TO', LEFT + 10, y + 6, 200, 'left', { size: 8, color: MUTED, bold: true });
    put(invoice.customerName ?? '-', LEFT + 10, y + 17, 300, 'left', { size: 11, bold: true });
    y += 48;

    // ---------- Items table ----------
    const col = {
      desc: { x: LEFT + 6, w: 150, align: 'left' as const },
      metal: { x: 190, w: 58, align: 'left' as const },
      net: { x: 248, w: 50, align: 'right' as const },
      rate: { x: 300, w: 66, align: 'right' as const },
      making: { x: 368, w: 58, align: 'right' as const },
      wast: { x: 428, w: 52, align: 'right' as const },
      total: { x: 482, w: 67, align: 'right' as const },
    };
    const heads: [keyof typeof col, string][] = [
      ['desc', 'Description'], ['metal', 'Metal'], ['net', 'Net g'],
      ['rate', 'Rate'], ['making', 'Making'], ['wast', 'Wastage'], ['total', 'Amount'],
    ];
    doc.rect(LEFT, y, RIGHT - LEFT, 20).fill(INK);
    for (const [k, label] of heads) {
      put(label, col[k].x, y + 6, col[k].w, col[k].align, { size: 8.5, bold: true, color: '#ffffff' });
    }
    y += 20;

    invoice.lines.forEach((l, i) => {
      if (y > 720) {
        doc.addPage();
        y = 50;
      }
      if (i % 2 === 1) doc.rect(LEFT, y, RIGHT - LEFT, 18).fill('#faf9f6');
      put(l.description, col.desc.x, y + 5, col.desc.w, 'left');
      put(`${l.metal} ${l.purity}`, col.metal.x, y + 5, col.metal.w, 'left', { size: 8, color: MUTED });
      put(l.netWeightGram.toFixed(3), col.net.x, y + 5, col.net.w, 'right');
      put(money(l.ratePerGram), col.rate.x, y + 5, col.rate.w, 'right');
      put(money(l.makingAmount), col.making.x, y + 5, col.making.w, 'right');
      put(money(l.wastageAmount), col.wast.x, y + 5, col.wast.w, 'right');
      put(money(l.lineTotal), col.total.x, y + 5, col.total.w, 'right', { bold: true });
      y += 18;
    });
    doc.moveTo(LEFT, y).lineTo(RIGHT, y).lineWidth(0.7).strokeColor(LINE).stroke();

    // Old gold
    if (invoice.oldGoldLines.length > 0) {
      y += 8;
      put('Old gold / exchange', col.desc.x, y, 300, 'left', { size: 8.5, bold: true, color: MUTED });
      y += 13;
      for (const g of invoice.oldGoldLines) {
        put(`${g.description} (${g.metal}, ${g.grossWeightGram.toFixed(3)} g)`, col.desc.x, y, 340, 'left', { color: MUTED });
        put(`- ${money(g.value)}`, col.total.x, y, col.total.w, 'right', { color: MUTED });
        y += 14;
      }
    }

    // ---------- Totals ----------
    y += 12;
    const lX = 330, lW = 110, vX = 445, vW = 110;
    const row = (label: string, value: string) => {
      put(label, lX, y, lW, 'right', { size: 9.5 });
      put(value, vX, y, vW, 'right', { size: 9.5 });
      y += 15;
    };
    row('Subtotal', money(invoice.subtotal));
    row(`CGST (${invoice.cgstPercent}%)`, money(invoice.cgst));
    row(`SGST (${invoice.sgstPercent}%)`, money(invoice.sgst));
    if (invoice.oldGoldValue > 0) row('Old gold', `- ${money(invoice.oldGoldValue)}`);
    if (invoice.roundOff !== 0) row('Round off', money(invoice.roundOff));

    // Grand total band (single line, highlighted)
    y += 2;
    doc.rect(lX, y, RIGHT - lX, 24).fill(GOLD);
    put('GRAND TOTAL', lX + 10, y + 7, 90, 'left', { size: 10, bold: true, color: '#ffffff' });
    put(`Rs. ${money(invoice.grandTotal)}`, vX - 10, y + 7, vW + 5, 'right', { size: 11, bold: true, color: '#ffffff' });
    y += 34;

    // Amount in words
    put('Amount in words:', LEFT, y, 100, 'left', { size: 8.5, color: MUTED, bold: true });
    put(amountInWords(invoice.grandTotal), LEFT + 92, y, RIGHT - LEFT - 92, 'left', { size: 9 });
    y += 22;

    if (invoice.notes) {
      put(`Notes: ${invoice.notes}`, LEFT, y, RIGHT - LEFT, 'left', { size: 9, color: MUTED });
      y += 16;
    }

    // Footer
    const fy = 800;
    doc.moveTo(LEFT, fy).lineTo(RIGHT, fy).lineWidth(0.7).strokeColor(LINE).stroke();
    put('Thank you for your business.', LEFT, fy + 6, 300, 'left', { size: 8.5, color: MUTED });
    put(`For ${shop.name}`, RIGHT - 200, fy + 6, 200, 'right', { size: 8.5, color: MUTED });
    put('Authorised Signatory', RIGHT - 200, fy + 30, 200, 'right', { size: 8.5, color: MUTED });

    doc.end();
  });
}
