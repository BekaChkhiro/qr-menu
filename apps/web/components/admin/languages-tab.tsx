'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { toast } from '@/components/ui/toast';
import { Check, Filter, Lock, Sparkles, X } from 'lucide-react';

import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUpdateMenu } from '@/hooks/use-menus';
import { cn } from '@/lib/utils';
import type { Language, MenuWithDetails } from '@/types/menu';

// Design source: qr-menu-design/components/menu-editor.jsx:469-644
// (EditorLanguagesPage). Ported to Tailwind + shadcn for T13.6.

const ALL_LANGS: ReadonlyArray<Language> = ['KA', 'EN', 'RU'];
const TARGET_LANGS: ReadonlyArray<Exclude<Language, 'KA'>> = ['EN', 'RU'];

interface LanguagesTabProps {
  menu: MenuWithDetails;
  /** PRO plan → unlocked. FREE/STARTER → locked overlay over blurred UI. */
  hasMultilingual: boolean;
}

interface MatrixRow {
  type: 'category' | 'product';
  id: string;
  label: string;
  ka: boolean;
  en: boolean;
  ru: boolean;
}

export function LanguagesTab({ menu, hasMultilingual }: LanguagesTabProps) {
  const t = useTranslations('admin.editor.languages');
  const updateMenu = useUpdateMenu(menu.id);
  const isLocked = !hasMultilingual;

  const enabled = useMemo(() => {
    const set = new Set<Language>(menu.enabledLanguages);
    set.add('KA');
    return set;
  }, [menu.enabledLanguages]);

  const [showMissingOnly, setShowMissingOnly] = useState(false);

  const rows = useMemo<MatrixRow[]>(() => {
    const out: MatrixRow[] = [];
    for (const cat of menu.categories) {
      out.push({
        type: 'category',
        id: `cat-${cat.id}`,
        label: cat.nameKa,
        ka: true,
        en: Boolean(cat.nameEn?.trim()),
        ru: Boolean(cat.nameRu?.trim()),
      });
      for (const p of cat.products ?? []) {
        out.push({
          type: 'product',
          id: `prod-${p.id}`,
          label: p.nameKa,
          ka: true,
          en: Boolean(p.nameEn?.trim()),
          ru: Boolean(p.nameRu?.trim()),
        });
      }
    }
    return out;
  }, [menu.categories]);

  // Coverage is computed over *enabled target* languages only.
  // KA is always on and always filled (required), so including it would
  // make the denominator misleading.
  const stats = useMemo(() => {
    const targets = TARGET_LANGS.filter((l) => enabled.has(l));
    const total = rows.length * targets.length;
    let translated = 0;
    for (const r of rows) {
      for (const l of targets) {
        if (l === 'EN' && r.en) translated++;
        if (l === 'RU' && r.ru) translated++;
      }
    }
    return { total, translated, missing: total - translated };
  }, [rows, enabled]);

  const filteredRows = useMemo(() => {
    if (!showMissingOnly) return rows;
    const targets = TARGET_LANGS.filter((l) => enabled.has(l));
    return rows.filter((r) =>
      targets.some(
        (l) => (l === 'EN' && !r.en) || (l === 'RU' && !r.ru),
      ),
    );
  }, [rows, enabled, showMissingOnly]);

  const handleToggle = async (
    lang: Exclude<Language, 'KA'>,
    next: boolean,
  ) => {
    if (isLocked) return;
    const nextSet = new Set(enabled);
    if (next) nextSet.add(lang);
    else nextSet.delete(lang);
    const arr = ALL_LANGS.filter((l) => nextSet.has(l));
    try {
      await updateMenu.mutateAsync({ enabledLanguages: arr });
      toast.success(t('toast.saved'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('toast.error'));
    }
  };

  return (
    <div
      data-testid="editor-languages-tab"
      data-plan-locked={isLocked || undefined}
      className="relative"
    >
      <div
        className={cn(
          'flex gap-4',
          isLocked && 'pointer-events-none select-none opacity-55 blur-[6px]',
        )}
        aria-hidden={isLocked || undefined}
      >
        {/* ── Left column: toggles + auto-translate ─────────────────── */}
        <div className="flex w-[380px] shrink-0 flex-col gap-[10px]">
          <div className="mb-[2px] text-[11.5px] font-semibold uppercase tracking-[0.5px] text-text-default">
            {t('title')}
          </div>

          <LangToggle
            code="KA"
            label={t('names.ka')}
            subtitle={t('primary')}
            on
            primary
          />
          <LangToggle
            code="EN"
            label={t('names.en')}
            subtitle={enabled.has('EN') ? t('enabled') : t('disabled')}
            on={enabled.has('EN')}
            toggleLabel={t('toggleLabel', { language: 'English' })}
            onChange={(v) => handleToggle('EN', v)}
            pending={updateMenu.isPending}
          />
          <LangToggle
            code="RU"
            label={t('names.ru')}
            subtitle={enabled.has('RU') ? t('enabled') : t('disabled')}
            on={enabled.has('RU')}
            toggleLabel={t('toggleLabel', { language: 'Русский' })}
            onChange={(v) => handleToggle('RU', v)}
            pending={updateMenu.isPending}
          />

          <AutoTranslatePanel missing={stats.missing} locked={isLocked} t={t} />
        </div>

        {/* ── Right column: translation matrix ──────────────────────── */}
        <Card
          className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-[12px]"
          data-testid="editor-languages-matrix"
        >
          <div className="flex items-center border-b border-border-soft px-[18px] py-3">
            <div>
              <div className="text-[13.5px] font-semibold text-text-default">
                {t('matrix.title')}
              </div>
              <div
                className="mt-px text-[11.5px] text-text-muted"
                data-testid="editor-languages-coverage"
                data-translated={stats.translated}
                data-total={stats.total}
                data-missing={stats.missing}
              >
                {t('matrix.coverage', {
                  translated: stats.translated,
                  total: stats.total,
                })}
                {' · '}
                <span
                  className={cn(
                    stats.missing > 0
                      ? 'font-medium text-warning'
                      : 'text-success',
                  )}
                >
                  {t('matrix.missing', { count: stats.missing })}
                </span>
              </div>
            </div>
            <div className="flex-1" />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              data-testid="editor-languages-filter-toggle"
              data-pressed={showMissingOnly || undefined}
              onClick={() => setShowMissingOnly((v) => !v)}
            >
              <Filter strokeWidth={1.5} />
              {showMissingOnly ? t('matrix.showAll') : t('matrix.showMissing')}
            </Button>
          </div>

          {/* Column headers */}
          <div
            className="grid gap-3 border-b border-border-soft bg-bg/70 px-[18px] py-[9px] text-[10.5px] font-semibold uppercase tracking-[0.5px] text-text-subtle"
            style={{ gridTemplateColumns: '1fr 70px 70px 70px' }}
          >
            <span>{t('matrix.columnItem')}</span>
            <span className="text-center">KA</span>
            <span className="text-center">EN</span>
            <span className="text-center">RU</span>
          </div>

          {/* Body */}
          <div
            className="flex-1 overflow-auto"
            data-testid="editor-languages-rows"
          >
            {filteredRows.length === 0 ? (
              <div
                className="p-6 text-center text-[12.5px] text-text-muted"
                data-testid="editor-languages-empty"
              >
                {rows.length === 0
                  ? t('matrix.empty')
                  : t('matrix.filteredEmpty')}
              </div>
            ) : (
              filteredRows.map((r, i) => {
                const isCat = r.type === 'category';
                const isLast = i === filteredRows.length - 1;
                return (
                  <div
                    key={r.id}
                    data-testid={`editor-languages-row-${r.id}`}
                    data-row-type={r.type}
                    className={cn(
                      'grid items-center gap-3 px-[18px] py-[10px]',
                      !isLast && 'border-b border-border-soft',
                      isCat ? 'bg-bg/60' : 'bg-card',
                    )}
                    style={{ gridTemplateColumns: '1fr 70px 70px 70px' }}
                  >
                    <span
                      className={cn(
                        'truncate text-[12.5px] text-text-default',
                        isCat ? 'font-semibold' : 'pl-[14px] font-medium',
                      )}
                    >
                      {isCat
                        ? t('matrix.categoryLabel', { name: r.label })
                        : r.label}
                    </span>
                    <TCell on={r.ka} />
                    <TCell
                      on={enabled.has('EN') && r.en}
                      muted={!enabled.has('EN')}
                    />
                    <TCell
                      on={enabled.has('RU') && r.ru}
                      muted={!enabled.has('RU')}
                    />
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>

      {isLocked && <LanguagesLockedOverlay t={t} />}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface LangToggleProps {
  code: 'KA' | 'EN' | 'RU';
  label: string;
  subtitle: string;
  on: boolean;
  primary?: boolean;
  toggleLabel?: string;
  onChange?: (value: boolean) => void;
  pending?: boolean;
}

function LangToggle({
  code,
  label,
  subtitle,
  on,
  primary,
  toggleLabel,
  onChange,
  pending,
}: LangToggleProps) {
  return (
    <div
      data-testid={`editor-languages-toggle-${code.toLowerCase()}`}
      data-lang={code}
      data-enabled={on || undefined}
      className="flex items-center gap-3 rounded-[10px] border border-border bg-card px-4 py-[14px]"
    >
      <div
        className={cn(
          'flex h-[34px] w-[34px] items-center justify-center rounded-[8px] text-[12px] font-bold tracking-[0.2px]',
          on ? 'bg-accent-soft text-accent' : 'bg-chip text-text-muted',
        )}
      >
        {code}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13.5px] font-semibold text-text-default">
          {label}
        </div>
        <div className="text-[11.5px] text-text-muted">{subtitle}</div>
      </div>
      {primary ? (
        // KA is always on — render a static "on" track per the design spec.
        <div
          aria-hidden="true"
          className="inline-flex h-[18px] w-[32px] shrink-0 items-center rounded-full bg-text-default/60 p-[2px] opacity-60"
        >
          <span className="block h-[14px] w-[14px] translate-x-[14px] rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.15)]" />
        </div>
      ) : (
        <Switch
          checked={on}
          onCheckedChange={onChange}
          aria-label={toggleLabel}
          disabled={pending}
          data-testid={`editor-languages-switch-${code.toLowerCase()}`}
        />
      )}
    </div>
  );
}

function AutoTranslatePanel({
  missing,
  locked,
  t,
}: {
  missing: number;
  locked: boolean;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div
      data-testid="editor-languages-autotranslate"
      data-locked={locked || undefined}
      className={cn(
        'mt-[10px] rounded-[10px] px-4 py-[14px]',
        locked
          ? 'border border-border bg-bg'
          : 'border border-accent-soft bg-accent-soft',
      )}
    >
      <div className="mb-1.5 flex items-center gap-2">
        <Sparkles size={13} strokeWidth={1.5} className="text-accent" />
        <span className="text-[13px] font-semibold text-text-default">
          {t('autoTranslate.title')}
        </span>
        {locked && (
          <span
            data-testid="editor-languages-pro-badge"
            className="ml-auto rounded-[4px] bg-success-soft px-[7px] py-px text-[9.5px] font-bold uppercase tracking-[0.4px] text-success"
          >
            {t('autoTranslate.proBadge')}
          </span>
        )}
      </div>
      <div className="mb-3 text-[12px] leading-[1.5] text-text-muted">
        {locked
          ? t('autoTranslate.hintLocked')
          : t('autoTranslate.hint', { count: missing })}
      </div>
      <Button
        type="button"
        variant={locked ? 'secondary' : 'primary'}
        size="sm"
        disabled={!locked && missing === 0}
        data-testid="editor-languages-autotranslate-cta"
      >
        {locked ? (
          <>
            <Lock strokeWidth={1.5} />
            {t('autoTranslate.ctaLocked')}
          </>
        ) : (
          <>
            <Sparkles strokeWidth={1.5} />
            {t('autoTranslate.cta', { count: missing })}
          </>
        )}
      </Button>
    </div>
  );
}

function TCell({ on, muted }: { on: boolean; muted?: boolean }) {
  if (muted) {
    return (
      <div
        className="mx-auto flex h-5 w-5 items-center justify-center rounded-[5px] bg-chip text-text-subtle opacity-40"
        aria-hidden="true"
      >
        <span className="block h-[2px] w-[10px] rounded bg-current" />
      </div>
    );
  }
  return on ? (
    <div className="mx-auto flex h-5 w-5 items-center justify-center rounded-[5px] bg-success-soft text-success">
      <Check size={12} strokeWidth={2.4} />
    </div>
  ) : (
    <div className="mx-auto flex h-5 w-5 items-center justify-center rounded-[5px] bg-chip text-text-subtle">
      <X size={11} strokeWidth={2} />
    </div>
  );
}

function LanguagesLockedOverlay({
  t,
}: {
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div
      data-testid="editor-languages-locked-overlay"
      className="absolute inset-0 flex items-center justify-center"
      style={{ background: 'hsl(var(--bg) / 0.55)' }}
    >
      <div className="max-w-[340px] rounded-card border border-border bg-card px-6 py-5 text-center shadow-xs">
        <div className="mx-auto mb-2.5 flex h-9 w-9 items-center justify-center rounded-[10px] bg-accent-soft text-accent">
          <Lock className="h-[17px] w-[17px]" strokeWidth={1.5} />
        </div>
        <div className="mb-1 text-[14.5px] font-semibold text-text-default">
          {t('locked.title')}
        </div>
        <div className="mb-3 text-[12.5px] leading-[1.5] text-text-muted">
          {t('locked.body')}
        </div>
        <Link
          href="/admin/settings/billing"
          data-testid="editor-languages-upgrade-cta"
          className="inline-flex items-center justify-center rounded-[7px] bg-text-default px-[14px] py-[7px] text-[12.5px] font-medium text-white hover:opacity-90"
        >
          {t('locked.cta')}
        </Link>
      </div>
    </div>
  );
}
