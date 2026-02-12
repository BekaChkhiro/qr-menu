/**
 * Authentication API Tests
 * Tests for /api/auth/register endpoint
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createMockUser,
  createMockRequest,
  parseJsonResponse,
  resetIdCounter,
  type ApiResponse,
  type MockUser,
} from './setup';

// Use vi.hoisted to create mocks that can be used in vi.mock
const { mockPrisma, mockBcrypt } = vi.hoisted(() => {
  return {
    mockPrisma: {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
    },
    mockBcrypt: {
      hash: vi.fn(),
    },
  };
});

vi.mock('@/lib/db', () => ({
  prisma: mockPrisma,
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: (password: string, rounds: number) => mockBcrypt.hash(password, rounds),
  },
}));

// Import route handler after mocking
import { POST } from '@/app/api/auth/register/route';

describe('Auth API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetIdCounter();
    mockBcrypt.hash.mockResolvedValue('hashed_password_123');
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ==========================================================================
  // POST /api/auth/register - User Registration
  // ==========================================================================

  describe('POST /api/auth/register', () => {
    const validRegistrationData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'SecurePass123!',
      confirmPassword: 'SecurePass123!',
    };

    it('registers new user with valid data', async () => {
      const newUser = createMockUser({
        email: validRegistrationData.email,
        name: validRegistrationData.name,
      });

      mockPrisma.user.findUnique.mockResolvedValue(null); // Email not taken
      mockPrisma.user.create.mockResolvedValue(newUser);

      const request = createMockRequest('/api/auth/register', {
        method: 'POST',
        body: validRegistrationData,
      });
      const response = await POST(request);
      const data = await parseJsonResponse<ApiResponse<{ user: MockUser }>>(response);

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      if (data.success) {
        expect(data.data.user.email).toBe(validRegistrationData.email);
      }
    });

    it('hashes password with bcrypt', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(createMockUser());

      const request = createMockRequest('/api/auth/register', {
        method: 'POST',
        body: validRegistrationData,
      });
      await POST(request);

      expect(mockBcrypt.hash).toHaveBeenCalledWith(validRegistrationData.password, 12);
    });

    it('creates user and returns plan in response', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        plan: 'FREE',
        createdAt: new Date(),
      });

      const request = createMockRequest('/api/auth/register', {
        method: 'POST',
        body: validRegistrationData,
      });
      const response = await POST(request);
      const data = await parseJsonResponse<ApiResponse<{ user: { plan: string } }>>(response);

      expect(response.status).toBe(201);
      if (data.success) {
        expect(data.data.user.plan).toBe('FREE');
      }
    });

    it('returns 400 for missing required fields', async () => {
      const request = createMockRequest('/api/auth/register', {
        method: 'POST',
        body: { email: 'test@example.com' }, // Missing name and password
      });
      const response = await POST(request);
      const data = await parseJsonResponse<ApiResponse<unknown>>(response);

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      if (!data.success) {
        expect(data.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('returns 400 for invalid email format', async () => {
      const request = createMockRequest('/api/auth/register', {
        method: 'POST',
        body: {
          name: 'Test',
          email: 'invalid-email',
          password: 'SecurePass123!',
        },
      });
      const response = await POST(request);
      const data = await parseJsonResponse<ApiResponse<unknown>>(response);

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('returns 400 for weak password', async () => {
      const request = createMockRequest('/api/auth/register', {
        method: 'POST',
        body: {
          name: 'Test',
          email: 'test@example.com',
          password: '123', // Too short/weak
        },
      });
      const response = await POST(request);
      const data = await parseJsonResponse<ApiResponse<unknown>>(response);

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('returns 409 when email already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(createMockUser()); // Email taken

      const request = createMockRequest('/api/auth/register', {
        method: 'POST',
        body: validRegistrationData,
      });
      const response = await POST(request);
      const data = await parseJsonResponse<ApiResponse<unknown>>(response);

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      if (!data.success) {
        expect(data.error.code).toBe('EMAIL_EXISTS');
      }
    });

    it('does not return password in response', async () => {
      // The API uses select to only return specific fields
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        plan: 'FREE',
        createdAt: new Date(),
        // password is NOT included because of the select clause
      });

      const request = createMockRequest('/api/auth/register', {
        method: 'POST',
        body: validRegistrationData,
      });
      const response = await POST(request);
      const data = await parseJsonResponse<ApiResponse<{ user: Record<string, unknown> }>>(response);

      expect(response.status).toBe(201);
      if (data.success) {
        // Verify the select clause was used (password should not be selected)
        expect(mockPrisma.user.create).toHaveBeenCalledWith(
          expect.objectContaining({
            select: expect.objectContaining({
              id: true,
              email: true,
              name: true,
              plan: true,
            }),
          })
        );
      }
    });

    it('normalizes email to lowercase', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        plan: 'FREE',
        createdAt: new Date(),
      });

      const request = createMockRequest('/api/auth/register', {
        method: 'POST',
        body: {
          ...validRegistrationData,
          email: 'TEST@EXAMPLE.COM',
        },
      });
      await POST(request);

      // Check that the create was called with lowercase email
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'test@example.com',
          }),
        })
      );
    });

    it('checks for existing user with lowercased email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        plan: 'FREE',
        createdAt: new Date(),
      });

      const request = createMockRequest('/api/auth/register', {
        method: 'POST',
        body: {
          ...validRegistrationData,
          email: 'TEST@EXAMPLE.COM',
        },
      });
      await POST(request);

      // Verify findUnique was called with lowercased email
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });
  });

  // ==========================================================================
  // Password Validation Tests
  // ==========================================================================

  describe('Password Validation', () => {
    const validEmail = 'test@example.com';
    const validName = 'Test User';

    const testCases = [
      { password: 'short', desc: 'too short' },
      { password: '12345678', desc: 'numbers only' },
      { password: 'abcdefgh', desc: 'letters only' },
    ];

    testCases.forEach(({ password, desc }) => {
      it(`rejects password that is ${desc}`, async () => {
        const request = createMockRequest('/api/auth/register', {
          method: 'POST',
          body: { name: validName, email: validEmail, password, confirmPassword: password },
        });
        const response = await POST(request);

        expect(response.status).toBe(400);
      });
    });

    it('accepts strong password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(createMockUser());

      const request = createMockRequest('/api/auth/register', {
        method: 'POST',
        body: {
          name: validName,
          email: validEmail,
          password: 'StrongPass123!',
          confirmPassword: 'StrongPass123!',
        },
      });
      const response = await POST(request);

      expect(response.status).toBe(201);
    });
  });

  // ==========================================================================
  // Email Validation Tests
  // ==========================================================================

  describe('Email Validation', () => {
    const validName = 'Test User';
    const validPassword = 'SecurePass123!';

    const invalidEmails = [
      'invalid',
      'invalid@',
      '@example.com',
      'test@',
      'test..test@example.com',
    ];

    invalidEmails.forEach((email) => {
      it(`rejects invalid email: ${email}`, async () => {
        const request = createMockRequest('/api/auth/register', {
          method: 'POST',
          body: { name: validName, email, password: validPassword, confirmPassword: validPassword },
        });
        const response = await POST(request);

        expect(response.status).toBe(400);
      });
    });

    const validEmails = [
      'test@example.com',
      'user.name@example.com',
      'user+tag@example.com',
      'user@subdomain.example.com',
    ];

    validEmails.forEach((email) => {
      it(`accepts valid email: ${email}`, async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);
        mockPrisma.user.create.mockResolvedValue(createMockUser());

        const request = createMockRequest('/api/auth/register', {
          method: 'POST',
          body: { name: validName, email, password: validPassword, confirmPassword: validPassword },
        });
        const response = await POST(request);

        expect(response.status).toBe(201);
      });
    });
  });

  // ==========================================================================
  // Name Validation Tests
  // ==========================================================================

  describe('Name Validation', () => {
    const validEmail = 'test@example.com';
    const validPassword = 'SecurePass123!';

    it('accepts name with spaces', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(createMockUser());

      const request = createMockRequest('/api/auth/register', {
        method: 'POST',
        body: {
          name: 'John Doe',
          email: validEmail,
          password: validPassword,
          confirmPassword: validPassword,
        },
      });
      const response = await POST(request);

      expect(response.status).toBe(201);
    });

    it('accepts Georgian name', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(createMockUser());

      const request = createMockRequest('/api/auth/register', {
        method: 'POST',
        body: {
          name: 'გიორგი გიორგაძე',
          email: validEmail,
          password: validPassword,
          confirmPassword: validPassword,
        },
      });
      const response = await POST(request);

      expect(response.status).toBe(201);
    });

    it('stores name as provided', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'John Doe',
        plan: 'FREE',
        createdAt: new Date(),
      });

      const request = createMockRequest('/api/auth/register', {
        method: 'POST',
        body: {
          name: 'John Doe',
          email: validEmail,
          password: validPassword,
          confirmPassword: validPassword,
        },
      });
      const response = await POST(request);

      expect(response.status).toBe(201);
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'John Doe',
          }),
        })
      );
    });
  });
});
