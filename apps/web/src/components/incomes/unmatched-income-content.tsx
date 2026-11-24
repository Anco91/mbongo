/**
 * Unmatched Income Content Component
 *
 * Lists positive transactions without income source, each with its
 * proposals (see UnmatchedIncomeRow).
 *
 * @module Components/Incomes/UnmatchedIncomeContent
 */

'use client';

import { type JSX } from 'react';
import { useUnmatchedIncome } from '@/hooks/use-incomes';
import { EmptyState, ErrorPanel } from '@/components/patterns/async-state';
import { LoadingState } from '@/components/patterns/async-state';
import { Button } from '@/components/ui/button';
import { UnmatchedIncomeRow } from '@/components/incomes/unmatched-income-row';

export function UnmatchedIncomeContent(): JSX.Element {
  const {
    items,
    incomes,
    isLoading,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useUnmatchedIncome();

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <ErrorPanel
        title="Impossible de charger les revenus à lier"
        message={error.message}
      />
    );
  }

  if (items.length === 0 && !hasNextPage) {
    return <EmptyState>Aucun revenu à lier</EmptyState>;
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <UnmatchedIncomeRow
          key={item.transactionId}
          item={item}
          incomes={incomes}
        />
      ))}
      {hasNextPage && (
        <Button
          variant="outline"
          className="w-full"
          disabled={isFetchingNextPage}
          onClick={fetchNextPage}
        >
          Afficher plus
        </Button>
      )}
    </div>
  );
}
