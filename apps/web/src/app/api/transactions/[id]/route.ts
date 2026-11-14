import { transactionsController } from '@/server/transactions/transactions.controller';
import { NextResponse } from 'next/server';

type Context = { params: Promise<{ id: string }> };

export const GET = async (
  _request: Request,
  { params }: Context
): Promise<NextResponse> => transactionsController.findOne((await params).id);

export const PATCH = async (
  request: Request,
  { params }: Context
): Promise<NextResponse> =>
  transactionsController.update(request, (await params).id);

export const DELETE = async (
  _request: Request,
  { params }: Context
): Promise<NextResponse> => transactionsController.remove((await params).id);
