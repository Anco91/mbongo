/**
 * Tests for computeSettlement — règlement d'un élément attendu
 * face aux montants réalisés (open / partial / settled / discrepancy).
 */

import { computeSettlement } from '@mbongo/shared';

describe('computeSettlement', () => {
  it('is open, with the whole expected amount as gap, when nothing is realized', () => {
    expect(computeSettlement(4400, [])).toEqual({
      status: 'open',
      expected: 4400,
      realized: 0,
      gap: -4400,
    });
  });

  it('is settled when the realized amount equals the expected one', () => {
    expect(computeSettlement(4400, [4400])).toEqual({
      status: 'settled',
      expected: 4400,
      realized: 4400,
      gap: 0,
    });
  });

  it('is partial when the realized amount is below the expected one', () => {
    expect(computeSettlement(100, [60])).toEqual({
      status: 'partial',
      expected: 100,
      realized: 60,
      gap: -40,
    });
  });

  it('is a discrepancy when the realized amount exceeds the expected one', () => {
    expect(computeSettlement(100, [112.5])).toEqual({
      status: 'discrepancy',
      expected: 100,
      realized: 112.5,
      gap: 12.5,
    });
  });

  it('sums several realized amounts', () => {
    expect(computeSettlement(100, [60, 40]).status).toBe('settled');
    expect(computeSettlement(100, [60, 30])).toMatchObject({
      status: 'partial',
      realized: 90,
      gap: -10,
    });
  });

  it('rounds the sum and the gap to cents (no float drift)', () => {
    const result = computeSettlement(0.3, [0.1, 0.2]);
    expect(result).toMatchObject({ status: 'settled', realized: 0.3, gap: 0 });
  });

  it('settles when the gap is within the tolerance, both directions', () => {
    expect(computeSettlement(100, [99.5], { tolerance: 0.5 }).status).toBe('settled');
    expect(computeSettlement(100, [100.5], { tolerance: 0.5 }).status).toBe('settled');
  });

  it('does not settle when the gap exceeds the tolerance', () => {
    expect(computeSettlement(100, [99.4], { tolerance: 0.5 }).status).toBe('partial');
    expect(computeSettlement(100, [100.6], { tolerance: 0.5 }).status).toBe('discrepancy');
  });

  it('keeps the real gap when settled within tolerance', () => {
    expect(computeSettlement(100, [99.5], { tolerance: 0.5 }).gap).toBe(-0.5);
  });

  it('stays open without realized amounts even with a tolerance covering the expected amount', () => {
    expect(computeSettlement(0.3, [], { tolerance: 1 }).status).toBe('open');
  });

  it('treats a zero realized entry as realized, not open', () => {
    expect(computeSettlement(100, [0])).toMatchObject({ status: 'partial', gap: -100 });
  });

  it('throws RangeError on a negative or non-finite amount or tolerance', () => {
    expect(() => computeSettlement(-1, [])).toThrow(RangeError);
    expect(() => computeSettlement(100, [-5])).toThrow(RangeError);
    expect(() => computeSettlement(100, [Number.NaN])).toThrow(RangeError);
    expect(() => computeSettlement(Number.POSITIVE_INFINITY, [])).toThrow(RangeError);
    expect(() => computeSettlement(100, [100], { tolerance: -0.1 })).toThrow(RangeError);
  });
});
