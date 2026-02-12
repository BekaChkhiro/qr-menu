import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import * as Sentry from '@sentry/nextjs';

// Error codes for consistent API responses
export const ERROR_CODES = {
  // Validation errors (400)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',

  // Authentication errors (401)
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  SESSION_EXPIRED: 'SESSION_EXPIRED',

  // Authorization errors (403)
  FORBIDDEN: 'FORBIDDEN',
  PLAN_LIMIT_REACHED: 'PLAN_LIMIT_REACHED',
  FEATURE_NOT_AVAILABLE: 'FEATURE_NOT_AVAILABLE',

  // Not found errors (404)
  NOT_FOUND: 'NOT_FOUND',
  MENU_NOT_FOUND: 'MENU_NOT_FOUND',
  CATEGORY_NOT_FOUND: 'CATEGORY_NOT_FOUND',
  PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
  VARIATION_NOT_FOUND: 'VARIATION_NOT_FOUND',
  USER_NOT_FOUND: 'USER_NOT_FOUND',

  // Conflict errors (409)
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  EMAIL_EXISTS: 'EMAIL_EXISTS',
  SLUG_EXISTS: 'SLUG_EXISTS',

  // Upload errors (400/500)
  UPLOAD_ERROR: 'UPLOAD_ERROR',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',

  // Server errors (500)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

interface ApiError {
  code: ErrorCode;
  message: string;
  details?: unknown;
}

interface ErrorResponse {
  success: false;
  error: ApiError;
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  code: ErrorCode,
  message: string,
  status: number,
  details?: unknown
): NextResponse<ErrorResponse> {
  const error: ApiError = {
    code,
    message,
  };

  if (details !== undefined) {
    error.details = details;
  }

  return NextResponse.json(
    {
      success: false,
      error,
    },
    { status }
  );
}

/**
 * Handle API errors and return appropriate responses
 */
export function handleApiError(error: unknown): NextResponse<ErrorResponse> {
  console.error('API Error:', error);

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return createErrorResponse(
      ERROR_CODES.VALIDATION_ERROR,
      'Invalid input data',
      400,
      error.flatten().fieldErrors
    );
  }

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002': // Unique constraint violation
        const target = (error.meta?.target as string[])?.join(', ') || 'field';
        return createErrorResponse(
          ERROR_CODES.ALREADY_EXISTS,
          `A record with this ${target} already exists`,
          409
        );
      case 'P2025': // Record not found
        return createErrorResponse(
          ERROR_CODES.NOT_FOUND,
          'Record not found',
          404
        );
      case 'P2003': // Foreign key constraint failed
        return createErrorResponse(
          ERROR_CODES.INVALID_INPUT,
          'Referenced record does not exist',
          400
        );
      default:
        return createErrorResponse(
          ERROR_CODES.DATABASE_ERROR,
          'Database operation failed',
          500
        );
    }
  }

  // Handle Prisma validation errors
  if (error instanceof Prisma.PrismaClientValidationError) {
    return createErrorResponse(
      ERROR_CODES.VALIDATION_ERROR,
      'Invalid data provided',
      400
    );
  }

  // Handle generic errors
  if (error instanceof Error) {
    // Check for specific error messages
    if (error.message.includes('not found')) {
      return createErrorResponse(ERROR_CODES.NOT_FOUND, error.message, 404);
    }
    if (error.message.includes('unauthorized') || error.message.includes('Unauthorized')) {
      return createErrorResponse(ERROR_CODES.UNAUTHORIZED, error.message, 401);
    }
    if (error.message.includes('forbidden') || error.message.includes('Forbidden')) {
      return createErrorResponse(ERROR_CODES.FORBIDDEN, error.message, 403);
    }

    // Log to Sentry in production
    if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
      Sentry.captureException(error);
    }

    return createErrorResponse(
      ERROR_CODES.INTERNAL_ERROR,
      'An unexpected error occurred',
      500
    );
  }

  // Unknown error type
  return createErrorResponse(
    ERROR_CODES.INTERNAL_ERROR,
    'An unexpected error occurred',
    500
  );
}

/**
 * Create a success response
 */
export function createSuccessResponse<T>(
  data: T,
  status: number = 200
): NextResponse<{ success: true; data: T }> {
  return NextResponse.json({ success: true, data }, { status });
}

/**
 * Create a paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  pagination: {
    page: number;
    limit: number;
    total: number;
  }
): NextResponse<{
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> {
  return NextResponse.json({
    success: true,
    data,
    pagination: {
      ...pagination,
      totalPages: Math.ceil(pagination.total / pagination.limit),
    },
  });
}
