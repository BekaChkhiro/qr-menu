import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import {
  handleApiError,
  createErrorResponse,
  createSuccessResponse,
  ERROR_CODES,
} from '@/lib/api';
import { readTableCookie } from '@/lib/auth/table-token';
import { addSelectionSchema } from '@/lib/validations/table';
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

    const body = addSelectionSchema.parse(await request.json());

    const table = await prisma.tableSession.findUnique({
      where: { code },
      select: {
        id: true,
        menuId: true,
        status: true,
        expiresAt: true,
        guests: { select: { id: true, name: true } },
      },
    });

    if (!table || table.id !== cookie.tableId) {
      return createErrorResponse(
        ERROR_CODES.UNAUTHORIZED,
        'Cookie does not bind this table',
        401,
      );
    }

    if (table.status !== 'OPEN' || table.expiresAt.getTime() <= Date.now()) {
      return createErrorResponse(
        ERROR_CODES.TABLE_GONE,
        'This table is no longer accepting selections',
        410,
      );
    }

    const guest = table.guests.find((g) => g.id === cookie.guestId);
    if (!guest) {
      return createErrorResponse(
        ERROR_CODES.UNAUTHORIZED,
        'Guest no longer belongs to this table',
        401,
      );
    }

    // Defense in depth: confirm the product belongs to this menu
    // (a guest could spoof a productId from another menu).
    const product = await prisma.product.findUnique({
      where: { id: body.productId },
      select: {
        id: true,
        category: { select: { menuId: true } },
        variations: body.variationId
          ? { where: { id: body.variationId }, select: { id: true } }
          : false,
      },
    });

    if (!product || product.category.menuId !== table.menuId) {
      return createErrorResponse(
        ERROR_CODES.PRODUCT_NOT_IN_MENU,
        'Product does not belong to this menu',
        400,
      );
    }

    if (body.variationId && (!product.variations || product.variations.length === 0)) {
      return createErrorResponse(
        ERROR_CODES.VARIATION_NOT_FOUND,
        'Variation does not belong to this product',
        400,
      );
    }

    const selection = await prisma.tableSelection.create({
      data: {
        tableId: table.id,
        guestId: guest.id,
        productId: body.productId,
        variationId: body.variationId ?? null,
        quantity: body.quantity,
        note: body.note ?? null,
      },
      select: {
        id: true,
        guestId: true,
        productId: true,
        variationId: true,
        quantity: true,
        note: true,
        createdAt: true,
      },
    });

    try {
      await triggerEvent(CHANNELS.table(code), EVENTS.TABLE_SELECTION_ADDED, {
        guestId: guest.id,
        guestName: guest.name,
        selectionId: selection.id,
        productId: selection.productId,
        variationId: selection.variationId,
        quantity: selection.quantity,
        note: selection.note,
        createdAt: selection.createdAt.toISOString(),
      });
    } catch (err) {
      console.error('Pusher table:selection_added broadcast failed:', err);
    }

    return createSuccessResponse(
      {
        id: selection.id,
        guestId: selection.guestId,
        productId: selection.productId,
        variationId: selection.variationId,
        quantity: selection.quantity,
        note: selection.note,
        createdAt: selection.createdAt.toISOString(),
      },
      201,
    );
  } catch (error) {
    return handleApiError(error);
  }
}
