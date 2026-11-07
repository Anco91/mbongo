import {
  chargeQuerySchema,
  chargeSchema,
  createChargeSchema,
  updateChargeSchema,
  type Charge,
  type ChargeHttp,
  type ChargeQuery,
  type CreateChargeInput,
  type UpdateChargeInput,
} from '@mbongo/shared';
import { request } from '@/lib/api';

export const chargesRepository: ChargeHttp = {
  findMany(query: ChargeQuery = {}): Promise<Charge[]> {
    return request<Charge[]>('GET', '/charges', {
      params: chargeQuerySchema.parse(query),
    });
  },

  async findOne(id: string): Promise<Charge> {
    return chargeSchema.parse(await request('GET', `/charges/${id}`));
  },

  async create(input: CreateChargeInput): Promise<Charge> {
    const body = createChargeSchema.parse(input);
    return chargeSchema.parse(await request('POST', '/charges', { body }));
  },

  async update(id: string, input: UpdateChargeInput): Promise<Charge> {
    const body = updateChargeSchema.parse(input);
    return chargeSchema.parse(
      await request('PATCH', `/charges/${id}`, { body })
    );
  },

  async remove(id: string): Promise<void> {
    await request<void>('DELETE', `/charges/${id}`);
  },
};
