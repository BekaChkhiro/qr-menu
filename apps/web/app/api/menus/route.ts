import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db';
import {
  handleApiError,
  createSuccessResponse,
  createErrorResponse,
  createPaginatedResponse,
  ERROR_CODES,
} from '@/lib/api';
import {
  createMenuSchema,
  createMenuFromTemplateSchema,
  menuQuerySchema,
} from '@/lib/validations';
import { canCreateMenu } from '@/lib/auth/permissions';
import { logActivity } from '@/lib/activity/log';
import {
  MENU_STARTER_TEMPLATES,
  type MenuStarterTemplate,
} from '@/lib/menu-templates';
import { sanitizeMenuResponse } from '@/lib/menu-visibility';

/**
 * GET /api/menus
 * List all menus for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return createErrorResponse(
        ERROR_CODES.UNAUTHORIZED,
        'You must be logged in to view menus',
        401
      );
    }

    const { searchParams } = new URL(request.url);
    const query = menuQuerySchema.parse({
      page: searchParams.get('page') ?? 1,
      limit: searchParams.get('limit') ?? 10,
      status: searchParams.get('status') ?? undefined,
    });

    const where = {
      userId: session.user.id,
      ...(query.status && { status: query.status }),
    };

    const [menusRaw, total] = await Promise.all([
      prisma.menu.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              categories: true,
              views: true,
            },
          },
          categories: {
            select: {
              _count: { select: { products: true } },
            },
          },
        },
      }),
      prisma.menu.count({ where }),
    ]);

    // Aggregate 7-day view counts once for the whole page so each row in the
    // table view can show a real "Views 7d" figure (T12.2) without an N+1.
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const menuIds = menusRaw.map((m) => m.id);
    const viewsLast7Raw = menuIds.length
      ? await prisma.menuView.groupBy({
          by: ['menuId'],
          where: { menuId: { in: menuIds }, viewedAt: { gte: sevenDaysAgo } },
          _count: { _all: true },
        })
      : [];
    const viewsLast7ByMenu = new Map(
      viewsLast7Raw.map((row) => [row.menuId, row._count._all]),
    );

    const menus = menusRaw.map(({ categories, passwordHash, ...menu }) => ({
      ...menu,
      hasPassword: Boolean(passwordHash),
      _count: {
        ...menu._count,
        products: (categories ?? []).reduce(
          (sum, c) => sum + (c?._count?.products ?? 0),
          0,
        ),
        viewsLast7Days: viewsLast7ByMenu.get(menu.id) ?? 0,
      },
    }));

    return createPaginatedResponse(menus, {
      page: query.page,
      limit: query.limit,
      total,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/menus
 * Create a new menu
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return createErrorResponse(
        ERROR_CODES.UNAUTHORIZED,
        'You must be logged in to create a menu',
        401
      );
    }

    // Check plan limits
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
        `You have reached the maximum number of menus for your plan. Please upgrade to create more menus.`,
        403
      );
    }

    const body = await request.json();

    // Branch: template-driven empty-state creation (T12.3).
    if (body && typeof body === 'object' && 'template' in body) {
      const { template } = createMenuFromTemplateSchema.parse(body);
      const tpl = MENU_STARTER_TEMPLATES[template];
      const slug = await generateUniqueMenuSlug(tpl.defaults.slugBase);

      const menu = await prisma.$transaction(async (tx) => {
        const created = await tx.menu.create({
          data: {
            name: tpl.defaults.nameEn,
            slug,
            userId: session.user.id,
          },
        });

        await seedTemplateContent(tx, created.id, tpl);

        return tx.menu.findUniqueOrThrow({
          where: { id: created.id },
          include: {
            _count: {
              select: { categories: true, views: true },
            },
          },
        });
      });

      await logActivity({
        userId: session.user.id,
        menuId: menu.id,
        type: 'MENU_CREATED',
        payload: { menuName: menu.name, template },
      });

      return createSuccessResponse(sanitizeMenuResponse(menu), 201);
    }

    const data = createMenuSchema.parse(body);

    // Check if slug is already taken
    const existingMenu = await prisma.menu.findUnique({
      where: { slug: data.slug },
    });

    if (existingMenu) {
      return createErrorResponse(
        ERROR_CODES.SLUG_EXISTS,
        'A menu with this slug already exists. Please choose a different slug.',
        409
      );
    }

    const menu = await prisma.menu.create({
      data: {
        ...data,
        userId: session.user.id,
      },
      include: {
        _count: {
          select: {
            categories: true,
            views: true,
          },
        },
      },
    });

    await logActivity({
      userId: session.user.id,
      menuId: menu.id,
      type: 'MENU_CREATED',
      payload: { menuName: menu.name },
    });

    return createSuccessResponse(sanitizeMenuResponse(menu), 201);
  } catch (error) {
    return handleApiError(error);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Template helpers
// ─────────────────────────────────────────────────────────────────────────────

type PrismaTx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

async function generateUniqueMenuSlug(base: string): Promise<string> {
  // Probe base, then base-2, base-3, … The race window here is small and
  // `menu.slug` has a DB unique constraint, so Prisma will still reject a
  // collision and the caller's catch block will return SLUG_EXISTS.
  let candidate = base;
  for (let i = 2; i < 50; i++) {
    const taken = await prisma.menu.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!taken) return candidate;
    candidate = `${base}-${i}`;
  }
  // Extremely unlikely fallback: append a random suffix.
  return `${base}-${Math.random().toString(36).slice(2, 6)}`;
}

async function seedTemplateContent(
  tx: PrismaTx,
  menuId: string,
  tpl: MenuStarterTemplate,
): Promise<void> {
  for (const [catIndex, cat] of tpl.categories.entries()) {
    const created = await tx.category.create({
      data: {
        menuId,
        nameKa: cat.nameKa,
        nameEn: cat.nameEn,
        type: cat.type,
        sortOrder: catIndex,
      },
    });

    if (cat.products.length === 0) continue;

    await tx.product.createMany({
      data: cat.products.map((p, prodIndex) => ({
        categoryId: created.id,
        nameKa: p.nameKa,
        nameEn: p.nameEn,
        descriptionKa: p.descriptionKa ?? null,
        descriptionEn: p.descriptionEn ?? null,
        price: p.priceGEL,
        sortOrder: prodIndex,
      })),
    });
  }
}
