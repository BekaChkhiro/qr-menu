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
import { ImageUpload } from '@/components/admin/image-upload';
import type { Product, Category } from '@/types/menu';

// Form schema for product - slightly modified from API schema for form handling
const productFormSchema = z.object({
  categoryId: z.string().min(1, 'Category is required'),
  nameKa: z
    .string()
    .min(1, 'Georgian name is required')
    .max(100, 'Name must be less than 100 characters'),
  nameEn: z.string().max(100, 'Name must be less than 100 characters').optional(),
  nameRu: z.string().max(100, 'Name must be less than 100 characters').optional(),
  descriptionKa: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  descriptionEn: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  descriptionRu: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  price: z.string().min(1, 'Price is required'),
  imageUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  allergens: z.array(z.string()).optional(),
  isAvailable: z.boolean(),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

// Allergen options
const ALLERGENS = [
  { value: 'GLUTEN', label: 'Gluten', labelKa: 'გლუტენი' },
  { value: 'DAIRY', label: 'Dairy', labelKa: 'რძის პროდუქტები' },
  { value: 'EGGS', label: 'Eggs', labelKa: 'კვერცხი' },
  { value: 'NUTS', label: 'Nuts', labelKa: 'თხილეული' },
  { value: 'SEAFOOD', label: 'Seafood', labelKa: 'ზღვის პროდუქტები' },
  { value: 'SOY', label: 'Soy', labelKa: 'სოია' },
  { value: 'PORK', label: 'Pork', labelKa: 'ღორის ხორცი' },
] as const;

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
      imageUrl: product?.imageUrl || '',
      allergens: product?.allergens || [],
      isAvailable: product?.isAvailable ?? true,
    },
  });

  const handleSubmit = async (data: ProductFormValues) => {
    await onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Category Selection */}
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

        {/* Georgian Name - Required */}
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

        {/* English Name - Optional */}
        <FormField
          control={form.control}
          name="nameEn"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('nameEn')}</FormLabel>
              <FormControl>
                <Input placeholder={t('nameEnPlaceholder')} {...field} value={field.value || ''} />
              </FormControl>
              <FormDescription>{t('nameEnHelp')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Russian Name - Optional */}
        <FormField
          control={form.control}
          name="nameRu"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('nameRu')}</FormLabel>
              <FormControl>
                <Input placeholder={t('nameRuPlaceholder')} {...field} value={field.value || ''} />
              </FormControl>
              <FormDescription>{t('nameRuHelp')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Price */}
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
              <FormDescription>{t('priceHelp')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Product Image */}
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

        {/* Georgian Description - Optional */}
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

        {/* English Description - Optional */}
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

        {/* Russian Description - Optional */}
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

        {/* Allergens (PRO feature) */}
        {showAllergens && (
          <FormField
            control={form.control}
            name="allergens"
            render={() => (
              <FormItem>
                <div className="mb-4">
                  <FormLabel>{t('allergens')}</FormLabel>
                  <FormDescription>{t('allergensHelp')}</FormDescription>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {ALLERGENS.map((allergen) => (
                    <FormField
                      key={allergen.value}
                      control={form.control}
                      name="allergens"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={allergen.value}
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(allergen.value)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...(field.value || []), allergen.value])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== allergen.value
                                        )
                                      );
                                }}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal">
                              {t(`allergen${allergen.value.charAt(0) + allergen.value.slice(1).toLowerCase()}`)}
                            </FormLabel>
                          </FormItem>
                        );
                      }}
                    />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Availability Toggle */}
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
