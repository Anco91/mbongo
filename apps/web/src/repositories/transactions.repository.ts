import {
  transactionQuerySchema,
  transactionSchema,
  createTransactionSchema,
  updateTransactionSchema,
  type Transaction,
  type TransactionHttp,
  type TransactionQuery,
  type CreateTransactionInput,
  type UpdateTransactionInput,
} from '@mbongo/shared';
import { request } from '@/lib/api';
import { z } from 'zod';

export const transactionsRepository: TransactionHttp = {
  async findMany(query: TransactionQuery = {}): Promise<Transaction[]> {
    const transactions = await request<Transaction[]>('GET', '/transactions', {
      params: transactionQuerySchema.parse(query),
    });
    return z.array(transactionSchema).parse(transactions);
  },

  async findOne(id: string): Promise<Transaction> {
    return transactionSchema.parse(await request('GET', `/transactions/${id}`));
  },

  async create(input: CreateTransactionInput): Promise<Transaction> {
    const body = createTransactionSchema.parse(input);
    return transactionSchema.parse(
      await request('POST', '/transactions', { body })
    );
  },

  async update(
    id: string,
    input: UpdateTransactionInput
  ): Promise<Transaction> {
    const body = updateTransactionSchema.parse(input);
    return transactionSchema.parse(
      await request('PATCH', `/transactions/${id}`, { body })
    );
  },

  async remove(id: string): Promise<void> {
    await request<void>('DELETE', `/transactions/${id}`);
  },
};
