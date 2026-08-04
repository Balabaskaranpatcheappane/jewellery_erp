import { z } from 'zod';
import { MetalType, puritySchema } from './rate';

const metalEnum = z.enum([
  MetalType.GOLD,
  MetalType.SILVER,
  MetalType.PLATINUM,
]);
const optionalString = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(''));

/* -------------------------- Karigar (artisan) --------------------------- */

export const createKarigarSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  phone: optionalString(20),
  specialization: optionalString(80),
});
export type CreateKarigarInput = z.infer<typeof createKarigarSchema>;

export const karigarSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string().nullable(),
  specialization: z.string().nullable(),
  isActive: z.boolean(),
  openJobs: z.number(),
});
export type Karigar = z.infer<typeof karigarSchema>;

/* ------------------------------ Job work -------------------------------- */

export const JobStatus = {
  ISSUED: 'ISSUED',
  RECEIVED: 'RECEIVED',
  CANCELLED: 'CANCELLED',
} as const;
export type JobStatus = (typeof JobStatus)[keyof typeof JobStatus];

export const createJobOrderSchema = z.object({
  karigarId: z.string().min(1, 'Select a karigar'),
  description: z.string().trim().min(1, 'Description required').max(160),
  metal: metalEnum,
  purity: puritySchema,
  issuedWeightGram: z.coerce.number().positive('Issued weight must be > 0'),
  expectedReturnDate: z.coerce.date().optional(),
  notes: optionalString(240),
});
export type CreateJobOrderInput = z.infer<typeof createJobOrderSchema>;

export const receiveJobOrderSchema = z.object({
  receivedWeightGram: z.coerce.number().positive('Received weight must be > 0'),
  wastageGram: z.coerce.number().min(0).default(0),
  makingAmount: z.coerce.number().min(0).default(0),
});
export type ReceiveJobOrderInput = z.infer<typeof receiveJobOrderSchema>;

export const jobOrderSchema = z.object({
  id: z.string(),
  jobNo: z.string(),
  karigarId: z.string(),
  karigarName: z.string().nullable(),
  description: z.string(),
  metal: metalEnum,
  purity: z.string(),
  issuedWeightGram: z.number(),
  expectedReturnDate: z.string().nullable(),
  status: z.enum([JobStatus.ISSUED, JobStatus.RECEIVED, JobStatus.CANCELLED]),
  receivedWeightGram: z.number().nullable(),
  wastageGram: z.number().nullable(),
  makingAmount: z.number().nullable(),
  notes: z.string().nullable(),
  issuedAt: z.string(),
  receivedAt: z.string().nullable(),
});
export type JobOrder = z.infer<typeof jobOrderSchema>;

/* ---------------------------- Savings scheme ---------------------------- */

export const SchemeStatus = {
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;
export type SchemeStatus = (typeof SchemeStatus)[keyof typeof SchemeStatus];

export const createSchemeSchema = z.object({
  customerId: z.string().min(1, 'Select a customer'),
  name: z.string().trim().min(1, 'Name is required').max(120),
  monthlyAmount: z.coerce.number().positive('Monthly amount must be > 0'),
  durationMonths: z.coerce.number().int().min(1).max(120),
  startDate: z.coerce.date().optional(),
});
export type CreateSchemeInput = z.infer<typeof createSchemeSchema>;

export const addInstallmentSchema = z.object({
  amount: z.coerce.number().positive('Amount must be > 0'),
  paidOn: z.coerce.date().optional(),
});
export type AddInstallmentInput = z.infer<typeof addInstallmentSchema>;

export const schemeInstallmentSchema = z.object({
  id: z.string(),
  monthNo: z.number(),
  amount: z.number(),
  paidOn: z.string(),
});
export type SchemeInstallment = z.infer<typeof schemeInstallmentSchema>;

export const schemeSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  customerName: z.string().nullable(),
  name: z.string(),
  monthlyAmount: z.number(),
  durationMonths: z.number(),
  startDate: z.string(),
  status: z.enum([
    SchemeStatus.ACTIVE,
    SchemeStatus.COMPLETED,
    SchemeStatus.CANCELLED,
  ]),
  paidCount: z.number(),
  paidTotal: z.number(),
  installments: z.array(schemeInstallmentSchema),
});
export type Scheme = z.infer<typeof schemeSchema>;

/* -------------------------------- Branch -------------------------------- */

export const createBranchSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  code: z
    .string()
    .trim()
    .min(1, 'Code is required')
    .max(20)
    .regex(/^[A-Za-z0-9_-]+$/, 'Code: letters, digits, - and _ only'),
  address: optionalString(240),
  phone: optionalString(20),
});
export type CreateBranchInput = z.infer<typeof createBranchSchema>;

export const branchSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  address: z.string().nullable(),
  phone: z.string().nullable(),
  isActive: z.boolean(),
});
export type Branch = z.infer<typeof branchSchema>;
