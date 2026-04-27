import { z } from 'zod';

export const updateBusinessSchema = z.object({
  logoUrl: z.string().url().optional().or(z.literal('')),
  businessName: z.string().trim().max(120).optional().or(z.literal('')),
  tagline: z.string().trim().max(200).optional().or(z.literal('')),
  cuisines: z.array(z.string().trim().max(30)).max(4).optional(),
  priceRange: z.number().int().min(1).max(4).optional().or(z.literal(0)),
  taxId: z.string().trim().max(50).optional().or(z.literal('')),
  businessType: z.string().trim().max(60).optional().or(z.literal('')),
  description: z.string().trim().max(500).optional().or(z.literal('')),
  streetAddress: z.string().trim().max(200).optional().or(z.literal('')),
  city: z.string().trim().max(100).optional().or(z.literal('')),
  postalCode: z.string().trim().max(20).optional().or(z.literal('')),
  country: z.string().trim().max(100).optional().or(z.literal('')),
  publicEmail: z.string().trim().max(120).optional().or(z.literal('')),
  publicPhone: z.string().trim().max(30).optional().or(z.literal('')),
  websiteUrl: z.string().trim().max(200).optional().or(z.literal('')),
  instagramHandle: z.string().trim().max(100).optional().or(z.literal('')),
  openingHours: z
    .array(
      z.object({
        day: z.string(),
        open: z.string(),
        close: z.string(),
        closed: z.boolean(),
      })
    )
    .optional(),
});

export type UpdateBusinessInput = z.infer<typeof updateBusinessSchema>;
