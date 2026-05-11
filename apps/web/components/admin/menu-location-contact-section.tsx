'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { DoorClosed, ExternalLink, Loader2, MapPin, Phone, Wifi } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ImageUpload } from '@/components/admin/image-upload';
import { useUpdateMenu } from '@/hooks/use-menus';
import type { UpdateMenuInput } from '@/lib/validations/menu';
import type { MenuWithDetails } from '@/types/menu';

interface MenuLocationContactSectionProps {
  menu: MenuWithDetails;
}

function coordinateToInputValue(value: number | string | null | undefined): string {
  return value == null ? '' : String(value);
}

function parseCoordinate(value: string, min: number, max: number): number | null | undefined {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) return undefined;
  return parsed;
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
  const initialLocationLat = coordinateToInputValue(menu.locationLat);
  const initialLocationLng = coordinateToInputValue(menu.locationLng);

  const [address, setAddress] = useState(initialAddress);
  const [phone, setPhone] = useState(initialPhone);
  const [wifiSsid, setWifiSsid] = useState(initialWifiSsid);
  const [wifiPassword, setWifiPassword] = useState(initialWifiPassword);
  const [wcDirection, setWcDirection] = useState(initialWcDirection);
  const [wcImageUrl, setWcImageUrl] = useState(initialWcImageUrl);
  const [locationLat, setLocationLat] = useState(initialLocationLat);
  const [locationLng, setLocationLng] = useState(initialLocationLng);
  const [coordinatesError, setCoordinatesError] = useState<string | null>(null);

  const lastSyncedRef = useRef({
    address: initialAddress,
    phone: initialPhone,
    wifiSsid: initialWifiSsid,
    wifiPassword: initialWifiPassword,
    wcDirection: initialWcDirection,
    wcImageUrl: initialWcImageUrl,
    locationLat: initialLocationLat,
    locationLng: initialLocationLng,
  });

  useEffect(() => {
    const next = {
      address: menu.address || '',
      phone: menu.phone || '',
      wifiSsid: menu.wifiSsid || '',
      wifiPassword: menu.wifiPassword || '',
      wcDirection: menu.wcDirection || '',
      wcImageUrl: menu.wcImageUrl || '',
      locationLat: coordinateToInputValue(menu.locationLat),
      locationLng: coordinateToInputValue(menu.locationLng),
    };
    const prev = lastSyncedRef.current;
    if (
      prev.address !== next.address ||
      prev.phone !== next.phone ||
      prev.wifiSsid !== next.wifiSsid ||
      prev.wifiPassword !== next.wifiPassword ||
      prev.wcDirection !== next.wcDirection ||
      prev.wcImageUrl !== next.wcImageUrl ||
      prev.locationLat !== next.locationLat ||
      prev.locationLng !== next.locationLng
    ) {
      setAddress(next.address);
      setPhone(next.phone);
      setWifiSsid(next.wifiSsid);
      setWifiPassword(next.wifiPassword);
      setWcDirection(next.wcDirection);
      setWcImageUrl(next.wcImageUrl);
      setLocationLat(next.locationLat);
      setLocationLng(next.locationLng);
      setCoordinatesError(null);
      lastSyncedRef.current = next;
    }
  }, [
    menu.address,
    menu.phone,
    menu.wifiSsid,
    menu.wifiPassword,
    menu.wcDirection,
    menu.wcImageUrl,
    menu.locationLat,
    menu.locationLng,
  ]);

  const dirty = useMemo(
    () =>
      address !== initialAddress ||
      phone !== initialPhone ||
      wifiSsid !== initialWifiSsid ||
      wifiPassword !== initialWifiPassword ||
      wcDirection !== initialWcDirection ||
      wcImageUrl !== initialWcImageUrl ||
      locationLat !== initialLocationLat ||
      locationLng !== initialLocationLng,
    [
      address,
      phone,
      wifiSsid,
      wifiPassword,
      wcDirection,
      wcImageUrl,
      locationLat,
      locationLng,
      initialAddress,
      initialPhone,
      initialWifiSsid,
      initialWifiPassword,
      initialWcDirection,
      initialWcImageUrl,
      initialLocationLat,
      initialLocationLng,
    ]
  );

  const handleDiscard = useCallback(() => {
    setAddress(initialAddress);
    setPhone(initialPhone);
    setWifiSsid(initialWifiSsid);
    setWifiPassword(initialWifiPassword);
    setWcDirection(initialWcDirection);
    setWcImageUrl(initialWcImageUrl);
    setLocationLat(initialLocationLat);
    setLocationLng(initialLocationLng);
    setCoordinatesError(null);
  }, [
    initialAddress,
    initialPhone,
    initialWifiSsid,
    initialWifiPassword,
    initialWcDirection,
    initialWcImageUrl,
    initialLocationLat,
    initialLocationLng,
  ]);

  const handleSave = async () => {
    const parsedLat = parseCoordinate(locationLat, -90, 90);
    const parsedLng = parseCoordinate(locationLng, -180, 180);

    if (parsedLat === undefined || parsedLng === undefined) {
      setCoordinatesError(t('coordinatesInvalid'));
      return;
    }

    setCoordinatesError(null);

    const payload: Partial<UpdateMenuInput> = {};
    if (address !== initialAddress) payload.address = address || null;
    if (phone !== initialPhone) payload.phone = phone || null;
    if (wifiSsid !== initialWifiSsid) payload.wifiSsid = wifiSsid || null;
    if (wifiPassword !== initialWifiPassword) payload.wifiPassword = wifiPassword || null;
    if (wcDirection !== initialWcDirection) payload.wcDirection = wcDirection || null;
    if (wcImageUrl !== initialWcImageUrl) payload.wcImageUrl = wcImageUrl || null;
    if (locationLat !== initialLocationLat) payload.locationLat = parsedLat;
    if (locationLng !== initialLocationLng) payload.locationLng = parsedLng;

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
        locationLat: parsedLat == null ? '' : String(parsedLat),
        locationLng: parsedLng == null ? '' : String(parsedLng),
      };
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('saveFailed'));
    }
  };

  const saving = updateMenu.isPending;
  const pickFromMapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    address || initialAddress || ''
  )}`;

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

      {/* Map coordinates */}
      <div
        data-testid="settings-location-coordinates"
        className="rounded-[12px] border border-border-soft bg-bg p-4"
      >
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-text-default">
              <MapPin size={13} strokeWidth={1.5} aria-hidden="true" className="text-text-muted" />
              {t('coordinatesLabel')}
            </div>
            <p className="mt-1 text-[11.5px] leading-[1.45] text-text-subtle">
              {t('coordinatesHint')}
            </p>
          </div>
          <a
            href={pickFromMapsHref}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="settings-location-pick-maps"
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-accent hover:underline"
          >
            {t('pickFromGoogleMaps')}
            <ExternalLink size={12} strokeWidth={1.5} aria-hidden="true" />
          </a>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label
              htmlFor="settings-location-lat"
              className="mb-1.5 block text-[12.5px] font-semibold text-text-default"
            >
              {t('latitudeLabel')}
            </label>
            <Input
              id="settings-location-lat"
              data-testid="settings-location-lat"
              type="number"
              inputMode="decimal"
              min={-90}
              max={90}
              step="0.000001"
              value={locationLat}
              onChange={(e) => {
                setLocationLat(e.target.value);
                if (coordinatesError) setCoordinatesError(null);
              }}
              placeholder="41.7151"
              className="h-[40px] text-[13px]"
            />
          </div>
          <div>
            <label
              htmlFor="settings-location-lng"
              className="mb-1.5 block text-[12.5px] font-semibold text-text-default"
            >
              {t('longitudeLabel')}
            </label>
            <Input
              id="settings-location-lng"
              data-testid="settings-location-lng"
              type="number"
              inputMode="decimal"
              min={-180}
              max={180}
              step="0.000001"
              value={locationLng}
              onChange={(e) => {
                setLocationLng(e.target.value);
                if (coordinatesError) setCoordinatesError(null);
              }}
              placeholder="44.8271"
              className="h-[40px] text-[13px]"
            />
          </div>
        </div>
        {coordinatesError && (
          <p
            data-testid="settings-location-coordinates-error"
            className="mt-2 text-[12px] font-medium text-danger"
          >
            {coordinatesError}
          </p>
        )}
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
