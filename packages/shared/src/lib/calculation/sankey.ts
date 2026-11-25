/**
 * Sankey Month Flows Calculation
 *
 * Construit les nœuds et liens du mois pour le diagramme Sankey :
 * Revenus (entrées) → Comptes → Dépenses / Catégories.
 * Gère les transferts entre comptes et la consolidation inter-devises.
 *
 * @packageDocumentation
 */

import { Account } from '../../schemas/account';
import { Income } from '../../schemas/income';
import { Charge } from '../../schemas/charge';
import { Payment } from '../../schemas/payment';
import { Transaction } from '../../schemas/transaction';
import { Transfer } from '../../schemas/transfer';
import { counterValue } from '../../domain/conversion';
import { isChargeActiveInMonth } from '../../domain/schedule';
import {
  computeMonthExpectedIncome,
  type ConfirmedIncomeEntry,
} from '../../domain/income';

export interface SankeyNode {
  name: string;
}

export interface SankeyLink {
  source: number;
  target: number;
  value: number; // Valeur consolidée EUR
  nativeAmount?: number;
  nativeCurrency?: string;
  /** Flux « prévu » : échéance PENDING du mois, distincte du réalisé. */
  planned?: boolean;
}

export interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Total EUR consolidé de chaque nœud, dérivé des liens (M4, design D4) :
 * max(liens entrants, liens sortants) — le max évite de double-compter
 * les nœuds intermédiaires (comptes) traversés par le même flux.
 * Retourne un tableau indexé comme data.nodes.
 */
export function sankeyNodeTotals(data: SankeyData): number[] {
  const incoming = new Array<number>(data.nodes.length).fill(0);
  const outgoing = new Array<number>(data.nodes.length).fill(0);
  for (const link of data.links) {
    outgoing[link.source] += link.value;
    incoming[link.target] += link.value;
  }
  return data.nodes.map((_, i) => round2(Math.max(incoming[i], outgoing[i])));
}

/**
 * Montant de la jambe de transfert, dans la devise du compte cible.
 * Reçu réel si connu ; sinon estimation : même devise = montant envoyé,
 * CHF → EUR = contre-valeur au taux effectif, EUR → CHF = montant × taux estimé.
 */
function transferLegAmount(
  tr: Transfer,
  sourceCurrency: string,
  targetCurrency: string,
  rate: number
): number {
  if (tr.amountReceived != null) return tr.amountReceived;
  if (sourceCurrency === targetCurrency) return tr.amountSent;
  if (sourceCurrency === 'CHF') return counterValue(tr.amountSent, rate);
  return round2(tr.amountSent * tr.rateEstimated);
}

export function computeSankeyFlows(params: {
  accounts: Account[];
  transactions: Transaction[];
  transfers: Transfer[];
  payments: Payment[];
  charges: Charge[];
  incomes: Income[];
  monthKey: string;
  rate?: number | null;
}): SankeyData {
  const {
    accounts,
    transactions,
    transfers,
    payments,
    charges,
    incomes,
    monthKey,
    rate = 1,
  } = params;
  const effectiveRate = rate && rate > 0 ? rate : 1;

  const nodes: SankeyNode[] = [];
  const nodeIndexMap = new Map<string, number>();

  function getOrAddNode(name: string): number {
    const existing = nodeIndexMap.get(name);
    if (existing !== undefined) return existing;
    const index = nodes.length;
    nodes.push({ name });
    nodeIndexMap.set(name, index);
    return index;
  }

  const accountMap = new Map<string, Account>();
  for (const acc of accounts) {
    accountMap.set(acc.id, acc);
  }

  const chargeMap = new Map<string, Charge>();
  for (const c of charges) {
    chargeMap.set(c.id, c);
  }

  // Clé source->target->planned pour agréger les liens (le prévu doit
  // rester distinct du réalisé, design D2)
  type RawLink = {
    source: string;
    target: string;
    value: number;
    nativeAmount: number;
    nativeCurrency: string;
    planned: boolean;
  };
  const aggregatedLinks = new Map<string, RawLink>();

  function addLink(
    sourceName: string,
    targetName: string,
    amount: number,
    currency: string,
    planned = false
  ): void {
    if (amount <= 0 || sourceName === targetName) return;

    const consolidated =
      currency === 'CHF' ? counterValue(amount, effectiveRate) : amount;
    if (consolidated <= 0) return;

    const key = `${sourceName}:::${targetName}:::${planned}`;
    const existing = aggregatedLinks.get(key);
    if (existing) {
      existing.value = round2(existing.value + consolidated);
      existing.nativeAmount = round2(existing.nativeAmount + amount);
    } else {
      aggregatedLinks.set(key, {
        source: sourceName,
        target: targetName,
        value: round2(consolidated),
        nativeAmount: round2(amount),
        nativeCurrency: currency,
        planned,
      });
    }
  }

  // 1. Revenus : revenus attendus du mois (confirmé = réalisé, sinon prévu) → compte
  const confirmed: ConfirmedIncomeEntry[] = transactions.map((t) => ({
    incomeId: t.incomeId ?? null,
    budgetMonth: t.budgetMonth ?? null,
    amount: t.amount,
  }));
  const incomeById = new Map(incomes.map((i) => [i.id, i]));
  for (const entry of computeMonthExpectedIncome(incomes, confirmed, monthKey)
    .entries) {
    const income = incomeById.get(entry.incomeId);
    if (!income) continue;
    const account = accountMap.get(income.accountId);
    addLink(
      income.label,
      account ? account.name : 'Compte inconnu',
      entry.amount,
      entry.currency,
      !entry.confirmed
    );
  }

  // 2. Transferts : compte source → compte cible, dans la devise du compte cible
  // (jamais un revenu : le compte cible ne reçoit que la jambe de transfert)
  for (const tr of transfers) {
    const srcAccount = accountMap.get(tr.sourceAccountId);
    const tgtAccount = accountMap.get(tr.targetAccountId);
    const srcName = srcAccount ? srcAccount.name : 'Compte émetteur';
    const tgtName = tgtAccount ? tgtAccount.name : 'Compte récepteur';
    const sourceCurrency = srcAccount?.currency ?? 'EUR';
    const targetCurrency = tgtAccount?.currency ?? 'EUR';

    const legAmount = transferLegAmount(
      tr,
      sourceCurrency,
      targetCurrency,
      effectiveRate
    );
    addLink(srcName, tgtName, legAmount, targetCurrency);
  }

  // 3. Dépenses d'échéances : réalisées (PAID) et prévues (PENDING) —
  // compte → catégorie, le prévu portant planned: true (design D2)
  const reconciledTxIds = new Set<string>();
  for (const p of payments) {
    if (p.status === 'CANCELLED' || p.status === 'FAILED') continue;
    const planned = p.status !== 'PAID';
    if (p.status === 'PAID' && p.transactionId) {
      reconciledTxIds.add(p.transactionId);
    }

    const charge = chargeMap.get(p.chargeId);
    if (charge?.provisioned) continue;
    const account = charge ? accountMap.get(charge.accountId) : undefined;
    const accountName = account ? account.name : 'Compte débité';
    const categoryName = charge?.category ?? 'Charges';

    addLink(accountName, categoryName, p.amount, p.currency, planned);
  }

  // Provisions : une seule flèche compte → catégorie, au lissage mensuel
  for (const charge of charges) {
    if (!charge.provisioned || !isChargeActiveInMonth(charge, monthKey)) {
      continue;
    }
    const account = accountMap.get(charge.accountId);
    addLink(
      account ? account.name : 'Compte débité',
      charge.category ?? 'Charges',
      round2(charge.amount / 12),
      charge.currency,
      true
    );
  }

  // 4. Dépenses de transactions (hors transferts et hors réconciliations) : compte → catégorie
  for (const t of transactions) {
    if (t.transferId) continue;
    if (t.amount >= 0) continue;
    if (reconciledTxIds.has(t.id)) continue;

    const account = accountMap.get(t.accountId);
    const accountName = account ? account.name : 'Compte débité';
    const categoryName =
      t.category === null || t.category === '' ? 'Vie courante' : t.category;
    const currency = account?.currency ?? 'EUR';
    const absAmount = Math.abs(t.amount);

    addLink(accountName, categoryName, absAmount, currency);
  }

  if (aggregatedLinks.size === 0) {
    return { nodes: [], links: [] };
  }

  const links: SankeyLink[] = [];
  for (const raw of aggregatedLinks.values()) {
    const sourceIdx = getOrAddNode(raw.source);
    const targetIdx = getOrAddNode(raw.target);
    links.push({
      source: sourceIdx,
      target: targetIdx,
      value: raw.value,
      nativeAmount: raw.nativeAmount,
      nativeCurrency: raw.nativeCurrency,
      ...(raw.planned ? { planned: true } : {}),
    });
  }

  return { nodes, links };
}
