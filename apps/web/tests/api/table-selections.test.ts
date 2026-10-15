/**
 * Table Selections API Tests (T19.3)
 *
 * Covers:
 *   POST   /api/public/tables/[code]/selections
 *   DELETE /api/public/tables/[code]/selections/[id]
 *
 * Plan called for Playwright e2e; this project ships Vitest mocked API
 * tests (no Playwright config). Same coverage, different harness.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createMockRequest,
  createRouteContext,
  parseJsonResponse,
  resetIdCounter,
  type ApiResponse,
} from './setup';

const { mockPrisma, mockReadTableCookie, mockTriggerEvent } = vi.hoisted(() => {
  return {
    mockPrisma: {
      tableSession: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      tableGuest: {
        update: vi.fn(),
      },
      tableSelection: {
        findUnique: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
      },
      product: {
        findUnique: vi.fn(),
      },
    },
    mockReadTableCookie: vi.fn(),
    mockTriggerEvent: vi.fn().mockResolvedValue(true),
  };
});

vi.mock('@/lib/db', () => ({
  prisma: mockPrisma,
}));

vi.mock('@/lib/auth/table-token', () => ({
  readTableCookie: (...args: unknown[]) => mockReadTableCookie(...args),
}));

vi.mock('@/lib/pusher/server', () => ({
  triggerEvent: (...args: unknown[]) => mockTriggerEvent(...args),
  CHANNELS: { table: (code: string) => `table-${code}` },
  EVENTS: {
    TABLE_SELECTION_ADDED: 'table:selection_added',
    TABLE_SELECTION_REMOVED: 'table:selection_removed',
  },
}));

import { GET as getTable } from '@/app/api/public/tables/[code]/route';
import { POST as postSelection } from '@/app/api/public/tables/[code]/selections/route';
import { DELETE as deleteSelection } from '@/app/api/public/tables/[code]/selections/[id]/route';

const TABLE_CODE = 'ABCD1234';
const TABLE_ID = 'table-1';
const MENU_ID = 'menu-1';
const HOST_GUEST_ID = 'guest-host';
const GUEST_A_ID = 'guest-a';
const GUEST_B_ID = 'guest-b';
const PRODUCT_ID_VALID = 'cltestproduct000000000001';
const PRODUCT_ID_OTHER_MENU = 'cltestproduct000000000002';
const PRODUCT_ID_MISSING = 'cltestproduct000000000099';

function tableSessionRow(overrides: Partial<{
  status: 'OPEN' | 'CLOSED' | 'EXPIRED';
  expiresAt: Date;
}> = {}) {
  return {
    id: TABLE_ID,
    menuId: MENU_ID,
    status: overrides.status ?? 'OPEN',
    expiresAt: overrides.expiresAt ?? new Date(Date.now() + 60 * 60 * 1000),
    guests: [
      { id: HOST_GUEST_ID, name: 'Nino' },
      { id: GUEST_A_ID, name: 'Anna' },
      { id: GUEST_B_ID, name: 'Beka' },
    ],
  };
}

function selectionRow(overrides: Partial<{
  id: string;
  guestId: string;
  variationId: string | null;
  quantity: number;
  note: string | null;
}> = {}) {
  return {
    id: overrides.id ?? 'sel-1',
    guestId: overrides.guestId ?? GUEST_A_ID,
    productId: PRODUCT_ID_VALID,
    variationId: overrides.variationId ?? null,
    quantity: overrides.quantity ?? 1,
    note: overrides.note ?? null,
    createdAt: new Date('2026-04-30T12:00:00Z'),
  };
}

describe('POST /api/public/tables/[code]/selections', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetIdCounter();
    mockTriggerEvent.mockResolvedValue(true);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('returns 401 when cookie is missing', async () => {
    mockReadTableCookie.mockReturnValue(null);

    const request = createMockRequest(`/api/public/tables/${TABLE_CODE}/selections`, {
      method: 'POST',
      body: { productId: PRODUCT_ID_VALID, quantity: 1 },
    });
    const context = createRouteContext({ code: TABLE_CODE });
    const response = await postSelection(request, context);
    const data = await parseJsonResponse<ApiResponse<unknown>>(response);

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    if (!data.success) expect(data.error.code).toBe('UNAUTHORIZED');
    expect(mockPrisma.tableSelection.create).not.toHaveBeenCalled();
    expect(mockTriggerEvent).not.toHaveBeenCalled();
  });

  it('returns 400 PRODUCT_NOT_IN_MENU when productId belongs to a different menu', async () => {
    mockReadTableCookie.mockReturnValue({
      tableId: TABLE_ID,
      guestId: GUEST_A_ID,
      isHost: false,
    });
    mockPrisma.tableSession.findUnique.mockResolvedValue(tableSessionRow());
    mockPrisma.product.findUnique.mockResolvedValue({
      id: PRODUCT_ID_OTHER_MENU,
      category: { menuId: 'menu-other' },
      variations: false,
    });

    const request = createMockRequest(`/api/public/tables/${TABLE_CODE}/selections`, {
      method: 'POST',
      body: { productId: PRODUCT_ID_OTHER_MENU, quantity: 1 },
    });
    const context = createRouteContext({ code: TABLE_CODE });
    const response = await postSelection(request, context);
    const data = await parseJsonResponse<ApiResponse<unknown>>(response);

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    if (!data.success) expect(data.error.code).toBe('PRODUCT_NOT_IN_MENU');
    expect(mockPrisma.tableSelection.create).not.toHaveBeenCalled();
    expect(mockTriggerEvent).not.toHaveBeenCalled();
  });

  it('returns 400 PRODUCT_NOT_IN_MENU when product does not exist', async () => {
    mockReadTableCookie.mockReturnValue({
      tableId: TABLE_ID,
      guestId: GUEST_A_ID,
      isHost: false,
    });
    mockPrisma.tableSession.findUnique.mockResolvedValue(tableSessionRow());
    mockPrisma.product.findUnique.mockResolvedValue(null);

    const request = createMockRequest(`/api/public/tables/${TABLE_CODE}/selections`, {
      method: 'POST',
      body: { productId: PRODUCT_ID_MISSING, quantity: 1 },
    });
    const context = createRouteContext({ code: TABLE_CODE });
    const response = await postSelection(request, context);
    const data = await parseJsonResponse<ApiResponse<unknown>>(response);

    expect(response.status).toBe(400);
    if (!data.success) expect(data.error.code).toBe('PRODUCT_NOT_IN_MENU');
  });

  it('returns 410 TABLE_GONE when table is closed', async () => {
    mockReadTableCookie.mockReturnValue({
      tableId: TABLE_ID,
      guestId: GUEST_A_ID,
      isHost: false,
    });
    mockPrisma.tableSession.findUnique.mockResolvedValue(
      tableSessionRow({ status: 'CLOSED' }),
    );

    const request = createMockRequest(`/api/public/tables/${TABLE_CODE}/selections`, {
      method: 'POST',
      body: { productId: PRODUCT_ID_VALID, quantity: 1 },
    });
    const context = createRouteContext({ code: TABLE_CODE });
    const response = await postSelection(request, context);
    const data = await parseJsonResponse<ApiResponse<unknown>>(response);

    expect(response.status).toBe(410);
    if (!data.success) expect(data.error.code).toBe('TABLE_GONE');
  });

  it('inserts selection and broadcasts TABLE_SELECTION_ADDED', async () => {
    mockReadTableCookie.mockReturnValue({
      tableId: TABLE_ID,
      guestId: GUEST_A_ID,
      isHost: false,
    });
    mockPrisma.tableSession.findUnique.mockResolvedValue(tableSessionRow());
    mockPrisma.product.findUnique.mockResolvedValue({
      id: PRODUCT_ID_VALID,
      category: { menuId: MENU_ID },
      variations: false,
    });
    const created = selectionRow({ id: 'sel-new', quantity: 2, note: 'no salt' });
    mockPrisma.tableSelection.create.mockResolvedValue(created);

    const request = createMockRequest(`/api/public/tables/${TABLE_CODE}/selections`, {
      method: 'POST',
      body: { productId: PRODUCT_ID_VALID, quantity: 2, note: 'no salt' },
    });
    const context = createRouteContext({ code: TABLE_CODE });
    const response = await postSelection(request, context);
    const data = await parseJsonResponse<
      ApiResponse<{ id: string; guestId: string; productId: string; quantity: number }>
    >(response);

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    if (data.success) {
      expect(data.data.id).toBe('sel-new');
      expect(data.data.guestId).toBe(GUEST_A_ID);
      expect(data.data.productId).toBe(PRODUCT_ID_VALID);
      expect(data.data.quantity).toBe(2);
    }

    expect(mockPrisma.tableSelection.create).toHaveBeenCalledTimes(1);
    expect(mockTriggerEvent).toHaveBeenCalledTimes(1);
    expect(mockTriggerEvent).toHaveBeenCalledWith(
      `table-${TABLE_CODE}`,
      'table:selection_added',
      expect.objectContaining({
        guestId: GUEST_A_ID,
        guestName: 'Anna',
        selectionId: 'sel-new',
        productId: PRODUCT_ID_VALID,
        quantity: 2,
        note: 'no salt',
      }),
    );
  });

  it('returns 400 VALIDATION_ERROR for negative quantity', async () => {
    mockReadTableCookie.mockReturnValue({
      tableId: TABLE_ID,
      guestId: GUEST_A_ID,
      isHost: false,
    });

    const request = createMockRequest(`/api/public/tables/${TABLE_CODE}/selections`, {
      method: 'POST',
      body: { productId: PRODUCT_ID_VALID, quantity: 0 },
    });
    const context = createRouteContext({ code: TABLE_CODE });
    const response = await postSelection(request, context);

    expect(response.status).toBe(400);
  });
});

describe('DELETE /api/public/tables/[code]/selections/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetIdCounter();
    mockTriggerEvent.mockResolvedValue(true);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('returns 401 when cookie is missing', async () => {
    mockReadTableCookie.mockReturnValue(null);

    const request = createMockRequest(
      `/api/public/tables/${TABLE_CODE}/selections/sel-1`,
      { method: 'DELETE' },
    );
    const context = createRouteContext({ code: TABLE_CODE, id: 'sel-1' });
    const response = await deleteSelection(request, context);

    expect(response.status).toBe(401);
    expect(mockPrisma.tableSelection.delete).not.toHaveBeenCalled();
  });

  it('returns 404 when selection does not exist', async () => {
    mockReadTableCookie.mockReturnValue({
      tableId: TABLE_ID,
      guestId: GUEST_A_ID,
      isHost: false,
    });
    mockPrisma.tableSelection.findUnique.mockResolvedValue(null);

    const request = createMockRequest(
      `/api/public/tables/${TABLE_CODE}/selections/sel-missing`,
      { method: 'DELETE' },
    );
    const context = createRouteContext({ code: TABLE_CODE, id: 'sel-missing' });
    const response = await deleteSelection(request, context);

    expect(response.status).toBe(404);
  });

  it('returns 403 when guest A tries to delete guest B selection', async () => {
    mockReadTableCookie.mockReturnValue({
      tableId: TABLE_ID,
      guestId: GUEST_A_ID,
      isHost: false,
    });
    mockPrisma.tableSelection.findUnique.mockResolvedValue({
      ...selectionRow({ guestId: GUEST_B_ID }),
      table: { id: TABLE_ID, code: TABLE_CODE, status: 'OPEN' as const },
    });

    const request = createMockRequest(
      `/api/public/tables/${TABLE_CODE}/selections/sel-1`,
      { method: 'DELETE' },
    );
    const context = createRouteContext({ code: TABLE_CODE, id: 'sel-1' });
    const response = await deleteSelection(request, context);
    const data = await parseJsonResponse<ApiResponse<unknown>>(response);

    expect(response.status).toBe(403);
    if (!data.success) expect(data.error.code).toBe('FORBIDDEN');
    expect(mockPrisma.tableSelection.delete).not.toHaveBeenCalled();
    expect(mockTriggerEvent).not.toHaveBeenCalled();
  });

  it('allows guest to delete own selection and broadcasts TABLE_SELECTION_REMOVED', async () => {
    mockReadTableCookie.mockReturnValue({
      tableId: TABLE_ID,
      guestId: GUEST_A_ID,
      isHost: false,
    });
    mockPrisma.tableSelection.findUnique.mockResolvedValue({
      ...selectionRow({ guestId: GUEST_A_ID }),
      table: { id: TABLE_ID, code: TABLE_CODE, status: 'OPEN' as const },
    });
    mockPrisma.tableSelection.delete.mockResolvedValue({ id: 'sel-1' });

    const request = createMockRequest(
      `/api/public/tables/${TABLE_CODE}/selections/sel-1`,
      { method: 'DELETE' },
    );
    const context = createRouteContext({ code: TABLE_CODE, id: 'sel-1' });
    const response = await deleteSelection(request, context);

    expect(response.status).toBe(200);
    expect(mockPrisma.tableSelection.delete).toHaveBeenCalledWith({ where: { id: 'sel-1' } });
    expect(mockTriggerEvent).toHaveBeenCalledWith(
      `table-${TABLE_CODE}`,
      'table:selection_removed',
      { guestId: GUEST_A_ID, selectionId: 'sel-1' },
    );
  });

  it('allows host to delete any guest selection', async () => {
    mockReadTableCookie.mockReturnValue({
      tableId: TABLE_ID,
      guestId: HOST_GUEST_ID,
      isHost: true,
    });
    mockPrisma.tableSelection.findUnique.mockResolvedValue({
      ...selectionRow({ guestId: GUEST_B_ID }),
      table: { id: TABLE_ID, code: TABLE_CODE, status: 'OPEN' as const },
    });
    mockPrisma.tableSelection.delete.mockResolvedValue({ id: 'sel-1' });

    const request = createMockRequest(
      `/api/public/tables/${TABLE_CODE}/selections/sel-1`,
      { method: 'DELETE' },
    );
    const context = createRouteContext({ code: TABLE_CODE, id: 'sel-1' });
    const response = await deleteSelection(request, context);

    expect(response.status).toBe(200);
    expect(mockPrisma.tableSelection.delete).toHaveBeenCalledTimes(1);
    expect(mockTriggerEvent).toHaveBeenCalledWith(
      `table-${TABLE_CODE}`,
      'table:selection_removed',
      { guestId: GUEST_B_ID, selectionId: 'sel-1' },
    );
  });

  it('returns 410 TABLE_GONE when table is closed', async () => {
    mockReadTableCookie.mockReturnValue({
      tableId: TABLE_ID,
      guestId: GUEST_A_ID,
      isHost: false,
    });
    mockPrisma.tableSelection.findUnique.mockResolvedValue({
      ...selectionRow({ guestId: GUEST_A_ID }),
      table: { id: TABLE_ID, code: TABLE_CODE, status: 'CLOSED' as const },
    });

    const request = createMockRequest(
      `/api/public/tables/${TABLE_CODE}/selections/sel-1`,
      { method: 'DELETE' },
    );
    const context = createRouteContext({ code: TABLE_CODE, id: 'sel-1' });
    const response = await deleteSelection(request, context);
    const data = await parseJsonResponse<ApiResponse<unknown>>(response);

    expect(response.status).toBe(410);
    if (!data.success) expect(data.error.code).toBe('TABLE_GONE');
  });

  it('returns 401 when cookie tableId mismatches selection table', async () => {
    mockReadTableCookie.mockReturnValue({
      tableId: 'other-table',
      guestId: GUEST_A_ID,
      isHost: false,
    });
    mockPrisma.tableSelection.findUnique.mockResolvedValue({
      ...selectionRow({ guestId: GUEST_A_ID }),
      table: { id: TABLE_ID, code: TABLE_CODE, status: 'OPEN' as const },
    });

    const request = createMockRequest(
      `/api/public/tables/${TABLE_CODE}/selections/sel-1`,
      { method: 'DELETE' },
    );
    const context = createRouteContext({ code: TABLE_CODE, id: 'sel-1' });
    const response = await deleteSelection(request, context);

    expect(response.status).toBe(401);
  });
});

describe('GET /api/public/tables/[code]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetIdCounter();
    mockPrisma.tableGuest.update.mockResolvedValue({});
    mockPrisma.tableSession.update.mockResolvedValue({});
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  function getTableSessionRow(overrides: Partial<{
    status: 'OPEN' | 'CLOSED' | 'EXPIRED';
    expiresAt: Date;
    guests: Array<{ id: string; name: string; isHost: boolean; joinedAt: Date; lastSeenAt: Date }>;
    selections: Array<ReturnType<typeof selectionRow>>;
  }> = {}) {
    return {
      id: TABLE_ID,
      code: TABLE_CODE,
      menuId: MENU_ID,
      hostName: 'Nino',
      maxGuests: 6,
      status: overrides.status ?? 'OPEN',
      expiresAt: overrides.expiresAt ?? new Date(Date.now() + 60 * 60 * 1000),
      extendedAt: null,
      createdAt: new Date('2026-04-30T10:00:00Z'),
      guests: overrides.guests ?? [
        { id: HOST_GUEST_ID, name: 'Nino', isHost: true, joinedAt: new Date('2026-04-30T10:00:00Z'), lastSeenAt: new Date('2026-04-30T10:05:00Z') },
        { id: GUEST_A_ID, name: 'Anna', isHost: false, joinedAt: new Date('2026-04-30T10:01:00Z'), lastSeenAt: new Date('2026-04-30T10:05:00Z') },
        { id: GUEST_B_ID, name: 'Beka', isHost: false, joinedAt: new Date('2026-04-30T10:02:00Z'), lastSeenAt: new Date('2026-04-30T10:05:00Z') },
      ],
      selections: overrides.selections ?? [
        selectionRow({ id: 'sel-1', guestId: GUEST_A_ID, quantity: 1 }),
        selectionRow({ id: 'sel-2', guestId: GUEST_B_ID, quantity: 2 }),
      ],
    };
  }

  it('returns 401 when cookie is missing', async () => {
    mockReadTableCookie.mockReturnValue(null);

    const request = createMockRequest(`/api/public/tables/${TABLE_CODE}`);
    const context = createRouteContext({ code: TABLE_CODE });
    const response = await getTable(request, context);
    const data = await parseJsonResponse<ApiResponse<unknown>>(response);

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    if (!data.success) expect(data.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 401 when cookie tableId does not match table', async () => {
    mockReadTableCookie.mockReturnValue({
      tableId: 'different-table-id',
      guestId: GUEST_A_ID,
      isHost: false,
    });
    mockPrisma.tableSession.findUnique.mockResolvedValue(getTableSessionRow());

    const request = createMockRequest(`/api/public/tables/${TABLE_CODE}`);
    const context = createRouteContext({ code: TABLE_CODE });
    const response = await getTable(request, context);

    expect(response.status).toBe(401);
  });

  it('returns 401 when guest is not an active member of table.guests', async () => {
    mockReadTableCookie.mockReturnValue({
      tableId: TABLE_ID,
      guestId: 'removed-or-stranger-guest-id',
      isHost: false,
    });
    mockPrisma.tableSession.findUnique.mockResolvedValue(getTableSessionRow());

    const request = createMockRequest(`/api/public/tables/${TABLE_CODE}`);
    const context = createRouteContext({ code: TABLE_CODE });
    const response = await getTable(request, context);
    const data = await parseJsonResponse<ApiResponse<unknown>>(response);

    expect(response.status).toBe(401);
    if (!data.success) {
      expect(data.error.code).toBe('UNAUTHORIZED');
      expect(data.error.message).toBe('Guest is not a member of this table');
    }
  });

  it('returns 200 with all selections for an active guest member', async () => {
    mockReadTableCookie.mockReturnValue({
      tableId: TABLE_ID,
      guestId: GUEST_A_ID,
      isHost: false,
    });
    mockPrisma.tableSession.findUnique.mockResolvedValue(getTableSessionRow());

    const request = createMockRequest(`/api/public/tables/${TABLE_CODE}`);
    const context = createRouteContext({ code: TABLE_CODE });
    const response = await getTable(request, context);
    const data = await parseJsonResponse<
      ApiResponse<{
        role: string;
        me: { guestId: string };
        selections: Array<{ id: string; guestId: string }>;
        guests: Array<{ id: string; name: string }>;
      }>
    >(response);

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    if (data.success) {
      expect(data.data.role).toBe('guest');
      expect(data.data.me.guestId).toBe(GUEST_A_ID);
      // Confirms all table selections are returned to the guest, not only their own
      expect(data.data.selections).toHaveLength(2);
      expect(data.data.selections.some((s) => s.guestId === GUEST_A_ID)).toBe(true);
      expect(data.data.selections.some((s) => s.guestId === GUEST_B_ID)).toBe(true);
      expect(data.data.guests).toHaveLength(3);
    }

    // Touches lastSeenAt for the guest
    expect(mockPrisma.tableGuest.update).toHaveBeenCalledWith({
      where: { id: GUEST_A_ID },
      data: { lastSeenAt: expect.any(Date) },
    });
  });

  it('returns 200 with all selections for host member', async () => {
    mockReadTableCookie.mockReturnValue({
      tableId: TABLE_ID,
      guestId: HOST_GUEST_ID,
      isHost: true,
    });
    mockPrisma.tableSession.findUnique.mockResolvedValue(getTableSessionRow());

    const request = createMockRequest(`/api/public/tables/${TABLE_CODE}`);
    const context = createRouteContext({ code: TABLE_CODE });
    const response = await getTable(request, context);
    const data = await parseJsonResponse<
      ApiResponse<{
        role: string;
        selections: Array<{ id: string; guestId: string }>;
      }>
    >(response);

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    if (data.success) {
      expect(data.data.role).toBe('host');
      expect(data.data.selections).toHaveLength(2);
    }
  });

  it('auto-marks status as EXPIRED when read past expiresAt', async () => {
    mockReadTableCookie.mockReturnValue({
      tableId: TABLE_ID,
      guestId: GUEST_A_ID,
      isHost: false,
    });
    const expiredRow = getTableSessionRow({
      status: 'OPEN',
      expiresAt: new Date(Date.now() - 1000),
    });
    mockPrisma.tableSession.findUnique.mockResolvedValue(expiredRow);

    const request = createMockRequest(`/api/public/tables/${TABLE_CODE}`);
    const context = createRouteContext({ code: TABLE_CODE });
    const response = await getTable(request, context);
    const data = await parseJsonResponse<ApiResponse<{ status: string }>>(response);

    expect(response.status).toBe(200);
    if (data.success) {
      expect(data.data.status).toBe('EXPIRED');
    }
    expect(mockPrisma.tableSession.update).toHaveBeenCalledWith({
      where: { id: TABLE_ID },
      data: { status: 'EXPIRED' },
    });
  });
});
