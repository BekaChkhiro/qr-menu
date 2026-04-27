'use client';

import { use, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Card, CardContent } from '@/components/ui/card';
import { EditorHeader } from '@/components/admin/editor-header';
import { EditorTabBar, type EditorTab } from '@/components/ui/editor-tab-bar';
import { CategoriesList } from '@/components/admin/categories-list';
import { BrandingTab } from '@/components/admin/branding-tab';
import { LanguagesTab } from '@/components/admin/languages-tab';
import { EditorPromotionsTab } from '@/components/admin/editor-promotions-tab';
import { AnalyticsTab } from '@/components/admin/analytics/analytics-tab';
import { QrTab } from '@/components/admin/qr-tab';
import { MenuSettingsTab } from '@/components/admin/menu-settings-tab';
import { PhonePreviewSkeleton } from '@/components/admin/phone-preview';
import { PhonePreviewPanel } from '@/components/admin/phone-preview-panel';

import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useMenu, usePublishMenu, useUpdateMenu } from '@/hooks/use-menus';
import { useMenuRealtime } from '@/hooks/use-menu-realtime';
import { useUserPlan } from '@/hooks/use-user-plan';

// ── Tab ids (match URL query param `tab`) ───────────────────────────────────
const TAB_IDS = [
  'content',
  'branding',
  'languages',
  'analytics',
  'promotions',
  'qr',
  'settings',
] as const;
type TabId = (typeof TAB_IDS)[number];

const TABS_WITH_PREVIEW = new Set<TabId>(['content', 'branding']);

interface MenuDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function MenuDetailPage({ params }: MenuDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('admin');
  const tEditor = useTranslations('admin.editor');

  const { data: menu, isLoading, error } = useMenu(id);
  const publishMenu = usePublishMenu(id);
  const updateMenu = useUpdateMenu(id);
  const { hasFeature } = useUserPlan();

  // Bump preview version whenever any Pusher event fires so the iframe refetches
  // even in cases where our cached `menu` reference isn't touched (e.g. product
  // mutations that only invalidate lists the admin isn't rendering directly).
  const [previewVersion, setPreviewVersion] = useState(0);
  useMenuRealtime(id, {
    onEvent: useCallback(() => {
      setPreviewVersion((v) => v + 1);
    }, []),
  });

  // ── Active tab (URL-synced) ────────────────────────────────────────────────
  const rawTab = searchParams.get('tab');
  const activeTab: TabId = (TAB_IDS as readonly string[]).includes(rawTab ?? '')
    ? (rawTab as TabId)
    : 'content';

  const handleTabChange = useCallback(
    (id: string) => {
      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.set('tab', id);
      router.replace(`?${nextParams.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  // Also reload the preview when locally-mutated menu data (categories, products,
  // branding, etc.) lands in the query cache — covers the same-tab editor flow
  // where Pusher may or may not be configured.
  const prevMenuRef = useRef(menu);
  useEffect(() => {
    if (menu && prevMenuRef.current && menu !== prevMenuRef.current) {
      setPreviewVersion((v) => v + 1);
    }
    prevMenuRef.current = menu;
  }, [menu]);

  // ── Header handlers ────────────────────────────────────────────────────────
  const handleTogglePublish = useCallback(
    async (publish: boolean) => {
      try {
        await publishMenu.mutateAsync(publish);
        toast.success(
          publish ? t('menus.toast.published') : t('menus.toast.unpublished'),
        );
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : t('menus.toast.publishError'),
        );
      }
    },
    [publishMenu, t],
  );

  const handleSaveName = useCallback(
    async (nextName: string) => {
      await updateMenu.mutateAsync({ name: nextName });
      toast.success(t('menus.toast.updated'));
    },
    [updateMenu, t],
  );

  const handleShare = useCallback(() => {
    if (!menu) return;
    const publicUrl = `${window.location.origin}/m/${menu.slug}`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(publicUrl);
      toast.success(publicUrl);
    }
  }, [menu]);

  // ── Tab metadata (labels, hrefs) ───────────────────────────────────────────
  const tabs: EditorTab[] = useMemo(
    () =>
      TAB_IDS.map((tabId) => ({
        id: tabId,
        label: tEditor(`tabs.${tabId}`),
        href: `?tab=${tabId}`,
      })),
    [tEditor],
  );

  if (isLoading) {
    return <MenuDetailSkeleton />;
  }

  if (error || !menu) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-[24px] font-semibold text-text-default">
          {tEditor('errors.notFound')}
        </h1>
        <div
          role="alert"
          className="rounded-[12px] border border-danger/50 bg-danger-soft p-6 text-center"
        >
          <p className="text-danger">
            {error?.message || tEditor('errors.loadFailed')}
          </p>
          <Button variant="secondary" className="mt-4" asChild>
            <Link href="/admin/menus">{tEditor('backToMenus')}</Link>
          </Button>
        </div>
      </div>
    );
  }

  const totalMenuProducts = menu.categories.reduce(
    (acc, cat) => acc + (cat._count?.products ?? cat.products?.length ?? 0),
    0,
  );

  const showPreview = TABS_WITH_PREVIEW.has(activeTab);

  return (
    <div
      data-testid="editor-shell"
      className="flex h-[calc(100vh-3rem)] flex-col"
    >
      {/* Header + Tab Bar (sticky to top of shell) */}
      <div className="shrink-0">
        <EditorHeader
          name={menu.name}
          slug={menu.slug}
          status={menu.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT'}
          lastPublishedAt={menu.publishedAt ?? null}
          publishing={publishMenu.isPending}
          onTogglePublish={handleTogglePublish}
          onSaveName={handleSaveName}
          onShare={handleShare}
          // T13.1 ships the shell only. Child tabs (T13.2+) will wire actual
          // dirty state into this prop via a shared context.
          hasUnsavedChanges={false}
          savingChanges={false}
        />
        <EditorTabBar
          items={tabs}
          activeId={activeTab}
          onChange={(id) => handleTabChange(id)}
          aria-label={tEditor('tabs.content')}
          data-testid="editor-tab-bar"
        />
      </div>

      {/* Two-column layout */}
      <div className="flex min-h-0 flex-1 gap-6 pt-6">
        {/* Left: scrollable tab content */}
        <div
          className="scrollbar-hide flex min-w-0 flex-1 flex-col overflow-y-auto pr-1"
          data-testid="editor-content"
          role="tabpanel"
          aria-labelledby={`tab-${activeTab}`}
        >
          {activeTab === 'content' && (
            <CategoriesList
              menuId={id}
              showAllergens={hasFeature('allergens')}
              totalMenuProducts={totalMenuProducts}
            />
          )}

          {activeTab === 'branding' && (
            <BrandingTab
              menu={menu}
              hasCustomBranding={hasFeature('customBranding')}
            />
          )}

          {activeTab === 'languages' && (
            <LanguagesTab
              menu={menu}
              hasMultilingual={hasFeature('multilingual')}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsTab
              menuId={id}
              menuSlug={menu.slug}
              hasAnalytics={hasFeature('analytics')}
            />
          )}

          {activeTab === 'promotions' && (
            <EditorPromotionsTab
              menuId={id}
              canUsePromotions={hasFeature('promotions')}
              multilangUnlocked={hasFeature('multilingual')}
            />
          )}

          {activeTab === 'qr' && (
            <QrTab
              menu={menu}
              hasQrLogo={hasFeature('qrWithLogo')}
            />
          )}

          {activeTab === 'settings' && <MenuSettingsTab menu={menu} />}
        </div>

        {/* Right: sticky phone preview (desktop only, preview-eligible tabs only) */}
        {showPreview && (
          <div className="hidden w-[360px] shrink-0 lg:block">
            <div className="sticky top-0">
              <PhonePreviewPanel menu={menu} refreshKey={previewVersion} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MenuDetailSkeleton() {
  return (
    <div className="flex h-[calc(100vh-3rem)] flex-col">
      {/* Header skeleton */}
      <div className="shrink-0 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Skeleton className="mt-[2px] h-[32px] w-[32px] rounded-full" />
            <div>
              <Skeleton className="h-[28px] w-[260px]" />
              <div className="mt-[6px] flex items-center gap-2">
                <Skeleton className="h-[32px] w-[160px] rounded-[8px]" />
                <Skeleton className="h-[16px] w-[120px]" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-[32px] w-[76px] rounded-[7px]" />
            <Skeleton className="h-[32px] w-[96px] rounded-[7px]" />
            <Skeleton className="h-[32px] w-[120px] rounded-[7px]" />
          </div>
        </div>
        <div className="flex gap-6 border-b border-border pt-[6px]">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-[32px] w-[72px]" />
          ))}
        </div>
      </div>

      {/* Two-column skeleton */}
      <div className="flex min-h-0 flex-1 gap-6 pt-6">
        <div className="min-w-0 flex-1 space-y-4">
          <Card className="rounded-[12px]">
            <CardContent className="space-y-3 px-6 pt-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </CardContent>
          </Card>
        </div>
        <div className="hidden w-[360px] shrink-0 lg:block">
          <PhonePreviewSkeleton />
        </div>
      </div>
    </div>
  );
}
