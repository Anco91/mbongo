import { NextResponse } from 'next/server';
import {
  transferQuerySchema,
  createTransferSchema,
  updateTransferSchema,
} from '@mbongo/shared';
import {
  parseBody,
  parseQuery,
  toErrorResponse,
  toSuccessResponse,
  toCreatedResponse,
} from '@/server/common/http';
import { TransferService, transferService } from './transfer.service';

export class TransfersController {
  constructor(private readonly transfers: TransferService) {}

  async find(request: Request): Promise<NextResponse> {
    try {
      const query = parseQuery(request, transferQuerySchema);
      const data = await this.transfers.findMany(query);
      return toSuccessResponse(data);
    } catch (error) {
      return toErrorResponse(error);
    }
  }

  async create(request: Request): Promise<NextResponse> {
    try {
      const input = await parseBody(request, createTransferSchema);
      const data = await this.transfers.create(input);
      return toCreatedResponse(data);
    } catch (error) {
      return toErrorResponse(error);
    }
  }

  async findOne(id: string): Promise<NextResponse> {
    try {
      const data = await this.transfers.findOne(id);
      return toSuccessResponse(data);
    } catch (error) {
      return toErrorResponse(error);
    }
  }

  // Phase 2 — complete the transfer
  async update(request: Request, id: string): Promise<NextResponse> {
    try {
      const input = await parseBody(request, updateTransferSchema);
      const data = await this.transfers.update(id, input);
      return toSuccessResponse(data);
    } catch (error) {
      return toErrorResponse(error);
    }
  }
}

const globalForTransfersController = globalThis as unknown as {
  transfersController?: TransfersController;
};

export const transfersController =
  globalForTransfersController.transfersController ??
  new TransfersController(transferService);

if (process.env.NODE_ENV !== 'production') {
  globalForTransfersController.transfersController = transfersController;
}
