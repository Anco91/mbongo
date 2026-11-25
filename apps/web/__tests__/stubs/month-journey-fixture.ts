/**
 * Fixture of the month journey (spec 39). Fictional household, EUR only, pure
 * data. Own file: the spec 34 / 38 fixture stays untouched. Dates noon UTC.
 * "Today" is 2026-11-15, so month X = 2026-12 is a future month.
 */
import type {
  Account,
  Charge,
  Income,
  Payment,
} from '@mbongo/shared';

export const STAMP = '2026-01-01T12:00:00.000Z';
export const X = '2026-12';
export const X1 = '2027-01';
export const X2 = '2027-02';

function account(
  over: Partial<Account> & Pick<Account, 'id' | 'name'>
): Account {
  return {
    bank: null,
    currency: 'EUR',
    accountType: 'CURRENT',
    memberId: null,
    overdraftLimit: 0,
    deferredCard: false,
    billingDay: null,
    linkedAccountId: null,
    openingBalance: 0,
    status: 'ACTIVE',
    closedAt: null,
    createdAt: STAMP,
    updatedAt: STAMP,
    ...over,
  };
}

export const A_CUR = account({ id: 'a-cur', name: 'Compte courant', openingBalance: 1000 });
/** Deferred-debit current account: a negative month end is repaid at month end. */
export const A_BNP = account({ id: 'a-bnp', name: 'Compte différé', deferredCard: true });
/** Ordinary overdraft: carried to the next month. */
export const A_OVER = account({ id: 'a-over', name: 'Compte à découvert', openingBalance: -100 });
export const A_SAV = account({ id: 'a-sav', name: 'Épargne', accountType: 'SAVINGS', openingBalance: 5000 });
export const A_OLD = account({ id: 'a-old', name: 'Ancien compte', openingBalance: 300, status: 'CLOSED' });
export const ACCOUNTS: Account[] = [A_CUR, A_BNP, A_OVER, A_SAV, A_OLD];

function charge(over: Partial<Charge> & Pick<Charge, 'id' | 'label'>): Charge {
  return {
    type: 'FIXED_RECURRING',
    amount: 1,
    currency: 'EUR',
    accountId: 'a-cur',
    category: 'Divers',
    subcategory: null,
    startDate: '2026-01-01T12:00:00.000Z',
    endDate: null,
    frequency: 'monthly',
    installments: null,
    dueDay: null,
    provisioned: false,
    createdAt: STAMP,
    updatedAt: STAMP,
    ...over,
  };
}

/** Fixed, no end date: carries over. */
export const RENT = charge({ id: 'c-rent', label: 'Loyer', amount: 900, dueDay: 3 });
export const INSURANCE = charge({ id: 'c-ins', label: 'Assurance', amount: 60, dueDay: 10 });
/** One-off, December only. */
export const TV = charge({
  id: 'c-tv',
  label: 'Télévision',
  type: 'ONE_OFF',
  amount: 250,
  startDate: '2026-12-12T12:00:00.000Z',
  frequency: null,
});
/** Fixed with an end date: December only. */
export const GYM = charge({
  id: 'c-gym',
  label: 'Salle de sport',
  type: 'TEMPORARY',
  amount: 20,
  dueDay: 15,
  startDate: '2026-12-01T12:00:00.000Z',
  endDate: '2026-12-31T12:00:00.000Z',
});
export const CHARGES: Charge[] = [RENT, INSURANCE, TV, GYM];

function payment(
  over: Partial<Payment> & Pick<Payment, 'id' | 'chargeId' | 'dueDate'>
): Payment {
  return {
    amount: 1,
    currency: 'EUR',
    status: 'PENDING',
    paidAt: null,
    transactionId: null,
    createdAt: STAMP,
    updatedAt: STAMP,
    ...over,
  };
}

/** The only persisted payment: December rent. The rest is scheduled. */
export const P_RENT_DEC = payment({
  id: 'p-rent-dec',
  chargeId: 'c-rent',
  amount: 900,
  dueDate: '2026-12-03T12:00:00.000Z',
});
export const PAYMENTS: Payment[] = [P_RENT_DEC];
/** Cancelled January insurance: persisted, so it must not be scheduled again. */
export const P_INS_JAN_CANCELLED = payment({
  id: 'p-ins-jan',
  chargeId: 'c-ins',
  amount: 60,
  status: 'CANCELLED',
  dueDate: '2027-01-10T12:00:00.000Z',
});

export const SALARY: Income = {
  id: 'inc-salary',
  label: 'Salaire',
  amount: 3000,
  currency: 'EUR',
  accountId: 'a-cur',
  memberId: null,
  frequency: 'monthly',
  startDate: '2026-01-01T12:00:00.000Z',
  endDate: null,
  active: true,
  createdAt: STAMP,
  updatedAt: STAMP,
};
export const INCOMES: Income[] = [SALARY];
