/**
 * Tests for listNetWorthTerms — termes du patrimoine consolidé (un par compte
 * actif au solde non nul, devise native, actif ou découvert).
 */

import {
  computeConsolidatedBalance,
  listNetWorthTerms,
  type Account,
} from '@mbongo/shared';

const account = (over: Partial<Account> & { id: string }): Account =>
  ({
    name: over.id,
    bank: null,
    currency: 'CHF',
    accountType: 'CURRENT',
    memberId: null,
    overdraftLimit: 0,
    deferredCard: false,
    billingDay: null,
    linkedAccountId: null,
    openingBalance: 0,
    status: 'ACTIVE',
    closedAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...over,
  }) as Account;

describe('listNetWorthTerms', () => {
  it('returns an empty list without accounts', () => {
    expect(listNetWorthTerms([], {})).toEqual([]);
  });

  it('lists a positive account as an asset in its native currency', () => {
    const terms = listNetWorthTerms(
      [account({ id: 'a1', name: 'Épargne X', currency: 'CHF' })],
      { a1: 1000 }
    );
    expect(terms).toEqual([
      {
        accountId: 'a1',
        name: 'Épargne X',
        currency: 'CHF',
        balance: 1000,
        kind: 'asset',
      },
    ]);
  });

  it('lists a negative account as an overdraft with its signed balance', () => {
    const terms = listNetWorthTerms(
      [account({ id: 'a2', name: 'Compte courant X', currency: 'EUR' })],
      { a2: -500 }
    );
    expect(terms).toEqual([
      {
        accountId: 'a2',
        name: 'Compte courant X',
        currency: 'EUR',
        balance: -500,
        kind: 'overdraft',
      },
    ]);
  });

  it('drops closed accounts', () => {
    const terms = listNetWorthTerms(
      [account({ id: 'a1', status: 'CLOSED' }), account({ id: 'a2' })],
      { a1: 300, a2: 10 }
    );
    expect(terms.map((t) => t.accountId)).toEqual(['a2']);
  });

  it('drops zero balances, including float noise below a cent', () => {
    const terms = listNetWorthTerms(
      [account({ id: 'a1' }), account({ id: 'a2' }), account({ id: 'a3' })],
      { a1: 0, a2: 0.1 + 0.2 - 0.3, a3: 5 }
    );
    expect(terms.map((t) => t.accountId)).toEqual(['a3']);
  });

  it('falls back to the opening balance when no balance is given', () => {
    const terms = listNetWorthTerms(
      [account({ id: 'a1', openingBalance: 250 })],
      {}
    );
    expect(terms).toHaveLength(1);
    expect(terms[0].balance).toBe(250);
  });

  it('rounds balances to 2 decimals', () => {
    const terms = listNetWorthTerms([account({ id: 'a1' })], { a1: 10.126 });
    expect(terms[0].balance).toBe(10.13);
  });

  it('orders assets by balance descending, then overdrafts most negative first, ties by name', () => {
    const accounts = [
      account({ id: 'd1', name: 'Découvert léger' }),
      account({ id: 'a1', name: 'Petit' }),
      account({ id: 'd2', name: 'Découvert lourd' }),
      account({ id: 'a2', name: 'Gros' }),
      account({ id: 'a3', name: 'Alpha' }),
      account({ id: 'a4', name: 'Bravo' }),
    ];
    const terms = listNetWorthTerms(accounts, {
      d1: -10,
      a1: 5,
      d2: -300,
      a2: 900,
      a3: 50,
      a4: 50,
    });
    expect(terms.map((t) => t.accountId)).toEqual([
      'a2',
      'a3',
      'a4',
      'a1',
      'd2',
      'd1',
    ]);
  });

  it('sums per currency to the native totals of computeConsolidatedBalance', () => {
    const accounts = [
      account({ id: 'a1', currency: 'CHF' }),
      account({ id: 'a2', currency: 'CHF' }),
      account({ id: 'a3', currency: 'EUR' }),
      account({ id: 'a4', currency: 'EUR' }),
      account({ id: 'a5', currency: 'EUR', status: 'CLOSED' }),
    ];
    const balances = { a1: 1000.1, a2: -250.2, a3: 400, a4: -500, a5: 99 };
    const terms = listNetWorthTerms(accounts, balances);
    const sum = (cur: 'CHF' | 'EUR') =>
      Math.round(
        terms
          .filter((t) => t.currency === cur)
          .reduce((s, t) => s + t.balance, 0) * 100
      ) / 100;
    const consolidated = computeConsolidatedBalance(accounts, balances, [], {
      rate: 1,
      rateDate: '2026-11-24',
    });
    expect(sum('CHF')).toBe(consolidated.totalChf);
    // rate 1: totalEur = EUR native + CHF native
    expect(sum('EUR') + sum('CHF')).toBeCloseTo(
      consolidated.totalEur ?? NaN,
      2
    );
  });
});
