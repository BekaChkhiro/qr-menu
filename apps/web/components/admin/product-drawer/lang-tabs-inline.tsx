'use client';

import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

export type LangCode = 'KA' | 'EN' | 'RU';
export type DotStatus = 'filled' | 'empty';

const ALL_LANGS: LangCode[] = ['KA', 'EN', 'RU'];

/**
 * T24.12 — `Menu.enabledLanguages` → the tab set, in canonical KA/EN/RU order.
 * KA is always present: it is the required translation for every content field,
 * so a menu row missing it (or still loading) must not hide the KA fields.
 */
export function menuLanguages(enabled: readonly string[] | undefined | null): LangCode[] {
  if (!enabled?.length) return ['KA'];
  return ALL_LANGS.filter((l) => l === 'KA' || enabled.includes(l));
}

interface LangTabsInlineProps {
  active: LangCode;
  onChange: (lang: LangCode) => void;
  statuses: Record<LangCode, DotStatus>;
  multilangUnlocked: boolean;
  /**
   * T24.12 — the languages this menu actually publishes (`Menu.enabledLanguages`).
   * Two different gates apply to a language tab and they are not the same thing:
   *   - not in this list  → the menu doesn't use it, so don't render the tab at
   *     all (a Georgian-only menu shows no switcher whatsoever),
   *   - in the list but the plan lacks `multilingual` → render it locked.
   * Defaults to all three so existing callers keep today's behaviour.
   */
  availableLanguages?: LangCode[];
  'data-testid'?: string;
}

export function LangTabsInline({
  active,
  onChange,
  statuses,
  multilangUnlocked,
  availableLanguages,
  'data-testid': testId,
}: LangTabsInlineProps) {
  // KA is always authored, so it is always part of the set even if a menu row
  // somehow came back without it.
  const langs = availableLanguages
    ? ALL_LANGS.filter((l) => l === 'KA' || availableLanguages.includes(l))
    : ALL_LANGS;

  // A single language means there is nothing to switch between — the strip
  // would just be a permanently-selected "KA" chip taking up a row.
  if (langs.length < 2) return null;

  // Build individual tab testid: strip trailing "s" from strip testid.
  // e.g. "product-basics-name-tabs" → "product-basics-name-tab-KA"
  const tabTestIdBase = testId
    ? testId.endsWith('-tabs')
      ? testId.slice(0, -1) // remove trailing "s" → "-tab"
      : testId + '-tab'
    : undefined;

  return (
    <div
      className="mb-2 flex gap-0.5 border-b border-border-soft"
      data-testid={testId}
    >
      {langs.map((lang) => {
        const isLocked = !multilangUnlocked && lang !== 'KA';
        const isActive = lang === active;

        return (
          <button
            key={lang}
            type="button"
            disabled={isLocked}
            data-testid={tabTestIdBase ? `${tabTestIdBase}-${lang}` : undefined}
            data-locked={isLocked ? 'true' : 'false'}
            onClick={() => !isLocked && onChange(lang)}
            className={cn(
              'inline-flex items-center gap-[5px] px-[10px] py-1.5 text-[11.5px] font-semibold',
              '-mb-px border-b-2 transition-colors',
              isActive
                ? 'border-text-default text-text-default'
                : 'border-transparent text-text-muted hover:text-text-default',
              isLocked && 'cursor-not-allowed opacity-50',
            )}
          >
            {lang}
            {isLocked ? (
              <Lock
                className="h-[9.5px] w-[9.5px]"
                strokeWidth={1.8}
                aria-label="PRO feature"
              />
            ) : (
              <span
                className={cn(
                  'inline-block h-[5px] w-[5px] rounded-full',
                  statuses[lang] === 'filled'
                    ? 'bg-success'
                    : 'border border-text-subtle bg-transparent',
                )}
                aria-hidden="true"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
