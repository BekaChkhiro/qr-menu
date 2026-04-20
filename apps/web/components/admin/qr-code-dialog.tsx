'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Download, QrCode, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
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
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ImageUpload } from '@/components/admin/image-upload';
import { useMenu, useUpdateMenu } from '@/hooks/use-menus';
import type { QrStyle } from '@/types/menu';

type QRFormat = 'png' | 'svg';
type QRSize = 'small' | 'medium' | 'large';

interface QRCodeDialogProps {
  menuId: string;
  menuName: string;
  menuSlug: string;
}

const SIZE_LABELS: Record<QRSize, { label: string; pixels: string }> = {
  small: { label: 'Small', pixels: '200×200' },
  medium: { label: 'Medium', pixels: '400×400' },
  large: { label: 'Large', pixels: '800×800' },
};

// Design templates (visual presets)
interface Template {
  id: string;
  label: string;
  fg: string;
  bg: string;
  style: QrStyle;
}

const TEMPLATES: Template[] = [
  { id: 'classic', label: 'Classic', fg: '#000000', bg: '#ffffff', style: 'SQUARE' },
  { id: 'midnight', label: 'Midnight', fg: '#0f172a', bg: '#f8fafc', style: 'ROUNDED' },
  { id: 'emerald', label: 'Emerald', fg: '#047857', bg: '#ffffff', style: 'DOTS' },
  { id: 'sunset', label: 'Sunset', fg: '#c2410c', bg: '#fff7ed', style: 'ROUNDED' },
  { id: 'royal', label: 'Royal', fg: '#4c1d95', bg: '#faf5ff', style: 'DOTS' },
  { id: 'rose', label: 'Rose', fg: '#be123c', bg: '#fff1f2', style: 'ROUNDED' },
];

export function QRCodeDialog({ menuId, menuName, menuSlug }: QRCodeDialogProps) {
  const t = useTranslations('admin');
  const tActions = useTranslations('actions');
  const [open, setOpen] = useState(false);

  const { data: menu } = useMenu(open ? menuId : undefined);
  const updateMenu = useUpdateMenu(menuId);

  const [format, setFormat] = useState<QRFormat>('png');
  const [size, setSize] = useState<QRSize>('medium');
  const [fg, setFg] = useState('#000000');
  const [bg, setBg] = useState('#ffffff');
  const [style, setStyle] = useState<QrStyle>('SQUARE');
  const [useLogo, setUseLogo] = useState(true);
  const [customLogo, setCustomLogo] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [previewVersion, setPreviewVersion] = useState(0);

  // Load from menu when it arrives
  useEffect(() => {
    if (menu) {
      setFg(menu.qrForegroundColor || '#000000');
      setBg(menu.qrBackgroundColor || '#ffffff');
      setStyle(menu.qrStyle || 'SQUARE');
      setCustomLogo(menu.qrLogoUrl || null);
      // Bump preview after menu loads
      setPreviewVersion((v) => v + 1);
    }
  }, [menu]);

  // Debounced refresh when user edits
  useEffect(() => {
    if (!open) return;
    const id = setTimeout(() => setPreviewVersion((v) => v + 1), 400);
    return () => clearTimeout(id);
  }, [fg, bg, style, useLogo, customLogo, open]);

  const logoParam = useLogo
    ? customLogo && customLogo !== menu?.qrLogoUrl
      ? encodeURIComponent(customLogo)
      : 'menu'
    : 'none';

  const buildPreviewUrl = (s: QRSize, f: QRFormat) => {
    const params = new URLSearchParams({
      format: f,
      size: s,
      fg,
      bg,
      style,
      logo: logoParam,
      t: String(previewVersion),
    });
    return `/api/qr/${menuId}?${params.toString()}`;
  };

  const previewUrl = buildPreviewUrl('medium', 'png');
  const downloadUrl = `${buildPreviewUrl(size, format)}&download=true`;

  const applyTemplate = (tpl: Template) => {
    setFg(tpl.fg);
    setBg(tpl.bg);
    setStyle(tpl.style);
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
    } catch {
      toast.error('Download failed');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSaveToMenu = async () => {
    try {
      await updateMenu.mutateAsync({
        qrStyle: style,
        qrForegroundColor: fg,
        qrBackgroundColor: bg,
        qrLogoUrl: useLogo ? customLogo : null,
      });
      toast.success('QR design saved');
    } catch {
      toast.error('Failed to save QR design');
    }
  };

  const publicUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/m/${menuSlug}`
      : `/m/${menuSlug}`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-full bg-white">
          <QrCode className="mr-2 h-4 w-4" />
          {t('qr.button')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('qr.title')}</DialogTitle>
          <DialogDescription>
            {t('qr.description', { name: menuName })}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-2 sm:grid-cols-[220px_1fr]">
          {/* ── Preview ── */}
          <div className="flex flex-col items-center gap-3">
            <div
              className="relative rounded-lg border p-3 shadow-sm"
              style={{ backgroundColor: bg }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt={`QR Code for ${menuName}`}
                className="h-44 w-44"
              />
            </div>
            <div className="w-full rounded-md bg-muted p-2 text-center">
              <p className="break-all font-mono text-[10px] text-muted-foreground">
                {publicUrl}
              </p>
            </div>
          </div>

          {/* ── Controls ── */}
          <div>
            <Tabs defaultValue="design" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="design" className="flex-1">Design</TabsTrigger>
                <TabsTrigger value="templates" className="flex-1">Templates</TabsTrigger>
                <TabsTrigger value="export" className="flex-1">Export</TabsTrigger>
              </TabsList>

              <TabsContent value="design" className="space-y-3 pt-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Foreground</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={fg}
                        onChange={(e) => setFg(e.target.value)}
                        className="h-9 w-12 cursor-pointer rounded border"
                      />
                      <Input value={fg} onChange={(e) => setFg(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Background</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={bg}
                        onChange={(e) => setBg(e.target.value)}
                        className="h-9 w-12 cursor-pointer rounded border"
                      />
                      <Input value={bg} onChange={(e) => setBg(e.target.value)} />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Style</Label>
                  <Select value={style} onValueChange={(v) => setStyle(v as QrStyle)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SQUARE">Square (classic)</SelectItem>
                      <SelectItem value="ROUNDED">Rounded</SelectItem>
                      <SelectItem value="DOTS">Dots</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Logo overlay</Label>
                      <p className="text-xs text-muted-foreground">
                        ლოგო ცენტრში (20% ზომის)
                      </p>
                    </div>
                    <Switch checked={useLogo} onCheckedChange={setUseLogo} />
                  </div>
                  {useLogo && (
                    <div className="mt-3">
                      <ImageUpload
                        value={customLogo}
                        onChange={(url) => setCustomLogo(url)}
                        preset="logo"
                        aspectRatio="square"
                      />
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="templates" className="pt-3">
                <div className="grid grid-cols-3 gap-2">
                  {TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => applyTemplate(tpl)}
                      className="group flex flex-col items-center rounded-lg border p-2 transition-all hover:border-primary hover:shadow-md"
                    >
                      <div
                        className="h-16 w-16 rounded border"
                        style={{
                          background: `linear-gradient(135deg, ${tpl.bg} 0%, ${tpl.bg} 40%, ${tpl.fg} 100%)`,
                        }}
                      />
                      <span className="mt-1.5 text-xs font-medium">{tpl.label}</span>
                    </button>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="export" className="space-y-3 pt-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="format">Format</Label>
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
                  <div className="space-y-1.5">
                    <Label htmlFor="size">Size</Label>
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
                <p className="text-xs text-muted-foreground">
                  SVG არ უჭერს მხარს ლოგოს ოვერლეას. PNG უკეთესია ლოგოთი.
                </p>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleSaveToMenu}
            disabled={updateMenu.isPending}
          >
            {updateMenu.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save to menu
          </Button>
          <Button onClick={handleDownload} disabled={isDownloading}>
            {isDownloading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {tActions('download')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
