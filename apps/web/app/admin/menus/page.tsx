import Link from 'next/link';
import { Plus } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db';
import { PLAN_LIMITS } from '@/lib/auth/permissions';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { MenusList } from '@/components/admin/menus-list';
import { MenusPlanLimitBanner } from '@/components/admin/menus-plan-limit-banner';

export const metadata = {
  title: 'Menus - Digital Menu',
  description: 'Manage your digital menus',
};

export default async function MenusPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const userId = session.user.id;
  const plan = session.user.plan;
  const menuCount = await prisma.menu.count({ where: { userId } });

  const limit = PLAN_LIMITS[plan].maxMenus;
  const isAtLimit = Number.isFinite(limit) && menuCount >= limit;

  const t = await getTranslations('admin.menus');
  const tBanner = await getTranslations('admin.menus.limitBanner');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        </div>
        {isAtLimit ? (
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span data-testid="menus-create-tooltip-trigger" tabIndex={0}>
                  <Button
                    type="button"
                    disabled
                    aria-disabled="true"
                    data-testid="menus-create-button"
                    data-create-disabled="true"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {t('create')}
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>{tBanner('tooltip')}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <Button asChild data-testid="menus-create-button">
            <Link href="/admin/menus/new">
              <Plus className="mr-2 h-4 w-4" />
              {t('create')}
            </Link>
          </Button>
        )}
      </div>

      <MenusList />

      <MenusPlanLimitBanner plan={plan} menuCount={menuCount} />
    </div>
  );
}
