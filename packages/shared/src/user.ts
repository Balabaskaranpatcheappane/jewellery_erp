import { z } from 'zod';
import { UserRole } from './auth';

const roleEnum = z.enum([UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER]);

export const createUserSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(72),
  role: roleEnum,
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const setUserActiveSchema = z.object({ isActive: z.boolean() });
export type SetUserActiveInput = z.infer<typeof setUserActiveSchema>;

export const userSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  role: roleEnum,
  isActive: z.boolean(),
  createdAt: z.string(),
});
export type UserRecord = z.infer<typeof userSchema>;
