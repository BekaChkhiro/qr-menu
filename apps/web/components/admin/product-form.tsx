'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Loader2, Info, Clock } from 'lucide-react';
import { z } from 'zod';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { LangTabsInline, type LangCode } from './product-drawer/lang-tabs-inline';
import { TagsInput } from './product-drawer/tags-input';
import { ProductImageField } from './product-drawer/product-image-field';
import type { Product, Category } from '@/types/menu';

// Form schema — descriptions max 500 per T14.2 spec
const productFormSchema = z.object({
  categoryId: z.string().min(1, 'Category is required'),
  nameKa: z
    .string()
    .min(1, 'Georgian name is required')
    .max(100, 'Name must be less than 100 characters'),
  nameEn: z.string().max(100).optional(),
  nameRu: z.string().max(100).optional(),
  descriptionKa: z.string().max(500).optional(),
  descriptionEn: z.string().max(500).optional(),
  descriptionRu: z.string().max(500).optional(),
  price: z.string().min(1, 'Price is required'),
  oldPrice: z.string().optional(),
  imageUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  allergens: z.array(z.string()).optional(),
  ribbons: z.array(z.string()).optional(),
  isVegan: z.boolean().optional(),
  isVegetarian: z.boolean().optional(),
  calories: z.string().optional(),
  protein: z.string().optional(),
  fats: z.string().optional(),
  carbs: z.string().optional(),
  fiber: z.string().optional(),
  isAvailable: z.boolean(),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

interface ProductFormProps {
  product?: Product;
  categories: Category[];
  defaultCategoryId?: string;
  onSubmit: (data: ProductFormValues) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  showAllergens?: boolean;
  multilangUnlocked?: boolean;
  /** When the form is submitted from a button outside its DOM (e.g. a sticky drawer footer). */
  formId?: string;
  /** Hide the in-form Cancel/Save row. The drawer renders its own footer actions. */
  hideActions?: boolean;
}

export function ProductForm({
  product,
  categories,
  defaultCategoryId,
  onSubmit,
  onCancel,
  isLoading,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  showAllergens = false, // reserved for Allergens tab (T14.3)
  multilangUnlocked = false,
  formId,
  hideActions = false,
}: ProductFormProps) {
  const t = useTranslations('admin.products.form');
  const tActions = useTranslations('actions');

  // Active language tabs — independent for Name and Description
  const [nameLang, setNameLang] = useState<LangCode>('KA');
  const [descLang, setDescLang] = useState<LangCode>('KA');

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      categoryId: product?.categoryId || defaultCategoryId || '',
      nameKa: product?.nameKa || '',
      nameEn: product?.nameEn || '',
      nameRu: product?.nameRu || '',
      descriptionKa: product?.descriptionKa || '',
      descriptionEn: product?.descriptionEn || '',
      descriptionRu: product?.descriptionRu || '',
      price: product?.price ? String(product.price) : '',
      oldPrice: product?.oldPrice ? String(product.oldPrice) : '',
      imageUrl: product?.imageUrl || '',
      allergens: product?.allergens || [],
      ribbons: product?.ribbons || [],
      isVegan: product?.isVegan ?? false,
      isVegetarian: product?.isVegetarian ?? false,
      calories:
        product?.calories !== null && product?.calories !== undefined
          ? String(product.calories)
          : '',
      protein:
        product?.protein !== null && product?.protein !== undefined
          ? String(product.protein)
          : '',
      fats:
        product?.fats !== null && product?.fats !== undefined
          ? String(product.fats)
          : '',
      carbs:
        product?.carbs !== null && product?.carbs !== undefined
          ? String(product.carbs)
          : '',
      fiber:
        product?.fiber !== null && product?.fiber !== undefined
          ? String(product.fiber)
          : '',
      isAvailable: product?.isAvailable ?? true,
    },
  });

  const { watch, setValue, formState: { errors } } = form;

  // Watched values for reactive UI
  const nameKa = watch('nameKa');
  const nameEn = watch('nameEn');
  const nameRu = watch('nameRu');
  const descriptionKa = watch('descriptionKa');
  const descriptionEn = watch('descriptionEn');
  const descriptionRu = watch('descriptionRu');
  const price = watch('price');
  const oldPrice = watch('oldPrice');
  const isAvailable = watch('isAvailable');
  const ribbons = watch('ribbons') || [];
  const isVegan = watch('isVegan') || false;
  const isVegetarian = watch('isVegetarian') || false;

  // Discount toggle is derived from oldPrice having a value
  const [hasDiscount, setHasDiscount] = useState(() => !!(product?.oldPrice));

  // Name/Description dot statuses for LangTabsInline
  const nameStatuses = {
    KA: (nameKa || '') !== '' ? 'filled' : 'empty',
    EN: (nameEn || '') !== '' ? 'filled' : 'empty',
    RU: (nameRu || '') !== '' ? 'filled' : 'empty',
  } as const;

  const descStatuses = {
    KA: (descriptionKa || '') !== '' ? 'filled' : 'empty',
    EN: (descriptionEn || '') !== '' ? 'filled' : 'empty',
    RU: (descriptionRu || '') !== '' ? 'filled' : 'empty',
  } as const;

  // Active name field key
  const nameFieldKey = nameLang === 'KA' ? 'nameKa' : nameLang === 'EN' ? 'nameEn' : 'nameRu';
  const descFieldKey = descLang === 'KA' ? 'descriptionKa' : descLang === 'EN' ? 'descriptionEn' : 'descriptionRu';
  const activeDescValue = watch(descFieldKey) || '';

  // Discount percentage pill
  const priceNum = parseFloat(price);
  const oldPriceNum = parseFloat(oldPrice || '');
  const discountPct =
    Number.isFinite(priceNum) && Number.isFinite(oldPriceNum) && oldPriceNum > 0
      ? Math.round((1 - priceNum / oldPriceNum) * 100)
      : null;

  const handleSubmit = async (data: ProductFormValues) => {
    await onSubmit(data);
  };

  const handleDiscountToggle = (checked: boolean) => {
    setHasDiscount(checked);
    if (!checked) {
      setValue('oldPrice', '');
    }
  };

  return (
    <div
      data-testid="product-drawer-basics"
    >
      <form id={formId} onSubmit={form.handleSubmit(handleSubmit)}>

        {/* ── 1. Product image ──────────────────────────────────────────── */}
        <Controller
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <ProductImageField
              value={field.value || null}
              onChange={(url) => field.onChange(url || '')}
              disabled={isLoading}
              replaceLabel={t('imageActions.replace')}
              cropLabel={t('imageActions.crop')}
              removeLabel={t('imageActions.remove')}
              recommendedText={t('imageRecommended')}
              imageLabel={t('image')}
            />
          )}
        />

        {/* ── 2. Name ───────────────────────────────────────────────────── */}
        <div className="mb-[22px]">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-[12px] font-semibold uppercase tracking-[0.1px] text-text-default">
              {t('nameLabel')}
            </span>
            <span className="text-[11px] text-text-subtle">{t('basicsHintName')}</span>
          </div>
          <LangTabsInline
            active={nameLang}
            onChange={setNameLang}
            statuses={nameStatuses}
            multilangUnlocked={multilangUnlocked}
            data-testid="product-basics-name-tabs"
          />
          <Controller
            control={form.control}
            name={nameFieldKey}
            render={({ field }) => (
              <Input
                {...field}
                value={field.value || ''}
                data-testid="product-basics-name-input"
                placeholder={
                  nameLang === 'KA'
                    ? t('nameKaPlaceholder')
                    : nameLang === 'EN'
                    ? t('nameEnPlaceholder')
                    : t('nameRuPlaceholder')
                }
                className={cn(errors.nameKa && nameLang === 'KA' && 'border-danger ring-[3px] ring-danger-soft')}
              />
            )}
          />
          {errors.nameKa && nameLang === 'KA' && (
            <p className="mt-1.5 flex items-center gap-1 text-[11.5px] text-danger">
              <Info className="h-[11px] w-[11px]" strokeWidth={1.8} aria-hidden="true" />
              {errors.nameKa.message}
            </p>
          )}
        </div>

        {/* ── 3. Description ────────────────────────────────────────────── */}
        <div className="mb-[22px]">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-[12px] font-semibold uppercase tracking-[0.1px] text-text-default">
              {t('descriptionLabel')}
            </span>
          </div>
          <LangTabsInline
            active={descLang}
            onChange={setDescLang}
            statuses={descStatuses}
            multilangUnlocked={multilangUnlocked}
            data-testid="product-basics-description-tabs"
          />
          <div className="relative">
            <Controller
              control={form.control}
              name={descFieldKey}
              render={({ field }) => (
                <textarea
                  {...field}
                  value={field.value || ''}
                  data-testid="product-basics-description-textarea"
                  maxLength={500}
                  placeholder={
                    descLang === 'KA'
                      ? t('descriptionKaPlaceholder')
                      : descLang === 'EN'
                      ? t('descriptionEnPlaceholder')
                      : t('descriptionRuPlaceholder')
                  }
                  className={cn(
                    'w-full resize-none rounded-md border border-border bg-card px-3 pb-6 pt-2.5 text-[13px] text-text-default placeholder:text-text-subtle',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1',
                    'min-h-[72px]',
                  )}
                  rows={3}
                />
              )}
            />
            <span
              data-testid="product-basics-description-counter"
              className={cn(
                'pointer-events-none absolute bottom-2 right-3 text-[10.5px] tabular-nums',
                activeDescValue.length > 500 ? 'text-danger' : 'text-text-subtle',
              )}
            >
              {activeDescValue.length} / 500
            </span>
          </div>
        </div>

        {/* ── 4. Category + Price grid ──────────────────────────────────── */}
        <div className="mb-[22px] grid grid-cols-2 gap-3.5">
          {/* Category */}
          <div>
            <div className="mb-2 text-[12px] font-semibold uppercase tracking-[0.1px] text-text-default">
              {t('category')}
            </div>
            <Controller
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger
                    data-testid="product-basics-category-select"
                    className="border border-border text-[13.5px]"
                  >
                    <SelectValue placeholder={t('selectCategory')} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.iconUrl && /^\p{Emoji}/u.test(cat.iconUrl)
                          ? `${cat.iconUrl} ${cat.nameKa}`
                          : cat.nameKa}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.categoryId && (
              <p className="mt-1 text-[11.5px] text-danger">{errors.categoryId.message}</p>
            )}
          </div>

          {/* Price */}
          <div>
            <div className="mb-2 text-[12px] font-semibold uppercase tracking-[0.1px] text-text-default">
              {t('priceLabel')}
            </div>
            <div className="relative flex items-center">
              <span className="pointer-events-none absolute left-3 text-[13.5px] font-semibold text-text-muted">
                ₾
              </span>
              <Controller
                control={form.control}
                name="price"
                render={({ field }) => (
                  <Input
                    {...field}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    data-testid="product-basics-price-input"
                    className={cn(
                      'pl-7 tabular-nums',
                      errors.price && 'border-danger ring-[3px] ring-danger-soft',
                    )}
                  />
                )}
              />
            </div>
            {errors.price && (
              <p
                data-testid="product-basics-price-error"
                className="mt-1.5 flex items-center gap-1 text-[11.5px] text-danger"
              >
                <Info className="h-[11px] w-[11px]" strokeWidth={1.8} aria-hidden="true" />
                {t('priceError')}
              </p>
            )}
          </div>
        </div>

        {/* ── 5. Discount card ─────────────────────────────────────────── */}
        <div className="mb-[22px] rounded-[10px] border border-border-soft bg-[#FCFBF8] p-3.5">
          {/* Toggle row */}
          <div className="flex items-center gap-2.5">
            <Switch
              checked={hasDiscount}
              onCheckedChange={handleDiscountToggle}
              data-testid="product-basics-discount-toggle"
            />
            <div className="flex-1">
              <div className="text-[13px] font-[550] text-text-default">
                {t('discount.toggle')}
              </div>
              <div className="text-[11.5px] text-text-muted">
                {t('discount.toggleHelp')}
              </div>
            </div>
          </div>

          {/* Expanded row */}
          {hasDiscount && (
            <div
              className="mt-3 grid grid-cols-[1fr_1fr_80px] gap-2"
              data-testid="product-basics-discount-row"
            >
              {/* Original price */}
              <div>
                <div className="mb-1 text-[10.5px] font-bold uppercase tracking-[0.4px] text-text-subtle">
                  {t('discount.original')}
                </div>
                <div className="relative flex items-center">
                  <span className="pointer-events-none absolute left-2.5 text-[12px] text-text-subtle line-through">
                    ₾
                  </span>
                  <Controller
                    control={form.control}
                    name="oldPrice"
                    render={({ field }) => (
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        min="0"
                        value={field.value || ''}
                        placeholder="0.00"
                        data-testid="product-basics-discount-original"
                        className="pl-6 text-[12.5px] tabular-nums"
                      />
                    )}
                  />
                </div>
              </div>

              {/* Sale price */}
              <div>
                <div className="mb-1 text-[10.5px] font-bold uppercase tracking-[0.4px] text-text-subtle">
                  {t('discount.sale')}
                </div>
                <div className="relative flex items-center">
                  <span className="pointer-events-none absolute left-2.5 text-[12px] font-semibold text-accent">
                    ₾
                  </span>
                  <Controller
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        data-testid="product-basics-discount-sale"
                        className="pl-6 text-[12.5px] tabular-nums"
                      />
                    )}
                  />
                </div>
              </div>

              {/* Discount % pill */}
              <div>
                <div className="mb-1 text-[10.5px] font-bold uppercase tracking-[0.4px] text-text-subtle">
                  &nbsp;
                </div>
                {discountPct !== null && discountPct !== 0 ? (
                  <div
                    data-testid="product-basics-discount-pill"
                    className={cn(
                      'flex h-[30px] items-center justify-center rounded-md text-[12.5px] font-bold tabular-nums',
                      discountPct > 0
                        ? 'bg-danger-soft text-danger'
                        : 'bg-success-soft text-success',
                    )}
                  >
                    {discountPct > 0 ? `−${discountPct}%` : `+${Math.abs(discountPct)}%`}
                  </div>
                ) : (
                  <div className="h-[30px]" />
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── 6. Tags ───────────────────────────────────────────────────── */}
        <TagsInput
          ribbons={ribbons as import('@/types/menu').Ribbon[]}
          isVegan={isVegan}
          isVegetarian={isVegetarian}
          onRibbonsChange={(r) => setValue('ribbons', r)}
          onIsVeganChange={(v) => setValue('isVegan', v)}
          onIsVegetarianChange={(v) => setValue('isVegetarian', v)}
          tagsLabel={t('tagsLabel')}
          suggestedLabel={t('tagsSuggested')}
          placeholder={t('tagsPlaceholder')}
          tagLabels={{
            vegetarian: t('tagNames.vegetarian'),
            vegan: t('tagNames.vegan'),
            popular: t('tagNames.popular'),
            chefChoice: t('tagNames.chefChoice'),
            dailyDish: t('tagNames.dailyDish'),
            spicy: t('tagNames.spicy'),
            new: t('tagNames.new'),
          }}
        />

        {/* ── 7. Availability ───────────────────────────────────────────── */}
        <div>
          <div className="mb-2 text-[12px] font-semibold uppercase tracking-[0.1px] text-text-default">
            {t('availabilityLabel')}
          </div>
          <div className="flex items-center gap-3 rounded-[10px] border border-border bg-card p-3.5">
            <Switch
              checked={isAvailable}
              onCheckedChange={(v) => setValue('isAvailable', v)}
              data-testid="product-basics-availability-toggle"
            />
            <div className="flex-1">
              <div className="text-[13px] font-[550] text-text-default">{t('inStock')}</div>
              <div className="text-[11.5px] text-text-muted">{t('inStockHelp')}</div>
            </div>
            <button
              type="button"
              data-testid="product-basics-schedule"
              title="Coming soon"
              disabled
              className={cn(
                'inline-flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-[5px] text-[12px] font-medium text-text-muted',
                'opacity-50 cursor-not-allowed',
              )}
            >
              <Clock className="h-[13px] w-[13px]" strokeWidth={1.5} aria-hidden="true" />
              {t('scheduleAvailability')}
            </button>
          </div>
        </div>

        {!hideActions && (
          <div className="mt-6 flex items-center justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              {tActions('cancel')}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {product ? tActions('save') : tActions('create')}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}

export type { ProductFormValues };
