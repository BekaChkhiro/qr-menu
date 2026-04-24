'use client';

import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

export type LangCode = 'KA' | 'EN' | 'RU';
export type DotStatus = 'filled' | 'empty';

interface LangTabsInlineProps {
  active: LangCode;
  onChange: (lang: LangCode) => void;
  statuses: Record<LangCode, DotStatus>;
  multilangUnlocked: boolean;
  'data-testid'?: string;
}

export function LangTabsInline({
  active,
  onChange,
  statuses,
  multilangUnlocked,
  'data-testid': testId,
}: LangTabsInlineProps) {
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
      {(['KA', 'EN', 'RU'] as LangCode[]).map((lang) => {
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
