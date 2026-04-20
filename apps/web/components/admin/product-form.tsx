'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { ImageUpload } from '@/components/admin/image-upload';
import type { Product, Category, Allergen, Ribbon } from '@/types/menu';

// Form schema for product — form-level schema (strings for decimals, converted on submit)
const productFormSchema = z.object({
  categoryId: z.string().min(1, 'Category is required'),
  nameKa: z
    .string()
    .min(1, 'Georgian name is required')
    .max(100, 'Name must be less than 100 characters'),
  nameEn: z.string().max(100).optional(),
  nameRu: z.string().max(100).optional(),
  descriptionKa: z.string().max(1000).optional(),
  descriptionEn: z.string().max(1000).optional(),
  descriptionRu: z.string().max(1000).optional(),
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

// Full allergen library (15 items — EU allergen list + common ones)
const ALLERGENS: { value: Allergen; labelEn: string; labelKa: string }[] = [
  { value: 'GLUTEN', labelEn: 'Gluten', labelKa: 'გლუტენი' },
  { value: 'DAIRY', labelEn: 'Dairy', labelKa: 'რძის პროდუქტები' },
  { value: 'EGGS', labelEn: 'Eggs', labelKa: 'კვერცხი' },
  { value: 'NUTS', labelEn: 'Tree Nuts', labelKa: 'თხილეული' },
  { value: 'PEANUTS', labelEn: 'Peanuts', labelKa: 'არაქისი' },
  { value: 'SEAFOOD', labelEn: 'Seafood', labelKa: 'ზღვის პროდუქტები' },
  { value: 'FISH', labelEn: 'Fish', labelKa: 'თევზი' },
  { value: 'SHELLFISH', labelEn: 'Shellfish', labelKa: 'კიბორჩხალები' },
  { value: 'SOY', labelEn: 'Soy', labelKa: 'სოია' },
  { value: 'PORK', labelEn: 'Pork', labelKa: 'ღორის ხორცი' },
  { value: 'SESAME', labelEn: 'Sesame', labelKa: 'სეზამი' },
  { value: 'MUSTARD', labelEn: 'Mustard', labelKa: 'მდოგვი' },
  { value: 'CELERY', labelEn: 'Celery', labelKa: 'ნიახური' },
  { value: 'LUPIN', labelEn: 'Lupin', labelKa: 'ლუპინი' },
  { value: 'SULPHITES', labelEn: 'Sulphites', labelKa: 'სულფიტები' },
];

// Ribbons / badges
const RIBBONS: { value: Ribbon; labelKa: string; emoji: string }[] = [
  { value: 'POPULAR', labelKa: 'პოპულარული', emoji: '🔥' },
  { value: 'CHEF_CHOICE', labelKa: 'შეფი გირჩევთ', emoji: '👨‍🍳' },
  { value: 'DAILY_DISH', labelKa: 'დღის კერძი', emoji: '⭐' },
  { value: 'NEW', labelKa: 'ახალი', emoji: '🆕' },
  { value: 'SPICY', labelKa: 'ცხარე', emoji: '🌶️' },
];

interface ProductFormProps {
  product?: Product;
  categories: Category[];
  defaultCategoryId?: string;
  onSubmit: (data: ProductFormValues) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  showAllergens?: boolean; // PRO feature flag
}

export function ProductForm({
  product,
  categories,
  defaultCategoryId,
  onSubmit,
  onCancel,
  isLoading,
  showAllergens = false,
}: ProductFormProps) {
  const t = useTranslations('admin.products.form');
  const tActions = useTranslations('actions');

  const [nutritionOpen, setNutritionOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

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
      calories: product?.calories !== null && product?.calories !== undefined ? String(product.calories) : '',
      protein: product?.protein !== null && product?.protein !== undefined ? String(product.protein) : '',
      fats: product?.fats !== null && product?.fats !== undefined ? String(product.fats) : '',
      carbs: product?.carbs !== null && product?.carbs !== undefined ? String(product.carbs) : '',
      fiber: product?.fiber !== null && product?.fiber !== undefined ? String(product.fiber) : '',
      isAvailable: product?.isAvailable ?? true,
    },
  });

  const handleSubmit = async (data: ProductFormValues) => {
    await onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* ── Basics ─────────────────────────── */}
        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t('category')} <span className="text-destructive">*</span>
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectCategory')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.nameKa}
                      {category.nameEn && ` / ${category.nameEn}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="nameKa"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t('nameKa')} <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder={t('nameKaPlaceholder')} {...field} />
              </FormControl>
              <FormDescription>{t('nameKaHelp')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="nameEn"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('nameEn')}</FormLabel>
              <FormControl>
                <Input placeholder={t('nameEnPlaceholder')} {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="nameRu"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('nameRu')}</FormLabel>
              <FormControl>
                <Input placeholder={t('nameRuPlaceholder')} {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ── Pricing (with optional discount) ───────────── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t('price')} <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder={t('pricePlaceholder')}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="oldPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ძველი ფასი (Discount)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="20.00"
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormDescription>
                  მიუთითე, თუ გსურს გადახაზული ძველი ფასის ჩვენება
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* ── Product Image ─────────────────────────── */}
        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('image')}</FormLabel>
              <FormControl>
                <ImageUpload
                  value={field.value || null}
                  onChange={(url) => field.onChange(url || '')}
                  preset="product"
                  disabled={isLoading}
                  aspectRatio="square"
                />
              </FormControl>
              <FormDescription>{t('imageHelp')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ── Descriptions ─────────────────────────── */}
        <FormField
          control={form.control}
          name="descriptionKa"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('descriptionKa')}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t('descriptionKaPlaceholder')}
                  className="resize-none"
                  rows={2}
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="descriptionEn"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('descriptionEn')}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t('descriptionEnPlaceholder')}
                  className="resize-none"
                  rows={2}
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="descriptionRu"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('descriptionRu')}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t('descriptionRuPlaceholder')}
                  className="resize-none"
                  rows={2}
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ── Ribbons / Badges ─────────────────────────── */}
        <FormField
          control={form.control}
          name="ribbons"
          render={() => (
            <FormItem>
              <div className="mb-2">
                <FormLabel>ნიშნულები (Ribbons)</FormLabel>
                <FormDescription>
                  ფოტოზე გამოჩნდება აირჩეული ბეჯები
                </FormDescription>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {RIBBONS.map((ribbon) => (
                  <FormField
                    key={ribbon.value}
                    control={form.control}
                    name="ribbons"
                    render={({ field }) => (
                      <FormItem
                        key={ribbon.value}
                        className="flex flex-row items-center space-x-2 space-y-0"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(ribbon.value)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...(field.value || []), ribbon.value])
                                : field.onChange(
                                    field.value?.filter((v) => v !== ribbon.value)
                                  );
                            }}
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal cursor-pointer">
                          <span className="mr-1">{ribbon.emoji}</span>
                          {ribbon.labelKa}
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ── Dietary Flags ─────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 rounded-lg border p-4">
          <FormField
            control={form.control}
            name="isVegan"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="cursor-pointer font-normal">
                  🌱 ვეგანური (Vegan)
                </FormLabel>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isVegetarian"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="cursor-pointer font-normal">
                  🥗 ვეგეტარიანული (Vegetarian)
                </FormLabel>
              </FormItem>
            )}
          />
        </div>

        {/* ── Allergens (PRO) ─────────────────────────── */}
        {showAllergens && (
          <FormField
            control={form.control}
            name="allergens"
            render={() => (
              <FormItem>
                <div className="mb-2">
                  <FormLabel>{t('allergens')}</FormLabel>
                  <FormDescription>{t('allergensHelp')}</FormDescription>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {ALLERGENS.map((allergen) => (
                    <FormField
                      key={allergen.value}
                      control={form.control}
                      name="allergens"
                      render={({ field }) => (
                        <FormItem
                          key={allergen.value}
                          className="flex flex-row items-center space-x-2 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(allergen.value)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...(field.value || []), allergen.value])
                                  : field.onChange(
                                      field.value?.filter((v) => v !== allergen.value)
                                    );
                              }}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal cursor-pointer">
                            {allergen.labelKa}
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* ── Nutrition (Collapsible) ─────────────────────────── */}
        <Collapsible open={nutritionOpen} onOpenChange={setNutritionOpen}>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-lg border px-4 py-3 text-sm font-medium hover:bg-muted"
            >
              <span>🔢 კვებითი ღირებულება (Nutrition)</span>
              {nutritionOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-3">
            <FormField
              control={form.control}
              name="calories"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>კალორიები (Kcal)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="250"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="protein"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ცილა (g)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" min="0" placeholder="10" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fats"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ცხიმი (g)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" min="0" placeholder="5" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="carbs"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ნახშირწყლები (g)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" min="0" placeholder="30" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fiber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ბოჭკო (g)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" min="0" placeholder="2" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* ── Availability ─────────────────────────── */}
        <FormField
          control={form.control}
          name="isAvailable"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <FormLabel>{t('isAvailable')}</FormLabel>
                <FormDescription>{t('isAvailableHelp')}</FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex items-center justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            {tActions('cancel')}
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {product ? tActions('save') : tActions('create')}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export type { ProductFormValues };
