import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  handleApiError,
  createErrorResponse,
  createSuccessResponse,
  ERROR_CODES,
} from '@/lib/api';
import { clearTableCookie, readTableCookie } from '@/lib/auth/table-token';
import { CHANNELS, EVENTS, triggerEvent } from '@/lib/pusher/server';

interface RouteParams {
  params: Promise<{ code: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { code } = await params;
    const cookie = readTableCookie(request);

    if (!cookie) {
      // Already gone — return 200 + clear cookie defensively so the client can
      // unconditionally redirect after calling this endpoint.
      const response = createSuccessResponse({ deleted: false, alreadyGone: true });
      clearTableCookie(response as NextResponse);
      return response;
    }

    // Hosts must use POST /close — leaving would orphan the table.
    if (cookie.isHost) {
      return createErrorResponse(
        ERROR_CODES.FORBIDDEN,
        'Hosts cannot leave; close the table instead',
        403,
      );
    }

    const guest = await prisma.tableGuest.findUnique({
      where: { id: cookie.guestId },
      select: {
        id: true,
        name: true,
        tableId: true,
        table: { select: { id: true, code: true } },
      },
    });

    if (!guest || guest.table.code !== code || guest.table.id !== cookie.tableId) {
      // Cookie binds nothing valid — clear and return success so the UI can
      // navigate away cleanly.
      const response = createSuccessResponse({ deleted: false, alreadyGone: true });
      clearTableCookie(response as NextResponse);
      return response;
    }

    // Hard-delete the guest row. Selections cascade out (schema rule), which
    // removes them from the host's aggregate view as well — chosen so the host
    // sees a tidy "they left" outcome rather than a flagged ghost row.
    await prisma.tableGuest.delete({ where: { id: guest.id } });

    try {
      await triggerEvent(CHANNELS.table(code), EVENTS.TABLE_GUEST_LEFT, {
        guestId: guest.id,
        name: guest.name,
      });
    } catch (err) {
      console.error('Pusher table:guest_left broadcast failed:', err);
    }

    const response = createSuccessResponse({ id: guest.id, deleted: true });
    clearTableCookie(response as NextResponse);
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
