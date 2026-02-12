import { describe, it, expect } from 'vitest'
import { render, screen, createMockProduct, createMockVariation } from '@/tests/utils'
import { ProductCard } from '../product-card'

describe('ProductCard', () => {
  const baseProduct = createMockProduct()

  describe('basic rendering', () => {
    it('renders product name correctly', () => {
      render(<ProductCard product={baseProduct} locale="en" />)
      expect(screen.getByText('Test Product')).toBeInTheDocument()
    })

    it('renders product description', () => {
      render(<ProductCard product={baseProduct} locale="en" />)
      expect(screen.getByText('This is a test description')).toBeInTheDocument()
    })

    it('renders product price', () => {
      render(<ProductCard product={baseProduct} locale="en" />)
      expect(screen.getByText('15.99 GEL')).toBeInTheDocument()
    })

    it('renders as an article element with aria-label', () => {
      render(<ProductCard product={baseProduct} locale="en" />)
      const article = screen.getByRole('article', { name: 'Test Product' })
      expect(article).toBeInTheDocument()
    })
  })

  describe('multi-language support', () => {
    it('displays Georgian name when locale is ka', () => {
      render(<ProductCard product={baseProduct} locale="ka" />)
      expect(screen.getByText('ტესტ პროდუქტი')).toBeInTheDocument()
    })

    it('displays English name when locale is en', () => {
      render(<ProductCard product={baseProduct} locale="en" />)
      expect(screen.getByText('Test Product')).toBeInTheDocument()
    })

    it('displays Russian name when locale is ru', () => {
      render(<ProductCard product={baseProduct} locale="ru" />)
      expect(screen.getByText('Тестовый продукт')).toBeInTheDocument()
    })

    it('falls back to Georgian when English translation is missing', () => {
      const product = createMockProduct({ nameEn: null })
      render(<ProductCard product={product} locale="en" />)
      expect(screen.getByText('ტესტ პროდუქტი')).toBeInTheDocument()
    })

    it('falls back to Georgian description when English description is missing', () => {
      const product = createMockProduct({ descriptionEn: null })
      render(<ProductCard product={product} locale="en" />)
      expect(screen.getByText('ეს არის ტესტი აღწერა')).toBeInTheDocument()
    })
  })

  describe('product variations', () => {
    it('displays "from" price when product has variations', () => {
      const product = createMockProduct({
        variations: [
          createMockVariation({ price: 10.99 }),
          createMockVariation({ id: 'v2', nameKa: 'დიდი', nameEn: 'Large', price: 15.99 }),
        ],
      })
      render(<ProductCard product={product} locale="en" />)
      expect(screen.getByText(/from/i)).toBeInTheDocument()
      expect(screen.getByText('10.99 GEL')).toBeInTheDocument()
    })

    it('renders variation badges', () => {
      const product = createMockProduct({
        variations: [
          createMockVariation({ nameEn: 'Small', price: 10.99 }),
          createMockVariation({ id: 'v2', nameKa: 'დიდი', nameEn: 'Large', price: 15.99 }),
        ],
      })
      render(<ProductCard product={product} locale="en" />)
      expect(screen.getByText(/Small - 10.99 GEL/)).toBeInTheDocument()
      expect(screen.getByText(/Large - 15.99 GEL/)).toBeInTheDocument()
    })

    it('renders variations list with proper aria-label', () => {
      const product = createMockProduct({
        variations: [createMockVariation()],
      })
      render(<ProductCard product={product} locale="en" />)
      expect(screen.getByRole('list', { name: 'Variations' })).toBeInTheDocument()
    })

    it('uses Georgian label for variations when locale is ka', () => {
      const product = createMockProduct({
        variations: [createMockVariation()],
      })
      render(<ProductCard product={product} locale="ka" />)
      expect(screen.getByRole('list', { name: 'ვარიაციები' })).toBeInTheDocument()
    })
  })

  describe('allergens', () => {
    it('renders allergen badges', () => {
      const product = createMockProduct({ allergens: ['GLUTEN', 'DAIRY'] })
      render(<ProductCard product={product} locale="en" />)
      expect(screen.getByText('Gluten')).toBeInTheDocument()
      expect(screen.getByText('Dairy')).toBeInTheDocument()
    })

    it('renders allergens in Georgian when locale is ka', () => {
      const product = createMockProduct({ allergens: ['GLUTEN', 'NUTS'] })
      render(<ProductCard product={product} locale="ka" />)
      expect(screen.getByText('გლუტენი')).toBeInTheDocument()
      expect(screen.getByText('თხილეული')).toBeInTheDocument()
    })

    it('renders allergens in Russian when locale is ru', () => {
      const product = createMockProduct({ allergens: ['EGGS', 'SOY'] })
      render(<ProductCard product={product} locale="ru" />)
      expect(screen.getByText('Яйца')).toBeInTheDocument()
      expect(screen.getByText('Соя')).toBeInTheDocument()
    })

    it('renders allergens list with proper aria-label', () => {
      const product = createMockProduct({ allergens: ['PORK'] })
      render(<ProductCard product={product} locale="en" />)
      expect(screen.getByRole('list', { name: 'Allergens' })).toBeInTheDocument()
    })

    it('does not render allergens section when no allergens', () => {
      const product = createMockProduct({ allergens: [] })
      render(<ProductCard product={product} locale="en" />)
      expect(screen.queryByRole('list', { name: 'Allergens' })).not.toBeInTheDocument()
    })
  })

  describe('product image', () => {
    it('renders image when imageUrl is provided', () => {
      render(<ProductCard product={baseProduct} locale="en" />)
      const img = screen.getByAltText('Test Product')
      expect(img).toBeInTheDocument()
    })

    it('does not render image when imageUrl is null', () => {
      const product = createMockProduct({ imageUrl: null })
      render(<ProductCard product={product} locale="en" />)
      expect(screen.queryByRole('img')).not.toBeInTheDocument()
    })
  })

  describe('price formatting', () => {
    it('formats price with two decimal places', () => {
      const product = createMockProduct({ price: 10 })
      render(<ProductCard product={product} locale="en" />)
      expect(screen.getByText('10.00 GEL')).toBeInTheDocument()
    })

    it('handles string price values', () => {
      const product = createMockProduct({ price: '25.50' })
      render(<ProductCard product={product} locale="en" />)
      expect(screen.getByText('25.50 GEL')).toBeInTheDocument()
    })
  })

  describe('without optional content', () => {
    it('does not render description when null', () => {
      const product = createMockProduct({
        descriptionKa: null,
        descriptionEn: null,
        descriptionRu: null,
      })
      render(<ProductCard product={product} locale="en" />)
      expect(screen.queryByText(/description/i)).not.toBeInTheDocument()
    })

    it('does not render variations section when empty', () => {
      const product = createMockProduct({ variations: [] })
      render(<ProductCard product={product} locale="en" />)
      expect(screen.queryByRole('list', { name: 'Variations' })).not.toBeInTheDocument()
    })
  })
})
