'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Download, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

type QRFormat = 'png' | 'svg';
type QRSize = 'small' | 'medium' | 'large';

interface QRCodeDialogProps {
  menuId: string;
  menuName: string;
  menuSlug: string;
}

const SIZE_LABELS: Record<QRSize, { label: string; pixels: string }> = {
  small: { label: 'Small', pixels: '200x200' },
  medium: { label: 'Medium', pixels: '400x400' },
  large: { label: 'Large', pixels: '800x800' },
};

export function QRCodeDialog({ menuId, menuName, menuSlug }: QRCodeDialogProps) {
  const t = useTranslations('admin');
  const tActions = useTranslations('actions');
  const [format, setFormat] = useState<QRFormat>('png');
  const [size, setSize] = useState<QRSize>('medium');
  const [isDownloading, setIsDownloading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const qrApiUrl = `/api/qr/${menuId}?format=${format}&size=${size}`;
  const downloadUrl = `${qrApiUrl}&download=true`;

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      // Set preview URL when dialog opens
      setPreviewUrl(`/api/qr/${menuId}?format=png&size=medium&t=${Date.now()}`);
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error('Failed to download QR code');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qr-${menuSlug}-${size}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const publicUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/m/${menuSlug}`
    : `/m/${menuSlug}`;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <QrCode className="mr-2 h-4 w-4" />
          {t('qr.button')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('qr.title')}</DialogTitle>
          <DialogDescription>
            {t('qr.description', { name: menuName })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* QR Code Preview */}
          <div className="flex justify-center">
            <div className="rounded-lg border bg-white p-4">
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt={`QR Code for ${menuName}`}
                  className="h-48 w-48"
                />
              ) : (
                <div className="flex h-48 w-48 items-center justify-center bg-muted">
                  <QrCode className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
            </div>
          </div>

          {/* Public URL Display */}
          <div className="rounded-md bg-muted p-3">
            <p className="text-xs text-muted-foreground">{t('qr.publicUrl')}</p>
            <p className="mt-1 break-all font-mono text-sm">{publicUrl}</p>
          </div>

          {/* Options */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="format">{t('qr.format')}</Label>
              <Select value={format} onValueChange={(v) => setFormat(v as QRFormat)}>
                <SelectTrigger id="format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="png">PNG</SelectItem>
                  <SelectItem value="svg">SVG</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="size">{t('qr.size')}</Label>
              <Select value={size} onValueChange={(v) => setSize(v as QRSize)}>
                <SelectTrigger id="size">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SIZE_LABELS).map(([key, { label, pixels }]) => (
                    <SelectItem key={key} value={key}>
                      {label} ({pixels})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => window.open(qrApiUrl, '_blank')}
          >
            {tActions('preview')}
          </Button>
          <Button
            className="w-full sm:w-auto"
            onClick={handleDownload}
            disabled={isDownloading}
          >
            <Download className="mr-2 h-4 w-4" />
            {isDownloading ? t('qr.downloading') : tActions('download')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
