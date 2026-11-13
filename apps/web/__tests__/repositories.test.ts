/**
 * Tests for the typed front repositories.
 *
 * Mocks global fetch; verifies response parsing through the shared zod
 * schemas and HTTP error propagation.
 *
 * @module Tests/Repositories
 * @jest-environment node
 */
import {
  transactionsRepository,
  accountsRepository,
  membersRepository,
  snapshotsRepository,
  transfersRepository,
} from '@/repositories/index';

const now = '2026-11-12T00:00:00.000Z';

const fetchMock = jest.fn();

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

beforeEach(() => {
  global.fetch = fetchMock as unknown as typeof fetch;
  fetchMock.mockReset();
});

describe('membersRepository', () => {
  it('parses the members list', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        data: [
          {
            id: 'member-anco-0001',
            firstName: 'Anco',
            role: 'PRIMARY',
            createdAt: '2026-11-08T16:17:08.889Z',
            updatedAt: '2026-11-08T16:17:08.889Z',
          },
        ],
        success: true,
      })
    );

    const members = await membersRepository.findMany();

    expect(members).toHaveLength(1);
    expect(members[0].firstName).toBe('Anco');
  });

  it('rejects an invalid member payload', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ data: [{ id: 'x', role: 'PRIMARY' }], success: true })
    );

    await expect(membersRepository.findMany()).rejects.toThrow();
  });
});

describe('accountsRepository', () => {
  const account = {
    id: 'account-ubs-courant',
    name: 'UBS Courant',
    currency: 'CHF',
    accountType: 'CURRENT',
    memberId: 'member-anco-0001',
    overdraftLimit: 1000,
    deferredCard: false,
    billingDay: null,
    openingBalance: 0,
    status: 'ACTIVE',
    closedAt: null,
    createdAt: '2026-11-08T16:17:08.889Z',
    updatedAt: '2026-11-08T16:17:08.889Z',
  };

  it('parses the accounts list', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ data: [account], success: true })
    );

    const accounts = await accountsRepository.findMany();

    expect(accounts[0].name).toBe('UBS Courant');
  });

  it('propagates HTTP errors (422 unknown member)', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ error: { message: 'Unknown member: nope' } }, 422)
    );

    await expect(
      accountsRepository.create({
        name: 'X',
        currency: 'CHF',
        accountType: 'CURRENT',
        memberId: 'nope',
      })
    ).rejects.toThrow();
  });
});

describe('transfersRepository', () => {
  const transfer = {
    id: 'transfer-1',
    sourceAccountId: 'account-ubs-courant',
    targetAccountId: 'account-bnp-perso',
    amountSent: 1500,
    rateEstimated: 1.0634,
    rateDate: '2026-11-12',
    amountReceived: null,
    rateEffective: null,
    fees: null,
    memo: null,
    status: 'ESTIMATED',
    sentAt: '2026-11-12',
    receivedAt: null,
    createdAt: '2026-11-12T00:00:00.000Z',
    updatedAt: '2026-11-12T00:00:00.000Z',
  };

  it('parses the transfers list', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ data: [transfer], success: true })
    );

    const transfers = await transfersRepository.findMany();

    expect(transfers[0].status).toBe('ESTIMATED');
  });

  it('rejects an invalid transfer payload', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ data: [{ ...transfer, status: 'NOPE' }], success: true })
    );

    await expect(transfersRepository.findMany()).rejects.toThrow();
  });
});

describe('snapshotsRepository', () => {
  it('parses a created snapshot', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        data: {
          id: 'snapshot-1',
          accountId: 'account-ubs-courant',
          date: '2026-11-12',
          balance: 4230.5,
          note: null,
          createdAt: '2026-11-12T00:00:00.000Z',
          updatedAt: '2026-11-12T00:00:00.000Z',
        },
        success: true,
      })
    );

    const snapshot = await snapshotsRepository.create({
      accountId: 'account-ubs-courant',
      date: '2026-11-12',
      balance: 4230.5,
      note: null,
    });

    expect(snapshot.balance).toBe(4230.5);
  });

  it('lists snapshots (GET /snapshots)', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        data: [
          {
            id: 'snapshot-1',
            accountId: 'account-ubs-courant',
            date: '2026-11-12',
            balance: 4230.5,
            note: null,
            createdAt: '2026-11-12T00:00:00.000Z',
            updatedAt: '2026-11-12T00:00:00.000Z',
          },
        ],
        success: true,
      })
    );

    const rows = await snapshotsRepository.findMany();

    expect(rows).toHaveLength(1);
    expect(rows[0].balance).toBe(4230.5);
  });
});

describe('accountsRepository — mutations', () => {
  const account = {
    id: 'account-1',
    name: 'UBS Courant',
    bank: 'UBS',
    currency: 'CHF',
    accountType: 'CURRENT',
    memberId: null,
    overdraftLimit: 0,
    deferredCard: false,
    billingDay: null,
    openingBalance: 0,
    status: 'ACTIVE',
    closedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  it('updates an account (PATCH /accounts/:id)', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: account, success: true }));

    const updated = await accountsRepository.update('account-1', {
      name: 'UBS Courant renommé',
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/accounts/account-1');
    expect(init.method).toBe('PATCH');
    expect(updated.name).toBe('UBS Courant');
  });

  it('closes an account (POST /accounts/:id/close)', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: account, success: true }));

    await accountsRepository.close('account-1');

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/accounts/account-1/close');
    expect(init.method).toBe('POST');
  });

  it('removes an account (DELETE /accounts/:id)', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: null, success: true }));

    await accountsRepository.remove('account-1');

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/accounts/account-1');
    expect(init.method).toBe('DELETE');
  });

  it('finds one account (GET /accounts/:id)', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: account, success: true }));

    const found = await accountsRepository.findOne('account-1');

    expect(found.id).toBe('account-1');
  });
});

describe('snapshotsRepository — findOne', () => {
  it('parses a single snapshot (GET /snapshots/:id)', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        data: {
          id: 'snapshot-1',
          accountId: 'account-ubs-courant',
          date: '2026-11-12',
          balance: 4230.5,
          note: null,
          createdAt: now,
          updatedAt: now,
        },
        success: true,
      })
    );

    const snapshot = await snapshotsRepository.findOne('snapshot-1');

    expect(snapshot.id).toBe('snapshot-1');
  });
});

describe('transactionsRepository', () => {
  const transaction = {
    id: 'tx-1',
    accountId: 'account-ubs-courant',
    date: '2026-11-12',
    amount: -42.5,
    category: null,
    note: null,
    transferId: null,
    transferRole: null,
    createdAt: now,
    updatedAt: now,
  };

  it('lists transactions (GET /transactions)', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ data: [transaction], success: true })
    );

    const rows = await transactionsRepository.findMany();

    expect(rows[0].amount).toBe(-42.5);
  });

  it('creates a transaction (POST /transactions)', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ data: transaction, success: true }, 201)
    );

    const created = await transactionsRepository.create({
      accountId: 'account-ubs-courant',
      date: '2026-11-12',
      amount: -42.5,
      category: null,
      note: null,
      transferId: null,
      transferRole: null,
    });

    expect(created.id).toBe('tx-1');
  });

  it('updates a transaction (PATCH /transactions/:id)', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ data: transaction, success: true })
    );

    await transactionsRepository.update('tx-1', { amount: -40 });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/transactions/tx-1');
    expect(init.method).toBe('PATCH');
  });

  it('removes a transaction (DELETE /transactions/:id)', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: null, success: true }));

    await transactionsRepository.remove('tx-1');

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/transactions/tx-1');
    expect(init.method).toBe('DELETE');
  });
});

describe('transfersRepository — findOne', () => {
  it('parses a single transfer (GET /transfers/:id)', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        data: {
          id: 'transfer-9',
          sourceAccountId: 'account-ubs-courant',
          targetAccountId: 'account-bnp-perso',
          amountSent: 1500,
          rateEstimated: 1.0634,
          rateDate: '2026-11-12',
          amountReceived: null,
          rateEffective: null,
          fees: null,
          memo: null,
          status: 'ESTIMATED',
          sentAt: '2026-11-12',
          receivedAt: null,
          createdAt: now,
          updatedAt: now,
        },
        success: true,
      })
    );

    const found = await transfersRepository.findOne('transfer-9');

    expect(found.id).toBe('transfer-9');
  });
});

describe('transactionsRepository — findOne', () => {
  it('parses a single transaction (GET /transactions/:id)', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        data: {
          id: 'tx-9',
          accountId: 'account-ubs-courant',
          date: '2026-11-12',
          amount: -42.5,
          category: null,
          note: null,
          transferId: null,
          transferRole: null,
          createdAt: now,
          updatedAt: now,
        },
        success: true,
      })
    );

    const found = await transactionsRepository.findOne('tx-9');

    expect(found.id).toBe('tx-9');
  });
});
