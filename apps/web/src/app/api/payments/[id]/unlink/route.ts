import { paymentsController } from '@/server/payments/payments.controller';
import { NextResponse } from 'next/server';

type Context = { params: Promise<{ id: string }> };

/** POST /api/payments/{id}/unlink — dérapproche l'échéance (retour PENDING). */
export const POST = async (
  request: Request,
  { params }: Context
): Promise<NextResponse> =>
  paymentsController.unlink(request, (await params).id);
