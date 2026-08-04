import { z } from 'zod';

export const activateLicenseSchema = z.object({
  key: z.string().trim().min(10, 'Enter a valid product key'),
});
export type ActivateLicenseInput = z.infer<typeof activateLicenseSchema>;

export const licenseStatusSchema = z.object({
  activated: z.boolean(),
  licensee: z.string().nullable(),
  edition: z.string().nullable(),
  expiresAt: z.string().nullable(),
});
export type LicenseStatus = z.infer<typeof licenseStatusSchema>;
