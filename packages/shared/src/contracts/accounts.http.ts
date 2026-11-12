import type {
  Account,
  AccountQuery,
  CreateAccountInput,
  UpdateAccountInput,
} from '../schemas/account';

export interface AccountHttp {
  findMany(query?: AccountQuery): Promise<Account[]>;
  findOne(id: string): Promise<Account>;
  create(input: CreateAccountInput): Promise<Account>;
  update(id: string, input: UpdateAccountInput): Promise<Account>;
  close(id: string): Promise<Account>;
  remove(id: string): Promise<void>;
}
