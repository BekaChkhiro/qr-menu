import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import {
  handleApiError,
  createErrorResponse,
  createSuccessResponse,
  ERROR_CODES,
} from '@/lib/api';
import { readTableCookie } from '@/lib/auth/table-token';

interface RouteParams {
  params: Promise<{ code: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
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
        code: true,
        menuId: true,
        hostName: true,
        maxGuests: true,
        status: true,
        expiresAt: true,
        extendedAt: true,
        createdAt: true,
        guests: {
          orderBy: { joinedAt: 'asc' },
          select: {
            id: true,
            name: true,
            isHost: true,
            joinedAt: true,
            lastSeenAt: true,
          },
        },
        selections: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            guestId: true,
            productId: true,
            variationId: true,
            quantity: true,
            note: true,
            createdAt: true,
          },
        },
      },
    });

    if (!table || table.id !== cookie.tableId) {
      return createErrorResponse(
        ERROR_CODES.UNAUTHORIZED,
        'Cookie does not bind this table',
        401,
      );
    }

    // Auto-close-on-read: if the window passed and the row is still OPEN,
    // mark it EXPIRED so subsequent ops see the terminal state.
    let effectiveStatus = table.status;
    if (table.status === 'OPEN' && table.expiresAt.getTime() <= Date.now()) {
      await prisma.tableSession.update({
        where: { id: table.id },
        data: { status: 'EXPIRED' },
      });
      effectiveStatus = 'EXPIRED';
    }

    // Touch lastSeenAt for the requester. Best-effort — skip on guest deletion.
    if (table.guests.some((g) => g.id === cookie.guestId)) {
      await prisma.tableGuest
        .update({
          where: { id: cookie.guestId },
          data: { lastSeenAt: new Date() },
        })
        .catch(() => undefined);
    }

    const isHost = cookie.isHost;
    const selections = isHost
      ? table.selections
      : table.selections.filter((s) => s.guestId === cookie.guestId);

    const guestsPublic = table.guests.map((g) => ({
      id: g.id,
      name: g.name,
      isHost: g.isHost,
      joinedAt: g.joinedAt.toISOString(),
    }));

    return createSuccessResponse({
      code: table.code,
      menuId: table.menuId,
      hostName: table.hostName,
      maxGuests: table.maxGuests,
      status: effectiveStatus,
      expiresAt: table.expiresAt.toISOString(),
      extendedAt: table.extendedAt ? table.extendedAt.toISOString() : null,
      createdAt: table.createdAt.toISOString(),
      role: isHost ? 'host' : 'guest',
      me: {
        guestId: cookie.guestId,
      },
      guests: guestsPublic,
      selections: selections.map((s) => ({
        id: s.id,
        guestId: s.guestId,
        productId: s.productId,
        variationId: s.variationId,
        quantity: s.quantity,
        note: s.note,
        createdAt: s.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
