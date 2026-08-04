import { z } from 'zod';

export const backupFileSchema = z.object({
  filename: z.string(),
  sizeBytes: z.number(),
  createdAt: z.string(),
});
export type BackupFile = z.infer<typeof backupFileSchema>;

export const restoreBackupSchema = z.object({
  filename: z
    .string()
    .min(1)
    .regex(/^[A-Za-z0-9._-]+$/, 'Invalid backup filename'),
});
export type RestoreBackupInput = z.infer<typeof restoreBackupSchema>;
