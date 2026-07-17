import { z } from 'zod';

// ── Enums ───────────────────────────────────────────────────────────────────

// T22.19 — promotion type (owner spec): the drawer picks one of these three.
// PERCENTAGE keeps the discountType/discountValue percentage math; BANNER is a
// pure announcement (no price effect); COMBO bundles products at a combo price.
export const PromotionType = {
  PERCENTAGE: 'PERCENTAGE',
  BANNER: 'BANNER',
  COMBO: 'COMBO',
} as const;

export type PromotionTypeValue = (typeof PromotionType)[keyof typeof PromotionType];

export const DiscountType = {
  PERCENTAGE: 'PERCENTAGE',
  FIXED_AMOUNT: 'FIXED_AMOUNT',
  FREE_ADDON: 'FREE_ADDON',
} as const;

// Coerce "" / null / non-numeric → null; numeric strings → number.
const nullableNumber = z
  .union([z.string(), z.number()])
  .optional()
  .nullable()
  .transform((v) => {
    if (v === null || v === undefined || v === '') return null;
    const n = typeof v === 'string' ? parseFloat(v) : v;
    return isNaN(n) ? null : n;
  });

// T22.19/T22.20/T22.24 — shared appearance + type + combo fields.
const promotionExtraFields = {
  type: z.enum(['PERCENTAGE', 'BANNER', 'COMBO']).optional().nullable(),
  backgroundColor: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Use a hex color like #RRGGBB')
    .nullable()
    .optional(),
  showTitle: z.boolean().optional(),
  comboProductIds: z.array(z.string()).optional(),
  comboPrice: nullableNumber,
};

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

// ── Time restrictions schema (T22.21) ───────────────────────────────────────
//
// Per-day windows: each weekday can carry its own start/end (Mon 12:00–14:00,
// Tue 09:00–11:00). The canonical shape is `{ enabled, windows }`. The legacy
// flat shape `{ enabled, days[], startTime, endTime }` is still accepted on
// read and normalized into `windows` so old rows keep working.
const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
const HHMM = z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:MM format');

const timeWindowSchema = z.object({
  start: HHMM.default('09:00'),
  end: HHMM.default('18:00'),
});

export const timeRestrictionsSchema = z
  .object({
    enabled: z.boolean().default(false),
    windows: z.record(z.enum(WEEKDAYS), timeWindowSchema).optional(),
    // legacy (accepted on read; migrated below)
    days: z.array(z.enum(WEEKDAYS)).optional(),
    startTime: HHMM.optional(),
    endTime: HHMM.optional(),
  })
  .transform((v) => {
    let windows = v.windows ?? {};
    // Migrate legacy days[]+startTime+endTime → per-day windows.
    if ((!v.windows || Object.keys(v.windows).length === 0) && v.days?.length) {
      windows = Object.fromEntries(
        v.days.map((d) => [d, { start: v.startTime ?? '09:00', end: v.endTime ?? '18:00' }]),
      );
    }
    return { enabled: v.enabled, windows };
  });

export type TimeRestrictionsInput = z.infer<typeof timeRestrictionsSchema>;
export type WeekdayKey = (typeof WEEKDAYS)[number];

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
    ...promotionExtraFields,
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
  )
  // T22.18 — "specific items" scope retired; whole-menu / category only.
  .refine((data) => data.applyTo !== 'SPECIFIC_ITEMS', {
    message: 'Promotions apply to the whole menu or a category',
    path: ['applyTo'],
  });

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
    ...promotionExtraFields,
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
  )
  // T22.18 — "specific items" scope retired; whole-menu / category only.
  .refine((data) => data.applyTo !== 'SPECIFIC_ITEMS', {
    message: 'Promotions apply to the whole menu or a category',
    path: ['applyTo'],
  });

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
