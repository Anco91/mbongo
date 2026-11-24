/**
 * Tests for the pure charge/filter helpers extracted from the views
 * (design D6): status, amount suffix, filtering and indexes.
 *
 * @module Tests/M5/Filters
 */

import type { Account, Charge, Payment } from '@mbongo/shared';
import { chargeAmountLabel, chargeStatus } from '@/lib/charges';
import {
  buildAccountsMap,
  buildChargesMap,
  filterCharges,
  groupPaymentsByCharge,
  matchesMemberFilter,
  nextPendingByCharge,
} from '@/lib/filters';

const NOW = new Date('2026-11-18T12:00:00.000Z');

const makeCharge = (overrides: Partial<Charge> = {}): Charge => ({
  id: 'charge-1',
  label: 'Loyer',
  type: 'FIXED_RECURRING',
  amount: 1200,
  currency: 'CHF',
  accountId: 'account-1',
  category: 'Logement',
  startDate: '2026-01-01T00:00:00.000Z',
  endDate: null,
  frequency: 'monthly',
  installments: null,
  dueDay: null,
  provisioned: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

const makePayment = (overrides: Partial<Payment> = {}): Payment => ({
  id: 'payment-1',
  chargeId: 'charge-1',
  amount: 1200,
  currency: 'CHF',
  dueDate: '2026-12-01T00:00:00.000Z',
  status: 'PENDING',
  paidAt: null,
  transactionId: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

const makeAccount = (overrides: Partial<Account> = {}): Account => ({
  id: 'account-1',
  name: 'Compte courant',
  bank: 'BCV',
  currency: 'CHF',
  accountType: 'CURRENT',
  memberId: 'member-1',
  overdraftLimit: 0,
  deferredCard: false,
  billingDay: null,
  linkedAccountId: null,
  openingBalance: 0,
  status: 'ACTIVE',
  closedAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

describe('chargeStatus', () => {
  it('marks a provisioned charge as provisioned', () => {
    expect(
      chargeStatus(makeCharge({ provisioned: true }), makePayment(), NOW)
    ).toBe('Provisionnée');
  });

  it('says paid when no pending payment remains', () => {
    expect(chargeStatus(makeCharge(), null, NOW)).toBe('Payé');
  });

  it('marks a due date in the past as due', () => {
    expect(
      chargeStatus(
        makeCharge(),
        makePayment({ dueDate: '2026-11-01T00:00:00.000Z' }),
        NOW
      )
    ).toBe('Dû');
  });

  it('marks a future due date as upcoming', () => {
    expect(
      chargeStatus(
        makeCharge(),
        makePayment({ dueDate: '2026-12-01T00:00:00.000Z' }),
        NOW
      )
    ).toBe('À venir');
  });
});

describe('chargeAmountLabel', () => {
  it('appends / mois to recurring charges', () => {
    expect(chargeAmountLabel(makeCharge())).toBe(' / mois');
    expect(chargeAmountLabel(makeCharge({ type: 'TEMPORARY' }))).toBe(
      ' / mois'
    );
  });

  it('appends the installment count', () => {
    expect(
      chargeAmountLabel(makeCharge({ type: 'INSTALLMENT', installments: 4 }))
    ).toBe(' × 4');
  });

  it('adds nothing for one-off charges', () => {
    expect(chargeAmountLabel(makeCharge({ type: 'ONE_OFF' }))).toBe('');
  });
});

describe('member and charge filters', () => {
  const accounts = [
    makeAccount(),
    makeAccount({ id: 'account-2', memberId: 'member-2' }),
  ];
  const accountsById = buildAccountsMap(accounts);

  it('matches all members or one member', () => {
    expect(matchesMemberFilter('member-2', 'all')).toBe(true);
    expect(matchesMemberFilter('member-2', 'member-2')).toBe(true);
    expect(matchesMemberFilter('member-2', 'member-1')).toBe(false);
    expect(matchesMemberFilter(null, 'member-1')).toBe(false);
  });

  it('filters by member and type', () => {
    const charges = [
      makeCharge({ id: 'a', type: 'FIXED_RECURRING' }),
      makeCharge({ id: 'b', accountId: 'account-2', type: 'INSTALLMENT' }),
    ];

    expect(filterCharges(charges, accountsById, 'Toutes', 'all')).toHaveLength(
      2
    );
    expect(
      filterCharges(charges, accountsById, 'Toutes', 'member-1').map(
        (c) => c.id
      )
    ).toEqual(['a']);
    expect(
      filterCharges(charges, accountsById, 'Échelonnées', 'all').map(
        (c) => c.id
      )
    ).toEqual(['b']);
  });

  it('treats upcoming, temporary and provisioned charges as upcoming', () => {
    const charges = [
      makeCharge({ id: 'a', type: 'FIXED_RECURRING' }),
      makeCharge({ id: 'b', type: 'UPCOMING' }),
      makeCharge({ id: 'c', type: 'TEMPORARY' }),
      makeCharge({ id: 'd', type: 'ONE_OFF', provisioned: true }),
    ];

    expect(
      filterCharges(charges, accountsById, 'À venir', 'all').map((c) => c.id)
    ).toEqual(['b', 'c', 'd']);
  });
});

describe('indexes', () => {
  it('indexes accounts and charges by id', () => {
    expect(buildAccountsMap([makeAccount()]).get('account-1')?.name).toBe(
      'Compte courant'
    );
    expect(buildChargesMap([makeCharge()]).get('charge-1')?.label).toBe(
      'Loyer'
    );
  });

  it('groups payments by charge, sorted by due date', () => {
    const groups = groupPaymentsByCharge([
      makePayment({ id: 'late', dueDate: '2026-12-10T00:00:00.000Z' }),
      makePayment({ id: 'early', dueDate: '2026-12-01T00:00:00.000Z' }),
    ]);

    expect(groups.get('charge-1')?.map((p) => p.id)).toEqual(['early', 'late']);
  });

  it('keeps the earliest pending payment per charge', () => {
    const next = nextPendingByCharge([
      makePayment({ id: 'paid', status: 'PAID' }),
      makePayment({ id: 'later', dueDate: '2027-01-01T00:00:00.000Z' }),
      makePayment({ id: 'sooner', dueDate: '2026-12-01T00:00:00.000Z' }),
    ]);

    expect(next.get('charge-1')?.id).toBe('sooner');
  });
});
