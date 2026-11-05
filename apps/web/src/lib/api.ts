/**
 * API Client
 * 
 * Typed fetch client for consuming the /api routes.
 * All responses are parsed by the same Zod schemas used on the server.
 * 
 * @module Lib/API
 */

import {
  Charge,
  CreateChargeInput,
  UpdateChargeInput,
  ScheduledPayment,
  ChargeQuery,
  chargeSchema,
  createChargeSchema,
  updateChargeSchema,
  scheduledPaymentSchema,
  chargeQuerySchema,
} from '@mbongo/shared';
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
  params?: Record<string, string | number | boolean>;
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
async function request<T>(
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
      if (value !== undefined && value !== null) {
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
      const errorData = await response.json();
      const parsed = errorSchema.parse(errorData);
      throw new Error(
        `API Error ${response.status}: ${parsed.error.message}`
      );
    } catch {
      throw new Error(`API Error ${response.status}: ${response.statusText}`);
    }
  }

  // Parse successful response
  if (response.status === 204) {
    // No content
    return undefined as T;
  }

  const json = await response.json();
  const parsed = successResponseSchema.parse(json);

  return parsed.data as T;
}

/**
 * API client for charges
 */
export const api = {
  charges: {
    /**
     * List charges
     * GET /api/charges
     */
    list: async (query: ChargeQuery = {}): Promise<Charge[]> => {
      // Validate query using Zod
      const validated = chargeQuerySchema.parse(query);
      return request<Charge[]>('GET', '/charges', { params: validated });
    },

    /**
     * Get charge by ID
     * GET /api/charges/:id
     */
    get: async (id: string): Promise<Charge> => {
      const charge = await request<Charge>('GET', `/charges/${id}`);
      return chargeSchema.parse(charge);
    },

    /**
     * Create charge
     * POST /api/charges
     */
    create: async (input: CreateChargeInput): Promise<Charge> => {
      const validated = createChargeSchema.parse(input);
      const charge = await request<Charge>('POST', '/charges', { body: validated });
      return chargeSchema.parse(charge);
    },

    /**
     * Update charge
     * PATCH /api/charges/:id
     */
    update: async (id: string, input: UpdateChargeInput): Promise<Charge> => {
      const validated = updateChargeSchema.parse(input);
      const charge = await request<Charge>('PATCH', `/charges/${id}`, {
        body: validated,
      });
      return chargeSchema.parse(charge);
    },

    /**
     * Delete charge
     * DELETE /api/charges/:id
     */
    delete: async (id: string): Promise<void> => {
      await request<void>('DELETE', `/charges/${id}`);
    },

    /**
     * Get payments for a charge
     * GET /api/charges/:id/payments
     */
    getPayments: async (id: string): Promise<ScheduledPayment[]> => {
      const payments = await request<ScheduledPayment[]>('GET', `/charges/${id}/payments`);
      return z.array(scheduledPaymentSchema).parse(payments);
    },

    /**
     * Get next payment for a charge
     * GET /api/charges/:id/payments/next
     */
    getNextPayment: async (id: string): Promise<ScheduledPayment | null> => {
      const payment = await request<ScheduledPayment | null>('GET', `/charges/${id}/payments/next`);
      if (!payment) return null;
      return scheduledPaymentSchema.parse(payment);
    },

    /**
     * Mark payment as paid
     * PATCH /api/charges/:id/payments/:paymentId/paid
     */
    markPaymentAsPaid: async (
      chargeId: string,
      paymentId: string
    ): Promise<ScheduledPayment> => {
      const payment = await request<ScheduledPayment>(
        'PATCH',
        `/charges/${chargeId}/payments/${paymentId}/paid`
      );
      return scheduledPaymentSchema.parse(payment);
    },

    /**
     * Regenerate payments for a charge
     * POST /api/charges/:id/regenerate
     */
    regeneratePayments: async (id: string): Promise<Charge> => {
      const charge = await request<Charge>('POST', `/charges/${id}/regenerate`);
      return chargeSchema.parse(charge);
    },
  },
};

/**
 * Alternative: Raw API client for custom requests
 */
export const rawApi = {
  get: async <T>(path: string, params?: Record<string, string | number | boolean>): Promise<T> =>
    request<T>('GET', path, { params }),

  post: async <T>(path: string, body?: unknown): Promise<T> =>
    request<T>('POST', path, { body }),

  put: async <T>(path: string, body?: unknown): Promise<T> =>
    request<T>('PUT', path, { body }),

  patch: async <T>(path: string, body?: unknown): Promise<T> =>
    request<T>('PATCH', path, { body }),

  delete: async <T>(path: string): Promise<T> =>
    request<T>('DELETE', path),
};

export { ApiError };
export type { ApiResponse };
