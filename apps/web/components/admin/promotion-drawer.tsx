'use client';

import { useEffect, useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Percent, Megaphone, Gift, X, Loader2, Trash2, Clock } from 'lucide-react';
import * as SheetPrimitive from '@radix-ui/react-dialog';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Segmented, SegmentedItem } from '@/components/ui/segmented';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Banner } from '@/components/ui/banner';
import { ImageUpload } from './image-upload';
import { LangTabsInline } from './product-drawer/lang-tabs-inline';
import { cn } from '@/lib/utils';
import { createPromotionSchema, type CreatePromotionInput } from '@/lib/validations/promotion';
import type { Promotion, Category } from '@/types/menu';
import { useCategories } from '@/hooks/use-categories';

const FORM_ID = 'promotion-drawer-form';

// ── Types ───────────────────────────────────────────────────────────────────

type DrawerTab = 'details' | 'appearance' | 'schedule';
type LangCode = 'KA' | 'EN' | 'RU';

interface PromotionDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menuId: string;
  promotion?: Promotion;
  onSubmit: (data: CreatePromotionInput) => Promise<void>;
  isLoading?: boolean;
  onDelete?: () => void;
  /** True when multilingual is unlocked (PRO). */
  multilangUnlocked?: boolean;
}

type PromotionType = 'PERCENTAGE' | 'BANNER' | 'COMBO';

interface PromotionFormValues {
  titleKa: string;
  titleEn?: string | null;
  titleRu?: string | null;
  descriptionKa?: string | null;
  descriptionEn?: string | null;
  descriptionRu?: string | null;
  imageUrl?: string | null;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  // T22.19 — top-level promotion type drives which fields show.
  type: PromotionType;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_ADDON' | null;
  discountValue: string | number | null;
  applyTo: 'ENTIRE_MENU' | 'CATEGORY' | 'SPECIFIC_ITEMS' | null;
  categoryId: string | null;
  // T22.20 / T22.24
  backgroundColor?: string | null;
  showTitle?: boolean;
  comboProductIds?: string[];
  comboPrice?: string | number | null;
  timeRestrictions: {
    enabled: boolean;
    days: string[];
    startTime: string;
    endTime: string;
  };
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatDateForInput(date: Date | null | undefined): string {
  if (!date) return '';
  return date.toISOString().split('T')[0];
}

function hashString(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

const BANNER_VARIANTS = [
  { bg: 'linear-gradient(135deg, #B8633D, #7A3F27)' },
  { bg: 'linear-gradient(135deg, #7A8C5F, #4F5F3F)' },
  { bg: 'linear-gradient(135deg, #B8423D, #7A2A27)' },
  { bg: 'linear-gradient(135deg, #5D7A91, #3F5363)' },
] as const;

function pickBannerGradient(id?: string) {
  if (!id) return BANNER_VARIANTS[0].bg;
  return BANNER_VARIANTS[hashString(id) % BANNER_VARIANTS.length].bg;
}

const WEEK_DAYS = [
  { key: 'mon', label: 'M' },
  { key: 'tue', label: 'T' },
  { key: 'wed', label: 'W' },
  { key: 'thu', label: 'T' },
  { key: 'fri', label: 'F' },
  { key: 'sat', label: 'S' },
  { key: 'sun', label: 'S' },
] as const;

// T22.19 — owner's three promotion types.
const TYPE_OPTIONS = [
  { value: 'PERCENTAGE', key: 'percentage', Icon: Percent },
  { value: 'BANNER', key: 'banner', Icon: Megaphone },
  { value: 'COMBO', key: 'combo', Icon: Gift },
] as const;

// Infer a type for a legacy promotion that predates the `type` column.
function inferPromotionType(p?: {
  type?: string | null;
  discountType?: string | null;
}): PromotionType {
  if (p?.type === 'PERCENTAGE' || p?.type === 'BANNER' || p?.type === 'COMBO') {
    return p.type;
  }
  if (p?.discountType === 'FREE_ADDON') return 'COMBO';
  if (p?.discountType === 'FIXED_AMOUNT') return 'BANNER'; // "fixed $" retired → banner
  return 'PERCENTAGE';
}

// ── Component ───────────────────────────────────────────────────────────────

export function PromotionDrawer({
  open,
  onOpenChange,
  menuId,
  promotion,
  onSubmit,
  isLoading,
  onDelete,
  multilangUnlocked = false,
}: PromotionDrawerProps) {
  const t = useTranslations('admin.promotions.drawer');
  const tActions = useTranslations('actions');
  const isEditing = !!promotion;
  const [activeTab, setActiveTab] = useState<DrawerTab>('details');
  const [saveError, setSaveError] = useState<string | null>(null);
  // T21.8 — single drawer-wide language scope; title + description switch together.
  const [activeLang, setActiveLang] = useState<LangCode>('KA');
  const [isImageUploading, setIsImageUploading] = useState(false);

  const { data: categories } = useCategories(menuId);

  const form = useForm<PromotionFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createPromotionSchema) as any,
    defaultValues: {
      titleKa: '',
      titleEn: '',
      titleRu: '',
      descriptionKa: '',
      descriptionEn: '',
      descriptionRu: '',
      imageUrl: null,
      startDate: new Date(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      isActive: true,
      type: 'PERCENTAGE',
      discountType: null,
      discountValue: null,
      applyTo: 'ENTIRE_MENU',
      categoryId: null,
      backgroundColor: null,
      showTitle: true,
      comboProductIds: [],
      comboPrice: null,
      timeRestrictions: { enabled: false, days: [], startTime: '09:00', endTime: '18:00' },
    },
  });

  // Reset form when promotion changes or drawer opens
  useEffect(() => {
    if (open) {
      setActiveTab('details');
      setSaveError(null);
      setActiveLang('KA');
      setIsImageUploading(false);

      const tr = promotion?.timeRestrictions;
      form.reset({
        titleKa: promotion?.titleKa || '',
        titleEn: promotion?.titleEn || '',
        titleRu: promotion?.titleRu || '',
        descriptionKa: promotion?.descriptionKa || '',
        descriptionEn: promotion?.descriptionEn || '',
        descriptionRu: promotion?.descriptionRu || '',
        imageUrl: promotion?.imageUrl || null,
        startDate: promotion?.startDate ? new Date(promotion.startDate) : new Date(),
        endDate: promotion?.endDate ? new Date(promotion.endDate) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        isActive: promotion?.isActive ?? true,
        type: inferPromotionType(promotion),
        discountType: (promotion?.discountType as PromotionFormValues['discountType']) || null,
        discountValue: promotion?.discountValue ?? null,
        // T22.18 — "specific items" scope retired; coerce legacy rows to whole-menu.
        applyTo:
          promotion?.applyTo && promotion.applyTo !== 'SPECIFIC_ITEMS'
            ? (promotion.applyTo as PromotionFormValues['applyTo'])
            : 'ENTIRE_MENU',
        categoryId: promotion?.categoryId || null,
        backgroundColor: promotion?.backgroundColor ?? null,
        showTitle: promotion?.showTitle ?? true,
        comboProductIds: promotion?.comboProductIds ?? [],
        comboPrice: promotion?.comboPrice ?? null,
        timeRestrictions: {
          enabled: tr?.enabled ?? false,
          days: tr?.days ?? [],
          startTime: tr?.startTime ?? '09:00',
          endTime: tr?.endTime ?? '18:00',
        },
      });
    }
  }, [open, promotion?.id, form]);

  const handleSubmit = async (data: PromotionFormValues) => {
    setSaveError(null);
    try {
      // T22.19 — normalize by type so only the relevant fields persist.
      const payload: PromotionFormValues = { ...data };
      if (data.type === 'PERCENTAGE') {
        payload.discountType = 'PERCENTAGE';
        payload.comboProductIds = [];
        payload.comboPrice = null;
      } else if (data.type === 'BANNER') {
        payload.discountType = null;
        payload.discountValue = null;
        payload.applyTo = null;
        payload.categoryId = null;
        payload.comboProductIds = [];
        payload.comboPrice = null;
      } else if (data.type === 'COMBO') {
        payload.discountType = null;
        payload.discountValue = null;
        payload.applyTo = null;
        payload.categoryId = null;
      }
      await onSubmit(payload as CreatePromotionInput);
      onOpenChange(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : t('saveErrorDefault'));
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const promoType = form.watch('type');
  const applyTo = form.watch('applyTo');
  const imageUrlWatch = form.watch('imageUrl');
  const timeEnabled = form.watch('timeRestrictions.enabled');
  const timeDays = form.watch('timeRestrictions.days');

  // Header dots: language is "filled" once either its title or description has content.
  const titleKaWatch = form.watch('titleKa');
  const titleEnWatch = form.watch('titleEn');
  const titleRuWatch = form.watch('titleRu');
  const descKaWatch = form.watch('descriptionKa');
  const descEnWatch = form.watch('descriptionEn');
  const descRuWatch = form.watch('descriptionRu');

  const langStatuses = useMemo(
    () => ({
      KA: titleKaWatch || descKaWatch ? ('filled' as const) : ('empty' as const),
      EN: titleEnWatch || descEnWatch ? ('filled' as const) : ('empty' as const),
      RU: titleRuWatch || descRuWatch ? ('filled' as const) : ('empty' as const),
    }),
    [
      titleKaWatch,
      titleEnWatch,
      titleRuWatch,
      descKaWatch,
      descEnWatch,
      descRuWatch,
    ],
  );

  const canSave = (titleKaWatch || '').trim().length > 0;

  const titleFieldKey =
    activeLang === 'KA' ? 'titleKa' : activeLang === 'EN' ? 'titleEn' : 'titleRu';
  const descFieldKey =
    activeLang === 'KA'
      ? 'descriptionKa'
      : activeLang === 'EN'
        ? 'descriptionEn'
        : 'descriptionRu';
  const activeDescription =
    (form.watch(descFieldKey) as string | null | undefined) || '';

  const title = isEditing ? t('editTitle') : t('addTitle');
  const subtitle = isEditing ? t('editSubtitle', { title: promotion.titleKa }) : t('addSubtitle');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        hideClose
        overlayClassName="bg-black/25 backdrop-blur-0"
        className={cn('flex h-full w-full flex-col gap-0 p-0', 'sm:max-w-[540px]')}
        data-testid="promotion-drawer"
        data-mode={isEditing ? 'edit' : 'create'}
      >
        {/* ── Sticky header ────────────────────────────────────────────── */}
        <div
          className="flex h-16 flex-shrink-0 items-center gap-3 border-b border-border px-5"
          data-testid="promotion-drawer-header"
        >
          <div
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-[7px]"
            style={{ background: pickBannerGradient(promotion?.id) }}
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            <SheetPrimitive.Title
              className="text-[14.5px] font-semibold leading-tight tracking-[-0.2px] text-text-default"
              data-testid="promotion-drawer-title"
            >
              {title}
            </SheetPrimitive.Title>
            <p
              className="mt-0.5 truncate text-[11.5px] text-text-muted"
              data-testid="promotion-drawer-subtitle"
            >
              {subtitle}
            </p>
          </div>
          <SheetPrimitive.Close
            className={cn(
              'flex h-[30px] w-[30px] items-center justify-center rounded-[7px]',
              'text-text-muted transition-colors hover:bg-chip hover:text-text-default',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
            )}
            data-testid="promotion-drawer-close"
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
            <span className="sr-only">{t('closeLabel')}</span>
          </SheetPrimitive.Close>
        </div>

        {/* ── Drawer-wide language scope (T21.8) ───────────────────────── */}
        <div
          className="flex-shrink-0 border-b border-border-soft px-5 pt-2.5"
          data-testid="promotion-drawer-lang-scope"
          data-active-lang={activeLang}
        >
          <LangTabsInline
            active={activeLang}
            onChange={setActiveLang}
            statuses={langStatuses}
            multilangUnlocked={multilangUnlocked}
            data-testid="promotion-drawer-lang-tabs"
          />
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────────── */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as DrawerTab)}
          className="flex min-h-0 flex-1 flex-col"
        >
          <TabsList
            variant="underline"
            className="h-[46px] flex-shrink-0 gap-0 px-5"
            data-testid="promotion-drawer-tabs"
          >
            <TabsTrigger value="details" className="px-[14px]" data-testid="promotion-drawer-tab-details">
              {t('tabs.details')}
            </TabsTrigger>
            <TabsTrigger value="appearance" className="px-[14px]" data-testid="promotion-drawer-tab-appearance">
              {t('tabs.appearance')}
            </TabsTrigger>
            <TabsTrigger value="schedule" className="px-[14px]" data-testid="promotion-drawer-tab-schedule">
              {t('tabs.schedule')}
            </TabsTrigger>
          </TabsList>

          {/* ── Body (scrollable) ─────────────────────────────────────── */}
          <div className="min-h-0 flex-1 overflow-y-auto" data-testid="promotion-drawer-body">
            {saveError && (
              <div className="px-6 pt-5" data-testid="promotion-drawer-save-error">
                <Banner
                  tone="error"
                  title={t('saveErrorTitle')}
                  description={saveError}
                  dismissible
                  onDismiss={() => setSaveError(null)}
                />
              </div>
            )}

            <form id={FORM_ID} onSubmit={form.handleSubmit(handleSubmit)}>
              {/* ── Details tab ───────────────────────────────────────── */}
              <TabsContent value="details" className="m-0 space-y-6 p-6 focus-visible:outline-none">
                {/* Title — single input, language driven by the drawer header (T21.8) */}
                <div data-testid="promotion-drawer-title-field">
                  <div className="mb-2 text-[11.5px] font-semibold uppercase tracking-[0.4px] text-text-default">
                    {t('fields.titleLabel')}
                  </div>
                  <Input
                    {...form.register(titleFieldKey)}
                    placeholder={
                      activeLang === 'KA'
                        ? t('fields.titleKaPlaceholder')
                        : activeLang === 'EN'
                          ? t('fields.titleEnPlaceholder')
                          : t('fields.titleRuPlaceholder')
                    }
                    data-testid="promotion-title-input"
                    data-active-lang={activeLang}
                  />
                  {form.formState.errors.titleKa && activeLang === 'KA' && (
                    <p className="mt-1.5 text-[12px] text-danger">{form.formState.errors.titleKa.message}</p>
                  )}
                </div>

                {/* Description — single textarea, language driven by the drawer header (T21.8) */}
                <div data-testid="promotion-drawer-description-field">
                  <div className="mb-2 text-[11.5px] font-semibold uppercase tracking-[0.4px] text-text-default">
                    {t('fields.descriptionLabel')}
                  </div>
                  <Textarea
                    {...form.register(descFieldKey)}
                    rows={3}
                    className="resize-none"
                    placeholder={
                      activeLang === 'KA'
                        ? t('fields.descriptionKaPlaceholder')
                        : activeLang === 'EN'
                          ? t('fields.descriptionEnPlaceholder')
                          : t('fields.descriptionRuPlaceholder')
                    }
                    data-testid="promotion-description-input"
                    data-active-lang={activeLang}
                  />
                  <div className="mt-1 flex justify-end">
                    <span className="font-mono text-[11px] text-text-subtle tabular-nums">
                      {activeDescription.length} / 160
                    </span>
                  </div>
                </div>

                {/* Promotion type (T22.19) */}
                <div data-testid="promotion-drawer-type">
                  <div className="mb-2 text-[11.5px] font-semibold uppercase tracking-[0.4px] text-text-default">
                    {t('fields.typeLabel')}
                  </div>
                  <Controller
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <div className="grid grid-cols-3 gap-2">
                        {TYPE_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => field.onChange(opt.value)}
                            data-testid={`promotion-type-${opt.key}`}
                            data-active={field.value === opt.value ? 'true' : 'false'}
                            className={cn(
                              'flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition-all',
                              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
                              field.value === opt.value
                                ? 'border-accent bg-card shadow-[0_0_0_3px_hsl(var(--accent-soft))]'
                                : 'border-border bg-transparent hover:bg-chip',
                            )}
                          >
                            <opt.Icon
                              className={cn(
                                'h-4 w-4',
                                field.value === opt.value ? 'text-accent' : 'text-text-muted',
                              )}
                              strokeWidth={field.value === opt.value ? 1.9 : 1.5}
                            />
                            <span
                              className={cn(
                                'text-[11.5px] leading-tight',
                                field.value === opt.value
                                  ? 'font-semibold text-text-default'
                                  : 'font-medium text-text-muted',
                              )}
                            >
                              {t(`fields.types.${opt.key}.title`)}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  />
                  <p className="mt-1.5 text-[12px] text-text-muted">
                    {t(`fields.types.${TYPE_OPTIONS.find((o) => o.value === promoType)?.key ?? 'percentage'}.hint`)}
                  </p>
                </div>

                {/* Discount value — percentage only (T22.19) */}
                {promoType === 'PERCENTAGE' && (
                  <div data-testid="promotion-drawer-discount-value">
                    <div className="mb-2 text-[11.5px] font-semibold uppercase tracking-[0.4px] text-text-default">
                      {t('fields.discountValueLabel')}
                    </div>
                    <div className="flex max-w-[180px] overflow-hidden rounded-lg border border-border">
                      <Controller
                        control={form.control}
                        name="discountValue"
                        render={({ field }) => (
                          <>
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              step={1}
                              value={field.value ?? ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                field.onChange(val === '' ? null : val);
                              }}
                              autoComplete="off"
                              className="h-[38px] flex-1 rounded-none border-0 bg-transparent px-3 text-right font-mono text-sm font-semibold tabular-nums focus-visible:ring-0 focus-visible:ring-offset-0"
                              data-testid="promotion-discount-value-input"
                            />
                            <span className="flex items-center bg-chip px-3.5 text-[13px] font-semibold text-text-muted">
                              %
                            </span>
                          </>
                        )}
                      />
                    </div>
                    <p className="mt-1.5 text-[12px] text-text-muted">
                      {t('fields.discountValueHint', { example: '20%' })}
                    </p>
                    {form.formState.errors.discountValue && (
                      <p className="mt-1 text-[12px] text-danger">{form.formState.errors.discountValue.message}</p>
                    )}
                  </div>
                )}

                {/* Apply to — percentage only (T22.19) */}
                {promoType === 'PERCENTAGE' && (
                <div data-testid="promotion-drawer-apply-to">
                  <div className="mb-2 text-[11.5px] font-semibold uppercase tracking-[0.4px] text-text-default">
                    {t('fields.applyToLabel')}
                  </div>
                  <Controller
                    control={form.control}
                    name="applyTo"
                    render={({ field }) => (
                      <RadioGroup
                        value={field.value || 'ENTIRE_MENU'}
                        onValueChange={(v) => field.onChange(v)}
                        className="gap-2"
                      >
                        {/* Entire menu */}
                        <label
                          className={cn(
                            'flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors',
                            field.value === 'ENTIRE_MENU'
                              ? 'border-accent shadow-[0_0_0_3px_hsl(var(--accent-soft))]'
                              : 'border-border hover:bg-chip',
                          )}
                          data-testid="promotion-apply-to-entire"
                        >
                          <RadioGroupItem value="ENTIRE_MENU" />
                          <div className="flex-1">
                            <div className="text-[13px] font-medium text-text-default">
                              {t('fields.applyTo.entireMenu.title')}
                            </div>
                            <div className="text-[11.5px] text-text-muted">
                              {t('fields.applyTo.entireMenu.hint')}
                            </div>
                          </div>
                        </label>

                        {/* Category */}
                        <div
                          className={cn(
                            'rounded-lg border p-3 transition-colors',
                            field.value === 'CATEGORY'
                              ? 'border-accent shadow-[0_0_0_3px_hsl(var(--accent-soft))]'
                              : 'border-border hover:bg-chip',
                          )}
                          data-testid="promotion-apply-to-category"
                        >
                          <label className="flex cursor-pointer items-center gap-3">
                            <RadioGroupItem value="CATEGORY" />
                            <div className="flex-1">
                              <div className="text-[13px] font-medium text-text-default">
                                {t('fields.applyTo.category.title')}
                              </div>
                              <div className="text-[11.5px] text-text-muted">
                                {t('fields.applyTo.category.hint')}
                              </div>
                            </div>
                          </label>
                          {field.value === 'CATEGORY' && (
                            <div className="mt-2.5 ml-7">
                              <Controller
                                control={form.control}
                                name="categoryId"
                                render={({ field: catField }) => (
                                  <Select
                                    value={catField.value || ''}
                                    onValueChange={catField.onChange}
                                  >
                                    <SelectTrigger data-testid="promotion-category-select">
                                      <SelectValue placeholder={t('fields.applyTo.category.placeholder')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {(categories || []).map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id}>
                                          {cat.nameKa}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                              />
                              {form.formState.errors.categoryId && (
                                <p className="mt-1 text-[12px] text-danger">
                                  {form.formState.errors.categoryId.message}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                        {/* T22.18 — "Specific items" scope removed for promotions;
                            per-dish discounting lives in the product editor. */}
                      </RadioGroup>
                    )}
                  />
                </div>
                )}

                {/* Time restrictions */}
                <div data-testid="promotion-drawer-time-restrictions">
                  <div className="mb-2 text-[11.5px] font-semibold uppercase tracking-[0.4px] text-text-default">
                    {t('fields.timeRestrictionsLabel')}
                  </div>
                  <Controller
                    control={form.control}
                    name="timeRestrictions.enabled"
                    render={({ field }) => (
                      <div
                        className={cn(
                          'flex items-center gap-3 rounded-lg border p-3',
                          field.value ? 'border-accent shadow-[0_0_0_3px_hsl(var(--accent-soft))]' : 'border-border',
                        )}
                      >
                        <div className="flex-1">
                          <div className="text-[13px] font-medium text-text-default">
                            {t('fields.timeRestrictionsToggleTitle')}
                          </div>
                          <div className="text-[11.5px] text-text-muted">
                            {t('fields.timeRestrictionsToggleHint')}
                          </div>
                        </div>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="promotion-time-restrictions-toggle"
                        />
                      </div>
                    )}
                  />

                  {timeEnabled && (
                    <div className="mt-3 space-y-3">
                      {/* Day pills */}
                      <div className="flex gap-1.5" data-testid="promotion-day-pills">
                        {WEEK_DAYS.map((day) => {
                          const active = timeDays.includes(day.key);
                          return (
                            <button
                              key={day.key}
                              type="button"
                              onClick={() => {
                                const current = form.getValues('timeRestrictions.days');
                                const next = active
                                  ? current.filter((d) => d !== day.key)
                                  : [...current, day.key];
                                form.setValue('timeRestrictions.days', next, { shouldValidate: true });
                              }}
                              data-testid={`promotion-day-pill-${day.key}`}
                              data-active={active ? 'true' : 'false'}
                              className={cn(
                                'flex h-8 w-8 items-center justify-center rounded-md border text-[11.5px] font-semibold transition-colors',
                                active
                                  ? 'border-text-default bg-text-default text-white'
                                  : 'border-border bg-card text-text-muted hover:bg-chip',
                              )}
                            >
                              {day.label}
                            </button>
                          );
                        })}
                      </div>

                      {/* Time range */}
                      <div className="flex items-center gap-2.5" data-testid="promotion-time-range">
                        <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
                          <Clock className="h-3.5 w-3.5 text-text-muted" strokeWidth={1.5} />
                          <Controller
                            control={form.control}
                            name="timeRestrictions.startTime"
                            render={({ field }) => (
                              <input
                                type="time"
                                {...field}
                                className="w-full bg-transparent text-[13px] font-mono tabular-nums text-text-default outline-none"
                                data-testid="promotion-time-start"
                              />
                            )}
                          />
                        </div>
                        <span className="text-[12px] text-text-muted">{t('fields.timeTo')}</span>
                        <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
                          <Clock className="h-3.5 w-3.5 text-text-muted" strokeWidth={1.5} />
                          <Controller
                            control={form.control}
                            name="timeRestrictions.endTime"
                            render={({ field }) => (
                              <input
                                type="time"
                                {...field}
                                className="w-full bg-transparent text-[13px] font-mono tabular-nums text-text-default outline-none"
                                data-testid="promotion-time-end"
                              />
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* ── Appearance tab ──────────────────────────────────────── */}
              <TabsContent value="appearance" className="m-0 p-6 focus-visible:outline-none">
                <div data-testid="promotion-drawer-banner-upload">
                  <div className="mb-2 text-[11.5px] font-semibold uppercase tracking-[0.4px] text-text-default">
                    {t('fields.bannerLabel')}
                  </div>
                  <Controller
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <>
                        <ImageUpload
                          value={field.value}
                          onChange={field.onChange}
                          preset="promotion"
                          aspectRatio="video"
                          disabled={isLoading}
                          enableCropper={false}
                          onUploadingChange={setIsImageUploading}
                          testIdPrefix="promotion-image"
                        />
                        <input
                          type="hidden"
                          name="imageUrl"
                          value={field.value ?? ''}
                          data-testid="promotion-image-url"
                          readOnly
                        />
                      </>
                    )}
                  />
                  <p className="mt-1.5 text-[12px] text-text-muted">{t('fields.bannerHint')}</p>
                </div>

                {/* T22.20 — appearance controls */}
                {imageUrlWatch ? (
                  /* Banner present → choose whether the title shows over it. */
                  <div className="mt-6" data-testid="promotion-drawer-show-title">
                    <Controller
                      control={form.control}
                      name="showTitle"
                      render={({ field }) => (
                        <div
                          className={cn(
                            'flex items-center gap-3 rounded-lg border p-3',
                            field.value
                              ? 'border-accent shadow-[0_0_0_3px_hsl(var(--accent-soft))]'
                              : 'border-border',
                          )}
                        >
                          <div className="flex-1">
                            <div className="text-[13px] font-medium text-text-default">
                              {t('fields.showTitleLabel')}
                            </div>
                            <div className="text-[11.5px] text-text-muted">
                              {t('fields.showTitleHint')}
                            </div>
                          </div>
                          <Switch
                            checked={field.value ?? true}
                            onCheckedChange={field.onChange}
                            data-testid="promotion-show-title-toggle"
                          />
                        </div>
                      )}
                    />
                  </div>
                ) : (
                  /* No banner → title-only card on a chosen background color. */
                  <div className="mt-6" data-testid="promotion-drawer-background-color">
                    <div className="mb-2 text-[11.5px] font-semibold uppercase tracking-[0.4px] text-text-default">
                      {t('fields.backgroundColorLabel')}
                    </div>
                    <Controller
                      control={form.control}
                      name="backgroundColor"
                      render={({ field }) => {
                        const value = field.value || '#7A3F27';
                        return (
                          <div className="space-y-3">
                            <div
                              className="flex h-24 items-center justify-center rounded-xl px-4 text-center"
                              style={{ backgroundColor: value }}
                              data-testid="promotion-bg-preview"
                            >
                              <span className="text-[15px] font-semibold text-white drop-shadow">
                                {titleKaWatch || t('fields.titleKaPlaceholder')}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={value}
                                onChange={(e) => field.onChange(e.target.value)}
                                className="h-9 w-12 cursor-pointer rounded border border-border bg-transparent"
                                data-testid="promotion-bg-color-input"
                                aria-label={t('fields.backgroundColorLabel')}
                              />
                              <Input
                                value={field.value ?? ''}
                                onChange={(e) => field.onChange(e.target.value || null)}
                                placeholder="#7A3F27"
                                className="h-9 max-w-[130px] font-mono text-[13px]"
                                data-testid="promotion-bg-hex-input"
                              />
                            </div>
                            <p className="text-[12px] text-text-muted">
                              {t('fields.backgroundColorHint')}
                            </p>
                          </div>
                        );
                      }}
                    />
                  </div>
                )}
              </TabsContent>

              {/* ── Schedule tab ────────────────────────────────────────── */}
              <TabsContent value="schedule" className="m-0 space-y-6 p-6 focus-visible:outline-none">
                {/* Date range */}
                <div className="grid gap-4 sm:grid-cols-2" data-testid="promotion-drawer-date-range">
                  <div>
                    <Label className="mb-2 block text-[11.5px] font-semibold uppercase tracking-[0.4px] text-text-default">
                      {t('fields.startDate')}
                    </Label>
                    <Controller
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <Input
                          type="date"
                          value={formatDateForInput(field.value)}
                          onChange={(e) => {
                            const date = e.target.value ? new Date(e.target.value) : null;
                            field.onChange(date);
                          }}
                          data-testid="promotion-start-date"
                        />
                      )}
                    />
                    {form.formState.errors.startDate && (
                      <p className="mt-1 text-[12px] text-danger">{form.formState.errors.startDate.message}</p>
                    )}
                  </div>
                  <div>
                    <Label className="mb-2 block text-[11.5px] font-semibold uppercase tracking-[0.4px] text-text-default">
                      {t('fields.endDate')}
                    </Label>
                    <Controller
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <Input
                          type="date"
                          value={formatDateForInput(field.value)}
                          onChange={(e) => {
                            const date = e.target.value ? new Date(e.target.value) : null;
                            field.onChange(date);
                          }}
                          data-testid="promotion-end-date"
                        />
                      )}
                    />
                    {form.formState.errors.endDate && (
                      <p className="mt-1 text-[12px] text-danger">{form.formState.errors.endDate.message}</p>
                    )}
                  </div>
                </div>

                {/* Active toggle */}
                <Controller
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <div
                      className={cn(
                        'flex items-center gap-3 rounded-lg border p-3',
                        field.value ? 'border-accent shadow-[0_0_0_3px_hsl(var(--accent-soft))]' : 'border-border',
                      )}
                      data-testid="promotion-drawer-active-toggle"
                    >
                      <div className="flex-1">
                        <div className="text-[13px] font-medium text-text-default">{t('fields.isActive')}</div>
                        <div className="text-[11.5px] text-text-muted">{t('fields.isActiveHint')}</div>
                      </div>
                      <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="promotion-is-active" />
                    </div>
                  )}
                />
              </TabsContent>
            </form>
          </div>
        </Tabs>

        {/* ── Sticky footer ────────────────────────────────────────────── */}
        <div
          className="flex flex-shrink-0 items-center justify-between gap-3 border-t border-border bg-card px-5 py-4"
          data-testid="promotion-drawer-footer"
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
              data-testid="promotion-drawer-delete"
            >
              <Trash2 className="h-[13px] w-[13px]" strokeWidth={1.8} />
              {t('deletePromotion')}
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
              data-testid="promotion-drawer-cancel"
            >
              {tActions('cancel')}
            </Button>
            <Button
              type="submit"
              form={FORM_ID}
              size="sm"
              disabled={isLoading || isImageUploading || !canSave}
              data-testid="promotion-drawer-save"
              data-saving={isLoading ? 'true' : 'false'}
              data-uploading={isImageUploading ? 'true' : 'false'}
            >
              {(isLoading || isImageUploading) && (
                <Loader2 className="mr-1.5 h-[13px] w-[13px] animate-spin" />
              )}
              {isImageUploading
                ? t('uploadingImage')
                : isLoading
                  ? t('saving')
                  : isEditing
                    ? tActions('save')
                    : t('saveNewPromotion')}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
