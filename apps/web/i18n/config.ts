// Supported locales for the application
export const locales = ['ka', 'en', 'ru'] as const;

// Default locale (Georgian)
export const defaultLocale = 'ka' as const;

// Type for supported locales
export type Locale = (typeof locales)[number];

// Language display names
export const localeNames: Record<Locale, string> = {
  ka: 'ქართული',
  en: 'English',
  ru: 'Русский',
};

// Language flags (emoji)
export const localeFlags: Record<Locale, string> = {
  ka: '🇬🇪',
  en: '🇬🇧',
  ru: '🇷🇺',
};

// Check if a string is a valid locale
export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

// Get locale from cookie value or return default
export function getLocaleFromCookie(cookieValue: string | undefined): Locale {
  if (cookieValue && isValidLocale(cookieValue)) {
    return cookieValue;
  }
  return defaultLocale;
}

// Cookie name for storing user's preferred locale
export const LOCALE_COOKIE_NAME = 'NEXT_LOCALE';
