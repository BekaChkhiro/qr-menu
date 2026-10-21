/**
 * Promotion API Tests
 * Tests for /api/menus/:id/promotions endpoints — the "Date range" switch
 * (dateRangeEnabled) is a drawer-only flag and must never reach Prisma.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createMockUser,
  createMockSession,
  createMockMenu,
  createMockRequest,
  createRouteContext,
  parseJsonResponse,
  resetIdCounter,
} from './setup';

const { mockPrisma, mockAuth, mockInvalidateCache, mockTriggerEvent, mockLogActivity, mockSyncCombo } = vi.hoisted(() => {
  return {
    mockPrisma: {
      user: { findUnique: vi.fn() },
      menu: { findUnique: vi.fn() },
      promotion: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
    },
    mockAuth: vi.fn(),
    mockInvalidateCache: vi.fn(),
    mockTriggerEvent: vi.fn(),
    mockLogActivity: vi.fn(),
    mockSyncCombo: vi.fn(async () => undefined),
  };
});

vi.mock('@/lib/db', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/auth/auth', () => ({ auth: () => mockAuth() }));
vi.mock('@/lib/cache/redis', () => ({
  invalidateMenuCache: (...args: unknown[]) => mockInvalidateCache(...args),
}));
vi.mock('@/lib/pusher/server', () => ({
  triggerMenuEvent: (...args: unknown[]) => mockTriggerEvent(...args),
  EVENTS: {
    PROMOTION_CREATED: 'promotion:created',
    PROMOTION_UPDATED: 'promotion:updated',
    PROMOTION_DELETED: 'promotion:deleted',
  },
}));
vi.mock('@/lib/activity/log', () => ({
  logActivity: (...args: unknown[]) => mockLogActivity(...args),
}));
vi.mock('@/lib/promotions/combo', () => ({
  syncComboProduct: (...args: unknown[]) => mockSyncCombo(...args),
  deleteComboProductFor: vi.fn(async () => undefined),
}));

import { POST } from '@/app/api/menus/[id]/promotions/route';
import { PUT } from '@/app/api/menus/[id]/promotions/[pid]/route';
import { POST as DUPLICATE } from '@/app/api/menus/[id]/promotions/[pid]/duplicate/route';

const START = '2026-10-21T00:00:00.000Z';
const END = '2026-10-28T00:00:00.000Z';

function bannerBody(extra: Record<string, unknown> = {}) {
  return {
    titleKa: 'ლანჩი',
    type: 'BANNER',
    isActive: true,
    ...extra,
  };
}

describe('Promotion API — dateRangeEnabled', () => {
  const user = createMockUser({ plan: 'PRO' });
  const session = createMockSession(user);
  const menu = createMockMenu({ userId: user.id });

  beforeEach(() => {
    vi.clearAllMocks();
    resetIdCounter();
    mockAuth.mockResolvedValue(session);
    mockPrisma.user.findUnique.mockResolvedValue({ plan: 'PRO' });
    mockPrisma.menu.findUnique.mockResolvedValue({ userId: user.id, slug: menu.slug, timezone: 'Asia/Tbilisi' });
    mockPrisma.promotion.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      id: 'promo-1',
      menuId: menu.id,
      isActive: true,
      ...data,
    }));
    mockPrisma.promotion.findUnique.mockImplementation(async () => ({ id: 'promo-1', titleKa: 'ლანჩი' }));
    mockPrisma.promotion.update.mockResolvedValue({ id: 'promo-1' });
  });

  describe('POST /api/menus/:id/promotions', () => {
    it('does not pass dateRangeEnabled to Prisma and stores open-ended dates when the switch is off', async () => {
      const request = createMockRequest(`http://localhost/api/menus/${menu.id}/promotions`, {
        method: 'POST',
        body: bannerBody({ dateRangeEnabled: false, startDate: START, endDate: END }),
      });

      const response = await POST(request, createRouteContext({ id: menu.id }));

      expect(response.status).toBe(201);
      const { data } = mockPrisma.promotion.create.mock.calls[0][0] as { data: Record<string, unknown> };
      expect(data).not.toHaveProperty('dateRangeEnabled');
      expect(data.startDate).toBeNull();
      expect(data.endDate).toBeNull();
      expect(data.menuId).toBe(menu.id);
    });

    it('stores the dates and still strips the flag when the switch is on', async () => {
      const request = createMockRequest(`http://localhost/api/menus/${menu.id}/promotions`, {
        method: 'POST',
        body: bannerBody({ dateRangeEnabled: true, startDate: START, endDate: END }),
      });

      const response = await POST(request, createRouteContext({ id: menu.id }));

      expect(response.status).toBe(201);
      const { data } = mockPrisma.promotion.create.mock.calls[0][0] as { data: Record<string, unknown> };
      expect(data).not.toHaveProperty('dateRangeEnabled');
      expect(new Date(data.startDate as string).toISOString()).toBe(START);
      expect(new Date(data.endDate as string).toISOString()).toBe(END);
    });

    it('accepts a body without the flag (legacy callers)', async () => {
      const request = createMockRequest(`http://localhost/api/menus/${menu.id}/promotions`, {
        method: 'POST',
        body: bannerBody(),
      });

      const response = await POST(request, createRouteContext({ id: menu.id }));
      const body = await parseJsonResponse<{ success: boolean }>(response);

      expect(response.status).toBe(201);
      expect(body.success).toBe(true);
      const { data } = mockPrisma.promotion.create.mock.calls[0][0] as { data: Record<string, unknown> };
      expect(data).not.toHaveProperty('dateRangeEnabled');
    });
  });

  describe('PUT /api/menus/:id/promotions/:pid', () => {
    beforeEach(() => {
      mockPrisma.promotion.findUnique.mockImplementation(async ({ where }: { where: { id: string } }) => ({
        id: where.id,
        menuId: menu.id,
        titleKa: 'ლანჩი',
        isActive: true,
        startDate: new Date(START),
        endDate: new Date(END),
        type: 'BANNER',
      }));
    });

    it('clears both dates and does not pass the flag when the switch is off', async () => {
      const request = createMockRequest(`http://localhost/api/menus/${menu.id}/promotions/promo-1`, {
        method: 'PUT',
        body: { dateRangeEnabled: false, startDate: null, endDate: null },
      });

      const response = await PUT(request, createRouteContext({ id: menu.id, pid: 'promo-1' }));

      expect(response.status).toBe(200);
      const { data } = mockPrisma.promotion.update.mock.calls[0][0] as { data: Record<string, unknown> };
      expect(data).not.toHaveProperty('dateRangeEnabled');
      expect(data.startDate).toBeNull();
      expect(data.endDate).toBeNull();
    });

    it('leaves stored dates alone when the flag is on but no dates are sent', async () => {
      const request = createMockRequest(`http://localhost/api/menus/${menu.id}/promotions/promo-1`, {
        method: 'PUT',
        body: { dateRangeEnabled: true, titleKa: 'ახალი სათაური' },
      });

      const response = await PUT(request, createRouteContext({ id: menu.id, pid: 'promo-1' }));

      expect(response.status).toBe(200);
      const { data } = mockPrisma.promotion.update.mock.calls[0][0] as { data: Record<string, unknown> };
      expect(data).not.toHaveProperty('dateRangeEnabled');
      expect(data).not.toHaveProperty('startDate');
      expect(data).not.toHaveProperty('endDate');
    });
  });

  describe('COMBO promotions', () => {
    const comboBody = (extra: Record<string, unknown> = {}) => ({
      titleKa: 'ლანჩ-კომბო',
      type: 'COMBO',
      comboProductIds: ['dish-a', 'dish-b'],
      comboPrice: 12,
      isActive: true,
      ...extra,
    });

    it('creates a COMBO promotion and materialises its product', async () => {
      const request = createMockRequest(`http://localhost/api/menus/${menu.id}/promotions`, {
        method: 'POST',
        body: comboBody(),
      });

      const response = await POST(request, createRouteContext({ id: menu.id }));

      expect(response.status).toBe(201);
      const { data } = mockPrisma.promotion.create.mock.calls[0][0] as { data: Record<string, unknown> };
      expect(data.type).toBe('COMBO');
      expect(data.comboProductIds).toEqual(['dish-a', 'dish-b']);
      expect(Number(data.comboPrice)).toBe(12);
      expect(mockSyncCombo).toHaveBeenCalledWith('promo-1');
    });

    it('rejects a COMBO with fewer than two dishes', async () => {
      const request = createMockRequest(`http://localhost/api/menus/${menu.id}/promotions`, {
        method: 'POST',
        body: comboBody({ comboProductIds: ['dish-a'] }),
      });

      const response = await POST(request, createRouteContext({ id: menu.id }));

      expect(response.status).toBe(400);
      expect(mockPrisma.promotion.create).not.toHaveBeenCalled();
      expect(mockSyncCombo).not.toHaveBeenCalled();
    });

    it('rejects a COMBO without a positive combo price', async () => {
      const request = createMockRequest(`http://localhost/api/menus/${menu.id}/promotions`, {
        method: 'POST',
        body: comboBody({ comboPrice: null }),
      });

      const response = await POST(request, createRouteContext({ id: menu.id }));

      expect(response.status).toBe(400);
      expect(mockPrisma.promotion.create).not.toHaveBeenCalled();
    });

    it('duplicates a COMBO promotion into a fresh, switched-off copy with its own product', async () => {
      const source = {
        id: 'promo-src',
        menuId: menu.id,
        type: 'COMBO',
        titleKa: 'ლანჩ-კომბო',
        titleEn: 'Lunch combo',
        titleRu: null,
        descriptionKa: null,
        descriptionEn: null,
        descriptionRu: null,
        imageUrl: null,
        startDate: null,
        endDate: null,
        discountType: null,
        discountValue: null,
        applyTo: null,
        categoryId: null,
        backgroundColor: null,
        showTitle: true,
        comboProductIds: ['dish-a', 'dish-b'],
        comboPrice: 12,
        comboProductId: 'product-src',
        timeRestrictions: null,
      };
      mockPrisma.promotion.findFirst.mockImplementation(async ({ where }: { where: { id?: string } }) =>
        where.id ? source : { sortOrder: 0 },
      );

      const response = await DUPLICATE(
        createMockRequest(`http://localhost/api/menus/${menu.id}/promotions/promo-src/duplicate`, { method: 'POST' }),
        createRouteContext({ id: menu.id, pid: 'promo-src' }),
      );

      expect(response.status).toBe(201);
      const { data } = mockPrisma.promotion.create.mock.calls[0][0] as { data: Record<string, unknown> };
      expect(data.type).toBe('COMBO');
      expect(data.isActive).toBe(false);
      expect(data.comboProductIds).toEqual(['dish-a', 'dish-b']);
      expect(data.comboProductId).toBeNull();
      expect(mockSyncCombo).toHaveBeenCalledWith('promo-1');
    });
  });
});
