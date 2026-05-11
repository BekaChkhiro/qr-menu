import { z } from 'zod';

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
    .max(500, 'Description must be less than 500 characters')
    .nullable()
    .optional(),
  descriptionEn: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .nullable()
    .optional(),
  descriptionRu: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .nullable()
    .optional(),
};

const categoryTypeValues = ['FOOD', 'DRINK', 'OTHER'] as const;

// T21.7 — iconUrl is optional. Allow the empty string explicitly so the
// admin form ("create with name only") submits cleanly without tripping the
// URL validator. The API route normalises `''` → `null` before persisting.
const optionalIconUrlSchema = z
  .union([z.string().url(), z.literal('')])
  .nullable()
  .optional();

const categoryExtras = {
  iconUrl: optionalIconUrlSchema,
  brandLabel: z.string().max(50).nullable().optional(),
  type: z.enum(categoryTypeValues).optional(),
};

// Create category schema
export const createCategorySchema = z.object({
  ...multiLangNameSchema,
  ...multiLangDescriptionSchema,
  sortOrder: z.number().int().nonnegative().optional(),
  ...categoryExtras,
});

// Update category schema
export const updateCategorySchema = z.object({
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
  sortOrder: z.number().int().nonnegative().optional(),
  ...categoryExtras,
});

// Reorder categories schema
export const reorderCategoriesSchema = z.object({
  categories: z.array(
    z.object({
      id: z.string().cuid(),
      sortOrder: z.number().int().nonnegative(),
    })
  ),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type ReorderCategoriesInput = z.infer<typeof reorderCategoriesSchema>;
