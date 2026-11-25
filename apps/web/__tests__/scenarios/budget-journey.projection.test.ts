/**
 * Spec 38 — projected balance on the budget journey (locked).
 *
 * Fixture: `__tests__/stubs/budget-journey-fixture.ts`. Today = 2026-11-15,
 * 1 CHF = 1.05 EUR. Flows after today (Nov 15) up to the end of the month:
 * future-dated transactions, unconfirmed due income, PENDING payments (overdue
 * included, provisioned included: cash leaves at the real due date), the missing
 * TARGET leg of an ESTIMATED transfer, the next credit card settlement.
 *
 * Balances today (native): cur 2000, joint -400 (rent -900 on Nov 3), sav 5000,
 * chf 1000 (the +4100 of Nov 20 is after today). Total = 7650 EUR.
 *
 * End Nov (current): cur 2000 -30 phone -1200 insurance = 770
 *                    joint -400 -900 overdue Oct rent  = -1300
 *                    sav 5000
 *                    chf 1000 +4100 (Dec salary confirmed, Nov 20) +4000 (Nov
 *                    salary, unconfirmed) = 9100 CHF = 9555 EUR
 *                    total 770 -1300 +5000 +9555 = 14025
 * End Dec (future):  cur 740, joint -2200, chf 9100 (Dec salary already
 *                    confirmed, never planned twice) → 740 -2200 +5000 +9555 = 13095
 * Dec without the early confirmation: chf 1000 +4000 +4000 = 9000 → 9450;
 *                    740 -2200 +5000 +9450 = 12990 (gap 105 = 100 CHF x 1.05)
 * End Oct (past): balances as of Oct 31: 2000 + 500 + 5000 + 1000 CHF = 8550.
 *
 * Variants (each from the end-Nov base 14025):
 * - overdue Oct rent removed: joint -400 → 14925
 * - phone paid today (-30 booked): today 7620, end Nov 14025 unchanged
 * - transfer done (1000 CHF → 1040 EUR): today 7640 (-10 fees), end Nov 14015
 * - transfer planned Nov 28 (500 CHF, 525 EUR at 1.05): chf 8600, cur 1295, total 14025
 * - credit card -300, settled Nov 28 on cur: card 0, cur 470, total 13725
 * - deferred card -100: def -100, cur 770, total 13925
 * - closed account with 3000: ignored, total 14025
 */
import {
  balanceAsOf,
  computeMonthState,
  computeProjectedBalance,
  type Account,
  type Payment,
  type Transaction,
  type Transfer,
} from '@mbongo/shared';
import {
  ACCOUNTS,
  A_CARD,
  A_DEFERRED,
  A_OLD,
  CHARGES,
  INCOMES,
  PAYMENTS,
  P_PHONE_NOV,
  P_PHONE_NOV_PAID,
  P_RENT_OCT,
  RATE,
  TODAY,
  TR_DONE,
  TR_PLANNED,
  T_CARD_1,
  T_CARD_2,
  T_DEFERRED,
  T_PHONE_NOV,
  T_RENT_NOV,
  T_SALARY_DEC_EARLY,
  T_TR_DONE_SRC,
  T_TR_DONE_TGT,
  T_TR_PLAN_SRC,
  convert,
} from '../stubs/budget-journey-fixture';

const BASE_TX: Transaction[] = [T_RENT_NOV, T_SALARY_DEC_EARLY];

interface Overrides {
  accounts?: Account[];
  transactions?: Transaction[];
  transfers?: Transfer[];
  payments?: Payment[];
  rate?: number | null;
}

function project(monthKey: string, over: Overrides = {}) {
  return computeProjectedBalance({
    accounts: over.accounts ?? ACCOUNTS,
    transactions: over.transactions ?? BASE_TX,
    transfers: over.transfers ?? [],
    payments: over.payments ?? PAYMENTS,
    charges: CHARGES,
    incomes: INCOMES,
    today: TODAY,
    monthKey,
    rate: over.rate === undefined ? RATE : over.rate,
  });
}

/** Real total of today, from `balanceAsOf` only. */
function totalToday(accounts: Account[], transactions: Transaction[]): number {
  const sum = accounts
    .filter((a) => a.status === 'ACTIVE')
    .reduce(
      (acc, a) =>
        acc + convert(balanceAsOf(a, transactions, TODAY), a.currency),
      0
    );
  return Math.round(sum * 100) / 100;
}

describe('balanceAsOf', () => {
  const chf = ACCOUNTS[3];

  it('leaves out a transaction dated after the day (scenario 4, today)', () => {
    expect(balanceAsOf(chf, BASE_TX, TODAY)).toBe(1000);
  });

  it('includes a transaction of the same day, whatever the hour', () => {
    expect(
      balanceAsOf(chf, BASE_TX, new Date('2026-11-20T00:00:00.000Z'))
    ).toBe(5100);
    expect(
      balanceAsOf(chf, BASE_TX, new Date('2026-11-19T23:59:00.000Z'))
    ).toBe(1000);
  });

  it('counts only the transactions of the account', () => {
    expect(balanceAsOf(ACCOUNTS[1], BASE_TX, TODAY)).toBe(-400);
  });
});

describe('computeMonthState', () => {
  it('compares the month with the month of today', () => {
    expect(computeMonthState('2026-10', TODAY)).toBe('past');
    expect(computeMonthState('2026-11', TODAY)).toBe('current');
    expect(computeMonthState('2026-12', TODAY)).toBe('future');
    expect(computeMonthState('2027-01', TODAY)).toBe('future');
  });
});

describe('scenario 1 — today', () => {
  it('is 7650 EUR and ignores the salary dated Nov 20', () => {
    expect(totalToday(ACCOUNTS, BASE_TX)).toBe(7650);
  });
});

describe('scenarios 2 and 3 — nothing done, the projection chains', () => {
  it('projects end of November (current month)', () => {
    const nov = project('2026-11');
    expect(nov.state).toBe('current');
    expect(nov.balances).toEqual({
      'a-cur': 770,
      'a-joint': -1300,
      'a-sav': 5000,
      'a-chf': 9100,
    });
    expect(nov.totalEur).toBe(14025);
  });

  it('projects end of December (future month): savings unchanged, December rent and phone out', () => {
    const dec = project('2026-12');
    expect(dec.state).toBe('future');
    expect(dec.balances).toEqual({
      'a-cur': 740,
      'a-joint': -2200,
      'a-sav': 5000,
      'a-chf': 9100,
    });
    expect(dec.totalEur).toBe(13095);
  });

  it('has no EUR total without a rate, balances still known', () => {
    const nov = project('2026-11', { rate: null });
    expect(nov.totalEur).toBeNull();
    expect(nov.balances['a-chf']).toBe(9100);
  });
});

describe('scenario 4 — December salary confirmed early', () => {
  it('moves today by nothing and counts December once', () => {
    const without = BASE_TX.filter((t) => t.id !== T_SALARY_DEC_EARLY.id);
    expect(totalToday(ACCOUNTS, without)).toBe(7650);
    expect(project('2026-12', { transactions: without }).totalEur).toBe(12990);
    expect(project('2026-12').totalEur).toBe(13095);
  });
});

describe('scenario 5 — overdue payment', () => {
  it('weighs on the projection until it is paid', () => {
    const without = PAYMENTS.filter((p) => p.id !== P_RENT_OCT.id);
    expect(project('2026-11', { payments: without }).totalEur).toBe(14925);
  });
});

describe('scenario 6 — paying a payment', () => {
  it('debits once today, then the projection does not count it again', () => {
    const payments = PAYMENTS.map((p) =>
      p.id === P_PHONE_NOV.id ? P_PHONE_NOV_PAID : p
    );
    const transactions = [...BASE_TX, T_PHONE_NOV];
    expect(totalToday(ACCOUNTS, transactions)).toBe(7620);
    expect(project('2026-11', { payments, transactions }).totalEur).toBe(14025);
  });
});

describe('scenario 7 — CHF to EUR transfer with fees', () => {
  it('costs only its fees once done', () => {
    const transactions = [...BASE_TX, T_TR_DONE_SRC, T_TR_DONE_TGT];
    expect(totalToday(ACCOUNTS, transactions)).toBe(7640);
    const nov = project('2026-11', { transactions, transfers: [TR_DONE] });
    expect(nov.totalEur).toBe(14015);
  });

  it('shows a planned transfer at its date, neutral for the total', () => {
    const transactions = [...BASE_TX, T_TR_PLAN_SRC];
    expect(totalToday(ACCOUNTS, transactions)).toBe(7650);
    const nov = project('2026-11', { transactions, transfers: [TR_PLANNED] });
    expect(nov.balances['a-chf']).toBe(8600);
    expect(nov.balances['a-cur']).toBe(1295);
    expect(nov.totalEur).toBe(14025);
  });
});

describe('scenario 8 — cards', () => {
  it('settles a credit card on its linked account at the billing day', () => {
    const accounts = [...ACCOUNTS, A_CARD];
    const transactions = [...BASE_TX, T_CARD_1, T_CARD_2];
    expect(totalToday(accounts, transactions)).toBe(7350);
    const nov = project('2026-11', { accounts, transactions });
    expect(nov.balances['a-card']).toBe(0);
    expect(nov.balances['a-cur']).toBe(470);
    expect(nov.totalEur).toBe(13725);
  });

  it('moves nothing for a deferred card that settles itself', () => {
    const nov = project('2026-11', {
      accounts: [...ACCOUNTS, A_DEFERRED],
      transactions: [...BASE_TX, T_DEFERRED],
    });
    expect(nov.balances['a-def']).toBe(-100);
    expect(nov.balances['a-cur']).toBe(770);
    expect(nov.totalEur).toBe(13925);
  });
});

describe('scenario 9 — closed account', () => {
  it('is out of the balances and of the total', () => {
    const nov = project('2026-11', { accounts: [...ACCOUNTS, A_OLD] });
    expect(nov.balances).not.toHaveProperty('a-old');
    expect(nov.totalEur).toBe(14025);
  });
});

describe('scenario 11 — past month', () => {
  it('is the real balance at the end of the month', () => {
    const oct = project('2026-10');
    expect(oct.state).toBe('past');
    expect(oct.balances).toEqual({
      'a-cur': 2000,
      'a-joint': 500,
      'a-sav': 5000,
      'a-chf': 1000,
    });
    expect(oct.totalEur).toBe(8550);
  });
});
