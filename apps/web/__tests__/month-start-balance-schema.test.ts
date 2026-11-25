/**
 * Spec 40 — schemas of the persisted start-of-month balance.
 *
 * Pins: a row = (month, accountId, balance); a save body = at least one
 * account, one entry per account, finite balance in cents, negative allowed
 * (overdraft). Money stays at 2 decimals; float noise (0.1 + 0.2) is accepted.
 *
 * @module Tests/Schemas/MonthStartBalance
 * @jest-environment node
 */
import {
  monthStartBalanceSchema,
  saveMonthStartBalancesSchema,
} from '@mbongo/shared';

const row = {
  month: '2026-12',
  accountId: 'acc-current-1',
  balance: 1234.5,
  createdAt: '2026-11-25T10:00:00.000Z',
  updatedAt: '2026-11-25T10:00:00.000Z',
};

describe('monthStartBalanceSchema', () => {
  it('accepts a valid row', () => {
    expect(monthStartBalanceSchema.safeParse(row).success).toBe(true);
  });

  it('accepts a negative balance (overdraft)', () => {
    expect(
      monthStartBalanceSchema.safeParse({ ...row, balance: -250 }).success
    ).toBe(true);
  });

  it.each(['2026-13', '2026-00', '2026-1', '26-12', '2026/12', ''])(
    'rejects month %p',
    (month) => {
      expect(monthStartBalanceSchema.safeParse({ ...row, month }).success).toBe(
        false
      );
    }
  );

  it('rejects an empty accountId', () => {
    expect(
      monthStartBalanceSchema.safeParse({ ...row, accountId: '' }).success
    ).toBe(false);
  });

  it.each([NaN, Infinity, -Infinity])('rejects balance %p', (balance) => {
    expect(monthStartBalanceSchema.safeParse({ ...row, balance }).success).toBe(
      false
    );
  });
});

describe('saveMonthStartBalancesSchema', () => {
  it('accepts one entry', () => {
    const parsed = saveMonthStartBalancesSchema.safeParse({
      balances: [{ accountId: 'acc-1', balance: 100 }],
    });
    expect(parsed.success).toBe(true);
  });

  it('accepts several accounts, a zero and a negative balance', () => {
    const parsed = saveMonthStartBalancesSchema.safeParse({
      balances: [
        { accountId: 'acc-1', balance: 0 },
        { accountId: 'acc-2', balance: -80.25 },
      ],
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects an empty list', () => {
    expect(
      saveMonthStartBalancesSchema.safeParse({ balances: [] }).success
    ).toBe(false);
  });

  it('rejects the same account twice', () => {
    const parsed = saveMonthStartBalancesSchema.safeParse({
      balances: [
        { accountId: 'acc-1', balance: 10 },
        { accountId: 'acc-1', balance: 20 },
      ],
    });
    expect(parsed.success).toBe(false);
  });

  it('rejects a body without the balances key', () => {
    expect(saveMonthStartBalancesSchema.safeParse({}).success).toBe(false);
  });

  it.each([NaN, Infinity, 1234.567, 0.001])('rejects balance %p', (balance) => {
    const parsed = saveMonthStartBalancesSchema.safeParse({
      balances: [{ accountId: 'acc-1', balance }],
    });
    expect(parsed.success).toBe(false);
  });

  it('accepts float noise below the cent (0.1 + 0.2)', () => {
    const parsed = saveMonthStartBalancesSchema.safeParse({
      balances: [{ accountId: 'acc-1', balance: 0.1 + 0.2 }],
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects an empty accountId', () => {
    const parsed = saveMonthStartBalancesSchema.safeParse({
      balances: [{ accountId: '', balance: 10 }],
    });
    expect(parsed.success).toBe(false);
  });
});
