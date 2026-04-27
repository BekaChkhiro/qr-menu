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
  currency: z.enum(['GEL', 'USD', 'EUR']).optional(),
  priceFormat: z.enum(['12.50 ₾', '₾12.50', '12,50 ₾']).optional(),
});

export const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password must be less than 128 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
