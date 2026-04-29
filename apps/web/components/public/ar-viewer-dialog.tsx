'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import type { Locale } from '@/i18n/config';

interface ArViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  glbUrl: string;
  usdzUrl?: string | null;
  posterUrl?: string | null;
  alt: string;
  locale: Locale;
}

const TITLE: Record<Locale, string> = {
  ka: 'AR ხედვა',
  en: 'View in AR',
  ru: 'Просмотр в AR',
};

const LOADING: Record<Locale, string> = {
  ka: '3D მოდელის ჩატვირთვა…',
  en: 'Loading 3D model…',
  ru: 'Загрузка 3D-модели…',
};

export function ArViewerDialog({
  open,
  onOpenChange,
  glbUrl,
  usdzUrl,
  posterUrl,
  alt,
  locale,
}: ArViewerDialogProps) {
  const [ready, setReady] = useState(false);

  // Lazy-load `@google/model-viewer` only when the dialog opens. This keeps the
  // public bundle slim — the ~250KB module never ships unless a visitor taps
  // an AR chip.
  useEffect(() => {
    if (!open || ready) return;
    let cancelled = false;
    import('@google/model-viewer').then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [open, ready]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="grid h-[100dvh] w-screen max-w-none grid-rows-[auto_1fr] gap-0 rounded-none border-0 bg-background p-0 sm:h-[88vh] sm:max-w-[640px] sm:rounded-[12px] sm:border"
        data-testid="ar-viewer-dialog"
      >
        <DialogTitle className="px-5 pt-5 pb-3 text-[15px] font-semibold tracking-tight">
          {TITLE[locale]}
        </DialogTitle>
        <div
          className="relative overflow-hidden bg-[radial-gradient(circle_at_center,_#FAF7F1_0%,_#EDE7DA_100%)]"
          data-testid="ar-viewer-stage"
        >
          {!ready ? (
            <div
              className="flex h-full w-full items-center justify-center gap-2 text-[13px] text-muted-foreground"
              data-testid="ar-viewer-loading"
            >
              <Loader2 className="h-4 w-4 animate-spin" />
              {LOADING[locale]}
            </div>
          ) : (
            <model-viewer
              src={glbUrl}
              ios-src={usdzUrl ?? undefined}
              alt={alt}
              poster={posterUrl ?? undefined}
              camera-controls
              ar
              ar-modes="scene-viewer quick-look webxr"
              reveal="interaction"
              shadow-intensity="0.7"
              exposure="0.95"
              loading="eager"
              style={{ width: '100%', height: '100%' }}
              data-testid="ar-viewer-model"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
