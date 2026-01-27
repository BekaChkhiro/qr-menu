import { z } from 'zod';

// Create promotion schema
export const createPromotionSchema = z
  .object({
    titleKa: z
      .string()
      .min(1, 'Georgian title is required')
      .max(100, 'Title must be less than 100 characters'),
    titleEn: z
      .string()
      .max(100, 'Title must be less than 100 characters')
      .nullable()
      .optional(),
    titleRu: z
      .string()
      .max(100, 'Title must be less than 100 characters')
      .nullable()
      .optional(),
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
    imageUrl: z.string().url('Invalid image URL').nullable().optional(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    isActive: z.boolean().default(true),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: 'End date must be after start date',
    path: ['endDate'],
  });

// Update promotion schema
export const updatePromotionSchema = z
  .object({
    titleKa: z
      .string()
      .min(1, 'Georgian title is required')
      .max(100, 'Title must be less than 100 characters')
      .optional(),
    titleEn: z
      .string()
      .max(100, 'Title must be less than 100 characters')
      .nullable()
      .optional(),
    titleRu: z
      .string()
      .max(100, 'Title must be less than 100 characters')
      .nullable()
      .optional(),
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
    imageUrl: z.string().url('Invalid image URL').nullable().optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.endDate > data.startDate;
      }
      return true;
    },
    {
      message: 'End date must be after start date',
      path: ['endDate'],
    }
  );

// Promotion query params schema
export const promotionQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
  isActive: z.coerce.boolean().optional(),
  includeExpired: z.coerce.boolean().default(false),
});

export type CreatePromotionInput = z.infer<typeof createPromotionSchema>;
export type UpdatePromotionInput = z.infer<typeof updatePromotionSchema>;
export type PromotionQueryInput = z.infer<typeof promotionQuerySchema>;
