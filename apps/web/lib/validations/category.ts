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

// Create category schema
export const createCategorySchema = z.object({
  ...multiLangNameSchema,
  ...multiLangDescriptionSchema,
  sortOrder: z.number().int().nonnegative().optional(),
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
