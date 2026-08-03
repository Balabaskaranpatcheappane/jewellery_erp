import { z } from 'zod';

/** Precious metals tracked by the rate master. */
export const MetalType = {
  GOLD: 'GOLD',
  SILVER: 'SILVER',
  PLATINUM: 'PLATINUM',
} as const;
export type MetalType = (typeof MetalType)[keyof typeof MetalType];

/**
 * Purity expressed as a label (e.g. "916" for 22K gold, "999" for fine gold/silver).
 * Kept as a free-ish string so shops can add their own standards, but validated
 * against a sensible pattern.
 */
export const puritySchema = z
  .string()
  .min(2)
  .max(8)
  .regex(/^[0-9A-Za-z.]+$/, 'Purity may only contain letters, digits and dots');

export const createMetalRateSchema = z.object({
  metal: z.enum([MetalType.GOLD, MetalType.SILVER, MetalType.PLATINUM]),
  purity: puritySchema,
  /** Rate per gram in the shop's base currency (INR). */
  ratePerGram: z.coerce.number().positive('Rate must be greater than 0'),
  /** Date the rate takes effect. ISO string (yyyy-mm-dd) from the client. */
  effectiveDate: z.coerce.date(),
});
export type CreateMetalRateInput = z.infer<typeof createMetalRateSchema>;

export const metalRateSchema = z.object({
  id: z.string(),
  metal: z.enum([MetalType.GOLD, MetalType.SILVER, MetalType.PLATINUM]),
  purity: z.string(),
  ratePerGram: z.number(),
  effectiveDate: z.string(),
  createdAt: z.string(),
  createdByName: z.string().nullable(),
});
export type MetalRate = z.infer<typeof metalRateSchema>;
