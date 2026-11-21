import type { MonthlyBudget } from '../schemas/monthly-budget';

export interface MonthlyBudgetHttp {
  /** Retourne null quand le mois n'a jamais été préparé. */
  findOne(month: string): Promise<MonthlyBudget | null>;
  /** Marque le mois préparé (idempotent). */
  prepare(month: string): Promise<MonthlyBudget>;
}
