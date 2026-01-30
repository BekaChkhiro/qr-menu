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
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  Pencil,
  Plus,
  Trash2,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  Lock,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
import { CategoryDialog } from './category-dialog';
import { ProductsList } from './products-list';
import { UpgradePrompt } from './upgrade-prompt';
import { PlanLimitIndicator } from './plan-limit-indicator';
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useReorderCategories,
} from '@/hooks/use-categories';
import { useUserPlan } from '@/hooks/use-user-plan';
import type { Category } from '@/types/menu';
import type { CreateCategoryInput } from '@/lib/validations/category';

interface CategoriesListProps {
  menuId: string;
  showAllergens?: boolean;
  totalMenuProducts?: number;
}

export function CategoriesList({ menuId, showAllergens = false, totalMenuProducts = 0 }: CategoriesListProps) {
  const t = useTranslations('admin.categories');
  const tProducts = useTranslations('admin.products');
  const tActions = useTranslations('actions');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  const { data: categories, isLoading, error } = useCategories(menuId);
  const createCategory = useCreateCategory(menuId);
  const updateCategory = useUpdateCategory(menuId, categoryToEdit?.id || '');
  const deleteCategory = useDeleteCategory(menuId);
  const reorderCategories = useReorderCategories(menuId);

  const { plan, canCreate, getLimit } = useUserPlan();
  const categoryCount = categories?.length ?? 0;
  const categoryLimit = getLimit('category');
  const canAddCategory = canCreate('category', categoryCount);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const toggleExpanded = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && categories) {
      const oldIndex = categories.findIndex((c) => c.id === active.id);
      const newIndex = categories.findIndex((c) => c.id === over.id);

      const reorderedCategories = arrayMove(categories, oldIndex, newIndex);
      const reorderData = {
        categories: reorderedCategories.map((c, index) => ({
          id: c.id,
          sortOrder: index,
        })),
      };

      reorderCategories.mutate(reorderData);
    }
  };

  const handleCreate = async (data: CreateCategoryInput) => {
    try {
      await createCategory.mutateAsync(data);
      setIsCreateOpen(false);
      toast.success(t('toast.created'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('toast.createError'));
    }
  };

  const handleUpdate = async (data: CreateCategoryInput) => {
    if (!categoryToEdit) return;
    try {
      await updateCategory.mutateAsync(data);
      setCategoryToEdit(null);
      toast.success(t('toast.updated'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('toast.updateError'));
    }
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    try {
      await deleteCategory.mutateAsync(categoryToDelete.id);
      setCategoryToDelete(null);
      toast.success(t('toast.deleted'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('toast.deleteError'));
    }
  };

  if (isLoading) {
    return <CategoriesListSkeleton />;
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

  const handleAddCategory = () => {
    if (!canAddCategory) {
      setShowUpgradePrompt(true);
      return;
    }
    setIsCreateOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">{t('title')}</h3>
          {categoryLimit !== Infinity && (
            <PlanLimitIndicator
              current={categoryCount}
              limit={categoryLimit}
              resource="category"
              showProgress={false}
            />
          )}
        </div>
        <Button
          onClick={handleAddCategory}
          size="sm"
          variant={canAddCategory ? 'default' : 'secondary'}
        >
          {canAddCategory ? (
            <Plus className="mr-2 h-4 w-4" />
          ) : (
            <Lock className="mr-2 h-4 w-4" />
          )}
          {t('add')}
        </Button>
      </div>

      {!categories || categories.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <FolderOpen className="mx-auto h-10 w-10 text-muted-foreground" />
          <h4 className="mt-3 text-base font-semibold">{t('empty.title')}</h4>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('empty.description')}
          </p>
          <Button onClick={handleAddCategory} className="mt-4" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            {tActions('create')}
          </Button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={categories.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {categories.map((category) => (
                <SortableCategoryItem
                  key={category.id}
                  category={category}
                  categories={categories}
                  menuId={menuId}
                  isExpanded={expandedCategories.has(category.id)}
                  onToggleExpand={() => toggleExpanded(category.id)}
                  onEdit={() => setCategoryToEdit(category)}
                  onDelete={() => setCategoryToDelete(category)}
                  showAllergens={showAllergens}
                  totalMenuProducts={totalMenuProducts}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Create Category Dialog */}
      <CategoryDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSubmit={handleCreate}
        isLoading={createCategory.isPending}
      />

      {/* Edit Category Dialog */}
      <CategoryDialog
        open={!!categoryToEdit}
        onOpenChange={(open) => !open && setCategoryToEdit(null)}
        category={categoryToEdit || undefined}
        onSubmit={handleUpdate}
        isLoading={updateCategory.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!categoryToDelete}
        onOpenChange={(open) => !open && setCategoryToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('delete.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('delete.message')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteCategory.isPending}>
              {tActions('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteCategory.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteCategory.isPending ? tActions('deleting') : tActions('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Upgrade Prompt */}
      <UpgradePrompt
        open={showUpgradePrompt}
        onOpenChange={setShowUpgradePrompt}
        currentPlan={plan}
        reason="category_limit"
        currentCount={categoryCount}
      />
    </div>
  );
}

interface SortableCategoryItemProps {
  category: Category;
  categories: Category[];
  menuId: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  showAllergens?: boolean;
  totalMenuProducts?: number;
}

function SortableCategoryItem({
  category,
  categories,
  menuId,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  showAllergens = false,
  totalMenuProducts = 0,
}: SortableCategoryItemProps) {
  const tProducts = useTranslations('admin.products');

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const productCount = category._count?.products ?? category.products?.length ?? 0;

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggleExpand}>
      <Card
        ref={setNodeRef}
        style={style}
        className={`${isDragging ? 'opacity-50 shadow-lg' : ''}`}
      >
        <CardContent className="p-0">
          {/* Category Header */}
          <div className="flex items-center gap-3 p-3">
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab touch-none rounded p-1 hover:bg-muted active:cursor-grabbing"
              aria-label="Drag to reorder"
            >
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </button>

            <CollapsibleTrigger asChild>
              <button
                className="flex items-center gap-1 rounded p-1 hover:bg-muted"
                aria-label={isExpanded ? 'Collapse products' : 'Expand products'}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </CollapsibleTrigger>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium truncate">{category.nameKa}</p>
                {category.nameEn && (
                  <span className="text-sm text-muted-foreground truncate">
                    ({category.nameEn})
                  </span>
                )}
              </div>
              {category.descriptionKa && (
                <p className="text-sm text-muted-foreground truncate">
                  {category.descriptionKa}
                </p>
              )}
            </div>

            <Badge variant="secondary" className="shrink-0">
              {productCount} {tProducts('title').toLowerCase()}
            </Badge>

            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={onEdit}
                aria-label="Edit category"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onDelete}
                aria-label="Delete category"
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Products Section (Collapsible) */}
          <CollapsibleContent>
            <div className="border-t bg-muted/30 p-4">
              <ProductsList
                menuId={menuId}
                categoryId={category.id}
                categories={categories}
                showAllergens={showAllergens}
                totalMenuProducts={totalMenuProducts}
              />
            </div>
          </CollapsibleContent>
        </CardContent>
      </Card>
    </Collapsible>
  );
}

function CategoriesListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center gap-3 p-3">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-4 w-4" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-5 w-20" />
              <div className="flex gap-1">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
