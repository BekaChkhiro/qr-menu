'use client';

import { useTranslations } from 'next-intl';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { CategoryForm } from './category-form';
import type { Category } from '@/types/menu';
import type { CreateCategoryInput } from '@/lib/validations/category';

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category;
  onSubmit: (data: CreateCategoryInput) => Promise<void>;
  isLoading?: boolean;
}

export function CategoryDialog({
  open,
  onOpenChange,
  category,
  onSubmit,
  isLoading,
}: CategoryDialogProps) {
  const t = useTranslations('admin.categories');
  const tActions = useTranslations('actions');
  const isEditing = !!category;

  const handleSubmit = async (data: CreateCategoryInput) => {
    await onSubmit(data);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[480px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {isEditing ? tActions('edit') : tActions('add')} {t('title').slice(0, -1)}
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          <CategoryForm
            category={category}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={isLoading}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
