/**
 * Use Month Start Balances Hooks
 *
 * @module Hooks/UseMonthStartBalances
 */

'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from '@tanstack/react-query';
import type {
  MonthStartBalance,
  SaveMonthStartBalancesInput,
} from '@mbongo/shared';
import { monthStartBalancesRepository } from '@/repositories/month-start-balances.repository';
import { monthStartBalanceQueries } from '@/queries/month-start-balances';

export function useMonthStartBalances(
  month: string
): UseQueryResult<MonthStartBalance[], Error> {
  return useQuery(monthStartBalanceQueries.byMonth(month));
}

interface SaveVariables {
  month: string;
  input: SaveMonthStartBalancesInput;
}

export function useSaveMonthStartBalances(): UseMutationResult<
  MonthStartBalance[],
  Error,
  SaveVariables
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ month, input }) =>
      monthStartBalancesRepository.save(month, input),
    onSuccess: (_, { month }) => {
      void queryClient.invalidateQueries({
        queryKey: monthStartBalanceQueries.byMonth(month).queryKey,
      });
    },
  });
}
