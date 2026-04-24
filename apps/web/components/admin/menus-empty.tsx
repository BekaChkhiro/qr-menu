'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { ArrowRight, Plus, UtensilsCrossed } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { api, type ApiError } from '@/lib/api/client';
import { queryKeys } from '@/lib/query/query-keys';
import {
  listStarterTemplates,
  countTemplateItems,
  type MenuStarterTemplate,
} from '@/lib/menu-templates';
import type { MenuStarterTemplateKey } from '@/lib/validations/menu';
import type { Menu } from '@/types/menu';
import { cn } from '@/lib/utils';

// Gradient palette shared with `MenuCard` / `MenuThumb` so the template covers
// match the eventual menu card tone.
const TEMPLATE_TONE_COLORS: Record<
  MenuStarterTemplate['tone'],
  readonly [string, string]
> = {
  a: ['#C9B28A', '#8B6F47'],
  b: ['#B8633D', '#7A3F27'],
  c: ['#6B7F6B', '#3F5B3F'],
};

export function MenusEmpty() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations('admin.menus.empty');
  const [pendingTemplate, setPendingTemplate] =
    useState<MenuStarterTemplateKey | null>(null);

  const createFromTemplate = useMutation<
    Menu,
    ApiError,
    MenuStarterTemplateKey
  >({
    mutationFn: (template) =>
      api.post<Menu>('/menus', { template }),
    onSuccess: (menu) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.menus.all });
      router.push(`/admin/menus/${menu.id}`);
    },
    onSettled: () => setPendingTemplate(null),
  });

  const templates = listStarterTemplates();

  return (
    <div
      data-testid="menus-empty"
      className="mx-auto flex max-w-[1040px] flex-col items-center pt-6"
    >
      <EmptyIllustration />

      <h1 className="mt-6 text-center text-[26px] font-semibold tracking-[-0.02em] text-text-default">
        {t('title')}
      </h1>
      <p className="mx-auto mt-2 max-w-[500px] text-center text-[14px] leading-[1.55] text-text-muted">
        {t('description')}
      </p>

      <div
        data-testid="menus-empty-templates"
        className="mt-7 grid w-full grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3"
      >
        {templates.map((tpl) => {
          const isPending = pendingTemplate === tpl.id;
          const labelKey =
            tpl.id === 'cafe-bakery'
              ? 'cafeBakery'
              : tpl.id === 'full-restaurant'
                ? 'fullRestaurant'
                : 'barCocktails';
          return (
            <button
              key={tpl.id}
              type="button"
              data-testid={`menus-empty-template-${tpl.id}`}
              disabled={createFromTemplate.isPending}
              onClick={() => {
                if (createFromTemplate.isPending) return;
                setPendingTemplate(tpl.id);
                createFromTemplate.mutate(tpl.id);
              }}
              className={cn(
                'group flex flex-col overflow-hidden rounded-[12px] border border-border bg-card text-left',
                'transition-all duration-150',
                'hover:-translate-y-[1px] hover:border-accent hover:shadow-sm',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
                'disabled:cursor-not-allowed disabled:opacity-60',
              )}
            >
              <TemplateCover tone={tpl.tone} pending={isPending} />
              <div className="flex flex-col px-3.5 py-3">
                <div className="text-[13.5px] font-semibold text-text-default">
                  {t(`templates.${labelKey}.name`)}
                </div>
                <div className="mt-0.5 text-[11.5px] leading-[1.4] text-text-muted">
                  {t(`templates.${labelKey}.description`)}
                </div>
                <div className="mt-2.5 flex items-center justify-between text-[11px]">
                  <span className="text-text-subtle tabular-nums">
                    {t('itemsCount', {
                      count: countTemplateItems(tpl),
                    })}
                  </span>
                  <span className="flex items-center gap-1 font-medium text-accent">
                    {t('useTemplate')}
                    <ArrowRight
                      size={10}
                      strokeWidth={2}
                      aria-hidden="true"
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-5">
        <Button asChild>
          <Link href="/admin/menus/new" data-testid="menus-empty-from-scratch">
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            {t('fromScratch')}
          </Link>
        </Button>
      </div>
    </div>
  );
}

function EmptyIllustration() {
  return (
    <div
      aria-hidden="true"
      className="relative h-[92px] w-[130px]"
      data-testid="menus-empty-illustration"
    >
      {/* back-left tilted card */}
      <span
        className="absolute left-1.5 top-3 h-[72px] w-20 rounded-[9px] border border-border"
        style={{ background: '#F7EDE6', transform: 'rotate(-7deg)' }}
      />
      {/* back-right tilted card */}
      <span
        className="absolute right-1.5 top-2 h-[72px] w-20 rounded-[9px] border border-border"
        style={{ background: '#E8F0E8', transform: 'rotate(6deg)' }}
      />
      {/* front centre card */}
      <span
        className="absolute left-1/2 top-0 flex h-20 w-[84px] -translate-x-1/2 items-center justify-center rounded-[10px] border border-border bg-card"
        style={{ boxShadow: '0 6px 18px rgba(0,0,0,0.05)' }}
      >
        <UtensilsCrossed
          size={26}
          strokeWidth={1.5}
          className="text-accent"
        />
      </span>
    </div>
  );
}

function TemplateCover({
  tone,
  pending,
}: {
  tone: MenuStarterTemplate['tone'];
  pending: boolean;
}) {
  const [c1, c2] = TEMPLATE_TONE_COLORS[tone];
  return (
    <div
      className="relative h-[110px] w-full overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          backgroundImage:
            'repeating-linear-gradient(-45deg, rgba(255,255,255,0.04) 0 12px, transparent 12px 24px)',
        }}
      />
      <UtensilsCrossed
        aria-hidden="true"
        size={38}
        strokeWidth={1.5}
        className="absolute inset-0 m-auto text-white/75"
      />
      {pending && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/25 backdrop-blur-[1px]">
          <Spinner size="sm" tone="white" />
        </div>
      )}
    </div>
  );
}
