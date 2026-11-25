/**
 * Fixture of the multi-month budget journey (spec 34). Fictional FR/CH
 * household, pure data: no Prisma, no React. Lives in `stubs/` so Jest does
 * not run it as a suite. Dates are mid-month, noon UTC.
 *
 * "Today" is 2026-11-15. Rate: 1 CHF = 1.05 EUR (`counterValue(chf, 1.05)`).
 */
import {
  counterValue,
  type Account,
  type Charge,
  type Income,
  type Payment,
  type Transaction,
  type Transfer,
} from '@mbongo/shared';

export const TODAY = new Date('2026-11-15T12:00:00.000Z');
export const RATE = 1.05;
const STAMP = '2026-01-01T12:00:00.000Z';

export const convert = (amount: number, currency: string): number =>
  currency === 'CHF' ? counterValue(amount, RATE) : amount;

export const month = (key: string): Date => new Date(`${key}-15T12:00:00.000Z`);

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

export const ACCOUNTS: Account[] = [
  account({ id: 'a-cur', name: 'Compte courant', openingBalance: 2000 }),
  account({
    id: 'a-joint',
    name: 'Compte joint',
    accountType: 'JOINT',
    openingBalance: 500,
  }),
  account({
    id: 'a-sav',
    name: 'Épargne',
    accountType: 'SAVINGS',
    openingBalance: 5000,
  }),
  account({
    id: 'a-chf',
    name: 'Compte CHF',
    currency: 'CHF',
    openingBalance: 1000,
  }),
];

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

export const RENT = charge({
  id: 'c-rent',
  label: 'Loyer',
  amount: 900,
  accountId: 'a-joint',
  category: 'Logement',
  dueDay: 3,
});
export const PHONE = charge({
  id: 'c-phone',
  label: 'Téléphone',
  amount: 30,
  category: 'Abonnements',
  dueDay: 20,
});
/** Yearly premium, smoothed: 100 EUR a month, all year. */
export const INSURANCE = charge({
  id: 'c-ins',
  label: 'Assurance annuelle',
  type: 'UPCOMING',
  amount: 1200,
  category: 'Assurances',
  frequency: 'yearly',
  provisioned: true,
});
/** Smoothed 600 EUR over Sep-Dec 2026 only: 50 EUR a month, ends 2026-12-31. */
export const TAX = charge({
  id: 'c-tax',
  label: 'Impôt temporaire',
  type: 'UPCOMING',
  amount: 600,
  category: 'Impôts & taxes',
  startDate: '2026-09-01T12:00:00.000Z',
  endDate: '2026-12-31T12:00:00.000Z',
  frequency: null,
  provisioned: true,
});
/** Smoothed CHF charge, alone in its scenario. */
export const SERAFE = charge({
  id: 'c-serafe',
  label: 'Serafe',
  type: 'UPCOMING',
  amount: 335,
  currency: 'CHF',
  accountId: 'a-chf',
  category: 'Impôts & taxes',
  frequency: 'yearly',
  provisioned: true,
});
export const CHARGES: Charge[] = [RENT, PHONE, INSURANCE, TAX];

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

export const P_RENT_OCT = payment({
  id: 'p-rent-oct',
  chargeId: 'c-rent',
  amount: 900,
  dueDate: '2026-10-03T12:00:00.000Z',
});
export const P_PHONE_OCT = payment({
  id: 'p-phone-oct',
  chargeId: 'c-phone',
  amount: 30,
  status: 'CANCELLED',
  dueDate: '2026-10-20T12:00:00.000Z',
});
export const P_RENT_NOV = payment({
  id: 'p-rent-nov',
  chargeId: 'c-rent',
  amount: 900,
  status: 'PAID',
  paidAt: '2026-11-03T12:00:00.000Z',
  transactionId: 't-rent-nov',
  dueDate: '2026-11-03T12:00:00.000Z',
});
export const P_PHONE_NOV = payment({
  id: 'p-phone-nov',
  chargeId: 'c-phone',
  amount: 30,
  dueDate: '2026-11-20T12:00:00.000Z',
});
/** Payment of a smoothed charge: the budget counts the provision instead. */
export const P_INS_NOV = payment({
  id: 'p-ins-nov',
  chargeId: 'c-ins',
  amount: 1200,
  dueDate: '2026-11-25T12:00:00.000Z',
});
export const P_RENT_DEC = payment({
  id: 'p-rent-dec',
  chargeId: 'c-rent',
  amount: 900,
  dueDate: '2026-12-03T12:00:00.000Z',
});
export const P_PHONE_DEC = payment({
  id: 'p-phone-dec',
  chargeId: 'c-phone',
  amount: 30,
  dueDate: '2026-12-20T12:00:00.000Z',
});
export const PAYMENTS: Payment[] = [
  P_RENT_OCT,
  P_PHONE_OCT,
  P_RENT_NOV,
  P_PHONE_NOV,
  P_INS_NOV,
  P_RENT_DEC,
  P_PHONE_DEC,
];

export const SALARY: Income = {
  id: 'inc-salary',
  label: 'Salaire',
  amount: 4000,
  currency: 'CHF',
  accountId: 'a-chf',
  memberId: null,
  frequency: 'monthly',
  startDate: '2026-01-01T12:00:00.000Z',
  endDate: null,
  active: true,
  createdAt: STAMP,
  updatedAt: STAMP,
};
export const INCOMES: Income[] = [SALARY];

function transaction(
  over: Partial<Transaction> & Pick<Transaction, 'id' | 'accountId' | 'amount'>
): Transaction {
  return {
    date: '2026-11-03T12:00:00.000Z',
    category: null,
    note: null,
    transferId: null,
    transferRole: null,
    incomeId: null,
    budgetMonth: null,
    createdAt: STAMP,
    updatedAt: STAMP,
    ...over,
  };
}

/** Debit booked when `p-rent-nov` was ticked paid. */
export const T_RENT_NOV = transaction({
  id: 't-rent-nov',
  accountId: 'a-joint',
  amount: -900,
  category: 'Logement',
});
/** December salary confirmed early, on 2026-11-20. */
export const T_SALARY_DEC_EARLY = transaction({
  id: 't-salary-dec',
  accountId: 'a-chf',
  amount: 4100,
  date: '2026-11-20T12:00:00.000Z',
  incomeId: 'inc-salary',
  budgetMonth: '2026-12',
});

// ---------------------------------------------------------------------------
// Spec 38 additions (append only: the spec 34 `current` tests do not use them)
// ---------------------------------------------------------------------------
/** Credit card settled on the current account every 28th. */
export const A_CARD = account({
  id: 'a-card',
  name: 'Carte de crédit',
  accountType: 'CREDIT_CARD',
  linkedAccountId: 'a-cur',
  billingDay: 28,
});
/** Deferred-debit card: the account settles itself, nothing to move. */
export const A_DEFERRED = account({
  id: 'a-def',
  name: 'Carte différée',
  deferredCard: true,
});
export const A_OLD = account({
  id: 'a-old',
  name: 'Ancien compte',
  openingBalance: 3000,
  status: 'CLOSED',
  closedAt: '2026-06-30T12:00:00.000Z',
});

export const T_CARD_1 = transaction({
  id: 't-card-1',
  accountId: 'a-card',
  amount: -200,
  date: '2026-11-05T12:00:00.000Z',
});
export const T_CARD_2 = transaction({
  id: 't-card-2',
  accountId: 'a-card',
  amount: -100,
  date: '2026-11-12T12:00:00.000Z',
});
export const T_DEFERRED = transaction({
  id: 't-def-1',
  accountId: 'a-def',
  amount: -100,
  date: '2026-11-05T12:00:00.000Z',
});

/** Phone payment of November ticked paid today: one debit, no second one. */
export const P_PHONE_NOV_PAID: Payment = {
  ...P_PHONE_NOV,
  status: 'PAID',
  paidAt: '2026-11-15T12:00:00.000Z',
  transactionId: 't-phone-nov',
};
export const T_PHONE_NOV = transaction({
  id: 't-phone-nov',
  accountId: 'a-cur',
  amount: -30,
  date: '2026-11-15T12:00:00.000Z',
});

function transfer(
  over: Partial<Transfer> & Pick<Transfer, 'id' | 'status' | 'sentAt'>
): Transfer {
  return {
    sourceAccountId: 'a-chf',
    targetAccountId: 'a-cur',
    amountSent: 1000,
    rateEstimated: RATE,
    rateDate: over.sentAt,
    amountReceived: null,
    rateEffective: null,
    fees: null,
    memo: null,
    receivedAt: null,
    createdAt: STAMP,
    updatedAt: STAMP,
    ...over,
  };
}

/** 1000 CHF sent, 1040 EUR received (1050 estimated): 10 EUR of fees. */
export const TR_DONE = transfer({
  id: 'tr-done',
  status: 'COMPLETED',
  sentAt: '2026-11-10T12:00:00.000Z',
  receivedAt: '2026-11-10T12:00:00.000Z',
  amountReceived: 1040,
  rateEffective: 1.04,
  fees: 10,
});
export const T_TR_DONE_SRC = transaction({
  id: 't-tr-done-src',
  accountId: 'a-chf',
  amount: -1000,
  date: '2026-11-10T12:00:00.000Z',
  transferId: 'tr-done',
  transferRole: 'SOURCE',
});
export const T_TR_DONE_TGT = transaction({
  id: 't-tr-done-tgt',
  accountId: 'a-cur',
  amount: 1040,
  date: '2026-11-10T12:00:00.000Z',
  transferId: 'tr-done',
  transferRole: 'TARGET',
});
/** Planned for 2026-11-28: the SOURCE leg exists, the TARGET leg does not yet. */
export const TR_PLANNED = transfer({
  id: 'tr-plan',
  status: 'ESTIMATED',
  sentAt: '2026-11-28T12:00:00.000Z',
  amountSent: 500,
});
export const T_TR_PLAN_SRC = transaction({
  id: 't-tr-plan-src',
  accountId: 'a-chf',
  amount: -500,
  date: '2026-11-28T12:00:00.000Z',
  transferId: 'tr-plan',
  transferRole: 'SOURCE',
});
