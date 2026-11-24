/**
 * Account Close API Route
 *
 * POST /api/accounts/{id}/close - Close an account (soft delete: status CLOSED + closedAt)
 */

import { accountsController } from '@/server/accounts/accounts.controller';

export const POST = (
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> => params.then(({ id }) => accountsController.close(id));
