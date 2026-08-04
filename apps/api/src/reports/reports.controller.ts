import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { SalesPeriod } from '@erp/shared';
import type { SalesReport } from '@erp/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BillingService } from '../billing/billing.service';
import { ShopService } from '../shop/shop.service';
import { ReportsService } from './reports.service';
import { renderInvoicePdf } from './invoice-pdf';

function normalizePeriod(p?: string): SalesPeriod {
  return (Object.values(SalesPeriod) as string[]).includes(p ?? '')
    ? (p as SalesPeriod)
    : SalesPeriod.DAILY;
}

function parseDate(s?: string): Date | undefined {
  if (!s) return undefined;
  const d = new Date(`${s}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(
    private readonly reports: ReportsService,
    private readonly billing: BillingService,
    private readonly shop: ShopService,
  ) {}

  @Get('invoices/:id/pdf')
  async invoicePdf(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<void> {
    const [invoice, shop] = await Promise.all([
      this.billing.get(id),
      this.shop.get(),
    ]);
    const pdf = await renderInvoicePdf(invoice, shop);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${invoice.invoiceNo}.pdf"`,
    });
    res.send(pdf);
  }

  @Get('sales')
  sales(
    @Query('period') period?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<SalesReport> {
    return this.reports.salesReport(
      normalizePeriod(period),
      parseDate(from),
      parseDate(to),
    );
  }

  @Get('sales.xlsx')
  async salesXlsx(
    @Res() res: Response,
    @Query('period') period?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<void> {
    const buf = await this.reports.salesReportXlsx(
      normalizePeriod(period),
      parseDate(from),
      parseDate(to),
    );
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="sales-report.xlsx"',
    });
    res.send(buf);
  }

  @Get('inventory.xlsx')
  async inventoryXlsx(@Res() res: Response): Promise<void> {
    const buf = await this.reports.inventoryXlsx();
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="inventory.xlsx"',
    });
    res.send(buf);
  }

  @Get('invoices.xlsx')
  async invoicesXlsx(@Res() res: Response): Promise<void> {
    const buf = await this.reports.invoicesXlsx();
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="invoices.xlsx"',
    });
    res.send(buf);
  }

  @Get('items/:id/barcode.png')
  async itemBarcode(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<void> {
    const png = await this.reports.itemBarcodePng(id);
    res.set({ 'Content-Type': 'image/png' });
    res.send(png);
  }
}
