import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import {
  computeInvoice,
  computeLine,
  computeOldGoldValue,
  type CreateInvoiceInput,
  type Invoice,
  type InvoiceSummary,
} from '@erp/shared';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type InvoiceRow = Prisma.InvoiceGetPayload<{
  include: {
    customer: { select: { name: true } };
    lines: true;
    oldGoldLines: true;
  };
}>;

const num = (d: Prisma.Decimal | number): number => Number(d);

function toDto(row: InvoiceRow): Invoice {
  return {
    id: row.id,
    invoiceNo: row.invoiceNo,
    customerId: row.customerId,
    customerName: row.customer?.name ?? null,
    invoiceDate: row.invoiceDate.toISOString().slice(0, 10),
    status: row.status,
    subtotal: num(row.subtotal),
    cgstPercent: num(row.cgstPercent),
    sgstPercent: num(row.sgstPercent),
    cgst: num(row.cgst),
    sgst: num(row.sgst),
    oldGoldValue: num(row.oldGoldValue),
    roundOff: num(row.roundOff),
    grandTotal: num(row.grandTotal),
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
    lines: row.lines.map((l) => ({
      id: l.id,
      description: l.description,
      metal: l.metal,
      purity: l.purity,
      netWeightGram: num(l.netWeightGram),
      ratePerGram: num(l.ratePerGram),
      makingType: l.makingType,
      makingRate: num(l.makingRate),
      wastagePercent: num(l.wastagePercent),
      quantity: l.quantity,
      metalValue: num(l.metalValue),
      makingAmount: num(l.makingAmount),
      wastageAmount: num(l.wastageAmount),
      lineTotal: num(l.lineTotal),
    })),
    oldGoldLines: row.oldGoldLines.map((g) => ({
      id: g.id,
      description: g.description,
      metal: g.metal,
      grossWeightGram: num(g.grossWeightGram),
      deductionPercent: num(g.deductionPercent),
      ratePerGram: num(g.ratePerGram),
      value: num(g.value),
    })),
  };
}

const INCLUDE = {
  customer: { select: { name: true } },
  lines: true,
  oldGoldLines: true,
} as const;

@Injectable()
export class BillingService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<InvoiceSummary[]> {
    const rows = await this.prisma.invoice.findMany({
      orderBy: { createdAt: 'desc' },
      include: { customer: { select: { name: true } } },
      take: 300,
    });
    return rows.map((r) => ({
      id: r.id,
      invoiceNo: r.invoiceNo,
      customerName: r.customer?.name ?? null,
      invoiceDate: r.invoiceDate.toISOString().slice(0, 10),
      status: r.status,
      grandTotal: num(r.grandTotal),
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async get(id: string): Promise<Invoice> {
    const row = await this.prisma.invoice.findUnique({
      where: { id },
      include: INCLUDE,
    });
    if (!row) throw new NotFoundException('Invoice not found');
    return toDto(row);
  }

  async create(input: CreateInvoiceInput, userId: string): Promise<Invoice> {
    const customer = await this.prisma.customer.findUnique({
      where: { id: input.customerId },
    });
    if (!customer) throw new BadRequestException('Customer not found');

    const totals = computeInvoice({
      cgstPercent: input.cgstPercent,
      sgstPercent: input.sgstPercent,
      lines: input.lines,
      oldGold: input.oldGold,
    });
    const invoiceDate = input.invoiceDate ?? new Date();
    const year = invoiceDate.getFullYear();

    const created = await this.prisma.$transaction(async (tx) => {
      const count = await tx.invoice.count({
        where: { invoiceNo: { startsWith: `INV-${year}-` } },
      });
      const invoiceNo = `INV-${year}-${String(count + 1).padStart(5, '0')}`;

      const invoice = await tx.invoice.create({
        data: {
          invoiceNo,
          customerId: input.customerId,
          invoiceDate,
          cgstPercent: input.cgstPercent,
          sgstPercent: input.sgstPercent,
          subtotal: totals.subtotal,
          cgst: totals.cgst,
          sgst: totals.sgst,
          oldGoldValue: totals.oldGoldValue,
          roundOff: totals.roundOff,
          grandTotal: totals.grandTotal,
          notes: input.notes ? input.notes : null,
          createdById: userId,
          lines: {
            create: input.lines.map((l) => {
              const c = computeLine(l);
              return {
                itemId: l.itemId ?? null,
                description: l.description,
                metal: l.metal,
                purity: l.purity,
                netWeightGram: l.netWeightGram,
                ratePerGram: l.ratePerGram,
                makingType: l.makingType,
                makingRate: l.makingRate,
                wastagePercent: l.wastagePercent,
                quantity: l.quantity,
                metalValue: c.metalValue,
                makingAmount: c.makingAmount,
                wastageAmount: c.wastageAmount,
                lineTotal: c.lineTotal,
              };
            }),
          },
          oldGoldLines: {
            create: input.oldGold.map((g) => ({
              description: g.description,
              metal: g.metal,
              grossWeightGram: g.grossWeightGram,
              deductionPercent: g.deductionPercent,
              ratePerGram: g.ratePerGram,
              value: computeOldGoldValue(g),
            })),
          },
        },
        include: INCLUDE,
      });

      // Mark any linked in-stock items as sold.
      const itemIds = input.lines
        .map((l) => l.itemId)
        .filter((id): id is string => Boolean(id));
      if (itemIds.length > 0) {
        await tx.item.updateMany({
          where: { id: { in: itemIds } },
          data: { status: 'SOLD' },
        });
      }

      return invoice;
    });

    return toDto(created);
  }
}
