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
      select: { id: true, status: true, expiresAt: true },
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
        'Only the host can close this table',
        403,
      );
    }

    if (table.status !== 'OPEN') {
      return createErrorResponse(
        ERROR_CODES.TABLE_GONE,
        'This table is already closed or expired',
        410,
      );
    }

    await prisma.tableSession.update({
      where: { id: table.id },
      data: { status: 'CLOSED' },
    });

    try {
      await triggerEvent(CHANNELS.table(code), EVENTS.TABLE_CLOSED, {
        code,
        closedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Pusher table:closed broadcast failed:', err);
    }

    return createSuccessResponse({ code, status: 'CLOSED' as const });
  } catch (error) {
    return handleApiError(error);
  }
}
