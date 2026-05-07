'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { AlertTriangle, Eye, EyeOff, Flame, Loader2, Tag } from 'lucide-react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/toast';
import { useUpdateMenu } from '@/hooks/use-menus';
import { cn } from '@/lib/utils';
import type {
  AllergenDisplay,
  CaloriesDisplay,
  Menu,
  MenuWithDetails,
} from '@/types/menu';

const DEFAULT_ALLERGEN: AllergenDisplay = 'TEXT';
const DEFAULT_CALORIES: CaloriesDisplay = 'DIRECT';
const DEFAULT_SHOW_NUTRITION = false;
const DEFAULT_SHOW_DISCOUNT = true;

interface ContentDisplayCardProps {
  menu: Menu | MenuWithDetails;
}

export function ContentDisplayCard({ menu }: ContentDisplayCardProps) {
  const t = useTranslations('admin.editor.content.display');
  const updateMenu = useUpdateMenu(menu.id);

  const [allergenDisplay, setAllergenDisplay] = useState<AllergenDisplay>(
    menu.allergenDisplay ?? DEFAULT_ALLERGEN,
  );
  const [caloriesDisplay, setCaloriesDisplay] = useState<CaloriesDisplay>(
    menu.caloriesDisplay ?? DEFAULT_CALORIES,
  );
  const [showNutrition, setShowNutrition] = useState<boolean>(
    menu.showNutrition ?? DEFAULT_SHOW_NUTRITION,
  );
  const [showDiscount, setShowDiscount] = useState<boolean>(
    menu.showDiscount ?? DEFAULT_SHOW_DISCOUNT,
  );

  const prevMenuIdRef = useRef(menu.id);
  useEffect(() => {
    if (prevMenuIdRef.current !== menu.id) {
      prevMenuIdRef.current = menu.id;
      setAllergenDisplay(menu.allergenDisplay ?? DEFAULT_ALLERGEN);
      setCaloriesDisplay(menu.caloriesDisplay ?? DEFAULT_CALORIES);
      setShowNutrition(menu.showNutrition ?? DEFAULT_SHOW_NUTRITION);
      setShowDiscount(menu.showDiscount ?? DEFAULT_SHOW_DISCOUNT);
    }
  }, [
    menu.id,
    menu.allergenDisplay,
    menu.caloriesDisplay,
    menu.showNutrition,
    menu.showDiscount,
  ]);

  const save = async (patch: Parameters<typeof updateMenu.mutateAsync>[0]) => {
    try {
      await updateMenu.mutateAsync(patch);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('saveError'));
    }
  };

  const handleAllergenChange = (next: string) => {
    const value = next as AllergenDisplay;
    setAllergenDisplay(value);
    void save({ allergenDisplay: value });
  };

  const handleCaloriesChange = (next: string) => {
    const value = next as CaloriesDisplay;
    setCaloriesDisplay(value);
    void save({ caloriesDisplay: value });
  };

  const handleShowNutritionChange = (next: boolean) => {
    setShowNutrition(next);
    void save({ showNutrition: next });
  };

  const handleShowDiscountChange = (next: boolean) => {
    setShowDiscount(next);
    void save({ showDiscount: next });
  };

  return (
    <section
      data-testid="content-display-card"
      className="relative mb-3.5 rounded-card border border-border bg-card p-[18px]"
    >
      <div className="flex flex-col gap-[18px]">
        <div>
          <div className="text-[13px] font-semibold text-text-default">
            {t('title')}
          </div>
          <p className="mt-1 text-[11.5px] text-text-muted">
            {t('description')}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
          {/* Allergen display */}
          <DisplaySection label={t('allergenDisplay.label')}>
            <Select
              value={allergenDisplay}
              onValueChange={handleAllergenChange}
            >
              <SelectTrigger
                data-testid="content-allergen-display-select"
                className="rounded-[8px] border border-border bg-white px-3 py-[9px] text-[13px]"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TEXT">
                  <IconOption icon={Tag}>
                    {t('allergenDisplay.text')}
                  </IconOption>
                </SelectItem>
                <SelectItem value="ICON">
                  <IconOption icon={AlertTriangle}>
                    {t('allergenDisplay.icon')}
                  </IconOption>
                </SelectItem>
                <SelectItem value="WARNING">
                  <IconOption icon={AlertTriangle}>
                    {t('allergenDisplay.warning')}
                  </IconOption>
                </SelectItem>
              </SelectContent>
            </Select>
          </DisplaySection>

          {/* Calories display */}
          <DisplaySection label={t('caloriesDisplay.label')}>
            <Select
              value={caloriesDisplay}
              onValueChange={handleCaloriesChange}
            >
              <SelectTrigger
                data-testid="content-calories-display-select"
                className="rounded-[8px] border border-border bg-white px-3 py-[9px] text-[13px]"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DIRECT">
                  <IconOption icon={Flame}>
                    {t('caloriesDisplay.direct')}
                  </IconOption>
                </SelectItem>
                <SelectItem value="FLIP_REVEAL">
                  <IconOption icon={Eye}>
                    {t('caloriesDisplay.flipReveal')}
                  </IconOption>
                </SelectItem>
                <SelectItem value="HIDDEN">
                  <IconOption icon={EyeOff}>
                    {t('caloriesDisplay.hidden')}
                  </IconOption>
                </SelectItem>
              </SelectContent>
            </Select>
          </DisplaySection>

          {/* Nutrition switch */}
          <SwitchRow
            testId="content-show-nutrition-switch"
            label={t('showNutrition.label')}
            description={t('showNutrition.description')}
            checked={showNutrition}
            onCheckedChange={handleShowNutritionChange}
          />

          {/* Discount switch */}
          <SwitchRow
            testId="content-show-discount-switch"
            label={t('showDiscount.label')}
            description={t('showDiscount.description')}
            checked={showDiscount}
            onCheckedChange={handleShowDiscountChange}
          />
        </div>
      </div>

      {updateMenu.isPending && (
        <div
          role="status"
          aria-live="polite"
          data-testid="content-display-saving"
          className={cn(
            'pointer-events-none absolute right-3 top-3 flex items-center gap-[6px]',
            'rounded-[7px] bg-card px-[10px] py-[6px] text-[11.5px] text-text-muted shadow-xs ring-1 ring-border',
          )}
        >
          <Loader2 size={12} className="animate-spin" />
          {t('saving')}
        </div>
      )}
    </section>
  );
}

function DisplaySection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 text-[11.5px] font-semibold uppercase tracking-[0.4px] text-text-default">
        {label}
      </div>
      {children}
    </div>
  );
}

function SwitchRow({
  testId,
  label,
  description,
  checked,
  onCheckedChange,
}: {
  testId: string;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[8px] border border-border bg-card-soft px-3 py-[10px]">
      <div className="min-w-0">
        <div className="text-[12px] font-semibold text-text-default">
          {label}
        </div>
        <div className="text-[10.5px] text-text-muted">{description}</div>
      </div>
      <Switch
        data-testid={testId}
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-label={label}
      />
    </div>
  );
}

function IconOption({
  icon: Icon,
  children,
}: {
  icon: typeof Tag;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <Icon size={13} strokeWidth={1.5} className="text-text-muted" />
      <span>{children}</span>
    </span>
  );
}
