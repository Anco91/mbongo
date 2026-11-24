/**
 * Locked tests for transfer-leg-check (row 15): each leg is checked against
 * the Transfer record. SOURCE = -amountSent, TARGET = +amountReceived, and
 * rate/fees explain the gap between estimated and received. Legs are never
 * summed against each other (two currencies).
 *
 * @module Tests/Transfers/Legs
 */
import { checkTransferLegs } from '@mbongo/shared';

const base = {
  sourceAccountId: 'src',
  targetAccountId: 'tgt',
  amountSent: 1000,
  rateEstimated: 0.92,
  amountReceived: 915 as number | null,
  fees: 5 as number | null,
  status: 'COMPLETED' as 'ESTIMATED' | 'COMPLETED' | 'CLOSED',
};
const source = {
  accountId: 'src',
  transferRole: 'SOURCE' as const,
  amount: -1000,
};
const target = {
  accountId: 'tgt',
  transferRole: 'TARGET' as const,
  amount: 915,
};

describe('checkTransferLegs', () => {
  it('accepts a completed cross-currency transfer whose legs match', () => {
    expect(checkTransferLegs(base, [source, target])).toEqual([]);
  });

  it('accepts a completed same-currency transfer (rate 1, no fee)', () => {
    const t = { ...base, rateEstimated: 1, amountReceived: 1000, fees: 0 };
    expect(checkTransferLegs(t, [source, { ...target, amount: 1000 }])).toEqual(
      []
    );
  });

  it('accepts an estimated transfer with only its SOURCE leg', () => {
    const t = {
      ...base,
      status: 'ESTIMATED' as const,
      amountReceived: null,
      fees: null,
    };
    expect(checkTransferLegs(t, [source])).toEqual([]);
  });

  it('flags a SOURCE leg that is not -amountSent', () => {
    expect(
      checkTransferLegs(base, [{ ...source, amount: -900 }, target])
    ).toContain('SOURCE_AMOUNT');
  });

  it('flags a TARGET leg that is not +amountReceived', () => {
    expect(
      checkTransferLegs(base, [source, { ...target, amount: 920 }])
    ).toContain('TARGET_AMOUNT');
  });

  it('flags a missing SOURCE or TARGET leg on a completed transfer', () => {
    expect(checkTransferLegs(base, [target])).toContain('SOURCE_MISSING');
    expect(checkTransferLegs(base, [source])).toContain('TARGET_MISSING');
  });

  it('flags a TARGET leg on a transfer not yet received', () => {
    const t = {
      ...base,
      status: 'ESTIMATED' as const,
      amountReceived: null,
      fees: null,
    };
    expect(checkTransferLegs(t, [source, target])).toContain(
      'TARGET_UNEXPECTED'
    );
  });

  it('flags a leg on the wrong account', () => {
    expect(
      checkTransferLegs(base, [{ ...source, accountId: 'other' }, target])
    ).toContain('SOURCE_ACCOUNT');
  });

  it('flags duplicated legs', () => {
    expect(checkTransferLegs(base, [source, source, target])).toContain(
      'SOURCE_DUPLICATE'
    );
  });

  it('flags fees that do not explain estimated minus received', () => {
    // 1000 * 0.92 - 915 = 5, so fees 20 is inconsistent
    expect(
      checkTransferLegs({ ...base, fees: 20 }, [source, target])
    ).toContain('FEES_GAP');
  });

  it('tolerates rounding of one cent in the fee gap', () => {
    expect(
      checkTransferLegs({ ...base, fees: 5.01 }, [source, target])
    ).toEqual([]);
  });
});
