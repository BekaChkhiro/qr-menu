'use client';

import { useEffect, useRef } from 'react';

interface ViewTrackerProps {
  menuId: string;
}

// Session storage key for tracking viewed menus
const VIEWED_MENUS_KEY = 'dm_viewed_menus';

// Get viewed menus from session storage
function getViewedMenus(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const stored = sessionStorage.getItem(VIEWED_MENUS_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

// Mark a menu as viewed in session storage
function markMenuViewed(menuId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const viewed = getViewedMenus();
    viewed.add(menuId);
    sessionStorage.setItem(VIEWED_MENUS_KEY, JSON.stringify([...viewed]));
  } catch {
    // Silently fail if session storage is not available
  }
}

export function ViewTracker({ menuId }: ViewTrackerProps) {
  const hasTracked = useRef(false);

  useEffect(() => {
    // Only track once per component mount
    if (hasTracked.current) return;
    hasTracked.current = true;

    // Check if already viewed in this session (client-side debounce)
    const viewedMenus = getViewedMenus();
    if (viewedMenus.has(menuId)) {
      return; // Already viewed in this session
    }

    // Track the view
    const trackView = async () => {
      try {
        const response = await fetch(`/api/menus/${menuId}/views`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          // Mark as viewed in session storage (regardless of server debounce)
          markMenuViewed(menuId);
        }
      } catch (error) {
        // Silently fail - view tracking should not break the page
        console.error('Failed to track view:', error);
      }
    };

    // Small delay to ensure page has loaded and user is actually viewing
    const timeoutId = setTimeout(trackView, 500);

    return () => clearTimeout(timeoutId);
  }, [menuId]);

  // This component doesn't render anything
  return null;
}
