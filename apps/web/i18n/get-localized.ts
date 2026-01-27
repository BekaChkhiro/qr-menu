import { type Locale, defaultLocale } from './config';

/**
 * Get localized value from an object with Ka/En/Ru fields
 * Falls back to Georgian (Ka) if the requested language is not available
 *
 * @example
 * const product = { nameKa: 'ყავა', nameEn: 'Coffee', nameRu: 'Кофе' };
 * getLocalizedValue(product, 'name', 'en'); // Returns 'Coffee'
 * getLocalizedValue(product, 'name', 'en'); // Returns 'ყავა' if nameEn is empty
 */
export function getLocalizedValue<T extends Record<string, unknown>>(
  obj: T,
  field: string,
  locale: Locale
): string {
  // Capitalize first letter for field suffix (e.g., 'name' -> 'Ka', 'En', 'Ru')
  const localeSuffix = locale.charAt(0).toUpperCase() + locale.slice(1);
  const localizedField = `${field}${localeSuffix}` as keyof T;
  const defaultField = `${field}${defaultLocale.charAt(0).toUpperCase() + defaultLocale.slice(1)}` as keyof T;

  // Try to get the value in the requested locale
  const value = obj[localizedField];

  // If value exists and is a non-empty string, return it
  if (typeof value === 'string' && value.trim()) {
    return value;
  }

  // Fallback to default locale (Georgian)
  const fallbackValue = obj[defaultField];
  if (typeof fallbackValue === 'string') {
    return fallbackValue;
  }

  // Last resort: return empty string
  return '';
}

/**
 * Get localized name from an object
 * Shorthand for getLocalizedValue(obj, 'name', locale)
 */
export function getLocalizedName<T extends Record<string, unknown>>(
  obj: T,
  locale: Locale
): string {
  return getLocalizedValue(obj, 'name', locale);
}

/**
 * Get localized description from an object
 * Shorthand for getLocalizedValue(obj, 'description', locale)
 */
export function getLocalizedDescription<T extends Record<string, unknown>>(
  obj: T,
  locale: Locale
): string {
  return getLocalizedValue(obj, 'description', locale);
}

/**
 * Get localized title from an object (for promotions)
 * Shorthand for getLocalizedValue(obj, 'title', locale)
 */
export function getLocalizedTitle<T extends Record<string, unknown>>(
  obj: T,
  locale: Locale
): string {
  return getLocalizedValue(obj, 'title', locale);
}
