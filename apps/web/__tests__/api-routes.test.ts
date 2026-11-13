/**
 * API route integration tests — status code contracts.
 *
 * Route handlers are called directly (no HTTP server); the Prisma layer
 * is mocked. Covers the newly wired routes: members, accounts, transfers,
 * snapshots, plus the charge FK error contract.
 *
 * @module Tests/API/Routes
 * @jest-environment node
 */

jest.mock('@/server/db', () => ({
  prisma: {
    member: { findMany: jest.fn(), findUnique: jest.fn() },
    account: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    charge: { findMany: jest.fn(), create: jest.fn() },
    transfer: { findMany: jest.fn() },
    transaction: { findMany: jest.fn() },
    balanceSnapshot: { findMany: jest.fn(), create: jest.fn() },
    $transaction: jest.fn(),
  },
}));

import { prisma } from '@/server/db';
import { GET as getMembers } from '@/app/api/members/route';
import {
  GET as getAccounts,
  POST as postAccounts,
} from '@/app/api/accounts/route';
import { GET as getAccount } from '@/app/api/accounts/[id]/route';
import {
  GET as getCharges,
  POST as postCharges,
} from '@/app/api/charges/route';
import {
  GET as getTransfers,
  POST as postTransfers,
} from '@/app/api/transfers/route';
import {
  GET as getSnapshots,
  POST as postSnapshots,
} from '@/app/api/snapshots/route';
import { GET as getTransactions } from '@/app/api/transactions/route';

const jsonRequest = (url: string, method = 'GET', body?: unknown): Request => {
  return new Request(url, {
    method,
    ...(body !== undefined
      ? {
          body: JSON.stringify(body),
          headers: { 'content-type': 'application/json' },
        }
      : {}),
  });
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /api/members', () => {
  it('returns 200 with seeded members', async () => {
    (prisma.member.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'member-anco-0001',
        firstName: 'Anco',
        role: 'PRIMARY',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const response = await getMembers(
      jsonRequest('http://localhost/api/members')
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      data: [{ firstName: 'Anco' }],
    });
  });
});

describe('GET /api/accounts', () => {
  it('returns 200', async () => {
    (prisma.account.findMany as jest.Mock).mockResolvedValue([]);

    const response = await getAccounts(
      jsonRequest('http://localhost/api/accounts')
    );

    expect(response.status).toBe(200);
  });

  it('rejects an invalid filter value with 400', async () => {
    const response = await getAccounts(
      jsonRequest('http://localhost/api/accounts?currency=USD')
    );

    expect(response.status).toBe(400);
  });
});

describe('POST /api/accounts', () => {
  const validBody = {
    name: 'UBS Courant',
    currency: 'CHF',
    accountType: 'CURRENT',
    memberId: 'member-anco-0001',
  };

  it('rejects an unknown member with a readable 422', async () => {
    (prisma.member.findUnique as jest.Mock).mockResolvedValue(null);

    const response = await postAccounts(
      jsonRequest('http://localhost/api/accounts', 'POST', validBody)
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.objectContaining({ message: expect.any(String) }),
    });
  });

  it('rejects an invalid currency with 400', async () => {
    const response = await postAccounts(
      jsonRequest('http://localhost/api/accounts', 'POST', {
        ...validBody,
        currency: 'USD',
      })
    );

    expect(response.status).toBe(400);
  });
});

describe('GET /api/accounts/:id', () => {
  it('returns 404 for an unknown account', async () => {
    (prisma.account.findUnique as jest.Mock).mockResolvedValue(null);

    const response = await getAccount(
      jsonRequest('http://localhost/api/accounts/nope'),
      { params: Promise.resolve({ id: 'nope' }) }
    );

    expect(response.status).toBe(404);
  });
});

describe('GET /api/charges', () => {
  it('returns 200', async () => {
    (prisma.charge.findMany as jest.Mock).mockResolvedValue([]);

    const response = await getCharges(
      jsonRequest('http://localhost/api/charges')
    );

    expect(response.status).toBe(200);
  });
});

describe('POST /api/charges', () => {
  const validBody = {
    label: 'Loyer GE',
    type: 'FIXED_RECURRING',
    amount: 1850,
    currency: 'CHF',
    accountId: 'account-ubs-courant',
    category: 'Logement',
    startDate: '2026-11-01',
    endDate: null,
    frequency: 'monthly',
    installments: null,
  };

  it('rejects an unknown account with a readable 422', async () => {
    (prisma.account.findUnique as jest.Mock).mockResolvedValue(null);

    const response = await postCharges(
      jsonRequest('http://localhost/api/charges', 'POST', validBody)
    );

    expect(response.status).toBe(422);
  });

  it('rejects a missing label with 400', async () => {
    const { label: _label, ...invalid } = validBody;

    const response = await postCharges(
      jsonRequest('http://localhost/api/charges', 'POST', invalid)
    );

    expect(response.status).toBe(400);
  });
});

describe('GET /api/transfers', () => {
  it('returns 200', async () => {
    (prisma.transfer.findMany as jest.Mock).mockResolvedValue([]);

    const response = await getTransfers(
      jsonRequest('http://localhost/api/transfers')
    );

    expect(response.status).toBe(200);
  });
});

describe('POST /api/transfers', () => {
  const validBody = {
    sourceAccountId: 'account-ubs-courant',
    targetAccountId: 'account-bnp-perso',
    amountSent: 1500,
    rateEstimated: 1.0634,
    rateDate: '2026-11-12',
    sentAt: '2026-11-12',
  };

  it('rejects an unknown source account with 404', async () => {
    (prisma.account.findUnique as jest.Mock).mockResolvedValue(null);

    const response = await postTransfers(
      jsonRequest('http://localhost/api/transfers', 'POST', validBody)
    );

    expect(response.status).toBe(404);
  });

  it('rejects currency-incompatible accounts with 422', async () => {
    (prisma.account.findUnique as jest.Mock).mockImplementation(
      ({ where }: { where: { id: string } }) =>
        Promise.resolve({ id: where.id, currency: 'EUR' })
    );

    const response = await postTransfers(
      jsonRequest('http://localhost/api/transfers', 'POST', validBody)
    );

    expect(response.status).toBe(422);
  });
});

describe('GET /api/snapshots', () => {
  it('returns 200', async () => {
    (prisma.balanceSnapshot.findMany as jest.Mock).mockResolvedValue([]);

    const response = await getSnapshots(
      jsonRequest('http://localhost/api/snapshots')
    );

    expect(response.status).toBe(200);
  });
});

describe('GET /api/transactions', () => {
  it('returns 200', async () => {
    (prisma.transaction.findMany as jest.Mock).mockResolvedValue([]);

    const response = await getTransactions(
      jsonRequest('http://localhost/api/transactions')
    );

    expect(response.status).toBe(200);
  });
});

describe('POST /api/snapshots', () => {
  it('rejects an unknown account with a readable 422', async () => {
    (prisma.account.findUnique as jest.Mock).mockResolvedValue(null);

    const response = await postSnapshots(
      jsonRequest('http://localhost/api/snapshots', 'POST', {
        accountId: 'nope',
        date: '2026-11-12',
        balance: 100,
        note: null,
      })
    );

    expect(response.status).toBe(422);
  });
});
