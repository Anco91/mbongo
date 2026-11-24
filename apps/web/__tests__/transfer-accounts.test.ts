/**
 * Transfer account rules (spec transfer-any-account): any two distinct active
 * accounts of the household may exchange money; same currency = no rate/fee.
 *
 * @module Tests/Transfers/TransferAccounts
 */
import {
  checkTransferAccounts,
  isSameCurrencyTransfer,
  settleSameCurrencyTransfer,
  type TransferAccountRef,
} from '@mbongo/shared';

const acc = (
  id: string,
  currency: 'CHF' | 'EUR',
  status: 'ACTIVE' | 'CLOSED' = 'ACTIVE'
): TransferAccountRef => ({ id, currency, status });

describe('checkTransferAccounts', () => {
  it('allows two distinct active accounts of the same currency', () => {
    expect(checkTransferAccounts(acc('a', 'CHF'), acc('b', 'CHF'))).toBeNull();
    expect(checkTransferAccounts(acc('a', 'EUR'), acc('b', 'EUR'))).toBeNull();
  });

  it('allows CHF to EUR and EUR to CHF', () => {
    expect(checkTransferAccounts(acc('a', 'CHF'), acc('b', 'EUR'))).toBeNull();
    expect(checkTransferAccounts(acc('a', 'EUR'), acc('b', 'CHF'))).toBeNull();
  });

  it('refuses the same account on both sides', () => {
    expect(checkTransferAccounts(acc('a', 'CHF'), acc('a', 'CHF'))).toMatch(
      /different/i
    );
  });

  it('refuses a closed source', () => {
    expect(
      checkTransferAccounts(acc('a', 'CHF', 'CLOSED'), acc('b', 'CHF'))
    ).toMatch(/source.*closed/i);
  });

  it('refuses a closed target', () => {
    expect(
      checkTransferAccounts(acc('a', 'CHF'), acc('b', 'CHF', 'CLOSED'))
    ).toMatch(/target.*closed/i);
  });
});

describe('isSameCurrencyTransfer', () => {
  it('is true for equal currencies, false otherwise', () => {
    expect(isSameCurrencyTransfer(acc('a', 'CHF'), acc('b', 'CHF'))).toBe(true);
    expect(isSameCurrencyTransfer(acc('a', 'CHF'), acc('b', 'EUR'))).toBe(
      false
    );
  });
});

describe('settleSameCurrencyTransfer', () => {
  it('receives exactly what was sent, rate 1, no fee', () => {
    expect(settleSameCurrencyTransfer(1000)).toEqual({
      rateEstimated: 1,
      rateEffective: 1,
      amountReceived: 1000,
      fees: 0,
    });
  });

  it('keeps cents untouched', () => {
    expect(settleSameCurrencyTransfer(12.34).amountReceived).toBe(12.34);
  });
});
