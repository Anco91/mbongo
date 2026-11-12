import type {
  Transaction,
  TransactionQuery,
  CreateTransactionInput,
  UpdateTransactionInput,
} from '../schemas/transaction';

export interface TransactionHttp {
  findMany(query?: TransactionQuery): Promise<Transaction[]>;
  findOne(id: string): Promise<Transaction>;
  create(input: CreateTransactionInput): Promise<Transaction>;
  update(id: string, input: UpdateTransactionInput): Promise<Transaction>;
  remove(id: string): Promise<void>;
}
