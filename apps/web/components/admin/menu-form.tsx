'use client';

import { useEffect } from 'react';
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
import { createMenuSchema, type CreateMenuInput } from '@/lib/validations/menu';
import type { Menu } from '@/types/menu';

interface MenuFormProps {
  menu?: Menu;
  onSubmit: (data: CreateMenuInput) => Promise<void>;
  isLoading?: boolean;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function MenuForm({ menu, onSubmit, isLoading }: MenuFormProps) {
  const t = useTranslations('admin.menus.form');
  const tActions = useTranslations('actions');

  const form = useForm<CreateMenuInput>({
    resolver: zodResolver(createMenuSchema),
    defaultValues: {
      name: menu?.name || '',
      slug: menu?.slug || '',
      description: menu?.description || '',
    },
  });

  const watchName = form.watch('name');
  const slugValue = form.watch('slug');

  // Auto-generate slug from name when creating new menu
  useEffect(() => {
    if (!menu && watchName && !slugValue) {
      const generatedSlug = slugify(watchName);
      if (generatedSlug) {
        form.setValue('slug', generatedSlug, { shouldValidate: true });
      }
    }
  }, [watchName, slugValue, menu, form]);

  const handleSubmit = async (data: CreateMenuInput) => {
    await onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('name')}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t('namePlaceholder')}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('slug')}</FormLabel>
              <FormControl>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">/m/</span>
                  <Input
                    placeholder={t('slugPlaceholder')}
                    {...field}
                    onChange={(e) => {
                      const value = slugify(e.target.value);
                      field.onChange(value);
                    }}
                  />
                </div>
              </FormControl>
              <FormDescription>
                {t('slugHelp')}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('description')}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t('descriptionPlaceholder')}
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {menu ? t('update') : t('create')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
