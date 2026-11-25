/**
 * Tests for computeRemainingToLive — balances of active non-savings accounts
 * (credit cards included) minus due charges, in EUR.
 */

import { computeRemainingToLive, type Account } from '@mbongo/shared';

const account = (over: Partial<Account> & { id: string }): Account =>
  ({
    name: over.id,
    currency: 'EUR',
    accountType: 'CURRENT',
    openingBalance: 0,
    status: 'ACTIVE',
    ...over,
  }) as Account;

describe('computeRemainingToLive', () => {
  it('returns minus the due charges without accounts', () => {
    expect(computeRemainingToLive([], {}, 300, 0.9)).toBe(-300);
  });

  it('excludes SAVINGS accounts', () => {
    const accounts = [
      account({ id: 'a1' }),
      account({ id: 'a2', accountType: 'SAVINGS' }),
    ];
    expect(
      computeRemainingToLive(accounts, { a1: 2000, a2: 5000 }, 500, 0.9)
    ).toBe(1500);
  });

  it('excludes non-ACTIVE accounts', () => {
    const accounts = [
      account({ id: 'a1' }),
      account({ id: 'a2', status: 'CLOSED' }),
    ];
    expect(
      computeRemainingToLive(accounts, { a1: 1000, a2: 900 }, 0, 0.9)
    ).toBe(1000);
  });

  it('includes a credit card with its negative balance', () => {
    const accounts = [
      account({ id: 'a1' }),
      account({ id: 'a2', accountType: 'CREDIT_CARD' }),
    ];
    expect(
      computeRemainingToLive(accounts, { a1: 1000, a2: -200 }, 100, 0.9)
    ).toBe(700);
  });

  it('converts CHF balances to EUR at the rate', () => {
    const accounts = [account({ id: 'a1', currency: 'CHF' })];
    expect(computeRemainingToLive(accounts, { a1: 1000 }, 0, 0.9231)).toBe(
      923.1
    );
  });

  it('falls back to the opening balance when no balance is given', () => {
    const accounts = [account({ id: 'a1', openingBalance: 400 })];
    expect(computeRemainingToLive(accounts, {}, 100, 0.9)).toBe(300);
  });

  it('returns null when due charges are unknown', () => {
    expect(
      computeRemainingToLive([account({ id: 'a1' })], { a1: 10 }, null, 0.9)
    ).toBeNull();
  });

  it('returns null when a CHF account cannot be converted (no rate)', () => {
    const accounts = [account({ id: 'a1', currency: 'CHF' })];
    expect(computeRemainingToLive(accounts, { a1: 10 }, 0, null)).toBeNull();
  });

  it('still computes EUR-only accounts without a rate', () => {
    expect(
      computeRemainingToLive([account({ id: 'a1' })], { a1: 10 }, 4, null)
    ).toBe(6);
  });
});
