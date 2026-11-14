import { NextResponse } from 'next/server';
import {
  createPaymentRequestSchema,
  paymentQuerySchema,
  reconcilePaymentSchema,
  updatePaymentSchema,
} from '@mbongo/shared';
import {
  parseBody,
  parseQuery,
  toCreatedResponse,
  toErrorResponse,
  toNoContentResponse,
  toSuccessResponse,
} from '@/server/common/http';
import { PaymentService, paymentService } from './payment.service';

export class PaymentsController {
  constructor(private readonly payments: PaymentService) {}

  async find(request: Request): Promise<NextResponse> {
    try {
      return toSuccessResponse(
        await this.payments.findMany(parseQuery(request, paymentQuerySchema))
      );
    } catch (error) {
      return toErrorResponse(error);
    }
  }

  async findOne(id: string): Promise<NextResponse> {
    try {
      return toSuccessResponse(await this.payments.findOne(id));
    } catch (error) {
      return toErrorResponse(error);
    }
  }

  async create(request: Request): Promise<NextResponse> {
    try {
      const input = await parseBody(request, createPaymentRequestSchema);
      const payment = Array.isArray(input)
        ? this.payments.createMany(input)
        : this.payments.create(input);
      return toCreatedResponse(await payment);
    } catch (error) {
      return toErrorResponse(error);
    }
  }

  async update(request: Request, id: string): Promise<NextResponse> {
    try {
      const input = await parseBody(request, updatePaymentSchema);
      return toSuccessResponse(await this.payments.update(id, input));
    } catch (error) {
      return toErrorResponse(error);
    }
  }

  async remove(id: string): Promise<NextResponse> {
    try {
      await this.payments.remove(id);
      return toNoContentResponse();
    } catch (error) {
      return toErrorResponse(error);
    }
  }

  /** Rapproche une échéance d'une transaction (M2, spec payment-schedule). */
  async reconcile(request: Request, id: string): Promise<NextResponse> {
    try {
      const input = await parseBody(request, reconcilePaymentSchema);
      return toSuccessResponse(
        await this.payments.reconcile(id, input.transactionId)
      );
    } catch (error) {
      return toErrorResponse(error);
    }
  }

  /** Dérapproche une échéance (retour PENDING). */
  async unlink(_request: Request, id: string): Promise<NextResponse> {
    try {
      return toSuccessResponse(await this.payments.unlink(id));
    } catch (error) {
      return toErrorResponse(error);
    }
  }
}

const globalForPaymentsController = globalThis as {
  paymentsController?: PaymentsController;
};
export const paymentsController =
  globalForPaymentsController.paymentsController ??
  new PaymentsController(paymentService);

if (process.env.NODE_ENV !== 'production') {
  globalForPaymentsController.paymentsController = paymentsController;
}
