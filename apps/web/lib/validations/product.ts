import { z } from 'zod';

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
  imageFocalX: focalSchema,
  imageFocalY: focalSchema,
  imageZoom: zoomSchema,

  ribbons: z.array(z.enum(ribbonValues)).optional(),

  isVegan: z.boolean().optional(),
  isVegetarian: z.boolean().optional(),

  calories: z.number().int().nonnegative().max(99999).nullable().optional(),
  protein: nutritionValueSchema,
  fats: nutritionValueSchema,
  carbs: nutritionValueSchema,
  fiber: nutritionValueSchema,
};

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
