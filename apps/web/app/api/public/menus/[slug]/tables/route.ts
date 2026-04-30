import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import {
  handleApiError,
  createErrorResponse,
  createSuccessResponse,
  ERROR_CODES,
} from '@/lib/api';
import { hasFeature } from '@/lib/auth/permissions';
import { createTableSchema } from '@/lib/validations/table';
import { generateTableCode } from '@/lib/auth/table-code';
import {
  signTableToken,
  setTableCookie,
  TABLE_COOKIE_TTL_SECONDS,
} from '@/lib/auth/table-token';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

const TABLE_INITIAL_TTL_MS = 4 * 60 * 60 * 1000; // 4h
const PIN_BCRYPT_COST = 10;
const MAX_CODE_RETRIES = 5;

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const body = createTableSchema.parse(await request.json());

    const menu = await prisma.menu.findUnique({
      where: { slug },
      select: {
        id: true,
        status: true,
        sharedTableEnabled: true,
        user: { select: { plan: true } },
      },
    });

    if (!menu || menu.status !== 'PUBLISHED' || !menu.sharedTableEnabled) {
      return createErrorResponse(
        ERROR_CODES.MENU_NOT_FOUND,
        'Menu not found or shared tables disabled',
        404,
      );
    }

    if (!hasFeature(menu.user.plan, 'sharedTable')) {
      return createErrorResponse(
        ERROR_CODES.PLAN_DOWNGRADED,
        'Shared tables are not available on the menu owner’s current plan',
        403,
      );
    }

    const pinHash = await bcrypt.hash(body.pin, PIN_BCRYPT_COST);
    const expiresAt = new Date(Date.now() + TABLE_INITIAL_TTL_MS);

    let createdTableId: string | null = null;
    let createdHostGuestId: string | null = null;
    let createdCode: string | null = null;

    for (let attempt = 0; attempt < MAX_CODE_RETRIES; attempt++) {
      const code = generateTableCode();
      try {
        const result = await prisma.$transaction(async (tx) => {
          const tableSession = await tx.tableSession.create({
            data: {
              menuId: menu.id,
              code,
              pinHash,
              hostName: body.hostName,
              maxGuests: body.maxGuests,
              expiresAt,
            },
            select: { id: true, code: true, expiresAt: true },
          });

          const hostGuest = await tx.tableGuest.create({
            data: {
              tableId: tableSession.id,
              name: body.hostName,
              isHost: true,
            },
            select: { id: true },
          });

          return { tableSession, hostGuest };
        });

        createdTableId = result.tableSession.id;
        createdHostGuestId = result.hostGuest.id;
        createdCode = result.tableSession.code;
        break;
      } catch (err) {
        // Retry only on unique-code collision; bubble everything else.
        if (
          err instanceof Error &&
          'code' in err &&
          (err as { code?: string }).code === 'P2002'
        ) {
          continue;
        }
        throw err;
      }
    }

    if (!createdTableId || !createdHostGuestId || !createdCode) {
      return createErrorResponse(
        ERROR_CODES.INTERNAL_ERROR,
        'Failed to allocate a table code, please try again',
        500,
      );
    }

    const token = signTableToken({
      tableId: createdTableId,
      guestId: createdHostGuestId,
      isHost: true,
    });

    const response = createSuccessResponse(
      {
        code: createdCode,
        hostGuestId: createdHostGuestId,
        expiresAt: expiresAt.toISOString(),
        cookieMaxAge: TABLE_COOKIE_TTL_SECONDS,
      },
      201,
    );

    setTableCookie(response as NextResponse, token);
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
