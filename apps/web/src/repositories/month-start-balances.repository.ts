import {
  monthKeySchema,
  monthStartBalanceSchema,
  saveMonthStartBalancesSchema,
  type MonthStartBalance,
  type MonthStartBalanceHttp,
  type SaveMonthStartBalancesInput,
} from '@mbongo/shared';
import { request } from '@/lib/api';

export const monthStartBalancesRepository: MonthStartBalanceHttp = {
  async findByMonth(month: string): Promise<MonthStartBalance[]> {
    monthKeySchema.parse(month);
    const result = await request<unknown[]>(
      'GET',
      `/month-start-balances/${month}`
    );
    return monthStartBalanceSchema.array().parse(result);
  },

  async save(
    month: string,
    input: SaveMonthStartBalancesInput
  ): Promise<MonthStartBalance[]> {
    monthKeySchema.parse(month);
    const body = saveMonthStartBalancesSchema.parse(input);
    const result = await request<unknown[]>(
      'PUT',
      `/month-start-balances/${month}`,
      { body }
    );
    return monthStartBalanceSchema.array().parse(result);
  },
};
