import type {
  ConfirmIncomeInput,
  CreateIncomeInput,
  Income,
  IncomeQuery,
  UpdateIncomeInput,
} from '../schemas/income';
import type { Transaction } from '../schemas/transaction';

export interface IncomeHttp {
  findMany(query?: IncomeQuery): Promise<Income[]>;
  create(input: CreateIncomeInput): Promise<Income>;
  update(id: string, input: UpdateIncomeInput): Promise<Income>;
  remove(id: string): Promise<void>;
  /** Confirme le revenu d'un mois ; upsert idempotent de la transaction. */
  confirm(id: string, input: ConfirmIncomeInput): Promise<Transaction>;
}
