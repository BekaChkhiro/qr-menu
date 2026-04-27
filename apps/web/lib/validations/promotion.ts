import { z } from 'zod';

// ── Enums ───────────────────────────────────────────────────────────────────

export const DiscountType = {
  PERCENTAGE: 'PERCENTAGE',
  FIXED_AMOUNT: 'FIXED_AMOUNT',
  FREE_ADDON: 'FREE_ADDON',
} as const;

export const ApplyToType = {
  ENTIRE_MENU: 'ENTIRE_MENU',
  CATEGORY: 'CATEGORY',
  SPECIFIC_ITEMS: 'SPECIFIC_ITEMS',
} as const;

export const WeekDay = {
  MON: 'mon',
  TUE: 'tue',
  WED: 'wed',
  THU: 'thu',
  FRI: 'fri',
  SAT: 'sat',
  SUN: 'sun',
} as const;

export type DiscountTypeValue = (typeof DiscountType)[keyof typeof DiscountType];
export type ApplyToTypeValue = (typeof ApplyToType)[keyof typeof ApplyToType];
export type WeekDayValue = (typeof WeekDay)[keyof typeof WeekDay];

// ── Time restrictions schema ────────────────────────────────────────────────

export const timeRestrictionsSchema = z.object({
  enabled: z.boolean().default(false),
  days: z.array(z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])).default([]),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:MM format').default('09:00'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:MM format').default('18:00'),
});

export type TimeRestrictionsInput = z.infer<typeof timeRestrictionsSchema>;

// ── Create promotion schema ─────────────────────────────────────────────────

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
      .max(160, 'Description must be less than 160 characters')
      .nullable()
      .optional(),
    descriptionEn: z
      .string()
      .max(160, 'Description must be less than 160 characters')
      .nullable()
      .optional(),
    descriptionRu: z
      .string()
      .max(160, 'Description must be less than 160 characters')
      .nullable()
      .optional(),
    imageUrl: z.string().url('Invalid image URL').nullable().optional(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    isActive: z.boolean().default(true),
    sortOrder: z.number().int().nonnegative().optional(),

    // T15.8 — new fields
    discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_ADDON']).optional().nullable(),
    discountValue: z
      .union([z.string(), z.number()])
      .optional()
      .nullable()
      .transform((v) => {
        if (v === null || v === undefined || v === '') return null;
        const n = typeof v === 'string' ? parseFloat(v) : v;
        return isNaN(n) ? null : n;
      }),
    applyTo: z.enum(['ENTIRE_MENU', 'CATEGORY', 'SPECIFIC_ITEMS']).optional().nullable(),
    categoryId: z.string().nullable().optional(),
    timeRestrictions: timeRestrictionsSchema.optional().nullable(),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: 'End date must be after start date',
    path: ['endDate'],
  })
  .refine(
    (data) => {
      if (data.applyTo === 'CATEGORY') {
        return !!data.categoryId;
      }
      return true;
    },
    {
      message: 'Please select a category',
      path: ['categoryId'],
    }
  );

// ── Update promotion schema ─────────────────────────────────────────────────

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
      .max(160, 'Description must be less than 160 characters')
      .nullable()
      .optional(),
    descriptionEn: z
      .string()
      .max(160, 'Description must be less than 160 characters')
      .nullable()
      .optional(),
    descriptionRu: z
      .string()
      .max(160, 'Description must be less than 160 characters')
      .nullable()
      .optional(),
    imageUrl: z.string().url('Invalid image URL').nullable().optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.number().int().nonnegative().optional(),

    // T15.8 — new fields
    discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_ADDON']).optional().nullable(),
    discountValue: z
      .union([z.string(), z.number()])
      .optional()
      .nullable()
      .transform((v) => {
        if (v === null || v === undefined || v === '') return null;
        const n = typeof v === 'string' ? parseFloat(v) : v;
        return isNaN(n) ? null : n;
      }),
    applyTo: z.enum(['ENTIRE_MENU', 'CATEGORY', 'SPECIFIC_ITEMS']).optional().nullable(),
    categoryId: z.string().nullable().optional(),
    timeRestrictions: timeRestrictionsSchema.optional().nullable(),
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
  )
  .refine(
    (data) => {
      if (data.applyTo === 'CATEGORY') {
        return !!data.categoryId;
      }
      return true;
    },
    {
      message: 'Please select a category',
      path: ['categoryId'],
    }
  );

// ── Reorder promotions schema ───────────────────────────────────────────────

export const reorderPromotionsSchema = z.object({
  promotions: z.array(
    z.object({
      id: z.string().cuid(),
      sortOrder: z.number().int().nonnegative(),
    })
  ),
});

// ── Promotion query params schema ───────────────────────────────────────────

export const promotionQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
  isActive: z.coerce.boolean().optional(),
  includeExpired: z.coerce.boolean().default(false),
});

// ── Types ───────────────────────────────────────────────────────────────────

export type CreatePromotionInput = z.infer<typeof createPromotionSchema>;
export type UpdatePromotionInput = z.infer<typeof updatePromotionSchema>;
export type ReorderPromotionsInput = z.infer<typeof reorderPromotionsSchema>;
export type PromotionQueryInput = z.infer<typeof promotionQuerySchema>;
