import { z } from 'zod';

export const updateNotificationsSchema = z.object({
  email: z.string().email().optional(),
  menuEditEmail: z.boolean().optional(),
  menuEditPush: z.boolean().optional(),
  outOfStockEmail: z.boolean().optional(),
  outOfStockPush: z.boolean().optional(),
  weeklyDigestEmail: z.boolean().optional(),
  weeklyDigestPush: z.boolean().optional(),
  invoiceReadyEmail: z.boolean().optional(),
  invoiceReadyPush: z.boolean().optional(),
  paymentFailedEmail: z.boolean().optional(),
  paymentFailedPush: z.boolean().optional(),
  newSignInEmail: z.boolean().optional(),
  newSignInPush: z.boolean().optional(),
});

export type UpdateNotificationsInput = z.infer<typeof updateNotificationsSchema>;
