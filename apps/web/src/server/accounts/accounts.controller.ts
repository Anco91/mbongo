import { NextResponse } from 'next/server';
import {
  accountQuerySchema,
  createAccountSchema,
  updateAccountSchema,
} from '@mbongo/shared';
import {
  parseBody,
  parseQuery,
  toErrorResponse,
  toSuccessResponse,
  toCreatedResponse,
  toNoContentResponse,
} from '@/server/common/http';
import { AccountService, accountService } from './account.service';

export class AccountsController {
  constructor(private readonly accounts: AccountService) {}

  async find(request: Request): Promise<NextResponse> {
    try {
      const query = parseQuery(request, accountQuerySchema);
      const data = await this.accounts.findMany(query);
      return toSuccessResponse(data);
    } catch (error) {
      return toErrorResponse(error);
    }
  }

  async create(request: Request): Promise<NextResponse> {
    try {
      const input = await parseBody(request, createAccountSchema);
      const data = await this.accounts.create(input);
      return toCreatedResponse(data);
    } catch (error) {
      return toErrorResponse(error);
    }
  }

  async findOne(id: string): Promise<NextResponse> {
    try {
      const data = await this.accounts.findOne(id);
      return toSuccessResponse(data);
    } catch (error) {
      return toErrorResponse(error);
    }
  }

  async update(request: Request, id: string): Promise<NextResponse> {
    try {
      const input = await parseBody(request, updateAccountSchema);
      const data = await this.accounts.update(id, input);
      return toSuccessResponse(data);
    } catch (error) {
      return toErrorResponse(error);
    }
  }

  async close(id: string): Promise<NextResponse> {
    try {
      const data = await this.accounts.close(id);
      return toSuccessResponse(data);
    } catch (error) {
      return toErrorResponse(error);
    }
  }

  async remove(id: string): Promise<NextResponse> {
    try {
      await this.accounts.remove(id);
      return toNoContentResponse();
    } catch (error) {
      return toErrorResponse(error);
    }
  }
}

const globalForAccountsController = globalThis as unknown as {
  accountsController?: AccountsController;
};

export const accountsController =
  globalForAccountsController.accountsController ??
  new AccountsController(accountService);

if (process.env.NODE_ENV !== 'production') {
  globalForAccountsController.accountsController = accountsController;
}
