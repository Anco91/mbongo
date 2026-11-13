/**
 * Tests for toErrorResponse — the single error mapper.
 *
 * Covers the FK violation mapping (P2003 → 422) introduced to replace
 * raw 500s when a client references a record that does not exist.
 *
 * @module Tests/Common/HTTP
 * @jest-environment node
 */
import { Prisma } from '@prisma/client';
import {
  toErrorResponse,
  NotFoundError,
  HttpError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  InternalServerError,
} from '@/server/common/http';

describe('toErrorResponse', () => {
  it('maps a Prisma foreign key violation (P2003) to 422', async () => {
    const error = new Prisma.PrismaClientKnownRequestError(
      'Foreign key constraint violated',
      { code: 'P2003', clientVersion: '5.22.0' }
    );

    const response = toErrorResponse(error);
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body).toEqual({
      error: {
        code: 'UNKNOWN_REFERENCE',
        message: 'Referenced record does not exist',
      },
    });
  });

  it('keeps NotFoundError mapped to 404', () => {
    const response = toErrorResponse(new NotFoundError('Charge', 'abc'));

    expect(response.status).toBe(404);
  });

  it('keeps HttpError passthrough with its own status', () => {
    const response = toErrorResponse(new HttpError(409, 'Conflict'));

    expect(response.status).toBe(409);
  });

  it('keeps unknown errors mapped to 500', () => {
    const response = toErrorResponse(new Error('boom'));

    expect(response.status).toBe(500);
  });
});

describe('http error classes', () => {
  it('maps every error class to its status', () => {
    expect(new BadRequestError('bad').status).toBe(400);
    expect(new UnauthorizedError().status).toBe(401);
    expect(new ForbiddenError().status).toBe(403);
    expect(new NotFoundError('Charge', 'x').status).toBe(404);
    expect(new ConflictError('clash').status).toBe(409);
    expect(new InternalServerError().status).toBe(500);
  });

  it('keeps default messages when none provided', () => {
    expect(new UnauthorizedError().details).toMatchObject({
      message: 'Unauthorized',
    });
    expect(new ForbiddenError().details).toMatchObject({
      message: 'Forbidden',
    });
    expect(new InternalServerError().details).toMatchObject({
      message: 'Internal server error',
    });
  });

  it('ignores non-object details in plain errors', () => {
    const response = toErrorResponse(new ConflictError('clash', 'scalar'));
    expect(response.status).toBe(409);
  });

  it('maps ZodError-like errors with issues to 400', async () => {
    const schema = (await import('zod')).z.object({
      a: (await import('zod')).z.string(),
    });
    const result = schema.safeParse({});
    if (result.success) throw new Error('expected failure');

    const response = toErrorResponse(result.error);
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.objectContaining({ code: 'VALIDATION_ERROR' }),
    });
  });
});
