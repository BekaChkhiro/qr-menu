import Link from 'next/link';
import { Plus } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Button } from '@/components/ui/button';
import { MenusList } from '@/components/admin/menus-list';

export const metadata = {
  title: 'Menus - Digital Menu',
  description: 'Manage your digital menus',
};

export default async function MenusPage() {
  const t = await getTranslations('admin.menus');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        </div>
        <Button asChild>
          <Link href="/admin/menus/new">
            <Plus className="mr-2 h-4 w-4" />
            {t('create')}
          </Link>
        </Button>
      </div>

      <MenusList />
    </div>
  );
}
