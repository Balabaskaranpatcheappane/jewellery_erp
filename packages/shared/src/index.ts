// Explicit re-exports (not `export *`) so bundlers can statically trace the
// named exports through the CommonJS build consumed by the NestJS API.
export {
  UserRole,
  loginSchema,
  authUserSchema,
  loginResponseSchema,
} from './auth';
export type { LoginInput, AuthUser, LoginResponse } from './auth';

export {
  MetalType,
  puritySchema,
  createMetalRateSchema,
  metalRateSchema,
} from './rate';
export type { CreateMetalRateInput, MetalRate } from './rate';

export {
  MakingChargeType,
  ItemStatus,
  createCategorySchema,
  categorySchema,
  createItemSchema,
  itemSchema,
} from './inventory';
export type {
  CreateCategoryInput,
  Category,
  CreateItemInput,
  Item,
} from './inventory';

export { createCustomerSchema, customerSchema } from './customer';
export type { CreateCustomerInput, Customer } from './customer';
