// T21.6 — Public-menu font loading & coherence.
//
// The Branding tab (apps/web/components/admin/branding-tab.tsx) writes the same
// value to both `headingFont` and `bodyFont`, but the public menu was only
// declaring the CSS variables without ever actually applying them to body
// text or most headings, and the Google Fonts stylesheets for the non-default
// presets were never loaded. This module provides the stylesheet href used by
// the public menu pages so the selected preset renders correctly.

const GOOGLE_FONT_FAMILY: Record<string, string> = {
  Inter: 'Inter:wght@400;500;600;700',
  'Playfair Display': 'Playfair+Display:wght@400;500;600;700',
  'Noto Sans Georgian': 'Noto+Sans+Georgian:wght@400;500;600;700',
  Lora: 'Lora:wght@400;500;600;700',
  // BPG Arial is a proprietary Georgian font not hosted on Google Fonts.
  // It will fall back to the generic sans-serif stack if not installed.
};

export function getGoogleFontHref(family: string | null | undefined): string | null {
  if (!family) return null;
  const spec = GOOGLE_FONT_FAMILY[family];
  if (!spec) return null;
  return `https://fonts.googleapis.com/css2?family=${spec}&display=swap`;
}

// Wrap a font family in quotes and append a sensible fallback stack so unknown
// families still render readable text. The Branding tab persists raw family
// names like `Playfair Display` — quoting handles the space and the trailing
// generic family covers fallback.
export function toFontFamilyStack(family: string | null | undefined): string | null {
  if (!family) return null;
  return `"${family}", system-ui, -apple-system, sans-serif`;
}
