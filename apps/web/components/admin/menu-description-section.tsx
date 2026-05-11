'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateMenu } from '@/hooks/use-menus';
import type { MenuWithDetails } from '@/types/menu';

const MAX_DESCRIPTION = 500;

interface MenuDescriptionSectionProps {
  menu: MenuWithDetails;
}

export function MenuDescriptionSection({ menu }: MenuDescriptionSectionProps) {
  const t = useTranslations('admin.editor.settings.description');
  const updateMenu = useUpdateMenu(menu.id);

  const initial = menu.description || '';
  const [description, setDescription] = useState(initial);

  const lastSyncedRef = useRef(initial);
  useEffect(() => {
    const next = menu.description || '';
    if (lastSyncedRef.current !== next) {
      setDescription(next);
      lastSyncedRef.current = next;
    }
  }, [menu.description]);

  const dirty = useMemo(() => description !== initial, [description, initial]);
  const charCount = description.length;
  const overLimit = charCount > MAX_DESCRIPTION;

  const handleDiscard = () => {
    setDescription(initial);
  };

  const handleSave = async () => {
    if (overLimit) return;
    try {
      await updateMenu.mutateAsync({
        description: description.trim() ? description : null,
      });
      toast.success(t('saved'));
      lastSyncedRef.current = description;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('saveFailed'));
    }
  };

  const saving = updateMenu.isPending;

  return (
    <section
      data-testid="settings-description"
      data-dirty={dirty ? 'true' : 'false'}
      className="flex flex-col gap-4"
    >
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label
            htmlFor="settings-description-textarea"
            className="text-[12.5px] font-semibold text-text-default"
          >
            {t('fieldLabel')}
          </label>
          <span
            data-testid="settings-description-char-count"
            className={`text-[11px] font-medium tabular-nums ${
              overLimit ? 'text-danger' : 'text-text-subtle'
            }`}
          >
            {charCount} / {MAX_DESCRIPTION}
          </span>
        </div>
        <p className="mb-2 text-[11.5px] text-text-subtle">{t('hint')}</p>
        <Textarea
          id="settings-description-textarea"
          data-testid="settings-description-textarea"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('placeholder')}
          rows={4}
          maxLength={MAX_DESCRIPTION}
          aria-invalid={overLimit ? 'true' : 'false'}
          className={`resize-none text-[13px] ${
            overLimit ? 'border-danger focus-visible:ring-danger/20' : ''
          }`}
        />
      </div>

      <div
        data-testid="settings-description-actions"
        className="flex items-center justify-end gap-2 border-t border-border-soft pt-4"
      >
        {dirty && !saving && (
          <Button
            type="button"
            variant="ghost"
            onClick={handleDiscard}
            data-testid="settings-description-discard"
          >
            {t('discard')}
          </Button>
        )}
        <Button
          type="button"
          onClick={handleSave}
          disabled={!dirty || saving || overLimit}
          data-testid="settings-description-save"
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
    </section>
  );
}
