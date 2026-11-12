import type {
  Transfer,
  TransferQuery,
  CreateTransferInput,
  UpdateTransferInput,
} from '../schemas/transfer';

export interface TransferHttp {
  findMany(query?: TransferQuery): Promise<Transfer[]>;
  findOne(id: string): Promise<Transfer>;
  create(input: CreateTransferInput): Promise<Transfer>;
  completeTransfer(id: string, input: UpdateTransferInput): Promise<Transfer>;
}
