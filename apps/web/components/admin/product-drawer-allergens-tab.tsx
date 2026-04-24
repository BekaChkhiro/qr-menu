'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  Bean,
  Egg,
  Fish,
  Ham,
  Leaf,
  Milk,
  Nut,
  Wheat,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { useUpdateProduct } from '@/hooks/use-products';
import { cn } from '@/lib/utils';
import type { Allergen, Product } from '@/types/menu';

interface ProductDrawerAllergensTabProps {
  menuId: string;
  product: Product;
}

// The 8 allergens shown in the 2-col tile grid (T14.4 scope).
// Order matches the design bundle: product-drawer.jsx lines 471–481.
const ALLERGEN_TILES: Array<{ key: Allergen; icon: LucideIcon; labelKey: string }> = [
  { key: 'GLUTEN', icon: Wheat, labelKey: 'tiles.gluten' },
  { key: 'DAIRY', icon: Milk, labelKey: 'tiles.dairy' },
  { key: 'EGGS', icon: Egg, labelKey: 'tiles.eggs' },
  { key: 'NUTS', icon: Nut, labelKey: 'tiles.nuts' },
  { key: 'SEAFOOD', icon: Fish, labelKey: 'tiles.seafood' },
  { key: 'SOY', icon: Bean, labelKey: 'tiles.soy' },
  { key: 'PORK', icon: Ham, labelKey: 'tiles.pork' },
  { key: 'SESAME', icon: Leaf, labelKey: 'tiles.sesame' },
];

type DietaryKey = 'vegan' | 'vegetarian' | 'halal' | 'kosher' | 'glutenFree';

export function ProductDrawerAllergensTab({
  menuId,
  product,
}: ProductDrawerAllergensTabProps) {
  const t = useTranslations('admin.products.drawer.allergensTab');
  const updateProduct = useUpdateProduct(menuId, product.id);

  const allergensSet = useMemo(
    () => new Set<Allergen>(product.allergens),
    [product.allergens],
  );

  const hasGluten = allergensSet.has('GLUTEN');

  // Auto-suggest: when no gluten allergen, Gluten-free is visually pre-checked
  // so the user doesn't have to tick it manually. The stored field wins when
  // it is true; otherwise we derive from the allergen list.
  const glutenFreeSuggested = !hasGluten && !product.isGlutenFree;
  const glutenFreeChecked = product.isGlutenFree || glutenFreeSuggested;

  const handleToggleAllergen = async (allergen: Allergen, on: boolean) => {
    const next = new Set(allergensSet);
    if (on) next.add(allergen);
    else next.delete(allergen);
    const nextArray = ALLERGEN_TILES
      .map((tile) => tile.key)
      .filter((k) => next.has(k));
    // Preserve any allergens not represented in the 8-tile grid (e.g. PEANUTS,
    // FISH, SHELLFISH, MUSTARD, CELERY, LUPIN, SULPHITES added via API).
    const extras = product.allergens.filter(
      (k) => !ALLERGEN_TILES.some((tile) => tile.key === k),
    );
    try {
      await updateProduct.mutateAsync({
        allergens: [...nextArray, ...extras],
      });
    } catch {
      toast.error(t('toast.saveError'));
    }
  };

  const handleToggleDietary = async (key: DietaryKey, on: boolean) => {
    const patch: Record<string, boolean> = {};
    if (key === 'vegan') patch.isVegan = on;
    else if (key === 'vegetarian') patch.isVegetarian = on;
    else if (key === 'halal') patch.isHalal = on;
    else if (key === 'kosher') patch.isKosher = on;
    else if (key === 'glutenFree') patch.isGlutenFree = on;
    try {
      await updateProduct.mutateAsync(patch);
    } catch {
      toast.error(t('toast.saveError'));
    }
  };

  return (
    <div data-testid="product-drawer-allergens">
      {/* Allergen tiles (2-col grid) ──────────────────────────────────────── */}
      <div className="mb-[22px]">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-[12px] font-semibold uppercase tracking-[0.1px] text-text-default">
            {t('tilesLabel')}
          </span>
          <span className="text-[11px] text-text-subtle">{t('tilesHint')}</span>
        </div>

        <div
          className="grid grid-cols-2 gap-2"
          role="group"
          aria-label={t('tilesLabel')}
          data-testid="product-drawer-allergens-tiles"
        >
          {ALLERGEN_TILES.map(({ key, icon: Icon, labelKey }) => {
            const active = allergensSet.has(key);
            return (
              <AllergenTile
                key={key}
                allergen={key}
                name={t(labelKey)}
                active={active}
                disabled={updateProduct.isPending}
                onToggle={(v) => handleToggleAllergen(key, v)}
                Icon={Icon}
              />
            );
          })}
        </div>
      </div>

      {/* Dietary badges row ───────────────────────────────────────────────── */}
      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-[12px] font-semibold uppercase tracking-[0.1px] text-text-default">
            {t('dietary.label')}
          </span>
        </div>

        <div
          className="flex flex-wrap gap-x-[18px] gap-y-2 rounded-[10px] border border-border-soft bg-[#FCFBF8] p-3.5"
          data-testid="product-drawer-allergens-dietary"
        >
          <DietaryCheckbox
            dietary="vegan"
            name={t('dietary.vegan')}
            checked={product.isVegan}
            disabled={updateProduct.isPending}
            onChange={(v) => handleToggleDietary('vegan', v)}
          />
          <DietaryCheckbox
            dietary="vegetarian"
            name={t('dietary.vegetarian')}
            checked={product.isVegetarian}
            disabled={updateProduct.isPending}
            onChange={(v) => handleToggleDietary('vegetarian', v)}
          />
          <DietaryCheckbox
            dietary="halal"
            name={t('dietary.halal')}
            checked={product.isHalal}
            disabled={updateProduct.isPending}
            onChange={(v) => handleToggleDietary('halal', v)}
          />
          <DietaryCheckbox
            dietary="kosher"
            name={t('dietary.kosher')}
            checked={product.isKosher}
            disabled={updateProduct.isPending}
            onChange={(v) => handleToggleDietary('kosher', v)}
          />
          <DietaryCheckbox
            dietary="glutenFree"
            name={t('dietary.glutenFree')}
            checked={glutenFreeChecked}
            suggested={glutenFreeSuggested}
            disabled={updateProduct.isPending}
            onChange={(v) => handleToggleDietary('glutenFree', v)}
          />
        </div>

        <p className="mt-2 text-[11.5px] text-text-subtle">{t('dietary.helper')}</p>
      </div>
    </div>
  );
}

// ── Allergen Tile ────────────────────────────────────────────────────────────

interface AllergenTileProps {
  allergen: Allergen;
  name: string;
  active: boolean;
  disabled: boolean;
  onToggle: (on: boolean) => void;
  Icon: LucideIcon;
}

function AllergenTile({
  allergen,
  name,
  active,
  disabled,
  onToggle,
  Icon,
}: AllergenTileProps) {
  const handleClick = () => {
    if (!disabled) onToggle(!active);
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2.5 rounded-[10px] border px-3.5 py-3 transition-colors',
        active
          ? 'border-accent bg-accent-soft'
          : 'border-border bg-card hover:border-text-subtle',
        disabled && 'opacity-60',
      )}
      data-testid="product-drawer-allergens-tile"
      data-allergen={allergen}
      data-active={active ? 'true' : 'false'}
      onClick={handleClick}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div
        className={cn(
          'flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-[7px]',
          active ? 'bg-card text-accent' : 'bg-chip text-text-muted',
        )}
        aria-hidden="true"
      >
        <Icon className="h-[15px] w-[15px]" strokeWidth={1.8} />
      </div>
      <span
        className={cn(
          'flex-1 truncate text-[12.5px] font-semibold',
          active ? 'text-accent' : 'text-text-default',
        )}
      >
        {name}
      </span>
      <Switch
        checked={active}
        onCheckedChange={onToggle}
        disabled={disabled}
        // Keep space activation on the outer tile — Switch handles its own focus
        onClick={(e) => e.stopPropagation()}
        aria-label={name}
        data-testid="product-drawer-allergens-tile-toggle"
      />
    </div>
  );
}

// ── Dietary Checkbox ─────────────────────────────────────────────────────────

interface DietaryCheckboxProps {
  dietary: DietaryKey;
  name: string;
  checked: boolean;
  /** Visual hint that the checked state was auto-derived, not explicitly set. */
  suggested?: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
}

function DietaryCheckbox({
  dietary,
  name,
  checked,
  suggested = false,
  disabled,
  onChange,
}: DietaryCheckboxProps) {
  return (
    <label
      className={cn(
        'inline-flex cursor-pointer select-none items-center gap-2 text-[12.5px] text-text-default',
        disabled && 'cursor-not-allowed opacity-60',
      )}
      data-testid="product-drawer-allergens-dietary-label"
      data-dietary={dietary}
      data-checked={checked ? 'true' : 'false'}
      data-suggested={suggested ? 'true' : 'false'}
    >
      <Checkbox
        checked={checked}
        onCheckedChange={(v) => onChange(v === true)}
        disabled={disabled}
        data-testid="product-drawer-allergens-dietary-input"
        className={cn(suggested && 'border-accent/70 data-[state=checked]:bg-accent')}
      />
      <span>{name}</span>
    </label>
  );
}
