import type { ErrorCode } from './error-handler';

// API response types
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
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

// Custom error class for API errors
export class ApiError extends Error {
  code: ErrorCode;
  status: number;
  details?: unknown;

  constructor(code: ErrorCode, message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

// Request options
interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

/**
 * API client for making requests to the backend
 */
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  /**
   * Make a request to the API
   */
  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { body, headers: customHeaders, ...restOptions } = options;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };

    const config: RequestInit = {
      ...restOptions,
      headers,
    };

    if (body !== undefined) {
      config.body = JSON.stringify(body);
    }

    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, config);

    const data = await response.json();

    if (!response.ok || !data.success) {
      const error = data.error || {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      };
      throw new ApiError(
        error.code,
        error.message,
        response.status,
        error.details
      );
    }

    return data.data;
  }

  /**
   * Make a paginated request to the API
   */
  private async requestPaginated<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiPaginatedResponse<T>> {
    const { body, headers: customHeaders, ...restOptions } = options;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };

    const config: RequestInit = {
      ...restOptions,
      headers,
    };

    if (body !== undefined) {
      config.body = JSON.stringify(body);
    }

    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, config);

    const data = await response.json();

    if (!response.ok || !data.success) {
      const error = data.error || {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      };
      throw new ApiError(
        error.code,
        error.message,
        response.status,
        error.details
      );
    }

    return data;
  }

  // HTTP method shortcuts
  get<T>(endpoint: string, options?: Omit<RequestOptions, 'body'>) {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  getPaginated<T>(endpoint: string, options?: Omit<RequestOptions, 'body'>) {
    return this.requestPaginated<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T>(endpoint: string, body?: unknown, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  put<T>(endpoint: string, body?: unknown, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  patch<T>(endpoint: string, body?: unknown, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body });
  }

  delete<T>(endpoint: string, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

// Export singleton instance for use in app
export const api = new ApiClient('/api');

// Export class for custom instances
export { ApiClient };
