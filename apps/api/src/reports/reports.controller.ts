import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BillingService } from '../billing/billing.service';
import { ShopService } from '../shop/shop.service';
import { ReportsService } from './reports.service';
import { renderInvoicePdf } from './invoice-pdf';

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
