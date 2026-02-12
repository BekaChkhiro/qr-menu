/**
 * Menu API Tests
 * Tests for /api/menus endpoints
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createMockUser,
  createMockSession,
  createMockMenu,
  createMockRequest,
  createRouteContext,
  parseJsonResponse,
  resetIdCounter,
  type ApiResponse,
  type ApiPaginatedResponse,
  type MockMenu,
} from './setup';

// Use vi.hoisted to create mocks that can be used in vi.mock
const { mockPrisma, mockAuth, mockInvalidateCache, mockTriggerEvent } = vi.hoisted(() => {
  return {
    mockPrisma: {
      user: {
        findUnique: vi.fn(),
      },
      menu: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
      },
      category: {
        count: vi.fn(),
      },
    },
    mockAuth: vi.fn(),
    mockInvalidateCache: vi.fn(),
    mockTriggerEvent: vi.fn(),
  };
});

vi.mock('@/lib/db', () => ({
  prisma: mockPrisma,
}));

vi.mock('@/lib/auth/auth', () => ({
  auth: () => mockAuth(),
}));

vi.mock('@/lib/cache/redis', () => ({
  invalidateMenuCache: (...args: unknown[]) => mockInvalidateCache(...args),
  cacheSet: vi.fn().mockResolvedValue(true),
  CACHE_KEYS: {
    publicMenu: (slug: string) => `menu:public:${slug}`,
  },
  CACHE_TTL: {
    PUBLIC_MENU: 300,
  },
}));

vi.mock('@/lib/pusher/server', () => ({
  triggerMenuEvent: (...args: unknown[]) => mockTriggerEvent(...args),
  EVENTS: {
    MENU_UPDATED: 'menu:updated',
    MENU_DELETED: 'menu:deleted',
    MENU_PUBLISHED: 'menu:published',
    MENU_UNPUBLISHED: 'menu:unpublished',
  },
}));

// Import route handlers after mocking
import { GET, POST } from '@/app/api/menus/route';
import { GET as getMenu, PUT as updateMenu, DELETE as deleteMenu } from '@/app/api/menus/[id]/route';
import { POST as publishMenu } from '@/app/api/menus/[id]/publish/route';

describe('Menu API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetIdCounter();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ==========================================================================
  // Authentication Tests
  // ==========================================================================

  describe('Authentication', () => {
    it('returns 401 when not authenticated - GET /api/menus', async () => {
      mockAuth.mockResolvedValue(null);

      const request = createMockRequest('/api/menus');
      const response = await GET(request);
      const data = await parseJsonResponse<ApiResponse<unknown>>(response);

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      if (!data.success) {
        expect(data.error.code).toBe('UNAUTHORIZED');
      }
    });

    it('returns 401 when not authenticated - POST /api/menus', async () => {
      mockAuth.mockResolvedValue(null);

      const request = createMockRequest('/api/menus', {
        method: 'POST',
        body: { name: 'Test Menu', slug: 'test-menu' },
      });
      const response = await POST(request);
      const data = await parseJsonResponse<ApiResponse<unknown>>(response);

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });

    it('returns 401 when not authenticated - GET /api/menus/:id', async () => {
      mockAuth.mockResolvedValue(null);

      const request = createMockRequest('/api/menus/menu-1');
      const context = createRouteContext({ id: 'menu-1' });
      const response = await getMenu(request, context);

      expect(response.status).toBe(401);
    });
  });

  // ==========================================================================
  // GET /api/menus - List Menus
  // ==========================================================================

  describe('GET /api/menus', () => {
    const user = createMockUser();
    const session = createMockSession(user);

    beforeEach(() => {
      mockAuth.mockResolvedValue(session);
    });

    it('returns empty list when user has no menus', async () => {
      mockPrisma.menu.findMany.mockResolvedValue([]);
      mockPrisma.menu.count.mockResolvedValue(0);

      const request = createMockRequest('/api/menus');
      const response = await GET(request);
      const data = await parseJsonResponse<ApiPaginatedResponse<MockMenu>>(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
      expect(data.pagination.total).toBe(0);
    });

    it('returns paginated menus for authenticated user', async () => {
      const menus = [createMockMenu(), createMockMenu()];
      mockPrisma.menu.findMany.mockResolvedValue(menus);
      mockPrisma.menu.count.mockResolvedValue(2);

      const request = createMockRequest('/api/menus?page=1&limit=10');
      const response = await GET(request);
      const data = await parseJsonResponse<ApiPaginatedResponse<MockMenu>>(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
      expect(data.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      });
    });

    it('filters menus by status', async () => {
      const publishedMenu = createMockMenu({ status: 'PUBLISHED' });
      mockPrisma.menu.findMany.mockResolvedValue([publishedMenu]);
      mockPrisma.menu.count.mockResolvedValue(1);

      const request = createMockRequest('/api/menus?status=PUBLISHED');
      const response = await GET(request);
      const data = await parseJsonResponse<ApiPaginatedResponse<MockMenu>>(response);

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(1);
      expect(mockPrisma.menu.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'PUBLISHED',
          }),
        })
      );
    });

    it('only returns menus owned by the user', async () => {
      mockPrisma.menu.findMany.mockResolvedValue([]);
      mockPrisma.menu.count.mockResolvedValue(0);

      const request = createMockRequest('/api/menus');
      await GET(request);

      expect(mockPrisma.menu.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: user.id,
          }),
        })
      );
    });
  });

  // ==========================================================================
  // POST /api/menus - Create Menu
  // ==========================================================================

  describe('POST /api/menus', () => {
    const user = createMockUser();
    const session = createMockSession(user);

    beforeEach(() => {
      mockAuth.mockResolvedValue(session);
    });

    it('creates a new menu with valid data', async () => {
      const newMenu = createMockMenu({ userId: user.id });
      // Mock user lookup for plan limit check
      mockPrisma.user.findUnique.mockResolvedValue({
        ...user,
        _count: { menus: 0 },
      });
      mockPrisma.menu.findUnique.mockResolvedValue(null); // Slug not taken
      mockPrisma.menu.create.mockResolvedValue(newMenu);

      const request = createMockRequest('/api/menus', {
        method: 'POST',
        body: {
          name: 'My Restaurant',
          slug: 'my-restaurant',
          description: 'Delicious food',
        },
      });
      const response = await POST(request);
      const data = await parseJsonResponse<ApiResponse<MockMenu>>(response);

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      if (data.success) {
        expect(data.data.name).toBeDefined();
      }
    });

    it('returns 400 for invalid input - missing name', async () => {
      // Mock user lookup (happens before validation)
      mockPrisma.user.findUnique.mockResolvedValue({
        ...user,
        _count: { menus: 0 },
      });

      const request = createMockRequest('/api/menus', {
        method: 'POST',
        body: { slug: 'test' },
      });
      const response = await POST(request);
      const data = await parseJsonResponse<ApiResponse<unknown>>(response);

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      if (!data.success) {
        expect(data.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('returns 400 for invalid slug format', async () => {
      // Mock user lookup (happens before validation error is caught)
      mockPrisma.user.findUnique.mockResolvedValue({
        ...user,
        _count: { menus: 0 },
      });

      const request = createMockRequest('/api/menus', {
        method: 'POST',
        body: { name: 'Test', slug: 'Invalid Slug With Spaces!' },
      });
      const response = await POST(request);
      const data = await parseJsonResponse<ApiResponse<unknown>>(response);

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('returns 409 when slug already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...user,
        _count: { menus: 0 },
      });
      mockPrisma.menu.findUnique.mockResolvedValue(createMockMenu()); // Slug taken

      const request = createMockRequest('/api/menus', {
        method: 'POST',
        body: { name: 'Test', slug: 'existing-slug' },
      });
      const response = await POST(request);
      const data = await parseJsonResponse<ApiResponse<unknown>>(response);

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      if (!data.success) {
        expect(data.error.code).toBe('SLUG_EXISTS');
      }
    });

    it('returns 403 when FREE plan limit reached', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...user,
        _count: { menus: 1 }, // Already has 1 menu (FREE limit)
      });

      const request = createMockRequest('/api/menus', {
        method: 'POST',
        body: { name: 'Second Menu', slug: 'second-menu' },
      });
      const response = await POST(request);
      const data = await parseJsonResponse<ApiResponse<unknown>>(response);

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      if (!data.success) {
        expect(data.error.code).toBe('PLAN_LIMIT_REACHED');
      }
    });

    it('allows STARTER plan to create up to 3 menus', async () => {
      const starterUser = createMockUser({ plan: 'STARTER' });
      const starterSession = createMockSession(starterUser);
      mockAuth.mockResolvedValue(starterSession);

      // Mock user with menu count
      mockPrisma.user.findUnique.mockResolvedValue({
        ...starterUser,
        _count: { menus: 2 }, // Has 2 menus, can create 1 more
      });
      mockPrisma.menu.findUnique.mockResolvedValue(null); // Slug not taken
      mockPrisma.menu.create.mockResolvedValue(createMockMenu());

      const request = createMockRequest('/api/menus', {
        method: 'POST',
        body: { name: 'Third Menu', slug: 'third-menu' },
      });
      const response = await POST(request);

      expect(response.status).toBe(201);
    });

    it('allows PRO plan unlimited menus', async () => {
      const proUser = createMockUser({ plan: 'PRO' });
      const proSession = createMockSession(proUser);
      mockAuth.mockResolvedValue(proSession);

      // Mock user with menu count
      mockPrisma.user.findUnique.mockResolvedValue({
        ...proUser,
        _count: { menus: 100 }, // Many menus
      });
      mockPrisma.menu.findUnique.mockResolvedValue(null); // Slug not taken
      mockPrisma.menu.create.mockResolvedValue(createMockMenu());

      const request = createMockRequest('/api/menus', {
        method: 'POST',
        body: { name: 'Another Menu', slug: 'another-menu' },
      });
      const response = await POST(request);

      expect(response.status).toBe(201);
    });
  });

  // ==========================================================================
  // GET /api/menus/:id - Get Single Menu
  // ==========================================================================

  describe('GET /api/menus/:id', () => {
    const user = createMockUser();
    const session = createMockSession(user);

    beforeEach(() => {
      mockAuth.mockResolvedValue(session);
    });

    it('returns menu with categories and products', async () => {
      const menu = createMockMenu({
        userId: user.id,
        categories: [],
        promotions: [],
      });
      mockPrisma.menu.findUnique.mockResolvedValue(menu);

      const request = createMockRequest('/api/menus/menu-1');
      const context = createRouteContext({ id: 'menu-1' });
      const response = await getMenu(request, context);
      const data = await parseJsonResponse<ApiResponse<MockMenu>>(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('returns 404 for non-existent menu', async () => {
      mockPrisma.menu.findUnique.mockResolvedValue(null);

      const request = createMockRequest('/api/menus/non-existent');
      const context = createRouteContext({ id: 'non-existent' });
      const response = await getMenu(request, context);
      const data = await parseJsonResponse<ApiResponse<unknown>>(response);

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      if (!data.success) {
        expect(data.error.code).toBe('MENU_NOT_FOUND');
      }
    });

    it('returns 404 when accessing menu owned by another user', async () => {
      // Menu exists but owned by different user - query returns null due to userId filter
      mockPrisma.menu.findUnique.mockResolvedValue(null);

      const request = createMockRequest('/api/menus/other-users-menu');
      const context = createRouteContext({ id: 'other-users-menu' });
      const response = await getMenu(request, context);

      expect(response.status).toBe(404);
    });
  });

  // ==========================================================================
  // PUT /api/menus/:id - Update Menu
  // ==========================================================================

  describe('PUT /api/menus/:id', () => {
    const user = createMockUser();
    const session = createMockSession(user);

    beforeEach(() => {
      mockAuth.mockResolvedValue(session);
    });

    it('updates menu with valid data', async () => {
      const existingMenu = createMockMenu({ userId: user.id });
      const updatedMenu = { ...existingMenu, name: 'Updated Name' };

      mockPrisma.menu.findUnique.mockResolvedValue(existingMenu);
      mockPrisma.menu.findFirst.mockResolvedValue(null); // New slug not taken
      mockPrisma.menu.update.mockResolvedValue(updatedMenu);

      const request = createMockRequest('/api/menus/menu-1', {
        method: 'PUT',
        body: { name: 'Updated Name' },
      });
      const context = createRouteContext({ id: 'menu-1' });
      const response = await updateMenu(request, context);
      const data = await parseJsonResponse<ApiResponse<MockMenu>>(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('returns 404 when updating non-existent menu', async () => {
      mockPrisma.menu.findUnique.mockResolvedValue(null);

      const request = createMockRequest('/api/menus/non-existent', {
        method: 'PUT',
        body: { name: 'Updated' },
      });
      const context = createRouteContext({ id: 'non-existent' });
      const response = await updateMenu(request, context);

      expect(response.status).toBe(404);
    });

    it('returns 409 when updating to existing slug', async () => {
      const existingMenu = createMockMenu({ userId: user.id, slug: 'original-slug' });
      mockPrisma.menu.findUnique.mockResolvedValue(existingMenu);
      mockPrisma.menu.findFirst.mockResolvedValue(createMockMenu({ slug: 'taken-slug' }));

      const request = createMockRequest('/api/menus/menu-1', {
        method: 'PUT',
        body: { slug: 'taken-slug' },
      });
      const context = createRouteContext({ id: 'menu-1' });
      const response = await updateMenu(request, context);

      expect(response.status).toBe(409);
    });

    it('allows keeping same slug', async () => {
      const existingMenu = createMockMenu({ userId: user.id, slug: 'my-slug' });
      mockPrisma.menu.findUnique.mockResolvedValue(existingMenu);
      mockPrisma.menu.findFirst.mockResolvedValue(null);
      mockPrisma.menu.update.mockResolvedValue(existingMenu);

      const request = createMockRequest('/api/menus/menu-1', {
        method: 'PUT',
        body: { slug: 'my-slug', name: 'New Name' },
      });
      const context = createRouteContext({ id: 'menu-1' });
      const response = await updateMenu(request, context);

      expect(response.status).toBe(200);
    });
  });

  // ==========================================================================
  // DELETE /api/menus/:id - Delete Menu
  // ==========================================================================

  describe('DELETE /api/menus/:id', () => {
    const user = createMockUser();
    const session = createMockSession(user);

    beforeEach(() => {
      mockAuth.mockResolvedValue(session);
    });

    it('deletes menu successfully', async () => {
      const existingMenu = createMockMenu({ userId: user.id });
      mockPrisma.menu.findUnique.mockResolvedValue(existingMenu);
      mockPrisma.menu.delete.mockResolvedValue(existingMenu);

      const request = createMockRequest('/api/menus/menu-1', { method: 'DELETE' });
      const context = createRouteContext({ id: 'menu-1' });
      const response = await deleteMenu(request, context);
      const data = await parseJsonResponse<ApiResponse<{ deleted: boolean }>>(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('returns 404 when deleting non-existent menu', async () => {
      mockPrisma.menu.findUnique.mockResolvedValue(null);

      const request = createMockRequest('/api/menus/non-existent', { method: 'DELETE' });
      const context = createRouteContext({ id: 'non-existent' });
      const response = await deleteMenu(request, context);

      expect(response.status).toBe(404);
    });

    it('invalidates cache after deletion', async () => {
      const existingMenu = createMockMenu({ userId: user.id });
      mockPrisma.menu.findUnique.mockResolvedValue(existingMenu);
      mockPrisma.menu.delete.mockResolvedValue(existingMenu);

      const request = createMockRequest('/api/menus/menu-1', { method: 'DELETE' });
      const context = createRouteContext({ id: 'menu-1' });
      await deleteMenu(request, context);

      expect(mockInvalidateCache).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // POST /api/menus/:id/publish - Publish Menu
  // ==========================================================================

  describe('POST /api/menus/:id/publish', () => {
    const user = createMockUser();
    const session = createMockSession(user);

    beforeEach(() => {
      mockAuth.mockResolvedValue(session);
    });

    it('publishes draft menu with categories', async () => {
      const draftMenu = createMockMenu({
        userId: user.id,
        status: 'DRAFT',
        _count: { categories: 2, products: 5, promotions: 0, views: 0 },
      });
      const publishedMenu = { ...draftMenu, status: 'PUBLISHED', publishedAt: new Date() };

      mockPrisma.menu.findUnique.mockResolvedValue(draftMenu);
      mockPrisma.menu.update.mockResolvedValue(publishedMenu);

      const request = createMockRequest('/api/menus/menu-1/publish', {
        method: 'POST',
        body: { publish: true },
      });
      const context = createRouteContext({ id: 'menu-1' });
      const response = await publishMenu(request, context);
      const data = await parseJsonResponse<ApiResponse<MockMenu>>(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('returns 400 when publishing menu without categories', async () => {
      const emptyMenu = createMockMenu({
        userId: user.id,
        status: 'DRAFT',
        _count: { categories: 0, products: 0, promotions: 0, views: 0 },
      });

      mockPrisma.menu.findUnique.mockResolvedValue(emptyMenu);

      const request = createMockRequest('/api/menus/menu-1/publish', {
        method: 'POST',
        body: { publish: true },
      });
      const context = createRouteContext({ id: 'menu-1' });
      const response = await publishMenu(request, context);
      const data = await parseJsonResponse<ApiResponse<unknown>>(response);

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('unpublishes published menu', async () => {
      const publishedMenu = createMockMenu({
        userId: user.id,
        status: 'PUBLISHED',
        publishedAt: new Date(),
      });
      const unpublishedMenu = { ...publishedMenu, status: 'DRAFT', publishedAt: null };

      mockPrisma.menu.findUnique.mockResolvedValue(publishedMenu);
      mockPrisma.menu.update.mockResolvedValue(unpublishedMenu);

      const request = createMockRequest('/api/menus/menu-1/publish', {
        method: 'POST',
        body: { publish: false },
      });
      const context = createRouteContext({ id: 'menu-1' });
      const response = await publishMenu(request, context);

      expect(response.status).toBe(200);
      expect(mockInvalidateCache).toHaveBeenCalled();
    });

    it('invalidates cache on unpublish', async () => {
      const publishedMenu = createMockMenu({
        userId: user.id,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        _count: { categories: 1, products: 1, promotions: 0, views: 0 },
      });

      mockPrisma.menu.findUnique.mockResolvedValue(publishedMenu);
      mockPrisma.menu.update.mockResolvedValue({ ...publishedMenu, status: 'DRAFT', publishedAt: null });

      const request = createMockRequest('/api/menus/menu-1/publish', {
        method: 'POST',
        body: { publish: false },
      });
      const context = createRouteContext({ id: 'menu-1' });
      await publishMenu(request, context);

      expect(mockInvalidateCache).toHaveBeenCalled();
    });
  });
});
