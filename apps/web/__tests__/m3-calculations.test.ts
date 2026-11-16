/**
 * M3 Shared Calculations and Domain Logic Tests
 *
 * Covers:
 * - Sankey month flows
 * - Donut category expenses
 * - Consolidated EUR/CHF balance
 * - Financial alerts
 * - Provisions and anti-double-counting
 * - Installment remaining balance
 *
 * @module Tests/M3/Calculations
 */

import {
  computeConsolidatedBalance,
  findLatestRate,
  computeDonutExpenses,
  computeSankeyFlows,
  computeAlerts,
  computeMonthlyBudget,
  remainingBalance,
  monthlyProvision,
  type Account,
  type Charge,
  type Payment,
  type Transaction,
  type Transfer,
} from '@mbongo/shared';

describe('Consolidated Balance (consolidated.ts)', () => {
  const activeAccounts: Account[] = [
    {
      id: 'acc-chf',
      name: 'UBS CHF',
      currency: 'CHF',
      accountType: 'CURRENT',
      openingBalance: 1000,
      overdraftLimit: 0,
      deferredCard: false,
      billingDay: null,
      linkedAccountId: null,
      memberId: 'm1',
      bank: 'UBS',
      status: 'ACTIVE',
      closedAt: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'acc-eur',
      name: 'Bourso EUR',
      currency: 'EUR',
      accountType: 'CURRENT',
      openingBalance: 2000,
      overdraftLimit: 500,
      deferredCard: false,
      billingDay: null,
      linkedAccountId: null,
      memberId: 'm1',
      bank: 'BoursoBank',
      status: 'ACTIVE',
      closedAt: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ];

  it('extracts latest effective rate from completed transfers', () => {
    const transfers: Transfer[] = [
      {
        id: 'tr-1',
        sourceAccountId: 'acc-chf',
        targetAccountId: 'acc-eur',
        amountSent: 1000,
        amountReceived: 950,
        rateEstimated: 0.94,
        rateEffective: 0.95,
        rateDate: '2026-11-01T00:00:00.000Z',
        sentAt: '2026-11-01T00:00:00.000Z',
        receivedAt: '2026-11-02T00:00:00.000Z',
        status: 'COMPLETED',
        fees: 0,
        memo: null,
        createdAt: '2026-11-01T00:00:00.000Z',
        updatedAt: '2026-11-02T00:00:00.000Z',
      },
      {
        id: 'tr-2',
        sourceAccountId: 'acc-chf',
        targetAccountId: 'acc-eur',
        amountSent: 500,
        amountReceived: null,
        rateEstimated: 0.93,
        rateEffective: null,
        rateDate: '2026-11-10T00:00:00.000Z',
        sentAt: '2026-11-10T00:00:00.000Z',
        receivedAt: null,
        status: 'ESTIMATED',
        fees: null,
        memo: null,
        createdAt: '2026-11-10T00:00:00.000Z',
        updatedAt: '2026-11-10T00:00:00.000Z',
      },
    ];

    const rate = findLatestRate(transfers);
    expect(rate).toEqual({
      rate: 0.95,
      rateDate: '2026-11-02T00:00:00.000Z',
    });
  });

  it('computes consolidated EUR with CHF parallel', () => {
    const balances = {
      'acc-chf': 1500,
      'acc-eur': 2000,
    };
    const transfers: Transfer[] = [
      {
        id: 'tr-1',
        sourceAccountId: 'acc-chf',
        targetAccountId: 'acc-eur',
        amountSent: 1000,
        amountReceived: 920,
        rateEstimated: 0.92,
        rateEffective: 0.92,
        rateDate: '2026-11-01T00:00:00.000Z',
        sentAt: '2026-11-01T00:00:00.000Z',
        receivedAt: '2026-11-02T00:00:00.000Z',
        status: 'COMPLETED',
        fees: 0,
        memo: null,
        createdAt: '2026-11-01T00:00:00.000Z',
        updatedAt: '2026-11-02T00:00:00.000Z',
      },
    ];

    const res = computeConsolidatedBalance(activeAccounts, balances, transfers);
    expect(res.isAvailable).toBe(true);
    expect(res.totalChf).toBe(1500);
    // 2000 EUR + counterValue(1500, 0.92) = 2000 + 1380 = 3380 EUR
    expect(res.totalEur).toBe(3380);
    expect(res.rate).toBe(0.92);
  });

  it('returns isAvailable false when no rate is available', () => {
    const res = computeConsolidatedBalance(activeAccounts, {}, []);
    expect(res.isAvailable).toBe(false);
    expect(res.totalEur).toBeNull();
    expect(res.totalChf).toBe(1000);
  });
});

describe('Donut Expenses (donut.ts)', () => {
  const charges: Charge[] = [
    {
      id: 'c1',
      label: 'Loyer',
      type: 'FIXED_RECURRING',
      amount: 1500,
      currency: 'CHF',
      accountId: 'acc-chf',
      category: 'Logement',
      startDate: '2026-01-01',
      endDate: null,
      frequency: 'monthly',
      installments: null,
      provisioned: false,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ];

  it('aggregates expenses by category with native and consolidated amounts', () => {
    const payments: Payment[] = [
      {
        id: 'p1',
        chargeId: 'c1',
        amount: 1500,
        currency: 'CHF',
        dueDate: '2026-11-01T00:00:00.000Z',
        status: 'PAID',
        paidAt: '2026-11-01T00:00:00.000Z',
        transactionId: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-11-01T00:00:00.000Z',
      },
    ];
    const transactions: Transaction[] = [
      {
        id: 't1',
        accountId: 'acc-eur',
        amount: -50,
        category: 'Vie courante',
        date: '2026-11-05T00:00:00.000Z',
        note: 'Courses',
        transferId: null,
        transferRole: null,
        createdAt: '2026-11-05T00:00:00.000Z',
        updatedAt: '2026-11-05T00:00:00.000Z',
      },
    ];

    const result = computeDonutExpenses({
      payments,
      charges,
      transactions,
      rate: 0.95,
    });

    expect(result).toHaveLength(2);
    // 1500 * 0.95 = 1425 EUR for Logement
    const logement = result.find((r) => r.name === 'Logement');
    expect(logement?.value).toBe(1425);
    expect(logement?.nativeChf).toBe(1500);

    const vie = result.find((r) => r.name === 'Vie courante');
    expect(vie?.value).toBe(50);
    expect(vie?.nativeEur).toBe(50);
  });

  it('does not duplicate reconciled payments and transactions', () => {
    const payments: Payment[] = [
      {
        id: 'p1',
        chargeId: 'c1',
        amount: 1500,
        currency: 'CHF',
        dueDate: '2026-11-01T00:00:00.000Z',
        status: 'PAID',
        paidAt: '2026-11-01T00:00:00.000Z',
        transactionId: 't-reconciled',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-11-01T00:00:00.000Z',
      },
    ];
    const transactions: Transaction[] = [
      {
        id: 't-reconciled',
        accountId: 'acc-chf',
        amount: -1500,
        category: 'Logement',
        date: '2026-11-01T00:00:00.000Z',
        note: 'Virement loyer',
        transferId: null,
        transferRole: null,
        createdAt: '2026-11-01T00:00:00.000Z',
        updatedAt: '2026-11-01T00:00:00.000Z',
      },
    ];

    const result = computeDonutExpenses({
      payments,
      charges,
      transactions,
      rate: 1,
    });

    expect(result).toHaveLength(1);
    expect(result[0].value).toBe(1500);
  });
});

describe('Sankey Month Flows (sankey.ts)', () => {
  const accounts: Account[] = [
    {
      id: 'acc-chf',
      name: 'UBS CHF',
      currency: 'CHF',
      accountType: 'CURRENT',
      openingBalance: 0,
      overdraftLimit: 0,
      deferredCard: false,
      billingDay: null,
      linkedAccountId: null,
      memberId: 'm1',
      bank: 'UBS',
      status: 'ACTIVE',
      closedAt: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'acc-eur',
      name: 'BNP Joint',
      currency: 'EUR',
      accountType: 'CURRENT',
      openingBalance: 0,
      overdraftLimit: 0,
      deferredCard: false,
      billingDay: null,
      linkedAccountId: null,
      memberId: 'm1',
      bank: 'BNP',
      status: 'ACTIVE',
      closedAt: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ];

  it('constructs incomes, transfers, and expense links', () => {
    const transactions: Transaction[] = [
      {
        id: 't-inc',
        accountId: 'acc-chf',
        amount: 5000,
        category: 'Revenus',
        date: '2026-11-01T00:00:00.000Z',
        note: 'Salaire Anco',
        transferId: null,
        transferRole: null,
        createdAt: '2026-11-01T00:00:00.000Z',
        updatedAt: '2026-11-01T00:00:00.000Z',
      },
    ];
    const transfers: Transfer[] = [
      {
        id: 'tr-1',
        sourceAccountId: 'acc-chf',
        targetAccountId: 'acc-eur',
        amountSent: 2000,
        amountReceived: 1850,
        rateEstimated: 0.925,
        rateEffective: 0.925,
        rateDate: '2026-11-02T00:00:00.000Z',
        sentAt: '2026-11-02T00:00:00.000Z',
        receivedAt: '2026-11-03T00:00:00.000Z',
        status: 'COMPLETED',
        fees: 0,
        memo: null,
        createdAt: '2026-11-02T00:00:00.000Z',
        updatedAt: '2026-11-03T00:00:00.000Z',
      },
    ];

    const flows = computeSankeyFlows({
      accounts,
      transactions,
      transfers,
      payments: [],
      charges: [],
      rate: 0.925,
    });

    expect(flows.nodes.length).toBeGreaterThanOrEqual(3);
    expect(flows.links.length).toBe(2);
    // Link 1: Salaire Anco -> UBS CHF (5000 * 0.925 = 4625 EUR)
    expect(flows.links[0].value).toBe(4625);
    // Link 2: UBS CHF -> BNP Joint (1850 EUR)
    expect(flows.links[1].value).toBe(1850);
  });

  it('handles empty case cleanly without error', () => {
    const flows = computeSankeyFlows({
      accounts: [],
      transactions: [],
      transfers: [],
      payments: [],
      charges: [],
    });
    expect(flows.nodes).toEqual([]);
    expect(flows.links).toEqual([]);
  });
});

describe('Financial Alerts (alerts.ts)', () => {
  const now = new Date('2026-11-15T12:00:00.000Z');
  const accounts: Account[] = [
    {
      id: 'acc-eur',
      name: 'Bourso EUR',
      currency: 'EUR',
      accountType: 'CURRENT',
      openingBalance: 0,
      overdraftLimit: 500,
      deferredCard: false,
      billingDay: null,
      linkedAccountId: null,
      memberId: 'm1',
      bank: 'BoursoBank',
      status: 'ACTIVE',
      closedAt: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'acc-chf',
      name: 'UBS CHF',
      currency: 'CHF',
      accountType: 'CURRENT',
      openingBalance: 0,
      overdraftLimit: 0,
      deferredCard: false,
      billingDay: null,
      linkedAccountId: null,
      memberId: 'm1',
      bank: 'UBS',
      status: 'ACTIVE',
      closedAt: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ];

  it('triggers DUE_SOON for payment due within 7 days', () => {
    const payments: Payment[] = [
      {
        id: 'p-due-soon',
        chargeId: 'c-rent',
        amount: 800,
        currency: 'EUR',
        dueDate: '2026-11-18T00:00:00.000Z', // J+3
        status: 'PENDING',
        paidAt: null,
        transactionId: null,
        createdAt: '2026-11-01T00:00:00.000Z',
        updatedAt: '2026-11-01T00:00:00.000Z',
      },
      {
        id: 'p-far',
        chargeId: 'c-rent',
        amount: 800,
        currency: 'EUR',
        dueDate: '2026-11-30T00:00:00.000Z', // J+15
        status: 'PENDING',
        paidAt: null,
        transactionId: null,
        createdAt: '2026-11-01T00:00:00.000Z',
        updatedAt: '2026-11-01T00:00:00.000Z',
      },
    ];

    const alerts = computeAlerts({
      accounts,
      balances: { 'acc-eur': 1000 },
      payments,
      asOf: now,
    });

    expect(alerts.some((a) => a.id === 'due-soon-p-due-soon')).toBe(true);
    expect(alerts.some((a) => a.id === 'due-soon-p-far')).toBe(false);
  });

  it('triggers OVERDRAFT_APPROACH when balance <= -70% overdraft', () => {
    // 500 limit -> 70% = -350
    const alerts = computeAlerts({
      accounts,
      balances: { 'acc-eur': -380 },
      payments: [],
      asOf: now,
    });

    const approach = alerts.find((a) => a.type === 'OVERDRAFT_APPROACH');
    expect(approach).toBeDefined();
    expect(approach?.severity).toBe('warning');
  });

  it('triggers OVERDRAFT_EXCEEDED when balance < -limit', () => {
    const alerts = computeAlerts({
      accounts,
      balances: { 'acc-eur': -550 },
      payments: [],
      asOf: now,
    });

    const exceeded = alerts.find((a) => a.type === 'OVERDRAFT_EXCEEDED');
    expect(exceeded).toBeDefined();
    expect(exceeded?.severity).toBe('danger');
  });

  it('sorts alerts by severity (danger first)', () => {
    const payments: Payment[] = [
      {
        id: 'p1',
        chargeId: 'c1',
        amount: 100,
        currency: 'EUR',
        dueDate: '2026-11-18T00:00:00.000Z', // warning/info
        status: 'PENDING',
        paidAt: null,
        transactionId: null,
        createdAt: '2026-11-01T00:00:00.000Z',
        updatedAt: '2026-11-01T00:00:00.000Z',
      },
    ];
    const alerts = computeAlerts({
      accounts,
      balances: { 'acc-eur': -550 }, // danger
      payments,
      asOf: now,
    });

    expect(alerts[0].severity).toBe('danger');
  });
});

describe('Provisions & Remaining Balance (schedule.ts)', () => {
  const chargeProvisioned: Charge = {
    id: 'c-serafe',
    label: 'SERAFE',
    type: 'UPCOMING',
    amount: 335,
    currency: 'CHF',
    accountId: 'acc-chf',
    category: 'Médias',
    startDate: '2026-01-01',
    endDate: null,
    frequency: null,
    installments: null,
    provisioned: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  const chargeRegular: Charge = {
    id: 'c-loyer',
    label: 'Loyer',
    type: 'FIXED_RECURRING',
    amount: 1850,
    currency: 'CHF',
    accountId: 'acc-chf',
    category: 'Logement',
    startDate: '2026-01-01',
    endDate: null,
    frequency: 'monthly',
    installments: null,
    provisioned: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  it('calculates monthly provision = amount / 12', () => {
    expect(monthlyProvision([chargeProvisioned])).toBe(27.92);
  });

  it('anti-double-counting: excludes provisioned charge payments from month total', () => {
    const month = new Date('2026-11-01');
    const payments: Payment[] = [
      {
        id: 'p-loyer',
        chargeId: 'c-loyer',
        amount: 1850,
        currency: 'CHF',
        dueDate: '2026-11-01T00:00:00.000Z',
        status: 'PENDING',
        paidAt: null,
        transactionId: null,
        createdAt: '2026-11-01T00:00:00.000Z',
        updatedAt: '2026-11-01T00:00:00.000Z',
      },
      {
        id: 'p-serafe-real',
        chargeId: 'c-serafe',
        amount: 335,
        currency: 'CHF',
        dueDate: '2026-11-20T00:00:00.000Z',
        status: 'PENDING',
        paidAt: null,
        transactionId: null,
        createdAt: '2026-11-01T00:00:00.000Z',
        updatedAt: '2026-11-01T00:00:00.000Z',
      },
    ];

    const budget = computeMonthlyBudget(
      [chargeProvisioned, chargeRegular],
      payments,
      month
    );

    // SERAFE's 335 CHF real payment must NOT be in regular payments sum (1850)
    expect(budget.paymentsTotal).toBe(1850);
    expect(budget.provisionsTotal).toBe(27.92);
    expect(budget.total).toBe(1877.92);
  });

  it('remainingBalance calculates remaining balance for installment charge', () => {
    const chargeInstallment: Charge = {
      id: 'c-impot',
      label: 'Impôt 4x',
      type: 'INSTALLMENT',
      amount: 1200,
      currency: 'EUR',
      accountId: 'acc-eur',
      category: 'Impôts',
      startDate: '2026-09-01',
      endDate: null,
      frequency: null,
      installments: 4,
      provisioned: false,
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z',
    };

    const payments: Payment[] = [
      {
        id: 'p1',
        chargeId: 'c-impot',
        amount: 300,
        currency: 'EUR',
        dueDate: '2026-09-25T00:00:00.000Z',
        status: 'PAID',
        paidAt: '2026-09-25T00:00:00.000Z',
        transactionId: null,
        createdAt: '2026-09-01T00:00:00.000Z',
        updatedAt: '2026-09-01T00:00:00.000Z',
      },
      {
        id: 'p2',
        chargeId: 'c-impot',
        amount: 300,
        currency: 'EUR',
        dueDate: '2026-10-25T00:00:00.000Z',
        status: 'PAID',
        paidAt: '2026-10-25T00:00:00.000Z',
        transactionId: null,
        createdAt: '2026-09-01T00:00:00.000Z',
        updatedAt: '2026-09-01T00:00:00.000Z',
      },
      {
        id: 'p3',
        chargeId: 'c-impot',
        amount: 300,
        currency: 'EUR',
        dueDate: '2026-11-25T00:00:00.000Z',
        status: 'PENDING',
        paidAt: null,
        transactionId: null,
        createdAt: '2026-09-01T00:00:00.000Z',
        updatedAt: '2026-09-01T00:00:00.000Z',
      },
    ];

    expect(remainingBalance(chargeInstallment, payments)).toBe(600);
  });
});
