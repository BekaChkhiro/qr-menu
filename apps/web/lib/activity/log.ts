import { ActivityType, Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';

export interface ActivityPayload {
  menuName?: string;
  productName?: string;
  categoryName?: string;
  promotionName?: string;
  oldPrice?: number;
  newPrice?: number;
  currencySymbol?: string;
  [key: string]: unknown;
}

interface LogActivityParams {
  userId: string;
  type: ActivityType;
  menuId?: string | null;
  payload?: ActivityPayload;
}

export async function logActivity({
  userId,
  type,
  menuId,
  payload = {},
}: LogActivityParams): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        type,
        menuId: menuId ?? null,
        payload: payload as Prisma.InputJsonValue,
      },
    });
  } catch (err) {
    console.error('[logActivity] failed to write activity log', {
      userId,
      type,
      menuId,
      err,
    });
  }
}
