import { paymentsController } from '@/server/payments/payments.controller';
import { NextResponse } from 'next/server';

export const GET = (request: Request): Promise<NextResponse> =>
  paymentsController.find(request);
export const POST = (request: Request): Promise<NextResponse> =>
  paymentsController.create(request);
