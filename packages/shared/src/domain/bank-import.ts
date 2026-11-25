/**
 * Bank statement import core (BNP CSV) — parse, fingerprint, dedupe and
 * month spending analysis. Pure, no Prisma/HTTP/file access: the caller
 * passes the decoded text.
 *
 * @packageDocumentation
 */
import Papa from 'papaparse';
import { format, isValid, parse } from 'date-fns';

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

const FILE_DATE = 'dd/MM/yyyy';
const ISO_DATE = 'yyyy-MM-dd';
const BANNER_MIN_FIELDS = 6;
const ROW_FIELDS = 5;
const CARD_DATE = /\bDU (\d{6}) /;
const CARD_MERCHANT = /\bDU \d{6} (.+?)\s+CARTE\b/;
const SEPA_MERCHANT = /\bPRLV SEPA (.+?) ECH\//;

const REF_DATE = new Date(2000, 0, 1);

function fail(line: number, what: string): never {
  throw new Error(`Invalid bank file at line ${line}: ${what}`);
}

/** `dd/MM/yyyy` → `yyyy-MM-dd`, or null. */
function fileDateToIso(value: string): string | null {
  const d = parse(value.trim(), FILE_DATE, REF_DATE);
  return isValid(d) ? format(d, ISO_DATE) : null;
}

/** `-1 300,00` → -1300, or null when not a number. */
function parseFrenchAmount(value: string): number | null {
  const clean = value.replace(/\s/g, '').replace(',', '.');
  if (!/^[-+]?\d+(\.\d+)?$/.test(clean)) return null;
  return toCents(Number(clean)) / 100;
}

function toCents(amount: number): number {
  return Math.round(amount * 100);
}

/** Real day of a card line from « DU ddmmyy », else null. */
function cardDate(label: string): string | null {
  const m = CARD_DATE.exec(label);
  if (!m) return null;
  const raw = m[1];
  const d = parse(
    `20${raw.slice(4)}-${raw.slice(2, 4)}-${raw.slice(0, 2)}`,
    ISO_DATE,
    REF_DATE
  );
  return isValid(d) ? format(d, ISO_DATE) : null;
}

function parseBanner(
  fields: string[]
): Pick<BankStatement, 'accountSuffix' | 'balanceDate' | 'balance'> {
  const suffix = /^\*+(\d+)$/.exec((fields[2] ?? '').trim());
  const balanceDate = fileDateToIso(fields[3] ?? '');
  const balance = parseFrenchAmount(fields[5] ?? '');
  if (
    fields.length < BANNER_MIN_FIELDS ||
    !suffix ||
    !balanceDate ||
    balance === null
  ) {
    return fail(1, 'banner missing or unreadable');
  }
  return { accountSuffix: suffix[1], balanceDate, balance };
}

/**
 * Parses a decoded BNP CSV: banner on line 1 (balance anchor), then rows
 * without header. Throws an `Error` naming `line N` (never the content).
 */
export function parseBnpCsv(text: string): BankStatement {
  const parsed = Papa.parse<string[]>(text, { delimiter: ';' });
  const lines = parsed.data;
  const banner = parseBanner(lines[0] ?? []);
  const ranks = new Map<string, number>();
  const rows: ImportedRow[] = [];
  lines.forEach((fields, index) => {
    const lineNo = index + 1;
    if (index === 0 || fields.every((f) => f.trim() === '')) return;
    if (fields.length < ROW_FIELDS) fail(lineNo, 'missing columns');
    const bookedDate = fileDateToIso(fields[0]);
    if (!bookedDate) return fail(lineNo, 'unreadable date');
    const amount = parseFrenchAmount(fields[4]);
    if (amount === null) return fail(lineNo, 'unreadable amount');
    const label = fields[3];
    const key = [
      banner.accountSuffix,
      bookedDate,
      toCents(amount),
      label.replace(/\s+/g, ' ').trim(),
    ].join('|');
    const rank = ranks.get(key) ?? 0;
    ranks.set(key, rank + 1);
    rows.push({
      date: cardDate(label) ?? bookedDate,
      bookedDate,
      amount,
      label,
      bankType: fields[1].trim(),
      bankSubtype: fields[2].trim(),
      fingerprint: `${key}|${rank}`,
    });
  });
  return { ...banner, rows };
}

/** Merchant of a card or SEPA direct-debit line, else null. */
export function extractMerchant(row: ImportedRow): string | null {
  const m = CARD_MERCHANT.exec(row.label) ?? SEPA_MERCHANT.exec(row.label);
  return m ? m[1].trim() : null;
}

/** Splits rows into unknown (`fresh`) and already imported fingerprints. */
export function dedupeRows(
  rows: ImportedRow[],
  known: ReadonlySet<string>
): { fresh: ImportedRow[]; duplicates: ImportedRow[] } {
  return {
    fresh: rows.filter((r) => !known.has(r.fingerprint)),
    duplicates: rows.filter((r) => known.has(r.fingerprint)),
  };
}

interface MerchantAcc {
  merchant: string;
  category: string;
  cents: number;
  count: number;
}

/** Debits dated in `month` (`YYYY-MM`), by category and merchant. */
export function analyzeSpending(
  rows: ImportedRow[],
  month: string,
  merchantCategories: Readonly<Record<string, string>>
): SpendingAnalysis {
  const merchants = new Map<string, MerchantAcc>();
  for (const row of rows) {
    if (row.amount >= 0 || !row.date.startsWith(month)) continue;
    const merchant = extractMerchant(row) ?? row.bankType;
    const acc = merchants.get(merchant) ?? {
      merchant,
      category: merchantCategories[merchant] ?? UNCATEGORIZED,
      cents: 0,
      count: 0,
    };
    merchants.set(merchant, {
      ...acc,
      cents: acc.cents + toCents(-row.amount),
      count: acc.count + 1,
    });
  }
  const list = [...merchants.values()].sort((a, b) => b.cents - a.cents);
  const categories = new Map<string, number>();
  list.forEach((m) =>
    categories.set(m.category, (categories.get(m.category) ?? 0) + m.cents)
  );
  return {
    month,
    total: list.reduce((sum, m) => sum + m.cents, 0) / 100,
    byCategory: [...categories.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([category, cents]) => ({ category, total: cents / 100 })),
    byMerchant: list.map((m) => ({
      merchant: m.merchant,
      category: m.category,
      total: m.cents / 100,
      count: m.count,
    })),
  };
}
