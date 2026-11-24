/**
 * Locked tests for 23-transfer-reconciles-joint-income: a transfer between
 * any two accounts is drawn as an account -> account link in the TARGET
 * account currency (never as income), so a joint account that only receives
 * transfers has an inflow and no invented income.
 *
 * @module Tests/Calculation/SankeyTransferLegs
 */
import { computeSankeyFlows } from '@mbongo/shared';
import type { Account, Transfer } from '@mbongo/shared';

const RATE = 0.5;

const account = (id: string, currency: 'CHF' | 'EUR'): Account =>
  ({ id, name: id, currency, status: 'ACTIVE' }) as Account;

const transfer = (overrides: Partial<Transfer>): Transfer =>
  ({
    id: 'tr-1',
    sourceAccountId: 'chf-a',
    targetAccountId: 'chf-b',
    amountSent: 1000,
    rateEstimated: 1,
    amountReceived: 1000,
    rateEffective: 1,
    fees: 0,
    status: 'COMPLETED',
    ...overrides,
  }) as Transfer;

const accounts = [
  account('chf-a', 'CHF'),
  account('chf-b', 'CHF'),
  account('eur-a', 'EUR'),
  account('eur-joint', 'EUR'),
];

const flowsFor = (
  transfers: Transfer[]
): ReturnType<typeof computeSankeyFlows> =>
  computeSankeyFlows({
    accounts,
    transactions: [],
    transfers,
    payments: [],
    charges: [],
    incomes: [],
    monthKey: '2026-11',
    rate: RATE,
  });

const link = (
  flows: ReturnType<typeof computeSankeyFlows>
): { from: string; to: string; value: number; currency: string } => {
  expect(flows.links).toHaveLength(1);
  const l = flows.links[0];
  return {
    from: flows.nodes[l.source].name,
    to: flows.nodes[l.target].name,
    value: l.value,
    currency: l.nativeCurrency,
  };
};

describe('computeSankeyFlows transfer legs', () => {
  it('converts a CHF -> CHF transfer from CHF to EUR (received amount is CHF)', () => {
    const l = link(flowsFor([transfer({})]));

    expect(l).toEqual({
      from: 'chf-a',
      to: 'chf-b',
      value: 500,
      currency: 'CHF',
    });
  });

  it('keeps an EUR -> EUR transfer to the joint account as an inflow, not income', () => {
    const flows = flowsFor([
      transfer({
        sourceAccountId: 'eur-a',
        targetAccountId: 'eur-joint',
        amountSent: 800,
        amountReceived: 800,
      }),
    ]);

    expect(link(flows)).toEqual({
      from: 'eur-a',
      to: 'eur-joint',
      value: 800,
      currency: 'EUR',
    });
  });

  it('draws an EUR -> CHF transfer at the received CHF amount converted to EUR', () => {
    const l = link(
      flowsFor([
        transfer({
          sourceAccountId: 'eur-a',
          targetAccountId: 'chf-a',
          amountSent: 1000,
          amountReceived: 900,
        }),
      ])
    );

    expect(l).toEqual({
      from: 'eur-a',
      to: 'chf-a',
      value: 450,
      currency: 'CHF',
    });
  });

  it('keeps the CHF -> EUR transfer as before (received EUR)', () => {
    const l = link(
      flowsFor([
        transfer({
          sourceAccountId: 'chf-a',
          targetAccountId: 'eur-a',
          amountSent: 1000,
          amountReceived: 950,
        }),
      ])
    );

    expect(l).toEqual({
      from: 'chf-a',
      to: 'eur-a',
      value: 950,
      currency: 'EUR',
    });
  });

  it('uses the sent amount in the target currency for an ESTIMATED same-currency transfer', () => {
    const l = link(
      flowsFor([transfer({ status: 'ESTIMATED', amountReceived: null })])
    );

    expect(l).toEqual({
      from: 'chf-a',
      to: 'chf-b',
      value: 500,
      currency: 'CHF',
    });
  });
});
