import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db';
import { ActivityFeed } from '@/components/admin/dashboard/activity-feed';
import { DashboardAnalyticsCard } from '@/components/admin/dashboard/analytics-card';
import { DashboardDeviceBreakdown } from '@/components/admin/dashboard/device-breakdown-card';
import { PlanUsageStrip } from '@/components/admin/dashboard/plan-usage-strip';
import { TopProductsCard } from '@/components/admin/dashboard/top-products-card';
import { UpgradeCard } from '@/components/admin/dashboard/upgrade-card';
import { WelcomeHeader } from '@/components/admin/dashboard/welcome-header';
import {
  YourMenusCard,
  type YourMenuRow,
} from '@/components/admin/dashboard/your-menus-card';
import { PLAN_LIMITS } from '@/lib/auth/permissions';

export const metadata = {
  title: 'Dashboard - Digital Menu',
  description: 'Manage your digital menus',
};

// Approximate storage cost per product image (Cloudinary-optimized avg).
const STORAGE_MB_PER_IMAGE = 0.15;

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const userId = session.user.id;
  const plan = session.user.plan;
  const limits = PLAN_LIMITS[plan];

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    menuCount,
    categoryCount,
    productCount,
    productsWithImages,
    publishedMenuCount,
    recentMenu,
    menus,
    todayViewRows,
    weekViewRows,
  ] = await Promise.all([
    prisma.menu.count({ where: { userId } }),
    prisma.category.count({ where: { menu: { userId } } }),
    prisma.product.count({ where: { category: { menu: { userId } } } }),
    prisma.product.count({
      where: {
        category: { menu: { userId } },
        imageUrl: { not: null },
      },
    }),
    prisma.menu.count({ where: { userId, status: 'PUBLISHED' } }),
    prisma.menu.findFirst({
      where: { userId, status: 'PUBLISHED' },
      orderBy: { updatedAt: 'desc' },
      select: { slug: true },
    }),
    prisma.menu.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        updatedAt: true,
      },
    }),
    prisma.menuView.groupBy({
      by: ['menuId'],
      where: {
        menu: { userId },
        viewedAt: { gte: todayStart },
      },
      _count: { _all: true },
    }),
    prisma.menuView.groupBy({
      by: ['menuId'],
      where: {
        menu: { userId },
        viewedAt: { gte: weekStart },
      },
      _count: { _all: true },
    }),
  ]);

  const storageMb = productsWithImages * STORAGE_MB_PER_IMAGE;

  const todayByMenu = new Map<string, number>(
    todayViewRows.map((row) => [row.menuId, row._count._all]),
  );
  const weekByMenu = new Map<string, number>(
    weekViewRows.map((row) => [row.menuId, row._count._all]),
  );

  const menuRows: YourMenuRow[] = menus.map((menu) => ({
    id: menu.id,
    name: menu.name,
    slug: menu.slug,
    status: menu.status,
    viewsToday: todayByMenu.get(menu.id) ?? 0,
    viewsWeek: weekByMenu.get(menu.id) ?? 0,
    updatedAt: menu.updatedAt.toISOString(),
  }));

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-6">
      <WelcomeHeader
        firstName={session.user.name ?? null}
        publicMenuSlug={recentMenu?.slug ?? null}
      />

      <PlanUsageStrip
        plan={plan}
        counts={{
          menus: menuCount,
          menusLimit: limits.maxMenus,
          categories: categoryCount,
          categoriesLimit: limits.maxCategories,
          products: productCount,
          productsLimit: limits.maxProducts,
          storageMb,
        }}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DashboardAnalyticsCard
            plan={plan}
            publishedMenuCount={publishedMenuCount}
          />
        </div>
        <div className="lg:col-span-1">
          <DashboardDeviceBreakdown plan={plan} />
        </div>
      </div>

      <YourMenusCard menus={menuRows} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ActivityFeed userId={userId} />
        <TopProductsCard />
      </div>

      <UpgradeCard plan={plan} />
    </div>
  );
}
