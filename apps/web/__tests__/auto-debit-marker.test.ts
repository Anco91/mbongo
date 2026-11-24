/**
 * Locked tests for the auto-debit marker: the reserved note can never be
 * typed by a user, so a real transaction is never mistaken for the debit
 * booked by a manual payment tick (and deleted on un-tick).
 *
 * @module Tests/Payments/AutoDebitMarker
 */
import {
  AUTO_DEBIT_NOTE,
  createTransactionSchema,
  updateTransactionSchema,
} from '@mbongo/shared';

const valid = {
  accountId: 'acc',
  date: '2026-11-05',
  amount: -50,
  category: null,
};

describe('reserved auto-debit note', () => {
  it('is rejected on creation of a user transaction', () => {
    const result = createTransactionSchema.safeParse({
      ...valid,
      note: AUTO_DEBIT_NOTE,
    });
    expect(result.success).toBe(false);
  });

  it('is rejected on update of a user transaction', () => {
    expect(
      updateTransactionSchema.safeParse({ note: AUTO_DEBIT_NOTE }).success
    ).toBe(false);
  });

  it('is rejected even with surrounding whitespace', () => {
    expect(
      createTransactionSchema.safeParse({
        ...valid,
        note: `  ${AUTO_DEBIT_NOTE} `,
      }).success
    ).toBe(false);
  });

  it('still accepts ordinary notes, null and absence', () => {
    expect(
      createTransactionSchema.safeParse({ ...valid, note: 'Loyer' }).success
    ).toBe(true);
    expect(
      createTransactionSchema.safeParse({ ...valid, note: null }).success
    ).toBe(true);
    expect(createTransactionSchema.safeParse(valid).success).toBe(true);
    expect(updateTransactionSchema.safeParse({}).success).toBe(true);
  });
});
