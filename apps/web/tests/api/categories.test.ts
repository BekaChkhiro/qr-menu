/**
 * Category API Tests
 * Tests for /api/menus/:id/categories endpoints
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createMockUser,
  createMockSession,
  createMockMenu,
  createMockCategory,
  createMockRequest,
  createRouteContext,
  parseJsonResponse,
  resetIdCounter,
  type ApiResponse,
  type MockCategory,
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
      },
      category: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
      },
      $transaction: vi.fn((callback: (tx: unknown) => Promise<unknown>) => callback({
        category: {
          update: vi.fn(),
        },
      })),
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

vi.mock('@/lib/pusher/server', () => ({
  triggerMenuEvent: (...args: unknown[]) => mockTriggerEvent(...args),
  EVENTS: {
    CATEGORY_CREATED: 'category:created',
    CATEGORY_UPDATED: 'category:updated',
    CATEGORY_DELETED: 'category:deleted',
    CATEGORY_REORDERED: 'category:reordered',
  },
}));

vi.mock('@/lib/cache/redis', () => ({
  invalidateMenuCache: (...args: unknown[]) => mockInvalidateCache(...args),
}));

// Import route handlers after mocking
import { GET, POST } from '@/app/api/menus/[id]/categories/route';
import { GET as getCategory, PUT as updateCategory, DELETE as deleteCategory } from '@/app/api/menus/[id]/categories/[cid]/route';

describe('Category API', () => {
  const user = createMockUser();
  const session = createMockSession(user);
  const menu = createMockMenu({ userId: user.id });

  beforeEach(() => {
    vi.clearAllMocks();
    resetIdCounter();
    mockAuth.mockResolvedValue(session);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ==========================================================================
  // Authentication Tests
  // ==========================================================================

  describe('Authentication', () => {
    it('returns 401 when not authenticated', async () => {
      mockAuth.mockResolvedValue(null);

      const request = createMockRequest('/api/menus/menu-1/categories');
      const context = createRouteContext({ id: 'menu-1' });
      const response = await GET(request, context);

      expect(response.status).toBe(401);
    });
  });

  // ==========================================================================
  // GET /api/menus/:id/categories - List Categories
  // ==========================================================================

  describe('GET /api/menus/:id/categories', () => {
    it('returns categories for menu', async () => {
      const categories = [
        createMockCategory({ menuId: menu.id, sortOrder: 1 }),
        createMockCategory({ menuId: menu.id, sortOrder: 2 }),
      ];

      mockPrisma.menu.findUnique.mockResolvedValue({ userId: user.id });
      mockPrisma.category.findMany.mockResolvedValue(categories);

      const request = createMockRequest('/api/menus/menu-1/categories');
      const context = createRouteContext({ id: 'menu-1' });
      const response = await GET(request, context);
      const data = await parseJsonResponse<ApiResponse<MockCategory[]>>(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      if (data.success) {
        expect(data.data).toHaveLength(2);
      }
    });

    it('returns 404 for non-existent menu', async () => {
      mockPrisma.menu.findUnique.mockResolvedValue(null);

      const request = createMockRequest('/api/menus/non-existent/categories');
      const context = createRouteContext({ id: 'non-existent' });
      const response = await GET(request, context);

      expect(response.status).toBe(404);
    });

    it('returns 403 when accessing menu owned by another user', async () => {
      mockPrisma.menu.findUnique.mockResolvedValue({ userId: 'other-user' });

      const request = createMockRequest('/api/menus/menu-1/categories');
      const context = createRouteContext({ id: 'menu-1' });
      const response = await GET(request, context);

      expect(response.status).toBe(403);
    });
  });

  // ==========================================================================
  // POST /api/menus/:id/categories - Create Category
  // ==========================================================================

  describe('POST /api/menus/:id/categories', () => {
    it('creates category with valid data', async () => {
      const newCategory = createMockCategory({ menuId: menu.id });

      mockPrisma.menu.findUnique.mockResolvedValue({ userId: user.id, slug: 'test' });
      mockPrisma.user.findUnique.mockResolvedValue({ plan: 'FREE' });
      mockPrisma.category.count.mockResolvedValue(0);
      mockPrisma.category.create.mockResolvedValue(newCategory);

      const request = createMockRequest('/api/menus/menu-1/categories', {
        method: 'POST',
        body: {
          nameKa: 'ახალი კატეგორია',
          nameEn: 'New Category',
        },
      });
      const context = createRouteContext({ id: 'menu-1' });
      const response = await POST(request, context);
      const data = await parseJsonResponse<ApiResponse<MockCategory>>(response);

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
    });

    it('returns 400 for missing required fields', async () => {
      mockPrisma.menu.findUnique.mockResolvedValue({ userId: user.id, slug: 'test' });
      mockPrisma.user.findUnique.mockResolvedValue({ plan: 'FREE' });
      mockPrisma.category.count.mockResolvedValue(0);

      const request = createMockRequest('/api/menus/menu-1/categories', {
        method: 'POST',
        body: { nameEn: 'English Only' }, // Missing nameKa
      });
      const context = createRouteContext({ id: 'menu-1' });
      const response = await POST(request, context);
      const data = await parseJsonResponse<ApiResponse<unknown>>(response);

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      if (!data.success) {
        expect(data.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('returns 403 when FREE plan category limit reached', async () => {
      mockPrisma.menu.findUnique.mockResolvedValue({ userId: user.id, slug: 'test' });
      mockPrisma.user.findUnique.mockResolvedValue({ plan: 'FREE' });
      mockPrisma.category.count.mockResolvedValue(3); // FREE limit is 3

      const request = createMockRequest('/api/menus/menu-1/categories', {
        method: 'POST',
        body: { nameKa: 'კატეგორია' },
      });
      const context = createRouteContext({ id: 'menu-1' });
      const response = await POST(request, context);
      const data = await parseJsonResponse<ApiResponse<unknown>>(response);

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      if (!data.success) {
        expect(data.error.code).toBe('PLAN_LIMIT_REACHED');
      }
    });
  });

  // ==========================================================================
  // GET /api/menus/:id/categories/:cid - Get Single Category
  // ==========================================================================

  describe('GET /api/menus/:id/categories/:cid', () => {
    it('returns category by id', async () => {
      const category = createMockCategory({ menuId: menu.id });

      mockPrisma.menu.findUnique.mockResolvedValue({ userId: user.id });
      mockPrisma.category.findUnique.mockResolvedValue(category);

      const request = createMockRequest('/api/menus/menu-1/categories/cat-1');
      const context = createRouteContext({ id: 'menu-1', cid: 'cat-1' });
      const response = await getCategory(request, context);
      const data = await parseJsonResponse<ApiResponse<MockCategory>>(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('returns 404 for non-existent category', async () => {
      mockPrisma.menu.findUnique.mockResolvedValue({ userId: user.id });
      mockPrisma.category.findUnique.mockResolvedValue(null);

      const request = createMockRequest('/api/menus/menu-1/categories/non-existent');
      const context = createRouteContext({ id: 'menu-1', cid: 'non-existent' });
      const response = await getCategory(request, context);

      expect(response.status).toBe(404);
    });
  });

  // ==========================================================================
  // PUT /api/menus/:id/categories/:cid - Update Category
  // ==========================================================================

  describe('PUT /api/menus/:id/categories/:cid', () => {
    it('updates category with valid data', async () => {
      const category = createMockCategory({ menuId: menu.id });
      const updatedCategory = { ...category, nameKa: 'განახლებული' };

      mockPrisma.menu.findUnique.mockResolvedValue({ userId: user.id, slug: 'test' });
      mockPrisma.category.findUnique.mockResolvedValue(category);
      mockPrisma.category.update.mockResolvedValue(updatedCategory);

      const request = createMockRequest('/api/menus/menu-1/categories/cat-1', {
        method: 'PUT',
        body: { nameKa: 'განახლებული' },
      });
      const context = createRouteContext({ id: 'menu-1', cid: 'cat-1' });
      const response = await updateCategory(request, context);
      const data = await parseJsonResponse<ApiResponse<MockCategory>>(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('returns 404 when updating non-existent category', async () => {
      mockPrisma.menu.findUnique.mockResolvedValue({ userId: user.id, slug: 'test' });
      mockPrisma.category.findUnique.mockResolvedValue(null);

      const request = createMockRequest('/api/menus/menu-1/categories/non-existent', {
        method: 'PUT',
        body: { nameKa: 'Test' },
      });
      const context = createRouteContext({ id: 'menu-1', cid: 'non-existent' });
      const response = await updateCategory(request, context);

      expect(response.status).toBe(404);
    });
  });

  // ==========================================================================
  // DELETE /api/menus/:id/categories/:cid - Delete Category
  // ==========================================================================

  describe('DELETE /api/menus/:id/categories/:cid', () => {
    it('deletes category successfully', async () => {
      const category = createMockCategory({ menuId: menu.id });

      mockPrisma.menu.findUnique.mockResolvedValue({ userId: user.id, slug: 'test' });
      mockPrisma.category.findUnique.mockResolvedValue(category);
      mockPrisma.category.delete.mockResolvedValue(category);

      const request = createMockRequest('/api/menus/menu-1/categories/cat-1', {
        method: 'DELETE',
      });
      const context = createRouteContext({ id: 'menu-1', cid: 'cat-1' });
      const response = await deleteCategory(request, context);
      const data = await parseJsonResponse<ApiResponse<{ deleted: boolean }>>(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('returns 404 when deleting non-existent category', async () => {
      mockPrisma.menu.findUnique.mockResolvedValue({ userId: user.id, slug: 'test' });
      mockPrisma.category.findUnique.mockResolvedValue(null);

      const request = createMockRequest('/api/menus/menu-1/categories/non-existent', {
        method: 'DELETE',
      });
      const context = createRouteContext({ id: 'menu-1', cid: 'non-existent' });
      const response = await deleteCategory(request, context);

      expect(response.status).toBe(404);
    });
  });
});
