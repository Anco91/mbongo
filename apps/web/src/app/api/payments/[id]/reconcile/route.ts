import { paymentsController } from '@/server/payments/payments.controller';
import { NextResponse } from 'next/server';

type Context = { params: Promise<{ id: string }> };

/** POST /api/payments/{id}/reconcile — rapproche l'échéance d'une transaction. */
export const POST = async (
  request: Request,
  { params }: Context
): Promise<NextResponse> =>
  paymentsController.reconcile(request, (await params).id);
