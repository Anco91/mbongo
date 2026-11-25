/**
 * Spec 43 — saved month start balance anchors the projection (locked).
 *
 * Fixture: `__tests__/stubs/budget-journey-fixture.ts`. Today = 2026-11-15.
 * Rule: for an ACTIVE account with a start override in a current or future
 * month, balance at end of month = override + every flow dated inside that
 * month (transactions, unconfirmed due income, PENDING payments due, missing
 * TARGET leg of an ESTIMATED transfer). Flows of earlier months are already in
 * the saved start. Accounts without override and past months are unchanged.
 *
 * Expected (native, end Nov, from the spec 38 base: cur 770, joint -1300,
 * sav 5000, chf 9100):
 * - cur 1000: -30 phone -1200 insurance = -230
 * - joint 300: -900 rent paid Nov 3 (overdue Oct rent is in the start) = -600
 * - chf 500: +4100 (Dec salary, Nov 20) +4000 (Nov salary) = 8600
 * - all three: -230 -600 +5000 +8600 CHF x 1.05 (9030) = 13200
 * End Dec: cur 600 -30 = 570; joint -1000 -900 = -1900; chf 2000 (the Dec
 * salary booked on Nov 20 is in the start, not a Dec flow).
 */
import {
  computeProjectedBalance,
  type Transaction,
  type Transfer,
  type Payment,
} from '@mbongo/shared';
import {
  ACCOUNTS,
  CHARGES,
  INCOMES,
  PAYMENTS,
  P_PHONE_NOV_PAID,
  RATE,
  TODAY,
  TR_PLANNED,
  T_PHONE_NOV,
  T_RENT_NOV,
  T_SALARY_DEC_EARLY,
  T_TR_PLAN_SRC,
} from '../stubs/budget-journey-fixture';

const BASE_TX: Transaction[] = [T_RENT_NOV, T_SALARY_DEC_EARLY];

interface Options {
  startOverrides?: Record<string, number>;
  transactions?: Transaction[];
  transfers?: Transfer[];
  payments?: Payment[];
}

function project(monthKey: string, opts: Options = {}) {
  return computeProjectedBalance({
    accounts: ACCOUNTS,
    transactions: opts.transactions ?? BASE_TX,
    transfers: opts.transfers ?? [],
    payments: opts.payments ?? PAYMENTS,
    charges: CHARGES,
    incomes: INCOMES,
    today: TODAY,
    monthKey,
    rate: RATE,
    startOverrides: opts.startOverrides,
  });
}

describe('computeProjectedBalance with saved start balances — current month', () => {
  it('leaves the projection unchanged without overrides', () => {
    expect(project('2026-11', { startOverrides: {} })).toEqual(
      project('2026-11')
    );
  });

  it('anchors a current account on its start plus the month flows', () => {
    const { balances } = project('2026-11', {
      startOverrides: { 'a-cur': 1000 },
    });
    expect(balances['a-cur']).toBe(-230);
  });

  it('leaves out payments overdue from earlier months (already in the start)', () => {
    const { balances } = project('2026-11', {
      startOverrides: { 'a-joint': 300 },
    });
    expect(balances['a-joint']).toBe(-600);
  });

  it('adds the unconfirmed due income and the early confirmed one of the month', () => {
    const { balances } = project('2026-11', {
      startOverrides: { 'a-chf': 500 },
    });
    expect(balances['a-chf']).toBe(8600);
  });

  it('leaves the accounts without override on the real-to-date path', () => {
    const { balances } = project('2026-11', {
      startOverrides: { 'a-cur': 1000 },
    });
    expect(balances['a-sav']).toBe(5000);
    expect(balances['a-joint']).toBe(-1300);
  });

  it('feeds the consolidated total with the anchored balances', () => {
    const { totalEur } = project('2026-11', {
      startOverrides: { 'a-cur': 1000, 'a-joint': 300, 'a-chf': 500 },
    });
    expect(totalEur).toBe(13200);
  });

  it('counts a month transaction booked before today once, never twice', () => {
    const { balances } = project('2026-11', {
      startOverrides: { 'a-cur': 1000 },
      transactions: [...BASE_TX, T_PHONE_NOV],
      payments: PAYMENTS.map((p) =>
        p.id === P_PHONE_NOV_PAID.id ? P_PHONE_NOV_PAID : p
      ),
    });
    expect(balances['a-cur']).toBe(-230);
  });

  it('adds the missing target leg of a transfer planned in the month', () => {
    const { balances } = project('2026-11', {
      startOverrides: { 'a-cur': 1000, 'a-chf': 500 },
      transactions: [...BASE_TX, T_TR_PLAN_SRC],
      transfers: [TR_PLANNED],
    });
    expect(balances['a-cur']).toBe(295);
    expect(balances['a-chf']).toBe(8100);
  });
});

describe('computeProjectedBalance with saved start balances — other months', () => {
  it('anchors a future month on its own start and its own flows only', () => {
    const { balances, state } = project('2026-12', {
      startOverrides: { 'a-cur': 600, 'a-joint': -1000 },
    });
    expect(state).toBe('future');
    expect(balances['a-cur']).toBe(570);
    expect(balances['a-joint']).toBe(-1900);
  });

  it('leaves out a flow booked in an earlier month that points at this one', () => {
    const { balances } = project('2026-12', {
      startOverrides: { 'a-chf': 2000 },
    });
    expect(balances['a-chf']).toBe(2000);
  });

  it('ignores the overrides of a past month (real balance as of its end)', () => {
    const withOverride = project('2026-10', {
      startOverrides: { 'a-cur': 1 },
    });
    expect(withOverride).toEqual(project('2026-10'));
  });

  it('ignores an override for an unknown or closed account', () => {
    const { balances } = project('2026-11', {
      startOverrides: { nope: 10, 'a-old': 10 },
    });
    expect(Object.keys(balances)).not.toContain('nope');
    expect(Object.keys(balances)).not.toContain('a-old');
    expect(balances).toEqual(project('2026-11').balances);
  });
});
