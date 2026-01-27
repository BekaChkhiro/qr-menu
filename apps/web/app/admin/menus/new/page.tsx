'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { MenuForm } from '@/components/admin/menu-form';
import { useCreateMenu } from '@/hooks/use-menus';
import type { CreateMenuInput } from '@/lib/validations/menu';

export default function NewMenuPage() {
  const router = useRouter();
  const createMenu = useCreateMenu();
  const t = useTranslations('admin.menus');

  const handleSubmit = async (data: CreateMenuInput) => {
    const menu = await createMenu.mutateAsync(data);
    router.push(`/admin/menus/${menu.id}`);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/menus">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('create')}</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('form.name')}</CardTitle>
        </CardHeader>
        <CardContent>
          <MenuForm
            onSubmit={handleSubmit}
            isLoading={createMenu.isPending}
          />
          {createMenu.error && (
            <p className="mt-4 text-sm text-destructive">
              {createMenu.error.message}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
