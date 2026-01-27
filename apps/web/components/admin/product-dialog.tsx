'use client';

import { useTranslations } from 'next-intl';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ProductForm, type ProductFormValues } from './product-form';
import type { Product, Category } from '@/types/menu';

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product;
  categories: Category[];
  defaultCategoryId?: string;
  onSubmit: (data: ProductFormValues) => Promise<void>;
  isLoading?: boolean;
  showAllergens?: boolean;
}

export function ProductDialog({
  open,
  onOpenChange,
  product,
  categories,
  defaultCategoryId,
  onSubmit,
  isLoading,
  showAllergens = false,
}: ProductDialogProps) {
  const t = useTranslations('admin.products');
  const tActions = useTranslations('actions');
  const isEditing = !!product;

  const handleSubmit = async (data: ProductFormValues) => {
    await onSubmit(data);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {isEditing ? tActions('edit') : tActions('add')} {t('title').slice(0, -1)}
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          <ProductForm
            product={product}
            categories={categories}
            defaultCategoryId={defaultCategoryId}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={isLoading}
            showAllergens={showAllergens}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
