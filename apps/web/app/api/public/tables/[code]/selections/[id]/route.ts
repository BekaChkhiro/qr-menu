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
  params: Promise<{ code: string; id: string }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { code, id } = await params;
    const cookie = readTableCookie(request);

    if (!cookie) {
      return createErrorResponse(
        ERROR_CODES.UNAUTHORIZED,
        'Missing or invalid table cookie',
        401,
      );
    }

    const selection = await prisma.tableSelection.findUnique({
      where: { id },
      select: {
        id: true,
        guestId: true,
        table: { select: { id: true, code: true, status: true } },
      },
    });

    if (!selection || selection.table.code !== code) {
      return createErrorResponse(
        ERROR_CODES.NOT_FOUND,
        'Selection not found',
        404,
      );
    }

    if (selection.table.id !== cookie.tableId) {
      return createErrorResponse(
        ERROR_CODES.UNAUTHORIZED,
        'Cookie does not bind this table',
        401,
      );
    }

    if (selection.table.status !== 'OPEN') {
      return createErrorResponse(
        ERROR_CODES.TABLE_GONE,
        'This table is no longer accepting changes',
        410,
      );
    }

    // Authorization: guest can only delete own; host can delete anyone's.
    if (!cookie.isHost && selection.guestId !== cookie.guestId) {
      return createErrorResponse(
        ERROR_CODES.FORBIDDEN,
        'You can only remove your own selections',
        403,
      );
    }

    await prisma.tableSelection.delete({ where: { id: selection.id } });

    try {
      await triggerEvent(CHANNELS.table(code), EVENTS.TABLE_SELECTION_REMOVED, {
        guestId: selection.guestId,
        selectionId: selection.id,
      });
    } catch (err) {
      console.error('Pusher table:selection_removed broadcast failed:', err);
    }

    return createSuccessResponse({ id: selection.id, deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
