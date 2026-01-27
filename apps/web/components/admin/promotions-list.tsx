'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { format, isPast, isFuture, isWithinInterval } from 'date-fns';
import { ka, enUS, ru } from 'date-fns/locale';
import { useLocale } from 'next-intl';
import {
  Plus,
  Pencil,
  Trash2,
  Tag,
  Calendar,
  Eye,
  EyeOff,
} from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PromotionDialog } from './promotion-dialog';
import {
  usePromotions,
  useCreatePromotion,
  useUpdatePromotion,
  useDeletePromotion,
} from '@/hooks/use-promotions';
import type { Promotion } from '@/types/menu';
import type { CreatePromotionInput } from '@/lib/validations/promotion';

interface PromotionsListProps {
  menuId: string;
}

const dateLocales = {
  ka,
  en: enUS,
  ru,
};

type PromotionStatus = 'active' | 'scheduled' | 'expired' | 'inactive';

function getPromotionStatus(promotion: Promotion): PromotionStatus {
  const now = new Date();
  const startDate = new Date(promotion.startDate);
  const endDate = new Date(promotion.endDate);

  if (!promotion.isActive) {
    return 'inactive';
  }

  if (isPast(endDate)) {
    return 'expired';
  }

  if (isFuture(startDate)) {
    return 'scheduled';
  }

  if (isWithinInterval(now, { start: startDate, end: endDate })) {
    return 'active';
  }

  return 'inactive';
}

function getStatusBadge(status: PromotionStatus) {
  switch (status) {
    case 'active':
      return (
        <Badge variant="default" className="bg-green-600">
          Active
        </Badge>
      );
    case 'scheduled':
      return <Badge variant="secondary">Scheduled</Badge>;
    case 'expired':
      return <Badge variant="outline">Expired</Badge>;
    case 'inactive':
      return (
        <Badge variant="outline" className="text-muted-foreground">
          Inactive
        </Badge>
      );
  }
}

export function PromotionsList({ menuId }: PromotionsListProps) {
  const t = useTranslations('admin.promotions');
  const tActions = useTranslations('actions');
  const locale = useLocale();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [promotionToEdit, setPromotionToEdit] = useState<Promotion | null>(
    null
  );
  const [promotionToDelete, setPromotionToDelete] = useState<Promotion | null>(
    null
  );

  const {
    data: promotions,
    isLoading,
    error,
  } = usePromotions(menuId, { includeExpired: true });
  const createPromotion = useCreatePromotion(menuId);
  const updatePromotion = useUpdatePromotion(
    menuId,
    promotionToEdit?.id || ''
  );
  const deletePromotion = useDeletePromotion(menuId);

  const handleCreate = async (data: CreatePromotionInput) => {
    await createPromotion.mutateAsync(data);
    setIsCreateOpen(false);
  };

  const handleUpdate = async (data: CreatePromotionInput) => {
    if (!promotionToEdit) return;
    await updatePromotion.mutateAsync(data);
    setPromotionToEdit(null);
  };

  const handleDelete = async () => {
    if (!promotionToDelete) return;
    await deletePromotion.mutateAsync(promotionToDelete.id);
    setPromotionToDelete(null);
  };

  const formatDate = (date: string) => {
    return format(new Date(date), 'PP', {
      locale: dateLocales[locale as keyof typeof dateLocales] || enUS,
    });
  };

  if (isLoading) {
    return <PromotionsListSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
        <p className="text-destructive">{error.message}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          {tActions('tryAgain')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t('title')}</h3>
        <Button onClick={() => setIsCreateOpen(true)} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          {t('add')}
        </Button>
      </div>

      {!promotions || promotions.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <Tag className="mx-auto h-10 w-10 text-muted-foreground" />
          <h4 className="mt-3 text-base font-semibold">{t('empty.title')}</h4>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('empty.description')}
          </p>
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="mt-4"
            size="sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            {tActions('create')}
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {promotions.map((promotion) => {
            const status = getPromotionStatus(promotion);
            return (
              <Card key={promotion.id}>
                <CardContent className="p-0">
                  {/* Image */}
                  {promotion.imageUrl && (
                    <div className="relative aspect-[2/1] overflow-hidden rounded-t-lg">
                      <Image
                        src={promotion.imageUrl}
                        alt={promotion.titleKa}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 400px"
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium truncate">
                          {promotion.titleKa}
                        </h4>
                        {promotion.titleEn && (
                          <p className="text-sm text-muted-foreground truncate">
                            {promotion.titleEn}
                          </p>
                        )}
                      </div>
                      {getStatusBadge(status)}
                    </div>

                    {promotion.descriptionKa && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {promotion.descriptionKa}
                      </p>
                    )}

                    {/* Date range */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {formatDate(promotion.startDate)} -{' '}
                        {formatDate(promotion.endDate)}
                      </span>
                    </div>

                    {/* Active status indicator */}
                    <div className="flex items-center gap-2 text-sm">
                      {promotion.isActive ? (
                        <>
                          <Eye className="h-4 w-4 text-green-600" />
                          <span className="text-green-600">{t('visible')}</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {t('hidden')}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPromotionToEdit(promotion)}
                        className="flex-1"
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        {tActions('edit')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPromotionToDelete(promotion)}
                        className="flex-1 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {tActions('delete')}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Promotion Dialog */}
      <PromotionDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSubmit={handleCreate}
        isLoading={createPromotion.isPending}
      />

      {/* Edit Promotion Dialog */}
      <PromotionDialog
        open={!!promotionToEdit}
        onOpenChange={(open) => !open && setPromotionToEdit(null)}
        promotion={promotionToEdit || undefined}
        onSubmit={handleUpdate}
        isLoading={updatePromotion.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!promotionToDelete}
        onOpenChange={(open) => !open && setPromotionToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('delete.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('delete.message')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePromotion.isPending}>
              {tActions('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deletePromotion.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletePromotion.isPending
                ? tActions('deleting')
                : tActions('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function PromotionsListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-0">
              <Skeleton className="aspect-[2/1] rounded-t-lg" />
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 flex-1">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-24" />
                <div className="flex gap-2 pt-2 border-t">
                  <Skeleton className="h-8 flex-1" />
                  <Skeleton className="h-8 flex-1" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
