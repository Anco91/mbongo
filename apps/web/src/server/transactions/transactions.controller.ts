import { NextResponse } from 'next/server';
import {
  transactionQuerySchema,
  createTransactionSchema,
  updateTransactionSchema,
} from '@mbongo/shared';
import {
  parseBody,
  parseQuery,
  toErrorResponse,
  toSuccessResponse,
  toCreatedResponse,
  toNoContentResponse,
} from '@/server/common/http';
import {
  TransactionService,
  transactionService,
} from './transaction.service';

export class TransactionsController {
  constructor(private readonly transactions: TransactionService) {}

  async find(request: Request): Promise<NextResponse> {
    try {
      const query = parseQuery(request, transactionQuerySchema);
      const data = await this.transactions.findMany(query);
      return toSuccessResponse(data);
    } catch (error) {
      return toErrorResponse(error);
    }
  }

  async create(request: Request): Promise<NextResponse> {
    try {
      const input = await parseBody(request, createTransactionSchema);
      const data = await this.transactions.create(input);
      return toCreatedResponse(data);
    } catch (error) {
      return toErrorResponse(error);
    }
  }

  async findOne(id: string): Promise<NextResponse> {
    try {
      const data = await this.transactions.findOne(id);
      return toSuccessResponse(data);
    } catch (error) {
      return toErrorResponse(error);
    }
  }

  async update(request: Request, id: string): Promise<NextResponse> {
    try {
      const input = await parseBody(request, updateTransactionSchema);
      const data = await this.transactions.update(id, input);
      return toSuccessResponse(data);
    } catch (error) {
      return toErrorResponse(error);
    }
  }

  async remove(id: string): Promise<NextResponse> {
    try {
      await this.transactions.remove(id);
      return toNoContentResponse();
    } catch (error) {
      return toErrorResponse(error);
    }
  }
}

const globalForTransactionsController = globalThis as unknown as {
  transactionsController?: TransactionsController;
};

export const transactionsController =
  globalForTransactionsController.transactionsController ??
  new TransactionsController(transactionService);

if (process.env.NODE_ENV !== 'production') {
  globalForTransactionsController.transactionsController =
    transactionsController;
}
