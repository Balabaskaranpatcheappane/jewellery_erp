import { z } from 'zod';
import { MetalType, puritySchema } from './rate';
import { MakingChargeType } from './inventory';

export const InvoiceStatus = {
  DRAFT: 'DRAFT',
  FINALIZED: 'FINALIZED',
  PAID: 'PAID',
  CANCELLED: 'CANCELLED',
} as const;
export type InvoiceStatus = (typeof InvoiceStatus)[keyof typeof InvoiceStatus];

const metalEnum = z.enum([
  MetalType.GOLD,
  MetalType.SILVER,
  MetalType.PLATINUM,
]);
const makingTypeEnum = z.enum([
  MakingChargeType.PER_GRAM,
  MakingChargeType.FIXED,
  MakingChargeType.PERCENT,
]);

/* --------------------------------- Inputs --------------------------------- */

export const invoiceLineInputSchema = z.object({
  itemId: z.string().optional().nullable(),
  description: z.string().trim().min(1, 'Description required').max(160),
  metal: metalEnum,
  purity: puritySchema,
  netWeightGram: z.coerce.number().positive('Net weight must be > 0'),
  ratePerGram: z.coerce.number().positive('Rate must be > 0'),
  makingType: makingTypeEnum,
  makingRate: z.coerce.number().nonnegative(),
  wastagePercent: z.coerce.number().min(0).max(100).default(0),
  quantity: z.coerce.number().int().positive().default(1),
});
export type InvoiceLineInput = z.infer<typeof invoiceLineInputSchema>;

export const oldGoldLineInputSchema = z.object({
  description: z.string().trim().min(1, 'Description required').max(160),
  metal: metalEnum,
  grossWeightGram: z.coerce.number().positive('Weight must be > 0'),
  deductionPercent: z.coerce.number().min(0).max(100).default(0),
  ratePerGram: z.coerce.number().positive('Rate must be > 0'),
});
export type OldGoldLineInput = z.infer<typeof oldGoldLineInputSchema>;

export const createInvoiceSchema = z.object({
  customerId: z.string().min(1, 'Select a customer'),
  invoiceDate: z.coerce.date().optional(),
  cgstPercent: z.coerce.number().min(0).max(50).default(1.5),
  sgstPercent: z.coerce.number().min(0).max(50).default(1.5),
  notes: z.string().trim().max(300).optional().or(z.literal('')),
  lines: z.array(invoiceLineInputSchema).min(1, 'Add at least one line'),
  oldGold: z.array(oldGoldLineInputSchema).default([]),
});
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;

/* -------------------------------- Compute --------------------------------- */

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export interface ComputedLine {
  metalValue: number;
  makingAmount: number;
  wastageAmount: number;
  lineTotal: number;
}

export function computeLine(line: {
  netWeightGram: number;
  ratePerGram: number;
  makingType: MakingChargeType;
  makingRate: number;
  wastagePercent: number;
  quantity: number;
}): ComputedLine {
  const metalValue = round2(line.netWeightGram * line.ratePerGram);
  let making = 0;
  switch (line.makingType) {
    case MakingChargeType.PER_GRAM:
      making = line.netWeightGram * line.makingRate;
      break;
    case MakingChargeType.FIXED:
      making = line.makingRate;
      break;
    case MakingChargeType.PERCENT:
      making = (metalValue * line.makingRate) / 100;
      break;
  }
  const makingAmount = round2(making);
  const wastageAmount = round2((metalValue * line.wastagePercent) / 100);
  const lineTotal = round2(
    (metalValue + makingAmount + wastageAmount) * line.quantity,
  );
  return { metalValue, makingAmount, wastageAmount, lineTotal };
}

export function computeOldGoldValue(g: {
  grossWeightGram: number;
  deductionPercent: number;
  ratePerGram: number;
}): number {
  const netWeight = g.grossWeightGram * (1 - g.deductionPercent / 100);
  return round2(netWeight * g.ratePerGram);
}

export interface ComputedInvoice {
  subtotal: number;
  cgst: number;
  sgst: number;
  taxTotal: number;
  oldGoldValue: number;
  roundOff: number;
  grandTotal: number;
}

export function computeInvoice(input: {
  cgstPercent: number;
  sgstPercent: number;
  lines: Array<Parameters<typeof computeLine>[0]>;
  oldGold: Array<Parameters<typeof computeOldGoldValue>[0]>;
}): ComputedInvoice {
  const subtotal = round2(
    input.lines.reduce((sum, l) => sum + computeLine(l).lineTotal, 0),
  );
  const cgst = round2((subtotal * input.cgstPercent) / 100);
  const sgst = round2((subtotal * input.sgstPercent) / 100);
  const taxTotal = round2(cgst + sgst);
  const oldGoldValue = round2(
    input.oldGold.reduce((sum, g) => sum + computeOldGoldValue(g), 0),
  );
  const beforeRound = subtotal + taxTotal - oldGoldValue;
  const grandTotal = Math.round(beforeRound);
  const roundOff = round2(grandTotal - beforeRound);
  return { subtotal, cgst, sgst, taxTotal, oldGoldValue, roundOff, grandTotal };
}

/* -------------------------------- Outputs --------------------------------- */

export const invoiceLineSchema = z.object({
  id: z.string(),
  description: z.string(),
  metal: metalEnum,
  purity: z.string(),
  netWeightGram: z.number(),
  ratePerGram: z.number(),
  makingType: makingTypeEnum,
  makingRate: z.number(),
  wastagePercent: z.number(),
  quantity: z.number(),
  metalValue: z.number(),
  makingAmount: z.number(),
  wastageAmount: z.number(),
  lineTotal: z.number(),
});
export type InvoiceLine = z.infer<typeof invoiceLineSchema>;

export const oldGoldLineSchema = z.object({
  id: z.string(),
  description: z.string(),
  metal: metalEnum,
  grossWeightGram: z.number(),
  deductionPercent: z.number(),
  ratePerGram: z.number(),
  value: z.number(),
});
export type OldGoldLine = z.infer<typeof oldGoldLineSchema>;

export const invoiceSchema = z.object({
  id: z.string(),
  invoiceNo: z.string(),
  customerId: z.string(),
  customerName: z.string().nullable(),
  invoiceDate: z.string(),
  status: z.enum([
    InvoiceStatus.DRAFT,
    InvoiceStatus.FINALIZED,
    InvoiceStatus.PAID,
    InvoiceStatus.CANCELLED,
  ]),
  subtotal: z.number(),
  cgstPercent: z.number(),
  sgstPercent: z.number(),
  cgst: z.number(),
  sgst: z.number(),
  oldGoldValue: z.number(),
  roundOff: z.number(),
  grandTotal: z.number(),
  notes: z.string().nullable(),
  createdAt: z.string(),
  lines: z.array(invoiceLineSchema),
  oldGoldLines: z.array(oldGoldLineSchema),
});
export type Invoice = z.infer<typeof invoiceSchema>;

export const invoiceSummarySchema = invoiceSchema.pick({
  id: true,
  invoiceNo: true,
  customerName: true,
  invoiceDate: true,
  status: true,
  grandTotal: true,
  createdAt: true,
});
export type InvoiceSummary = z.infer<typeof invoiceSummarySchema>;
