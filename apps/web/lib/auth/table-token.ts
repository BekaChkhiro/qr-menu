import { createHmac, timingSafeEqual } from 'node:crypto';
import type { NextRequest, NextResponse } from 'next/server';

export const TABLE_COOKIE_NAME = 'dm_table_token';
export const TABLE_COOKIE_TTL_SECONDS = 60 * 60 * 6; // 6 hours

export interface TableTokenPayload {
  tableId: string;
  guestId: string;
  isHost: boolean;
}

interface SignedPayload extends TableTokenPayload {
  exp: number;
}

function getCookieSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET is required to sign table-session cookies');
  }
  return secret;
}

function hmac(payload: string): string {
  return createHmac('sha256', getCookieSecret()).update(payload).digest('hex');
}

function toBase64Url(input: string): string {
  return Buffer.from(input, 'utf8')
    .toString('base64')
    .replace(/=+$/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function fromBase64Url(input: string): string | null {
  try {
    const padded = input.replace(/-/g, '+').replace(/_/g, '/');
    const padLen = (4 - (padded.length % 4)) % 4;
    return Buffer.from(padded + '='.repeat(padLen), 'base64').toString('utf8');
  } catch {
    return null;
  }
}

export function signTableToken(
  payload: TableTokenPayload,
  issuedAtMs: number = Date.now(),
): string {
  const exp = Math.floor(issuedAtMs / 1000) + TABLE_COOKIE_TTL_SECONDS;
  const body: SignedPayload = { ...payload, exp };
  const encoded = toBase64Url(JSON.stringify(body));
  const sig = hmac(encoded);
  return `${encoded}.${sig}`;
}

export function verifyTableToken(token: string | undefined | null): TableTokenPayload | null {
  if (!token) return null;
  const dot = token.lastIndexOf('.');
  if (dot <= 0 || dot === token.length - 1) return null;

  const encoded = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = hmac(encoded);

  if (expected.length !== sig.length) return null;
  try {
    if (!timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(sig, 'hex'))) {
      return null;
    }
  } catch {
    return null;
  }

  const json = fromBase64Url(encoded);
  if (!json) return null;

  let parsed: SignedPayload;
  try {
    parsed = JSON.parse(json) as SignedPayload;
  } catch {
    return null;
  }

  if (
    typeof parsed?.tableId !== 'string' ||
    typeof parsed?.guestId !== 'string' ||
    typeof parsed?.isHost !== 'boolean' ||
    typeof parsed?.exp !== 'number'
  ) {
    return null;
  }

  if (Math.floor(Date.now() / 1000) >= parsed.exp) return null;

  return { tableId: parsed.tableId, guestId: parsed.guestId, isHost: parsed.isHost };
}

export function setTableCookie(response: NextResponse, token: string): void {
  response.cookies.set(TABLE_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: TABLE_COOKIE_TTL_SECONDS,
  });
}

export function clearTableCookie(response: NextResponse): void {
  response.cookies.set(TABLE_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}

export function readTableCookie(request: NextRequest): TableTokenPayload | null {
  const raw = request.cookies.get(TABLE_COOKIE_NAME)?.value;
  return verifyTableToken(raw);
}
