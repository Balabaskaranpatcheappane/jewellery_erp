import { z } from 'zod';

export const SalesPeriod = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
} as const;
export type SalesPeriod = (typeof SalesPeriod)[keyof typeof SalesPeriod];

export const salesReportRowSchema = z.object({
  bucket: z.string(),
  label: z.string(),
  invoiceCount: z.number(),
  subtotal: z.number(),
  tax: z.number(),
  oldGold: z.number(),
  grandTotal: z.number(),
});
export type SalesReportRow = z.infer<typeof salesReportRowSchema>;

export const salesReportSchema = z.object({
  period: z.enum([
    SalesPeriod.DAILY,
    SalesPeriod.WEEKLY,
    SalesPeriod.MONTHLY,
    SalesPeriod.YEARLY,
  ]),
  from: z.string(),
  to: z.string(),
  rows: z.array(salesReportRowSchema),
  totals: z.object({
    invoiceCount: z.number(),
    subtotal: z.number(),
    tax: z.number(),
    oldGold: z.number(),
    grandTotal: z.number(),
  }),
});
export type SalesReport = z.infer<typeof salesReportSchema>;
