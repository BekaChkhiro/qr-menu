import { z } from 'zod';

// Price validation (positive decimal with 2 decimal places)
const priceSchema = z
  .number()
  .positive('Price must be greater than 0')
  .multipleOf(0.01, 'Price can have at most 2 decimal places')
  .max(99999.99, 'Price must be less than 100,000');

// Create product variation schema
export const createProductVariationSchema = z.object({
  nameKa: z
    .string()
    .min(1, 'Georgian name is required')
    .max(50, 'Name must be less than 50 characters'),
  nameEn: z
    .string()
    .max(50, 'Name must be less than 50 characters')
    .nullable()
    .optional(),
  nameRu: z
    .string()
    .max(50, 'Name must be less than 50 characters')
    .nullable()
    .optional(),
  price: priceSchema,
  sortOrder: z.number().int().nonnegative().optional(),
});

// Update product variation schema
export const updateProductVariationSchema = z.object({
  nameKa: z
    .string()
    .min(1, 'Georgian name is required')
    .max(50, 'Name must be less than 50 characters')
    .optional(),
  nameEn: z
    .string()
    .max(50, 'Name must be less than 50 characters')
    .nullable()
    .optional(),
  nameRu: z
    .string()
    .max(50, 'Name must be less than 50 characters')
    .nullable()
    .optional(),
  price: priceSchema.optional(),
  sortOrder: z.number().int().nonnegative().optional(),
});

// Bulk create variations schema (for creating multiple at once)
export const bulkCreateVariationsSchema = z.object({
  variations: z
    .array(createProductVariationSchema)
    .min(1, 'At least one variation is required')
    .max(10, 'Maximum 10 variations allowed'),
});

// Reorder variations schema
export const reorderVariationsSchema = z.object({
  variations: z.array(
    z.object({
      id: z.string().cuid(),
      sortOrder: z.number().int().nonnegative(),
    })
  ),
});

export type CreateProductVariationInput = z.infer<typeof createProductVariationSchema>;
export type UpdateProductVariationInput = z.infer<typeof updateProductVariationSchema>;
export type BulkCreateVariationsInput = z.infer<typeof bulkCreateVariationsSchema>;
export type ReorderVariationsInput = z.infer<typeof reorderVariationsSchema>;
