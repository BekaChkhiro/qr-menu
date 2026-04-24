'use client';

import { useState } from 'react';
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
  Copy,
  EyeOff,
  FolderInput,
  GripVertical,
  ImageIcon,
  Lock,
  Pencil,
  Plus,
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
import {
  KebabMenu,
  KebabMenuContent,
  KebabMenuIconTrigger,
  KebabMenuItem,
  KebabMenuSeparator,
} from '@/components/ui/kebab-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductDialog } from './product-dialog';
import { UpgradePrompt } from './upgrade-prompt';
import { type ProductFormValues } from './product-form';
import {
  useProductsByCategory,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useDuplicateProduct,
  useMoveProduct,
  useReorderProducts,
} from '@/hooks/use-products';
import { useUserPlan } from '@/hooks/use-user-plan';
import { cn } from '@/lib/utils';
import type { Allergen, Category, Product, Ribbon } from '@/types/menu';

/** Convert optional numeric form string to number or null. */
function numOrNull(v: string | undefined): number | null {
  if (!v || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function intOrNull(v: string | undefined): number | null {
  if (!v || v === '') return null;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}

function formToApi(data: ProductFormValues) {
  return {
    categoryId: data.categoryId,
    nameKa: data.nameKa,
    nameEn: data.nameEn || null,
    nameRu: data.nameRu || null,
    descriptionKa: data.descriptionKa || null,
    descriptionEn: data.descriptionEn || null,
    descriptionRu: data.descriptionRu || null,
    price: parseFloat(data.price),
    oldPrice: numOrNull(data.oldPrice),
    currency: 'GEL',
    imageUrl: data.imageUrl || null,
    allergens: (data.allergens || []) as Allergen[],
    ribbons: (data.ribbons || []) as Ribbon[],
    isVegan: data.isVegan ?? false,
    isVegetarian: data.isVegetarian ?? false,
    calories: intOrNull(data.calories),
    protein: numOrNull(data.protein),
    fats: numOrNull(data.fats),
    carbs: numOrNull(data.carbs),
    fiber: numOrNull(data.fiber),
    isAvailable: data.isAvailable,
  };
}

// Thumbnail gradient palette, aligned with menu-card so category/product
// placeholders feel visually related across the admin.
const THUMB_TONES: ReadonlyArray<readonly [string, string]> = [
  ['#C9B28A', '#8B6F47'],
  ['#B8633D', '#7A3F27'],
  ['#6B7F6B', '#3F5B3F'],
  ['#8A7CA0', '#5D4F70'],
  ['#D4A373', '#8B5A2B'],
  ['#5D7A91', '#344C63'],
];

function toneFor(id: string): readonly [string, string] {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return THUMB_TONES[Math.abs(h) % THUMB_TONES.length];
}

function formatPrice(price: number | string): string {
  const n = typeof price === 'string' ? parseFloat(price) : price;
  if (!Number.isFinite(n)) return '0';
  return Number.isInteger(n) ? n.toFixed(0) : n.toFixed(2);
}

interface ProductsListProps {
  menuId: string;
  categoryId: string;
  categoryName: string;
  categories: Category[];
  showAllergens?: boolean;
  totalMenuProducts?: number;
}

export function ProductsList({
  menuId,
  categoryId,
  categoryName,
  categories,
  showAllergens = false,
  totalMenuProducts = 0,
}: ProductsListProps) {
  const t = useTranslations('admin.products');
  const tActions = useTranslations('actions');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  const { data: products, isLoading, error } = useProductsByCategory(menuId, categoryId);
  const createProduct = useCreateProduct(menuId);
  const updateProduct = useUpdateProduct(menuId, productToEdit?.id || '');
  const deleteProduct = useDeleteProduct(menuId);
  const duplicateProduct = useDuplicateProduct(menuId);
  const reorderProducts = useReorderProducts(menuId, categoryId);
  const moveProduct = useMoveProduct(menuId);

  const { plan, canCreate, hasFeature } = useUserPlan();
  const canAddProduct = canCreate('product', totalMenuProducts);
  const multilangUnlocked = hasFeature('multilingual');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const otherCategories = categories.filter((c) => c.id !== categoryId);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !products) return;

    const oldIndex = products.findIndex((p) => p.id === active.id);
    const newIndex = products.findIndex((p) => p.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = arrayMove(products, oldIndex, newIndex);
    reorderProducts.mutate({
      products: reordered.map((p, i) => ({ id: p.id, sortOrder: i })),
    });
  };

  const handleAddProduct = () => {
    if (!canAddProduct) {
      setShowUpgradePrompt(true);
      return;
    }
    setIsCreateOpen(true);
  };

  const handleCreate = async (data: ProductFormValues) => {
    try {
      await createProduct.mutateAsync(formToApi(data));
      toast.success(t('toast.created'));
    } catch (err) {
      throw err instanceof Error ? err : new Error(t('toast.createError'));
    }
  };

  const handleUpdate = async (data: ProductFormValues) => {
    if (!productToEdit) return;
    try {
      await updateProduct.mutateAsync(formToApi(data));
      toast.success(t('toast.updated'));
    } catch (err) {
      throw err instanceof Error ? err : new Error(t('toast.updateError'));
    }
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    try {
      await deleteProduct.mutateAsync(productToDelete.id);
      setProductToDelete(null);
      toast.success(t('toast.deleted'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('toast.deleteError'));
    }
  };

  const handleDuplicate = async (product: Product) => {
    if (!canAddProduct) {
      setShowUpgradePrompt(true);
      return;
    }
    try {
      await duplicateProduct.mutateAsync(product.id);
      toast.success(t('toast.duplicated'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('toast.createError'));
    }
  };

  const handleMoveTo = async (product: Product, targetCategoryId: string) => {
    try {
      await moveProduct.mutateAsync({ productId: product.id, targetCategoryId });
      toast.success(t('toast.moved'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('toast.updateError'));
    }
  };

  if (isLoading) return <ProductsListSkeleton />;

  if (error) {
    return (
      <div
        className="rounded-md border border-danger-soft bg-danger-soft/30 p-3 text-center text-[12px] text-danger"
        data-testid="products-list-error"
      >
        {error.message}
      </div>
    );
  }

  const hasProducts = (products?.length ?? 0) > 0;

  return (
    <div className="space-y-2" data-testid="products-list" data-category-id={categoryId}>
      {hasProducts ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={products!.map((p) => p.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul
              className="flex flex-col gap-1"
              role="list"
              aria-label={t('title')}
              data-testid="products-list-rows"
            >
              {products!.map((product) => (
                <SortableProductItem
                  key={product.id}
                  product={product}
                  otherCategories={otherCategories}
                  onEdit={() => setProductToEdit(product)}
                  onDuplicate={() => handleDuplicate(product)}
                  onDelete={() => setProductToDelete(product)}
                  onMoveTo={(targetId) => handleMoveTo(product, targetId)}
                  isDuplicating={duplicateProduct.isPending}
                  isMoving={moveProduct.isPending}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      ) : (
        <div
          className="rounded-md border border-dashed border-border-soft bg-bg/40 px-3 py-3 text-center"
          role="region"
          aria-label={t('empty.title')}
          data-testid="products-empty"
        >
          <p className="text-[11.5px] text-text-muted">{t('empty.description')}</p>
        </div>
      )}

      {/* Inline "+ Add item to {category}" — accent-colored link-style button. */}
      <button
        type="button"
        onClick={handleAddProduct}
        aria-disabled={!canAddProduct || undefined}
        data-testid="products-add-inline"
        data-can-add={canAddProduct ? 'true' : 'false'}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-sm px-2 py-1.5 text-[12px] font-medium transition-colors',
          canAddProduct
            ? 'text-accent hover:bg-accent-soft'
            : 'text-text-subtle hover:bg-chip',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1',
        )}
      >
        {canAddProduct ? (
          <Plus className="h-[11px] w-[11px]" strokeWidth={2.2} aria-hidden="true" />
        ) : (
          <Lock className="h-[11px] w-[11px]" strokeWidth={2.2} aria-hidden="true" />
        )}
        {t('addItem', { category: categoryName })}
      </button>

      <ProductDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        menuId={menuId}
        categories={categories}
        defaultCategoryId={categoryId}
        onSubmit={handleCreate}
        isLoading={createProduct.isPending}
        showAllergens={showAllergens}
        multilangUnlocked={multilangUnlocked}
      />

      <ProductDialog
        open={!!productToEdit}
        onOpenChange={(open) => !open && setProductToEdit(null)}
        menuId={menuId}
        product={productToEdit || undefined}
        categories={categories}
        onSubmit={handleUpdate}
        isLoading={updateProduct.isPending}
        showAllergens={showAllergens}
        multilangUnlocked={multilangUnlocked}
        onDelete={
          productToEdit
            ? () => {
                const target = productToEdit;
                setProductToEdit(null);
                setProductToDelete(target);
              }
            : undefined
        }
      />

      <AlertDialog
        open={!!productToDelete}
        onOpenChange={(open) => !open && setProductToDelete(null)}
      >
        <AlertDialogContent data-testid="products-delete-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('delete.title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('delete.message')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteProduct.isPending}>
              {tActions('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteProduct.isPending}
              data-testid="products-delete-confirm"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteProduct.isPending ? tActions('deleting') : tActions('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <UpgradePrompt
        open={showUpgradePrompt}
        onOpenChange={setShowUpgradePrompt}
        currentPlan={plan}
        reason="product_limit"
        currentCount={totalMenuProducts}
      />
    </div>
  );
}

interface SortableProductItemProps {
  product: Product;
  otherCategories: Category[];
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onMoveTo: (targetCategoryId: string) => void;
  isDuplicating?: boolean;
  isMoving?: boolean;
}

function SortableProductItem({
  product,
  otherCategories,
  onEdit,
  onDuplicate,
  onDelete,
  onMoveTo,
  isDuplicating = false,
  isMoving = false,
}: SortableProductItemProps) {
  const t = useTranslations('admin.products');
  const tStatus = useTranslations('status');
  const tA11y = useTranslations('common.accessibility');
  const tActions = useTranslations('actions');

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: product.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const variationCount = product.variations?.length ?? 0;
  const price = formatPrice(product.price);

  return (
    <li
      ref={setNodeRef}
      style={style}
      data-testid="product-row"
      data-product-id={product.id}
      data-product-name={product.nameKa}
      data-category-id={product.categoryId}
      className={cn('relative', isDragging && 'z-10 opacity-60 shadow-md')}
    >
      <div className="flex items-center gap-[10px] rounded-[7px] border border-border-soft bg-card px-[10px] py-[7px]">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="touch-none cursor-grab rounded-sm text-text-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 active:cursor-grabbing"
          aria-label={tA11y('dragHandle')}
          data-testid="product-drag-handle"
        >
          <GripVertical
            className="h-[12px] w-[12px]"
            strokeWidth={1.5}
            aria-hidden="true"
          />
        </button>

        <ProductThumb product={product} />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p
              className="min-w-0 truncate text-[12.5px] font-semibold text-text-default"
              data-testid="product-name"
            >
              {product.nameKa}
            </p>
            {!product.isAvailable && (
              <span
                className="inline-flex shrink-0 items-center gap-0.5 rounded-sm bg-chip px-1 py-0.5 text-[9.5px] font-medium text-text-muted"
                data-testid="product-hidden-badge"
              >
                <EyeOff
                  className="h-[9px] w-[9px]"
                  aria-hidden="true"
                  strokeWidth={1.5}
                />
                {tStatus('hidden')}
              </span>
            )}
          </div>
          {product.descriptionKa ? (
            <p
              className="truncate text-[10.5px] text-text-muted"
              data-testid="product-subtitle"
            >
              {product.descriptionKa}
            </p>
          ) : variationCount > 0 ? (
            <p className="text-[10.5px] text-text-muted">
              +{variationCount} {t('variations.title').toLowerCase()}
            </p>
          ) : null}
        </div>

        <span
          className="shrink-0 text-[12.5px] font-semibold tabular-nums text-text-default"
          data-testid="product-price"
        >
          {price}
          <span className="ml-[1px] font-normal text-text-muted">₾</span>
        </span>

        <KebabMenu>
          <KebabMenuIconTrigger
            label={t('actionsLabel', { name: product.nameKa })}
            data-testid="product-kebab-trigger"
            className="h-6 w-6"
          />
          <KebabMenuContent>
            <KebabMenuItem
              icon={Pencil}
              onSelect={onEdit}
              data-testid="product-kebab-edit"
            >
              {tActions('edit')}
            </KebabMenuItem>
            <KebabMenuItem
              icon={Copy}
              onSelect={onDuplicate}
              disabled={isDuplicating}
              data-testid="product-kebab-duplicate"
            >
              {t('actions.duplicate')}
            </KebabMenuItem>
            {otherCategories.length > 0 && (
              <>
                <KebabMenuSeparator />
                <div
                  className="px-[10px] pb-[3px] pt-[4px] text-[10px] font-semibold uppercase tracking-wide text-text-subtle"
                  aria-hidden="true"
                >
                  {t('moveToLabel')}
                </div>
                {otherCategories.slice(0, 8).map((cat) => (
                  <KebabMenuItem
                    key={cat.id}
                    icon={FolderInput}
                    onSelect={() => onMoveTo(cat.id)}
                    disabled={isMoving}
                    data-testid="product-kebab-move-to"
                    data-target-category-id={cat.id}
                  >
                    {cat.nameKa}
                  </KebabMenuItem>
                ))}
              </>
            )}
            <KebabMenuSeparator />
            <KebabMenuItem
              icon={Trash2}
              tone="destructive"
              onSelect={onDelete}
              data-testid="product-kebab-delete"
            >
              {tActions('delete')}
            </KebabMenuItem>
          </KebabMenuContent>
        </KebabMenu>
      </div>
    </li>
  );
}

function ProductThumb({ product }: { product: Product }) {
  if (product.imageUrl) {
    return (
      <span
        className="relative h-7 w-7 shrink-0 overflow-hidden rounded-sm"
        data-testid="product-thumb"
        data-thumb-kind="image"
      >
        <Image
          src={product.imageUrl}
          alt=""
          fill
          sizes="28px"
          className="object-cover"
        />
      </span>
    );
  }

  const [from, to] = toneFor(product.id);
  return (
    <span
      className="relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-sm"
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
      data-testid="product-thumb"
      data-thumb-kind="placeholder"
      aria-hidden="true"
    >
      <ImageIcon className="h-[12px] w-[12px] text-white/80" strokeWidth={1.5} />
    </span>
  );
}

function ProductsListSkeleton() {
  return (
    <div className="space-y-1" data-testid="products-list-skeleton">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-[42px] w-full rounded-[7px]" />
      ))}
      <Skeleton className="mt-2 h-[24px] w-[140px] rounded-sm" />
    </div>
  );
}
