'use client';

import { type ReactNode, useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

// --- Frame geometry (matching mobile-component.png proportions) ---
const FRAME_WIDTH = 300;
const FRAME_HEIGHT = 629; // aspect ratio 144:302
const BORDER = 9;
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
  /** Change this value to trigger an iframe reload */
  refreshKey?: number;
}

function StatusBar() {
  return (
    <div
      className="relative flex items-center justify-between px-4 pt-[5px]"
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

/** Skeleton that mimics a menu loading inside the phone screen */
function MenuScreenSkeleton() {
  return (
    <div className="p-4" style={{ paddingTop: STATUS_BAR_H + 12 }}>
      {/* Restaurant header */}
      <div className="flex items-center gap-3 pb-4">
        <div className="h-10 w-10 rounded-full animate-shimmer" />
        <div className="space-y-2 flex-1">
          <div className="h-4 w-28 rounded animate-shimmer" />
          <div className="h-3 w-20 rounded animate-shimmer" />
        </div>
      </div>

      {/* Category pills */}
      <div className="flex gap-2 pb-5 border-b border-border/30">
        <div className="h-7 w-16 rounded-full animate-shimmer" />
        <div className="h-7 w-20 rounded-full animate-shimmer animation-delay-100" />
        <div className="h-7 w-14 rounded-full animate-shimmer animation-delay-200" />
        <div className="h-7 w-18 rounded-full animate-shimmer animation-delay-300" />
      </div>

      {/* Category title */}
      <div className="pt-5 pb-3">
        <div className="h-5 w-24 rounded animate-shimmer" />
      </div>

      {/* Product cards */}
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex gap-3 rounded-xl border border-border/20 p-3"
          >
            <div className="flex-1 space-y-2">
              <div
                className="h-4 rounded animate-shimmer"
                style={{
                  width: `${70 - i * 10}%`,
                  animationDelay: `${i * 150}ms`,
                }}
              />
              <div
                className="h-3 rounded animate-shimmer"
                style={{
                  width: `${90 - i * 15}%`,
                  animationDelay: `${i * 150 + 75}ms`,
                }}
              />
              <div
                className="h-3.5 w-14 rounded animate-shimmer"
                style={{ animationDelay: `${i * 150 + 150}ms` }}
              />
            </div>
            <div
              className="h-16 w-16 flex-shrink-0 rounded-lg animate-shimmer"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          </div>
        ))}
      </div>

      {/* Second category */}
      <div className="pt-6 pb-3">
        <div className="h-5 w-32 rounded animate-shimmer animation-delay-300" />
      </div>
      <div className="space-y-3">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="flex gap-3 rounded-xl border border-border/20 p-3"
          >
            <div className="flex-1 space-y-2">
              <div
                className="h-4 rounded animate-shimmer"
                style={{
                  width: `${65 - i * 15}%`,
                  animationDelay: `${400 + i * 150}ms`,
                }}
              />
              <div
                className="h-3 rounded animate-shimmer"
                style={{
                  width: `${85 - i * 20}%`,
                  animationDelay: `${400 + i * 150 + 75}ms`,
                }}
              />
            </div>
            <div
              className="h-16 w-16 flex-shrink-0 rounded-lg animate-shimmer"
              style={{ animationDelay: `${400 + i * 150}ms` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PhonePreview({ children, url, className, refreshKey }: PhonePreviewProps) {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const isFirstRender = useRef(true);

  const reloadIframe = useCallback(() => {
    if (!iframeRef.current?.contentWindow) return;
    setIframeLoaded(false);
    iframeRef.current.contentWindow.location.reload();
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    reloadIframe();
  }, [refreshKey, reloadIframe]);

  return (
    <div className={cn('hidden lg:block', className)}>
      {/* Phone Frame */}
      <div
        className="relative mx-auto"
        style={{
          width: FRAME_WIDTH,
          height: FRAME_HEIGHT,
          border: `${BORDER}px solid #000000`,
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
                  className="overflow-hidden"
                  style={{
                    width: CONTENT_WIDTH,
                    height: IFRAME_HEIGHT,
                    transform: `scale(${CONTENT_SCALE})`,
                    transformOrigin: 'top left',
                  }}
                >
                  <iframe
                    ref={iframeRef}
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
                  <div className="absolute inset-0 overflow-hidden bg-white dark:bg-gray-950"
                    style={{ top: 0 }}
                  >
                    <MenuScreenSkeleton />
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
          border: `${BORDER}px solid #000000`,
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
            <StatusBar />
          </div>

          <MenuScreenSkeleton />
        </div>
      </div>
    </div>
  );
}
