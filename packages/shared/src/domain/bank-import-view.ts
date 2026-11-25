/**
 * Pure helpers of the bank import screen: statement months, merchant →
 * category mapping (persisted by the client) and the snapshot body of a
 * statement balance. No I/O.
 *
 * @packageDocumentation
 */
import { UNCATEGORIZED } from './bank-import';
import type { BankStatement, ImportedRow } from './bank-import';
import type { CreateSnapshotInput } from '../schemas/snapshot';

const MONTH_LENGTH = 7;

/** Months (`YYYY-MM`, by real `date`) holding at least one debit, newest first. */
export function listStatementMonths(rows: ImportedRow[]): string[] {
  const months = new Set<string>();
  for (const row of rows) {
    if (row.amount < 0) months.add(row.date.slice(0, MONTH_LENGTH));
  }
  return [...months].sort((a, b) => b.localeCompare(a));
}

/** Persisted mapping → record; corrupt payload or non-string values degrade. */
export function parseMerchantMapping(
  raw: string | null
): Record<string, string> {
  if (raw === null) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return {};
    }
    const result: Record<string, string> = {};
    for (const [merchant, category] of Object.entries(parsed)) {
      if (typeof category === 'string') result[merchant] = category;
    }
    return result;
  } catch {
    return {};
  }
}

/** Mapping → JSON for persistence. */
export function serializeMerchantMapping(
  mapping: Readonly<Record<string, string>>
): string {
  return JSON.stringify(mapping);
}

/** New mapping with the merchant set; `''` or `UNCATEGORIZED` removes it. */
export function setMerchantCategory(
  mapping: Readonly<Record<string, string>>,
  merchant: string,
  category: string
): Record<string, string> {
  const rest = Object.fromEntries(
    Object.entries(mapping).filter(([key]) => key !== merchant)
  );
  if (category === '' || category === UNCATEGORIZED) return rest;
  return { ...rest, [merchant]: category };
}

/** Snapshot body anchoring an account on the statement banner balance. */
export function buildStatementSnapshot(
  statement: BankStatement,
  accountId: string
): CreateSnapshotInput {
  return {
    accountId,
    // Noon UTC: a bare date is parsed as local midnight and lands on the day before.
    date: `${statement.balanceDate}T12:00:00.000Z`,
    balance: statement.balance,
    note: `Relevé BNP ${statement.accountSuffix}`,
  };
}
