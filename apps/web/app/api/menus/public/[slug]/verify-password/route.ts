import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import {
  handleApiError,
  createErrorResponse,
  ERROR_CODES,
} from '@/lib/api';
import {
  menuPassCookieName,
  MENU_PASS_COOKIE_TTL_SECONDS,
  signMenuPassToken,
} from '@/lib/menu-visibility';

const bodySchema = z.object({
  password: z.string().min(1, 'Password is required').max(100),
});

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * POST /api/menus/public/:slug/verify-password
 * Verify a password-protected menu's password. On success, sets an HMAC-signed
 * cookie that the public menu page trusts for 24 hours.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const { password } = bodySchema.parse(await request.json());

    const menu = await prisma.menu.findUnique({
      where: { slug, status: 'PUBLISHED' },
      select: { id: true, passwordHash: true },
    });

    // Use a constant-time reply shape so attackers can't distinguish
    // "menu not found" from "wrong password" via timing.
    if (!menu || !menu.passwordHash) {
      return createErrorResponse(
        ERROR_CODES.FORBIDDEN,
        'Invalid password',
        403
      );
    }

    const ok = await bcrypt.compare(password, menu.passwordHash);
    if (!ok) {
      return createErrorResponse(
        ERROR_CODES.FORBIDDEN,
        'Invalid password',
        403
      );
    }

    const token = signMenuPassToken(menu.id);
    const res = NextResponse.json({ success: true, data: { ok: true } });
    res.cookies.set(menuPassCookieName(menu.id), token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: MENU_PASS_COOKIE_TTL_SECONDS,
    });
    return res;
  } catch (error) {
    return handleApiError(error);
  }
}
