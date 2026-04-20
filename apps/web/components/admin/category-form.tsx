'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ImageUpload } from '@/components/admin/image-upload';
import { createCategorySchema, type CreateCategoryInput } from '@/lib/validations/category';
import type { Category } from '@/types/menu';

interface CategoryFormProps {
  category?: Category;
  onSubmit: (data: CreateCategoryInput) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function CategoryForm({ category, onSubmit, onCancel, isLoading }: CategoryFormProps) {
  const t = useTranslations('admin.categories.form');
  const tActions = useTranslations('actions');

  const form = useForm<CreateCategoryInput>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      nameKa: category?.nameKa || '',
      nameEn: category?.nameEn || '',
      nameRu: category?.nameRu || '',
      descriptionKa: category?.descriptionKa || '',
      descriptionEn: category?.descriptionEn || '',
      descriptionRu: category?.descriptionRu || '',
      iconUrl: category?.iconUrl || '',
      brandLabel: category?.brandLabel || '',
      type: category?.type || 'OTHER',
    },
  });

  const handleSubmit = async (data: CreateCategoryInput) => {
    await onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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
                <Textarea className="resize-none" rows={2} {...field} value={field.value || ''} />
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
                <Textarea className="resize-none" rows={2} {...field} value={field.value || ''} />
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
                <Textarea className="resize-none" rows={2} {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Category type (for Foods/Drinks split) */}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ტიპი (type)</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || 'OTHER'}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="FOOD">🍽️ საჭმელი (Food)</SelectItem>
                  <SelectItem value="DRINK">🥤 სასმელი (Drink)</SelectItem>
                  <SelectItem value="OTHER">📋 სხვა (Other)</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                გამოიყენება &ldquo;Foods/Drinks split&rdquo; layout-ისთვის
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Brand label (optional) */}
        <FormField
          control={form.control}
          name="brandLabel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ბრენდი (optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="მაგ: Starbucks"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormDescription>
                გამოჩნდება კატეგორიის დასახელების წინ
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Category icon */}
        <FormField
          control={form.control}
          name="iconUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>კატეგორიის ხატულა (optional)</FormLabel>
              <FormControl>
                <ImageUpload
                  value={field.value || null}
                  onChange={(url) => field.onChange(url || '')}
                  preset="logo"
                  aspectRatio="square"
                  enableCropper={false}
                />
              </FormControl>
              <FormDescription>პატარა icon-ი კატეგორიის nav-ში</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            {tActions('cancel')}
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {category ? tActions('save') : tActions('create')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
