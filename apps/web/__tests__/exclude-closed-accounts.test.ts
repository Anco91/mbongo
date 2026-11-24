/**
 * Locked tests for 06-closed-accounts-in-charts: the rule that removes
 * closed accounts, and everything pointing at them, from the chart inputs.
 *
 * @module Tests/Calculation/ExcludeClosedAccounts
 */
import { excludeClosedAccounts } from '@mbongo/shared';
import type {
  Account,
  Charge,
  Payment,
  Transaction,
  Transfer,
} from '@mbongo/shared';

const account = (id: string, status: 'ACTIVE' | 'CLOSED'): Account =>
  ({ id, status, name: id, currency: 'EUR' }) as Account;
const tx = (id: string, accountId: string): Transaction =>
  ({ id, accountId, amount: -10 }) as Transaction;
const charge = (id: string, accountId: string): Charge =>
  ({ id, accountId }) as Charge;
const payment = (id: string, chargeId: string): Payment =>
  ({ id, chargeId }) as Payment;
const transfer = (id: string, src: string, tgt: string): Transfer =>
  ({ id, sourceAccountId: src, targetAccountId: tgt }) as Transfer;

const empty = {
  accounts: [] as Account[],
  transactions: [] as Transaction[],
  transfers: [] as Transfer[],
  charges: [] as Charge[],
  payments: [] as Payment[],
};

describe('excludeClosedAccounts', () => {
  it('returns empty collections for empty input', () => {
    expect(excludeClosedAccounts(empty)).toEqual(empty);
  });

  it('keeps everything when all accounts are active', () => {
    const input = {
      accounts: [account('a', 'ACTIVE')],
      transactions: [tx('t1', 'a')],
      transfers: [],
      charges: [charge('c1', 'a')],
      payments: [payment('p1', 'c1')],
    };
    expect(excludeClosedAccounts(input)).toEqual(input);
  });

  it('drops a closed account and its transactions', () => {
    const out = excludeClosedAccounts({
      ...empty,
      accounts: [account('a', 'ACTIVE'), account('x', 'CLOSED')],
      transactions: [tx('t1', 'a'), tx('t2', 'x')],
    });
    expect(out.accounts.map((a) => a.id)).toEqual(['a']);
    expect(out.transactions.map((t) => t.id)).toEqual(['t1']);
  });

  it('drops a transfer touching a closed account on either side', () => {
    const out = excludeClosedAccounts({
      ...empty,
      accounts: [account('a', 'ACTIVE'), account('x', 'CLOSED')],
      transfers: [
        transfer('tr1', 'a', 'x'),
        transfer('tr2', 'x', 'a'),
        transfer('tr3', 'a', 'a2'),
      ],
    });
    expect(out.transfers.map((t) => t.id)).toEqual(['tr3']);
  });

  it('drops charges of a closed account and the payments of those charges', () => {
    const out = excludeClosedAccounts({
      ...empty,
      accounts: [account('a', 'ACTIVE'), account('x', 'CLOSED')],
      charges: [charge('c1', 'a'), charge('c2', 'x')],
      payments: [payment('p1', 'c1'), payment('p2', 'c2')],
    });
    expect(out.charges.map((c) => c.id)).toEqual(['c1']);
    expect(out.payments.map((p) => p.id)).toEqual(['p1']);
  });

  it('does not mutate its input', () => {
    const input = {
      ...empty,
      accounts: [account('x', 'CLOSED')],
      transactions: [tx('t1', 'x')],
    };
    excludeClosedAccounts(input);
    expect(input.accounts).toHaveLength(1);
    expect(input.transactions).toHaveLength(1);
  });
});
