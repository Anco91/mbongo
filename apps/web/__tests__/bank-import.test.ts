/**
 * Locked tests for spec 36: BNP CSV parse, fingerprint, dedupe and month
 * spending analysis. Fixture lines are shaped like the real export
 * (`;`, dd/MM/yyyy, French amounts, banner on line 1, no column header).
 *
 * @module Tests/BankImport
 */
import {
  UNCATEGORIZED,
  analyzeSpending,
  dedupeRows,
  extractMerchant,
  parseBnpCsv,
} from '@mbongo/shared';
import type { ImportedRow } from '@mbongo/shared';

const BANNER =
  '"Compte de ch&egrave;ques";"Compte de ch&amp;egrave;ques";****2319;24/11/2026;;296,60';
const CARD =
  '31/10/2025;PAIEMENT CB;FACTURE CARTE;FACTURE CARTE DU 251025 APPLE.COM/BILL  CARTE   4974XXXXXXXX7145                IRL     0,39EUR;-0,39';
const CARD2 =
  '31/10/2025;PAIEMENT CB;FACTURE CARTE;FACTURE CARTE DU 071025 RDB THONON      CARTE   4974XXXXXXXX7145                FRA     1,20EUR;-1,20';
const PRLV =
  '03/11/2025;PRELEVEMENT;PRLV SEPA;PRLV SEPA HYPE FITNESS CLUB ECH/031125 ID EMETTEUR/FR84ZZZ81D5CF MDT/MDT1 REF/D1 LIB/HYPE FITNESS CLUB;-44,90';
const ATM =
  '10/11/2025;RETRAIT DISTRIBUTEUR;RETRAIT DAB;RETRAIT DAB 09/11/25 11H32 132639   BNP PARIBAS               VERRIERES LE     0004974XXXXXXXX7145;-20,00';
const BIG =
  '03/11/2026;VIREMENT INSTANTANE EMIS;VIR SEPA INST EMIS;VIR SEPA INST EMIS /MOTIF CHARGES MAISON /BEN CARLA ELONGO PAMBA /REFDO 4144AD84C08045C3AD55010214517B8B /REFBEN ZZ1LH63M85797OCZI;-1 300,00';
const SALARY =
  '29/10/2025;VIREMENT INSTANTANE RECU;VIR SEPA INST RECU;VIR SEPA INST RECU /DE MME X /REF NOT PROVIDED /MOTIF;150,00';

const csv = (...lines: string[]): string => [BANNER, ...lines].join('\n');

describe('parseBnpCsv', () => {
  it('reads the banner as the balance anchor', () => {
    const s = parseBnpCsv(csv(CARD));
    expect(s.accountSuffix).toBe('2319');
    expect(s.balanceDate).toBe('2026-11-24');
    expect(s.balance).toBe(296.6);
  });

  it('reads French amounts with a thousands space and a decimal comma', () => {
    expect(parseBnpCsv(csv(BIG)).rows[0].amount).toBe(-1300);
  });

  it('keeps debit negative and credit positive', () => {
    const rows = parseBnpCsv(csv(CARD, SALARY)).rows;
    expect(rows.map((r) => r.amount)).toEqual([-0.39, 150]);
  });

  it('takes the real day of a card line from « DU ddmmyy », keeping the booked day', () => {
    const row = parseBnpCsv(csv(CARD)).rows[0];
    expect(row.date).toBe('2025-10-25');
    expect(row.bookedDate).toBe('2025-10-31');
  });

  it('uses the booked day when the line has no card date', () => {
    const row = parseBnpCsv(csv(PRLV)).rows[0];
    expect(row.date).toBe('2025-11-03');
    expect(row.bookedDate).toBe('2025-11-03');
  });

  it('keeps bank type and subtype', () => {
    const row = parseBnpCsv(csv(ATM)).rows[0];
    expect(row.bankType).toBe('RETRAIT DISTRIBUTEUR');
    expect(row.bankSubtype).toBe('RETRAIT DAB');
  });

  it('skips blank lines and keeps file order', () => {
    const rows = parseBnpCsv(csv(CARD, '', CARD2, '')).rows;
    expect(rows).toHaveLength(2);
  });

  it('refuses a line whose amount is not a number', () => {
    const bad = '31/10/2025;PAIEMENT CB;FACTURE CARTE;X;abc';
    expect(() => parseBnpCsv(csv(bad))).toThrow(/line 2/i);
  });

  it('refuses a file without the banner', () => {
    expect(() => parseBnpCsv(CARD)).toThrow();
  });

  it('gives the same fingerprints when the same text is parsed twice', () => {
    const a = parseBnpCsv(csv(CARD, CARD2)).rows.map((r) => r.fingerprint);
    const b = parseBnpCsv(csv(CARD, CARD2)).rows.map((r) => r.fingerprint);
    expect(a).toEqual(b);
  });

  it('gives identical lines of one file distinct fingerprints (occurrence rank)', () => {
    const f = parseBnpCsv(csv(CARD, CARD)).rows.map((r) => r.fingerprint);
    expect(new Set(f).size).toBe(2);
  });

  it('keeps a line fingerprint when a new line is added before it', () => {
    const one = parseBnpCsv(csv(CARD2)).rows[0].fingerprint;
    const two = parseBnpCsv(csv(CARD, CARD2)).rows[1].fingerprint;
    expect(two).toBe(one);
  });
});

describe('dedupeRows', () => {
  it('keeps only rows whose fingerprint is unknown', () => {
    const rows = parseBnpCsv(csv(CARD, CARD2, PRLV)).rows;
    const known = new Set([rows[0].fingerprint, rows[1].fingerprint]);
    const { fresh, duplicates } = dedupeRows(rows, known);
    expect(fresh.map((r) => r.fingerprint)).toEqual([rows[2].fingerprint]);
    expect(duplicates).toHaveLength(2);
  });

  it('treats an overlapping file as idempotent', () => {
    const first = parseBnpCsv(csv(CARD, CARD2)).rows;
    const known = new Set(first.map((r) => r.fingerprint));
    const second = parseBnpCsv(csv(CARD, CARD2, PRLV)).rows;
    expect(dedupeRows(second, known).fresh).toHaveLength(1);
  });
});

describe('extractMerchant', () => {
  const row = (line: string) => parseBnpCsv(csv(line)).rows[0];

  it('reads the merchant of a card line, before the card block', () => {
    expect(extractMerchant(row(CARD))).toBe('APPLE.COM/BILL');
    expect(extractMerchant(row(CARD2))).toBe('RDB THONON');
  });

  it('reads the creditor of a SEPA direct debit, before « ECH/ »', () => {
    expect(extractMerchant(row(PRLV))).toBe('HYPE FITNESS CLUB');
  });

  it('returns null when the label carries no merchant', () => {
    expect(extractMerchant(row(ATM))).toBeNull();
  });
});

describe('analyzeSpending', () => {
  let rows: ImportedRow[] = [];
  beforeAll(() => {
    rows = parseBnpCsv(csv(CARD, CARD2, PRLV, ATM, SALARY)).rows;
  });
  const map = { 'RDB THONON': 'Restaurants', 'HYPE FITNESS CLUB': 'Sport' };

  it('counts only debits dated in the month (real day, not booked day)', () => {
    const oct = analyzeSpending(rows, '2025-10', map);
    expect(oct.total).toBe(1.59);
    expect(analyzeSpending(rows, '2025-11', map).total).toBe(64.9);
  });

  it('ignores credits', () => {
    const nov = analyzeSpending(rows, '2025-10', map);
    expect(nov.byMerchant.some((m) => m.total > 100)).toBe(false);
  });

  it('groups by mapped category and never guesses the others', () => {
    const nov = analyzeSpending(rows, '2025-11', map);
    expect(nov.byCategory).toEqual(
      [
        { category: UNCATEGORIZED, total: 20 },
        { category: 'Sport', total: 44.9 },
      ].sort((a, b) => b.total - a.total)
    );
  });

  it('lists merchants by total descending, with count and category', () => {
    const oct = analyzeSpending(rows, '2025-10', map);
    expect(oct.byMerchant).toEqual([
      { merchant: 'RDB THONON', category: 'Restaurants', total: 1.2, count: 1 },
      {
        merchant: 'APPLE.COM/BILL',
        category: UNCATEGORIZED,
        total: 0.39,
        count: 1,
      },
    ]);
  });

  it('falls back to the bank type as merchant when none is readable', () => {
    const nov = analyzeSpending(rows, '2025-11', map);
    expect(nov.byMerchant.map((m) => m.merchant)).toContain(
      'RETRAIT DISTRIBUTEUR'
    );
  });

  it('returns an empty analysis for a month without spend', () => {
    expect(analyzeSpending(rows, '2030-01', map)).toEqual({
      month: '2030-01',
      total: 0,
      byCategory: [],
      byMerchant: [],
    });
  });
});
