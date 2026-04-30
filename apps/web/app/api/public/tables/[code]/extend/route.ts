import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import {
  handleApiError,
  createErrorResponse,
  createSuccessResponse,
  ERROR_CODES,
} from '@/lib/api';
import { readTableCookie } from '@/lib/auth/table-token';
import { CHANNELS, EVENTS, triggerEvent } from '@/lib/pusher/server';

interface RouteParams {
  params: Promise<{ code: string }>;
}

const EXTENSION_MS = 2 * 60 * 60 * 1000; // +2h

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { code } = await params;
    const cookie = readTableCookie(request);

    if (!cookie) {
      return createErrorResponse(
        ERROR_CODES.UNAUTHORIZED,
        'Missing or invalid table cookie',
        401,
      );
    }

    const table = await prisma.tableSession.findUnique({
      where: { code },
      select: {
        id: true,
        status: true,
        expiresAt: true,
        extendedAt: true,
      },
    });

    if (!table || table.id !== cookie.tableId) {
      return createErrorResponse(
        ERROR_CODES.UNAUTHORIZED,
        'Cookie does not bind this table',
        401,
      );
    }

    if (!cookie.isHost) {
      return createErrorResponse(
        ERROR_CODES.FORBIDDEN,
        'Only the host can extend this table',
        403,
      );
    }

    if (table.status !== 'OPEN' || table.expiresAt.getTime() <= Date.now()) {
      return createErrorResponse(
        ERROR_CODES.TABLE_GONE,
        'This table cannot be extended',
        410,
      );
    }

    if (table.extendedAt !== null) {
      return createErrorResponse(
        ERROR_CODES.EXTEND_ALREADY_USED,
        'This table has already been extended',
        409,
      );
    }

    const newExpiresAt = new Date(table.expiresAt.getTime() + EXTENSION_MS);
    const now = new Date();

    const updated = await prisma.tableSession.update({
      where: { id: table.id },
      data: {
        expiresAt: newExpiresAt,
        extendedAt: now,
      },
      select: { expiresAt: true, extendedAt: true },
    });

    try {
      await triggerEvent(CHANNELS.table(code), EVENTS.TABLE_EXTENDED, {
        code,
        expiresAt: updated.expiresAt.toISOString(),
        extendedAt: updated.extendedAt?.toISOString() ?? now.toISOString(),
      });
    } catch (err) {
      console.error('Pusher table:extended broadcast failed:', err);
    }

    return createSuccessResponse({
      code,
      expiresAt: updated.expiresAt.toISOString(),
      extendedAt: updated.extendedAt?.toISOString() ?? now.toISOString(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
