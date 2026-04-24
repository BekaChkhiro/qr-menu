'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Loader2, Plus, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import {
  KebabMenu,
  KebabMenuContent,
  KebabMenuIconTrigger,
  KebabMenuItem,
  KebabMenuPortal,
} from '@/components/ui/kebab-menu';
import {
  useCreateVariation,
  useDeleteVariation,
  useReorderVariations,
  useUpdateVariation,
  useVariations,
} from '@/hooks/use-variations';
import { cn } from '@/lib/utils';
import type { Product, ProductVariation } from '@/types/menu';

interface ProductDrawerVariationsTabProps {
  menuId: string;
  product: Product;
}

export function ProductDrawerVariationsTab({
  menuId,
  product,
}: ProductDrawerVariationsTabProps) {
  const t = useTranslations('admin.products.drawer.variationsTab');
  const basePrice = Number(product.price);
  const { data: variations, isLoading } = useVariations(menuId, product.id);
  const createVariation = useCreateVariation(menuId, product.id);
  const deleteVariation = useDeleteVariation(menuId, product.id);
  const reorderVariations = useReorderVariations(menuId, product.id);

  const [variationToDelete, setVariationToDelete] =
    useState<ProductVariation | null>(null);
  const [addingRow, setAddingRow] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !variations) return;
    const oldIndex = variations.findIndex((v) => v.id === active.id);
    const newIndex = variations.findIndex((v) => v.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(variations, oldIndex, newIndex);
    reorderVariations.mutate({
      variations: reordered.map((v, index) => ({ id: v.id, sortOrder: index })),
    });
  };

  const handleConfirmDelete = async () => {
    if (!variationToDelete) return;
    try {
      await deleteVariation.mutateAsync(variationToDelete.id);
      toast.success(t('toast.deleted'));
    } catch {
      toast.error(t('toast.deleteError'));
    } finally {
      setVariationToDelete(null);
    }
  };

  return (
    <div data-testid="product-drawer-variations">
      <p className="mb-4 text-[13px] leading-[1.55] text-text-muted">
        {t('intro')}
      </p>

      <div
        className="overflow-hidden rounded-[10px] border border-border bg-card"
        data-testid="product-drawer-variations-table"
      >
        {/* Header row */}
        <div
          className="grid items-center gap-[10px] border-b border-border-soft bg-[#FCFBF8] px-[14px] py-[9px] text-[10.5px] font-semibold uppercase tracking-[0.5px] text-text-subtle"
          style={{ gridTemplateColumns: '20px 1fr 110px 70px 28px' }}
        >
          <span />
          <span>{t('header.name')}</span>
          <span className="text-right">{t('header.priceModifier')}</span>
          <span className="text-center">{t('header.default')}</span>
          <span />
        </div>

        {/* Rows */}
        {isLoading ? (
          <div
            className="flex items-center justify-center gap-2 px-[14px] py-6 text-[12.5px] text-text-muted"
            data-testid="product-drawer-variations-loading"
          >
            <Loader2 className="h-[13px] w-[13px] animate-spin" />
            {t('loading')}
          </div>
        ) : !variations || variations.length === 0 ? (
          !addingRow && (
            <div
              className="px-[14px] py-5 text-center text-[12.5px] text-text-muted"
              data-testid="product-drawer-variations-empty"
            >
              {t('empty')}
            </div>
          )
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={variations.map((v) => v.id)}
              strategy={verticalListSortingStrategy}
            >
              <ul
                role="list"
                className="divide-y divide-border-soft"
                data-testid="product-drawer-variations-rows"
              >
                {variations.map((variation, i) => (
                  <SortableVariationRow
                    key={variation.id}
                    variation={variation}
                    basePrice={basePrice}
                    menuId={menuId}
                    productId={product.id}
                    isLast={i === variations.length - 1}
                    onDelete={() => setVariationToDelete(variation)}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}

        {/* Inline add row */}
        {addingRow && (
          <AddVariationRow
            basePrice={basePrice}
            nextSortOrder={variations?.length ?? 0}
            isSubmitting={createVariation.isPending}
            onCancel={() => setAddingRow(false)}
            onSubmit={async (values) => {
              try {
                await createVariation.mutateAsync(values);
                toast.success(t('toast.created'));
                setAddingRow(false);
              } catch {
                toast.error(t('toast.createError'));
              }
            }}
          />
        )}
      </div>

      {/* "+ Add variation" dashed CTA */}
      {!addingRow && (
        <button
          type="button"
          onClick={() => setAddingRow(true)}
          className={cn(
            'mt-[10px] flex w-full items-center justify-center gap-1.5 rounded-[8px]',
            'border-[1.5px] border-dashed border-border bg-[#FCFBF8] px-3 py-[10px]',
            'text-[12.5px] font-medium text-text-muted transition-colors',
            'hover:border-text-default hover:text-text-default',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
          )}
          data-testid="product-drawer-variations-add"
        >
          <Plus className="h-3 w-3" strokeWidth={2} />
          {t('add')}
        </button>
      )}

      <p
        className="mt-3 text-[11.5px] text-text-subtle"
        data-testid="product-drawer-variations-helper"
      >
        {t('helper', { basePrice: basePrice.toFixed(2) })}
      </p>

      <AlertDialog
        open={!!variationToDelete}
        onOpenChange={(open) => !open && setVariationToDelete(null)}
      >
        <AlertDialogContent data-testid="product-drawer-variations-delete-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('delete.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('delete.body', { name: variationToDelete?.nameKa ?? '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('delete.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteVariation.isPending}
              className="bg-danger text-white hover:bg-danger/90"
              data-testid="product-drawer-variations-delete-confirm"
            >
              {deleteVariation.isPending
                ? t('delete.deleting')
                : t('delete.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── Sortable row ─────────────────────────────────────────────────────────────

interface SortableVariationRowProps {
  variation: ProductVariation;
  basePrice: number;
  menuId: string;
  productId: string;
  isLast: boolean;
  onDelete: () => void;
}

function SortableVariationRow({
  variation,
  basePrice,
  menuId,
  productId,
  isLast,
  onDelete,
}: SortableVariationRowProps) {
  const t = useTranslations('admin.products.drawer.variationsTab');
  const updateVariation = useUpdateVariation(menuId, productId, variation.id);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: variation.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    gridTemplateColumns: '20px 1fr 110px 70px 28px',
  };

  const modifier = Number(variation.price) - basePrice;
  const modifierLabel = formatModifier(modifier);

  const handleSetDefault = async () => {
    if (variation.isDefault) return;
    try {
      await updateVariation.mutateAsync({ isDefault: true });
    } catch {
      toast.error(t('toast.updateError'));
    }
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        'grid items-center gap-[10px] px-[14px] py-[11px]',
        isDragging && 'z-10 opacity-70 shadow-sm',
        isLast && 'border-b-0',
      )}
      data-testid="product-drawer-variations-row"
      data-variation-id={variation.id}
      data-is-default={variation.isDefault ? 'true' : 'false'}
    >
      <button
        type="button"
        className="flex h-[18px] w-5 cursor-grab items-center justify-center text-text-subtle touch-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 active:cursor-grabbing"
        aria-label={t('dragLabel', { name: variation.nameKa })}
        data-testid="product-drawer-variations-drag-handle"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-[13px] w-[13px]" strokeWidth={1.5} />
      </button>

      <span className="truncate text-[13px] font-medium text-text-default">
        {variation.nameKa}
      </span>

      <span
        className="text-right text-[13px] font-medium text-text-default tabular-nums"
        data-testid="product-drawer-variations-modifier"
      >
        {modifierLabel}
        <span className="font-normal text-text-muted">₾</span>
      </span>

      <div className="flex justify-center">
        <button
          type="button"
          role="radio"
          aria-checked={variation.isDefault}
          onClick={handleSetDefault}
          disabled={updateVariation.isPending}
          className={cn(
            'flex h-[14px] w-[14px] items-center justify-center rounded-full border-[1.5px] transition-colors',
            variation.isDefault
              ? 'border-text-default'
              : 'border-border hover:border-text-muted',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
          data-testid="product-drawer-variations-default-radio"
        >
          {variation.isDefault && (
            <span className="h-[6px] w-[6px] rounded-full bg-text-default" />
          )}
          <span className="sr-only">
            {variation.isDefault ? t('defaultAriaOn') : t('defaultAriaOff')}
          </span>
        </button>
      </div>

      <KebabMenu>
        <KebabMenuIconTrigger
          label={t('kebabLabel', { name: variation.nameKa })}
          className="h-7 w-7"
          data-testid="product-drawer-variations-kebab"
        />
        <KebabMenuPortal>
          <KebabMenuContent align="end" sideOffset={4}>
            <KebabMenuItem
              tone="destructive"
              onSelect={(e) => {
                e.preventDefault();
                onDelete();
              }}
              data-testid="product-drawer-variations-kebab-delete"
            >
              <Trash2 className="mr-2 h-[13px] w-[13px]" strokeWidth={1.8} />
              {t('kebab.delete')}
            </KebabMenuItem>
          </KebabMenuContent>
        </KebabMenuPortal>
      </KebabMenu>
    </li>
  );
}

// ── Add row ──────────────────────────────────────────────────────────────────

interface AddVariationRowProps {
  basePrice: number;
  nextSortOrder: number;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (values: {
    nameKa: string;
    price: number;
    sortOrder: number;
  }) => void | Promise<void>;
}

function AddVariationRow({
  basePrice,
  nextSortOrder,
  isSubmitting,
  onCancel,
  onSubmit,
}: AddVariationRowProps) {
  const t = useTranslations('admin.products.drawer.variationsTab');
  const [name, setName] = useState('');
  const [modifier, setModifier] = useState('0');
  const [nameError, setNameError] = useState(false);

  const parsedModifier = Number.parseFloat(modifier);
  const modifierValid = Number.isFinite(parsedModifier);
  const price = modifierValid ? basePrice + parsedModifier : basePrice;
  const priceValid = price > 0 && price < 100000;

  const canSubmit =
    name.trim().length > 0 && modifierValid && priceValid && !isSubmitting;

  const handleSubmit = async () => {
    if (!name.trim()) {
      setNameError(true);
      return;
    }
    if (!modifierValid || !priceValid) return;
    await onSubmit({
      nameKa: name.trim(),
      price: Math.round(price * 100) / 100,
      sortOrder: nextSortOrder,
    });
    setName('');
    setModifier('0');
    setNameError(false);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
      className="grid items-center gap-[10px] border-t border-border-soft bg-[#FDFCF9] px-[14px] py-[11px]"
      style={{ gridTemplateColumns: '20px 1fr 110px 70px 28px' }}
      data-testid="product-drawer-variations-add-row"
    >
      <span aria-hidden="true" />

      <Input
        autoFocus
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          if (e.target.value.trim()) setNameError(false);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            onCancel();
          }
        }}
        placeholder={t('addForm.namePlaceholder')}
        error={nameError}
        aria-label={t('addForm.nameLabel')}
        className="h-8 text-[13px]"
        maxLength={50}
        data-testid="product-drawer-variations-add-name"
      />

      <Input
        type="number"
        step="0.01"
        inputMode="decimal"
        value={modifier}
        onChange={(e) => setModifier(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            onCancel();
          }
        }}
        aria-label={t('addForm.modifierLabel')}
        className="h-8 text-right text-[13px] tabular-nums"
        data-testid="product-drawer-variations-add-modifier"
      />

      <div className="flex items-center justify-center gap-1">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded px-2 py-1 text-[11.5px] font-medium text-text-muted hover:bg-chip disabled:opacity-50"
          data-testid="product-drawer-variations-add-cancel"
        >
          {t('addForm.cancel')}
        </button>
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className={cn(
          'flex h-7 w-7 items-center justify-center rounded-[6px]',
          'bg-text-default text-white transition-colors',
          'hover:bg-text-default/90',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
        )}
        aria-label={t('addForm.save')}
        data-testid="product-drawer-variations-add-save"
      >
        {isSubmitting ? (
          <Loader2 className="h-[13px] w-[13px] animate-spin" />
        ) : (
          <Plus className="h-[13px] w-[13px]" strokeWidth={2} />
        )}
      </button>
    </form>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatModifier(modifier: number): string {
  if (!Number.isFinite(modifier) || modifier === 0) return '0';
  const sign = modifier > 0 ? '+' : '−';
  const abs = Math.abs(modifier);
  return `${sign}${abs.toFixed(abs % 1 === 0 ? 0 : 2)}`;
}
