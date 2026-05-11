// T20.7 — Cron-driven scheduled publish / unpublish for menus.
//
// On each run (hourly on Vercel — see vercel.json) we look for menus whose
// scheduledPublishAt or scheduledUnpublishAt is now in the past and flip
// them. Only the field that fired is cleared; the other stays so a later
// run can act on it. Each menu is processed independently so one failure
// can't poison the batch.
//
// Secured by `Authorization: Bearer ${CRON_SECRET}` — same shape as
// /api/cron/tables-cleanup. Vercel Cron sends this header automatically
// when CRON_SECRET is configured.

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { invalidateMenuCache } from '@/lib/cache/redis';
import { triggerMenuEvent, EVENTS } from '@/lib/pusher/server';

interface RunResult {
  published: number;
  unpublished: number;
}

function unauthorized() {
  return NextResponse.json(
    { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid cron secret' } },
    { status: 401 },
  );
}

async function authorize(request: NextRequest): Promise<boolean> {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error('schedule-menus: CRON_SECRET is not configured');
    return false;
  }
  const header = request.headers.get('authorization') ?? '';
  return header === `Bearer ${secret}`;
}

async function runScheduledTransitions(): Promise<RunResult> {
  const now = new Date();

  const candidates = await prisma.menu.findMany({
    where: {
      OR: [
        { status: 'DRAFT', scheduledPublishAt: { not: null, lte: now } },
        { status: 'PUBLISHED', scheduledUnpublishAt: { not: null, lte: now } },
      ],
    },
    select: {
      id: true,
      slug: true,
      status: true,
      scheduledPublishAt: true,
      scheduledUnpublishAt: true,
    },
  });

  let published = 0;
  let unpublished = 0;

  for (const candidate of candidates) {
    const shouldPublish =
      candidate.status === 'DRAFT' &&
      candidate.scheduledPublishAt !== null &&
      candidate.scheduledPublishAt <= now;
    const shouldUnpublish =
      candidate.status === 'PUBLISHED' &&
      candidate.scheduledUnpublishAt !== null &&
      candidate.scheduledUnpublishAt <= now;

    if (!shouldPublish && !shouldUnpublish) continue;

    try {
      const data = shouldPublish
        ? {
            status: 'PUBLISHED' as const,
            publishedAt: now,
            scheduledPublishAt: null,
          }
        : {
            status: 'DRAFT' as const,
            scheduledUnpublishAt: null,
          };

      const updated = await prisma.menu.update({
        where: { id: candidate.id },
        data,
        select: { id: true, slug: true, status: true, publishedAt: true },
      });

      await invalidateMenuCache(updated.id, updated.slug);
      await triggerMenuEvent(updated.id, EVENTS.MENU_UPDATED, updated);

      if (shouldPublish) published++;
      else unpublished++;
    } catch (err) {
      console.error('schedule-menus: failed to flip menu', candidate.id, err);
    }
  }

  return { published, unpublished };
}

export async function GET(request: NextRequest) {
  if (!(await authorize(request))) return unauthorized();

  try {
    const { published, unpublished } = await runScheduledTransitions();
    return NextResponse.json({ success: true, published, unpublished });
  } catch (err) {
    console.error('schedule-menus: run failed', err);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Scheduled transitions failed' } },
      { status: 500 },
    );
  }
}

export const POST = GET;
