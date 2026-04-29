'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { CSSProperties } from 'react';

// `<model-viewer>` is a custom element registered by `@google/model-viewer`.
// JSX needs an ambient type for it. React 19 moved the JSX namespace out of
// the global scope, so the augmentation lives under `react`.
interface ModelViewerElementAttributes
  extends React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> {
  src?: string;
  'ios-src'?: string;
  alt?: string;
  ar?: boolean | '';
  'camera-controls'?: boolean | '';
  'auto-rotate'?: boolean | '';
  poster?: string;
  'shadow-intensity'?: string | number;
  exposure?: string | number;
  'ar-modes'?: string;
  loading?: 'auto' | 'lazy' | 'eager';
  reveal?: 'auto' | 'interaction' | 'manual';
}

declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': ModelViewerElementAttributes;
    }
  }
}

interface ModelViewerProps {
  src: string;
  iosSrc?: string | null;
  alt?: string;
  poster?: string | null;
  className?: string;
  style?: CSSProperties;
  loadingLabel?: string;
}

export function ModelViewer({
  src,
  iosSrc,
  alt,
  poster,
  className,
  style,
  loadingLabel = 'Loading model…',
}: ModelViewerProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    import('@google/model-viewer').then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <div
        className={className}
        style={style}
        data-testid="ar-model-viewer-loading"
      >
        <div className="flex h-full w-full items-center justify-center gap-2 text-[12px] text-text-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          {loadingLabel}
        </div>
      </div>
    );
  }

  return (
    <model-viewer
      src={src}
      ios-src={iosSrc ?? undefined}
      alt={alt}
      poster={poster ?? undefined}
      camera-controls
      auto-rotate
      shadow-intensity="0.6"
      exposure="0.9"
      ar
      ar-modes="webxr scene-viewer quick-look"
      loading="lazy"
      reveal="auto"
      className={className}
      style={style}
      data-testid="ar-model-viewer"
    />
  );
}
