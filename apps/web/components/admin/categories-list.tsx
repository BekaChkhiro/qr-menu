'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import Image from 'next/image';
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
  ChevronDown,
  ChevronUp,
  Copy,
  FolderOpen,
  GripVertical,
  Lock,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  KebabMenu,
  KebabMenuContent,
  KebabMenuIconTrigger,
  KebabMenuItem,
  KebabMenuSeparator,
} from '@/components/ui/kebab-menu';
import { CategoryDialog } from './category-dialog';
import { ProductsList } from './products-list';
import { UpgradePrompt } from './upgrade-prompt';
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useDuplicateCategory,
  useReorderCategories,
} from '@/hooks/use-categories';
import { useUserPlan } from '@/hooks/use-user-plan';
import type { Category, CategoryType } from '@/types/menu';
import type { CreateCategoryInput } from '@/lib/validations/category';

// Type-based fallback when no iconUrl is set. Keeps the row visually anchored
// without forcing users to upload an icon on creation.
const TYPE_EMOJI: Record<CategoryType, string> = {
  FOOD: '🍽️',
  DRINK: '🥤',
  OTHER: '📁',
};

interface CategoriesListProps {
  menuId: string;
  showAllergens?: boolean;
  totalMenuProducts?: number;
}

export function CategoriesList({
  menuId,
  showAllergens = false,
  totalMenuProducts = 0,
}: CategoriesListProps) {
  const t = useTranslations('admin.categories');
  const tActions = useTranslations('actions');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: categories, isLoading, error } = useCategories(menuId);
  const createCategory = useCreateCategory(menuId);
  const updateCategory = useUpdateCategory(menuId, categoryToEdit?.id || '');
  const deleteCategory = useDeleteCategory(menuId);
  const duplicateCategory = useDuplicateCategory(menuId);
  const reorderCategories = useReorderCategories(menuId);

  const { plan, canCreate } = useUserPlan();
  const categoryCount = categories?.length ?? 0;
  const canAddCategory = canCreate('category', categoryCount);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const filteredCategories = useMemo(() => {
    if (!categories) return [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) =>
      [c.nameKa, c.nameEn, c.nameRu]
        .filter((n): n is string => Boolean(n))
        .some((n) => n.toLowerCase().includes(q)),
    );
  }, [categories, searchQuery]);

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
    if (!over || active.id === over.id || !categories) return;

    const oldIndex = categories.findIndex((c) => c.id === active.id);
    const newIndex = categories.findIndex((c) => c.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = arrayMove(categories, oldIndex, newIndex);
    reorderCategories.mutate({
      categories: reordered.map((c, i) => ({ id: c.id, sortOrder: i })),
    });
  };

  const handleAddCategory = () => {
    if (!canAddCategory) {
      setShowUpgradePrompt(true);
      return;
    }
    setIsCreateOpen(true);
  };

  const handleCreate = async (data: CreateCategoryInput) => {
    try {
      await createCategory.mutateAsync(data);
      setIsCreateOpen(false);
      toast.success(t('toast.created'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('toast.createError'));
    }
  };

  const handleUpdate = async (data: CreateCategoryInput) => {
    if (!categoryToEdit) return;
    try {
      await updateCategory.mutateAsync(data);
      setCategoryToEdit(null);
      toast.success(t('toast.updated'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('toast.updateError'));
    }
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    try {
      await deleteCategory.mutateAsync(categoryToDelete.id);
      setCategoryToDelete(null);
      toast.success(t('toast.deleted'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('toast.deleteError'));
    }
  };

  const handleDuplicate = async (category: Category) => {
    if (!canAddCategory) {
      setShowUpgradePrompt(true);
      return;
    }
    try {
      await duplicateCategory.mutateAsync(category.id);
      toast.success(t('toast.duplicated'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('toast.createError'));
    }
  };

  if (isLoading) return <CategoriesListSkeleton />;

  if (error) {
    return (
      <div
        className="flex w-full lg:w-[360px] lg:shrink-0 flex-col items-center justify-center self-start rounded-[12px] border border-danger-soft bg-danger-soft/30 p-6 text-center"
        data-testid="categories-list-error"
      >
        <p className="text-[13px] text-danger">{error.message}</p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
          {tActions('tryAgain')}
        </Button>
      </div>
    );
  }

  const hasCategories = categoryCount > 0;
  const isFilteredEmpty = hasCategories && filteredCategories.length === 0;

  return (
    <div
      className="flex w-full lg:w-[360px] lg:shrink-0 flex-col gap-3.5 self-start rounded-[12px] border border-border bg-sidebar p-4"
      data-testid="categories-list"
    >
      {/* Search */}
      <div className="relative flex items-center">
        <Search
          className="pointer-events-none absolute left-2.5 h-[13px] w-[13px] text-text-subtle"
          strokeWidth={1.5}
          aria-hidden="true"
        />
        <Input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('searchPlaceholder')}
          aria-label={t('search')}
          data-testid="categories-search"
          className="h-8 rounded-md bg-card pl-[30px] pr-2.5 text-[12.5px] placeholder:text-text-subtle"
        />
      </div>

      {!hasCategories && (
        <div
          className="flex flex-col items-center rounded-md border border-dashed border-border px-4 py-8 text-center"
          role="region"
          aria-label={t('empty.title')}
          data-testid="categories-empty"
        >
          <FolderOpen className="h-8 w-8 text-text-subtle" aria-hidden="true" />
          <h4 className="mt-3 text-[13px] font-semibold text-text-default">
            {t('empty.title')}
          </h4>
          <p className="mt-1 text-[12px] text-text-muted">{t('empty.description')}</p>
        </div>
      )}

      {isFilteredEmpty && (
        <div
          className="flex flex-col items-center rounded-md border border-dashed border-border px-4 py-6 text-center"
          data-testid="categories-no-results"
        >
          <Search className="h-5 w-5 text-text-subtle" aria-hidden="true" />
          <p className="mt-2 text-[12px] text-text-muted">{t('noSearchResults')}</p>
        </div>
      )}

      {hasCategories && !isFilteredEmpty && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filteredCategories.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul
              className="flex flex-col gap-1"
              role="list"
              aria-label={t('title')}
              data-testid="categories-list-rows"
            >
              {filteredCategories.map((category) => (
                <SortableCategoryItem
                  key={category.id}
                  category={category}
                  categories={categories ?? []}
                  menuId={menuId}
                  isExpanded={expandedCategories.has(category.id)}
                  onToggleExpand={() => toggleExpanded(category.id)}
                  onEdit={() => setCategoryToEdit(category)}
                  onDuplicate={() => handleDuplicate(category)}
                  onDelete={() => setCategoryToDelete(category)}
                  isDuplicating={duplicateCategory.isPending}
                  showAllergens={showAllergens}
                  totalMenuProducts={totalMenuProducts}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      {/* Add category (dashed) */}
      <button
        type="button"
        onClick={handleAddCategory}
        aria-disabled={!canAddCategory || undefined}
        data-testid="categories-add-dashed"
        data-can-add={canAddCategory ? 'true' : 'false'}
        className={[
          'mt-auto flex items-center justify-center gap-1.5 rounded-md border-[1.5px] border-dashed border-border bg-transparent px-3 py-2.5 text-[12.5px] font-medium transition-colors',
          canAddCategory
            ? 'text-text-muted hover:bg-chip hover:text-text-default'
            : 'text-text-subtle hover:bg-chip',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
        ].join(' ')}
      >
        {canAddCategory ? (
          <Plus className="h-[13px] w-[13px]" strokeWidth={2} aria-hidden="true" />
        ) : (
          <Lock className="h-[13px] w-[13px]" strokeWidth={2} aria-hidden="true" />
        )}
        {t('addDashed')}
      </button>

      <CategoryDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSubmit={handleCreate}
        isLoading={createCategory.isPending}
      />
      <CategoryDialog
        open={!!categoryToEdit}
        onOpenChange={(open) => !open && setCategoryToEdit(null)}
        category={categoryToEdit || undefined}
        onSubmit={handleUpdate}
        isLoading={updateCategory.isPending}
      />
      <AlertDialog
        open={!!categoryToDelete}
        onOpenChange={(open) => !open && setCategoryToDelete(null)}
      >
        <AlertDialogContent data-testid="categories-delete-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('delete.title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('delete.message')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteCategory.isPending}>
              {tActions('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteCategory.isPending}
              data-testid="categories-delete-confirm"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteCategory.isPending ? tActions('deleting') : tActions('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
  onDuplicate: () => void;
  onDelete: () => void;
  isDuplicating?: boolean;
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
  onDuplicate,
  onDelete,
  isDuplicating = false,
  showAllergens = false,
  totalMenuProducts = 0,
}: SortableCategoryItemProps) {
  const t = useTranslations('admin.categories');
  const tA11y = useTranslations('common.accessibility');
  const tActions = useTranslations('actions');

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id,
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const productCount = category._count?.products ?? category.products?.length ?? 0;
  const displayName = category.nameKa;
  const emoji = TYPE_EMOJI[category.type] ?? '🍴';

  return (
    <li
      ref={setNodeRef}
      style={style}
      data-testid="category-row"
      data-category-id={category.id}
      data-category-name={displayName}
      data-expanded={isExpanded ? 'true' : 'false'}
      className={isDragging ? 'relative z-10 opacity-60 shadow-md' : 'relative'}
    >
      <Collapsible open={isExpanded} onOpenChange={onToggleExpand}>
        <div
          className={[
            'flex items-center gap-2 rounded-md px-2.5 py-[9px] transition-colors',
            isExpanded
              ? 'border border-border bg-card'
              : 'border border-transparent hover:bg-chip',
          ].join(' ')}
        >
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="touch-none cursor-grab rounded-sm text-text-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 active:cursor-grabbing"
            aria-label={tA11y('dragHandle')}
            data-testid="category-drag-handle"
          >
            <GripVertical className="h-[14px] w-[14px]" strokeWidth={1.5} aria-hidden="true" />
          </button>

          <CategoryIcon category={category} emoji={emoji} />

          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-sm bg-transparent text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
              aria-expanded={isExpanded}
              aria-label={isExpanded ? tA11y('collapseCategory') : tA11y('expandCategory')}
              data-testid="category-row-toggle"
            >
              <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-text-default">
                {displayName}
              </span>
              <span
                className="shrink-0 text-[11.5px] tabular-nums text-text-muted"
                data-testid="category-item-count"
              >
                {t('itemCount', { count: productCount })}
              </span>
              {isExpanded ? (
                <ChevronUp
                  className="h-[14px] w-[14px] shrink-0 text-text-muted"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
              ) : (
                <ChevronDown
                  className="h-[14px] w-[14px] shrink-0 text-text-muted"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
              )}
            </button>
          </CollapsibleTrigger>

          <KebabMenu>
            <KebabMenuIconTrigger
              label={t('actionsLabel', { name: displayName })}
              data-testid="category-kebab-trigger"
              className="h-7 w-7"
            />
            <KebabMenuContent>
              <KebabMenuItem
                icon={Pencil}
                onSelect={() => onEdit()}
                data-testid="category-kebab-edit"
              >
                {tActions('edit')}
              </KebabMenuItem>
              <KebabMenuItem
                icon={Copy}
                onSelect={() => onDuplicate()}
                disabled={isDuplicating}
                data-testid="category-kebab-duplicate"
              >
                {t('actions.duplicate')}
              </KebabMenuItem>
              <KebabMenuSeparator />
              <KebabMenuItem
                icon={Trash2}
                tone="destructive"
                onSelect={() => onDelete()}
                data-testid="category-kebab-delete"
              >
                {tActions('delete')}
              </KebabMenuItem>
            </KebabMenuContent>
          </KebabMenu>
        </div>

        <CollapsibleContent data-testid="category-products">
          <div className="mt-1 rounded-md border border-border-soft bg-bg/60 px-2 py-2">
            <ProductsList
              menuId={menuId}
              categoryId={category.id}
              categoryName={displayName}
              categories={categories}
              showAllergens={showAllergens}
              totalMenuProducts={totalMenuProducts}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </li>
  );
}

function CategoryIcon({ category, emoji }: { category: Category; emoji: string }) {
  if (category.iconUrl) {
    return (
      <span
        className="relative h-5 w-5 shrink-0 overflow-hidden rounded-sm bg-chip"
        data-testid="category-icon"
        data-icon-kind="image"
      >
        <Image src={category.iconUrl} alt="" fill sizes="20px" className="object-cover" />
      </span>
    );
  }
  return (
    <span
      className="grid h-5 w-5 shrink-0 place-items-center text-[15px] leading-none"
      aria-hidden="true"
      data-testid="category-icon"
      data-icon-kind="emoji"
    >
      {emoji}
    </span>
  );
}

function CategoriesListSkeleton() {
  return (
    <div
      className="flex w-full lg:w-[360px] lg:shrink-0 flex-col gap-3.5 self-start rounded-[12px] border border-border bg-sidebar p-4"
      data-testid="categories-list-skeleton"
    >
      <Skeleton className="h-8 w-full rounded-md" />
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-[40px] w-full rounded-md" />
      ))}
      <Skeleton className="mt-auto h-[40px] w-full rounded-md" />
    </div>
  );
}

export { CategoriesListSkeleton };
