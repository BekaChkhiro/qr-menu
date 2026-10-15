/**
 * PIN-less Table Sessions API Tests
 *
 * Covers:
 *   POST /api/public/menus/[slug]/tables (create table without PIN)
 *   POST /api/public/tables/[code]/join   (join table without PIN, legacy table support, regressions)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createMockRequest,
  createRouteContext,
  parseJsonResponse,
  type ApiResponse,
} from './setup';

const {
  mockPrisma,
  mockReadTableCookie,
  mockSignTableToken,
  mockSetTableCookie,
  mockTriggerEvent,
  mockTableJoinLimiter,
} = vi.hoisted(() => {
  return {
    mockPrisma: {
      menu: {
        findUnique: vi.fn(),
      },
      tableSession: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
      tableGuest: {
        create: vi.fn(),
      },
      $transaction: vi.fn(),
    },
    mockReadTableCookie: vi.fn(),
    mockSignTableToken: vi.fn().mockReturnValue('mock-jwt-token'),
    mockSetTableCookie: vi.fn(),
    mockTriggerEvent: vi.fn().mockResolvedValue(true),
    mockTableJoinLimiter: {
      consume: vi.fn().mockResolvedValue({ success: true, remaining: 9, reset: Date.now() + 60000 }),
    },
  };
});

vi.mock('@/lib/db', () => ({
  prisma: mockPrisma,
}));

vi.mock('@/lib/auth/table-token', () => ({
  signTableToken: (...args: unknown[]) => mockSignTableToken(...args),
  setTableCookie: (...args: unknown[]) => mockSetTableCookie(...args),
  readTableCookie: (...args: unknown[]) => mockReadTableCookie(...args),
  TABLE_COOKIE_TTL_SECONDS: 14400,
}));

vi.mock('@/lib/rate-limit', () => ({
  tableJoinLimiter: mockTableJoinLimiter,
  getClientIp: () => '127.0.0.1',
}));

vi.mock('@/lib/pusher/server', () => ({
  triggerEvent: (...args: unknown[]) => mockTriggerEvent(...args),
  CHANNELS: { table: (code: string) => `table-${code}` },
  EVENTS: {
    TABLE_GUEST_JOINED: 'table:guest_joined',
  },
}));

import { POST as createTable } from '@/app/api/public/menus/[slug]/tables/route';
import { POST as joinTable } from '@/app/api/public/tables/[code]/join/route';

describe('PIN-less Table API Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTableJoinLimiter.consume.mockResolvedValue({
      success: true,
      remaining: 9,
      reset: Date.now() + 60000,
    });
    mockReadTableCookie.mockReturnValue(null);
  });

  describe('POST /api/public/menus/[slug]/tables (create table)', () => {
    it('creates table session without PIN (pinHash is null, no hash created)', async () => {
      mockPrisma.menu.findUnique.mockResolvedValue({
        id: 'menu-1',
        status: 'PUBLISHED',
        sharedTableEnabled: true,
        user: { plan: 'PRO' },
      });

      let createdData: Record<string, unknown> | null = null;
      mockPrisma.$transaction.mockImplementation(async (callback: (tx: typeof mockPrisma) => Promise<unknown>) => {
        const tx = {
          tableSession: {
            create: vi.fn().mockImplementation(({ data }) => {
              createdData = data;
              return {
                id: 'table-session-1',
                code: data.code,
                expiresAt: data.expiresAt,
              };
            }),
          },
          tableGuest: {
            create: vi.fn().mockResolvedValue({ id: 'host-guest-1' }),
          },
        };
        return callback(tx as unknown as typeof mockPrisma);
      });

      const req = createMockRequest('/api/public/menus/linville/tables', {
        method: 'POST',
        body: {
          hostName: 'Nino',
          maxGuests: 6,
        },
      });

      const res = await createTable(req, createRouteContext({ slug: 'linville' }));
      expect(res.status).toBe(201);

      const body = await parseJsonResponse<ApiResponse<{ code: string; hostGuestId: string }>>(res);
      expect(body.success).toBe(true);
      if (body.success) {
        expect(body.data.hostGuestId).toBe('host-guest-1');
        expect(body.data.code).toHaveLength(8);
      }

      // Verify that pinHash was stored as null (no bcrypt hash)
      expect(createdData).not.toBeNull();
      expect((createdData as unknown as { pinHash: unknown }).pinHash).toBeNull();
      expect(mockSignTableToken).toHaveBeenCalledWith({
        tableId: 'table-session-1',
        guestId: 'host-guest-1',
        isHost: true,
      });
      expect(mockSetTableCookie).toHaveBeenCalled();
    });

    it('returns 403 PLAN_DOWNGRADED if menu owner is not PRO', async () => {
      mockPrisma.menu.findUnique.mockResolvedValue({
        id: 'menu-1',
        status: 'PUBLISHED',
        sharedTableEnabled: true,
        user: { plan: 'STARTER' },
      });

      const req = createMockRequest('/api/public/menus/linville/tables', {
        method: 'POST',
        body: { hostName: 'Nino', maxGuests: 4 },
      });

      const res = await createTable(req, createRouteContext({ slug: 'linville' }));
      expect(res.status).toBe(403);
      const body = await parseJsonResponse<ApiResponse<unknown>>(res);
      expect(body.success).toBe(false);
      if (!body.success) {
        expect(body.error.code).toBe('PLAN_DOWNGRADED');
      }
    });

    it('returns 404 MENU_NOT_FOUND if sharedTableEnabled is false', async () => {
      mockPrisma.menu.findUnique.mockResolvedValue({
        id: 'menu-1',
        status: 'PUBLISHED',
        sharedTableEnabled: false,
        user: { plan: 'PRO' },
      });

      const req = createMockRequest('/api/public/menus/linville/tables', {
        method: 'POST',
        body: { hostName: 'Nino', maxGuests: 4 },
      });

      const res = await createTable(req, createRouteContext({ slug: 'linville' }));
      expect(res.status).toBe(404);
      const body = await parseJsonResponse<ApiResponse<unknown>>(res);
      expect(body.success).toBe(false);
      if (!body.success) {
        expect(body.error.code).toBe('MENU_NOT_FOUND');
      }
    });

    it('returns 400 VALIDATION_ERROR on invalid hostName or maxGuests', async () => {
      const req = createMockRequest('/api/public/menus/linville/tables', {
        method: 'POST',
        body: { hostName: '', maxGuests: 1 },
      });

      const res = await createTable(req, createRouteContext({ slug: 'linville' }));
      expect(res.status).toBe(400);
      const body = await parseJsonResponse<ApiResponse<unknown>>(res);
      expect(body.success).toBe(false);
      if (!body.success) {
        expect(body.error.code).toBe('VALIDATION_ERROR');
      }
    });
  });

  describe('POST /api/public/tables/[code]/join (join table)', () => {
    it('joins a PIN-less table (pinHash is null) with name only', async () => {
      mockPrisma.tableSession.findUnique.mockResolvedValue({
        id: 'table-1',
        status: 'OPEN',
        expiresAt: new Date(Date.now() + 3600000),
        maxGuests: 4,
        guests: [{ id: 'host-1', isHost: true }],
      });

      mockPrisma.tableGuest.create.mockResolvedValue({
        id: 'guest-2',
        name: 'Alice',
        isHost: false,
        joinedAt: new Date(),
      });

      const req = createMockRequest('/api/public/tables/CODE1234/join', {
        method: 'POST',
        body: { name: 'Alice' },
      });

      const res = await joinTable(req, createRouteContext({ code: 'CODE1234' }));
      expect(res.status).toBe(200);

      const body = await parseJsonResponse<ApiResponse<{ guestId: string; role: string; rejoined: boolean }>>(res);
      expect(body.success).toBe(true);
      if (body.success) {
        expect(body.data.guestId).toBe('guest-2');
        expect(body.data.role).toBe('guest');
        expect(body.data.rejoined).toBe(false);
      }

      expect(mockSignTableToken).toHaveBeenCalledWith({
        tableId: 'table-1',
        guestId: 'guest-2',
        isHost: false,
      });
      expect(mockSetTableCookie).toHaveBeenCalled();
      expect(mockTriggerEvent).toHaveBeenCalledWith(
        'table-CODE1234',
        'table:guest_joined',
        expect.objectContaining({
          guestId: 'guest-2',
          name: 'Alice',
          isHost: false,
        }),
      );
    });

    it('joins a legacy table with pinHash string without requiring or checking PIN', async () => {
      mockPrisma.tableSession.findUnique.mockResolvedValue({
        id: 'table-legacy',
        pinHash: '$2a$10$legacyHashedBcryptStringThatShouldBeIgnored',
        status: 'OPEN',
        expiresAt: new Date(Date.now() + 3600000),
        maxGuests: 4,
        guests: [{ id: 'host-1', isHost: true }],
      });

      mockPrisma.tableGuest.create.mockResolvedValue({
        id: 'guest-legacy',
        name: 'Legacy Guest',
        isHost: false,
        joinedAt: new Date(),
      });

      // Guest sends NO PIN at all
      const req = createMockRequest('/api/public/tables/LEGACY01/join', {
        method: 'POST',
        body: { name: 'Legacy Guest' },
      });

      const res = await joinTable(req, createRouteContext({ code: 'LEGACY01' }));
      expect(res.status).toBe(200);

      const body = await parseJsonResponse<ApiResponse<{ guestId: string; role: string }>>(res);
      expect(body.success).toBe(true);
      if (body.success) {
        expect(body.data.guestId).toBe('guest-legacy');
        expect(body.data.role).toBe('guest');
      }
    });

    it('returns 409 TABLE_FULL when guest cap is reached', async () => {
      mockPrisma.tableSession.findUnique.mockResolvedValue({
        id: 'table-full',
        status: 'OPEN',
        expiresAt: new Date(Date.now() + 3600000),
        maxGuests: 2,
        guests: [
          { id: 'host-1', isHost: true },
          { id: 'guest-1', isHost: false },
        ],
      });

      const req = createMockRequest('/api/public/tables/FULL1234/join', {
        method: 'POST',
        body: { name: 'Late Guest' },
      });

      const res = await joinTable(req, createRouteContext({ code: 'FULL1234' }));
      expect(res.status).toBe(409);

      const body = await parseJsonResponse<ApiResponse<unknown>>(res);
      expect(body.success).toBe(false);
      if (!body.success) {
        expect(body.error.code).toBe('TABLE_FULL');
      }
    });

    it('returns 410 TABLE_GONE when table is CLOSED or expired', async () => {
      // Case 1: Status is CLOSED
      mockPrisma.tableSession.findUnique.mockResolvedValueOnce({
        id: 'table-closed',
        status: 'CLOSED',
        expiresAt: new Date(Date.now() + 3600000),
        maxGuests: 4,
        guests: [],
      });

      const reqClosed = createMockRequest('/api/public/tables/CLOSED01/join', {
        method: 'POST',
        body: { name: 'Alice' },
      });
      const resClosed = await joinTable(reqClosed, createRouteContext({ code: 'CLOSED01' }));
      expect(resClosed.status).toBe(410);

      // Case 2: Expired timestamp
      mockPrisma.tableSession.findUnique.mockResolvedValueOnce({
        id: 'table-expired',
        status: 'OPEN',
        expiresAt: new Date(Date.now() - 10000), // past
        maxGuests: 4,
        guests: [],
      });

      const reqExpired = createMockRequest('/api/public/tables/EXPIRED1/join', {
        method: 'POST',
        body: { name: 'Alice' },
      });
      const resExpired = await joinTable(reqExpired, createRouteContext({ code: 'EXPIRED1' }));
      expect(resExpired.status).toBe(410);
    });

    it('returns 404 TABLE_NOT_FOUND when table does not exist', async () => {
      mockPrisma.tableSession.findUnique.mockResolvedValue(null);

      const req = createMockRequest('/api/public/tables/NOTFOUND/join', {
        method: 'POST',
        body: { name: 'Alice' },
      });

      const res = await joinTable(req, createRouteContext({ code: 'NOTFOUND' }));
      expect(res.status).toBe(404);
      const body = await parseJsonResponse<ApiResponse<unknown>>(res);
      expect(body.success).toBe(false);
      if (!body.success) {
        expect(body.error.code).toBe('TABLE_NOT_FOUND');
      }
    });

    it('returns 429 RATE_LIMITED when join rate limit is exceeded', async () => {
      mockTableJoinLimiter.consume.mockResolvedValueOnce({
        success: false,
        remaining: 0,
        reset: Date.now() + 30000,
      });

      const req = createMockRequest('/api/public/tables/SPAMCODE/join', {
        method: 'POST',
        body: { name: 'Spammer' },
      });

      const res = await joinTable(req, createRouteContext({ code: 'SPAMCODE' }));
      expect(res.status).toBe(429);
      expect(res.headers.get('Retry-After')).toBeTruthy();

      const body = await parseJsonResponse<ApiResponse<unknown>>(res);
      expect(body.success).toBe(false);
      if (!body.success) {
        expect(body.error.code).toBe('RATE_LIMITED');
      }
    });

    it('rejoin path: rejoining with existing cookie returns existing guest without creating duplicate', async () => {
      mockPrisma.tableSession.findUnique.mockResolvedValue({
        id: 'table-1',
        status: 'OPEN',
        expiresAt: new Date(Date.now() + 3600000),
        maxGuests: 4,
        guests: [{ id: 'guest-existing', isHost: false }],
      });

      mockReadTableCookie.mockReturnValue({
        tableId: 'table-1',
        guestId: 'guest-existing',
        isHost: false,
      });

      const req = createMockRequest('/api/public/tables/CODE1234/join', {
        method: 'POST',
        body: { name: 'Alice' },
      });

      const res = await joinTable(req, createRouteContext({ code: 'CODE1234' }));
      expect(res.status).toBe(200);

      const body = await parseJsonResponse<ApiResponse<{ guestId: string; rejoined: boolean }>>(res);
      expect(body.success).toBe(true);
      if (body.success) {
        expect(body.data.guestId).toBe('guest-existing');
        expect(body.data.rejoined).toBe(true);
      }

      expect(mockPrisma.tableGuest.create).not.toHaveBeenCalled();
    });
  });
});
