/**
 * API Test Setup
 * Provides mocks and utilities for testing API routes
 */

import { vi } from 'vitest';
import { NextRequest } from 'next/server';
import type { Plan, MenuStatus } from '@prisma/client';

// ============================================================================
// Mock Types
// ============================================================================

export interface MockUser {
  id: string;
  email: string;
  name: string | null;
  plan: Plan;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockSession {
  user: {
    id: string;
    email: string;
    name: string | null;
    plan: Plan;
  };
  expires: string;
}

export interface MockMenu {
  id: string;
  userId: string;
  name: string;
  slug: string;
  description: string | null;
  status: MenuStatus;
  publishedAt: Date | null;
  primaryColor: string;
  secondaryColor: string;
  createdAt: Date;
  updatedAt: Date;
  categories?: MockCategory[];
  products?: MockProduct[];
  promotions?: MockPromotion[];
  _count?: {
    categories: number;
    products: number;
    promotions: number;
    views: number;
  };
}

export interface MockCategory {
  id: string;
  menuId: string;
  nameKa: string;
  nameEn: string | null;
  nameRu: string | null;
  descriptionKa: string | null;
  descriptionEn: string | null;
  descriptionRu: string | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  products?: MockProduct[];
}

export interface MockProduct {
  id: string;
  categoryId: string;
  nameKa: string;
  nameEn: string | null;
  nameRu: string | null;
  descriptionKa: string | null;
  descriptionEn: string | null;
  descriptionRu: string | null;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
  allergens: string[];
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  variations?: MockVariation[];
}

export interface MockVariation {
  id: string;
  productId: string;
  nameKa: string;
  nameEn: string | null;
  nameRu: string | null;
  price: number;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockPromotion {
  id: string;
  menuId: string;
  titleKa: string;
  titleEn: string | null;
  titleRu: string | null;
  descriptionKa: string | null;
  descriptionEn: string | null;
  descriptionRu: string | null;
  imageUrl: string | null;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Mock Factories
// ============================================================================

let idCounter = 0;

export function createMockUser(overrides: Partial<MockUser> = {}): MockUser {
  idCounter++;
  return {
    id: `user-${idCounter}`,
    email: `user${idCounter}@example.com`,
    name: `Test User ${idCounter}`,
    plan: 'FREE' as Plan,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

export function createMockSession(user: MockUser): MockSession {
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
}

export function createMockMenu(overrides: Partial<MockMenu> = {}): MockMenu {
  idCounter++;
  return {
    id: `menu-${idCounter}`,
    userId: 'user-1',
    name: `Test Menu ${idCounter}`,
    slug: `test-menu-${idCounter}`,
    description: 'A test menu description',
    status: 'DRAFT' as MenuStatus,
    publishedAt: null,
    primaryColor: '#000000',
    secondaryColor: '#ffffff',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    _count: {
      categories: 0,
      products: 0,
      promotions: 0,
      views: 0,
    },
    ...overrides,
  };
}

export function createMockCategory(overrides: Partial<MockCategory> = {}): MockCategory {
  idCounter++;
  return {
    id: `category-${idCounter}`,
    menuId: 'menu-1',
    nameKa: `კატეგორია ${idCounter}`,
    nameEn: `Category ${idCounter}`,
    nameRu: `Категория ${idCounter}`,
    descriptionKa: null,
    descriptionEn: null,
    descriptionRu: null,
    sortOrder: idCounter,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

export function createMockProduct(overrides: Partial<MockProduct> = {}): MockProduct {
  idCounter++;
  return {
    id: `product-${idCounter}`,
    categoryId: 'category-1',
    nameKa: `პროდუქტი ${idCounter}`,
    nameEn: `Product ${idCounter}`,
    nameRu: `Продукт ${idCounter}`,
    descriptionKa: 'აღწერა',
    descriptionEn: 'Description',
    descriptionRu: 'Описание',
    price: 10.99,
    imageUrl: null,
    isAvailable: true,
    allergens: [],
    sortOrder: idCounter,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    variations: [],
    ...overrides,
  };
}

export function createMockVariation(overrides: Partial<MockVariation> = {}): MockVariation {
  idCounter++;
  return {
    id: `variation-${idCounter}`,
    productId: 'product-1',
    nameKa: `ვარიაცია ${idCounter}`,
    nameEn: `Variation ${idCounter}`,
    nameRu: `Вариация ${idCounter}`,
    price: 12.99,
    sortOrder: idCounter,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

export function createMockPromotion(overrides: Partial<MockPromotion> = {}): MockPromotion {
  idCounter++;
  const now = new Date();
  return {
    id: `promotion-${idCounter}`,
    menuId: 'menu-1',
    titleKa: `აქცია ${idCounter}`,
    titleEn: `Promotion ${idCounter}`,
    titleRu: `Акция ${idCounter}`,
    descriptionKa: 'აქციის აღწერა',
    descriptionEn: 'Promotion description',
    descriptionRu: 'Описание акции',
    imageUrl: null,
    startDate: now,
    endDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

// ============================================================================
// Request Helpers
// ============================================================================

export function createMockRequest(
  url: string,
  options: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
  } = {}
): NextRequest {
  const { method = 'GET', body, headers = {} } = options;

  const requestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body && method !== 'GET' ? JSON.stringify(body) : undefined,
  };

  return new NextRequest(new URL(url, 'http://localhost:3000'), requestInit);
}

export function createRouteContext(params: Record<string, string>): { params: Promise<Record<string, string>> } {
  return {
    params: Promise.resolve(params),
  };
}

// ============================================================================
// Response Helpers
// ============================================================================

export async function parseJsonResponse<T = unknown>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface ApiPaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// ============================================================================
// Mock Setup Helpers
// ============================================================================

export function resetIdCounter(): void {
  idCounter = 0;
}

// Create mock Prisma client
export function createMockPrisma() {
  return {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
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
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      updateMany: vi.fn(),
    },
    product: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      updateMany: vi.fn(),
    },
    productVariation: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      updateMany: vi.fn(),
    },
    promotion: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    menuView: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    $transaction: vi.fn((callback: (tx: unknown) => Promise<unknown>) => callback(createMockPrisma())),
  };
}

// Create mock auth function
export function createMockAuth(session: MockSession | null = null) {
  return vi.fn().mockResolvedValue(session);
}

// Create mock cache functions
export function createMockCache() {
  return {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK'),
    del: vi.fn().mockResolvedValue(1),
    invalidateMenuCache: vi.fn().mockResolvedValue(undefined),
  };
}

// Create mock Pusher
export function createMockPusher() {
  return {
    trigger: vi.fn().mockResolvedValue({}),
  };
}

// ============================================================================
// Test Data Sets
// ============================================================================

export const TEST_USERS = {
  free: createMockUser({ id: 'user-free', plan: 'FREE' as Plan }),
  starter: createMockUser({ id: 'user-starter', plan: 'STARTER' as Plan }),
  pro: createMockUser({ id: 'user-pro', plan: 'PRO' as Plan }),
};

export const PLAN_LIMITS = {
  FREE: { maxMenus: 1, maxCategories: 3, maxProducts: 15 },
  STARTER: { maxMenus: 3, maxCategories: Infinity, maxProducts: Infinity },
  PRO: { maxMenus: Infinity, maxCategories: Infinity, maxProducts: Infinity },
};
