'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, MapPin, Phone, Wifi, DoorClosed } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ImageUpload } from '@/components/admin/image-upload';
import { useUpdateMenu } from '@/hooks/use-menus';
import type { MenuWithDetails } from '@/types/menu';

interface MenuLocationContactSectionProps {
  menu: MenuWithDetails;
}

export function MenuLocationContactSection({ menu }: MenuLocationContactSectionProps) {
  const t = useTranslations('admin.editor.settings.locationContact');
  const updateMenu = useUpdateMenu(menu.id);

  const initialAddress = menu.address || '';
  const initialPhone = menu.phone || '';
  const initialWifiSsid = menu.wifiSsid || '';
  const initialWifiPassword = menu.wifiPassword || '';
  const initialWcDirection = menu.wcDirection || '';
  const initialWcImageUrl = menu.wcImageUrl || '';

  const [address, setAddress] = useState(initialAddress);
  const [phone, setPhone] = useState(initialPhone);
  const [wifiSsid, setWifiSsid] = useState(initialWifiSsid);
  const [wifiPassword, setWifiPassword] = useState(initialWifiPassword);
  const [wcDirection, setWcDirection] = useState(initialWcDirection);
  const [wcImageUrl, setWcImageUrl] = useState(initialWcImageUrl);

  const lastSyncedRef = useRef({
    address: initialAddress,
    phone: initialPhone,
    wifiSsid: initialWifiSsid,
    wifiPassword: initialWifiPassword,
    wcDirection: initialWcDirection,
    wcImageUrl: initialWcImageUrl,
  });

  useEffect(() => {
    const next = {
      address: menu.address || '',
      phone: menu.phone || '',
      wifiSsid: menu.wifiSsid || '',
      wifiPassword: menu.wifiPassword || '',
      wcDirection: menu.wcDirection || '',
      wcImageUrl: menu.wcImageUrl || '',
    };
    const prev = lastSyncedRef.current;
    if (
      prev.address !== next.address ||
      prev.phone !== next.phone ||
      prev.wifiSsid !== next.wifiSsid ||
      prev.wifiPassword !== next.wifiPassword ||
      prev.wcDirection !== next.wcDirection ||
      prev.wcImageUrl !== next.wcImageUrl
    ) {
      setAddress(next.address);
      setPhone(next.phone);
      setWifiSsid(next.wifiSsid);
      setWifiPassword(next.wifiPassword);
      setWcDirection(next.wcDirection);
      setWcImageUrl(next.wcImageUrl);
      lastSyncedRef.current = next;
    }
  }, [
    menu.address,
    menu.phone,
    menu.wifiSsid,
    menu.wifiPassword,
    menu.wcDirection,
    menu.wcImageUrl,
  ]);

  const dirty = useMemo(
    () =>
      address !== initialAddress ||
      phone !== initialPhone ||
      wifiSsid !== initialWifiSsid ||
      wifiPassword !== initialWifiPassword ||
      wcDirection !== initialWcDirection ||
      wcImageUrl !== initialWcImageUrl,
    [
      address,
      phone,
      wifiSsid,
      wifiPassword,
      wcDirection,
      wcImageUrl,
      initialAddress,
      initialPhone,
      initialWifiSsid,
      initialWifiPassword,
      initialWcDirection,
      initialWcImageUrl,
    ]
  );

  const handleDiscard = useCallback(() => {
    setAddress(initialAddress);
    setPhone(initialPhone);
    setWifiSsid(initialWifiSsid);
    setWifiPassword(initialWifiPassword);
    setWcDirection(initialWcDirection);
    setWcImageUrl(initialWcImageUrl);
  }, [
    initialAddress,
    initialPhone,
    initialWifiSsid,
    initialWifiPassword,
    initialWcDirection,
    initialWcImageUrl,
  ]);

  const handleSave = async () => {
    const payload: Record<string, string | null> = {};
    if (address !== initialAddress) payload.address = address || null;
    if (phone !== initialPhone) payload.phone = phone || null;
    if (wifiSsid !== initialWifiSsid) payload.wifiSsid = wifiSsid || null;
    if (wifiPassword !== initialWifiPassword) payload.wifiPassword = wifiPassword || null;
    if (wcDirection !== initialWcDirection) payload.wcDirection = wcDirection || null;
    if (wcImageUrl !== initialWcImageUrl) payload.wcImageUrl = wcImageUrl || null;

    try {
      await updateMenu.mutateAsync(payload);
      toast.success(t('saved'));
      lastSyncedRef.current = {
        address: address || '',
        phone: phone || '',
        wifiSsid: wifiSsid || '',
        wifiPassword: wifiPassword || '',
        wcDirection: wcDirection || '',
        wcImageUrl: wcImageUrl || '',
      };
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('saveFailed'));
    }
  };

  const saving = updateMenu.isPending;

  return (
    <section
      data-testid="settings-location"
      data-dirty={dirty ? 'true' : 'false'}
      className="flex flex-col gap-5"
    >
      {/* Address */}
      <div>
        <label
          htmlFor="settings-location-address"
          className="mb-1.5 flex items-center gap-1.5 text-[12.5px] font-semibold text-text-default"
        >
          <MapPin size={13} strokeWidth={1.5} aria-hidden="true" className="text-text-muted" />
          {t('addressLabel')}
        </label>
        <Textarea
          id="settings-location-address"
          data-testid="settings-location-address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder={t('addressPlaceholder')}
          rows={2}
          maxLength={500}
          className="resize-none text-[13px]"
        />
      </div>

      {/* Phone */}
      <div>
        <label
          htmlFor="settings-location-phone"
          className="mb-1.5 flex items-center gap-1.5 text-[12.5px] font-semibold text-text-default"
        >
          <Phone size={13} strokeWidth={1.5} aria-hidden="true" className="text-text-muted" />
          {t('phoneLabel')}
        </label>
        <Input
          id="settings-location-phone"
          data-testid="settings-location-phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={t('phonePlaceholder')}
          maxLength={50}
          className="h-[40px] text-[13px]"
        />
      </div>

      {/* Wi-Fi (SSID + password) */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label
            htmlFor="settings-location-wifi-ssid"
            className="mb-1.5 flex items-center gap-1.5 text-[12.5px] font-semibold text-text-default"
          >
            <Wifi size={13} strokeWidth={1.5} aria-hidden="true" className="text-text-muted" />
            {t('wifiSsidLabel')}
          </label>
          <Input
            id="settings-location-wifi-ssid"
            data-testid="settings-location-wifi-ssid"
            value={wifiSsid}
            onChange={(e) => setWifiSsid(e.target.value)}
            placeholder={t('wifiSsidPlaceholder')}
            maxLength={100}
            className="h-[40px] text-[13px]"
          />
        </div>
        <div>
          <label
            htmlFor="settings-location-wifi-password"
            className="mb-1.5 block text-[12.5px] font-semibold text-text-default"
          >
            {t('wifiPasswordLabel')}
          </label>
          <Input
            id="settings-location-wifi-password"
            data-testid="settings-location-wifi-password"
            value={wifiPassword}
            onChange={(e) => setWifiPassword(e.target.value)}
            placeholder={t('wifiPasswordPlaceholder')}
            maxLength={100}
            className="h-[40px] text-[13px]"
          />
        </div>
      </div>

      {/* WC direction */}
      <div>
        <label
          htmlFor="settings-location-wc-direction"
          className="mb-1.5 flex items-center gap-1.5 text-[12.5px] font-semibold text-text-default"
        >
          <DoorClosed size={13} strokeWidth={1.5} aria-hidden="true" className="text-text-muted" />
          {t('wcDirectionLabel')}
        </label>
        <p className="mb-2 text-[11.5px] text-text-subtle">{t('wcDirectionHint')}</p>
        <Textarea
          id="settings-location-wc-direction"
          data-testid="settings-location-wc-direction"
          value={wcDirection}
          onChange={(e) => setWcDirection(e.target.value)}
          placeholder={t('wcDirectionPlaceholder')}
          rows={3}
          maxLength={500}
          className="resize-none text-[13px]"
        />
      </div>

      {/* WC image */}
      <div data-testid="settings-location-wc-image">
        <label className="mb-1.5 block text-[12.5px] font-semibold text-text-default">
          {t('wcImageLabel')}
        </label>
        <p className="mb-2 text-[11.5px] text-text-subtle">{t('wcImageHint')}</p>
        <ImageUpload
          value={wcImageUrl || null}
          onChange={(url) => setWcImageUrl(url || '')}
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
            data-testid="settings-location-discard"
          >
            {t('discard')}
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
            data-testid="settings-location-save"
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
