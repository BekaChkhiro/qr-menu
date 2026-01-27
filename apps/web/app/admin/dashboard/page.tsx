import Link from 'next/link';
import { Plus, UtensilsCrossed, BarChart3, Settings } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export const metadata = {
  title: 'Dashboard - Digital Menu',
  description: 'Manage your digital menus',
};

export default async function DashboardPage() {
  const session = await auth();
  const t = await getTranslations('admin.dashboard');
  const tMenus = await getTranslations('admin.menus');
  const tPlan = await getTranslations('admin.settings.plan');
  const tStatus = await getTranslations('status');

  const stats = await prisma.menu.aggregate({
    where: { userId: session?.user?.id },
    _count: true,
  });

  const publishedCount = await prisma.menu.count({
    where: { userId: session?.user?.id, status: 'PUBLISHED' },
  });

  const totalViews = await prisma.menuView.count({
    where: { menu: { userId: session?.user?.id } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('welcome', { name: session?.user?.name || 'User' })}
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/menus/new">
            <Plus className="mr-2 h-4 w-4" />
            {tMenus('create')}
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.totalMenus')}</CardTitle>
            <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats._count}</div>
            <p className="text-xs text-muted-foreground">
              {publishedCount} {tStatus('published').toLowerCase()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.totalViews')}</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalViews}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{tPlan('current')}</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tPlan((session?.user?.plan || 'FREE').toLowerCase() as 'free' | 'starter' | 'pro')}
            </div>
            <p className="text-xs text-muted-foreground">
              <Link href="/admin/settings" className="text-primary hover:underline">
                {tPlan('upgrade')}
              </Link>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('quickActions.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link href="/admin/menus">
                <UtensilsCrossed className="mr-2 h-4 w-4" />
                {tMenus('title')}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Getting Started */}
      {stats._count === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{tMenus('empty.title')}</CardTitle>
            <CardDescription>
              {tMenus('empty.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="mt-4" asChild>
              <Link href="/admin/menus/new">
                <Plus className="mr-2 h-4 w-4" />
                {tMenus('empty.action')}
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
