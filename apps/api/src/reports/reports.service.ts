import { Injectable } from '@nestjs/common';
import { Workbook } from 'exceljs';
import * as bwipjs from 'bwip-js';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async inventoryXlsx(): Promise<Buffer> {
    const items = await this.prisma.item.findMany({
      orderBy: { createdAt: 'desc' },
      include: { category: { select: { name: true } } },
    });
    const wb = new Workbook();
    const ws = wb.addWorksheet('Inventory');
    ws.columns = [
      { header: 'SKU', key: 'sku', width: 14 },
      { header: 'Name', key: 'name', width: 28 },
      { header: 'Category', key: 'category', width: 18 },
      { header: 'Metal', key: 'metal', width: 10 },
      { header: 'Purity', key: 'purity', width: 8 },
      { header: 'Gross (g)', key: 'gross', width: 10 },
      { header: 'Net (g)', key: 'net', width: 10 },
      { header: 'HUID', key: 'huid', width: 16 },
      { header: 'Qty', key: 'qty', width: 6 },
      { header: 'Status', key: 'status', width: 10 },
    ];
    ws.getRow(1).font = { bold: true };
    for (const it of items) {
      ws.addRow({
        sku: it.sku,
        name: it.name,
        category: it.category?.name ?? '',
        metal: it.metal,
        purity: it.purity,
        gross: Number(it.grossWeightGram),
        net: Number(it.netWeightGram),
        huid: it.huid ?? '',
        qty: it.quantity,
        status: it.status,
      });
    }
    return Buffer.from(await wb.xlsx.writeBuffer() as ArrayBuffer);
  }

  async invoicesXlsx(): Promise<Buffer> {
    const invoices = await this.prisma.invoice.findMany({
      orderBy: { createdAt: 'desc' },
      include: { customer: { select: { name: true } } },
    });
    const wb = new Workbook();
    const ws = wb.addWorksheet('Invoices');
    ws.columns = [
      { header: 'Invoice #', key: 'no', width: 18 },
      { header: 'Date', key: 'date', width: 12 },
      { header: 'Customer', key: 'customer', width: 24 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Subtotal', key: 'subtotal', width: 14 },
      { header: 'Tax', key: 'tax', width: 12 },
      { header: 'Old gold', key: 'oldgold', width: 12 },
      { header: 'Grand total', key: 'grand', width: 14 },
    ];
    ws.getRow(1).font = { bold: true };
    for (const inv of invoices) {
      ws.addRow({
        no: inv.invoiceNo,
        date: inv.invoiceDate.toISOString().slice(0, 10),
        customer: inv.customer?.name ?? '',
        status: inv.status,
        subtotal: Number(inv.subtotal),
        tax: Number(inv.cgst) + Number(inv.sgst),
        oldgold: Number(inv.oldGoldValue),
        grand: Number(inv.grandTotal),
      });
    }
    return Buffer.from(await wb.xlsx.writeBuffer() as ArrayBuffer);
  }

  async barcodePng(text: string): Promise<Buffer> {
    return bwipjs.toBuffer({
      bcid: 'code128',
      text,
      scale: 3,
      height: 10,
      includetext: true,
      textxalign: 'center',
    });
  }

  async itemBarcodePng(id: string): Promise<Buffer> {
    const item = await this.prisma.item.findUnique({ where: { id } });
    return this.barcodePng(item?.sku ?? id);
  }
}
