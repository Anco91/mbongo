/**
 * Transfer archive — pure rules (spec transfers-archive).
 *
 * `CLOSED` counts as realized for the fallback rate; closed transfers are
 * hidden unless asked for.
 *
 * @module Tests/Transfers/TransferArchive
 */
import {
  findLatestRate,
  isTransferClosed,
  filterVisibleTransfers,
  type Transfer,
} from '@mbongo/shared';

function makeTransfer(overrides: Partial<Transfer>): Transfer {
  return {
    id: 'tr',
    sourceAccountId: 'acc-chf',
    targetAccountId: 'acc-eur',
    amountSent: 1000,
    rateEstimated: 0.92,
    rateDate: '2026-11-01T00:00:00.000Z',
    amountReceived: null,
    rateEffective: null,
    fees: null,
    memo: null,
    status: 'ESTIMATED',
    sentAt: '2026-11-01T00:00:00.000Z',
    receivedAt: null,
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('findLatestRate with closed transfers', () => {
  it('counts a CLOSED transfer with an effective rate as realized, ahead of a newer estimate', () => {
    const closed = makeTransfer({
      id: 'closed',
      status: 'CLOSED',
      amountReceived: 950,
      rateEffective: 0.95,
      receivedAt: '2026-11-02T00:00:00.000Z',
    });
    const newerEstimate = makeTransfer({
      id: 'est',
      rateEstimated: 0.93,
      rateDate: '2026-11-10T00:00:00.000Z',
    });

    expect(findLatestRate([closed, newerEstimate])).toEqual({
      rate: 0.95,
      rateDate: '2026-11-02T00:00:00.000Z',
    });
  });

  it('picks the most recent between a COMPLETED and a CLOSED realized transfer', () => {
    const completed = makeTransfer({
      id: 'done',
      status: 'COMPLETED',
      amountReceived: 920,
      rateEffective: 0.92,
      receivedAt: '2026-11-02T00:00:00.000Z',
    });
    const closed = makeTransfer({
      id: 'closed',
      status: 'CLOSED',
      amountReceived: 950,
      rateEffective: 0.95,
      receivedAt: '2026-11-05T00:00:00.000Z',
    });

    expect(findLatestRate([completed, closed])?.rate).toBe(0.95);
  });

  it('falls back to the estimated rate for a CLOSED transfer without effective rate', () => {
    const abandoned = makeTransfer({
      id: 'abandoned',
      status: 'CLOSED',
      rateEstimated: 0.91,
      rateDate: '2026-11-03T00:00:00.000Z',
    });

    expect(findLatestRate([abandoned])).toEqual({
      rate: 0.91,
      rateDate: '2026-11-03T00:00:00.000Z',
    });
  });

  it('still ignores an ESTIMATED transfer when a realized one exists', () => {
    const completed = makeTransfer({
      status: 'COMPLETED',
      rateEffective: 0.92,
      amountReceived: 920,
      receivedAt: '2026-11-02T00:00:00.000Z',
    });
    const estimate = makeTransfer({
      id: 'est',
      rateEstimated: 0.99,
      rateDate: '2026-11-20T00:00:00.000Z',
    });

    expect(findLatestRate([estimate, completed])?.rate).toBe(0.92);
  });
});

describe('isTransferClosed', () => {
  it.each([
    ['CLOSED', true],
    ['COMPLETED', false],
    ['ESTIMATED', false],
  ] as const)('%s → %s', (status, expected) => {
    expect(isTransferClosed({ status })).toBe(expected);
  });
});

describe('filterVisibleTransfers', () => {
  const estimated = makeTransfer({ id: 'a', status: 'ESTIMATED' });
  const closed = makeTransfer({ id: 'b', status: 'CLOSED' });
  const completed = makeTransfer({ id: 'c', status: 'COMPLETED' });
  const all = [estimated, closed, completed];

  it('hides closed transfers by default, keeping order', () => {
    expect(filterVisibleTransfers(all, false).map((t) => t.id)).toEqual([
      'a',
      'c',
    ]);
  });

  it('keeps everything when showClosed is true, keeping order', () => {
    expect(filterVisibleTransfers(all, true).map((t) => t.id)).toEqual([
      'a',
      'b',
      'c',
    ]);
  });

  it('returns an empty list for an empty list', () => {
    expect(filterVisibleTransfers([], false)).toEqual([]);
  });

  it('never mutates its input', () => {
    const input = [...all];
    filterVisibleTransfers(input, false);
    expect(input).toEqual(all);
  });
});
