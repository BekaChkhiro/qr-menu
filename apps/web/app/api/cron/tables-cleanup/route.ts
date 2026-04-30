// T19.8 — Cron-driven cleanup for shared-table sessions.
//
// Two passes per run:
//   1. OPEN sessions whose expiresAt has passed → status='EXPIRED' + broadcast
//      TABLE_CLOSED so any still-connected clients tear down their UI.
//   2. CLOSED/EXPIRED sessions older than 24h → hard-deleted (cascade wipes
//      guests + selections via FK rules).
//
// The inline auto-close in GET /api/public/tables/[code] is the safety net
// for individual reads; this cron is the bulk reaper that keeps the DB tidy
// and makes sure events fire even when nobody is polling.
//
// Secured by `Authorization: Bearer ${CRON_SECRET}`. Vercel Cron sends this
// header automatically when CRON_SECRET is set in project env.

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { CHANNELS, EVENTS, triggerBatch } from '@/lib/pusher/server';

const HARD_DELETE_AGE_MS = 24 * 60 * 60 * 1000;
const PUSHER_BATCH_SIZE = 10; // Pusher caps triggerBatch at 10 events / call.

function unauthorized() {
  return NextResponse.json(
    { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid cron secret' } },
    { status: 401 },
  );
}

async function runCleanup(): Promise<{ expired: number; deleted: number }> {
  const now = new Date();

  // ---- Pass 1: expire OPEN sessions past their window ----
  const dueForExpiry = await prisma.tableSession.findMany({
    where: { status: 'OPEN', expiresAt: { lt: now } },
    select: { id: true, code: true },
  });

  let expired = 0;
  if (dueForExpiry.length > 0) {
    const result = await prisma.tableSession.updateMany({
      where: {
        id: { in: dueForExpiry.map((t) => t.id) },
        status: 'OPEN',
      },
      data: { status: 'EXPIRED' },
    });
    expired = result.count;

    // Best-effort broadcast — failures must not abort the cron run.
    const closedAt = now.toISOString();
    const events = dueForExpiry.map((t) => ({
      channel: CHANNELS.table(t.code),
      event: EVENTS.TABLE_CLOSED,
      data: { code: t.code, closedAt, reason: 'expired' as const },
    }));

    for (let i = 0; i < events.length; i += PUSHER_BATCH_SIZE) {
      const slice = events.slice(i, i + PUSHER_BATCH_SIZE);
      try {
        await triggerBatch(slice);
      } catch (err) {
        console.error('tables-cleanup: pusher batch broadcast failed', err);
      }
    }
  }

  // ---- Pass 2: hard-delete CLOSED/EXPIRED rows older than 24h ----
  const cutoff = new Date(now.getTime() - HARD_DELETE_AGE_MS);
  const deletion = await prisma.tableSession.deleteMany({
    where: {
      status: { in: ['CLOSED', 'EXPIRED'] },
      updatedAt: { lt: cutoff },
    },
  });

  return { expired, deleted: deletion.count };
}

async function authorize(request: NextRequest): Promise<boolean> {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // Fail closed — never allow unauthenticated access in any environment.
    console.error('tables-cleanup: CRON_SECRET is not configured');
    return false;
  }
  const header = request.headers.get('authorization') ?? '';
  return header === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!(await authorize(request))) return unauthorized();

  try {
    const { expired, deleted } = await runCleanup();
    return NextResponse.json({ success: true, expired, deleted });
  } catch (err) {
    console.error('tables-cleanup: run failed', err);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Cleanup failed' } },
      { status: 500 },
    );
  }
}

// Vercel Cron uses GET; POST is a convenience for manual curl/runbook use.
export const POST = GET;
