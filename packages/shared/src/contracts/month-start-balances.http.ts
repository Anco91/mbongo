import type {
  MonthStartBalance,
  SaveMonthStartBalancesInput,
} from '../schemas/month-start-balance';

export interface MonthStartBalanceHttp {
  /** Lignes du mois ; liste vide si rien n'est enregistré. */
  findByMonth(month: string): Promise<MonthStartBalance[]>;
  /** Enregistre (upsert) les soldes de départ et renvoie les lignes du mois. */
  save(
    month: string,
    input: SaveMonthStartBalancesInput
  ): Promise<MonthStartBalance[]>;
}
