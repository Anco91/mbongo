import { paymentsController } from '@/server/payments/payments.controller';
import { NextResponse } from 'next/server';

type Context = { params: Promise<{ id: string }> };

export const GET = async (
  _request: Request,
  { params }: Context
): Promise<NextResponse> => paymentsController.findOne((await params).id);

export const PATCH = async (
  request: Request,
  { params }: Context
): Promise<NextResponse> =>
  paymentsController.update(request, (await params).id);

export const DELETE = async (
  _request: Request,
  { params }: Context
): Promise<NextResponse> => paymentsController.remove((await params).id);
