'use client';

import { useState } from 'react';
import Image from 'next/image';
import { MapPin, Wifi, Phone, DoorClosed, Copy, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Locale } from '@/i18n/config';

interface MenuInfoWidgetProps {
  address: string | null;
  phone: string | null;
  wifiSsid: string | null;
  wifiPassword: string | null;
  wcDirection: string | null;
  wcImageUrl: string | null;
  locationLat: number | string | null;
  locationLng: number | string | null;
  locale: Locale;
}

const labels = {
  address: { ka: 'მისამართი', en: 'Address', ru: 'Адрес' },
  wifi: { ka: 'Wi-Fi', en: 'Wi-Fi', ru: 'Wi-Fi' },
  phone: { ka: 'დარეკვა', en: 'Call', ru: 'Позвонить' },
  wc: { ka: 'ტუალეტი', en: 'Restroom', ru: 'Туалет' },
  copy: { ka: 'კოპირება', en: 'Copy', ru: 'Копировать' },
  copied: { ka: 'დაკოპირდა', en: 'Copied', ru: 'Скопировано' },
  openMap: { ka: 'რუკაზე ნახვა', en: 'View on map', ru: 'На карте' },
};

export function MenuInfoWidget({
  address,
  phone,
  wifiSsid,
  wifiPassword,
  wcDirection,
  wcImageUrl,
  locationLat,
  locationLng,
  locale,
}: MenuInfoWidgetProps) {
  const hasAddress = Boolean(address || locationLat);
  const hasWifi = Boolean(wifiSsid);
  const hasPhone = Boolean(phone);
  const hasWC = Boolean(wcDirection || wcImageUrl);

  const buttons: Array<{
    id: 'address' | 'wifi' | 'phone' | 'wc';
    visible: boolean;
    icon: React.ReactNode;
    label: string;
  }> = [
    {
      id: 'address',
      visible: hasAddress,
      icon: <MapPin className="h-4 w-4" />,
      label: labels.address[locale],
    },
    {
      id: 'wifi',
      visible: hasWifi,
      icon: <Wifi className="h-4 w-4" />,
      label: labels.wifi[locale],
    },
    {
      id: 'phone',
      visible: hasPhone,
      icon: <Phone className="h-4 w-4" />,
      label: labels.phone[locale],
    },
    {
      id: 'wc',
      visible: hasWC,
      icon: <DoorClosed className="h-4 w-4" />,
      label: labels.wc[locale],
    },
  ];

  const visibleButtons = buttons.filter((b) => b.visible);
  if (visibleButtons.length === 0) return null;

  return (
    <section className="border-b bg-muted/30 px-4 py-2.5" aria-label="Menu info">
      <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-center gap-2">
        {visibleButtons.map((b) => (
          <InfoButton
            key={b.id}
            type={b.id}
            icon={b.icon}
            label={b.label}
            address={address}
            phone={phone}
            wifiSsid={wifiSsid}
            wifiPassword={wifiPassword}
            wcDirection={wcDirection}
            wcImageUrl={wcImageUrl}
            locationLat={locationLat}
            locationLng={locationLng}
            locale={locale}
          />
        ))}
      </div>
    </section>
  );
}

interface InfoButtonProps {
  type: 'address' | 'wifi' | 'phone' | 'wc';
  icon: React.ReactNode;
  label: string;
  address: string | null;
  phone: string | null;
  wifiSsid: string | null;
  wifiPassword: string | null;
  wcDirection: string | null;
  wcImageUrl: string | null;
  locationLat: number | string | null;
  locationLng: number | string | null;
  locale: Locale;
}

function InfoButton({
  type,
  icon,
  label,
  address,
  phone,
  wifiSsid,
  wifiPassword,
  wcDirection,
  wcImageUrl,
  locationLat,
  locationLng,
  locale,
}: InfoButtonProps) {
  // Phone opens native tel: link
  if (type === 'phone' && phone) {
    return (
      <a
        href={`tel:${phone.replace(/\s+/g, '')}`}
        className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-xs font-medium shadow-sm transition-colors hover:bg-accent"
      >
        {icon}
        <span>{label}</span>
      </a>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-xs font-medium shadow-sm transition-colors hover:bg-accent"
        >
          {icon}
          <span>{label}</span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {icon}
            {label}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {type === 'address' && (
            <AddressContent
              address={address}
              locationLat={locationLat}
              locationLng={locationLng}
              locale={locale}
            />
          )}
          {type === 'wifi' && (
            <WifiContent ssid={wifiSsid} password={wifiPassword} locale={locale} />
          )}
          {type === 'wc' && (
            <WCContent direction={wcDirection} imageUrl={wcImageUrl} locale={locale} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddressContent({
  address,
  locationLat,
  locationLng,
  locale,
}: {
  address: string | null;
  locationLat: number | string | null;
  locationLng: number | string | null;
  locale: Locale;
}) {
  const mapUrl =
    locationLat && locationLng
      ? `https://www.google.com/maps/search/?api=1&query=${locationLat},${locationLng}`
      : address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
      : null;

  return (
    <>
      {address && <p className="text-sm">{address}</p>}
      {mapUrl && (
        <Button asChild variant="outline" className="w-full">
          <a href={mapUrl} target="_blank" rel="noopener noreferrer">
            <MapPin className="mr-2 h-4 w-4" />
            {labels.openMap[locale]}
          </a>
        </Button>
      )}
    </>
  );
}

function WifiContent({
  ssid,
  password,
  locale,
}: {
  ssid: string | null;
  password: string | null;
  locale: Locale;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!password) return;
    await navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {ssid && (
        <div>
          <p className="text-xs text-muted-foreground">SSID</p>
          <p className="text-sm font-semibold">{ssid}</p>
        </div>
      )}
      {password && (
        <div>
          <p className="text-xs text-muted-foreground">Password</p>
          <div className="flex items-center gap-2">
            <p className="flex-1 font-mono text-sm">{password}</p>
            <Button size="sm" variant="outline" onClick={handleCopy}>
              {copied ? (
                <>
                  <Check className="mr-1 h-3 w-3" />
                  {labels.copied[locale]}
                </>
              ) : (
                <>
                  <Copy className="mr-1 h-3 w-3" />
                  {labels.copy[locale]}
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

function WCContent({
  direction,
  imageUrl,
  locale,
}: {
  direction: string | null;
  imageUrl: string | null;
  locale: Locale;
}) {
  return (
    <>
      {imageUrl && (
        <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
          <Image
            src={imageUrl}
            alt={labels.wc[locale]}
            fill
            className="object-cover"
            sizes="320px"
          />
        </div>
      )}
      {direction && <p className="whitespace-pre-wrap text-sm">{direction}</p>}
    </>
  );
}
