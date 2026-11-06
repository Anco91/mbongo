/**
 * API Client
 *
 * Typed fetch client for consuming the /api routes.
 * All responses are parsed by the same Zod schemas used on the server.
 *
 * @module Lib/API
 */

import { z } from 'zod';

/**
 * Base API configuration
 */
const API_BASE = '/api';

/**
 * Error response schema
 */
const errorSchema = z.object({
  error: z.object({
    code: z.string().optional(),
    message: z.string(),
    details: z.record(z.unknown()).optional(),
  }),
});

type ApiError = z.infer<typeof errorSchema>;

/**
 * Response wrapper schema for successful responses
 */
const successResponseSchema = z.object({
  data: z.unknown(),
  success: z.boolean().optional().default(true),
  pagination: z
    .object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
      hasNext: z.boolean(),
      hasPrevious: z.boolean(),
    })
    .optional(),
});

/**
 * Parsed API response
 */
interface ApiResponse<T> {
  data: T;
  success: boolean;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

/**
 * HTTP methods
 */
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Request options
 */
interface RequestOptions {
  params?: Record<string, unknown>;
  body?: unknown;
  headers?: Record<string, string>;
}

/**
 * Generic request function
 *
 * @param method - HTTP method
 * @param path - API path (e.g., '/charges')
 * @param options - Request options
 * @returns Parsed response data
 * @throws Error if request fails or validation fails
 */
export async function request<T>(
  method: HttpMethod,
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, body, headers } = options;

  // Build URL with query parameters
  let url = `${API_BASE}${path}`;
  if (params && Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      if (typeof value === 'object' && !Array.isArray(value)) {
        for (const [operator, operand] of Object.entries(value)) {
          if (Array.isArray(operand)) {
            searchParams.append(`${key}[${operator}]`, operand.join(','));
          } else if (operand !== undefined && operand !== null) {
            searchParams.append(`${key}[${operator}]`, String(operand));
          }
        }
      } else {
        searchParams.append(key, String(value));
      }
    }
    url += `?${searchParams.toString()}`;
  }

  // Build request options
  const requestOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (body !== undefined) {
    requestOptions.body = JSON.stringify(body);
  }

  // Make the request
  const response = await fetch(url, requestOptions);

  // Check for HTTP errors
  if (!response.ok) {
    // Try to parse error response
    try {
      const errorData: unknown = await response.json();
      const parsed = errorSchema.parse(errorData);
      throw new Error(`API Error ${response.status}: ${parsed.error.message}`);
    } catch {
      throw new Error(`API Error ${response.status}: ${response.statusText}`);
    }
  }

  // Parse successful response
  if (response.status === 204) {
    // No content
    return undefined as T;
  }

  const json: unknown = await response.json();
  const parsed = successResponseSchema.parse(json);

  return parsed.data as T;
}

/**
 * Alternative: Raw API client for custom requests
 */
export const rawApi = {
  get: <T>(path: string, params?: Record<string, unknown>): Promise<T> =>
    request<T>('GET', path, { params }),

  post: <T>(path: string, body?: unknown): Promise<T> =>
    request<T>('POST', path, { body }),

  put: <T>(path: string, body?: unknown): Promise<T> =>
    request<T>('PUT', path, { body }),

  patch: <T>(path: string, body?: unknown): Promise<T> =>
    request<T>('PATCH', path, { body }),

  delete: <T>(path: string): Promise<T> => request<T>('DELETE', path),
};

export type { ApiError };
export type { ApiResponse };
