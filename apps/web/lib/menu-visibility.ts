import { createHmac, timingSafeEqual } from 'node:crypto';
import type { MenuVisibility } from '@/lib/validations';

export const MENU_PASS_COOKIE_PREFIX = 'menu-pass-';
export const MENU_PASS_COOKIE_TTL_SECONDS = 60 * 60 * 24; // 24 hours

export function deriveMenuVisibility(menu: {
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  passwordHash: string | null;
}): MenuVisibility {
  if (menu.status !== 'PUBLISHED') return 'PRIVATE_DRAFT';
  if (menu.passwordHash) return 'PASSWORD_PROTECTED';
  return 'PUBLISHED';
}

// Strip `passwordHash` from API responses and replace it with a boolean the
// admin UI can render without leaking the hash to the client.
export function sanitizeMenuResponse<
  T extends { passwordHash?: string | null } | null | undefined
>(menu: T): T extends null | undefined ? T : Omit<NonNullable<T>, 'passwordHash'> & { hasPassword: boolean } {
  if (!menu) return menu as never;
  const { passwordHash, ...rest } = menu as NonNullable<T>;
  return { ...rest, hasPassword: Boolean(passwordHash) } as never;
}

export function menuPassCookieName(menuId: string): string {
  return `${MENU_PASS_COOKIE_PREFIX}${menuId}`;
}

function getCookieSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error(
      'NEXTAUTH_SECRET is required to sign menu-pass cookies'
    );
  }
  return secret;
}

function hmac(payload: string): string {
  return createHmac('sha256', getCookieSecret())
    .update(payload)
    .digest('hex');
}

export function signMenuPassToken(menuId: string, issuedAtMs = Date.now()): string {
  const exp = Math.floor(issuedAtMs / 1000) + MENU_PASS_COOKIE_TTL_SECONDS;
  const payload = `${menuId}.${exp}`;
  return `${payload}.${hmac(payload)}`;
}

export function verifyMenuPassToken(menuId: string, token: string | undefined | null): boolean {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [tokenMenuId, expStr, sig] = parts;
  if (tokenMenuId !== menuId) return false;
  const exp = Number(expStr);
  if (!Number.isFinite(exp)) return false;
  if (Math.floor(Date.now() / 1000) >= exp) return false;

  const expected = hmac(`${tokenMenuId}.${expStr}`);
  if (expected.length !== sig.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(sig, 'hex'));
  } catch {
    return false;
  }
}
