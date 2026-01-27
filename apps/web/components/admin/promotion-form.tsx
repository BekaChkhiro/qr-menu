'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { ImageUpload } from './image-upload';
import {
  createPromotionSchema,
  type CreatePromotionInput,
} from '@/lib/validations/promotion';
import type { Promotion } from '@/types/menu';

// Form values type for react-hook-form
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
}

// Form-specific schema that uses Date type explicitly
const promotionFormSchema = z
  .object({
    titleKa: z.string().min(1, 'Georgian title is required').max(100),
    titleEn: z.string().max(100).nullable().optional(),
    titleRu: z.string().max(100).nullable().optional(),
    descriptionKa: z.string().max(500).nullable().optional(),
    descriptionEn: z.string().max(500).nullable().optional(),
    descriptionRu: z.string().max(500).nullable().optional(),
    imageUrl: z.string().url('Invalid image URL').nullable().optional(),
    startDate: z.date(),
    endDate: z.date(),
    isActive: z.boolean(),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: 'End date must be after start date',
    path: ['endDate'],
  });

interface PromotionFormProps {
  promotion?: Promotion;
  onSubmit: (data: CreatePromotionInput) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

function formatDateForInput(date: Date | null | undefined): string {
  if (!date) return '';
  return date.toISOString().split('T')[0];
}

export function PromotionForm({
  promotion,
  onSubmit,
  onCancel,
  isLoading,
}: PromotionFormProps) {
  const t = useTranslations('admin.promotions.form');
  const tActions = useTranslations('actions');

  const form = useForm<PromotionFormValues>({
    resolver: zodResolver(promotionFormSchema),
    defaultValues: {
      titleKa: promotion?.titleKa || '',
      titleEn: promotion?.titleEn || '',
      titleRu: promotion?.titleRu || '',
      descriptionKa: promotion?.descriptionKa || '',
      descriptionEn: promotion?.descriptionEn || '',
      descriptionRu: promotion?.descriptionRu || '',
      imageUrl: promotion?.imageUrl || null,
      startDate: promotion?.startDate
        ? new Date(promotion.startDate)
        : new Date(),
      endDate: promotion?.endDate
        ? new Date(promotion.endDate)
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 1 week from now
      isActive: promotion?.isActive ?? true,
    },
  });

  const handleSubmit = async (data: PromotionFormValues) => {
    // The form data is compatible with CreatePromotionInput
    await onSubmit(data as CreatePromotionInput);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Image Upload */}
        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('image')}</FormLabel>
              <FormControl>
                <ImageUpload
                  value={field.value}
                  onChange={field.onChange}
                  preset="promotion"
                  aspectRatio="wide"
                  disabled={isLoading}
                />
              </FormControl>
              <FormDescription>{t('imageHint')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Georgian Title - Required */}
        <FormField
          control={form.control}
          name="titleKa"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t('titleKa')} <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder={t('titleKaPlaceholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* English Title - Optional */}
        <FormField
          control={form.control}
          name="titleEn"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('titleEn')}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t('titleEnPlaceholder')}
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Russian Title - Optional */}
        <FormField
          control={form.control}
          name="titleRu"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('titleRu')}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t('titleRuPlaceholder')}
                  {...field}
                  value={field.value || ''}
                />
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
                <Textarea
                  className="resize-none"
                  rows={3}
                  placeholder={t('descriptionKaPlaceholder')}
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
                  className="resize-none"
                  rows={3}
                  placeholder={t('descriptionEnPlaceholder')}
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
                  className="resize-none"
                  rows={3}
                  placeholder={t('descriptionRuPlaceholder')}
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Date Range */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Start Date */}
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t('startDate')} <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    value={formatDateForInput(field.value)}
                    onChange={(e) => {
                      const date = e.target.value
                        ? new Date(e.target.value)
                        : null;
                      field.onChange(date);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* End Date */}
          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t('endDate')} <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    value={formatDateForInput(field.value)}
                    onChange={(e) => {
                      const date = e.target.value
                        ? new Date(e.target.value)
                        : null;
                      field.onChange(date);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Active Toggle */}
        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <FormLabel>{t('isActive')}</FormLabel>
                <FormDescription>{t('isActiveHint')}</FormDescription>
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
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            {tActions('cancel')}
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {promotion ? tActions('save') : tActions('create')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
