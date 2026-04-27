import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db';
import {
  handleApiError,
  createSuccessResponse,
  createErrorResponse,
  ERROR_CODES,
} from '@/lib/api';
import { canCreateMenu } from '@/lib/auth/permissions';
import { logActivity } from '@/lib/activity/log';
import { sanitizeMenuResponse } from '@/lib/menu-visibility';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/menus/:id/clone
 * Clone a menu with all its categories, products, and variations.
 */
export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return createErrorResponse(
        ERROR_CODES.UNAUTHORIZED,
        'You must be logged in to clone this menu',
        401
      );
    }

    const { id: menuId } = await params;

    const sourceMenu = await prisma.menu.findUnique({
      where: { id: menuId },
      select: { userId: true },
    });

    if (!sourceMenu) {
      return createErrorResponse(
        ERROR_CODES.MENU_NOT_FOUND,
        'Menu not found',
        404
      );
    }

    if (sourceMenu.userId !== session.user.id) {
      return createErrorResponse(
        ERROR_CODES.FORBIDDEN,
        'You do not have permission to clone this menu',
        403
      );
    }

    // Plan-limit check
    const userWithMenus = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        _count: {
          select: { menus: true },
        },
      },
    });

    if (!userWithMenus) {
      return createErrorResponse(
        ERROR_CODES.USER_NOT_FOUND,
        'User not found',
        404
      );
    }

    if (!canCreateMenu(userWithMenus)) {
      return createErrorResponse(
        ERROR_CODES.PLAN_LIMIT_REACHED,
        'You have reached the maximum number of menus for your plan. Please upgrade to create more.',
        403
      );
    }

    // Fetch full menu with nested content
    const menuToClone = await prisma.menu.findUnique({
      where: { id: menuId },
      include: {
        categories: {
          orderBy: { sortOrder: 'asc' },
          include: {
            products: {
              orderBy: { sortOrder: 'asc' },
              include: {
                variations: {
                  orderBy: { sortOrder: 'asc' },
                },
              },
            },
          },
        },
      },
    });

    if (!menuToClone) {
      return createErrorResponse(
        ERROR_CODES.MENU_NOT_FOUND,
        'Menu not found',
        404
      );
    }

    // Generate unique slug
    const baseSlug = await generateUniqueSlug(menuToClone.slug);

    // Create cloned menu in a transaction
    const cloned = await prisma.$transaction(async (tx) => {
      const newMenu = await tx.menu.create({
        data: {
          userId: session.user.id,
          name: `${menuToClone.name} — Copy`,
          slug: baseSlug,
          description: menuToClone.description,
          status: 'DRAFT',
          // Branding
          logoUrl: menuToClone.logoUrl,
          coverImageUrl: menuToClone.coverImageUrl,
          primaryColor: menuToClone.primaryColor,
          accentColor: menuToClone.accentColor,
          currencySymbol: menuToClone.currencySymbol,
          cornerRadius: menuToClone.cornerRadius,
          // Typography
          headingFont: menuToClone.headingFont,
          bodyFont: menuToClone.bodyFont,
          // Languages
          enabledLanguages: menuToClone.enabledLanguages,
          // Display
          allergenDisplay: menuToClone.allergenDisplay,
          caloriesDisplay: menuToClone.caloriesDisplay,
          showNutrition: menuToClone.showNutrition,
          showDiscount: menuToClone.showDiscount,
          // Layout
          splitByType: menuToClone.splitByType,
          menuLayout: menuToClone.menuLayout,
          menuTemplate: menuToClone.menuTemplate,
          productCardStyle: menuToClone.productCardStyle,
          productTouchEffect: menuToClone.productTouchEffect,
          // Header info
          address: menuToClone.address,
          phone: menuToClone.phone,
          wifiSsid: menuToClone.wifiSsid,
          wifiPassword: menuToClone.wifiPassword,
          wcDirection: menuToClone.wcDirection,
          wcImageUrl: menuToClone.wcImageUrl,
          locationLat: menuToClone.locationLat,
          locationLng: menuToClone.locationLng,
          // QR
          qrStyle: menuToClone.qrStyle,
          qrForegroundColor: menuToClone.qrForegroundColor,
          qrBackgroundColor: menuToClone.qrBackgroundColor,
          qrLogoUrl: menuToClone.qrLogoUrl,
          qrTemplate: menuToClone.qrTemplate,
          // SEO
          metaTitle: menuToClone.metaTitle,
          metaDescription: menuToClone.metaDescription,
          shareImageUrl: menuToClone.shareImageUrl,
        },
      });

      // Clone categories and products
      for (const [catIndex, category] of menuToClone.categories.entries()) {
        const newCategory = await tx.category.create({
          data: {
            menuId: newMenu.id,
            nameKa: category.nameKa,
            nameEn: category.nameEn,
            nameRu: category.nameRu,
            descriptionKa: category.descriptionKa,
            descriptionEn: category.descriptionEn,
            descriptionRu: category.descriptionRu,
            type: category.type,
            sortOrder: catIndex,
          },
        });

        for (const [prodIndex, product] of category.products.entries()) {
          await tx.product.create({
            data: {
              categoryId: newCategory.id,
              nameKa: product.nameKa,
              nameEn: product.nameEn,
              nameRu: product.nameRu,
              descriptionKa: product.descriptionKa,
              descriptionEn: product.descriptionEn,
              descriptionRu: product.descriptionRu,
              price: product.price,
              oldPrice: product.oldPrice,
              currency: product.currency,
              imageUrl: product.imageUrl,
              imageFocalX: product.imageFocalX,
              imageFocalY: product.imageFocalY,
              imageZoom: product.imageZoom,
              allergens: product.allergens,
              ribbons: product.ribbons,
              isVegan: product.isVegan,
              isVegetarian: product.isVegetarian,
              calories: product.calories,
              protein: product.protein,
              fats: product.fats,
              carbs: product.carbs,
              fiber: product.fiber,
              isAvailable: product.isAvailable,
              sortOrder: prodIndex,
              variations: {
                create: product.variations.map((v) => ({
                  nameKa: v.nameKa,
                  nameEn: v.nameEn,
                  nameRu: v.nameRu,
                  price: v.price,
                  sortOrder: v.sortOrder,
                })),
              },
            },
          });
        }
      }

      return tx.menu.findUniqueOrThrow({
        where: { id: newMenu.id },
        include: {
          _count: {
            select: { categories: true, views: true },
          },
        },
      });
    });

    await logActivity({
      userId: session.user.id,
      menuId: cloned.id,
      type: 'MENU_CREATED',
      payload: { menuName: cloned.name, clonedFrom: menuId },
    });

    return createSuccessResponse(sanitizeMenuResponse(cloned), 201);
  } catch (error) {
    return handleApiError(error);
  }
}

async function generateUniqueSlug(base: string): Promise<string> {
  const candidate = `${base}-copy`;
  const taken = await prisma.menu.findUnique({
    where: { slug: candidate },
    select: { id: true },
  });
  if (!taken) return candidate;

  for (let i = 2; i < 50; i++) {
    const next = `${base}-copy-${i}`;
    const exists = await prisma.menu.findUnique({
      where: { slug: next },
      select: { id: true },
    });
    if (!exists) return next;
  }

  return `${base}-copy-${Math.random().toString(36).slice(2, 6)}`;
}
