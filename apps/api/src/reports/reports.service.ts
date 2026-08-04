import { Injectable } from '@nestjs/common';
import { Workbook } from 'exceljs';
import * as bwipjs from 'bwip-js';
import type { SalesPeriod, SalesReport, SalesReportRow } from '@erp/shared';
import { PrismaService } from '../prisma/prisma.service';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** ISO week number for a date (UTC). */
function isoWeek(d: Date): { year: number; week: number } {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { year: date.getUTCFullYear(), week };
}

function bucketOf(period: SalesPeriod, d: Date): { key: string; label: string } {
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  switch (period) {
    case 'daily':
      return { key: `${y}-${pad(m)}-${pad(day)}`, label: `${y}-${pad(m)}-${pad(day)}` };
    case 'weekly': {
      const { year, week } = isoWeek(d);
      return { key: `${year}-W${pad(week)}`, label: `${year} — Week ${week}` };
    }
    case 'monthly':
      return { key: `${y}-${pad(m)}`, label: `${y}-${pad(m)}` };
    case 'yearly':
      return { key: `${y}`, label: `${y}` };
  }
}

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async salesReport(
    period: SalesPeriod,
    from?: Date,
    to?: Date,
  ): Promise<SalesReport> {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        status: { not: 'CANCELLED' },
        invoiceDate: {
          gte: from ?? undefined,
          lte: to ?? undefined,
        },
      },
      select: {
        invoiceDate: true,
        subtotal: true,
        cgst: true,
        sgst: true,
        oldGoldValue: true,
        grandTotal: true,
      },
      orderBy: { invoiceDate: 'asc' },
    });

    const map = new Map<string, SalesReportRow>();
    const totals = { invoiceCount: 0, subtotal: 0, tax: 0, oldGold: 0, grandTotal: 0 };

    for (const inv of invoices) {
      const { key, label } = bucketOf(period, inv.invoiceDate);
      const row =
        map.get(key) ??
        { bucket: key, label, invoiceCount: 0, subtotal: 0, tax: 0, oldGold: 0, grandTotal: 0 };
      const tax = Number(inv.cgst) + Number(inv.sgst);
      row.invoiceCount += 1;
      row.subtotal += Number(inv.subtotal);
      row.tax += tax;
      row.oldGold += Number(inv.oldGoldValue);
      row.grandTotal += Number(inv.grandTotal);
      map.set(key, row);

      totals.invoiceCount += 1;
      totals.subtotal += Number(inv.subtotal);
      totals.tax += tax;
      totals.oldGold += Number(inv.oldGoldValue);
      totals.grandTotal += Number(inv.grandTotal);
    }

    const round = (n: number) => Math.round(n * 100) / 100;
    const rows = [...map.values()]
      .sort((a, b) => a.bucket.localeCompare(b.bucket))
      .map((r) => ({
        ...r,
        subtotal: round(r.subtotal),
        tax: round(r.tax),
        oldGold: round(r.oldGold),
        grandTotal: round(r.grandTotal),
      }));

    return {
      period,
      from: from ? from.toISOString().slice(0, 10) : '',
      to: to ? to.toISOString().slice(0, 10) : '',
      rows,
      totals: {
        invoiceCount: totals.invoiceCount,
        subtotal: round(totals.subtotal),
        tax: round(totals.tax),
        oldGold: round(totals.oldGold),
        grandTotal: round(totals.grandTotal),
      },
    };
  }

  async salesReportXlsx(
    period: SalesPeriod,
    from?: Date,
    to?: Date,
  ): Promise<Buffer> {
    const report = await this.salesReport(period, from, to);
    const wb = new Workbook();
    const ws = wb.addWorksheet('Sales');
    ws.columns = [
      { header: 'Period', key: 'label', width: 20 },
      { header: 'Invoices', key: 'invoiceCount', width: 10 },
      { header: 'Subtotal', key: 'subtotal', width: 14 },
      { header: 'Tax', key: 'tax', width: 12 },
      { header: 'Old gold', key: 'oldGold', width: 12 },
      { header: 'Grand total', key: 'grandTotal', width: 14 },
    ];
    ws.getRow(1).font = { bold: true };
    for (const r of report.rows) ws.addRow(r);
    const totalRow = ws.addRow({
      label: 'TOTAL',
      invoiceCount: report.totals.invoiceCount,
      subtotal: report.totals.subtotal,
      tax: report.totals.tax,
      oldGold: report.totals.oldGold,
      grandTotal: report.totals.grandTotal,
    });
    totalRow.font = { bold: true };
    return Buffer.from((await wb.xlsx.writeBuffer()) as ArrayBuffer);
  }

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
