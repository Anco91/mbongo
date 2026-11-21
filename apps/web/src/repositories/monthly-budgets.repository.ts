import {
  monthKeySchema,
  monthlyBudgetSchema,
  type MonthlyBudget,
  type MonthlyBudgetHttp,
} from '@mbongo/shared';
import { request } from '@/lib/api';

export const monthlyBudgetsRepository: MonthlyBudgetHttp = {
  async findOne(month: string): Promise<MonthlyBudget | null> {
    monthKeySchema.parse(month);
    const result = await request<MonthlyBudget | null>(
      'GET',
      `/monthly-budgets/${month}`
    );
    return result;
  },

  async prepare(month: string): Promise<MonthlyBudget> {
    monthKeySchema.parse(month);
    const result = await request<MonthlyBudget>(
      'PUT',
      `/monthly-budgets/${month}`,
      { body: {} }
    );
    return monthlyBudgetSchema.parse(result);
  },
};
