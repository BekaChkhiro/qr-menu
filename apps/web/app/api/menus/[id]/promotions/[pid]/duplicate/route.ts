import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db';
import {
  handleApiError,
  createSuccessResponse,
  createErrorResponse,
  ERROR_CODES,
} from '@/lib/api';
import { hasFeature } from '@/lib/auth/permissions';
import { invalidateMenuCache } from '@/lib/cache/redis';
import { triggerMenuEvent, EVENTS } from '@/lib/pusher/server';
import { syncComboProduct } from '@/lib/promotions/combo';

interface RouteParams {
  params: Promise<{ id: string; pid: string }>;
}

// T24.7 — a duplicated title gets a " (copy)" suffix, localized per field so
// the operator can tell the clone apart in every language they author in.
const COPY_SUFFIX = {
  ka: ' (ასლი)',
  en: ' (copy)',
  ru: ' (копия)',
} as const;

function suffixed(value: string | null, locale: keyof typeof COPY_SUFFIX): string | null {
  if (!value) return value;
  return `${value}${COPY_SUFFIX[locale]}`;
}

/**
 * POST /api/menus/:id/promotions/:pid/duplicate
 *
 * T24.7 — clone an existing promotion. Everything the operator authored is
 * carried over (type, artwork, discount, combo contents, time windows); only
 * the identity fields change:
 *   - titles get a " (copy)" suffix,
 *   - the clone lands at the end of the carousel,
 *   - it starts switched OFF so a half-edited duplicate never goes live on the
 *     public menu the moment it is created.
 */
export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return createErrorResponse(
        ERROR_CODES.UNAUTHORIZED,
        'You must be logged in to duplicate a promotion',
        401
      );
    }

    const { id: menuId, pid } = await params;

    const menu = await prisma.menu.findUnique({
      where: { id: menuId },
      select: { userId: true, slug: true },
    });

    if (!menu) {
      return createErrorResponse(ERROR_CODES.MENU_NOT_FOUND, 'Menu not found', 404);
    }

    if (menu.userId !== session.user.id) {
      return createErrorResponse(
        ERROR_CODES.FORBIDDEN,
        'You do not have permission to modify this menu',
        403
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true },
    });

    if (!user) {
      return createErrorResponse(ERROR_CODES.USER_NOT_FOUND, 'User not found', 404);
    }

    if (!hasFeature(user.plan, 'promotions')) {
      return createErrorResponse(
        ERROR_CODES.FEATURE_NOT_AVAILABLE,
        'Promotions are only available for STARTER and PRO plans. Upgrade to access this feature.',
        403
      );
    }

    const source = await prisma.promotion.findFirst({
      where: { id: pid, menuId },
    });

    if (!source) {
      return createErrorResponse(
        ERROR_CODES.NOT_FOUND,
        'Promotion not found',
        404
      );
    }

    const last = await prisma.promotion.findFirst({
      where: { menuId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    const promotion = await prisma.promotion.create({
      data: {
        menuId,
        titleKa: `${source.titleKa}${COPY_SUFFIX.ka}`,
        titleEn: suffixed(source.titleEn, 'en'),
        titleRu: suffixed(source.titleRu, 'ru'),
        descriptionKa: source.descriptionKa,
        descriptionEn: source.descriptionEn,
        descriptionRu: source.descriptionRu,
        imageUrl: source.imageUrl,
        startDate: source.startDate,
        endDate: source.endDate,
        // Off by default — the operator opens the copy, edits, then switches on.
        isActive: false,
        sortOrder: (last?.sortOrder ?? -1) + 1,
        type: source.type,
        discountType: source.discountType,
        discountValue: source.discountValue,
        applyTo: source.applyTo,
        categoryId: source.categoryId,
        backgroundColor: source.backgroundColor,
        showTitle: source.showTitle,
        comboProductIds: source.comboProductIds,
        comboPrice: source.comboPrice,
        // Never copied: the generated combo product belongs to the source.
        // syncComboProduct below materializes a fresh one for the clone.
        comboProductId: null,
        timeRestrictions: source.timeRestrictions ?? undefined,
      },
    });

    await syncComboProduct(promotion.id);

    const promotionWithCategory = await prisma.promotion.findUnique({
      where: { id: promotion.id },
      include: { category: { select: { id: true, nameKa: true, nameEn: true, nameRu: true } } },
    });

    await invalidateMenuCache(menuId, menu.slug);
    await triggerMenuEvent(menuId, EVENTS.PROMOTION_CREATED, promotion);

    // No activity log here on purpose: the only promotion activity types are
    // STARTED / ENDED, and a duplicate is created switched off — it has not
    // started. It gets logged when the operator turns it on.

    return createSuccessResponse(promotionWithCategory ?? promotion, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
