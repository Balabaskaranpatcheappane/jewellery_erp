import { z } from 'zod';
import { MetalType, puritySchema } from './rate';
import { round2 } from './billing';

export const LoanStatus = {
  ACTIVE: 'ACTIVE',
  CLOSED: 'CLOSED',
  DEFAULTED: 'DEFAULTED',
} as const;
export type LoanStatus = (typeof LoanStatus)[keyof typeof LoanStatus];

const metalEnum = z.enum([MetalType.GOLD, MetalType.SILVER, MetalType.PLATINUM]);
const optionalString = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(''));

/* ----------------------------- Pledge items ----------------------------- */

export const pledgeItemInputSchema = z.object({
  description: z.string().trim().min(1, 'Description required').max(160),
  metal: metalEnum,
  purity: puritySchema,
  grossWeightGram: z.coerce.number().positive('Weight must be > 0'),
  netWeightGram: z.coerce.number().positive('Net weight must be > 0'),
  estimatedValue: z.coerce.number().nonnegative(),
});
export type PledgeItemInput = z.infer<typeof pledgeItemInputSchema>;

/* --------------------------------- Loan --------------------------------- */

export const createLoanSchema = z.object({
  customerId: z.string().min(1, 'Select a customer'),
  principal: z.coerce.number().positive('Principal must be > 0'),
  interestRatePercent: z.coerce.number().min(0).max(60), // monthly %
  startDate: z.coerce.date().optional(),
  dueDate: z.coerce.date().optional(),
  notes: optionalString(240),
  items: z.array(pledgeItemInputSchema).min(1, 'Add at least one pledged item'),
});
export type CreateLoanInput = z.infer<typeof createLoanSchema>;

export const addRepaymentSchema = z.object({
  amount: z.coerce.number().positive('Amount must be > 0'),
  paidOn: z.coerce.date().optional(),
  note: optionalString(160),
});
export type AddRepaymentInput = z.infer<typeof addRepaymentSchema>;

/* -------------------------------- Compute ------------------------------- */

export function monthsElapsed(start: Date, asOf: Date): number {
  const ms = asOf.getTime() - start.getTime();
  return Math.max(0, ms / (1000 * 60 * 60 * 24 * 30)); // ~30-day months
}

export interface LoanComputation {
  months: number;
  accruedInterest: number;
  totalDue: number;
  outstanding: number;
}

/** Simple monthly-interest accrual on the original principal. */
export function computeLoan(input: {
  principal: number;
  interestRatePercent: number;
  startDate: string | Date;
  totalRepaid: number;
  asOf?: Date;
}): LoanComputation {
  const start = new Date(input.startDate);
  const asOf = input.asOf ?? new Date();
  const months = monthsElapsed(start, asOf);
  const accruedInterest = round2(
    input.principal * (input.interestRatePercent / 100) * months,
  );
  const totalDue = round2(input.principal + accruedInterest);
  const outstanding = round2(Math.max(0, totalDue - input.totalRepaid));
  return { months: round2(months), accruedInterest, totalDue, outstanding };
}

/* -------------------------------- Outputs ------------------------------- */

export const pledgeItemSchema = z.object({
  id: z.string(),
  description: z.string(),
  metal: metalEnum,
  purity: z.string(),
  grossWeightGram: z.number(),
  netWeightGram: z.number(),
  estimatedValue: z.number(),
});
export type PledgeItem = z.infer<typeof pledgeItemSchema>;

export const loanRepaymentSchema = z.object({
  id: z.string(),
  amount: z.number(),
  paidOn: z.string(),
  note: z.string().nullable(),
});
export type LoanRepayment = z.infer<typeof loanRepaymentSchema>;

export const loanSchema = z.object({
  id: z.string(),
  loanNo: z.string(),
  customerId: z.string(),
  customerName: z.string().nullable(),
  principal: z.number(),
  interestRatePercent: z.number(),
  startDate: z.string(),
  dueDate: z.string().nullable(),
  status: z.enum([LoanStatus.ACTIVE, LoanStatus.CLOSED, LoanStatus.DEFAULTED]),
  notes: z.string().nullable(),
  createdAt: z.string(),
  totalRepaid: z.number(),
  accruedInterest: z.number(),
  outstanding: z.number(),
  items: z.array(pledgeItemSchema),
  repayments: z.array(loanRepaymentSchema),
});
export type Loan = z.infer<typeof loanSchema>;

export const loanSummarySchema = loanSchema.pick({
  id: true,
  loanNo: true,
  customerName: true,
  principal: true,
  interestRatePercent: true,
  startDate: true,
  status: true,
  outstanding: true,
});
export type LoanSummary = z.infer<typeof loanSummarySchema>;
