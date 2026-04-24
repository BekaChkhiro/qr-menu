import { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db';
import {
  createErrorResponse,
  createSuccessResponse,
  ERROR_CODES,
  handleApiError,
} from '@/lib/api';

// GET /api/user/top-products?limit=5&days=30
//
// Returns the dashboard Top Products widget rows.
//
// Per-product view tracking is explicitly out of scope for MVP (MenuView
// currently aggregates at the menu level only). Until the Advanced Analytics
// backend lands, this endpoint uses a deterministic heuristic: the current
// user's products, sorted by (price DESC, updatedAt DESC), capped at `limit`.
// This keeps the widget functional and the relative-popularity bar meaningful
// while the data quality matches the "Coming soon" expectation.
//
// `days` is accepted for forward compatibility — once per-product views exist
// it will scope the view count to that window. For now we only use it to
// surface the period label in the response.

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(5),
  days: z.coerce.number().int().min(1).max(365).default(30),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse(
        ERROR_CODES.UNAUTHORIZED,
        'You must be logged in to view top products',
        401,
      );
    }

    const { searchParams } = new URL(request.url);
    const { limit, days } = querySchema.parse({
      limit: searchParams.get('limit') ?? undefined,
      days: searchParams.get('days') ?? undefined,
    });

    const userId = session.user.id;

    const products = await prisma.product.findMany({
      where: {
        category: { menu: { userId } },
      },
      orderBy: [{ price: 'desc' }, { updatedAt: 'desc' }],
      take: limit,
      select: {
        id: true,
        nameKa: true,
        nameEn: true,
        nameRu: true,
        price: true,
        currency: true,
        imageUrl: true,
        updatedAt: true,
        category: {
          select: {
            id: true,
            nameKa: true,
            nameEn: true,
            nameRu: true,
            menu: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    // Synthesize a descending "views" series so the popularity bar renders
    // meaningfully even with no real view data. The top row gets 100% fill;
    // each subsequent row steps down by ~15–18%. The numbers are stable per
    // position (not random) so snapshots and baselines stay deterministic.
    const HEURISTIC_VIEWS = [1842, 1580, 1220, 968, 742, 598, 472, 361, 268, 184];

    const rows = products.map((product, i) => ({
      id: product.id,
      rank: i + 1,
      name: {
        ka: product.nameKa,
        en: product.nameEn,
        ru: product.nameRu,
      },
      category: {
        id: product.category.id,
        name: {
          ka: product.category.nameKa,
          en: product.category.nameEn,
          ru: product.category.nameRu,
        },
      },
      menu: {
        id: product.category.menu.id,
        name: product.category.menu.name,
      },
      price: product.price.toString(),
      currency: product.currency,
      imageUrl: product.imageUrl,
      // Heuristic-only for now; see route comment above.
      views: HEURISTIC_VIEWS[i] ?? Math.max(100, 1842 - i * 180),
    }));

    return createSuccessResponse({
      rows,
      period: { days },
      heuristic: true,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
