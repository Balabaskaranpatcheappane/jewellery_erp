import { z } from 'zod';

const optionalString = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(''));

export const createCustomerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  phone: z
    .string()
    .trim()
    .min(7, 'Enter a valid phone')
    .max(20)
    .regex(/^[0-9+\-\s]+$/, 'Phone: digits, +, - and spaces only'),
  email: z.string().trim().email('Enter a valid email').optional().or(z.literal('')),
  gstin: optionalString(15),
  pan: z
    .string()
    .trim()
    .regex(/^[A-Za-z]{5}[0-9]{4}[A-Za-z]$/, 'PAN format: ABCDE1234F')
    .optional()
    .or(z.literal('')),
  aadhaar: z
    .string()
    .trim()
    .regex(/^[0-9]{12}$/, 'Aadhaar must be 12 digits')
    .optional()
    .or(z.literal('')),
  address: optionalString(240),
  city: optionalString(80),
});
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;

export const customerSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string(),
  email: z.string().nullable(),
  gstin: z.string().nullable(),
  pan: z.string().nullable(),
  aadhaar: z.string().nullable(),
  address: z.string().nullable(),
  city: z.string().nullable(),
  createdAt: z.string(),
});
export type Customer = z.infer<typeof customerSchema>;
