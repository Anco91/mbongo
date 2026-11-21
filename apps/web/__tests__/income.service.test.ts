/**
 * Tests for Income Service
 * @jest-environment node
 */

import { IncomeService } from '@/server/incomes/income.service';

jest.mock('@/server/db', () => ({
  prisma: {
    income: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    account: { findUnique: jest.fn() },
    transaction: {
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
  },
}));

import { prisma } from '@/server/db';

const mockedFindUnique = prisma.account.findUnique as jest.Mock;
const mockedIncomeCreate = prisma.income.create as jest.Mock;
const mockedIncomeFindMany = prisma.income.findMany as jest.Mock;
const mockedTransactionUpsert = prisma.transaction.upsert as jest.Mock;
const mockedIncomeDelete = prisma.income.delete as jest.Mock;
const incomeService = new IncomeService();

describe('IncomeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('crée une source de revenu valide', async () => {
      mockedFindUnique.mockResolvedValue({ id: 'account-1' });
      mockedIncomeCreate.mockResolvedValue({
        id: 'income-1',
        label: 'Salaire',
        amount: 4400,
        currency: 'CHF',
        accountId: 'account-1',
        memberId: null,
        frequency: 'monthly',
        startDate: new Date('2026-01-01T12:00:00.000Z'),
        endDate: null,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const income = await incomeService.create({
        label: 'Salaire',
        amount: 4400,
        currency: 'CHF',
        accountId: 'account-1',
        frequency: 'monthly',
        startDate: '2026-01-01T12:00:00.000Z',
        memberId: null,
        endDate: null,
        active: true,
      });

      expect(income.id).toBe('income-1');
      expect(income.label).toBe('Salaire');
      expect(income.amount).toBe(4400);
      expect(income.active).toBe(true);
    });

    it('échoue avec un compte inexistant', async () => {
      mockedFindUnique.mockResolvedValue(null);

      await expect(
        incomeService.create({
          label: 'Salaire',
          amount: 4400,
          currency: 'CHF',
          accountId: 'nonexistent',
          frequency: 'monthly',
          startDate: '2026-01-01T12:00:00.000Z',
          memberId: null,
          endDate: null,
          active: true,
        })
      ).rejects.toThrow();
    });
  });

  describe('findMany', () => {
    it('retourne les revenus actifs pour un mois', async () => {
      mockedIncomeFindMany.mockResolvedValue([
        {
          id: 'income-1',
          label: 'Salaire',
          amount: 4400,
          currency: 'CHF',
          accountId: 'account-1',
          memberId: null,
          frequency: 'monthly',
          startDate: new Date('2026-01-01T12:00:00.000Z'),
          endDate: null,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const incomes = await incomeService.findMany({ month: '2026-11' });
      expect(incomes).toHaveLength(1);
      expect(incomes[0].label).toBe('Salaire');
    });

    it('exclut les revenus inactifs', async () => {
      mockedIncomeFindMany.mockResolvedValue([
        {
          id: 'income-1',
          label: 'Salaire',
          amount: 4400,
          currency: 'CHF',
          accountId: 'account-1',
          memberId: null,
          frequency: 'monthly',
          startDate: new Date('2026-01-01T12:00:00.000Z'),
          endDate: null,
          active: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const incomes = await incomeService.findMany({ month: '2026-11' });
      expect(incomes).toHaveLength(0);
    });
  });

  describe('confirm', () => {
    it('crée une transaction positive pour le mois', async () => {
      const income = {
        id: 'income-1',
        label: 'Salaire',
        amount: 4400,
        currency: 'CHF',
        accountId: 'account-1',
        memberId: null,
        frequency: 'monthly',
        startDate: new Date('2026-01-01T12:00:00.000Z'),
        endDate: null,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.income.findUnique = jest.fn().mockResolvedValue(income);
      mockedTransactionUpsert.mockResolvedValue({
        id: 'tx-1',
        accountId: 'account-1',
        date: new Date('2026-11-01T12:00:00.000Z'),
        amount: 4400,
        category: 'SALAIRE',
        note: 'Salaire — 2026-11',
        transferId: null,
        transferRole: null,
        incomeId: 'income-1',
        budgetMonth: '2026-11',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const transaction = await incomeService.confirm('income-1', {
        month: '2026-11',
        amount: 4400,
      });

      expect(transaction.amount).toBe(4400);
      expect(transaction.incomeId).toBe('income-1');
      expect(transaction.budgetMonth).toBe('2026-11');
    });

    it('est idempotent (upsert)', async () => {
      const income = {
        id: 'income-1',
        label: 'Salaire',
        amount: 4400,
        currency: 'CHF',
        accountId: 'account-1',
        memberId: null,
        frequency: 'monthly',
        startDate: new Date('2026-01-01T12:00:00.000Z'),
        endDate: null,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.income.findUnique = jest.fn().mockResolvedValue(income);
      mockedTransactionUpsert.mockResolvedValue({
        id: 'tx-1',
        accountId: 'account-1',
        date: new Date('2026-11-01T12:00:00.000Z'),
        amount: 4500,
        category: 'SALAIRE',
        note: 'Salaire — 2026-11',
        transferId: null,
        transferRole: null,
        incomeId: 'income-1',
        budgetMonth: '2026-11',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const transaction = await incomeService.confirm('income-1', {
        month: '2026-11',
        amount: 4500,
      });

      expect(transaction.amount).toBe(4500);
      expect(mockedTransactionUpsert).toHaveBeenCalledTimes(1);
    });
  });

  describe('remove', () => {
    it('supprime la source', async () => {
      const income = {
        id: 'income-1',
        label: 'Salaire',
        amount: 4400,
        currency: 'CHF',
        accountId: 'account-1',
        memberId: null,
        frequency: 'monthly',
        startDate: new Date('2026-01-01T12:00:00.000Z'),
        endDate: null,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.income.findUnique = jest.fn().mockResolvedValue(income);
      mockedIncomeDelete.mockResolvedValue(income);

      await incomeService.remove('income-1');
      expect(mockedIncomeDelete).toHaveBeenCalledWith({
        where: { id: 'income-1' },
      });
    });
  });
});
