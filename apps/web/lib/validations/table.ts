import { z } from 'zod';

// Shared field rules
const pinSchema = z
  .string()
  .regex(/^\d{4}$/, 'PIN must be exactly 4 digits');

const guestNameSchema = z
  .string()
  .trim()
  .min(1, 'Name is required')
  .max(32, 'Name must be 32 characters or fewer');

// Host creates a new table session.
export const createTableSchema = z.object({
  hostName: guestNameSchema,
  pin: pinSchema,
  maxGuests: z
    .number()
    .int()
    .min(2, 'At least 2 guests are required')
    .max(20, 'Up to 20 guests allowed'),
});

// Guest joins an existing table session via code + PIN.
export const joinTableSchema = z.object({
  name: guestNameSchema,
  pin: pinSchema,
});

// Guest adds a product (with optional variation) to their personal tray.
export const addSelectionSchema = z.object({
  productId: z.string().cuid(),
  variationId: z.string().cuid().optional(),
  quantity: z
    .number()
    .int()
    .min(1, 'Quantity must be at least 1')
    .max(99, 'Quantity must be 99 or fewer'),
  note: z
    .string()
    .max(200, 'Note must be 200 characters or fewer')
    .optional(),
});

export type CreateTableInput = z.infer<typeof createTableSchema>;
export type JoinTableInput = z.infer<typeof joinTableSchema>;
export type AddSelectionInput = z.infer<typeof addSelectionSchema>;
