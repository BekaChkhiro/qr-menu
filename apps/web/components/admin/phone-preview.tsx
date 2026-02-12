'use client';

import { type ReactNode, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- Frame geometry (matching mobile-component.png proportions) ---
const FRAME_WIDTH = 300;
const FRAME_HEIGHT = 629; // aspect ratio 144:302
const BORDER = 4;
const OUTER_RADIUS = 46;
const INNER_RADIUS = OUTER_RADIUS - BORDER; // 42

// Screen = interior of the frame
const SCREEN_W = FRAME_WIDTH - BORDER * 2; // 292
const SCREEN_H = FRAME_HEIGHT - BORDER * 2; // 621

// Dynamic Island
const DI_WIDTH = 90;
const DI_HEIGHT = 26;
const DI_TOP = 12; // from screen top

// Status bar covers DI area
const STATUS_BAR_H = DI_TOP + DI_HEIGHT + 6; // 44

// Content scaling (375px mobile viewport → screen width)
const CONTENT_WIDTH = 375;
const CONTENT_SCALE = SCREEN_W / CONTENT_WIDTH; // ~0.779
const CONTENT_AREA_H = SCREEN_H - STATUS_BAR_H; // 577
const CONTENT_HEIGHT = Math.ceil(CONTENT_AREA_H / CONTENT_SCALE);

// iframe uses same height as children mode
const IFRAME_HEIGHT = CONTENT_HEIGHT;

interface PhonePreviewProps {
  children?: ReactNode;
  url?: string;
  className?: string;
}

function StatusBar() {
  return (
    <div
      className="relative flex items-end justify-between px-7 pb-1.5"
      style={{ height: STATUS_BAR_H }}
    >
      {/* Time */}
      <span className="text-[11px] font-semibold leading-none text-foreground">
        9:41
      </span>

      {/* Signal, WiFi, Battery */}
      <div className="flex items-center gap-1">
        <svg width="14" height="10" viewBox="0 0 14 10" fill="none" className="text-foreground">
          <rect x="0" y="7" width="2.5" height="3" rx="0.5" fill="currentColor" />
          <rect x="3.5" y="5" width="2.5" height="5" rx="0.5" fill="currentColor" />
          <rect x="7" y="2.5" width="2.5" height="7.5" rx="0.5" fill="currentColor" />
          <rect x="10.5" y="0" width="2.5" height="10" rx="0.5" fill="currentColor" />
        </svg>
        <svg width="13" height="10" viewBox="0 0 13 10" fill="none" className="text-foreground">
          <path d="M6.5 8.5a1.25 1.25 0 110 2.5 1.25 1.25 0 010-2.5z" fill="currentColor" />
          <path d="M3.75 7.25a4 4 0 015.5 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M1.5 4.75a7 7 0 0110 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
        <svg width="22" height="10" viewBox="0 0 22 10" fill="none" className="text-foreground">
          <rect x="0.5" y="0.5" width="18" height="9" rx="2" stroke="currentColor" strokeWidth="1" />
          <rect x="2" y="2" width="14" height="6" rx="1" fill="currentColor" />
          <path d="M20 3.5v3a1.5 1.5 0 000-3z" fill="currentColor" opacity="0.4" />
        </svg>
      </div>
    </div>
  );
}

export function PhonePreview({ children, url, className }: PhonePreviewProps) {
  const [iframeLoaded, setIframeLoaded] = useState(false);

  return (
    <div className={cn('hidden lg:block', className)}>
      {/* Phone Frame */}
      <div
        className="relative mx-auto"
        style={{
          width: FRAME_WIDTH,
          height: FRAME_HEIGHT,
          border: `${BORDER}px solid #2e2e2e`,
          borderRadius: OUTER_RADIUS,
          boxShadow: '0 0 0 1.5px #adadad',
        }}
        role="img"
        aria-label="Phone preview"
      >
        {/* Screen */}
        <div
          className="relative h-full w-full overflow-hidden bg-white dark:bg-gray-950"
          style={{ borderRadius: INNER_RADIUS }}
        >
          {/* Dynamic Island (always on top) */}
          <div
            className="absolute left-1/2 z-20 rounded-full bg-black"
            style={{
              width: DI_WIDTH,
              height: DI_HEIGHT,
              top: DI_TOP,
              marginLeft: -(DI_WIDTH / 2),
            }}
          />

          {/* Status Bar (overlay on top of content) */}
          <div className="absolute inset-x-0 top-0 z-10 bg-white dark:bg-gray-950">
            <StatusBar />
          </div>

          {/* Content area (below status bar) */}
          <div className="relative" style={{ paddingTop: STATUS_BAR_H }}>
            {url ? (
              <>
                {/* Scaled iframe (always in DOM to avoid layout shift) */}
                <div
                  style={{
                    width: CONTENT_WIDTH,
                    height: IFRAME_HEIGHT,
                    transform: `scale(${CONTENT_SCALE})`,
                    transformOrigin: 'top left',
                  }}
                >
                  <iframe
                    src={url}
                    title="Menu preview"
                    className={cn(
                      'border-0 transition-opacity duration-300',
                      iframeLoaded ? 'opacity-100' : 'opacity-0',
                    )}
                    style={{ width: CONTENT_WIDTH, height: IFRAME_HEIGHT }}
                    onLoad={() => setIframeLoaded(true)}
                  />
                </div>

                {/* Loading overlay (on top of iframe, disappears when loaded) */}
                {!iframeLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-950"
                    style={{ top: STATUS_BAR_H }}
                  >
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                )}
              </>
            ) : (
              <div
                style={{
                  width: CONTENT_WIDTH,
                  height: CONTENT_HEIGHT,
                  transform: `scale(${CONTENT_SCALE})`,
                  transformOrigin: 'top left',
                }}
              >
                <div
                  className="scrollbar-hide overflow-y-auto"
                  style={{ width: CONTENT_WIDTH, height: CONTENT_HEIGHT }}
                >
                  {children}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function PhonePreviewSkeleton() {
  return (
    <div className="hidden lg:block">
      <div
        className="relative mx-auto"
        style={{
          width: FRAME_WIDTH,
          height: FRAME_HEIGHT,
          border: `${BORDER}px solid #2e2e2e`,
          borderRadius: OUTER_RADIUS,
          boxShadow: '0 0 0 1.5px #adadad',
        }}
      >
        <div
          className="relative h-full w-full overflow-hidden bg-white dark:bg-gray-950"
          style={{ borderRadius: INNER_RADIUS }}
        >
          <div
            className="absolute left-1/2 z-20 rounded-full bg-black"
            style={{
              width: DI_WIDTH,
              height: DI_HEIGHT,
              top: DI_TOP,
              marginLeft: -(DI_WIDTH / 2),
            }}
          />

          <div className="absolute inset-x-0 top-0 z-10 bg-white dark:bg-gray-950">
            <div
              className="flex items-end justify-between px-7 pb-1.5"
              style={{ height: STATUS_BAR_H }}
            >
              <div className="h-2.5 w-8 animate-pulse rounded bg-muted" />
              <div className="h-2.5 w-14 animate-pulse rounded bg-muted" />
            </div>
          </div>

          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>
    </div>
  );
}
