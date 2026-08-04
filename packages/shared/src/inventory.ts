import { z } from 'zod';
import { MetalType, puritySchema } from './rate';

/** How making charges are computed for an item. */
export const MakingChargeType = {
  PER_GRAM: 'PER_GRAM',
  FIXED: 'FIXED',
  PERCENT: 'PERCENT',
} as const;
export type MakingChargeType =
  (typeof MakingChargeType)[keyof typeof MakingChargeType];

export const ItemStatus = {
  IN_STOCK: 'IN_STOCK',
  RESERVED: 'RESERVED',
  SOLD: 'SOLD',
} as const;
export type ItemStatus = (typeof ItemStatus)[keyof typeof ItemStatus];

const makingTypeEnum = z.enum([
  MakingChargeType.PER_GRAM,
  MakingChargeType.FIXED,
  MakingChargeType.PERCENT,
]);
const metalEnum = z.enum([
  MetalType.GOLD,
  MetalType.SILVER,
  MetalType.PLATINUM,
]);
const optionalString = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(''));

/* -------------------------------- Category -------------------------------- */

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80),
  code: z
    .string()
    .trim()
    .min(1, 'Code is required')
    .max(20)
    .regex(/^[A-Za-z0-9_-]+$/, 'Code: letters, digits, - and _ only'),
  hsnCode: optionalString(12),
  defaultMakingType: makingTypeEnum.default(MakingChargeType.PER_GRAM),
  defaultMakingRate: z.coerce.number().nonnegative().default(0),
  defaultWastagePercent: z.coerce.number().min(0).max(100).default(0),
});
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

export const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  hsnCode: z.string().nullable(),
  defaultMakingType: makingTypeEnum,
  defaultMakingRate: z.number(),
  defaultWastagePercent: z.number(),
  itemCount: z.number(),
});
export type Category = z.infer<typeof categorySchema>;

/* ---------------------------------- Item ---------------------------------- */

export const createItemSchema = z
  .object({
    sku: z
      .string()
      .trim()
      .min(1, 'SKU is required')
      .max(40)
      .regex(/^[A-Za-z0-9_-]+$/, 'SKU: letters, digits, - and _ only'),
    name: z.string().trim().min(1, 'Name is required').max(120),
    categoryId: z.string().min(1, 'Select a category'),
    metal: metalEnum,
    purity: puritySchema,
    grossWeightGram: z.coerce.number().positive('Gross weight must be > 0'),
    stoneWeightGram: z.coerce.number().min(0).default(0),
    makingType: makingTypeEnum,
    makingRate: z.coerce.number().nonnegative(),
    wastagePercent: z.coerce.number().min(0).max(100).default(0),
    huid: optionalString(20),
    quantity: z.coerce.number().int().positive().default(1),
  })
  .refine((v) => v.stoneWeightGram < v.grossWeightGram, {
    path: ['stoneWeightGram'],
    message: 'Stone weight must be less than gross weight',
  });
export type CreateItemInput = z.infer<typeof createItemSchema>;

export const itemSchema = z.object({
  id: z.string(),
  sku: z.string(),
  name: z.string(),
  categoryId: z.string(),
  categoryName: z.string().nullable(),
  metal: metalEnum,
  purity: z.string(),
  grossWeightGram: z.number(),
  stoneWeightGram: z.number(),
  netWeightGram: z.number(),
  makingType: makingTypeEnum,
  makingRate: z.number(),
  wastagePercent: z.number(),
  huid: z.string().nullable(),
  quantity: z.number(),
  status: z.enum([ItemStatus.IN_STOCK, ItemStatus.RESERVED, ItemStatus.SOLD]),
  createdAt: z.string(),
});
export type Item = z.infer<typeof itemSchema>;
