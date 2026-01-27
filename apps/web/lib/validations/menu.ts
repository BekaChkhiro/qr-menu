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
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color format')
  .optional();

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

// Update menu schema
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
  logoUrl: z.string().url('Invalid logo URL').nullable().optional(),
  primaryColor: hexColorSchema,
  accentColor: hexColorSchema,
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
