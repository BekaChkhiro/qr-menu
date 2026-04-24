'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, Lock, Plus, Trash2, X } from 'lucide-react';
import * as SheetPrimitive from '@radix-ui/react-dialog';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Banner } from '@/components/ui/banner';
import { cn } from '@/lib/utils';
import { ProductForm, type ProductFormValues } from './product-form';
import { ProductDrawerVariationsTab } from './product-drawer-variations-tab';
import { ProductDrawerAllergensTab } from './product-drawer-allergens-tab';
import { AllergensLocked } from './product-drawer/allergens-locked';
import type { Product, Category } from '@/types/menu';

const FORM_ID = 'product-drawer-form';

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menuId: string;
  product?: Product;
  categories: Category[];
  defaultCategoryId?: string;
  onSubmit: (data: ProductFormValues) => Promise<void>;
  isLoading?: boolean;
  showAllergens?: boolean;
  /** Pass true when the user is on PRO (multilingual feature unlocked). */
  multilangUnlocked?: boolean;
  /**
   * Footer "Delete product" callback. Only shown when `product` is provided
   * (edit mode). Parent typically closes the drawer and opens a confirm
   * dialog.
   */
  onDelete?: () => void;
}

type DrawerTab = 'basics' | 'variations' | 'allergens' | 'nutrition' | 'visibility';

export function ProductDialog({
  open,
  onOpenChange,
  menuId,
  product,
  categories,
  defaultCategoryId,
  onSubmit,
  isLoading,
  showAllergens = false,
  multilangUnlocked = false,
  onDelete,
}: ProductDialogProps) {
  const t = useTranslations('admin.products.drawer');
  const tActions = useTranslations('actions');
  const isEditing = !!product;
  const [activeTab, setActiveTab] = useState<DrawerTab>('basics');
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setActiveTab('basics');
      setSaveError(null);
    }
  }, [open, product?.id]);

  const handleSubmit = async (data: ProductFormValues) => {
    setSaveError(null);
    try {
      await onSubmit(data);
      onOpenChange(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : t('saveErrorDefault'));
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const title = isEditing ? t('editTitle') : t('addTitle');
  const subtitle = isEditing
    ? [product.nameKa, categories.find((c) => c.id === product.categoryId)?.nameKa]
        .filter(Boolean)
        .join(' · ')
    : undefined;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        hideClose
        overlayClassName="bg-black/25 backdrop-blur-0"
        className={cn(
          'flex h-full w-full flex-col gap-0 p-0',
          'sm:max-w-[540px]',
        )}
        data-testid="product-drawer"
        data-mode={isEditing ? 'edit' : 'create'}
      >
        {/* ── Sticky header ────────────────────────────────────────────── */}
        <div
          className="flex h-16 flex-shrink-0 items-center gap-3 border-b border-border px-5"
          data-testid="product-drawer-header"
        >
          {/* Thumbnail / icon tile (32×32) */}
          {isEditing ? (
            <div
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-[7px] bg-chip text-[13px] font-semibold uppercase text-text-muted"
              aria-hidden="true"
            >
              {product.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.imageUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>{product.nameKa.slice(0, 1)}</span>
              )}
            </div>
          ) : (
            <div
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[7px] bg-accent-soft text-accent"
              aria-hidden="true"
            >
              <Plus className="h-[15px] w-[15px]" strokeWidth={2.2} />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <SheetPrimitive.Title
              className="text-[14.5px] font-semibold leading-tight tracking-[-0.2px] text-text-default"
              data-testid="product-drawer-title"
            >
              {title}
            </SheetPrimitive.Title>
            {subtitle && (
              <p
                className="mt-0.5 truncate text-[11.5px] text-text-muted"
                data-testid="product-drawer-subtitle"
              >
                {subtitle}
              </p>
            )}
          </div>

          <SheetPrimitive.Close
            className={cn(
              'flex h-[30px] w-[30px] items-center justify-center rounded-[7px]',
              'text-text-muted transition-colors hover:bg-chip hover:text-text-default',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
            )}
            data-testid="product-drawer-close"
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
            <span className="sr-only">{t('closeLabel')}</span>
          </SheetPrimitive.Close>
        </div>

        {/* ── Tabs strip + body (Tabs root wraps trigger list & content) ── */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as DrawerTab)}
          className="flex min-h-0 flex-1 flex-col"
        >
          <TabsList
            variant="underline"
            className="h-[46px] flex-shrink-0 gap-0 px-5"
            data-testid="product-drawer-tabs"
          >
            <TabsTrigger
              value="basics"
              className="px-[14px]"
              data-testid="product-drawer-tab-basics"
            >
              {t('tabs.basics')}
            </TabsTrigger>
            <TabsTrigger
              value="variations"
              className="px-[14px]"
              data-testid="product-drawer-tab-variations"
            >
              {t('tabs.variations')}
            </TabsTrigger>
            <TabsTrigger
              value="allergens"
              className="gap-1.5 px-[14px]"
              data-testid="product-drawer-tab-allergens"
              data-pro-locked={showAllergens ? 'false' : 'true'}
            >
              {t('tabs.allergens')}
              {!showAllergens && (
                <Lock
                  className="h-[10.5px] w-[10.5px] text-text-subtle"
                  strokeWidth={1.8}
                  aria-label={t('tabs.allergensProBadge')}
                  data-testid="product-drawer-tab-allergens-lock"
                />
              )}
            </TabsTrigger>
            <TabsTrigger
              value="nutrition"
              className="px-[14px]"
              data-testid="product-drawer-tab-nutrition"
            >
              {t('tabs.nutrition')}
            </TabsTrigger>
            <TabsTrigger
              value="visibility"
              className="px-[14px]"
              data-testid="product-drawer-tab-visibility"
            >
              {t('tabs.visibility')}
            </TabsTrigger>
          </TabsList>

          {/* ── Body (scrollable) ─────────────────────────────────────── */}
          <div
            className="min-h-0 flex-1 overflow-y-auto"
            data-testid="product-drawer-body"
          >
            {saveError && (
              <div className="px-6 pt-5" data-testid="product-drawer-save-error">
                <Banner
                  tone="error"
                  title={t('saveErrorTitle')}
                  description={saveError}
                  dismissible
                  onDismiss={() => setSaveError(null)}
                />
              </div>
            )}
            <TabsContent value="basics" className="m-0 p-6 focus-visible:outline-none">
              <ProductForm
                product={product}
                categories={categories}
                defaultCategoryId={defaultCategoryId}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                isLoading={isLoading}
                showAllergens={showAllergens}
                multilangUnlocked={multilangUnlocked}
                formId={FORM_ID}
                hideActions
              />
            </TabsContent>

            <TabsContent
              value="variations"
              className="m-0 p-6 focus-visible:outline-none"
            >
              {isEditing ? (
                <ProductDrawerVariationsTab menuId={menuId} product={product} />
              ) : (
                <PlaceholderPanel
                  tab="variations"
                  locked={false}
                  title={t('placeholders.variationsCreate.title')}
                  body={t('placeholders.variationsCreate.body')}
                />
              )}
            </TabsContent>

            <TabsContent
              value="allergens"
              className="m-0 p-6 focus-visible:outline-none"
            >
              {!showAllergens ? (
                <AllergensLocked />
              ) : isEditing ? (
                <ProductDrawerAllergensTab menuId={menuId} product={product} />
              ) : (
                <PlaceholderPanel
                  tab="allergens"
                  locked={false}
                  title={t('placeholders.allergensCreate.title')}
                  body={t('placeholders.allergensCreate.body')}
                />
              )}
            </TabsContent>

            {(['nutrition', 'visibility'] as const).map((tab) => (
              <TabsContent
                key={tab}
                value={tab}
                className="m-0 p-6 focus-visible:outline-none"
              >
                <PlaceholderPanel
                  tab={tab}
                  locked={false}
                  title={t(`placeholders.${tab}.title`)}
                  body={t(`placeholders.${tab}.body`)}
                />
              </TabsContent>
            ))}
          </div>
        </Tabs>

        {/* ── Sticky footer ────────────────────────────────────────────── */}
        <div
          className="flex flex-shrink-0 items-center justify-between gap-3 border-t border-border bg-card px-5 py-4"
          data-testid="product-drawer-footer"
        >
          {isEditing && onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              disabled={isLoading}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-sm px-1 py-1 text-[13px] font-medium text-danger transition-colors',
                'hover:bg-danger-soft',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger focus-visible:ring-offset-2',
                'disabled:pointer-events-none disabled:opacity-50',
              )}
              data-testid="product-drawer-delete"
            >
              <Trash2 className="h-[13px] w-[13px]" strokeWidth={1.8} />
              {t('deleteProduct')}
            </button>
          ) : (
            <span aria-hidden="true" />
          )}

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isLoading}
              data-testid="product-drawer-cancel"
            >
              {tActions('cancel')}
            </Button>
            <Button
              type="submit"
              form={FORM_ID}
              size="sm"
              disabled={isLoading}
              data-testid="product-drawer-save"
              data-saving={isLoading ? 'true' : 'false'}
            >
              {isLoading && (
                <Loader2 className="mr-1.5 h-[13px] w-[13px] animate-spin" />
              )}
              {isLoading
                ? t('saving')
                : isEditing
                  ? tActions('save')
                  : t('saveNewProduct')}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

interface PlaceholderPanelProps {
  tab: 'variations' | 'allergens' | 'nutrition' | 'visibility';
  locked: boolean;
  title: string;
  body: string;
}

function PlaceholderPanel({ tab, locked, title, body }: PlaceholderPanelProps) {
  return (
    <div
      className="flex h-full flex-col items-center justify-center gap-3 rounded-[12px] border border-dashed border-border bg-bg/60 p-10 text-center"
      data-testid={`product-drawer-placeholder-${tab}`}
      data-locked={locked ? 'true' : 'false'}
    >
      <div
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-[10px]',
          locked ? 'bg-accent-soft text-accent' : 'bg-chip text-text-muted',
        )}
        aria-hidden="true"
      >
        {locked ? (
          <Lock className="h-[17px] w-[17px]" strokeWidth={1.8} />
        ) : (
          <Plus className="h-[17px] w-[17px]" strokeWidth={1.8} />
        )}
      </div>
      <div className="text-[14.5px] font-semibold leading-tight tracking-[-0.2px] text-text-default">
        {title}
      </div>
      <p className="max-w-xs text-[12.5px] leading-[1.55] text-text-muted">{body}</p>
    </div>
  );
}
