import {
  generatePayments,
  monthlyProvision,
  remainingBalance,
  paymentsInMonth,
  monthlyPaymentTotal,
  nextPayment,
  isOverdue,
  overduePayments,
  Charge,
  Payment,
} from '@mbongo/shared';
import { parseISO } from 'date-fns';

describe('Schedule Domain Logic', () => {
  const baseCharge: Charge = {
    id: '11111111-1111-4111-8111-111111111111',
    label: 'Test Charge',
    type: 'FIXED_RECURRING',
    amount: 1200,
    currency: 'CHF',
    accountId: '22222222-2222-4222-8222-222222222222',
    category: 'Logement',
    startDate: '2026-01-01T00:00:00.000Z',
    endDate: '2026-06-01T00:00:00.000Z',
    frequency: 'monthly',
    installments: null,
    provisioned: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  describe('generatePayments', () => {
    it('generates recurring payments until endDate', () => {
      const from = parseISO('2026-01-01T00:00:00.000Z');
      const payments = generatePayments(baseCharge, from);

      expect(payments).toHaveLength(6);
      expect(payments[0].amount).toBe(1200);
      expect(payments[0].currency).toBe('CHF');
      expect(payments[0].status).toBe('PENDING');
      expect(payments[0].dueDate).toBe(
        parseISO('2026-01-01T00:00:00.000Z').toISOString()
      );
      expect(payments[5].dueDate).toBe(
        parseISO('2026-06-01T00:00:00.000Z').toISOString()
      );
    });

    it('generates installment payments with equal split', () => {
      const installmentCharge: Charge = {
        ...baseCharge,
        type: 'INSTALLMENT',
        amount: 1248,
        installments: 4,
        frequency: null,
        endDate: null,
      };

      const from = parseISO('2026-09-25T00:00:00.000Z');
      const payments = generatePayments(
        { ...installmentCharge, startDate: '2026-09-25T00:00:00.000Z' },
        from
      );

      expect(payments).toHaveLength(4);
      expect(payments[0].amount).toBe(312);
      expect(payments[1].amount).toBe(312);
      expect(payments[2].amount).toBe(312);
      expect(payments[3].amount).toBe(312);
    });

    it('generates a single payment for ONE_OFF and UPCOMING', () => {
      const oneOffCharge: Charge = {
        ...baseCharge,
        type: 'ONE_OFF',
        amount: 250,
        frequency: null,
        endDate: null,
      };

      const from = parseISO('2026-11-01T00:00:00.000Z');
      const payments = generatePayments(oneOffCharge, from);

      expect(payments).toHaveLength(1);
      expect(payments[0].amount).toBe(250);
    });
  });

  describe('Calculations', () => {
    it('calculates monthly provision correctly', () => {
      const charges: Charge[] = [
        { ...baseCharge, amount: 335, provisioned: true },
        { ...baseCharge, amount: 480, provisioned: true },
        { ...baseCharge, amount: 1000, provisioned: false },
      ];

      // (335 + 480) / 12 = 815 / 12 = 67.9166... ≈ 67.92
      expect(monthlyProvision(charges)).toBe(67.92);
    });

    it('calculates remaining balance for paid installments', () => {
      const charge: Charge = { ...baseCharge, amount: 1200 };
      const payments: Payment[] = [
        {
          id: 'p1',
          chargeId: charge.id,
          amount: 300,
          currency: 'CHF',
          dueDate: '2026-01-01T00:00:00.000Z',
          status: 'PAID',
          paidAt: '2026-01-01T00:00:00.000Z',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 'p2',
          chargeId: charge.id,
          amount: 300,
          currency: 'CHF',
          dueDate: '2026-02-01T00:00:00.000Z',
          status: 'PAID',
          paidAt: '2026-02-01T00:00:00.000Z',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 'p3',
          chargeId: charge.id,
          amount: 300,
          currency: 'CHF',
          dueDate: '2026-03-01T00:00:00.000Z',
          status: 'PENDING',
          paidAt: null,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ];

      expect(remainingBalance(charge, payments)).toBe(600);
    });

    it('identifies overdue payments and next payment', () => {
      const payments: Payment[] = [
        {
          id: 'p1',
          chargeId: baseCharge.id,
          amount: 100,
          currency: 'CHF',
          dueDate: '2026-01-10T00:00:00.000Z',
          status: 'PENDING',
          paidAt: null,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 'p2',
          chargeId: baseCharge.id,
          amount: 200,
          currency: 'CHF',
          dueDate: '2026-01-20T00:00:00.000Z',
          status: 'PENDING',
          paidAt: null,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ];

      const asOf = parseISO('2026-01-15T00:00:00.000Z');
      expect(isOverdue(payments[0], asOf)).toBe(true);
      expect(isOverdue(payments[1], asOf)).toBe(false);

      expect(overduePayments(payments, asOf)).toHaveLength(1);
      expect(nextPayment(payments, asOf)?.id).toBe('p2');
    });

    it('calculates monthly totals for payments in month', () => {
      const payments: Payment[] = [
        {
          id: 'p1',
          chargeId: baseCharge.id,
          amount: 150.5,
          currency: 'CHF',
          dueDate: '2026-02-05T00:00:00.000Z',
          status: 'PENDING',
          paidAt: null,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 'p2',
          chargeId: baseCharge.id,
          amount: 249.5,
          currency: 'CHF',
          dueDate: '2026-02-20T00:00:00.000Z',
          status: 'PENDING',
          paidAt: null,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 'p3',
          chargeId: baseCharge.id,
          amount: 500,
          currency: 'CHF',
          dueDate: '2026-03-01T00:00:00.000Z',
          status: 'PENDING',
          paidAt: null,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ];

      const febDate = new Date(2026, 1, 1); // Month is 0-indexed: 1 = February
      const febPayments = paymentsInMonth(payments, febDate);
      expect(febPayments).toHaveLength(2);
      expect(monthlyPaymentTotal(payments, febDate)).toBe(400);
    });
  });
});
