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
  GripVertical,
  Pencil,
  Plus,
  Trash2,
  Package,
  EyeOff,
  ImageIcon,
  Lock,
} from 'lucide-react';
import { toast } from 'sonner';
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
import { ProductDialog } from './product-dialog';
import { UpgradePrompt } from './upgrade-prompt';
import { type ProductFormValues } from './product-form';
import {
  useProductsByCategory,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useReorderProducts,
} from '@/hooks/use-products';
import { useUserPlan } from '@/hooks/use-user-plan';
import type { Product, Category } from '@/types/menu';

interface ProductsListProps {
  menuId: string;
  categoryId: string;
  categories: Category[];
  showAllergens?: boolean;
  totalMenuProducts?: number;
}

export function ProductsList({
  menuId,
  categoryId,
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
  const reorderProducts = useReorderProducts(menuId, categoryId);

  const { plan, canCreate } = useUserPlan();
  const canAddProduct = canCreate('product', totalMenuProducts);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && products) {
      const oldIndex = products.findIndex((p) => p.id === active.id);
      const newIndex = products.findIndex((p) => p.id === over.id);

      const reorderedProducts = arrayMove(products, oldIndex, newIndex);
      const reorderData = {
        products: reorderedProducts.map((p, index) => ({
          id: p.id,
          sortOrder: index,
        })),
      };

      reorderProducts.mutate(reorderData);
    }
  };

  const handleCreate = async (data: ProductFormValues) => {
    const productData = {
      categoryId: data.categoryId,
      nameKa: data.nameKa,
      nameEn: data.nameEn || null,
      nameRu: data.nameRu || null,
      descriptionKa: data.descriptionKa || null,
      descriptionEn: data.descriptionEn || null,
      descriptionRu: data.descriptionRu || null,
      price: parseFloat(data.price),
      currency: 'GEL',
      imageUrl: data.imageUrl || null,
      allergens: (data.allergens || []) as ('GLUTEN' | 'DAIRY' | 'EGGS' | 'NUTS' | 'SEAFOOD' | 'SOY' | 'PORK')[],
      isAvailable: data.isAvailable,
    };
    try {
      await createProduct.mutateAsync(productData);
      setIsCreateOpen(false);
      toast.success(t('toast.created'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('toast.createError'));
    }
  };

  const handleUpdate = async (data: ProductFormValues) => {
    if (!productToEdit) return;
    const productData = {
      categoryId: data.categoryId,
      nameKa: data.nameKa,
      nameEn: data.nameEn || null,
      nameRu: data.nameRu || null,
      descriptionKa: data.descriptionKa || null,
      descriptionEn: data.descriptionEn || null,
      descriptionRu: data.descriptionRu || null,
      price: parseFloat(data.price),
      imageUrl: data.imageUrl || null,
      allergens: (data.allergens || []) as ('GLUTEN' | 'DAIRY' | 'EGGS' | 'NUTS' | 'SEAFOOD' | 'SOY' | 'PORK')[],
      isAvailable: data.isAvailable,
    };
    try {
      await updateProduct.mutateAsync(productData);
      setProductToEdit(null);
      toast.success(t('toast.updated'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('toast.updateError'));
    }
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    try {
      await deleteProduct.mutateAsync(productToDelete.id);
      setProductToDelete(null);
      toast.success(t('toast.deleted'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('toast.deleteError'));
    }
  };

  if (isLoading) {
    return <ProductsListSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center">
        <p className="text-sm text-destructive">Failed to load products: {error.message}</p>
      </div>
    );
  }

  const handleAddProduct = () => {
    if (!canAddProduct) {
      setShowUpgradePrompt(true);
      return;
    }
    setIsCreateOpen(true);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {products?.length || 0} {t('title').toLowerCase()}
        </span>
        <Button
          onClick={handleAddProduct}
          size="sm"
          variant={canAddProduct ? 'outline' : 'secondary'}
          className="focus-ring"
        >
          {canAddProduct ? (
            <Plus className="mr-1 h-3 w-3" aria-hidden="true" />
          ) : (
            <Lock className="mr-1 h-3 w-3" aria-hidden="true" />
          )}
          {t('add')}
        </Button>
      </div>

      {!products || products.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center" role="region" aria-label={t('empty.title')}>
          <Package className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
          <p className="mt-2 text-sm text-muted-foreground">
            {t('empty.description')}
          </p>
          <Button
            onClick={handleAddProduct}
            className="mt-3 focus-ring"
            size="sm"
            variant="outline"
          >
            <Plus className="mr-1 h-3 w-3" aria-hidden="true" />
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
            items={products.map((p) => p.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2" role="list" aria-label={t('title')}>
              {products.map((product) => (
                <SortableProductItem
                  key={product.id}
                  product={product}
                  onEdit={() => setProductToEdit(product)}
                  onDelete={() => setProductToDelete(product)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Create Product Dialog */}
      <ProductDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        categories={categories}
        defaultCategoryId={categoryId}
        onSubmit={handleCreate}
        isLoading={createProduct.isPending}
        showAllergens={showAllergens}
      />

      {/* Edit Product Dialog */}
      <ProductDialog
        open={!!productToEdit}
        onOpenChange={(open) => !open && setProductToEdit(null)}
        product={productToEdit || undefined}
        categories={categories}
        onSubmit={handleUpdate}
        isLoading={updateProduct.isPending}
        showAllergens={showAllergens}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!productToDelete}
        onOpenChange={(open) => !open && setProductToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('delete.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('delete.message')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteProduct.isPending}>
              {tActions('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteProduct.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteProduct.isPending ? tActions('deleting') : tActions('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Upgrade Prompt */}
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
  onEdit: () => void;
  onDelete: () => void;
}

function SortableProductItem({ product, onEdit, onDelete }: SortableProductItemProps) {
  const tStatus = useTranslations('status');
  const tVariations = useTranslations('admin.products.variations');
  const tA11y = useTranslations('common.accessibility');
  const tActions = useTranslations('actions');

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ka-GE', {
      style: 'currency',
      currency: 'GEL',
      minimumFractionDigits: 2,
    }).format(price);
  };

  const variationCount = product.variations?.length || 0;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`${isDragging ? 'opacity-50 shadow-lg' : ''}`}
    >
      <CardContent className="flex items-center gap-3 p-2">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none rounded p-1 hover:bg-muted active:cursor-grabbing focus-ring"
          aria-label={tA11y('dragHandle')}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        </button>

        {/* Product Image */}
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.nameKa}
              width={48}
              height={48}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm truncate">{product.nameKa}</p>
            {!product.isAvailable && (
              <Badge variant="secondary" className="text-xs">
                <EyeOff className="mr-1 h-3 w-3" aria-hidden="true" />
                {tStatus('hidden')}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-sm font-semibold text-primary">
              {formatPrice(product.price)}
            </span>
            {variationCount > 0 && (
              <span className="text-xs text-muted-foreground">
                +{variationCount} {tVariations('title').toLowerCase()}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 focus-ring"
            onClick={onEdit}
            aria-label={`${tActions('edit')} ${product.nameKa}`}
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive focus-ring"
            onClick={onDelete}
            aria-label={`${tActions('delete')} ${product.nameKa}`}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ProductsListSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-28" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center gap-3 p-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-12 w-12 rounded-md" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-16" />
              </div>
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
