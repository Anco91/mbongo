/**
 * Tests for Monthly Budget Service
 * @jest-environment node
 */

import { MonthlyBudgetService } from '@/server/monthly-budgets/monthly-budget.service';

jest.mock('@/server/db', () => ({
  prisma: {
    monthlyBudget: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  },
}));

import { prisma } from '@/server/db';

const mockedFindUnique = prisma.monthlyBudget.findUnique as jest.Mock;
const mockedUpsert = prisma.monthlyBudget.upsert as jest.Mock;

const monthlyBudgetService = new MonthlyBudgetService();

describe('MonthlyBudgetService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findOne', () => {
    it("retourne null si le mois n'existe pas", async () => {
      mockedFindUnique.mockResolvedValue(null);

      const budget = await monthlyBudgetService.findOne('2026-11');
      expect(budget).toBeNull();
    });

    it("retourne le budget mensuel s'il existe", async () => {
      mockedFindUnique.mockResolvedValue({
        id: 'budget-1',
        month: '2026-11',
        preparedAt: new Date('2026-11-01T12:00:00.000Z'),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const budget = await monthlyBudgetService.findOne('2026-11');
      expect(budget).not.toBeNull();
      expect(budget?.month).toBe('2026-11');
      expect(budget?.preparedAt).toBeDefined();
    });
  });

  describe('prepare', () => {
    it('crée un nouveau budget mensuel', async () => {
      mockedUpsert.mockResolvedValue({
        id: 'budget-1',
        month: '2026-11',
        preparedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const budget = await monthlyBudgetService.prepare('2026-11');
      expect(budget.month).toBe('2026-11');
      expect(budget.preparedAt).toBeDefined();
    });

    it('est idempotent (upsert)', async () => {
      mockedUpsert.mockResolvedValue({
        id: 'budget-1',
        month: '2026-11',
        preparedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await monthlyBudgetService.prepare('2026-11');
      await monthlyBudgetService.prepare('2026-11');

      expect(mockedUpsert).toHaveBeenCalledTimes(2);
    });
  });
});
