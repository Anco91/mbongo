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
import { Charge } from '../../schemas/charge';
import { Payment } from '../../schemas/payment';
import { Transaction } from '../../schemas/transaction';
import { Transfer } from '../../schemas/transfer';
import { counterValue } from '../../domain/conversion';

export interface SankeyNode {
  name: string;
}

export interface SankeyLink {
  source: number;
  target: number;
  value: number; // Valeur consolidée EUR
  nativeAmount?: number;
  nativeCurrency?: string;
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

export function computeSankeyFlows(params: {
  accounts: Account[];
  transactions: Transaction[];
  transfers: Transfer[];
  payments: Payment[];
  charges: Charge[];
  rate?: number | null;
}): SankeyData {
  const {
    accounts,
    transactions,
    transfers,
    payments,
    charges,
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

  // Clé source->target pour agréger les liens
  type RawLink = {
    source: string;
    target: string;
    value: number;
    nativeAmount: number;
    nativeCurrency: string;
  };
  const aggregatedLinks = new Map<string, RawLink>();

  function addLink(
    sourceName: string,
    targetName: string,
    amount: number,
    currency: string
  ): void {
    if (amount <= 0 || sourceName === targetName) return;

    const consolidated =
      currency === 'CHF' ? counterValue(amount, effectiveRate) : amount;
    if (consolidated <= 0) return;

    const key = `${sourceName}:::${targetName}`;
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
      });
    }
  }

  // 1. Revenus : transactions positives (hors transferts) → compte
  for (const t of transactions) {
    if (t.transferId) continue;
    if (t.amount <= 0) continue;

    const account = accountMap.get(t.accountId);
    const accountName = account ? account.name : 'Compte inconnu';
    const sourceName = t.note || t.category || 'Revenus';
    const currency = account?.currency ?? 'EUR';

    addLink(sourceName, accountName, t.amount, currency);
  }

  // 2. Transferts : compte source → Telexoo (ou compte cible directement)
  for (const tr of transfers) {
    const srcAccount = accountMap.get(tr.sourceAccountId);
    const tgtAccount = accountMap.get(tr.targetAccountId);
    const srcName = srcAccount ? srcAccount.name : 'Compte émetteur';
    const tgtName = tgtAccount ? tgtAccount.name : 'Compte récepteur';

    const receivedEur = tr.amountReceived ?? counterValue(tr.amountSent, effectiveRate);
    addLink(srcName, tgtName, receivedEur, 'EUR');
  }

  // 3. Dépenses d'échéances payées : compte → catégorie
  const reconciledTxIds = new Set<string>();
  for (const p of payments) {
    if (p.status !== 'PAID') continue;
    if (p.transactionId) reconciledTxIds.add(p.transactionId);

    const charge = chargeMap.get(p.chargeId);
    const account = charge ? accountMap.get(charge.accountId) : undefined;
    const accountName = account ? account.name : 'Compte débité';
    const categoryName = charge?.category || 'Charges';

    addLink(accountName, categoryName, p.amount, p.currency);
  }

  // 4. Dépenses de transactions (hors transferts et hors réconciliations) : compte → catégorie
  for (const t of transactions) {
    if (t.transferId) continue;
    if (t.amount >= 0) continue;
    if (reconciledTxIds.has(t.id)) continue;

    const account = accountMap.get(t.accountId);
    const accountName = account ? account.name : 'Compte débité';
    const categoryName = t.category || 'Vie courante';
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
    });
  }

  return { nodes, links };
}
