import { describe, it, expect } from 'vitest'
import { cn } from '../utils'

describe('cn utility', () => {
  it('merges class names correctly', () => {
    const result = cn('class1', 'class2')
    expect(result).toBe('class1 class2')
  })

  it('handles conditional classes', () => {
    const isActive = true
    const isDisabled = false
    const result = cn('base', isActive && 'active', isDisabled && 'disabled')
    expect(result).toBe('base active')
  })

  it('handles array of classes', () => {
    const result = cn(['class1', 'class2'], 'class3')
    expect(result).toBe('class1 class2 class3')
  })

  it('handles object notation', () => {
    const result = cn({
      'base-class': true,
      'conditional-class': true,
      'disabled-class': false,
    })
    expect(result).toBe('base-class conditional-class')
  })

  it('merges tailwind classes correctly (removes duplicates)', () => {
    const result = cn('p-4', 'p-8')
    expect(result).toBe('p-8')
  })

  it('merges conflicting tailwind classes', () => {
    const result = cn('text-red-500', 'text-blue-500')
    expect(result).toBe('text-blue-500')
  })

  it('handles undefined and null values', () => {
    const result = cn('class1', undefined, null, 'class2')
    expect(result).toBe('class1 class2')
  })

  it('handles empty string', () => {
    const result = cn('class1', '', 'class2')
    expect(result).toBe('class1 class2')
  })

  it('returns empty string when no valid classes', () => {
    const result = cn(undefined, null, false)
    expect(result).toBe('')
  })

  it('handles complex tailwind merge scenarios', () => {
    // Conflicting padding should keep the last one
    const result = cn('px-2 py-1', 'px-4')
    expect(result).toBe('py-1 px-4')
  })

  it('handles responsive classes', () => {
    const result = cn('text-sm', 'md:text-base', 'lg:text-lg')
    expect(result).toBe('text-sm md:text-base lg:text-lg')
  })

  it('handles hover and focus states', () => {
    const result = cn('bg-white', 'hover:bg-gray-100', 'focus:ring-2')
    expect(result).toBe('bg-white hover:bg-gray-100 focus:ring-2')
  })
})
