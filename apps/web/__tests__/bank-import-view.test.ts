/**
 * Tests of the bank import screen helpers (pending-review).
 *
 * @module Tests/BankImportView
 */
import {
  UNCATEGORIZED,
  buildStatementSnapshot,
  createSnapshotSchema,
  listStatementMonths,
  parseMerchantMapping,
  serializeMerchantMapping,
  setMerchantCategory,
} from '@mbongo/shared';
import type { BankStatement, ImportedRow } from '@mbongo/shared';

function row(date: string, amount: number): ImportedRow {
  return {
    date,
    bookedDate: date,
    amount,
    label: 'X',
    bankType: 'T',
    bankSubtype: 'S',
    fingerprint: `${date}|${amount}`,
  };
}

describe('listStatementMonths', () => {
  it('lists months with a debit, newest first, ignoring credit-only months', () => {
    const rows = [
      row('2026-09-03', -5),
      row('2026-11-02', -1),
      row('2026-10-15', 100),
      row('2026-11-20', -2),
    ];
    expect(listStatementMonths(rows)).toEqual(['2026-11', '2026-09']);
  });

  it('returns an empty list without rows', () => {
    expect(listStatementMonths([])).toEqual([]);
  });
});

describe('parseMerchantMapping', () => {
  it('returns {} for null, corrupt JSON and non-objects', () => {
    expect(parseMerchantMapping(null)).toEqual({});
    expect(parseMerchantMapping('{oops')).toEqual({});
    expect(parseMerchantMapping('[1]')).toEqual({});
    expect(parseMerchantMapping('"x"')).toEqual({});
    expect(parseMerchantMapping('null')).toEqual({});
  });

  it('drops non-string values', () => {
    expect(parseMerchantMapping('{"A":"Logement","B":3,"C":null}')).toEqual({
      A: 'Logement',
    });
  });

  it('round-trips through serialize', () => {
    const mapping = { A: 'Logement' };
    expect(parseMerchantMapping(serializeMerchantMapping(mapping))).toEqual(
      mapping
    );
  });
});

describe('setMerchantCategory', () => {
  it('adds a category without mutating the input', () => {
    const base = Object.freeze({ A: 'Logement' });
    const next = setMerchantCategory(base, 'B', 'Santé');
    expect(next).toEqual({ A: 'Logement', B: 'Santé' });
    expect(base).toEqual({ A: 'Logement' });
  });

  it('removes the entry for empty or UNCATEGORIZED', () => {
    const base = Object.freeze({ A: 'Logement', B: 'Santé' });
    expect(setMerchantCategory(base, 'A', '')).toEqual({ B: 'Santé' });
    expect(setMerchantCategory(base, 'B', UNCATEGORIZED)).toEqual({
      A: 'Logement',
    });
    expect(base).toEqual({ A: 'Logement', B: 'Santé' });
  });
});

describe('buildStatementSnapshot', () => {
  it('builds a body valid against createSnapshotSchema', () => {
    const statement: BankStatement = {
      accountSuffix: '2319',
      balanceDate: '2026-11-24',
      balance: 296.6,
      rows: [],
    };
    const body = buildStatementSnapshot(statement, 'acc-1');
    expect(body).toEqual({
      accountId: 'acc-1',
      date: '2026-11-24T12:00:00.000Z',
      balance: 296.6,
      note: 'Relevé BNP 2319',
    });
    expect(createSnapshotSchema.safeParse(body).success).toBe(true);
  });
});
