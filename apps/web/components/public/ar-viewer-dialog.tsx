'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import type { Locale } from '@/i18n/config';
import { arStrings } from './product-card-shared';

interface ArViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  glbUrl: string;
  usdzUrl?: string | null;
  posterUrl?: string | null;
  alt: string;
  locale: Locale;
}

export function ArViewerDialog({
  open,
  onOpenChange,
  glbUrl,
  usdzUrl,
  alt,
  locale,
}: ArViewerDialogProps) {
  const [ready, setReady] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const viewerRef = useRef<HTMLElement | null>(null);
  const ar = arStrings[locale];

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

  // Reset the loaded flag whenever the dialog re-opens or the GLB url changes,
  // so the spinner shows again on the next open instead of flashing the prior
  // model for a frame.
  useEffect(() => {
    if (!open) setModelLoaded(false);
  }, [open, glbUrl]);

  // <model-viewer> is a custom element, so React's onLoad doesn't apply.
  // Subscribe imperatively via the DOM node ref. Some implementations expose
  // a `loaded` boolean that may already be true if the model finished while
  // the listener was being attached — read it once on mount as a fallback.
  useEffect(() => {
    if (!ready) return;
    const el = viewerRef.current;
    if (!el) return;
    const handle = () => setModelLoaded(true);
    el.addEventListener('load', handle);
    if ((el as unknown as { loaded?: boolean }).loaded) handle();
    return () => el.removeEventListener('load', handle);
  }, [ready, glbUrl]);

  const showLoading = !ready || !modelLoaded;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="grid h-[100dvh] w-screen max-w-none grid-rows-[auto_1fr] gap-0 rounded-none border-0 bg-background p-0 sm:h-[88vh] sm:max-w-[640px] sm:rounded-[12px] sm:border"
        data-testid="ar-viewer-dialog"
      >
        <DialogTitle className="px-5 pt-5 pb-3 text-[15px] font-semibold tracking-tight">
          {ar.viewButton}
        </DialogTitle>
        <div
          className="relative overflow-hidden bg-[radial-gradient(circle_at_center,_#FAF7F1_0%,_#EDE7DA_100%)]"
          data-testid="ar-viewer-stage"
        >
          {ready && (
            <model-viewer
              ref={viewerRef}
              src={glbUrl}
              ios-src={usdzUrl ?? undefined}
              alt={alt}
              camera-controls
              auto-rotate
              ar
              ar-modes="scene-viewer quick-look webxr"
              reveal="auto"
              shadow-intensity="0.7"
              exposure="0.95"
              loading="eager"
              style={{ width: '100%', height: '100%' }}
              data-testid="ar-viewer-model"
            />
          )}
          {showLoading && (
            <div
              className="absolute inset-0 flex items-center justify-center gap-2 bg-[radial-gradient(circle_at_center,_#FAF7F1_0%,_#EDE7DA_100%)] text-[13px] text-muted-foreground"
              data-testid="ar-viewer-loading"
            >
              <Loader2 className="h-4 w-4 animate-spin" />
              {ar.loading}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
