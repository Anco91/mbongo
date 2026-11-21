/**
 * Tests for Income Domain Logic
 *
 * Vérifie la logique de détermination des revenus dus pour un mois donné.
 */

import { isIncomeDueForMonth, Income } from '@mbongo/shared';

function makeIncome(overrides: Partial<Income> = {}): Income {
  return {
    id: 'income-1',
    label: 'Salaire',
    amount: 4400,
    currency: 'CHF',
    accountId: 'account-1',
    memberId: null,
    frequency: 'monthly',
    startDate: '2026-01-01T12:00:00.000Z',
    endDate: null,
    active: true,
    createdAt: '2026-01-01T12:00:00.000Z',
    updatedAt: '2026-01-01T12:00:00.000Z',
    ...overrides,
  };
}

describe('isIncomeDueForMonth', () => {
  describe('revenu mensuel', () => {
    it('retourne true pour un mois après startDate', () => {
      const income = makeIncome({ startDate: '2026-01-15T12:00:00.000Z' });
      expect(isIncomeDueForMonth(income, '2026-02')).toBe(true);
    });

    it('retourne true pour le mois de startDate', () => {
      const income = makeIncome({ startDate: '2026-03-10T12:00:00.000Z' });
      expect(isIncomeDueForMonth(income, '2026-03')).toBe(true);
    });

    it('retourne false pour un mois avant startDate', () => {
      const income = makeIncome({ startDate: '2026-03-01T12:00:00.000Z' });
      expect(isIncomeDueForMonth(income, '2026-02')).toBe(false);
    });

    it('retourne false si endDate est avant le mois', () => {
      const income = makeIncome({
        startDate: '2026-01-01T12:00:00.000Z',
        endDate: '2026-06-30T12:00:00.000Z',
      });
      expect(isIncomeDueForMonth(income, '2026-07')).toBe(false);
    });

    it('retourne true si endDate est dans le mois', () => {
      const income = makeIncome({
        startDate: '2026-01-01T12:00:00.000Z',
        endDate: '2026-06-15T12:00:00.000Z',
      });
      expect(isIncomeDueForMonth(income, '2026-06')).toBe(true);
    });

    it('retourne false si income est inactif', () => {
      const income = makeIncome({ active: false });
      expect(isIncomeDueForMonth(income, '2026-11')).toBe(false);
    });
  });

  describe('revenu annuel', () => {
    it('retourne true au mois anniversaire', () => {
      const income = makeIncome({
        frequency: 'yearly',
        startDate: '2026-03-15T12:00:00.000Z',
      });
      expect(isIncomeDueForMonth(income, '2026-03')).toBe(true);
      expect(isIncomeDueForMonth(income, '2027-03')).toBe(true);
    });

    it('retourne false hors mois anniversaire', () => {
      const income = makeIncome({
        frequency: 'yearly',
        startDate: '2026-03-15T12:00:00.000Z',
      });
      expect(isIncomeDueForMonth(income, '2026-04')).toBe(false);
      expect(isIncomeDueForMonth(income, '2026-02')).toBe(false);
    });

    it('respecte endDate pour revenu annuel', () => {
      const income = makeIncome({
        frequency: 'yearly',
        startDate: '2026-03-15T12:00:00.000Z',
        endDate: '2027-03-14T12:00:00.000Z',
      });
      expect(isIncomeDueForMonth(income, '2027-03')).toBe(true);
      expect(isIncomeDueForMonth(income, '2028-03')).toBe(false);
    });
  });
});
