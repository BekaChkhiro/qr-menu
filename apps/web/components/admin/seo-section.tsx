'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from '@/components/ui/toast';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ImageUpload } from '@/components/admin/image-upload';
import { useUpdateMenu } from '@/hooks/use-menus';
import type { MenuWithDetails } from '@/types/menu';

// ── Helpers ───────────────────────────────────────────────────────────────

const MAX_META_DESCRIPTION = 160;

// ── Main section ──────────────────────────────────────────────────────────

interface SeoSectionProps {
  menu: MenuWithDetails;
  onMetaTitleChange?: (value: string) => void;
  onMetaDescriptionChange?: (value: string) => void;
  onShareImageChange?: (value: string) => void;
}

export function SeoSection({
  menu,
  onMetaTitleChange,
  onMetaDescriptionChange,
  onShareImageChange,
}: SeoSectionProps) {
  const t = useTranslations('admin.editor.settings.seo');
  const updateMenu = useUpdateMenu(menu.id);

  const initialMetaTitle = menu.metaTitle || '';
  const initialMetaDescription = menu.metaDescription || '';
  const initialShareImageUrl = menu.shareImageUrl || '';

  const [metaTitle, setMetaTitle] = useState(initialMetaTitle);
  const [metaDescription, setMetaDescription] = useState(initialMetaDescription);
  const [shareImageUrl, setShareImageUrl] = useState(initialShareImageUrl);

  // Sync when menu refetches
  const lastSyncedRef = useRef({
    metaTitle: initialMetaTitle,
    metaDescription: initialMetaDescription,
    shareImageUrl: initialShareImageUrl,
  });
  useEffect(() => {
    if (
      lastSyncedRef.current.metaTitle !== (menu.metaTitle || '') ||
      lastSyncedRef.current.metaDescription !== (menu.metaDescription || '') ||
      lastSyncedRef.current.shareImageUrl !== (menu.shareImageUrl || '')
    ) {
      setMetaTitle(menu.metaTitle || '');
      setMetaDescription(menu.metaDescription || '');
      setShareImageUrl(menu.shareImageUrl || '');
      lastSyncedRef.current = {
        metaTitle: menu.metaTitle || '',
        metaDescription: menu.metaDescription || '',
        shareImageUrl: menu.shareImageUrl || '',
      };
      // Also notify parent of synced values
      onMetaTitleChange?.(menu.metaTitle || '');
      onMetaDescriptionChange?.(menu.metaDescription || '');
      onShareImageChange?.(menu.shareImageUrl || '');
    }
  }, [menu.metaTitle, menu.metaDescription, menu.shareImageUrl, onMetaTitleChange, onMetaDescriptionChange, onShareImageChange]);

  const dirty = useMemo(() => {
    return (
      metaTitle !== initialMetaTitle ||
      metaDescription !== initialMetaDescription ||
      shareImageUrl !== initialShareImageUrl
    );
  }, [metaTitle, metaDescription, shareImageUrl, initialMetaTitle, initialMetaDescription, initialShareImageUrl]);

  const descriptionCount = metaDescription.length;
  const descriptionOverLimit = descriptionCount > MAX_META_DESCRIPTION;

  const handleMetaTitleChange = useCallback((value: string) => {
    setMetaTitle(value);
    onMetaTitleChange?.(value);
  }, [onMetaTitleChange]);

  const handleMetaDescriptionChange = useCallback((value: string) => {
    setMetaDescription(value);
    onMetaDescriptionChange?.(value);
  }, [onMetaDescriptionChange]);

  const handleShareImageChange = useCallback((url: string | null) => {
    const value = url || '';
    setShareImageUrl(value);
    onShareImageChange?.(value);
  }, [onShareImageChange]);

  const handleDiscard = () => {
    setMetaTitle(initialMetaTitle);
    setMetaDescription(initialMetaDescription);
    setShareImageUrl(initialShareImageUrl);
    onMetaTitleChange?.(initialMetaTitle);
    onMetaDescriptionChange?.(initialMetaDescription);
    onShareImageChange?.(initialShareImageUrl);
  };

  const handleSave = async () => {
    const payload: Record<string, unknown> = {};
    if (metaTitle !== initialMetaTitle) payload.metaTitle = metaTitle || null;
    if (metaDescription !== initialMetaDescription) payload.metaDescription = metaDescription || null;
    if (shareImageUrl !== initialShareImageUrl) payload.shareImageUrl = shareImageUrl || null;

    try {
      await updateMenu.mutateAsync(payload);
      toast.success(t('saved'));
      lastSyncedRef.current = {
        metaTitle: metaTitle || '',
        metaDescription: metaDescription || '',
        shareImageUrl: shareImageUrl || '',
      };
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('saveFailed'));
    }
  };

  const saving = updateMenu.isPending;

  return (
    <section
      data-testid="settings-seo"
      data-dirty={dirty ? 'true' : 'false'}
      className="flex flex-col gap-5"
    >
      {/* Meta title */}
      <div>
        <label
          htmlFor="settings-seo-meta-title"
          className="mb-1.5 block text-[12.5px] font-semibold text-text-default"
        >
          {t('metaTitleLabel')}
        </label>
        <p className="mb-2 text-[11.5px] text-text-subtle">{t('metaTitleHint')}</p>
        <Input
          id="settings-seo-meta-title"
          data-testid="settings-seo-meta-title"
          value={metaTitle}
          onChange={(e) => handleMetaTitleChange(e.target.value)}
          placeholder={t('metaTitlePlaceholder')}
          maxLength={120}
          className="h-[40px] text-[13px]"
        />
      </div>

      {/* Meta description */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label
            htmlFor="settings-seo-meta-description"
            className="text-[12.5px] font-semibold text-text-default"
          >
            {t('metaDescriptionLabel')}
          </label>
          <span
            data-testid="settings-seo-char-count"
            className={`text-[11px] font-medium tabular-nums ${
              descriptionOverLimit ? 'text-danger' : 'text-text-subtle'
            }`}
          >
            {descriptionCount} / {MAX_META_DESCRIPTION}
          </span>
        </div>
        <Textarea
          id="settings-seo-meta-description"
          data-testid="settings-seo-meta-description"
          value={metaDescription}
          onChange={(e) => handleMetaDescriptionChange(e.target.value)}
          placeholder={t('metaDescriptionPlaceholder')}
          rows={3}
          maxLength={300}
          className={`resize-none text-[13px] ${
            descriptionOverLimit ? 'border-danger focus-visible:ring-danger/20' : ''
          }`}
        />
      </div>

      {/* Share image */}
      <div>
        <label className="mb-1.5 block text-[12.5px] font-semibold text-text-default">
          {t('shareImageLabel')}
        </label>
        <p className="mb-2 text-[11.5px] text-text-subtle">{t('shareImageHint')}</p>
        <ImageUpload
          value={shareImageUrl || null}
          onChange={handleShareImageChange}
          preset="promotion"
          aspectRatio="wide"
        />
      </div>

      {dirty && (
        <div className="flex items-center justify-end gap-2 border-t border-border-soft pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={handleDiscard}
            data-testid="settings-seo-discard"
          >
            {t('discard')}
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
            data-testid="settings-seo-save"
          >
            {saving && (
              <Loader2
                size={14}
                strokeWidth={2}
                className="mr-1 animate-spin"
                aria-hidden="true"
              />
            )}
            {saving ? t('saving') : t('save')}
          </Button>
        </div>
      )}
    </section>
  );
}
