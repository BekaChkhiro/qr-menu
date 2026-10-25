/**
 * T2.6 — the product a COMBO promotion generates in the system Offers category
 * is rebuilt from the promotion on every save, so the product routes refuse
 * direct edits/deletes of it (409 PROMOTION_MANAGED) instead of letting it drift.
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

const { mockPrisma, mockAuth } = vi.hoisted(() => ({
  mockPrisma: {
    menu: { findUnique: vi.fn() },
    product: { findFirst: vi.fn(), delete: vi.fn() },
    promotion: { findFirst: vi.fn() },
  },
  mockAuth: vi.fn(),
}));

vi.mock('@/lib/db', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/auth/auth', () => ({ auth: () => mockAuth() }));
vi.mock('@/lib/cache/redis', () => ({ invalidateMenuCache: vi.fn() }));
vi.mock('@/lib/pusher/server', () => ({
  triggerMenuEvent: vi.fn(),
  EVENTS: { PRODUCT_UPDATED: 'product:updated', PRODUCT_DELETED: 'product:deleted' },
}));
vi.mock('@/lib/activity/log', () => ({ logActivity: vi.fn() }));

import { PUT, DELETE } from '@/app/api/menus/[id]/products/[pid]/route';

describe('Product API — promotion-managed combo products', () => {
  const user = createMockUser({ plan: 'PRO' });
  const menu = createMockMenu({ userId: user.id });
  const productId = 'combo-product-1';
  const url = `http://localhost/api/menus/${menu.id}/products/${productId}`;
  const ctx = () => createRouteContext({ id: menu.id, pid: productId });

  beforeEach(() => {
    vi.clearAllMocks();
    resetIdCounter();
    mockAuth.mockResolvedValue(createMockSession(user));
    mockPrisma.menu.findUnique.mockResolvedValue({ userId: user.id, slug: menu.slug });
    mockPrisma.product.findFirst.mockResolvedValue({
      id: productId,
      categoryId: 'offers-cat',
      kind: 'COMBO',
      comboItems: [],
    });
    mockPrisma.product.delete.mockResolvedValue({ id: productId });
    mockPrisma.promotion.findFirst.mockResolvedValue({ id: 'promo-1', titleKa: 'სადა' });
  });

  it('rejects editing the generated product and names the promotion', async () => {
    const response = await PUT(
      createMockRequest(url, { method: 'PUT', body: { nameKa: 'სხვა', price: 5 } }),
      ctx(),
    );
    const body = await parseJsonResponse(response);

    expect(response.status).toBe(409);
    expect(body).toMatchObject({
      success: false,
      error: { code: 'PROMOTION_MANAGED', details: { promotionId: 'promo-1' } },
    });
    expect(mockPrisma.promotion.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { menuId: menu.id, type: 'COMBO', comboProductId: productId },
      }),
    );
  });

  it('rejects deleting the generated product and leaves it in place', async () => {
    const response = await DELETE(createMockRequest(url, { method: 'DELETE' }), ctx());
    const body = await parseJsonResponse(response);

    expect(response.status).toBe(409);
    expect(body).toMatchObject({ error: { code: 'PROMOTION_MANAGED' } });
    expect(mockPrisma.product.delete).not.toHaveBeenCalled();
  });

  it('still deletes a product no promotion manages', async () => {
    mockPrisma.promotion.findFirst.mockResolvedValue(null);

    const response = await DELETE(createMockRequest(url, { method: 'DELETE' }), ctx());

    expect(response.status).toBe(200);
    expect(mockPrisma.product.delete).toHaveBeenCalledWith({ where: { id: productId } });
  });
});
