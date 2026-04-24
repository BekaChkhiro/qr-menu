import { z } from 'zod';

export const updateProfileSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, 'First name is required')
    .max(60)
    .optional(),
  lastName: z
    .string()
    .trim()
    .min(1, 'Last name is required')
    .max(60)
    .optional(),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  timezone: z.string().trim().max(100).optional().or(z.literal('')),
  dateFormat: z
    .enum(['DD.MM.YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'])
    .optional(),
  image: z.string().url().optional().or(z.literal('')), // empty string = remove avatar
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
