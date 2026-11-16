/**
 * Tests for the portable where-translator core.
 *
 * No Mbongo entity, no Prisma client: a fake where type exercises the
 * generic operators, the field map (targets + transforms) and the
 * ignoring of unmapped query keys.
 *
 * @module Tests/Common/WhereTranslator
 */
import { createWhereTranslator, type FieldMap } from '@/server/common/where-translator';

type FakeWhere = Record<string, unknown>;

describe('createWhereTranslator', () => {
  it('translates the generic operators of a mapped filter', () => {
    const translate = createWhereTranslator<FakeWhere>({
      status: { ops: ['eq', 'not', 'in', 'notIn', 'gte', 'gt', 'lte', 'lt'] },
    });

    expect(translate({ status: { eq: 'PENDING' } })).toEqual({
      status: { equals: 'PENDING' },
    });
    expect(translate({ status: { not: 'PAID' } })).toEqual({
      status: { not: 'PAID' },
    });
    expect(translate({ status: { in: ['A', 'B'] } })).toEqual({
      status: { in: ['A', 'B'] },
    });
    expect(translate({ status: { gte: 10, lt: 20 } })).toEqual({
      status: { gte: 10, lt: 20 },
    });
  });

  it('adds insensitive mode on text operators', () => {
    const translate = createWhereTranslator<FakeWhere>({
      label: { ops: ['contains', 'startsWith', 'endsWith'] },
    });

    expect(translate({ label: { contains: 'Loyer' } })).toEqual({
      label: { contains: 'Loyer', mode: 'insensitive' },
    });
    expect(translate({ label: { startsWith: 'L' } })).toEqual({
      label: { startsWith: 'L', mode: 'insensitive' },
    });
  });

  it('ignores unmapped query keys (pagination, sorting, unknown fields)', () => {
    const translate = createWhereTranslator<FakeWhere>({
      type: { ops: ['eq'] },
    });

    expect(
      translate({
        type: { eq: 'FIXED_RECURRING' },
        limit: 50,
        cursor: 'abc',
        orderBy: 'amount',
        orderDirection: 'desc',
        hacker: { eq: 'x' },
      })
    ).toEqual({ type: { equals: 'FIXED_RECURRING' } });
  });

  it('maps a query key to a different model field via target', () => {
    const translate = createWhereTranslator<FakeWhere>({
      dateFrom: { ops: ['gte'], target: 'date' },
      dateTo: { ops: ['lte'], target: 'date' },
    });

    expect(
      translate({ dateFrom: '2026-11-01', dateTo: '2026-11-30' })
    ).toEqual({ date: { gte: '2026-11-01', lte: '2026-11-30' } });
  });

  it('applies the optional value transform', () => {
    const translate = createWhereTranslator<FakeWhere>({
      amount: { ops: ['gte'], transform: (v) => Number(v) * 100 },
    });

    expect(translate({ amount: { gte: 1.5 } })).toEqual({
      amount: { gte: 150 },
    });
  });

  it('accepts a bare scalar as an implicit eq on the first allowed op', () => {
    const translate = createWhereTranslator<FakeWhere>({
      status: { ops: ['eq'] },
    });

    expect(translate({ status: 'PENDING' })).toEqual({
      status: { equals: 'PENDING' },
    });
  });

  it('skips empty filter objects and undefined entries', () => {
    const translate = createWhereTranslator<FakeWhere>({
      status: { ops: ['eq'] },
    });

    expect(translate({ status: {}, other: undefined })).toEqual({});
  });

  it('never emits an operator outside the field map (PoC of portability)', () => {
    // Only 'eq' allowed: 'contains' present in the query is dropped.
    const fieldMap: FieldMap = { name: { ops: ['eq'] } };
    const translate = createWhereTranslator<FakeWhere>(fieldMap);

    expect(translate({ name: { eq: 'UBS', contains: 'x' } })).toEqual({
      name: { equals: 'UBS' },
    });
  });
});
