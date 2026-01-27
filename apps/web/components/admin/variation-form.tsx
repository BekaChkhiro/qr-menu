'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import type { ProductVariation } from '@/types/menu';

const variationFormSchema = z.object({
  nameKa: z
    .string()
    .min(1, 'Georgian name is required')
    .max(50, 'Name must be less than 50 characters'),
  nameEn: z.string().max(50, 'Name must be less than 50 characters').optional(),
  nameRu: z.string().max(50, 'Name must be less than 50 characters').optional(),
  price: z.string().min(1, 'Price is required'),
});

type VariationFormValues = z.infer<typeof variationFormSchema>;

interface VariationFormProps {
  variation?: ProductVariation;
  onSubmit: (data: VariationFormValues) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function VariationForm({
  variation,
  onSubmit,
  onCancel,
  isLoading,
}: VariationFormProps) {
  const t = useTranslations('admin.products.variations');
  const tActions = useTranslations('actions');

  const form = useForm<VariationFormValues>({
    resolver: zodResolver(variationFormSchema),
    defaultValues: {
      nameKa: variation?.nameKa || '',
      nameEn: variation?.nameEn || '',
      nameRu: variation?.nameRu || '',
      price: variation?.price ? String(variation.price) : '',
    },
  });

  const handleSubmit = async (data: VariationFormValues) => {
    await onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nameKa"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t('nameKa')} <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder={t('namePlaceholder')} {...field} />
              </FormControl>
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
                <Input
                  placeholder={t('namePlaceholder')}
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
          name="nameRu"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('nameRu')}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t('namePlaceholder')}
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
                  placeholder="0.00"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            {tActions('cancel')}
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {variation ? tActions('save') : tActions('add')}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export type { VariationFormValues };
