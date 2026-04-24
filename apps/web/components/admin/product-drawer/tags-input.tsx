'use client';

import { X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Ribbon } from '@/types/menu';

type TagTone = 'green' | 'terracotta' | 'red' | 'neutral';

interface TagDef {
  id:
    | 'vegetarian'
    | 'vegan'
    | 'popular'
    | 'chefChoice'
    | 'dailyDish'
    | 'spicy'
    | 'new';
  tone: TagTone;
  // maps to the corresponding form field or ribbon value
  type: 'boolean' | 'ribbon';
  boolField?: 'isVegan' | 'isVegetarian';
  ribbonValue?: Ribbon;
}

type TagId =
  | 'vegetarian'
  | 'vegan'
  | 'popular'
  | 'chefChoice'
  | 'dailyDish'
  | 'spicy'
  | 'new';

const TAG_DEFINITIONS: TagDef[] = [
  { id: 'vegetarian', tone: 'green',      type: 'boolean', boolField: 'isVegetarian' },
  { id: 'vegan',      tone: 'green',      type: 'boolean', boolField: 'isVegan' },
  { id: 'popular',    tone: 'terracotta', type: 'ribbon',  ribbonValue: 'POPULAR' },
  { id: 'chefChoice', tone: 'terracotta', type: 'ribbon',  ribbonValue: 'CHEF_CHOICE' },
  { id: 'dailyDish',  tone: 'terracotta', type: 'ribbon',  ribbonValue: 'DAILY_DISH' },
  { id: 'spicy',      tone: 'red',        type: 'ribbon',  ribbonValue: 'SPICY' },
  { id: 'new',        tone: 'neutral',    type: 'ribbon',  ribbonValue: 'NEW' },
];

const DEFAULT_LABELS: Record<TagId, string> = {
  vegetarian: 'Vegetarian',
  vegan: 'Vegan',
  popular: 'Popular',
  chefChoice: "Chef's pick",
  dailyDish: 'Daily dish',
  spicy: 'Spicy',
  new: 'New',
};

const TONE_CLASSES: Record<TagTone, string> = {
  green:      'bg-success-soft text-success',
  terracotta: 'bg-accent-soft text-accent',
  red:        'bg-danger-soft text-danger',
  neutral:    'bg-chip text-text-muted',
};

interface TagsInputProps {
  ribbons: Ribbon[];
  isVegan: boolean;
  isVegetarian: boolean;
  onRibbonsChange: (ribbons: Ribbon[]) => void;
  onIsVeganChange: (value: boolean) => void;
  onIsVegetarianChange: (value: boolean) => void;
  tagsLabel?: string;
  suggestedLabel?: string;
  placeholder?: string;
  /** Per-tag localized labels; falls back to English defaults when a key is missing. */
  tagLabels?: Partial<Record<TagId, string>>;
}

function isTagActive(tag: TagDef, ribbons: Ribbon[], isVegan: boolean, isVegetarian: boolean): boolean {
  if (tag.type === 'boolean') {
    return tag.boolField === 'isVegan' ? isVegan : isVegetarian;
  }
  return ribbons.includes(tag.ribbonValue!);
}

function activateTag(
  tag: TagDef,
  ribbons: Ribbon[],
  onRibbonsChange: (r: Ribbon[]) => void,
  onIsVeganChange: (v: boolean) => void,
  onIsVegetarianChange: (v: boolean) => void,
) {
  if (tag.type === 'ribbon') {
    if (!ribbons.includes(tag.ribbonValue!)) {
      onRibbonsChange([...ribbons, tag.ribbonValue!]);
    }
  } else if (tag.boolField === 'isVegan') {
    onIsVeganChange(true);
  } else {
    onIsVegetarianChange(true);
  }
}

function deactivateTag(
  tag: TagDef,
  ribbons: Ribbon[],
  onRibbonsChange: (r: Ribbon[]) => void,
  onIsVeganChange: (v: boolean) => void,
  onIsVegetarianChange: (v: boolean) => void,
) {
  if (tag.type === 'ribbon') {
    onRibbonsChange(ribbons.filter((r) => r !== tag.ribbonValue));
  } else if (tag.boolField === 'isVegan') {
    onIsVeganChange(false);
  } else {
    onIsVegetarianChange(false);
  }
}

export function TagsInput({
  ribbons,
  isVegan,
  isVegetarian,
  onRibbonsChange,
  onIsVeganChange,
  onIsVegetarianChange,
  tagsLabel = 'Tags',
  suggestedLabel = 'Suggested:',
  placeholder = 'Add tag…',
  tagLabels,
}: TagsInputProps) {
  const labelFor = (id: TagId) => tagLabels?.[id] ?? DEFAULT_LABELS[id];

  const activeTags = TAG_DEFINITIONS.filter((tag) =>
    isTagActive(tag, ribbons, isVegan, isVegetarian),
  );
  const suggestedTags = TAG_DEFINITIONS.filter(
    (tag) => !isTagActive(tag, ribbons, isVegan, isVegetarian),
  );

  return (
    <div className="mb-[22px]">
      {/* Field label */}
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-[12px] font-semibold uppercase tracking-[0.1px] text-text-default">
          {tagsLabel}
        </span>
      </div>

      {/* Active chips box */}
      <div
        className="flex min-h-[42px] flex-wrap items-center gap-1.5 rounded-md border border-border bg-card p-2"
        data-testid="product-basics-tags-box"
      >
        {activeTags.length === 0 ? (
          <span className="text-[12.5px] text-text-subtle">{placeholder}</span>
        ) : (
          activeTags.map((tag) => (
            <span
              key={tag.id}
              data-testid={`product-basics-tag-${tag.id}`}
              className={cn(
                'inline-flex items-center gap-1 rounded-xs px-1.5 py-0.5 text-[11.5px] font-medium',
                TONE_CLASSES[tag.tone],
              )}
            >
              {labelFor(tag.id)}
              <button
                type="button"
                aria-label={`Remove ${labelFor(tag.id)}`}
                onClick={() =>
                  deactivateTag(
                    tag,
                    ribbons,
                    onRibbonsChange,
                    onIsVeganChange,
                    onIsVegetarianChange,
                  )
                }
                className="inline-flex items-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-current"
              >
                <X className="h-[10px] w-[10px] opacity-70" strokeWidth={2} aria-hidden="true" />
              </button>
            </span>
          ))
        )}
      </div>

      {/* Suggested chips */}
      {suggestedTags.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="mr-0.5 self-center text-[11px] text-text-subtle">
            {suggestedLabel}
          </span>
          {suggestedTags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              data-testid={`product-basics-tag-suggest-${tag.id}`}
              onClick={() =>
                activateTag(
                  tag,
                  ribbons,
                  onRibbonsChange,
                  onIsVeganChange,
                  onIsVegetarianChange,
                )
              }
              className="inline-flex cursor-pointer items-center gap-[3px] rounded-xs border border-dashed border-border bg-card px-[9px] py-[3px] text-[11.5px] font-medium text-text-muted hover:border-text-subtle hover:text-text-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
            >
              <Plus className="h-[9px] w-[9px]" strokeWidth={2} aria-hidden="true" />
              {labelFor(tag.id)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
