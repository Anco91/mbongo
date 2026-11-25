/**
 * Bank statement import core (BNP CSV) — parse, fingerprint, dedupe and
 * month spending analysis. Pure, no Prisma/HTTP/file access: the caller
 * passes the decoded text.
 *
 * @packageDocumentation
 */

/** Category label for a spend with no known merchant mapping. */
export const UNCATEGORIZED = 'À catégoriser';

/** One statement line. `date` is the real day, `bookedDate` the bank day. */
export interface ImportedRow {
  date: string;
  bookedDate: string;
  amount: number;
  label: string;
  bankType: string;
  bankSubtype: string;
  fingerprint: string;
}

/** Parsed statement: banner anchor plus rows in file order. */
export interface BankStatement {
  accountSuffix: string;
  balanceDate: string;
  balance: number;
  rows: ImportedRow[];
}

/** Spending of one month. Totals are positive, cent-rounded. */
export interface SpendingAnalysis {
  month: string;
  total: number;
  byCategory: Array<{ category: string; total: number }>;
  byMerchant: Array<{
    merchant: string;
    category: string;
    total: number;
    count: number;
  }>;
}

/** Stub locked with spec 36: the Executor replaces the bodies. */
export function parseBnpCsv(_text: string): BankStatement {
  throw new Error('not implemented');
}

export function extractMerchant(_row: ImportedRow): string | null {
  throw new Error('not implemented');
}

export function dedupeRows(
  _rows: ImportedRow[],
  _known: ReadonlySet<string>
): { fresh: ImportedRow[]; duplicates: ImportedRow[] } {
  throw new Error('not implemented');
}

export function analyzeSpending(
  _rows: ImportedRow[],
  _month: string,
  _merchantCategories: Readonly<Record<string, string>>
): SpendingAnalysis {
  throw new Error('not implemented');
}
