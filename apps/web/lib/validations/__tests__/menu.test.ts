import { describe, it, expect } from 'vitest'
import { createMenuSchema, updateMenuSchema, publishMenuSchema, menuQuerySchema } from '../menu'

describe('createMenuSchema', () => {
  describe('valid inputs', () => {
    it('accepts valid menu data', () => {
      const result = createMenuSchema.safeParse({
        name: 'My Restaurant Menu',
        slug: 'my-restaurant',
      })
      expect(result.success).toBe(true)
    })

    it('accepts menu with optional description', () => {
      const result = createMenuSchema.safeParse({
        name: 'Test Menu',
        slug: 'test-menu',
        description: 'A description of my menu',
      })
      expect(result.success).toBe(true)
    })

    it('accepts slug with numbers', () => {
      const result = createMenuSchema.safeParse({
        name: 'Menu',
        slug: 'cafe-2024',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('name validation', () => {
    it('rejects empty name', () => {
      const result = createMenuSchema.safeParse({
        name: '',
        slug: 'test-slug',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Menu name is required')
      }
    })

    it('rejects name exceeding max length', () => {
      const result = createMenuSchema.safeParse({
        name: 'a'.repeat(101),
        slug: 'test-slug',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Menu name must be less than 100 characters')
      }
    })
  })

  describe('slug validation', () => {
    it('rejects slug shorter than 3 characters', () => {
      const result = createMenuSchema.safeParse({
        name: 'Test',
        slug: 'ab',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Slug must be at least 3 characters')
      }
    })

    it('rejects slug with uppercase letters', () => {
      const result = createMenuSchema.safeParse({
        name: 'Test',
        slug: 'My-Menu',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('lowercase letters')
      }
    })

    it('rejects slug with spaces', () => {
      const result = createMenuSchema.safeParse({
        name: 'Test',
        slug: 'my menu',
      })
      expect(result.success).toBe(false)
    })

    it('rejects slug with special characters', () => {
      const result = createMenuSchema.safeParse({
        name: 'Test',
        slug: 'my_menu',
      })
      expect(result.success).toBe(false)
    })

    it('rejects slug starting with hyphen', () => {
      const result = createMenuSchema.safeParse({
        name: 'Test',
        slug: '-my-menu',
      })
      expect(result.success).toBe(false)
    })

    it('rejects slug ending with hyphen', () => {
      const result = createMenuSchema.safeParse({
        name: 'Test',
        slug: 'my-menu-',
      })
      expect(result.success).toBe(false)
    })

    it('rejects slug with consecutive hyphens', () => {
      const result = createMenuSchema.safeParse({
        name: 'Test',
        slug: 'my--menu',
      })
      expect(result.success).toBe(false)
    })

    it('rejects slug exceeding max length', () => {
      const result = createMenuSchema.safeParse({
        name: 'Test',
        slug: 'a'.repeat(51),
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Slug must be less than 50 characters')
      }
    })
  })

  describe('description validation', () => {
    it('accepts empty description', () => {
      const result = createMenuSchema.safeParse({
        name: 'Test',
        slug: 'test-menu',
        description: '',
      })
      expect(result.success).toBe(true)
    })

    it('rejects description exceeding max length', () => {
      const result = createMenuSchema.safeParse({
        name: 'Test',
        slug: 'test-menu',
        description: 'a'.repeat(501),
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Description must be less than 500 characters')
      }
    })
  })
})

describe('updateMenuSchema', () => {
  it('accepts partial updates', () => {
    const result = updateMenuSchema.safeParse({
      name: 'Updated Name',
    })
    expect(result.success).toBe(true)
  })

  it('accepts empty object (no updates)', () => {
    const result = updateMenuSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('validates hex color format', () => {
    const result = updateMenuSchema.safeParse({
      primaryColor: '#FF5733',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid hex color', () => {
    const result = updateMenuSchema.safeParse({
      primaryColor: 'red',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Invalid hex color format')
    }
  })

  it('rejects hex color without hash', () => {
    const result = updateMenuSchema.safeParse({
      primaryColor: 'FF5733',
    })
    expect(result.success).toBe(false)
  })

  it('rejects short hex color', () => {
    const result = updateMenuSchema.safeParse({
      primaryColor: '#FFF',
    })
    expect(result.success).toBe(false)
  })

  it('accepts valid logo URL', () => {
    const result = updateMenuSchema.safeParse({
      logoUrl: 'https://example.com/logo.png',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid logo URL', () => {
    const result = updateMenuSchema.safeParse({
      logoUrl: 'not-a-url',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Invalid logo URL')
    }
  })

  it('accepts null logo URL', () => {
    const result = updateMenuSchema.safeParse({
      logoUrl: null,
    })
    expect(result.success).toBe(true)
  })

  it('accepts null description', () => {
    const result = updateMenuSchema.safeParse({
      description: null,
    })
    expect(result.success).toBe(true)
  })
})

describe('publishMenuSchema', () => {
  it('accepts publish true', () => {
    const result = publishMenuSchema.safeParse({ publish: true })
    expect(result.success).toBe(true)
  })

  it('accepts publish false', () => {
    const result = publishMenuSchema.safeParse({ publish: false })
    expect(result.success).toBe(true)
  })

  it('rejects non-boolean publish', () => {
    const result = publishMenuSchema.safeParse({ publish: 'true' })
    expect(result.success).toBe(false)
  })

  it('rejects missing publish', () => {
    const result = publishMenuSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})

describe('menuQuerySchema', () => {
  it('uses default values when not provided', () => {
    const result = menuQuerySchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(1)
      expect(result.data.limit).toBe(10)
    }
  })

  it('parses string numbers correctly', () => {
    const result = menuQuerySchema.safeParse({
      page: '2',
      limit: '20',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(2)
      expect(result.data.limit).toBe(20)
    }
  })

  it('accepts valid status values', () => {
    const draftResult = menuQuerySchema.safeParse({ status: 'DRAFT' })
    const publishedResult = menuQuerySchema.safeParse({ status: 'PUBLISHED' })

    expect(draftResult.success).toBe(true)
    expect(publishedResult.success).toBe(true)
  })

  it('rejects invalid status', () => {
    const result = menuQuerySchema.safeParse({ status: 'INVALID' })
    expect(result.success).toBe(false)
  })

  it('rejects limit exceeding maximum', () => {
    const result = menuQuerySchema.safeParse({ limit: 100 })
    expect(result.success).toBe(false)
  })

  it('rejects negative page', () => {
    const result = menuQuerySchema.safeParse({ page: -1 })
    expect(result.success).toBe(false)
  })

  it('rejects zero page', () => {
    const result = menuQuerySchema.safeParse({ page: 0 })
    expect(result.success).toBe(false)
  })
})
