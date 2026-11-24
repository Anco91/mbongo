import {
  incomeQuerySchema,
  incomeSchema,
  createIncomeSchema,
  updateIncomeSchema,
  confirmIncomeSchema,
  linkIncomeSchema,
  type Income,
  type IncomeHttp,
  type IncomeQuery,
  type CreateIncomeInput,
  type UpdateIncomeInput,
  type ConfirmIncomeInput,
  type LinkIncomeInput,
  type Transaction,
  transactionSchema,
} from '@mbongo/shared';
import { request } from '@/lib/api';

export const incomesRepository: IncomeHttp = {
  findMany(query: IncomeQuery = {}): Promise<Income[]> {
    return request<Income[]>('GET', '/incomes', {
      params: incomeQuerySchema.parse(query),
    });
  },

  async create(input: CreateIncomeInput): Promise<Income> {
    const body = createIncomeSchema.parse(input);
    return incomeSchema.parse(await request('POST', '/incomes', { body }));
  },

  async update(id: string, input: UpdateIncomeInput): Promise<Income> {
    const body = updateIncomeSchema.parse(input);
    return incomeSchema.parse(
      await request('PATCH', `/incomes/${id}`, { body })
    );
  },

  async remove(id: string): Promise<void> {
    await request<void>('DELETE', `/incomes/${id}`);
  },

  async confirm(id: string, input: ConfirmIncomeInput): Promise<Transaction> {
    const body = confirmIncomeSchema.parse(input);
    return transactionSchema.parse(
      await request('POST', `/incomes/${id}/confirm`, { body })
    );
  },

  async link(id: string, input: LinkIncomeInput): Promise<Transaction> {
    const body = linkIncomeSchema.parse(input);
    return transactionSchema.parse(
      await request('POST', `/incomes/${id}/link`, { body })
    );
  },
};
