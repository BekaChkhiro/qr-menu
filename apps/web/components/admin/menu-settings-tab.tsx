'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { MenuUrlVisibilitySection } from '@/components/admin/menu-url-visibility-section';
import { MenuSettingsForm } from '@/components/admin/menu-settings-form';
import { ScheduleSection } from '@/components/admin/schedule-section';
import { SeoSection } from '@/components/admin/seo-section';
import { SharePreviewCard } from '@/components/admin/share-preview-card';
import { MenuAdvancedSection } from '@/components/admin/menu-advanced-section';
import type { MenuWithDetails } from '@/types/menu';

interface MenuSettingsTabProps {
  menu: MenuWithDetails;
}

// Section wrapper matching the design spec (FormSection style)
function Section({
  label,
  helper,
  children,
}: {
  label: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <div className="mb-3">
        <div className="text-[11.5px] font-semibold uppercase tracking-[0.5px] text-text-default">
          {label}
        </div>
        {helper && (
          <div className="mt-1 text-[12.5px] leading-[1.45] text-text-muted">
            {helper}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

export function MenuSettingsTab({ menu }: MenuSettingsTabProps) {
  const t = useTranslations('admin.editor.settings');

  // Lifted SEO state so SharePreviewCard can reflect draft values
  const [draftMetaTitle, setDraftMetaTitle] = useState(menu.metaTitle || '');
  const [draftMetaDescription, setDraftMetaDescription] = useState(menu.metaDescription || '');
  const [draftShareImageUrl, setDraftShareImageUrl] = useState(menu.shareImageUrl || '');

  const handleMetaTitleChange = useCallback((value: string) => {
    setDraftMetaTitle(value);
  }, []);

  const handleMetaDescriptionChange = useCallback((value: string) => {
    setDraftMetaDescription(value);
  }, []);

  const handleShareImageChange = useCallback((value: string) => {
    setDraftShareImageUrl(value);
  }, []);

  return (
    <div className="flex gap-6" data-testid="settings-tab">
      {/* Left column */}
      <div className="min-w-0 flex-1 max-w-[680px]">
        {/* URL + Visibility */}
        <div className="mb-6">
          <MenuUrlVisibilitySection menu={menu} />
        </div>

        {/* Schedule */}
        <Section label={t('schedule.label')} helper={t('schedule.helper')}>
          <ScheduleSection menu={menu} />
        </Section>

        {/* SEO */}
        <Section label={t('seo.label')} helper={t('seo.helper')}>
          <SeoSection
            menu={menu}
            onMetaTitleChange={handleMetaTitleChange}
            onMetaDescriptionChange={handleMetaDescriptionChange}
            onShareImageChange={handleShareImageChange}
          />
        </Section>

        {/* Advanced: Clone / Archive / Delete */}
        <Section label={t('advanced.label')} helper={t('advanced.helper')}>
          <MenuAdvancedSection menu={menu} />
        </Section>

        {/* Legacy settings form (Layout, Branding, Typography, Languages, Display, Location) */}
        <Card className="rounded-[12px]">
          <CardContent className="space-y-6 px-6 pt-6">
            <MenuSettingsForm menu={menu} />
            {menu.createdAt && (
              <div className="border-t border-border-soft pt-4">
                <p className="flex items-center gap-1 text-[12px] text-text-subtle">
                  <Clock size={12} strokeWidth={1.5} aria-hidden="true" />
                  {t('createdAt')}:{' '}
                  {new Date(menu.createdAt).toLocaleDateString()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right rail: live share preview */}
      <div className="hidden w-[320px] shrink-0 lg:block">
        <div className="sticky top-0 pt-2">
          <SharePreviewCard
            menu={menu}
            metaTitle={draftMetaTitle}
            metaDescription={draftMetaDescription}
            shareImageUrl={draftShareImageUrl || null}
          />
        </div>
      </div>
    </div>
  );
}
