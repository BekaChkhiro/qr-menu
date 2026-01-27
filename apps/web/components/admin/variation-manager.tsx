'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Pencil, Trash2, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { VariationForm, type VariationFormValues } from './variation-form';
import {
  useVariations,
  useCreateVariation,
  useUpdateVariation,
  useDeleteVariation,
  useReorderVariations,
} from '@/hooks';
import type { ProductVariation } from '@/types/menu';

interface SortableVariationItemProps {
  variation: ProductVariation;
  onEdit: (variation: ProductVariation) => void;
  onDelete: (variation: ProductVariation) => void;
}

function SortableVariationItem({
  variation,
  onEdit,
  onDelete,
}: SortableVariationItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: variation.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-background border rounded-lg group"
    >
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{variation.nameKa}</div>
        {variation.nameEn && (
          <div className="text-sm text-muted-foreground truncate">
            {variation.nameEn}
          </div>
        )}
      </div>
      <div className="font-medium text-sm">
        {Number(variation.price).toFixed(2)} GEL
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onEdit(variation)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onDelete(variation)}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}

interface VariationManagerProps {
  menuId: string;
  productId: string;
}

export function VariationManager({ menuId, productId }: VariationManagerProps) {
  const t = useTranslations('admin.products.variations');
  const tActions = useTranslations('actions');
  const tDelete = useTranslations('admin.products.delete');

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingVariation, setEditingVariation] = useState<ProductVariation | null>(null);
  const [deletingVariation, setDeletingVariation] = useState<ProductVariation | null>(null);

  const { data: variations = [], isLoading } = useVariations(menuId, productId);
  const createMutation = useCreateVariation(menuId, productId);
  const updateMutation = useUpdateVariation(
    menuId,
    productId,
    editingVariation?.id || ''
  );
  const deleteMutation = useDeleteVariation(menuId, productId);
  const reorderMutation = useReorderVariations(menuId, productId);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = variations.findIndex((v) => v.id === active.id);
      const newIndex = variations.findIndex((v) => v.id === over.id);
      const reordered = arrayMove(variations, oldIndex, newIndex);

      reorderMutation.mutate({
        variations: reordered.map((v, index) => ({
          id: v.id,
          sortOrder: index,
        })),
      });
    }
  };

  const handleCreate = async (data: VariationFormValues) => {
    await createMutation.mutateAsync({
      nameKa: data.nameKa,
      nameEn: data.nameEn || null,
      nameRu: data.nameRu || null,
      price: parseFloat(data.price),
    });
    setIsAddDialogOpen(false);
  };

  const handleUpdate = async (data: VariationFormValues) => {
    if (!editingVariation) return;
    await updateMutation.mutateAsync({
      nameKa: data.nameKa,
      nameEn: data.nameEn || null,
      nameRu: data.nameRu || null,
      price: parseFloat(data.price),
    });
    setEditingVariation(null);
  };

  const handleDelete = async () => {
    if (!deletingVariation) return;
    await deleteMutation.mutateAsync(deletingVariation.id);
    setDeletingVariation(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">{t('title')}</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsAddDialogOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          {t('add')}
        </Button>
      </div>

      {variations.length === 0 ? (
        <div className="text-center py-8 border border-dashed rounded-lg">
          <p className="text-muted-foreground">{t('empty')}</p>
          <Button
            type="button"
            variant="link"
            onClick={() => setIsAddDialogOpen(true)}
            className="mt-2"
          >
            {t('add')}
          </Button>
        </div>
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
            <div className="space-y-2">
              {variations.map((variation) => (
                <SortableVariationItem
                  key={variation.id}
                  variation={variation}
                  onEdit={setEditingVariation}
                  onDelete={setDeletingVariation}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('add')}</DialogTitle>
          </DialogHeader>
          <VariationForm
            onSubmit={handleCreate}
            onCancel={() => setIsAddDialogOpen(false)}
            isLoading={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingVariation}
        onOpenChange={(open) => !open && setEditingVariation(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tActions('edit')} {t('title').toLowerCase()}</DialogTitle>
          </DialogHeader>
          {editingVariation && (
            <VariationForm
              variation={editingVariation}
              onSubmit={handleUpdate}
              onCancel={() => setEditingVariation(null)}
              isLoading={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingVariation}
        onOpenChange={(open) => !open && setDeletingVariation(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tDelete('title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteConfirm', { name: deletingVariation?.nameKa ?? '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tActions('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {tActions('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
