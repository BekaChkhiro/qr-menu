'use client';

import { useState, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { MenuUrlVisibilitySection } from '@/components/admin/menu-url-visibility-section';
import { MenuDescriptionSection } from '@/components/admin/menu-description-section';
import { ScheduleSection } from '@/components/admin/schedule-section';
import { SeoSection } from '@/components/admin/seo-section';
import { SharePreviewCard } from '@/components/admin/share-preview-card';
import { MenuAdvancedSection } from '@/components/admin/menu-advanced-section';
import { MenuLocationContactSection } from '@/components/admin/menu-location-contact-section';
import { MenuWorkingHoursSection } from '@/components/admin/menu-working-hours-section';
import { SharedTableSection } from '@/components/admin/shared-table-section';
import { SharedTableLocked } from '@/components/admin/shared-table-locked';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/toast';
import { useUpdateMenu } from '@/hooks/use-menus';
import { useUserPlan } from '@/hooks/use-user-plan';
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

type OffersRailPosition = 'TOP' | 'BOTTOM';

// T1.12 — Offers rail: on/off, and whether it sits above or below the body.
// Legacy menus (no stored value) read as ON / TOP, matching today's public page.
function OffersRailSection({ menu }: { menu: MenuWithDetails }) {
  const t = useTranslations('admin.editor.settings.offersRail');
  const updateMenu = useUpdateMenu(menu.id);

  const [enabled, setEnabled] = useState<boolean>(menu.offersRailEnabled ?? true);
  const [position, setPosition] = useState<OffersRailPosition>(
    menu.offersRailPosition ?? 'TOP',
  );

  useEffect(() => {
    setEnabled(menu.offersRailEnabled ?? true);
    setPosition(menu.offersRailPosition ?? 'TOP');
  }, [menu.id, menu.offersRailEnabled, menu.offersRailPosition]);

  const save = async (patch: { offersRailEnabled?: boolean; offersRailPosition?: OffersRailPosition }) => {
    try {
      await updateMenu.mutateAsync(patch);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('saveError'));
    }
  };

  const handleEnabledChange = (next: boolean) => {
    setEnabled(next);
    void save({ offersRailEnabled: next });
  };

  const handlePositionChange = (next: string) => {
    const value = next as OffersRailPosition;
    setPosition(value);
    void save({ offersRailPosition: value });
  };

  return (
    <Section label={t('label')} helper={t('helper')}>
      <div className="flex items-center justify-between gap-3 rounded-[8px] border border-border bg-card-soft px-3 py-[10px]">
        <div className="min-w-0">
          <div className="text-[12px] font-semibold text-text-default">{t('switchLabel')}</div>
          <div className="text-[10.5px] text-text-muted">{t('switchDescription')}</div>
        </div>
        <Switch
          data-testid="offers-rail-switch"
          checked={enabled}
          onCheckedChange={handleEnabledChange}
          aria-label={t('switchLabel')}
        />
      </div>

      <div className="mt-3">
        <Select value={position} onValueChange={handlePositionChange} disabled={!enabled}>
          <SelectTrigger
            data-testid="offers-rail-position-select"
            aria-label={t('position.label')}
            className="rounded-[8px] border border-border bg-white px-3 py-[9px] text-[13px]"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TOP">{t('position.top')}</SelectItem>
            <SelectItem value="BOTTOM">{t('position.bottom')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </Section>
  );
}

export function MenuSettingsTab({ menu }: MenuSettingsTabProps) {
  const t = useTranslations('admin.editor.settings');
  const { hasFeature } = useUserPlan();
  const sharedTableUnlocked = hasFeature('sharedTable');

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

        {/* Shared Table (T19.7) — PRO unlocked / FREE+STARTER locked */}
        <Section
          label={t('sharedTable.label')}
          helper={t('sharedTable.helper')}
        >
          {sharedTableUnlocked ? (
            <SharedTableSection menu={menu} />
          ) : (
            <SharedTableLocked />
          )}
        </Section>

        {/* Offers row (T1.12) — on/off and TOP/BOTTOM placement, all plans */}
        <OffersRailSection menu={menu} />

        {/* Description (T20.9) — fallback for SEO meta-description */}
        <Section
          label={t('description.label')}
          helper={t('description.helper')}
        >
          <MenuDescriptionSection menu={menu} />
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

        {/* Working hours (T24.4) — feeds the public footer + promotion limits */}
        <Section label={t('workingHours.label')} helper={t('workingHours.helper')}>
          <MenuWorkingHoursSection menu={menu} />
        </Section>

        {/* Location & contact (T20.4) */}
        <Section
          label={t('locationContact.label')}
          helper={t('locationContact.helper')}
        >
          <MenuLocationContactSection menu={menu} />
        </Section>

        {/* Advanced: Clone / Archive / Delete */}
        <Section label={t('advanced.label')} helper={t('advanced.helper')}>
          <MenuAdvancedSection menu={menu} />
        </Section>
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
