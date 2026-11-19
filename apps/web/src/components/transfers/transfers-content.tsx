/**
 * Transfers Content Component
 *
 * Client presentation (maquette `TransfertScreen`): one card per transfer
 * with the two phases side by side — estimated (amount + dated reference
 * rate) and completed (credited amount + effective rate + fees, or the
 * phase-2 recording form for « Estimé »).
 *
 * @module Components/Transfers/TransfersContent
 */

'use client';

import type { JSX } from 'react';
import Link from 'next/link';
import { useTransfers, useCompleteTransfer } from '@/hooks/use-transfers';
import { useAccounts } from '@/hooks/use-accounts';
import { counterValue, effectiveRate, transferFees } from '@mbongo/shared';
import { formatAmount, formatDate } from '@/lib/format';
import { ShowMoreList } from '@/components/patterns';
import { StatusBadge } from '@/components/ui';
import { LoadingState, ErrorPanel } from '@/components/patterns/async-state';
import { Form, TextInput, AmountInput } from '@/components/form';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { IconArrowRight, IconClock } from '@/components/ui/icons';

export function TransfersContent(): JSX.Element {
  const { data: transfers = [], isLoading, error, refetch } = useTransfers();
  const { data: accounts = [] } = useAccounts();

  if (isLoading) {
    return <LoadingState label="Chargement des transferts…" />;
  }

  if (error) {
    return (
      <ErrorPanel
        title="Erreur lors du chargement des transferts"
        message={error.message}
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  const accountName = (id: string): string =>
    accounts.find((account) => account.id === id)?.name ?? id;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-slate-900">
          Transferts CHF → EUR
        </h2>
        <p className="text-xs text-slate-500">
          Deux phases : estimé à l&apos;envoi, recalculé au crédit réel. Le taux
          est toujours daté, les frais jamais fondus dedans.
        </p>
      </div>

      {/* Ordre inchangé (date desc côté API) : la pagination ne révèle que la suite. */}
      <ShowMoreList
        items={transfers}
        renderItem={(transfer) => (
          <Card key={transfer.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-800">
                  {accountName(transfer.sourceAccountId)} →{' '}
                  {accountName(transfer.targetAccountId)}
                </CardTitle>
                <StatusBadge
                  status={
                    transfer.status === 'COMPLETED' ? 'Réalisé' : 'Estimé'
                  }
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <IconClock className="h-3.5 w-3.5" />{' '}
                {formatDate(transfer.sentAt)} ·{' '}
                {formatAmount(transfer.amountSent, 'CHF')} envoyés
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg bg-slate-50 p-2.5">
                  <p className="text-slate-500">Phase 1 · Estimé</p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {formatAmount(
                      counterValue(transfer.amountSent, transfer.rateEstimated),
                      'EUR'
                    )}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    taux de référence {transfer.rateEstimated} (
                    {formatDate(transfer.rateDate)})
                  </p>
                </div>
                {transfer.status === 'COMPLETED' &&
                transfer.amountReceived !== null ? (
                  <div className="rounded-lg bg-emerald-50 p-2.5">
                    <p className="text-slate-500">Phase 2 · Réalisé</p>
                    <p className="mt-1 font-semibold text-slate-800">
                      {formatAmount(transfer.amountReceived, 'EUR')}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Taux effectif :{' '}
                      {transfer.rateEffective ??
                        effectiveRate(
                          transfer.amountReceived,
                          transfer.amountSent
                        )}{' '}
                      · frais{' '}
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
                    </p>
                    {transfer.receivedAt && (
                      <p className="text-[11px] text-slate-400">
                        Crédité le {formatDate(transfer.receivedAt)}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="rounded-lg bg-slate-50 p-2.5 opacity-90">
                    <p className="text-slate-500">Phase 2 · Réalisé</p>
                    <p className="mt-1 text-[11px] italic text-slate-400">
                      En attente du crédit
                    </p>
                    <CompleteTransferForm transferId={transfer.id} />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      />

      {transfers.length === 0 && (
        <div className="rounded-lg border border-slate-200 p-8 text-center">
          <h3 className="mb-2 text-base font-semibold text-slate-800">
            Aucun transfert
          </h3>
          <p className="mb-4 text-sm text-slate-600">
            Enregistrez un premier envoi CHF → EUR pour suivre les deux phases.
          </p>
        </div>
      )}

      <Link href="/transfers/new" className="block">
        <Button variant="outline" size="lg" className="w-full">
          Nouveau transfert <IconArrowRight className="h-4 w-4" />
        </Button>
      </Link>
    </div>
  );
}

/**
 * Phase-2 mini form: record the credited EUR amount and its date,
 * on the form kit (no local styles).
 */
interface Phase2Values {
  amountReceived: number;
  receivedAt: string;
}

function CompleteTransferForm({
  transferId,
}: {
  transferId: string;
}): JSX.Element {
  const { mutate: complete, isPending, error } = useCompleteTransfer();
  const form = useForm<Phase2Values>({
    defaultValues: {
      amountReceived: 0,
      receivedAt: new Date().toISOString().slice(0, 10),
    },
  });

  // Synchronous submit (test parity with the previous inline form): the
  // mutation fires in the same tick as the submit event.
  const onSubmit = (event?: React.BaseSyntheticEvent): void => {
    event?.preventDefault();
    const { amountReceived, receivedAt } = form.getValues();
    if (!amountReceived || amountReceived <= 0) return;
    complete({ id: transferId, input: { amountReceived, receivedAt } });
  };

  return (
    <Form form={form} onSubmit={onSubmit} className="mt-3 space-y-2">
      <AmountInput name="amountReceived" label="Montant EUR crédité" />
      <TextInput name="receivedAt" label="Date de réception" type="date" />
      {error && <p className="text-xs text-red-600">{error.message}</p>}
      <Button type="submit" size="sm" className="w-full" disabled={isPending}>
        {isPending ? 'Enregistrement…' : 'Enregistrer le crédit'}
      </Button>
    </Form>
  );
}
