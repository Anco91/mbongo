import {
  accountQuerySchema,
  accountSchema,
  createAccountSchema,
  updateAccountSchema,
  type Account,
  type AccountHttp,
  type AccountQuery,
  type CreateAccountInput,
  type UpdateAccountInput,
} from '@mbongo/shared';
import { request } from '@/lib/api';
import { z } from 'zod';

export const accountsRepository: AccountHttp = {
  async findMany(query: AccountQuery = {}): Promise<Account[]> {
    const accounts = await request<Account[]>('GET', '/accounts', {
      params: accountQuerySchema.parse(query),
    });
    return z.array(accountSchema).parse(accounts);
  },

  async findOne(id: string): Promise<Account> {
    return accountSchema.parse(await request('GET', `/accounts/${id}`));
  },

  async create(input: CreateAccountInput): Promise<Account> {
    const body = createAccountSchema.parse(input);
    return accountSchema.parse(await request('POST', '/accounts', { body }));
  },

  async update(id: string, input: UpdateAccountInput): Promise<Account> {
    const body = updateAccountSchema.parse(input);
    return accountSchema.parse(
      await request('PATCH', `/accounts/${id}`, { body })
    );
  },

  async close(id: string): Promise<Account> {
    return accountSchema.parse(await request('POST', `/accounts/${id}/close`));
  },

  async remove(id: string): Promise<void> {
    await request<void>('DELETE', `/accounts/${id}`);
  },
};
