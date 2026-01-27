import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import {
  handleApiError,
  createSuccessResponse,
  createErrorResponse,
  ERROR_CODES,
} from '@/lib/api';
import { cacheGetOrSet, CACHE_KEYS, CACHE_TTL } from '@/lib/cache/redis';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * GET /api/menus/public/:slug
 * Get a published menu by slug (public access, cached)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;

    // Try to get from cache first, or fetch from DB
    const menu = await cacheGetOrSet(
      CACHE_KEYS.publicMenu(slug),
      async () => {
        return prisma.menu.findUnique({
          where: {
            slug,
            status: 'PUBLISHED',
          },
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            logoUrl: true,
            primaryColor: true,
            accentColor: true,
            status: true,
            publishedAt: true,
            categories: {
              orderBy: { sortOrder: 'asc' },
              select: {
                id: true,
                nameKa: true,
                nameEn: true,
                nameRu: true,
                descriptionKa: true,
                descriptionEn: true,
                descriptionRu: true,
                sortOrder: true,
                products: {
                  where: { isAvailable: true },
                  orderBy: { sortOrder: 'asc' },
                  select: {
                    id: true,
                    nameKa: true,
                    nameEn: true,
                    nameRu: true,
                    descriptionKa: true,
                    descriptionEn: true,
                    descriptionRu: true,
                    price: true,
                    currency: true,
                    imageUrl: true,
                    allergens: true,
                    sortOrder: true,
                    variations: {
                      orderBy: { sortOrder: 'asc' },
                      select: {
                        id: true,
                        nameKa: true,
                        nameEn: true,
                        nameRu: true,
                        price: true,
                        sortOrder: true,
                      },
                    },
                  },
                },
              },
            },
            promotions: {
              where: {
                isActive: true,
                startDate: { lte: new Date() },
                endDate: { gte: new Date() },
              },
              orderBy: { startDate: 'asc' },
              select: {
                id: true,
                titleKa: true,
                titleEn: true,
                titleRu: true,
                descriptionKa: true,
                descriptionEn: true,
                descriptionRu: true,
                imageUrl: true,
                startDate: true,
                endDate: true,
              },
            },
          },
        });
      },
      CACHE_TTL.PUBLIC_MENU
    );

    if (!menu) {
      return createErrorResponse(
        ERROR_CODES.MENU_NOT_FOUND,
        'Menu not found or not published',
        404
      );
    }

    return createSuccessResponse(menu);
  } catch (error) {
    return handleApiError(error);
  }
}
