'use client';

import { useTranslations } from 'next-intl';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { PromotionForm } from './promotion-form';
import type { Promotion } from '@/types/menu';
import type { CreatePromotionInput } from '@/lib/validations/promotion';

interface PromotionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promotion?: Promotion;
  onSubmit: (data: CreatePromotionInput) => Promise<void>;
  isLoading?: boolean;
}

export function PromotionDialog({
  open,
  onOpenChange,
  promotion,
  onSubmit,
  isLoading,
}: PromotionDialogProps) {
  const t = useTranslations('admin.promotions');
  const tActions = useTranslations('actions');
  const isEditing = !!promotion;

  const handleSubmit = async (data: CreatePromotionInput) => {
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
            {isEditing ? tActions('edit') : tActions('add')} {t('singular')}
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          <PromotionForm
            promotion={promotion}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={isLoading}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
