import React, { type ReactElement } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Create a fresh query client for each test
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

interface WrapperProps {
  children: React.ReactNode
}

function AllTheProviders({ children }: WrapperProps) {
  const queryClient = createTestQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllTheProviders, ...options })
}

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }

// Test data factories
export function createMockProduct(overrides = {}) {
  return {
    id: 'product-1',
    nameKa: 'ტესტ პროდუქტი',
    nameEn: 'Test Product',
    nameRu: 'Тестовый продукт',
    descriptionKa: 'ეს არის ტესტი აღწერა',
    descriptionEn: 'This is a test description',
    descriptionRu: 'Это тестовое описание',
    price: 15.99,
    currency: 'GEL',
    imageUrl: 'https://example.com/image.jpg',
    allergens: [],
    variations: [],
    ...overrides,
  }
}

export function createMockMenu(overrides = {}) {
  return {
    id: 'menu-1',
    name: 'Test Menu',
    slug: 'test-menu',
    description: 'A test menu description',
    status: 'DRAFT' as const,
    primaryColor: '#000000',
    currency: 'GEL',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    publishedAt: null,
    _count: {
      categories: 3,
      views: 100,
    },
    ...overrides,
  }
}

export function createMockVariation(overrides = {}) {
  return {
    id: 'variation-1',
    nameKa: 'პატარა',
    nameEn: 'Small',
    nameRu: 'Маленький',
    price: 10.99,
    ...overrides,
  }
}
