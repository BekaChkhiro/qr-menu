// i18n configuration and utilities
export {
  locales,
  defaultLocale,
  localeNames,
  localeFlags,
  isValidLocale,
  getLocaleFromCookie,
  LOCALE_COOKIE_NAME,
  type Locale,
} from './config';

export {
  getLocalizedValue,
  getLocalizedName,
  getLocalizedDescription,
  getLocalizedTitle,
} from './get-localized';
