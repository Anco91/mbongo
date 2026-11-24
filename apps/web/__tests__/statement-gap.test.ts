/**
 * Tests for computeStatementGap — écart du dernier relevé d'un compte,
 * comparé au solde calculé à la date du relevé.
 */

import { computeStatementGap } from '@mbongo/shared';

const account = { id: 'a1', openingBalance: 1000 };

const tx = (date: string, amount: number, accountId = 'a1') => ({
  accountId,
  date,
  amount,
});

const snap = (
  date: string,
  balance: number,
  createdAt = '2026-11-20T08:00:00.000Z',
  accountId = 'a1'
) => ({ accountId, date, balance, createdAt });

describe('computeStatementGap', () => {
  it('returns null when the account has no snapshot', () => {
    expect(
      computeStatementGap(account, [tx('2026-11-10', -200)], [])
    ).toBeNull();
  });

  it('returns null when the only snapshot belongs to another account', () => {
    expect(
      computeStatementGap(
        account,
        [],
        [snap('2026-11-15', 900, undefined, 'a2')]
      )
    ).toBeNull();
  });

  it('is snapshot minus the balance computed at the snapshot date', () => {
    const result = computeStatementGap(
      account,
      [tx('2026-11-10', -200)],
      [snap('2026-11-15', 900)]
    );
    expect(result).toEqual({
      snapshotDate: '2026-11-15',
      calculated: 800,
      gap: 100,
    });
  });

  it('is negative when a debit is missing from the app', () => {
    const result = computeStatementGap(account, [], [snap('2026-11-15', 700)]);
    expect(result?.gap).toBe(-300);
  });

  it('ignores transactions dated after the snapshot day', () => {
    const result = computeStatementGap(
      account,
      [tx('2026-11-10', -200), tx('2026-11-16', -50)],
      [snap('2026-11-15', 800)]
    );
    expect(result?.calculated).toBe(800);
    expect(result?.gap).toBe(0);
  });

  it('counts a transaction of the snapshot day whatever its time', () => {
    const result = computeStatementGap(
      account,
      [tx('2026-11-15T23:59:00.000Z', -100)],
      [snap('2026-11-15T00:00:00.000Z', 900)]
    );
    expect(result?.calculated).toBe(900);
    expect(result?.gap).toBe(0);
  });

  it('ignores transactions of other accounts', () => {
    const result = computeStatementGap(
      account,
      [tx('2026-11-10', -200, 'a2')],
      [snap('2026-11-15', 1000)]
    );
    expect(result?.calculated).toBe(1000);
  });

  it('compares only the most recent snapshot', () => {
    const result = computeStatementGap(
      account,
      [],
      [snap('2026-10-31', 500), snap('2026-11-15', 1000)]
    );
    expect(result).toEqual({
      snapshotDate: '2026-11-15',
      calculated: 1000,
      gap: 0,
    });
  });

  it('breaks a same-date tie with the latest createdAt', () => {
    const result = computeStatementGap(
      account,
      [],
      [
        snap('2026-11-15', 900, '2026-11-16T08:00:00.000Z'),
        snap('2026-11-15', 950, '2026-11-17T08:00:00.000Z'),
      ]
    );
    expect(result?.gap).toBe(-50);
  });

  it('rounds the gap to the cent and absorbs float noise', () => {
    const result = computeStatementGap(
      { id: 'a1', openingBalance: 0.1 },
      [tx('2026-11-10', 0.2)],
      [snap('2026-11-15', 0.3)]
    );
    expect(result?.gap).toBe(0);
  });
});
