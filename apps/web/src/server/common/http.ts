/**
 * HTTP Validation & Error Handling Utilities
 *
 * This module provides centralized validation and error handling for HTTP requests.
 * It's the equivalent of NestJS's ZodValidationPipe.
 *
 * @module Server/Common/HTTP
 */

import { NextResponse } from 'next/server';
import { z, ZodError, ZodIssue, ZodSchema } from 'zod';

/**
 * Custom HTTP Error with status code and details
 *
 * @example
 * ```typescript
 * throw new HttpError(404, { message: 'Not found' });
 * ```
 */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly details?: unknown,
    readonly code?: string
  ) {
    super(`HTTP ${status}` + (code ? ` (${code})` : ''));
    this.name = 'HttpError';
  }
}

/**
 * Not Found Error (404)
 */
export class NotFoundError extends HttpError {
  constructor(resource: string, id: string) {
    super(404, { message: `${resource} not found: ${id}` }, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

/**
 * Bad Request Error (400)
 */
export class BadRequestError extends HttpError {
  constructor(message: string, details?: unknown) {
    super(400, { message, ...asObject(details) }, 'BAD_REQUEST');
    this.name = 'BadRequestError';
  }
}

/**
 * Unauthorized Error (401)
 */
export class UnauthorizedError extends HttpError {
  constructor(message: string = 'Unauthorized') {
    super(401, { message }, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

/**
 * Forbidden Error (403)
 */
export class ForbiddenError extends HttpError {
  constructor(message: string = 'Forbidden') {
    super(403, { message }, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

/**
 * Conflict Error (409)
 */
export class ConflictError extends HttpError {
  constructor(message: string, details?: unknown) {
    super(409, { message, ...asObject(details) }, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

/**
 * Internal Server Error (500)
 */
export class InternalServerError extends HttpError {
  constructor(message: string = 'Internal server error', details?: unknown) {
    super(500, { message, ...asObject(details) }, 'INTERNAL_ERROR');
    this.name = 'InternalServerError';
  }
}

function asObject(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : {};
}

/**
 * Parse request body using Zod schema
 *
 * @param request - Next.js Request object
 * @param schema - Zod schema for validation
 * @returns Parsed and validated data
 * @throws HttpError (400) if validation fails
 *
 * @example
 * ```typescript
 * const input = await parseBody(request, createChargeSchema);
 * ```
 */
export async function parseBody<TSchema extends z.ZodTypeAny>(
  request: Request,
  schema: TSchema
): Promise<z.output<TSchema>> {
  const body = await request.json();
  return parse(body, schema);
}

/**
 * Parse query parameters using Zod schema
 *
 * @param request - Next.js Request object
 * @param schema - Zod schema for validation
 * @returns Parsed and validated query parameters
 * @throws HttpError (400) if validation fails
 *
 * @example
 * ```typescript
 * const query = parseQuery(request, chargeQuerySchema);
 * ```
 */
export function parseQuery<TSchema extends z.ZodTypeAny>(
  request: Request,
  schema: TSchema
): z.output<TSchema> {
  const searchParams = new URL(request.url).searchParams;
  const query: Record<string, unknown> = {};

  for (const [key, value] of searchParams) {
    const match = /^(.*)\[(\w+)\]$/.exec(key);
    if (!match) {
      query[key] = value;
      continue;
    }

    const [, field, operator] = match;
    const filters = (query[field] ??= {}) as Record<string, unknown>;
    filters[operator] = operator === 'in' ? value.split(',') : value;
  }

  return parse(query, schema);
}

/**
 * Parse URL parameters using Zod schema
 *
 * @param params - URL parameters object
 * @param schema - Zod schema for validation
 * @returns Parsed and validated parameters
 * @throws HttpError (400) if validation fails
 *
 * @example
 * ```typescript
 * const params = await request.nextUrl.pathname; // or from Next.js dynamic routes
 * const validated = parseParams({ id: params.id }, idParamSchema);
 * ```
 */
export function parseParams<T>(
  params: Record<string, string | undefined>,
  schema: ZodSchema<T>
): T {
  return parse(params, schema);
}

/**
 * Core parsing function used by parseBody, parseQuery, and parseParams
 *
 * @param value - Value to parse
 * @param schema - Zod schema for validation
 * @returns Parsed and validated data
 * @throws HttpError (400) if validation fails
 */
function parse<TSchema extends z.ZodTypeAny>(
  value: unknown,
  schema: TSchema
): z.output<TSchema> {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new HttpError(400, formatZodError(result.error), 'VALIDATION_ERROR');
  }
  return result.data;
}

/**
 * Format Zod error into a more readable format
 *
 * @param error - Zod error
 * @returns Formatted error details
 */
function formatZodError(error: ZodError): Record<string, unknown> {
  const formatted: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const path = issue.path.join('.');
    if (!formatted[path]) {
      formatted[path] = [];
    }
    formatted[path].push(issue.message);
  }

  return {
    message: 'Validation failed',
    errors: formatted,
    issues: error.issues.map(formatZodIssue),
  };
}

/**
 * Format a single Zod issue
 *
 * @param issue - Zod issue
 * @returns Formatted issue
 */
function formatZodIssue(issue: ZodIssue): Record<string, unknown> {
  return {
    path: issue.path,
    message: issue.message,
    code: issue.code,
    ...(issue.fatal && { fatal: issue.fatal }),
    ...('minimum' in issue && { minimum: issue.minimum }),
    ...('maximum' in issue && { maximum: issue.maximum }),
    ...('type' in issue && { type: issue.type }),
    ...('inclusive' in issue && { inclusive: issue.inclusive }),
  };
}

/**
 * Convert any error to a NextResponse
 *
 * This is the single error mapper for every route handler.
 * Unknown errors never leak internals to the client.
 *
 * @param error - Any error (HttpError, ZodError, or unknown)
 * @returns NextResponse with appropriate status code and error details
 *
 * @example
 * ```typescript
 * export const GET = (request: Request) => {
 *   try {
 *     const data = getData();
 *     return NextResponse.json(data);
 *   } catch (error) {
 *     return toErrorResponse(error);
 *   }
 * };
 * ```
 */
export function toErrorResponse(error: unknown): NextResponse {
  // Handle HttpError (our custom errors)
  if (error instanceof HttpError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          ...(error.details !== undefined ? { details: error.details } : {}),
        },
      },
      { status: error.status }
    );
  }

  // Handle ZodError (validation errors)
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: formatZodError(error),
        },
      },
      { status: 400 }
    );
  }

  // Handle plain errors with status code
  if (error instanceof Error && 'status' in error) {
    const statusError = error as HttpError & { status: number };
    return NextResponse.json(
      {
        error: {
          message: statusError.message,
        },
      },
      { status: statusError.status }
    );
  }

  // Handle plain errors
  if (error instanceof Error) {
    console.error('Unhandled error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
      },
      { status: 500 }
    );
  }

  // Handle any other error (should not happen, but just in case)
  console.error('Unknown error:', error);
  return NextResponse.json(
    {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      },
    },
    { status: 500 }
  );
}

/**
 * Success response helper
 *
 * @param data - Data to return
 * @param status - HTTP status code (default: 200)
 * @returns NextResponse with data
 */
export function toSuccessResponse<T>(
  data: T,
  status: number = 200
): NextResponse {
  return NextResponse.json(
    {
      data,
      success: true,
    },
    { status }
  );
}

/**
 * Created response helper (201)
 *
 * @param data - Created resource
 * @returns NextResponse with 201 status
 */
export function toCreatedResponse<T>(data: T): NextResponse {
  return toSuccessResponse(data, 201);
}

/**
 * No content response helper (204)
 *
 * @returns NextResponse with 204 status
 */
export function toNoContentResponse(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

/**
 * Paginated response helper
 *
 * @param data - Array of items
 * @param pagination - Pagination metadata
 * @returns NextResponse with paginated data
 */
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export function toPaginatedResponse<T>(
  data: T[],
  pagination: Pagination
): NextResponse {
  return NextResponse.json(
    {
      data,
      pagination,
      success: true,
    },
    { status: 200 }
  );
}
