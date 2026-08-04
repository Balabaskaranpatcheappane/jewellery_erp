import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { createInvoiceSchema } from '@erp/shared';
import type { CreateInvoiceInput, Invoice, InvoiceSummary, AuthUser } from '@erp/shared';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { BillingService } from './billing.service';

@Controller('billing/invoices')
@UseGuards(JwtAuthGuard)
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Get()
  list(): Promise<InvoiceSummary[]> {
    return this.billing.list();
  }

  @Get(':id')
  get(@Param('id') id: string): Promise<Invoice> {
    return this.billing.get(id);
  }

  @Post()
  create(
    @Body(new ZodValidationPipe(createInvoiceSchema)) body: CreateInvoiceInput,
    @CurrentUser() user: AuthUser,
  ): Promise<Invoice> {
    return this.billing.create(body, user.id);
  }
}
