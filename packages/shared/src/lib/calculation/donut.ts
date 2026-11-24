/**
 * Donut Expenses by Category Calculation
 *
 * Agrège les dépenses du mois par catégorie pour le graphique en donut.
 * Supporte les montants natifs (EUR et CHF) et le total consolidé en EUR.
 *
 * @packageDocumentation
 */

import { Charge } from '../../schemas/charge';
import { Payment } from '../../schemas/payment';
import { Transaction } from '../../schemas/transaction';
import { counterValue } from '../../domain/conversion';

/** Ligne de ventilation d'un segment : une sous-catégorie, en EUR consolidé. */
export interface SubcategoryExpense {
  name: string;
  value: number;
}

/** Nom de la ligne qui regroupe les dépenses sans sous-catégorie. */
export const OTHER_SUBCATEGORY = 'Autres';

export interface CategoryExpense {
  name: string;
  value: number; // Consolidé EUR
  nativeEur: number;
  nativeChf: number;
  color: string;
  /** Part « prévue » : échéances PENDING du mois, distincte du réalisé. */
  planned?: boolean;
  /** Ventilation par sous-catégorie, montant décroissant ; absente si aucune n'est renseignée. */
  subcategories?: SubcategoryExpense[];
}

function sortSubcategories(
  entries: readonly SubcategoryExpense[]
): SubcategoryExpense[] {
  return [...entries].sort(
    (x, y) => y.value - x.value || x.name.localeCompare(y.name)
  );
}

/**
 * Fusionne les segments de même nom (prévu + réalisé), ventilation comprise.
 * Ordre de première apparition ; `planned` retiré ; entrée jamais modifiée.
 */
export function mergeCategorySegments<
  T extends {
    name: string;
    value: number;
    subcategories?: SubcategoryExpense[];
  },
>(segments: readonly T[]): T[] {
  const merged = new Map<
    string,
    { base: T; value: number; subs: Map<string, number> | null }
  >();
  for (const segment of segments) {
    const entry = merged.get(segment.name) ?? {
      base: segment,
      value: 0,
      subs: null,
    };
    entry.value += segment.value;
    if (segment.subcategories) {
      const subs = entry.subs ?? new Map<string, number>();
      for (const sub of segment.subcategories) {
        subs.set(sub.name, (subs.get(sub.name) ?? 0) + sub.value);
      }
      entry.subs = subs;
    }
    merged.set(segment.name, entry);
  }
  return [...merged.values()].map(({ base, value, subs }) => {
    const {
      planned: _planned,
      subcategories: _subs,
      ...rest
    } = base as T & {
      planned?: boolean;
    };
    void _planned;
    void _subs;
    const result = { ...rest, value: round2(value) } as T;
    if (subs) {
      result.subcategories = sortSubcategories(
        [...subs].map(([name, v]) => ({ name, value: round2(v) }))
      );
    }
    return result;
  });
}

const DEFAULT_CATEGORY_COLORS: Record<string, string> = {
  Logement: '#0f766e',
  'Santé (LaMaL)': '#0891b2',
  Santé: '#0891b2',
  'Impôts & taxes': '#7c3aed',
  Impôts: '#7c3aed',
  Assurances: '#2563eb',
  Abonnements: '#64748b',
  'Vie courante': '#f59e0b',
  Épargne: '#059669',
  Alimentation: '#f59e0b',
  Transports: '#3b82f6',
  Loisirs: '#ec4899',
};

const PALETTE = [
  '#0f766e',
  '#0891b2',
  '#7c3aed',
  '#2563eb',
  '#64748b',
  '#f59e0b',
  '#059669',
  '#ec4899',
  '#8b5cf6',
  '#10b981',
];

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function computeDonutExpenses(params: {
  payments?: Payment[];
  charges?: Charge[];
  transactions?: Transaction[];
  rate?: number | null;
}): CategoryExpense[] {
  const { payments = [], charges = [], transactions = [], rate = 1 } = params;
  const effectiveRate = rate && rate > 0 ? rate : 1;

  const chargeMap = new Map<string, Charge>();
  for (const c of charges) {
    chargeMap.set(c.id, c);
  }

  // Stocker par nom de catégorie + planned : { eur: number, chf: number }
  // (le prévu reste une part distincte du réalisé, design D2)
  type Amounts = { eur: number; chf: number };
  const totals = new Map<string, Amounts & { subs: Map<string, Amounts> }>();

  function addExpense(
    cat: string,
    amount: number,
    currency: string,
    planned: boolean,
    subcategory: string = OTHER_SUBCATEGORY
  ): void {
    if (amount <= 0) return;
    const key = `${cat}:::${planned}`;
    const existing = totals.get(key) ?? {
      eur: 0,
      chf: 0,
      subs: new Map<string, Amounts>(),
    };
    const sub = existing.subs.get(subcategory) ?? { eur: 0, chf: 0 };
    if (currency === 'CHF') {
      existing.chf += amount;
      sub.chf += amount;
    } else {
      existing.eur += amount;
      sub.eur += amount;
    }
    existing.subs.set(subcategory, sub);
    totals.set(key, existing);
  }

  // 1. Échéances du mois : réalisées (PAID) et prévues (PENDING), non
  // rapprochées d'une transaction ci-dessous
  const reconciledTxIds = new Set<string>();
  for (const p of payments) {
    if (p.status === 'CANCELLED' || p.status === 'FAILED') continue;
    const planned = p.status !== 'PAID';
    if (p.status === 'PAID' && p.transactionId) {
      reconciledTxIds.add(p.transactionId);
    }
    const charge = chargeMap.get(p.chargeId);
    const category = charge?.category ?? 'Autres';
    addExpense(
      category,
      p.amount,
      p.currency,
      planned,
      charge?.subcategory ?? OTHER_SUBCATEGORY
    );
  }

  // 2. Transactions du mois (dépenses pures non liées à un transfert ou déjà comptées via échéance)
  for (const t of transactions) {
    if (t.transferId) continue; // Ignorer les mouvements de transfert interne
    if (reconciledTxIds.has(t.id)) continue; // Déjà compté via l'échéance rapprochée
    if (t.amount >= 0) continue; // Seules les sorties sont des dépenses

    const category =
      t.category === null || t.category === '' ? 'Autres' : t.category;
    const absAmount = Math.abs(t.amount);
    // Supposer EUR par défaut si non spécifié sur transaction (dépend du compte)
    addExpense(category, absAmount, 'EUR', false);
  }

  const result: CategoryExpense[] = [];
  const nameColors = new Map<string, string>();
  let colorIndex = 0;

  for (const [key, amounts] of totals.entries()) {
    const name = key.slice(0, key.lastIndexOf(':::'));
    const planned = key.endsWith(':::true');
    const nativeEur = round2(amounts.eur);
    const nativeChf = round2(amounts.chf);
    const consolidatedEur = round2(
      nativeEur + counterValue(nativeChf, effectiveRate)
    );

    if (consolidatedEur > 0) {
      // Une couleur par catégorie : la part prévue partage celle du réalisé.
      let color = nameColors.get(name);
      if (!color) {
        color =
          DEFAULT_CATEGORY_COLORS[name] ?? PALETTE[colorIndex % PALETTE.length];
        colorIndex += 1;
        nameColors.set(name, color);
      }

      const subcategories = sortSubcategories(
        [...amounts.subs].map(([subName, sub]) => ({
          name: subName,
          value: round2(
            round2(sub.eur) + counterValue(round2(sub.chf), effectiveRate)
          ),
        }))
      ).filter((sub) => sub.value > 0);
      const hasNamed = subcategories.some(
        (sub) => sub.name !== OTHER_SUBCATEGORY
      );

      result.push({
        name,
        value: consolidatedEur,
        nativeEur,
        nativeChf,
        color,
        ...(planned ? { planned: true } : {}),
        ...(hasNamed ? { subcategories } : {}),
      });
    }
  }

  // Trier par montant décroissant
  return result.sort((a, b) => b.value - a.value);
}
