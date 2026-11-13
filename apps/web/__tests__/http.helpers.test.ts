/**
 * Unit tests for the http helpers not covered by route integration tests:
 * success response builders and body/query parsing errors.
 *
 * @module Tests/Common/HTTPHelpers
 * @jest-environment node
 */
import {
  toSuccessResponse,
  toCreatedResponse,
  parseBody,
  parseQuery,
  HttpError,
} from '@/server/common/http';
import { z } from 'zod';
import { filterSchema } from '@mbongo/shared';

const schema = z.object({ name: z.string().min(1) });

describe('response builders', () => {
  it('wraps data with success true', async () => {
    const response = toSuccessResponse({ hello: 'world' });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: { hello: 'world' },
      success: true,
    });
  });

  it('returns 201 for created resources', async () => {
    const response = toCreatedResponse({ id: 'x' });

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      data: { id: 'x' },
    });
  });
});

describe('parseBody', () => {
  it('parses a valid body', async () => {
    const request = new Request('http://localhost/api', {
      method: 'POST',
      body: JSON.stringify({ name: 'A' }),
      headers: { 'content-type': 'application/json' },
    });

    await expect(parseBody(request, schema)).resolves.toEqual({ name: 'A' });
  });

  it('rejects an invalid body with a readable 400', async () => {
    const request = new Request('http://localhost/api', {
      method: 'POST',
      body: JSON.stringify({ name: '' }),
      headers: { 'content-type': 'application/json' },
    });

    await expect(parseBody(request, schema)).rejects.toMatchObject({
      status: 400,
    } as Partial<HttpError>);
  });

  it('rejects a malformed JSON body with a readable 400', async () => {
    const request = new Request('http://localhost/api', {
      method: 'POST',
      body: 'not-json',
      headers: { 'content-type': 'application/json' },
    });

    await expect(parseBody(request, schema)).rejects.toMatchObject({
      status: 400,
    } as Partial<HttpError>);
  });
});

describe('parseQuery', () => {
  it('parses a valid query string', () => {
    const parsed = parseQuery(
      new Request('http://localhost/api?limit=10'),
      z.object({ limit: z.coerce.number().optional() })
    );

    expect(parsed).toEqual({ limit: 10 });
  });

  it('rejects an invalid query with a readable 400', () => {
    expect.assertions(1);
    try {
      parseQuery(
        new Request('http://localhost/api?limit=not-a-number'),
        z.object({ limit: z.coerce.number().int() })
      );
    } catch (error) {
      expect((error as HttpError).status).toBe(400);
    }
  });
});

describe('parseQuery — filter syntax and pagination helper', () => {
  it('parses bracketed filters and the in operator', () => {
    const parsed = parseQuery(
      new Request('http://localhost/api?currency[eq]=EUR&status[in]=A,B'),
      z.object({
        currency: filterSchema.optional(),
        status: filterSchema.optional(),
      })
    );

    expect(parsed.currency).toEqual({ eq: 'EUR' });
    expect(parsed.status).toEqual({ in: ['A', 'B'] });
  });

  it('wraps unknown plain errors as 500 (console.error path)', async () => {
    const { toErrorResponse } = await import('@/server/common/http');
    const response = toErrorResponse(new Error('boom'));
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.objectContaining({ code: 'INTERNAL_ERROR' }),
    });
  });

  it('builds a 204 no-content response', async () => {
    const { toNoContentResponse } = await import('@/server/common/http');
    const response = toNoContentResponse();
    expect(response.status).toBe(204);
  });

  it('builds a paginated response', async () => {
    const { toPaginatedResponse } = await import('@/server/common/http');
    const response = toPaginatedResponse([], {
      page: 1,
      limit: 100,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrevious: false,
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      data: [],
      pagination: { total: 0 },
    });
  });

  it('validates dynamic route params through parseParams', () => {
    const { parseParams } = require('@/server/common/http') as {
      parseParams: (
        params: Record<string, string | undefined>,
        schema: z.ZodSchema<{ id: string }>
      ) => { id: string };
    };

    expect(parseParams({ id: 'abc' }, z.object({ id: z.string() }))).toEqual({
      id: 'abc',
    });

    expect.assertions(2);
    try {
      parseParams({ id: undefined }, z.object({ id: z.string() }));
    } catch (error) {
      expect((error as HttpError).status).toBe(400);
    }
  });

  it('maps a plain error carrying a status property to that status', async () => {
    const { toErrorResponse } = await import('@/server/common/http');
    const error = new Error('custom status');
    (error as Error & { status: number }).status = 418;

    const response = toErrorResponse(error);

    expect(response.status).toBe(418);
    await expect(response.json()).resolves.toMatchObject({
      error: { message: 'custom status' },
    });
  });

  it('maps a thrown non-Error value to 500', async () => {
    const { toErrorResponse } = await import('@/server/common/http');

    const response = toErrorResponse('boom' as unknown as Error);

    expect(response.status).toBe(500);
  });
});
