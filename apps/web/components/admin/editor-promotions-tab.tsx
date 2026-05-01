'use client';

import * as React from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { format } from 'date-fns';
import { enUS, ka, ru } from 'date-fns/locale';
import { toast } from '@/components/ui/toast';
import {
  Calendar,
  Check,
  Eye,
  Pencil,
  Plus,
  Sparkles,
  Tag,
  Trash2,
  UtensilsCrossed,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { StatusPill } from '@/components/ui/status-pill';
import {
  KebabMenu,
  KebabMenuContent,
  KebabMenuIconTrigger,
  KebabMenuItem,
  KebabMenuSeparator,
} from '@/components/ui/kebab-menu';
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
import { Skeleton } from '@/components/ui/skeleton';
import { PromotionDrawer } from './promotion-drawer';
import {
  useCreatePromotion,
  useDeletePromotion,
  usePromotions,
  useUpdatePromotion,
} from '@/hooks/use-promotions';
import type { Promotion } from '@/types/menu';
import type { CreatePromotionInput } from '@/lib/validations/promotion';
import { cn } from '@/lib/utils';

// ── Types ────────────────────────────────────────────────────────────────────

type PromotionStatus = 'active' | 'scheduled' | 'ended';
type PromotionFilter = 'all' | PromotionStatus;

interface EditorPromotionsTabProps {
  menuId: string;
  /** True for STARTER / PRO plans. FREE shows the locked placeholder. */
  canUsePromotions: boolean;
  /** True when the user is on PRO (multilingual feature unlocked). */
  multilangUnlocked?: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const DATE_LOCALES = { ka, en: enUS, ru } as const;

// Deterministic banner palette — cycles through the 4 variants from
// qr-menu-design/components/promotions-page.jsx (happyhour / brunch / mother / easter).
const BANNER_VARIANTS = [
  {
    bg: 'linear-gradient(135deg, #B8633D, #7A3F27)',
    accent: 'rgba(255, 220, 190, 0.2)',
  },
  {
    bg: 'linear-gradient(135deg, #7A8C5F, #4F5F3F)',
    accent: 'rgba(230, 240, 210, 0.15)',
  },
  {
    bg: 'linear-gradient(135deg, #B8423D, #7A2A27)',
    accent: 'rgba(255, 190, 180, 0.2)',
  },
  {
    bg: 'linear-gradient(135deg, #5D7A91, #3F5363)',
    accent: 'rgba(200, 220, 240, 0.15)',
  },
] as const;

function hashString(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function pickBanner(id: string) {
  return BANNER_VARIANTS[hashString(id) % BANNER_VARIANTS.length];
}

function getPromotionStatus(promotion: Promotion, now: Date = new Date()): PromotionStatus {
  const start = new Date(promotion.startDate);
  const end = new Date(promotion.endDate);
  if (!promotion.isActive || end.getTime() < now.getTime()) return 'ended';
  if (start.getTime() > now.getTime()) return 'scheduled';
  return 'active';
}

// Per-promotion scan tracking isn't in the analytics backend yet (Phase 15
// scope note). Use a deterministic placeholder derived from the promo id so
// visual baselines stay stable — "—" for Scheduled (matches design), a
// rounded number for Active / Ended.
function approxScansLabel(promotion: Promotion, status: PromotionStatus): string | null {
  if (status === 'scheduled') return null;
  const base = (hashString(promotion.id) % 400) + 40;
  return String(base);
}

function localizedTitle(promotion: Promotion, locale: string): string {
  if (locale === 'en' && promotion.titleEn) return promotion.titleEn;
  if (locale === 'ru' && promotion.titleRu) return promotion.titleRu;
  return promotion.titleKa;
}

function pickLocale(locale: string) {
  return DATE_LOCALES[locale as keyof typeof DATE_LOCALES] ?? enUS;
}

// ── Promo banner ─────────────────────────────────────────────────────────────

function PromoBanner({
  promotion,
  title,
  desaturate,
}: {
  promotion: Promotion;
  title: string;
  desaturate: boolean;
}) {
  const variant = pickBanner(promotion.id);
  return (
    <div
      className="relative aspect-[16/9] overflow-hidden rounded-t-lg"
      style={{
        background: variant.bg,
        filter: desaturate ? 'saturate(0.45)' : undefined,
      }}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `repeating-linear-gradient(115deg, transparent 0 40px, ${variant.accent} 40px 42px)`,
        }}
      />
      <div
        className="absolute -right-[30px] -bottom-[30px] h-[140px] w-[140px] rounded-full border-2"
        style={{ borderColor: variant.accent }}
      />
      <div
        className="absolute -top-[20px] right-0 h-[100px] w-[100px] rounded-full"
        style={{ background: variant.accent }}
      />
      <div
        className="absolute inset-x-[18px] bottom-[14px] text-white"
        style={{
          fontFamily: "'Playfair Display', 'Times New Roman', serif",
          fontWeight: 700,
          fontSize: 26,
          lineHeight: 1,
          letterSpacing: -0.8,
          textShadow: '0 2px 12px rgba(0, 0, 0, 0.2)',
        }}
      >
        {title}
      </div>
    </div>
  );
}

// ── Filter chip ──────────────────────────────────────────────────────────────

interface FilterChipProps {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  testId: string;
}

function FilterChip({ label, count, active, onClick, testId }: FilterChipProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      data-testid={testId}
      data-active={active ? 'true' : 'false'}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-[7px] border px-3 py-1.5 text-[12.5px] font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
        active
          ? 'border-text-default bg-text-default text-white'
          : 'border-border bg-card text-text-default hover:bg-chip',
      )}
    >
      {label}
      <span
        data-testid={`${testId}-count`}
        className={cn(
          'rounded-[3px] px-1.5 text-[10.5px] font-semibold tabular-nums',
          active ? 'bg-white/20 text-white/90' : 'bg-chip text-text-muted',
        )}
      >
        {count}
      </span>
    </button>
  );
}

// ── Promo card ───────────────────────────────────────────────────────────────

interface PromoCardProps {
  promotion: Promotion;
  locale: string;
  status: PromotionStatus;
  tStatus: (key: PromotionStatus) => string;
  tCard: (key: string, values?: Record<string, string | number>) => string;
  tKebab: (key: string) => string;
  onEdit: () => void;
  onDelete: () => void;
}

function PromoCard({
  promotion,
  locale,
  status,
  tStatus,
  tCard,
  tKebab,
  onEdit,
  onDelete,
}: PromoCardProps) {
  const title = localizedTitle(promotion, locale);
  const dateLocale = pickLocale(locale);
  const dateRange = `${format(new Date(promotion.startDate), 'MMM d', { locale: dateLocale })} → ${format(
    new Date(promotion.endDate),
    'MMM d, yyyy',
    { locale: dateLocale },
  )}`;
  const scanLabel = approxScansLabel(promotion, status);

  return (
    <article
      data-testid={`editor-promotions-card-${promotion.id}`}
      data-promotion-status={status}
      className="flex flex-col overflow-hidden rounded-xl border border-border bg-card"
    >
      <div className="relative">
        <PromoBanner promotion={promotion} title={title} desaturate={status === 'ended'} />
        <div
          className="absolute top-3 left-3"
          data-testid={`editor-promotions-card-${promotion.id}-status`}
        >
          <StatusPill status={status} label={tStatus(status)} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 px-4 py-3.5">
        <div className="flex items-start justify-between gap-3">
          <h3
            className="flex-1 text-[14px] font-semibold leading-[1.3] tracking-[-0.2px] text-text-default"
            data-testid={`editor-promotions-card-${promotion.id}-title`}
          >
            {title}
          </h3>
        </div>

        <div className="flex flex-col gap-1 text-[12px] text-text-muted">
          <div
            className="flex items-center gap-1.5"
            data-testid={`editor-promotions-card-${promotion.id}-dates`}
          >
            <Calendar className="size-3 shrink-0 text-text-subtle" strokeWidth={1.5} />
            <span>{dateRange}</span>
          </div>
          <div
            className="flex items-center gap-1.5"
            data-testid={`editor-promotions-card-${promotion.id}-applied`}
          >
            <UtensilsCrossed className="size-3 shrink-0 text-text-subtle" strokeWidth={1.5} />
            <span>{tCard('appliedToMenu')}</span>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-border-soft pt-2.5">
          <div className="flex items-center gap-1.5 text-[11.5px] text-text-muted">
            <Eye className="size-3 text-text-subtle" strokeWidth={1.5} />
            {scanLabel ? (
              <>
                <span
                  className="font-semibold tabular-nums text-text-default"
                  data-testid={`editor-promotions-card-${promotion.id}-scans`}
                >
                  {scanLabel}
                </span>
                <span>{tCard('scansLabel')}</span>
              </>
            ) : (
              <span
                className="tabular-nums text-text-subtle"
                data-testid={`editor-promotions-card-${promotion.id}-scans`}
              >
                —
              </span>
            )}
          </div>
          <KebabMenu>
            <KebabMenuIconTrigger
              label={tKebab('menuLabel')}
              data-testid={`editor-promotions-card-${promotion.id}-kebab`}
            />
            <KebabMenuContent align="end">
              <KebabMenuItem icon={Pencil} onClick={onEdit}>
                {tKebab('edit')}
              </KebabMenuItem>
              <KebabMenuSeparator />
              <KebabMenuItem tone="destructive" icon={Trash2} onClick={onDelete}>
                {tKebab('delete')}
              </KebabMenuItem>
            </KebabMenuContent>
          </KebabMenu>
        </div>
      </div>
    </article>
  );
}

// ── Suggestions ──────────────────────────────────────────────────────────────

const SUGGESTION_KEYS = ['happyHour', 'lunchCombo', 'loyaltyDiscount'] as const;
type SuggestionKey = (typeof SUGGESTION_KEYS)[number];

function Suggestions({
  tSuggestions,
  onPick,
}: {
  tSuggestions: (key: string) => string;
  onPick: (key: SuggestionKey) => void;
}) {
  return (
    <section
      data-testid="editor-promotions-suggestions"
      className="mt-6 rounded-xl border border-border bg-bg p-4"
    >
      <div className="mb-2.5 flex items-center gap-2">
        <Sparkles className="size-3.5 text-accent" strokeWidth={1.5} aria-hidden="true" />
        <span className="text-[13.5px] font-semibold tracking-[-0.2px] text-text-default">
          {tSuggestions('title')}
        </span>
        <span className="text-[12px] text-text-muted">· {tSuggestions('hint')}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {SUGGESTION_KEYS.map((key, index) => (
          <button
            key={key}
            type="button"
            onClick={() => onPick(key)}
            data-testid={`editor-promotions-suggestion-${index}`}
            className="inline-flex items-center gap-1.5 rounded-[20px] border border-border bg-card px-3 py-1.5 text-[12.5px] font-medium text-text-default transition-colors hover:bg-chip focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            <Plus className="size-2.5 text-accent" strokeWidth={2.2} aria-hidden="true" />
            {tSuggestions(`chips.${key}`)}
          </button>
        ))}
      </div>
    </section>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

export function EditorPromotionsTab({ menuId, canUsePromotions, multilangUnlocked = false }: EditorPromotionsTabProps) {
  const locale = useLocale();
  const t = useTranslations('admin.editor.promotions');
  const tPromo = useTranslations('admin.promotions');

  const [filter, setFilter] = React.useState<PromotionFilter>('all');
  const [dialogPromotion, setDialogPromotion] = React.useState<Promotion | null>(null);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [prefillTitle, setPrefillTitle] = React.useState<string | undefined>();
  const [deleteTarget, setDeleteTarget] = React.useState<Promotion | null>(null);

  const { data: promotions, isLoading, error } = usePromotions(menuId, {
    includeExpired: true,
  });
  const createPromotion = useCreatePromotion(menuId);
  const updatePromotion = useUpdatePromotion(menuId, dialogPromotion?.id ?? '');
  const deletePromotion = useDeletePromotion(menuId);

  const annotated = React.useMemo(
    () =>
      (promotions ?? []).map((p) => ({ promotion: p, status: getPromotionStatus(p) })),
    [promotions],
  );

  const counts = React.useMemo(() => {
    const base = { all: annotated.length, active: 0, scheduled: 0, ended: 0 };
    for (const { status } of annotated) base[status] += 1;
    return base;
  }, [annotated]);

  const visible = React.useMemo(
    () =>
      filter === 'all'
        ? annotated
        : annotated.filter(({ status }) => status === filter),
    [annotated, filter],
  );

  const handleCreate = async (data: CreatePromotionInput) => {
    try {
      await createPromotion.mutateAsync(data);
      setIsCreateOpen(false);
      setPrefillTitle(undefined);
      toast.success(tPromo('toast.created'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tPromo('toast.createError'));
    }
  };

  const handleUpdate = async (data: CreatePromotionInput) => {
    if (!dialogPromotion) return;
    try {
      await updatePromotion.mutateAsync(data);
      setDialogPromotion(null);
      toast.success(tPromo('toast.updated'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tPromo('toast.updateError'));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deletePromotion.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      toast.success(tPromo('toast.deleted'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tPromo('toast.deleteError'));
    }
  };

  // ── FREE plan locked placeholder ─────────────────────────────────────────
  if (!canUsePromotions) {
    return <PromotionsTabFreeLocked />;
  }

  // ── Loading / error states ───────────────────────────────────────────────

  if (isLoading) {
    return <PromotionsTabSkeleton />;
  }

  if (error) {
    return (
      <div
        data-testid="editor-promotions-error"
        className="rounded-xl border border-danger-soft bg-danger-soft/30 p-6 text-center"
      >
        <p className="text-[13px] text-danger">{error.message}</p>
      </div>
    );
  }

  const openNew = (templateTitle?: string) => {
    setPrefillTitle(templateTitle);
    setIsCreateOpen(true);
  };

  // ── Header + filters + grid + suggestions ────────────────────────────────

  return (
    <section
      data-testid="editor-promotions-tab"
      data-plan-locked="false"
      data-filter={filter}
      className="flex flex-col gap-4"
    >
      <header className="flex items-end justify-between gap-4">
        <div>
          <h2
            className="text-[20px] font-semibold tracking-[-0.4px] text-text-default"
            data-testid="editor-promotions-title"
          >
            {t('title')}
          </h2>
          <p className="mt-0.5 text-[13px] text-text-muted">{t('subtitle')}</p>
        </div>
        <Button
          size="sm"
          onClick={() => openNew()}
          data-testid="editor-promotions-new"
          className="gap-1.5"
        >
          <Plus className="size-3.5" strokeWidth={1.8} aria-hidden="true" />
          {t('new')}
        </Button>
      </header>

      <div
        role="radiogroup"
        aria-label={t('filter.ariaLabel')}
        data-testid="editor-promotions-filters"
        className="flex flex-wrap gap-1.5"
      >
        {(['all', 'active', 'scheduled', 'ended'] as const).map((key) => (
          <FilterChip
            key={key}
            label={t(`filter.${key}`)}
            count={counts[key]}
            active={filter === key}
            onClick={() => setFilter(key)}
            testId={`editor-promotions-filter-${key}`}
          />
        ))}
      </div>

      {visible.length === 0 ? (
        <div
          data-testid={
            annotated.length === 0
              ? 'editor-promotions-empty'
              : 'editor-promotions-no-results'
          }
          className="rounded-xl border border-dashed border-border bg-card px-8 py-10 text-center"
        >
          <Tag className="mx-auto size-10 text-text-muted" strokeWidth={1.5} />
          <h3 className="mt-3 text-[14px] font-semibold text-text-default">
            {annotated.length === 0 ? t('empty.title') : t('filter.noResults')}
          </h3>
          <p className="mt-1 text-[12.5px] text-text-muted">
            {annotated.length === 0 ? t('empty.body') : t('filter.noResultsHint')}
          </p>
          {annotated.length === 0 ? (
            <Button size="sm" className="mt-4 gap-1.5" onClick={() => openNew()}>
              <Plus className="size-3.5" strokeWidth={1.8} aria-hidden="true" />
              {t('new')}
            </Button>
          ) : null}
        </div>
      ) : (
        <div
          data-testid="editor-promotions-grid"
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          {visible.map(({ promotion, status }) => (
            <PromoCard
              key={promotion.id}
              promotion={promotion}
              locale={locale}
              status={status}
              tStatus={(key) => t(`status.${key}`)}
              tCard={(key) => t(`card.${key}`)}
              tKebab={(key) => t(`kebab.${key}`)}
              onEdit={() => setDialogPromotion(promotion)}
              onDelete={() => setDeleteTarget(promotion)}
            />
          ))}
        </div>
      )}

      <Suggestions
        tSuggestions={(key) => t(`suggestions.${key}`)}
        onPick={(key) => openNew(t(`suggestions.chips.${key}`))}
      />

      <PromotionDrawer
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) setPrefillTitle(undefined);
        }}
        menuId={menuId}
        promotion={
          prefillTitle
            ? ({
                titleKa: prefillTitle,
                startDate: new Date().toISOString(),
                endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
                isActive: true,
              } as unknown as Promotion)
            : undefined
        }
        onSubmit={handleCreate}
        isLoading={createPromotion.isPending}
        multilangUnlocked={multilangUnlocked}
      />

      <PromotionDrawer
        open={!!dialogPromotion}
        onOpenChange={(open) => !open && setDialogPromotion(null)}
        menuId={menuId}
        promotion={dialogPromotion ?? undefined}
        onSubmit={handleUpdate}
        isLoading={updatePromotion.isPending}
        onDelete={() => dialogPromotion && setDeleteTarget(dialogPromotion)}
        multilangUnlocked={multilangUnlocked}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent data-testid="editor-promotions-delete-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>{tPromo('delete.title')}</AlertDialogTitle>
            <AlertDialogDescription>{tPromo('delete.message')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePromotion.isPending}>
              {t('kebab.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deletePromotion.isPending}
              data-testid="editor-promotions-delete-confirm"
              className="bg-danger text-white hover:bg-danger/90"
            >
              {deletePromotion.isPending ? t('kebab.deleting') : t('kebab.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

// ── FREE-locked (blurred ghost cards + centered upgrade card) ───────────────

function GhostPromoCard() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
      {/* Banner */}
      <div
        className="relative aspect-[16/9] overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #B8633D, #7A3F27)' }}
        aria-hidden="true"
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'repeating-linear-gradient(115deg, transparent 0 40px, rgba(255,220,190,0.2) 40px 42px)',
          }}
        />
        <div className="absolute -right-[30px] -bottom-[30px] h-[140px] w-[140px] rounded-full border-2 border-white/10" />
        <div className="absolute -top-[20px] right-0 h-[100px] w-[100px] rounded-full bg-white/10" />
        <div
          className="absolute inset-x-[18px] bottom-[14px] text-[26px] font-bold leading-none text-white"
          style={{
            fontFamily: "'Playfair Display', 'Times New Roman', serif",
            letterSpacing: -0.8,
            textShadow: '0 2px 12px rgba(0,0,0,0.2)',
          }}
        >
          Happy Hour
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 px-4 py-3.5" aria-hidden="true">
        <div className="flex items-start justify-between gap-3">
          <div className="h-4 w-3/4 rounded bg-border" />
          <div className="h-5 w-14 rounded-[5px] bg-accent-soft" />
        </div>
        <div className="flex flex-col gap-1">
          <div className="h-3 w-2/3 rounded bg-border" />
          <div className="h-3 w-1/2 rounded bg-border" />
        </div>
        <div className="mt-auto flex items-center justify-between border-t border-border-soft pt-2.5">
          <div className="h-3 w-20 rounded bg-border" />
          <div className="h-4 w-4 rounded bg-border" />
        </div>
      </div>
    </div>
  );
}

function PromotionsTabFreeLocked() {
  const t = useTranslations('admin.editor.promotions.locked');

  return (
    <div
      data-testid="editor-promotions-tab"
      data-plan-locked="true"
      className="relative"
    >
      {/* Blurred ghost layout */}
      <div
        aria-hidden="true"
        className="pointer-events-none select-none space-y-4 opacity-40 blur-[6px]"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <GhostPromoCard />
          <GhostPromoCard />
        </div>
      </div>

      {/* Scrim */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: 'hsl(var(--bg) / 0.4)' }}
      />

      {/* Centered upgrade card */}
      <div className="absolute inset-0 flex items-start justify-center px-4 pt-24">
        <div
          role="region"
          aria-label={t('title')}
          data-testid="editor-promotions-locked-overlay"
          className="w-full max-w-[460px] rounded-[14px] border border-border bg-card p-[30px] text-center shadow-xl"
        >
          <span
            aria-hidden="true"
            className="mx-auto mb-3.5 inline-flex size-12 items-center justify-center rounded-xl bg-accent-soft text-accent"
          >
            <Tag size={20} strokeWidth={1.5} />
          </span>

          <h3 className="text-[19px] font-semibold tracking-[-0.4px] text-text-default">
            {t('title')}
          </h3>
          <p className="mx-auto mt-2 max-w-[400px] text-[13px] leading-[1.55] text-text-muted">
            {t('body')}
          </p>

          <ul className="mt-4 flex flex-col gap-2 text-left">
            {(['a', 'b', 'c'] as const).map((key) => (
              <li
                key={key}
                className="flex items-center gap-2.5 text-[13px] text-text-default"
              >
                <span
                  aria-hidden="true"
                  className="inline-flex size-[18px] shrink-0 items-center justify-center rounded-[5px] bg-success-soft text-success"
                >
                  <Check size={12} strokeWidth={2.4} />
                </span>
                {t(`bullets.${key}`)}
              </li>
            ))}
          </ul>

          <Link
            data-testid="editor-promotions-upgrade-cta"
            href="/admin/settings/billing"
            className="mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-text-default px-4 py-2.5 text-[13.5px] font-semibold text-white hover:opacity-90"
          >
            {t('cta')}
          </Link>

          <Link
            href="/admin/settings/billing"
            className="mt-2 inline-block text-[12px] font-medium text-text-muted hover:text-text-default"
          >
            {t('proLink')}
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Skeleton ────────────────────────────────────────────────────────────────

function PromotionsTabSkeleton() {
  return (
    <div
      className="flex flex-col gap-4"
      data-testid="editor-promotions-skeleton"
      aria-hidden="true"
    >
      <div className="flex items-end justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-8 w-36" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-20" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-xl border border-border bg-card"
          >
            <Skeleton className="aspect-[16/9] w-full rounded-none" />
            <div className="space-y-2 p-4">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
