/**
 * Transfers View Component
 *
 * Client-side view: each transfer shows the two phases side by side —
 * estimated (amount + dated reference rate) and completed (credited
 * amount + effective rate + fees, or "awaiting credit").
 *
 * @module Components/Transfers/TransfersView
 */

'use client';

import { useTransfers, useCompleteTransfer } from './hooks/use-transfers';
import { useAccounts } from '@/components/accounts/hooks/use-accounts';
import { counterValue, effectiveRate, transferFees } from '@mbongo/shared';
import Link from 'next/link';
import { JSX, useState } from 'react';

/**
 * TransfersView Component
 */
export function TransfersView(): JSX.Element {
  const { data: transfers = [], isLoading, error, refetch } = useTransfers();
  const { data: accounts = [] } = useAccounts();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <span>Chargement des transferts…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border border-red-300 rounded-lg bg-red-50">
        <h3 className="font-semibold text-red-700 mb-2">
          Erreur lors du chargement des transferts
        </h3>
        <p className="text-red-600 mb-4">{error.message}</p>
        <button
          onClick={() => {
            void refetch();
          }}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          Réessayer
        </button>
      </div>
    );
  }

  const accountName = (id: string): string =>
    accounts.find((account) => account.id === id)?.name ?? id;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Transferts</h1>
        <Link
          href="/transferts/nouveau"
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          Nouveau transfert
        </Link>
      </div>

      {transfers.length === 0 ? (
        <div className="p-8 text-center border border-gray-200 rounded-lg">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Aucun transfert
          </h3>
          <p className="text-gray-600 mb-6">
            Enregistrez un premier envoi CHF → EUR pour suivre les deux phases.
          </p>
          <Link
            href="/transferts/nouveau"
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
          >
            Créer un transfert
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {transfers.map((transfer) => (
            <li
              key={transfer.id}
              className="bg-white shadow rounded-lg p-4 border border-gray-200"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    {accountName(transfer.sourceAccountId)} →{' '}
                    {accountName(transfer.targetAccountId)}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    Envoyé le {transfer.sentAt.slice(0, 10)}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    transfer.status === 'COMPLETED'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {transfer.status === 'COMPLETED' ? 'Réalisé' : 'Estimé'}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {/* Phase 1 — estimated */}
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
                    Phase 1 · Estimé
                  </p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {formatAmount(transfer.amountSent, 'CHF')}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Taux de référence : {transfer.rateEstimated} (
                    {transfer.rateDate.slice(0, 10)})
                  </p>
                  <p className="text-xs text-gray-500">
                    Contre-valeur estimée :{' '}
                    <span className="font-medium text-gray-700">
                      {formatAmount(
                        counterValue(
                          transfer.amountSent,
                          transfer.rateEstimated
                        ),
                        'EUR'
                      )}
                    </span>
                  </p>
                </div>

                {/* Phase 2 — completed or awaiting */}
                {transfer.status === 'COMPLETED' &&
                transfer.amountReceived !== null ? (
                  <div className="rounded-lg bg-emerald-50 p-3">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-emerald-500">
                      Phase 2 · Réalisé
                    </p>
                    <p className="mt-1 text-lg font-semibold text-gray-900">
                      {formatAmount(transfer.amountReceived, 'EUR')}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Taux effectif :{' '}
                      {transfer.rateEffective ??
                        effectiveRate(
                          transfer.amountReceived,
                          transfer.amountSent
                        )}
                    </p>
                    <p className="text-xs text-gray-500">
                      Frais :{' '}
                      <span className="font-medium text-gray-700">
                        {formatAmount(
                          transfer.fees ??
                            transferFees(
                              counterValue(
                                transfer.amountSent,
                                transfer.rateEstimated
                              ),
                              transfer.amountReceived
                            ),
                          'EUR'
                        )}
                      </span>
                    </p>
                    {transfer.receivedAt && (
                      <p className="text-[11px] text-gray-400">
                        Crédité le {transfer.receivedAt.slice(0, 10)}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-gray-300 p-3">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
                      Phase 2 · Réalisé
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      En attente du crédit
                    </p>
                    <CompleteTransferForm transferId={transfer.id} />
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Local phase-2 form: record the credited EUR amount and its date.
 */
function CompleteTransferForm({
  transferId,
}: {
  transferId: string;
}): JSX.Element {
  const { mutate: complete, isPending, error } = useCompleteTransfer();
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const onSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const amountReceived = Number(amount);
    if (!amountReceived || amountReceived <= 0) return;
    complete({ id: transferId, input: { amountReceived, receivedAt: date } });
  };

  return (
    <form onSubmit={onSubmit} className="mt-3 space-y-2" noValidate>
      <div className="flex gap-2">
        <input
          type="number"
          step="0.01"
          min="0"
          required
          value={amount}
          onChange={(event) => {
            setAmount(event.target.value);
          }}
          placeholder="Montant EUR crédité"
          aria-label="Montant EUR crédité"
          className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:border-indigo-400 focus:outline-none"
        />
        <input
          type="date"
          required
          value={date}
          onChange={(event) => {
            setDate(event.target.value);
          }}
          aria-label="Date de réception"
          className="w-40 rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:border-indigo-400 focus:outline-none"
        />
      </div>
      {error && <p className="text-xs text-red-600">{error.message}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="w-full px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
      >
        {isPending ? 'Enregistrement…' : 'Enregistrer le crédit'}
      </button>
    </form>
  );
}

/**
 * Format amount with currency
 */
function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat('fr-CH', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
