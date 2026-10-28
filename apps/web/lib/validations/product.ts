import { z } from 'zod';
import { COMBO_MAX_COMPONENTS } from '../products/combo-rules';

// Allergen enum values — full library
const allergenValues = [
  'GLUTEN',
  'DAIRY',
  'EGGS',
  'NUTS',
  'PEANUTS',
  'SEAFOOD',
  'FISH',
  'SHELLFISH',
  'SOY',
  'PORK',
  'SESAME',
  'MUSTARD',
  'CELERY',
  'LUPIN',
  'SULPHITES',
] as const;

// Ribbon enum values
const ribbonValues = [
  'POPULAR',
  'CHEF_CHOICE',
  'DAILY_DISH',
  'NEW',
  'SPICY',
] as const;

// Multi-language name validation
const multiLangNameSchema = {
  nameKa: z
    .string()
    .min(1, 'Georgian name is required')
    .max(100, 'Name must be less than 100 characters'),
  nameEn: z
    .string()
    .max(100, 'Name must be less than 100 characters')
    .nullable()
    .optional(),
  nameRu: z
    .string()
    .max(100, 'Name must be less than 100 characters')
    .nullable()
    .optional(),
};

// Multi-language description validation
const multiLangDescriptionSchema = {
  descriptionKa: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .nullable()
    .optional(),
  descriptionEn: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .nullable()
    .optional(),
  descriptionRu: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .nullable()
    .optional(),
};

// Price validation (positive decimal with 2 decimal places)
const priceSchema = z
  .number()
  .positive('Price must be greater than 0')
  .multipleOf(0.01, 'Price can have at most 2 decimal places')
  .max(99999.99, 'Price must be less than 100,000');

const oldPriceSchema = z
  .number()
  .positive()
  .multipleOf(0.01)
  .max(99999.99)
  .nullable()
  .optional();

// Nutrition value (0.00 - 9999.99)
const nutritionValueSchema = z
  .number()
  .nonnegative()
  .multipleOf(0.01)
  .max(9999.99)
  .nullable()
  .optional();

// Focal point (0.0 - 1.0)
const focalSchema = z.number().min(0).max(1).nullable().optional();
const zoomSchema = z.number().min(1).max(5).nullable().optional();

// Shared extras (image crop, ribbons, dietary, nutrition)
const productExtras = {
  oldPrice: oldPriceSchema,
  // T22.23 — dish-level discount audit fields. The effective price still lives
  // in price/oldPrice (so the public card is unchanged); these record HOW the
  // discount was expressed so the editor can round-trip percent vs amount.
  discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']).nullable().optional(),
  discountValue: z
    .number()
    .nonnegative()
    .multipleOf(0.01)
    .max(99999.99)
    .nullable()
    .optional(),
  // T22.23 — per-day windows restricting when the dish discount applies.
  discountWindows: z
    .object({
      enabled: z.boolean(),
      // Partial: `z.record` with an enum key is exhaustive in Zod 4 and would
      // demand all seven days for a single-day discount window.
      windows: z.partialRecord(
        z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']),
        z.object({
          start: z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:MM format'),
          end: z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:MM format'),
          // T24.4 — optional mid-day break (split shift).
          breakStart: z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:MM format').nullish(),
          breakEnd: z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:MM format').nullish(),
        }),
      ),
    })
    .nullable()
    .optional(),
  imageFocalX: focalSchema,
  imageFocalY: focalSchema,
  imageZoom: zoomSchema,

  ribbons: z.array(z.enum(ribbonValues)).optional(),

  // T1.11 — manual "Recommended" rail pick; null removes the dish from the rail.
  featuredRank: z.number().int().nonnegative().max(9999).nullable().optional(),
  // T3.3 — manual pick into the public Offers rail; null removes it.
  offerRank: z.number().int().nonnegative().max(9999).nullable().optional(),

  isVegan: z.boolean().optional(),
  isVegetarian: z.boolean().optional(),
  isHalal: z.boolean().optional(),
  isKosher: z.boolean().optional(),
  isGlutenFree: z.boolean().optional(),

  calories: z.number().int().nonnegative().max(99999).nullable().optional(),
  protein: nutritionValueSchema,
  fats: nutritionValueSchema,
  carbs: nutritionValueSchema,
  fiber: nutritionValueSchema,

  // AR / 3D model (PRO feature, Phase 18)
  arEnabled: z.boolean().optional(),
  arModelUrl: z.string().url('Invalid AR model URL').nullable().optional(),
  arModelUrlIos: z.string().url('Invalid iOS AR model URL').nullable().optional(),
  arPosterUrl: z.string().url('Invalid AR poster URL').nullable().optional(),
};

// T1.9 — product kind and the dishes a COMBO includes. Ownership and the
// >= 2 / no-self rules need the database, so they are checked in
// lib/products/combo-items.ts, not here.
const productKindSchema = z.enum(['STANDARD', 'COMBO']);

const comboItemSchema = z.object({
  componentId: z.string().min(1, 'Dish is required'),
  quantity: z.number().int().min(1).max(20).default(1),
});

const comboItemsSchema = z
  .array(comboItemSchema)
  .max(COMBO_MAX_COMPONENTS, `A combo can include at most ${COMBO_MAX_COMPONENTS} dishes`);

// Create product schema
export const createProductSchema = z.object({
  categoryId: z.string().cuid('Invalid category ID'),
  ...multiLangNameSchema,
  ...multiLangDescriptionSchema,
  price: priceSchema,
  currency: z.string().length(3, 'Currency must be 3 characters').default('GEL'),
  imageUrl: z.string().url('Invalid image URL').nullable().optional(),
  allergens: z.array(z.enum(allergenValues)).optional(),
  isAvailable: z.boolean().default(true),
  sortOrder: z.number().int().nonnegative().optional(),
  kind: productKindSchema.default('STANDARD'),
  comboItems: comboItemsSchema.optional(),
  ...productExtras,
});

// Update product schema
export const updateProductSchema = z.object({
  categoryId: z.string().cuid('Invalid category ID').optional(),
  nameKa: z
    .string()
    .min(1, 'Georgian name is required')
    .max(100, 'Name must be less than 100 characters')
    .optional(),
  nameEn: z
    .string()
    .max(100, 'Name must be less than 100 characters')
    .nullable()
    .optional(),
  nameRu: z
    .string()
    .max(100, 'Name must be less than 100 characters')
    .nullable()
    .optional(),
  ...multiLangDescriptionSchema,
  price: priceSchema.optional(),
  currency: z.string().length(3, 'Currency must be 3 characters').optional(),
  imageUrl: z.string().url('Invalid image URL').nullable().optional(),
  allergens: z.array(z.enum(allergenValues)).optional(),
  isAvailable: z.boolean().optional(),
  sortOrder: z.number().int().nonnegative().optional(),
  kind: productKindSchema.optional(),
  comboItems: comboItemsSchema.optional(),
  ...productExtras,
});

// Reorder products schema
export const reorderProductsSchema = z.object({
  products: z.array(
    z.object({
      id: z.string().cuid(),
      sortOrder: z.number().int().nonnegative(),
    })
  ),
});

// Product query params schema
export const productQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  categoryId: z.string().cuid().optional(),
  isAvailable: z.coerce.boolean().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ReorderProductsInput = z.infer<typeof reorderProductsSchema>;
export type ProductQueryInput = z.infer<typeof productQuerySchema>;
