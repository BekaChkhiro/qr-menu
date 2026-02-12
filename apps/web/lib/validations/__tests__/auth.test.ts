import { describe, it, expect } from 'vitest'
import { loginSchema, registerSchema } from '../auth'

describe('loginSchema', () => {
  describe('valid inputs', () => {
    it('accepts valid email and password', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
      })
      expect(result.success).toBe(true)
    })

    it('accepts email with subdomain', () => {
      const result = loginSchema.safeParse({
        email: 'user@mail.example.com',
        password: 'password',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('email validation', () => {
    it('rejects empty email', () => {
      const result = loginSchema.safeParse({
        email: '',
        password: 'password123',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Email is required')
      }
    })

    it('rejects invalid email format', () => {
      const result = loginSchema.safeParse({
        email: 'invalid-email',
        password: 'password123',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid email address')
      }
    })

    it('rejects email without domain', () => {
      const result = loginSchema.safeParse({
        email: 'test@',
        password: 'password123',
      })
      expect(result.success).toBe(false)
    })

    it('rejects email exceeding max length', () => {
      const longEmail = 'a'.repeat(250) + '@test.com'
      const result = loginSchema.safeParse({
        email: longEmail,
        password: 'password123',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Email must be less than 255 characters')
      }
    })
  })

  describe('password validation', () => {
    it('rejects empty password', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: '',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Password is required')
      }
    })

    it('rejects password exceeding max length', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: 'a'.repeat(256),
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Password must be less than 255 characters')
      }
    })
  })
})

describe('registerSchema', () => {
  const validInput = {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'Password123',
    confirmPassword: 'Password123',
  }

  describe('valid inputs', () => {
    it('accepts valid registration data', () => {
      const result = registerSchema.safeParse(validInput)
      expect(result.success).toBe(true)
    })

    it('accepts password with special characters', () => {
      const result = registerSchema.safeParse({
        ...validInput,
        password: 'Password123!@#',
        confirmPassword: 'Password123!@#',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('name validation', () => {
    it('rejects empty name', () => {
      const result = registerSchema.safeParse({
        ...validInput,
        name: '',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Name is required')
      }
    })

    it('rejects name exceeding max length', () => {
      const result = registerSchema.safeParse({
        ...validInput,
        name: 'a'.repeat(256),
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Name must be less than 255 characters')
      }
    })
  })

  describe('email validation', () => {
    it('rejects empty email', () => {
      const result = registerSchema.safeParse({
        ...validInput,
        email: '',
      })
      expect(result.success).toBe(false)
    })

    it('rejects invalid email', () => {
      const result = registerSchema.safeParse({
        ...validInput,
        email: 'invalid',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('password validation', () => {
    it('rejects password shorter than 8 characters', () => {
      const result = registerSchema.safeParse({
        ...validInput,
        password: 'Pass1',
        confirmPassword: 'Pass1',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Password must be at least 8 characters')
      }
    })

    it('rejects password without uppercase letter', () => {
      const result = registerSchema.safeParse({
        ...validInput,
        password: 'password123',
        confirmPassword: 'password123',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('uppercase letter')
      }
    })

    it('rejects password without lowercase letter', () => {
      const result = registerSchema.safeParse({
        ...validInput,
        password: 'PASSWORD123',
        confirmPassword: 'PASSWORD123',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('lowercase letter')
      }
    })

    it('rejects password without number', () => {
      const result = registerSchema.safeParse({
        ...validInput,
        password: 'Passworddd',
        confirmPassword: 'Passworddd',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('number')
      }
    })
  })

  describe('confirm password validation', () => {
    it('rejects empty confirm password', () => {
      const result = registerSchema.safeParse({
        ...validInput,
        confirmPassword: '',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Please confirm your password')
      }
    })

    it('rejects mismatched passwords', () => {
      const result = registerSchema.safeParse({
        ...validInput,
        confirmPassword: 'DifferentPassword123',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        const confirmError = result.error.issues.find(i => i.path.includes('confirmPassword'))
        expect(confirmError?.message).toBe('Passwords do not match')
      }
    })
  })
})
