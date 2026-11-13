import {
  transferQuerySchema,
  transferSchema,
  createTransferSchema,
  updateTransferSchema,
  type Transfer,
  type TransferHttp,
  type TransferQuery,
  type CreateTransferInput,
  type UpdateTransferInput,
} from '@mbongo/shared';
import { request } from '@/lib/api';
import { z } from 'zod';

export const transfersRepository: TransferHttp = {
  async findMany(query: TransferQuery = {}): Promise<Transfer[]> {
    const transfers = await request<Transfer[]>('GET', '/transfers', {
      params: transferQuerySchema.parse(query),
    });
    return z.array(transferSchema).parse(transfers);
  },

  async findOne(id: string): Promise<Transfer> {
    return transferSchema.parse(await request('GET', `/transfers/${id}`));
  },

  async create(input: CreateTransferInput): Promise<Transfer> {
    const body = createTransferSchema.parse(input);
    return transferSchema.parse(await request('POST', '/transfers', { body }));
  },

  async completeTransfer(
    id: string,
    input: UpdateTransferInput
  ): Promise<Transfer> {
    const body = updateTransferSchema.parse(input);
    return transferSchema.parse(
      await request('PATCH', `/transfers/${id}`, { body })
    );
  },
};
