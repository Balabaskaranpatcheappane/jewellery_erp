import { z } from 'zod';

const optionalString = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(''));

export const updateShopProfileSchema = z.object({
  name: z.string().trim().min(1, 'Shop name is required').max(120),
  address: optionalString(240),
  phone: optionalString(30),
  gstin: optionalString(15),
});
export type UpdateShopProfileInput = z.infer<typeof updateShopProfileSchema>;

export const shopProfileSchema = z.object({
  name: z.string(),
  address: z.string().nullable(),
  phone: z.string().nullable(),
  gstin: z.string().nullable(),
});
export type ShopProfile = z.infer<typeof shopProfileSchema>;
