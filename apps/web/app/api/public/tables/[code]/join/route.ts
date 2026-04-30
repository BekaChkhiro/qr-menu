import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import {
  handleApiError,
  createErrorResponse,
  createSuccessResponse,
  ERROR_CODES,
} from '@/lib/api';
import { joinTableSchema } from '@/lib/validations/table';
import {
  signTableToken,
  setTableCookie,
  readTableCookie,
  TABLE_COOKIE_TTL_SECONDS,
} from '@/lib/auth/table-token';
import {
  tableJoinLimiter,
  tablePinLimiter,
  getClientIp,
} from '@/lib/rate-limit';

interface RouteParams {
  params: Promise<{ code: string }>;
}

function rateLimitResponse(reset: number) {
  const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
  const res = createErrorResponse(
    ERROR_CODES.RATE_LIMITED,
    'Too many attempts. Please wait before trying again.',
    429,
  );
  res.headers.set('Retry-After', String(retryAfter));
  return res;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { code } = await params;
    const ip = getClientIp(request);

    const ipCheck = await tableJoinLimiter.consume(ip);
    if (!ipCheck.success) {
      return rateLimitResponse(ipCheck.reset);
    }

    const body = joinTableSchema.parse(await request.json());

    const table = await prisma.tableSession.findUnique({
      where: { code },
      select: {
        id: true,
        pinHash: true,
        status: true,
        expiresAt: true,
        maxGuests: true,
        guests: { select: { id: true, isHost: true } },
      },
    });

    if (!table) {
      return createErrorResponse(
        ERROR_CODES.TABLE_NOT_FOUND,
        'Table not found',
        404,
      );
    }

    if (table.status !== 'OPEN' || table.expiresAt.getTime() <= Date.now()) {
      return createErrorResponse(
        ERROR_CODES.TABLE_GONE,
        'This table is no longer accepting guests',
        410,
      );
    }

    const pinKey = `${table.id}:${ip}`;
    const pinPeek = await tablePinLimiter.peek(pinKey);
    if (!pinPeek.success) {
      return rateLimitResponse(pinPeek.reset);
    }

    const pinOk = await bcrypt.compare(body.pin, table.pinHash);
    if (!pinOk) {
      const after = await tablePinLimiter.consume(pinKey);
      if (!after.success) {
        return rateLimitResponse(after.reset);
      }
      return createErrorResponse(
        ERROR_CODES.WRONG_PIN,
        'Incorrect PIN',
        401,
      );
    }

    // PIN ok — short-circuit if cookie already binds this table to a guest row.
    const existingCookie = readTableCookie(request);
    if (existingCookie && existingCookie.tableId === table.id) {
      const stillExists = table.guests.some((g) => g.id === existingCookie.guestId);
      if (stillExists) {
        const refreshed = signTableToken({
          tableId: existingCookie.tableId,
          guestId: existingCookie.guestId,
          isHost: existingCookie.isHost,
        });
        const response = createSuccessResponse({
          guestId: existingCookie.guestId,
          tableCode: code,
          role: existingCookie.isHost ? 'host' : 'guest',
          rejoined: true,
          cookieMaxAge: TABLE_COOKIE_TTL_SECONDS,
        });
        setTableCookie(response as NextResponse, refreshed);
        return response;
      }
    }

    if (table.guests.length >= table.maxGuests) {
      return createErrorResponse(
        ERROR_CODES.TABLE_FULL,
        'This table is full',
        409,
      );
    }

    const guest = await prisma.tableGuest.create({
      data: {
        tableId: table.id,
        name: body.name,
        isHost: false,
      },
      select: { id: true },
    });

    const token = signTableToken({
      tableId: table.id,
      guestId: guest.id,
      isHost: false,
    });

    const response = createSuccessResponse({
      guestId: guest.id,
      tableCode: code,
      role: 'guest' as const,
      rejoined: false,
      cookieMaxAge: TABLE_COOKIE_TTL_SECONDS,
    });
    setTableCookie(response as NextResponse, token);
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
