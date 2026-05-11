// T20.7 — /api/cron/schedule-menus coverage.
// Run: pnpm test:e2e tests/e2e/admin/schedule-cron.spec.ts

import { expect, request, test } from '@playwright/test';
import { prismaTest, seedMenu, seedUser } from '../fixtures/seed';

const CRON_PATH = '/api/cron/schedule-menus';

async function seedScheduledMenu(opts: {
  status: 'DRAFT' | 'PUBLISHED';
  scheduledPublishAt?: Date | null;
  scheduledUnpublishAt?: Date | null;
}) {
  const user = await seedUser({ plan: 'PRO' });
  const menu = await seedMenu({
    userId: user.id,
    status: opts.status,
    slug: `sched-${Math.random().toString(36).slice(2, 10)}`,
  });
  await prismaTest.menu.update({
    where: { id: menu.id },
    data: {
      scheduledPublishAt: opts.scheduledPublishAt ?? null,
      scheduledUnpublishAt: opts.scheduledUnpublishAt ?? null,
    },
  });
  return menu;
}

test.describe('cron — schedule-menus', () => {
  test('rejects 401 without bearer secret', async () => {
    const ctx = await request.newContext();
    const res = await ctx.get(CRON_PATH);
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  test('rejects 401 with wrong bearer secret', async () => {
    const ctx = await request.newContext();
    const res = await ctx.get(CRON_PATH, {
      headers: { authorization: 'Bearer not-the-secret' },
    });
    expect(res.status()).toBe(401);
  });

  test('flips DRAFT menu to PUBLISHED when scheduledPublishAt is in the past', async () => {
    const menu = await seedScheduledMenu({
      status: 'DRAFT',
      scheduledPublishAt: new Date(Date.now() - 5 * 60 * 1000),
    });

    const ctx = await request.newContext();
    const res = await ctx.get(CRON_PATH, {
      headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.published).toBeGreaterThanOrEqual(1);

    const row = await prismaTest.menu.findUnique({
      where: { id: menu.id },
      select: { status: true, publishedAt: true, scheduledPublishAt: true },
    });
    expect(row?.status).toBe('PUBLISHED');
    expect(row?.publishedAt).not.toBeNull();
    expect(row?.scheduledPublishAt).toBeNull();
  });

  test('flips PUBLISHED menu to DRAFT when scheduledUnpublishAt is in the past', async () => {
    const menu = await seedScheduledMenu({
      status: 'PUBLISHED',
      scheduledUnpublishAt: new Date(Date.now() - 5 * 60 * 1000),
    });

    const ctx = await request.newContext();
    const res = await ctx.get(CRON_PATH, {
      headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.unpublished).toBeGreaterThanOrEqual(1);

    const row = await prismaTest.menu.findUnique({
      where: { id: menu.id },
      select: { status: true, scheduledUnpublishAt: true },
    });
    expect(row?.status).toBe('DRAFT');
    expect(row?.scheduledUnpublishAt).toBeNull();
  });

  test('leaves DRAFT menu untouched when scheduledPublishAt is in the future', async () => {
    const menu = await seedScheduledMenu({
      status: 'DRAFT',
      scheduledPublishAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    const ctx = await request.newContext();
    const res = await ctx.get(CRON_PATH, {
      headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
    });
    expect(res.status()).toBe(200);

    const row = await prismaTest.menu.findUnique({
      where: { id: menu.id },
      select: { status: true, publishedAt: true, scheduledPublishAt: true },
    });
    expect(row?.status).toBe('DRAFT');
    expect(row?.publishedAt).toBeNull();
    expect(row?.scheduledPublishAt).not.toBeNull();
  });

  test('only clears the field that fired — keeps the other scheduled date', async () => {
    const futureUnpublish = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const menu = await seedScheduledMenu({
      status: 'DRAFT',
      scheduledPublishAt: new Date(Date.now() - 5 * 60 * 1000),
      scheduledUnpublishAt: futureUnpublish,
    });

    const ctx = await request.newContext();
    const res = await ctx.get(CRON_PATH, {
      headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
    });
    expect(res.status()).toBe(200);

    const row = await prismaTest.menu.findUnique({
      where: { id: menu.id },
      select: { status: true, scheduledPublishAt: true, scheduledUnpublishAt: true },
    });
    expect(row?.status).toBe('PUBLISHED');
    expect(row?.scheduledPublishAt).toBeNull();
    expect(row?.scheduledUnpublishAt?.toISOString()).toBe(futureUnpublish.toISOString());
  });
});
