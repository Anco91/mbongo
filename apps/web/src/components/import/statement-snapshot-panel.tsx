/**
 * Statement Snapshot Panel
 *
 * Saves the statement banner balance as a snapshot of a chosen account,
 * then shows the statement gap of that account.
 *
 * @module Components/Import/StatementSnapshotPanel
 */

'use client';

import { useState, type JSX } from 'react';
import {
  buildStatementSnapshot,
  computeStatementGap,
  type BankStatement,
} from '@mbongo/shared';
import { useAccounts } from '@/hooks/use-accounts';
import { useTransactions } from '@/hooks/use-transactions';
import { useCreateSnapshot, useSnapshots } from '@/hooks/use-snapshots';
import { Button } from '@/components/ui/button';
import { formatAmount } from '@/lib/format';

export function StatementSnapshotPanel({
  statement,
}: {
  statement: BankStatement;
}): JSX.Element {
  const { data: accounts = [] } = useAccounts();
  const { data: transactions = [] } = useTransactions();
  const { data: snapshots = [] } = useSnapshots();
  const create = useCreateSnapshot();
  const [accountId, setAccountId] = useState('');
  const [savedId, setSavedId] = useState<string | null>(null);

  const open = accounts.filter((a) => a.status !== 'CLOSED');
  const saved = open.find((a) => a.id === savedId);
  const gap = saved
    ? computeStatementGap(saved, transactions, snapshots)
    : null;

  const save = (): void => {
    create.mutate(buildStatementSnapshot(statement, accountId), {
      onSuccess: () => setSavedId(accountId),
    });
  };

  return (
    <section className="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
      <h3 className="text-sm font-semibold text-slate-800">
        Solde du relevé : {formatAmount(statement.balance, 'EUR')} au{' '}
        {statement.balanceDate}
      </h3>
      <select
        aria-label="Compte du relevé"
        value={accountId}
        onChange={(event) => setAccountId(event.target.value)}
        className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
      >
        <option value="">Choisir un compte</option>
        {open.map((account) => (
          <option key={account.id} value={account.id}>
            {account.name}
          </option>
        ))}
      </select>
      <Button
        className="w-full"
        disabled={accountId === '' || create.isPending}
        onClick={save}
      >
        Enregistrer le solde du relevé
      </Button>
      {create.error && (
        <p role="alert" className="text-sm text-red-600">
          {create.error.message}
        </p>
      )}
      {saved && gap && (
        <p className="text-sm text-slate-700">
          Solde calculé de {saved.name} au {gap.snapshotDate} :{' '}
          {formatAmount(gap.calculated, saved.currency)} · écart{' '}
          {formatAmount(gap.gap, saved.currency)}
        </p>
      )}
    </section>
  );
}
