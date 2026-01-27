'use client';

import { use } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  ArrowLeft,
  Edit,
  Eye,
  EyeOff,
  ExternalLink,
  FolderPlus,
  BarChart3,
} from 'lucide-react';
import { CategoriesList } from '@/components/admin/categories-list';
import { PromotionsList } from '@/components/admin/promotions-list';
import { QRCodeDialog } from '@/components/admin/qr-code-dialog';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useMenu, usePublishMenu } from '@/hooks/use-menus';

interface MenuDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function MenuDetailPage({ params }: MenuDetailPageProps) {
  const { id } = use(params);
  const { data: menu, isLoading, error } = useMenu(id);
  const publishMenu = usePublishMenu(id);
  const t = useTranslations('admin');
  const tStatus = useTranslations('status');
  const tActions = useTranslations('actions');

  const handleTogglePublish = async () => {
    if (!menu) return;
    const newStatus = menu.status !== 'PUBLISHED';
    await publishMenu.mutateAsync(newStatus);
  };

  if (isLoading) {
    return <MenuDetailSkeleton />;
  }

  if (error || !menu) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/menus">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Menu</h1>
        </div>
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <p className="text-destructive">
            {error?.message || 'Menu not found'}
          </p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/admin/menus">Back to Menus</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isPublished = menu.status === 'PUBLISHED';
  const publicUrl = `/m/${menu.slug}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/menus">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{menu.name}</h1>
              <Badge variant={isPublished ? 'success' : 'secondary'}>
                {isPublished ? tStatus('published') : tStatus('draft')}
              </Badge>
            </div>
            <p className="text-muted-foreground">/{menu.slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleTogglePublish}
            disabled={publishMenu.isPending}
          >
            {isPublished ? (
              <>
                <EyeOff className="mr-2 h-4 w-4" />
                {tActions('unpublish')}
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" />
                {tActions('publish')}
              </>
            )}
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/admin/menus/${id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              {tActions('edit')}
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/admin/menus/${id}/analytics`}>
              <BarChart3 className="mr-2 h-4 w-4" />
              {t('sidebar.analytics')}
            </Link>
          </Button>
          {isPublished && (
            <Button variant="outline" asChild>
              <Link href={publicUrl} target="_blank">
                <ExternalLink className="mr-2 h-4 w-4" />
                View
              </Link>
            </Button>
          )}
          <QRCodeDialog menuId={id} menuName={menu.name} menuSlug={menu.slug} />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('categories.title')}</CardTitle>
            <FolderPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{menu._count.categories}</div>
            <p className="text-xs text-muted-foreground">
              {menu.categories.reduce((acc, cat) => acc + (cat._count?.products ?? cat.products?.length ?? 0), 0)} {t('products.title').toLowerCase()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.stats.totalViews')}</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{menu._count.views}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('promotions.title')}</CardTitle>
            <Badge variant="outline" className="text-xs">
              {menu.promotions.length} {tStatus('active').toLowerCase()}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{menu.promotions.length}</div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Categories Section */}
      <Card>
        <CardHeader>
          <CardTitle>{t('categories.title')} & {t('products.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoriesList menuId={id} />
        </CardContent>
      </Card>

      {/* Promotions Section */}
      <Card>
        <CardHeader>
          <CardTitle>{t('promotions.title')}</CardTitle>
          <CardDescription>
            Manage special offers and promotions for this menu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PromotionsList menuId={id} />
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t('menus.info.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {menu.description && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t('menus.form.description')}
              </p>
              <p className="mt-1">{menu.description}</p>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t('menus.info.publicUrl')}
              </p>
              <p className="mt-1 font-mono text-sm">
                {typeof window !== 'undefined' && window.location.origin}
                {publicUrl}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MenuDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-5 w-32" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="mt-1 h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
