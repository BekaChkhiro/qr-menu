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

// T15.13 — Visibility is a derived field that the Settings tab writes alongside
// `status` and `passwordHash` in a single PATCH. The server maps:
//   PUBLISHED          → status=PUBLISHED, passwordHash=null
//   PASSWORD_PROTECTED → status=PUBLISHED, passwordHash=bcrypt(password)
//   PRIVATE_DRAFT      → status=DRAFT,     passwordHash=null
export const menuVisibilityValues = [
  'PUBLISHED',
  'PASSWORD_PROTECTED',
  'PRIVATE_DRAFT',
] as const;
export type MenuVisibility = (typeof menuVisibilityValues)[number];

// Create menu schema (legacy path — used by the "Create menu" form)
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

// Empty-state template IDs (T12.3). When the client POSTs
// `{ template: 'cafe-bakery' }`, the server generates a default name + unique
// slug and seeds preset categories/products.
export const menuStarterTemplateValues = [
  'cafe-bakery',
  'full-restaurant',
  'bar-cocktails',
] as const;
export type MenuStarterTemplateKey =
  (typeof menuStarterTemplateValues)[number];

export const createMenuFromTemplateSchema = z.object({
  template: z.enum(menuStarterTemplateValues),
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
  coverImageUrl: z.string().url('Invalid cover image URL').nullable().optional(),
  primaryColor: hexColorOptional,
  accentColor: hexColorOptional,
  currencySymbol: z.string().max(5).nullable().optional(),
  cornerRadius: z.number().int().min(0).max(24).nullable().optional(),

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

  // Schedule (T15.14)
  scheduledPublishAt: z.string().datetime().nullable().optional(),
  scheduledUnpublishAt: z.string().datetime().nullable().optional(),

  // SEO / Open Graph (T15.14)
  metaTitle: z.string().max(120).nullable().optional(),
  metaDescription: z.string().max(300).nullable().optional(),
  shareImageUrl: z.string().url('Invalid image URL').nullable().optional(),

  // Direct status update — used by the Settings → Advanced "Archive" action.
  // `visibility` (below) takes precedence: when both are present the server
  // derives status from visibility and the explicit status value is overwritten.
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),

  // Visibility + password (T15.13).
  // `visibility` overrides `status`/`passwordHash` when present; the server
  // ignores any explicit status/passwordHash in the same body.
  visibility: z.enum(menuVisibilityValues).optional(),
  // Plaintext password — only consumed when `visibility === 'PASSWORD_PROTECTED'`.
  // Server hashes with bcrypt. Omitting the field while visibility is
  // PASSWORD_PROTECTED preserves the existing hash (useful for editing the
  // URL without rotating the password).
  password: z
    .string()
    .min(4, 'Password must be at least 4 characters')
    .max(100, 'Password must be less than 100 characters')
    .optional(),
});

// Publish menu schema
export const publishMenuSchema = z.object({
  publish: z.boolean(),
});

// Menu query params schema
export const menuQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
});

export type CreateMenuInput = z.infer<typeof createMenuSchema>;
export type UpdateMenuInput = z.infer<typeof updateMenuSchema>;
export type PublishMenuInput = z.infer<typeof publishMenuSchema>;
export type MenuQueryInput = z.infer<typeof menuQuerySchema>;
