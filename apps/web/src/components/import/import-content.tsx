/**
 * Import Content Component
 *
 * Reads a BNP CSV in the browser (never uploaded or logged), analyses a
 * month of spending and offers the statement snapshot.
 *
 * @module Components/Import/ImportContent
 */

'use client';

import { useMemo, useState, type JSX } from 'react';
import {
  analyzeSpending,
  listStatementMonths,
  parseBnpCsv,
  type BankStatement,
} from '@mbongo/shared';
import { useMerchantMapping } from '@/hooks/use-merchant-categories';
import { EmptyState } from '@/components/patterns/async-state';
import { formatAmount } from '@/lib/format';
import { MerchantCategoryRow } from '@/components/import/merchant-category-row';
import { StatementSnapshotPanel } from '@/components/import/statement-snapshot-panel';

const FILE_ENCODING = 'windows-1252';

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Lecture du fichier impossible'));
    reader.readAsText(file, FILE_ENCODING);
  });
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Fichier illisible';
}

export function ImportContent(): JSX.Element {
  const mapping = useMerchantMapping();
  const [statement, setStatement] = useState<BankStatement | null>(null);
  const [month, setMonth] = useState('');
  const [error, setError] = useState<string | null>(null);

  const months = useMemo(
    () => (statement ? listStatementMonths(statement.rows) : []),
    [statement]
  );
  const activeMonth = months.includes(month) ? month : (months[0] ?? '');
  const analysis = useMemo(
    () =>
      statement && activeMonth
        ? analyzeSpending(statement.rows, activeMonth, mapping)
        : null,
    [statement, activeMonth, mapping]
  );

  const onFile = async (file: File | undefined): Promise<void> => {
    if (!file) return;
    try {
      setStatement(parseBnpCsv(await readFile(file)));
      setError(null);
      setMonth('');
    } catch (e) {
      setStatement(null);
      setError(errorMessage(e));
    }
  };

  return (
    <div className="space-y-3">
      <label className="block space-y-1 text-sm text-slate-700">
        <span>Relevé BNP (CSV, lu dans le navigateur)</span>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(event) => void onFile(event.target.files?.[0])}
          className="block w-full text-sm"
        />
      </label>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      {statement && months.length === 0 && (
        <EmptyState>Aucune dépense dans ce relevé</EmptyState>
      )}
      {statement && analysis && (
        <>
          <select
            aria-label="Mois"
            value={activeMonth}
            onChange={(event) => setMonth(event.target.value)}
            className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
          >
            {months.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <p className="text-sm font-semibold text-slate-800">
            Dépenses : {formatAmount(analysis.total, 'EUR')}
          </p>
          <ul className="divide-y divide-slate-100">
            {analysis.byCategory.map((c) => (
              <li
                key={c.category}
                className="flex justify-between py-1.5 text-sm"
              >
                <span>{c.category}</span>
                <span>{formatAmount(c.total, 'EUR')}</span>
              </li>
            ))}
          </ul>
          <ul className="divide-y divide-slate-100">
            {analysis.byMerchant.map((m) => (
              <MerchantCategoryRow key={m.merchant} {...m} />
            ))}
          </ul>
        </>
      )}
      {statement && (
        <StatementSnapshotPanel
          key={`${statement.accountSuffix}-${statement.balanceDate}`}
          statement={statement}
        />
      )}
    </div>
  );
}
