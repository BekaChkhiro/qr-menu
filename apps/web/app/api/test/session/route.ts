import { NextResponse, type NextRequest } from 'next/server';
import { encode } from '@auth/core/jwt';
import { z } from 'zod';
import { prisma } from '@/lib/db';

// This route exists ONLY to let Playwright skip the credential login UI. It
// issues a signed NextAuth JWT cookie for an existing seeded user so specs
// complete a "login" in <1s.
//
// Hard-gated behind ENABLE_TEST_AUTH=1 (or NODE_ENV=test). When the flag is
// unset — which is ALWAYS the case in production and normal `pnpm dev` — the
// route responds 404 and behaves as if it does not exist.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  email: z.string().email(),
});

function isTestAuthEnabled(): boolean {
  return process.env.ENABLE_TEST_AUTH === '1' || process.env.NODE_ENV === 'test';
}

function getSessionCookieName(): { name: string; secure: boolean } {
  // Mirrors NextAuth's default: the `__Secure-` prefix is used whenever the
  // cookie would be set over https. In local E2E we run against
  // http://localhost:3000, so the unprefixed name applies.
  const authUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? '';
  const secure = authUrl.startsWith('https://');
  return {
    name: secure ? '__Secure-authjs.session-token' : 'authjs.session-token',
    secure,
  };
}

export async function POST(req: NextRequest) {
  if (!isTestAuthEnabled()) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: 'server_misconfigured', detail: 'AUTH_SECRET is not set' },
      { status: 500 },
    );
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_body', detail: parsed.error.format() },
      { status: 400 },
    );
  }

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json(
      { error: 'user_not_found', detail: `No user with email "${email}". Did the spec call seedUser() first?` },
      { status: 404 },
    );
  }

  const { name: cookieName, secure } = getSessionCookieName();
  const maxAge = 30 * 24 * 60 * 60; // 30 days — matches auth.ts session.maxAge

  const token = await encode({
    token: {
      sub: user.id,
      id: user.id,
      plan: user.plan,
      name: user.name ?? null,
      email: user.email,
      picture: user.image ?? null,
      sessionVersion: user.sessionVersion ?? 0,
    },
    secret,
    salt: cookieName,
    maxAge,
  });

  const res = NextResponse.json({
    ok: true,
    user: { id: user.id, email: user.email, plan: user.plan, name: user.name },
  });

  res.cookies.set({
    name: cookieName,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge,
  });

  return res;
}
