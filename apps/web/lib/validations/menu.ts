import { z } from 'zod';

// Slug validation (URL-friendly)
const slugSchema = z
  .string()
  .min(3, 'Slug must be at least 3 characters')
  .max(50, 'Slug must be less than 50 characters')
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Slug must contain only lowercase letters, numbers, and hyphens'
  );

// Hex color validation
const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color format');

const hexColorOptional = hexColorSchema.nullable().optional();

// Enums
const languageValues = ['KA', 'EN', 'RU'] as const;
const allergenDisplayValues = ['TEXT', 'ICON', 'WARNING'] as const;
const caloriesDisplayValues = ['DIRECT', 'FLIP_REVEAL', 'HIDDEN'] as const;
const qrStyleValues = ['SQUARE', 'ROUNDED', 'DOTS'] as const;
const menuLayoutValues = ['LINEAR', 'CATEGORIES_FIRST'] as const;
const menuTemplateValues = ['CLASSIC', 'MAGAZINE', 'COMPACT'] as const;
const productCardStyleValues = ['FLAT', 'BORDERED', 'ELEVATED', 'MINIMAL'] as const;
const productTouchEffectValues = ['NONE', 'SCALE', 'GLOW', 'GRADIENT'] as const;

// Create menu schema
export const createMenuSchema = z.object({
  name: z
    .string()
    .min(1, 'Menu name is required')
    .max(100, 'Menu name must be less than 100 characters'),
  slug: slugSchema,
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
});

// Update menu schema — all fields optional
export const updateMenuSchema = z.object({
  name: z
    .string()
    .min(1, 'Menu name is required')
    .max(100, 'Menu name must be less than 100 characters')
    .optional(),
  slug: slugSchema.optional(),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .nullable()
    .optional(),

  // Branding
  logoUrl: z.string().url('Invalid logo URL').nullable().optional(),
  primaryColor: hexColorOptional,
  accentColor: hexColorOptional,
  currencySymbol: z.string().max(5).nullable().optional(),

  // Typography
  headingFont: z.string().max(100).nullable().optional(),
  bodyFont: z.string().max(100).nullable().optional(),

  // Language config
  enabledLanguages: z.array(z.enum(languageValues)).min(1).optional(),

  // Display settings
  allergenDisplay: z.enum(allergenDisplayValues).optional(),
  caloriesDisplay: z.enum(caloriesDisplayValues).optional(),
  showNutrition: z.boolean().optional(),
  showDiscount: z.boolean().optional(),

  // Layout & visual style
  splitByType: z.boolean().optional(),
  menuLayout: z.enum(menuLayoutValues).optional(),
  menuTemplate: z.enum(menuTemplateValues).optional(),
  productCardStyle: z.enum(productCardStyleValues).optional(),
  productTouchEffect: z.enum(productTouchEffectValues).optional(),

  // Header info
  address: z.string().max(500).nullable().optional(),
  phone: z.string().max(50).nullable().optional(),
  wifiSsid: z.string().max(100).nullable().optional(),
  wifiPassword: z.string().max(100).nullable().optional(),
  wcDirection: z.string().max(500).nullable().optional(),
  wcImageUrl: z.string().url().nullable().optional(),
  locationLat: z.number().min(-90).max(90).nullable().optional(),
  locationLng: z.number().min(-180).max(180).nullable().optional(),

  // QR design
  qrStyle: z.enum(qrStyleValues).optional(),
  qrForegroundColor: hexColorOptional,
  qrBackgroundColor: hexColorOptional,
  qrLogoUrl: z.string().url().nullable().optional(),
  qrTemplate: z.string().max(50).nullable().optional(),
});

// Publish menu schema
export const publishMenuSchema = z.object({
  publish: z.boolean(),
});

// Menu query params schema
export const menuQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
  status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
});

export type CreateMenuInput = z.infer<typeof createMenuSchema>;
export type UpdateMenuInput = z.infer<typeof updateMenuSchema>;
export type PublishMenuInput = z.infer<typeof publishMenuSchema>;
export type MenuQueryInput = z.infer<typeof menuQuerySchema>;
