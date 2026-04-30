// T19.8 — Cron cleanup endpoint coverage.
// Run: pnpm test:e2e tests/e2e/api/table-cleanup.spec.ts

import { expect, request, test } from '@playwright/test';
import { prismaTest, resetDb, seedMenu, seedUser } from '../fixtures/seed';

const CLEANUP_PATH = '/api/cron/tables-cleanup';

async function seedTableSession(opts: {
  status?: 'OPEN' | 'CLOSED' | 'EXPIRED';
  expiresAt?: Date;
  updatedAt?: Date;
}) {
  const user = await seedUser({ plan: 'PRO' });
  const menu = await seedMenu({
    userId: user.id,
    status: 'PUBLISHED',
    slug: `tbl-${Math.random().toString(36).slice(2, 10)}`,
  });
  await prismaTest.menu.update({
    where: { id: menu.id },
    data: { sharedTableEnabled: true },
  });

  const session = await prismaTest.tableSession.create({
    data: {
      menuId: menu.id,
      code: Math.random().toString(36).slice(2, 10).padEnd(8, '0'),
      pinHash: '$2a$10$abcdefghijklmnopqrstuvwxyz0123456789ABCDEF',
      hostName: 'Nino',
      maxGuests: 4,
      status: opts.status ?? 'OPEN',
      expiresAt: opts.expiresAt ?? new Date(Date.now() + 4 * 60 * 60 * 1000),
    },
    select: { id: true, code: true },
  });

  if (opts.updatedAt) {
    // Prisma's @updatedAt auto-sets on every write, so we patch it explicitly
    // via raw SQL to put the row into the >24h-old bucket the cron targets.
    await prismaTest.$executeRawUnsafe(
      `UPDATE "table_sessions" SET "updatedAt" = $1 WHERE id = $2`,
      opts.updatedAt,
      session.id,
    );
  }

  return session;
}

test.describe('cron — tables-cleanup', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async () => {
    await resetDb();
  });

  test('rejects 401 without bearer secret', async () => {
    const ctx = await request.newContext();
    const res = await ctx.get(CLEANUP_PATH);
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  test('rejects 401 with wrong bearer secret', async () => {
    const ctx = await request.newContext();
    const res = await ctx.get(CLEANUP_PATH, {
      headers: { authorization: 'Bearer not-the-secret' },
    });
    expect(res.status()).toBe(401);
  });

  test('expires OPEN sessions whose expiresAt is in the past', async () => {
    const session = await seedTableSession({
      status: 'OPEN',
      expiresAt: new Date(Date.now() - 60 * 1000),
    });

    const ctx = await request.newContext();
    const res = await ctx.get(CLEANUP_PATH, {
      headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.expired).toBeGreaterThanOrEqual(1);

    const row = await prismaTest.tableSession.findUnique({
      where: { id: session.id },
      select: { status: true },
    });
    expect(row?.status).toBe('EXPIRED');
  });

  test('does not expire OPEN sessions still within their window', async () => {
    const session = await seedTableSession({
      status: 'OPEN',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    const ctx = await request.newContext();
    const res = await ctx.get(CLEANUP_PATH, {
      headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
    });
    expect(res.status()).toBe(200);

    const row = await prismaTest.tableSession.findUnique({
      where: { id: session.id },
      select: { status: true },
    });
    expect(row?.status).toBe('OPEN');
  });

  test('hard-deletes CLOSED sessions older than 24h (cascades guests/selections)', async () => {
    const session = await seedTableSession({
      status: 'CLOSED',
      updatedAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
    });
    await prismaTest.tableGuest.create({
      data: { tableId: session.id, name: 'Alice', isHost: false },
    });

    const ctx = await request.newContext();
    const res = await ctx.get(CLEANUP_PATH, {
      headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBeGreaterThanOrEqual(1);

    const row = await prismaTest.tableSession.findUnique({
      where: { id: session.id },
    });
    expect(row).toBeNull();

    const guestCount = await prismaTest.tableGuest.count({
      where: { tableId: session.id },
    });
    expect(guestCount).toBe(0);
  });

  test('keeps CLOSED sessions younger than 24h', async () => {
    const session = await seedTableSession({
      status: 'CLOSED',
      updatedAt: new Date(Date.now() - 60 * 60 * 1000),
    });

    const ctx = await request.newContext();
    const res = await ctx.get(CLEANUP_PATH, {
      headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
    });
    expect(res.status()).toBe(200);

    const row = await prismaTest.tableSession.findUnique({
      where: { id: session.id },
      select: { id: true },
    });
    expect(row).not.toBeNull();
  });

  test('combined run: expires + deletes in one pass', async () => {
    const expiringSession = await seedTableSession({
      status: 'OPEN',
      expiresAt: new Date(Date.now() - 60 * 1000),
    });
    const oldExpiredSession = await seedTableSession({
      status: 'EXPIRED',
      updatedAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
    });

    const ctx = await request.newContext();
    const res = await ctx.get(CLEANUP_PATH, {
      headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.expired).toBeGreaterThanOrEqual(1);
    expect(body.deleted).toBeGreaterThanOrEqual(1);

    const expired = await prismaTest.tableSession.findUnique({
      where: { id: expiringSession.id },
      select: { status: true },
    });
    expect(expired?.status).toBe('EXPIRED');

    const deleted = await prismaTest.tableSession.findUnique({
      where: { id: oldExpiredSession.id },
    });
    expect(deleted).toBeNull();
  });
});
