/**
 * Tests for parseAmount utility function.
 */

import { parseAmount } from '@/components/patterns/editable-item';

describe('parseAmount', () => {
  it('parses valid decimal numbers', () => {
    expect(parseAmount('123.45')).toBe(123.45);
    expect(parseAmount('0')).toBe(0);
    expect(parseAmount('1000')).toBe(1000);
    expect(parseAmount('-50.25')).toBe(-50.25);
  });

  it('handles whitespace', () => {
    expect(parseAmount('  123  ')).toBe(123);
    expect(parseAmount('  ')).toBeNull();
    expect(parseAmount('\t\n')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(parseAmount('')).toBeNull();
  });

  it('returns null for non-numeric strings', () => {
    expect(parseAmount('abc')).toBeNull();
    expect(parseAmount('12abc')).toBe(12); // parseFloat stops at first non-numeric
    expect(parseAmount('NaN')).toBeNull();
  });

  it('parses numbers with leading zeros', () => {
    expect(parseAmount('007')).toBe(7);
    expect(parseAmount('0.5')).toBe(0.5);
  });

  it('parses scientific notation', () => {
    expect(parseAmount('1e2')).toBe(100);
    expect(parseAmount('1.5e3')).toBe(1500);
  });
});
