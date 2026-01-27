import { auth } from '@/lib/auth/auth';
import { NextResponse } from 'next/server';
import {
  locales,
  defaultLocale,
  isValidLocale,
  LOCALE_COOKIE_NAME,
  type Locale,
} from '@/i18n/config';

// Routes that require authentication
const protectedRoutes = ['/admin'];

// Routes that should redirect authenticated users to dashboard
const authRoutes = ['/login', '/register', '/forgot-password'];

// Detect preferred locale from Accept-Language header
function getPreferredLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return defaultLocale;

  // Parse Accept-Language header (e.g., "ka,en;q=0.9,ru;q=0.8")
  const languages = acceptLanguage
    .split(',')
    .map((lang) => {
      const [code, q = 'q=1'] = lang.trim().split(';');
      const quality = parseFloat(q.replace('q=', '')) || 1;
      // Get the primary language code (e.g., "ka-GE" -> "ka")
      const primaryCode = code.split('-')[0].toLowerCase();
      return { code: primaryCode, quality };
    })
    .sort((a, b) => b.quality - a.quality);

  // Find the first matching locale
  for (const { code } of languages) {
    if (isValidLocale(code)) {
      return code;
    }
  }

  return defaultLocale;
}

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isProtectedRoute = protectedRoutes.some((route) =>
    nextUrl.pathname.startsWith(route)
  );

  const isAuthRoute = authRoutes.some(
    (route) =>
      nextUrl.pathname === route || nextUrl.pathname.startsWith(route + '/')
  );

  // Redirect unauthenticated users trying to access protected routes
  if (isProtectedRoute && !isLoggedIn) {
    const redirectUrl = new URL('/login', nextUrl.origin);
    redirectUrl.searchParams.set('callbackUrl', nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect authenticated users away from auth pages to dashboard
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL('/admin/dashboard', nextUrl.origin));
  }

  // Handle locale cookie for first-time visitors
  const response = NextResponse.next();
  const localeCookie = req.cookies.get(LOCALE_COOKIE_NAME)?.value;

  // If no locale cookie, set one based on Accept-Language header
  if (!localeCookie) {
    const acceptLanguage = req.headers.get('accept-language');
    const preferredLocale = getPreferredLocale(acceptLanguage);

    response.cookies.set(LOCALE_COOKIE_NAME, preferredLocale, {
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/',
      sameSite: 'lax',
    });
  }

  return response;
});

export const config = {
  matcher: [
    // Match all paths except static files, API routes, and locales folder
    '/((?!_next/static|_next/image|favicon.ico|locales|.*\\.(?:svg|png|jpg|jpeg|gif|webp|json)$).*)',
  ],
};
