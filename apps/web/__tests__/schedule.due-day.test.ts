/**
 * Tests for the monthly due-day anchoring (task 4.2, design D4):
 * `resolveDueDay` clamps the chosen day to the month length; the
 * monthly generation anchors on the anchor month (start month, or the
 * current month when later) and ALWAYS generates it, even when the day
 * is already past. `dueDay: null` keeps the legacy start-date day.
 * Weekly/daily frequencies keep their skip loop.
 *
 * @module Tests/Domain/ScheduleDueDay
 */
import {
  generatePayments,
  missingPayments,
  resolveDueDay,
  type Charge,
  type Payment,
} from '@mbongo/shared';
import { parseISO } from 'date-fns';

function chargeFixture(overrides: Partial<Charge> = {}): Charge {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    label: 'Loyer GE',
    type: 'FIXED_RECURRING',
    amount: 1850,
    currency: 'CHF',
    accountId: '22222222-2222-4222-8222-222222222222',
    category: 'Logement',
    startDate: '2026-11-01T00:00:00.000Z',
    endDate: null,
    frequency: 'monthly',
    installments: null,
    dueDay: null,
    provisioned: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function paymentFixture(id: string, dueDate: string): Payment {
  return {
    id,
    chargeId: '11111111-1111-4111-8111-111111111111',
    amount: 1850,
    currency: 'CHF',
    dueDate,
    status: 'PENDING',
    paidAt: null,
    transactionId: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

describe('resolveDueDay', () => {
  it('clamps day 31 to 28 in February (non-leap)', () => {
    const due = resolveDueDay(new Date(2026, 1, 10), 31);
    expect(due.getFullYear()).toBe(2026);
    expect(due.getMonth()).toBe(1);
    expect(due.getDate()).toBe(28);
  });

  it('clamps day 31 to 29 in February (leap year)', () => {
    expect(resolveDueDay(new Date(2028, 1, 10), 31).getDate()).toBe(29);
  });

  it('clamps day 31 to 30 in April', () => {
    expect(resolveDueDay(new Date(2026, 3, 10), 31).getDate()).toBe(30);
  });

  it('keeps valid days untouched', () => {
    expect(resolveDueDay(new Date(2026, 10, 10), 5).getDate()).toBe(5);
  });
});

describe('generatePayments — monthly anchoring', () => {
  it('generates the first due date on the chosen day of the current month (created on the 23rd, day 5)', () => {
    const charge = chargeFixture({ dueDay: 5, startDate: '2026-11-23' });
    const payments = generatePayments(charge, parseISO('2026-11-23'));

    expect(payments[0].dueDate).toBe('2026-11-05T00:00:00.000Z');
    expect(payments[1].dueDate).toBe('2026-12-05T00:00:00.000Z');
  });

  it('falls back to the start-date day when dueDay is null (legacy)', () => {
    const charge = chargeFixture({
      dueDay: null,
      startDate: '2026-11-08T00:00:00.000Z',
    });
    const payments = generatePayments(charge, parseISO('2026-11-24'));

    // The anchor month is always generated, even when the day is past.
    expect(payments[0].dueDate).toBe('2026-11-08T00:00:00.000Z');
    expect(payments[1].dueDate).toBe('2026-12-08T00:00:00.000Z');
  });

  it('anchors on the start month when it is in the future', () => {
    const charge = chargeFixture({ dueDay: 5, startDate: '2026-12-15' });
    const payments = generatePayments(charge, parseISO('2026-11-24'));

    expect(payments[0].dueDate).toBe('2026-12-05T00:00:00.000Z');
    expect(payments[1].dueDate).toBe('2027-01-05T00:00:00.000Z');
  });

  it('respects the end date horizon', () => {
    const charge = chargeFixture({
      dueDay: 5,
      startDate: '2026-11-01',
      endDate: '2026-12-31',
    });
    const payments = generatePayments(charge, parseISO('2026-11-24'));

    expect(payments.map((p) => p.dueDate)).toEqual([
      '2026-11-05T00:00:00.000Z',
      '2026-12-05T00:00:00.000Z',
    ]);
  });

  it('keeps weekly recurrence on the legacy skip loop', () => {
    const charge = chargeFixture({
      frequency: 'weekly',
      dueDay: 5,
      startDate: '2026-11-02T00:00:00.000Z', // Monday
    });
    const payments = generatePayments(charge, parseISO('2026-11-23'));

    // Skips occurrences before `from`, first due on/after it.
    expect(payments[0].dueDate).toBe('2026-11-23T00:00:00.000Z');
  });

  it('keeps daily recurrence on the legacy skip loop', () => {
    const charge = chargeFixture({
      frequency: 'daily',
      dueDay: 5,
      startDate: '2026-11-01T00:00:00.000Z',
    });
    const payments = generatePayments(charge, parseISO('2026-11-23'));

    expect(payments[0].dueDate).toBe('2026-11-23T00:00:00.000Z');
    expect(payments[1].dueDate).toBe('2026-11-24T00:00:00.000Z');
  });
});

describe('missingPayments — due-day non-regression', () => {
  it('resumes the monthly calendar at the chosen day without duplicating', () => {
    const charge = chargeFixture({ dueDay: 5, startDate: '2026-11-01' });
    const existing: Payment[] = [
      paymentFixture('p-1', '2026-11-05T00:00:00.000Z'),
      paymentFixture('p-2', '2026-12-05T00:00:00.000Z'),
    ];

    const missing = missingPayments(charge, existing, parseISO('2026-12-24'));

    expect(missing[0].dueDate).toBe('2027-01-05T00:00:00.000Z');
    expect(missing.some((p) => p.dueDate === '2026-12-05T00:00:00.000Z')).toBe(
      false
    );
  });
});
