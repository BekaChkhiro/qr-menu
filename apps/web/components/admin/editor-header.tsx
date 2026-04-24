'use client';

import * as React from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { formatDistanceToNow } from 'date-fns';
import { enUS, ka, ru } from 'date-fns/locale';
import { ArrowLeft, ExternalLink, Pencil, Share2, X, Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Segmented, SegmentedItem } from '@/components/ui/segmented';
import { cn } from '@/lib/utils';

type EditorHeaderStatus = 'DRAFT' | 'PUBLISHED';

export interface EditorHeaderProps {
  /** Menu name shown as H1; becomes editable when the pencil is clicked. */
  name: string;
  /** Public slug used to build the View-public href. */
  slug: string;
  /** Draft or Published. Controls the segmented toggle. */
  status: EditorHeaderStatus;
  /** Last published timestamp — null when the menu has never been published. */
  lastPublishedAt: Date | string | null;
  /** True while the publish mutation is in flight. Disables the toggle. */
  publishing?: boolean;
  /** Fires when the user flips the Draft/Published toggle. */
  onTogglePublish: (publish: boolean) => void;
  /** Fires when the user saves a new menu name. Must return a promise. */
  onSaveName: (nextName: string) => Promise<void>;
  /** Fires when the Share button is clicked. */
  onShare?: () => void;
  /** True when a child tab has dirty edits waiting to be saved. */
  hasUnsavedChanges?: boolean;
  /** True while the parent's Save handler is running. */
  savingChanges?: boolean;
  /** Fires when the user clicks "Save changes". */
  onSaveChanges?: () => void;
}

const LOCALE_MAP = { en: enUS, ka, ru } as const;

export function EditorHeader({
  name,
  slug,
  status,
  lastPublishedAt,
  publishing = false,
  onTogglePublish,
  onSaveName,
  onShare,
  hasUnsavedChanges = false,
  savingChanges = false,
  onSaveChanges,
}: EditorHeaderProps) {
  const t = useTranslations('admin.editor');
  const locale = useLocale() as keyof typeof LOCALE_MAP;
  const dateLocale = LOCALE_MAP[locale] ?? enUS;

  const [isEditingName, setIsEditingName] = React.useState(false);
  const [draftName, setDraftName] = React.useState(name);
  const [savingName, setSavingName] = React.useState(false);
  const [nameError, setNameError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (!isEditingName) setDraftName(name);
  }, [name, isEditingName]);

  React.useEffect(() => {
    if (isEditingName) inputRef.current?.select();
  }, [isEditingName]);

  const startEditingName = () => {
    setDraftName(name);
    setNameError(null);
    setIsEditingName(true);
  };

  const cancelEditingName = () => {
    setDraftName(name);
    setNameError(null);
    setIsEditingName(false);
  };

  const saveName = async () => {
    const trimmed = draftName.trim();
    if (!trimmed) {
      setNameError(t('name.required'));
      return;
    }
    if (trimmed === name) {
      setIsEditingName(false);
      return;
    }
    setSavingName(true);
    setNameError(null);
    try {
      await onSaveName(trimmed);
      setIsEditingName(false);
    } catch (err) {
      setNameError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSavingName(false);
    }
  };

  const publishedWhen = React.useMemo(() => {
    if (!lastPublishedAt) return null;
    const date =
      typeof lastPublishedAt === 'string' ? new Date(lastPublishedAt) : lastPublishedAt;
    const diffMs = Date.now() - date.getTime();
    if (diffMs < 60_000) return t('publish.justNow');
    return formatDistanceToNow(date, { addSuffix: true, locale: dateLocale });
  }, [lastPublishedAt, dateLocale, t]);

  const isPublished = status === 'PUBLISHED';
  const publicHref = `/m/${slug}`;

  return (
    <div data-testid="editor-header" className="mb-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        {/* ── Left: back, name, publish toggle + timestamp ───────────────── */}
        <div className="flex min-w-0 items-start gap-3">
          <Button
            asChild
            variant="ghost"
            size="icon"
            iconOnly
            aria-label={t('backToMenus')}
            className="mt-[2px] shrink-0 rounded-full"
          >
            <Link href="/admin/menus">
              <ArrowLeft />
            </Link>
          </Button>

          <div className="min-w-0">
            {/* Name row */}
            {isEditingName ? (
              <form
                className="flex items-center gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  void saveName();
                }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  aria-label={t('name.label')}
                  data-testid="editor-name-input"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      e.preventDefault();
                      cancelEditingName();
                    }
                  }}
                  disabled={savingName}
                  className={cn(
                    'w-full min-w-[240px] max-w-[420px]',
                    'rounded-[6px] border border-border bg-card px-[10px] py-[4px]',
                    'text-[24px] font-semibold leading-[1.15] tracking-[-0.5px] text-text-default',
                    'focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30',
                    nameError && 'border-danger focus:border-danger focus:ring-danger/30',
                  )}
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  leadingIcon={Check}
                  loading={savingName}
                  data-testid="editor-name-save"
                >
                  {t('name.save')}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  leadingIcon={X}
                  onClick={cancelEditingName}
                  disabled={savingName}
                  data-testid="editor-name-cancel"
                >
                  {t('name.cancel')}
                </Button>
              </form>
            ) : (
              <div className="flex items-center gap-2">
                <h1
                  data-testid="editor-name"
                  className="truncate text-[24px] font-semibold leading-[1.15] tracking-[-0.5px] text-text-default"
                >
                  {name}
                </h1>
                <Button
                  variant="ghost"
                  size="icon"
                  iconOnly
                  aria-label={t('name.edit')}
                  onClick={startEditingName}
                  data-testid="editor-name-edit"
                  className="shrink-0 rounded-full"
                >
                  <Pencil />
                </Button>
              </div>
            )}

            {nameError ? (
              <p role="alert" className="mt-1 text-[12px] text-danger">
                {nameError}
              </p>
            ) : null}

            {/* Status row */}
            <div className="mt-[6px] flex items-center gap-[10px] text-[12.5px] text-text-muted">
              <Segmented
                value={status}
                onValueChange={(v) => {
                  if (publishing) return;
                  const next = v === 'PUBLISHED';
                  if (next !== isPublished) onTogglePublish(next);
                }}
                ariaLabel={t('publish.togglePublished')}
                data-testid="editor-publish-toggle"
              >
                <SegmentedItem value="DRAFT" disabled={publishing}>
                  {t('publish.draft')}
                </SegmentedItem>
                <SegmentedItem value="PUBLISHED" disabled={publishing}>
                  <span
                    aria-hidden="true"
                    className={cn(
                      'mr-[4px] inline-block h-[5px] w-[5px] rounded-full',
                      isPublished ? 'bg-success' : 'bg-border',
                    )}
                  />
                  {t('publish.published')}
                </SegmentedItem>
              </Segmented>

              <span aria-hidden="true">·</span>

              <span
                data-testid="editor-last-published"
                className="tabular-nums"
                aria-live="polite"
              >
                {publishedWhen
                  ? t('publish.lastPublished', { when: publishedWhen })
                  : t('publish.neverPublished')}
              </span>
            </div>
          </div>
        </div>

        {/* ── Right: action buttons ──────────────────────────────────────── */}
        <div className="flex shrink-0 items-center gap-[8px]">
          <Button
            variant="secondary"
            size="md"
            leadingIcon={Share2}
            onClick={onShare}
            data-testid="editor-share"
          >
            {t('actions.share')}
          </Button>

          <Button
            asChild
            variant="secondary"
            size="md"
            data-testid="editor-view-public"
          >
            <Link
              href={publicHref}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('actions.viewPublic')}
            >
              <ExternalLink aria-hidden="true" />
              {t('actions.viewPublic')}
            </Link>
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={onSaveChanges}
            disabled={!hasUnsavedChanges && !savingChanges}
            loading={savingChanges}
            data-testid="editor-save-changes"
            aria-label={
              hasUnsavedChanges
                ? `${t('actions.saveChanges')} — ${t('unsaved.dotLabel')}`
                : t('actions.saveChanges')
            }
            className="relative"
          >
            {hasUnsavedChanges && !savingChanges ? (
              <span
                aria-hidden="true"
                data-testid="editor-unsaved-dot"
                className="absolute -right-[3px] -top-[3px] h-[8px] w-[8px] rounded-full bg-accent ring-2 ring-bg"
              />
            ) : null}
            {savingChanges ? t('actions.saving') : t('actions.saveChanges')}
          </Button>
        </div>
      </div>
    </div>
  );
}
