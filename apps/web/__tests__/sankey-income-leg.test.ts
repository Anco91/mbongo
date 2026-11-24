/**
 * Locked tests for 12-sankey-income-leg: the Sankey income leg is built from
 * the expected income of the month (confirmed amount, else planned), and the
 * closed-account scope also covers income sources.
 *
 * @module Tests/Calculation/SankeyIncomeLeg
 */
import { computeSankeyFlows, excludeClosedAccounts } from '@mbongo/shared';
import type { Account, Income, Transaction } from '@mbongo/shared';

const MONTH = '2026-11';
const RATE = 0.5;

const account = (
  id: string,
  currency: 'CHF' | 'EUR',
  status: 'ACTIVE' | 'CLOSED' = 'ACTIVE'
): Account => ({ id, name: id, currency, status }) as Account;

const income = (overrides: Partial<Income>): Income =>
  ({
    id: 'inc-1',
    label: 'Salaire',
    amount: 1000,
    currency: 'CHF',
    accountId: 'acc-chf',
    frequency: 'monthly',
    startDate: '2026-01-01',
    endDate: null,
    active: true,
    ...overrides,
  }) as Income;

const tx = (overrides: Partial<Transaction>): Transaction =>
  ({
    id: 't-1',
    accountId: 'acc-chf',
    amount: 1200,
    category: null,
    note: null,
    transferId: null,
    transferRole: null,
    incomeId: null,
    budgetMonth: null,
    ...overrides,
  }) as Transaction;

const accounts = [account('acc-chf', 'CHF'), account('acc-eur', 'EUR')];

const flowsFor = (
  incomes: Income[],
  transactions: Transaction[] = [],
  monthKey = MONTH
): ReturnType<typeof computeSankeyFlows> =>
  computeSankeyFlows({
    accounts,
    transactions,
    transfers: [],
    payments: [],
    charges: [],
    incomes,
    monthKey,
    rate: RATE,
  });

const nameOf = (
  flows: ReturnType<typeof computeSankeyFlows>,
  index: number
): string => flows.nodes[index].name;

describe('computeSankeyFlows income leg', () => {
  it('draws a due unconfirmed source as a planned link at its planned amount in EUR', () => {
    const flows = flowsFor([income({})]);

    expect(flows.links).toHaveLength(1);
    const [link] = flows.links;
    expect(nameOf(flows, link.source)).toBe('Salaire');
    expect(nameOf(flows, link.target)).toBe('acc-chf');
    expect(link.planned).toBe(true);
    expect(link.value).toBe(500);
  });

  it('draws a confirmed source once, realized, at the confirmed amount', () => {
    const flows = flowsFor(
      [income({})],
      [tx({ incomeId: 'inc-1', budgetMonth: MONTH, amount: 1200 })]
    );

    expect(flows.links).toHaveLength(1);
    expect(flows.links[0].planned).toBeUndefined();
    expect(flows.links[0].value).toBe(600);
  });

  it('keeps an EUR source unconverted', () => {
    const flows = flowsFor([
      income({ amount: 800, currency: 'EUR', accountId: 'acc-eur' }),
    ]);

    expect(flows.links[0].value).toBe(800);
  });

  it('ignores a positive transaction with neither transferId nor incomeId', () => {
    const flows = flowsFor([], [tx({ amount: 4400 })]);

    expect(flows.links).toEqual([]);
    expect(flows.nodes).toEqual([]);
  });

  it('ignores a transfer target leg', () => {
    const flows = flowsFor(
      [],
      [tx({ transferId: 'tr-1', transferRole: 'TARGET', amount: 900 })]
    );

    expect(flows.links).toEqual([]);
  });

  it('does not count an unmatched positive next to a planned source', () => {
    const flows = flowsFor([income({})], [tx({ amount: 4400 })]);

    expect(flows.links).toHaveLength(1);
    expect(flows.links[0].planned).toBe(true);
  });

  it('ignores an inactive source', () => {
    expect(flowsFor([income({ active: false })]).links).toEqual([]);
  });

  it('ignores a source not yet started in the month', () => {
    expect(flowsFor([income({ startDate: '2026-12-01' })]).links).toEqual([]);
  });

  it('ignores a source ended before the month', () => {
    expect(flowsFor([income({ endDate: '2026-10-31' })]).links).toEqual([]);
  });

  it('ignores a yearly source outside its anniversary month', () => {
    expect(
      flowsFor([income({ frequency: 'yearly', startDate: '2026-03-01' })]).links
    ).toEqual([]);
  });

  it('keeps the source planned when the confirmation belongs to another month', () => {
    const flows = flowsFor(
      [income({})],
      [tx({ incomeId: 'inc-1', budgetMonth: '2026-10', amount: 1200 })]
    );

    expect(flows.links).toHaveLength(1);
    expect(flows.links[0].planned).toBe(true);
    expect(flows.links[0].value).toBe(500);
  });
});

describe('excludeClosedAccounts incomes', () => {
  const base = {
    accounts: [account('open', 'EUR'), account('shut', 'EUR', 'CLOSED')],
    transactions: [],
    transfers: [],
    charges: [],
    payments: [],
  };

  it('drops the sources pointing at a closed account', () => {
    const out = excludeClosedAccounts({
      ...base,
      incomes: [
        income({ id: 'i-open', accountId: 'open' }),
        income({ id: 'i-shut', accountId: 'shut' }),
      ],
    });

    expect(out.incomes?.map((i) => i.id)).toEqual(['i-open']);
  });

  it('keeps every source when all accounts are active', () => {
    const incomes = [income({ accountId: 'open' })];
    const out = excludeClosedAccounts({
      ...base,
      accounts: [account('open', 'EUR')],
      incomes,
    });

    expect(out.incomes).toEqual(incomes);
  });

  it('does not mutate its input incomes', () => {
    const incomes = [
      income({ id: 'i-shut', accountId: 'shut' }),
      income({ id: 'i-open', accountId: 'open' }),
    ];
    excludeClosedAccounts({ ...base, incomes });

    expect(incomes).toHaveLength(2);
  });
});
