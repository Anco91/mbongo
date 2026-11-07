import type {
  Charge,
  ChargeQuery,
  CreateChargeInput,
  UpdateChargeInput,
} from '../schemas/charge';

export interface ChargeHttp {
  findMany(query?: ChargeQuery): Promise<Charge[]>;
  findOne(id: string): Promise<Charge>;
  create(input: CreateChargeInput): Promise<Charge>;
  update(id: string, input: UpdateChargeInput): Promise<Charge>;
  remove(id: string): Promise<void>;
}
