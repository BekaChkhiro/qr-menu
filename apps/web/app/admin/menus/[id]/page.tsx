'use client';

import { use, useEffect, useRef, useState } from 'react';
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
import { PhonePreview, PhonePreviewSkeleton } from '@/components/admin/phone-preview';
import { AnalyticsContent } from '@/components/admin/analytics-content';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMenu, usePublishMenu } from '@/hooks/use-menus';
import { useMenuRealtime } from '@/hooks/use-menu-realtime';
import { useUserPlan } from '@/hooks/use-user-plan';

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
  const { hasFeature } = useUserPlan();
  // Subscribe to real-time updates for this menu
  useMenuRealtime(id);

  // Track menu data changes to refresh phone preview
  const [previewVersion, setPreviewVersion] = useState(0);
  const prevMenuRef = useRef(menu);
  useEffect(() => {
    if (menu && prevMenuRef.current && menu !== prevMenuRef.current) {
      setPreviewVersion((v) => v + 1);
    }
    prevMenuRef.current = menu;
  }, [menu]);

  // Calculate total products across all categories
  const totalMenuProducts = menu?.categories.reduce(
    (acc, cat) => acc + (cat._count?.products ?? cat.products?.length ?? 0),
    0
  ) ?? 0;

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
          <Button variant="ghost" size="icon" className="rounded-full" asChild>
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
    <div className="flex h-[calc(100vh-3rem)] flex-col">
      {/* Header (fixed) */}
      <div className="shrink-0">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="rounded-full" asChild>
              <Link href="/admin/menus">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-[28px] font-bold leading-[1.2] tracking-tight">{menu.name}</h1>
                <Badge variant={isPublished ? 'success' : 'secondary'}>
                  {isPublished ? tStatus('published') : tStatus('draft')}
                </Badge>
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">/{menu.slug}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="rounded-full bg-white"
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
            <Button variant="outline" className="rounded-full bg-white" asChild>
              <Link href={`/admin/menus/${id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                {tActions('edit')}
              </Link>
            </Button>
            {isPublished && (
              <Button variant="outline" className="rounded-full bg-white" asChild>
                <Link href={publicUrl} target="_blank">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View
                </Link>
              </Button>
            )}
            <QRCodeDialog menuId={id} menuName={menu.name} menuSlug={menu.slug} />
          </div>
        </div>

        <Separator className="mt-2" />
      </div>

      {/* Two-column layout: scrollable left + fixed right */}
      <div className="flex min-h-0 flex-1 gap-6 pt-6">
        {/* Left column: scrollable editor content */}
        <div className="scrollbar-hide flex min-w-0 flex-1 flex-col overflow-y-auto">
          {/* Tabs */}
          <Tabs defaultValue="overview" className="flex-1">
            <TabsList className="sticky top-0 z-10 w-full">
              <TabsTrigger value="overview" className="flex-1">
                {t('sidebar.dashboard')}
              </TabsTrigger>
              <TabsTrigger value="categories" className="flex-1">
                {t('categories.title')} & {t('products.title')}
              </TabsTrigger>
              <TabsTrigger value="promotions" className="flex-1">
                {t('promotions.title')}
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex-1">
                {t('sidebar.analytics')}
              </TabsTrigger>
              <TabsTrigger value="info" className="flex-1">
                {t('menus.info.title')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 space-y-4">
              {/* Stats Cards */}
              <div className="grid gap-4 sm:grid-cols-3">
                <Card className="rounded-2xl">
                  <CardHeader className="flex flex-row items-center justify-between px-6 pb-2 pt-4">
                    <CardTitle className="text-sm font-medium">{t('categories.title')}</CardTitle>
                    <FolderPlus className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="px-6 pb-4 pt-0">
                    <div className="text-2xl font-bold">{menu._count.categories}</div>
                    <p className="text-xs text-muted-foreground">
                      {menu.categories.reduce((acc, cat) => acc + (cat._count?.products ?? cat.products?.length ?? 0), 0)} {t('products.title').toLowerCase()}
                    </p>
                  </CardContent>
                </Card>
                <Card className="rounded-2xl">
                  <CardHeader className="flex flex-row items-center justify-between px-6 pb-2 pt-4">
                    <CardTitle className="text-sm font-medium">{t('dashboard.stats.totalViews')}</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="px-6 pb-4 pt-0">
                    <div className="text-2xl font-bold">{menu._count.views}</div>
                  </CardContent>
                </Card>
                <Card className="rounded-2xl">
                  <CardHeader className="flex flex-row items-center justify-between px-6 pb-2 pt-4">
                    <CardTitle className="text-sm font-medium">{t('promotions.title')}</CardTitle>
                  </CardHeader>
                  <CardContent className="px-6 pb-4 pt-0">
                    <div className="text-2xl font-bold">{menu.promotions.length}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Categories preview */}
              <Card className="rounded-2xl">
                <CardHeader className="border-b px-6 pb-4 pt-5">
                  <CardTitle className="text-base font-semibold">{t('categories.title')} & {t('products.title')}</CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6 pt-4">
                  <CategoriesList
                    menuId={id}
                    showAllergens={hasFeature('allergens')}
                    totalMenuProducts={totalMenuProducts}
                  />
                </CardContent>
              </Card>

              {/* Promotions preview */}
              <Card className="rounded-2xl">
                <CardHeader className="border-b px-6 pb-4 pt-5">
                  <CardTitle className="text-base font-semibold">{t('promotions.title')}</CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6 pt-4">
                  <PromotionsList menuId={id} />
                </CardContent>
              </Card>

              {/* Info preview */}
              <Card className="rounded-2xl">
                <CardHeader className="border-b px-6 pb-4 pt-5">
                  <CardTitle className="text-base font-semibold">{t('menus.info.title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 px-6 pb-6 pt-4">
                  {menu.description && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {t('menus.form.description')}
                      </p>
                      <p className="mt-1">{menu.description}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {t('menus.info.publicUrl')}
                    </p>
                    <p className="mt-1 font-mono text-sm">
                      {typeof window !== 'undefined' && window.location.origin}
                      {publicUrl}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="categories" className="mt-4">
              <Card className="rounded-2xl">
                <CardContent className="px-6 pt-6">
                  <CategoriesList
                    menuId={id}
                    showAllergens={hasFeature('allergens')}
                    totalMenuProducts={totalMenuProducts}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="promotions" className="mt-4">
              <Card className="rounded-2xl">
                <CardHeader className="border-b px-6 pb-4 pt-5">
                  <CardDescription>
                    Manage special offers and promotions for this menu
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-6 pb-6 pt-4">
                  <PromotionsList menuId={id} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="mt-4">
              <AnalyticsContent menuId={id} />
            </TabsContent>

            <TabsContent value="info" className="mt-4">
              <Card className="rounded-2xl">
                <CardContent className="space-y-4 px-6 pt-6">
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
            </TabsContent>
          </Tabs>
        </div>

        {/* Right column: sticky phone preview (desktop only) */}
        <div className="hidden w-[340px] shrink-0 lg:block">
          <div className="sticky top-0">
            <PhonePreview
              url={isPublished ? publicUrl : `${publicUrl}?preview=true`}
              refreshKey={previewVersion}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function MenuDetailSkeleton() {
  return (
    <div className="flex h-[calc(100vh-3rem)] flex-col">
      {/* Header skeleton */}
      <div className="shrink-0">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="mt-1 h-4 w-28" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-28 rounded-full" />
            <Skeleton className="h-10 w-24 rounded-full" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        </div>

        <Separator className="mt-2" />
      </div>

      {/* Two-column skeleton */}
      <div className="flex min-h-0 flex-1 gap-6 pt-6">
        {/* Left column */}
        <div className="min-w-0 flex-1 space-y-4">
          {/* Tabs skeleton */}
          <Skeleton className="h-10 w-full rounded-full" />

          {/* Stats cards skeleton */}
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="rounded-2xl">
                <CardHeader className="px-6 pb-2 pt-4">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent className="px-6 pb-4 pt-0">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="mt-1 h-3 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Content card skeleton */}
          <Card className="rounded-2xl">
            <CardHeader className="border-b px-6 pb-4 pt-5">
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right column: phone preview skeleton */}
        <div className="hidden w-[340px] shrink-0 lg:block">
          <PhonePreviewSkeleton />
        </div>
      </div>
    </div>
  );
}
