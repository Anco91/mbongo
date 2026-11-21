/**
 * Alerts Domain Logic
 *
 * Détection des alertes financières du foyer calculées à la volée :
 * - Échéances proches (due ≤ 7 jours, J+0 inclus)
 * - Approche du découvert (solde ≤ −70 % du découvert autorisé)
 * - Découvert dépassé (solde < −découvert)
 * - Trésorerie prévisionnelle négative (forecast à 30 jours)
 *
 * @packageDocumentation
 */

import {
  differenceInCalendarDays,
  isBefore,
  parseISO,
  startOfDay,
} from 'date-fns';
import { Account } from '../schemas/account';
import { Charge } from '../schemas/charge';
import { Payment } from '../schemas/payment';

export type AlertSeverity = 'danger' | 'warning' | 'info';

export type AlertType =
  | 'DUE_SOON'
  | 'OVERDRAFT_APPROACH'
  | 'OVERDRAFT_EXCEEDED'
  | 'NEGATIVE_FORECAST';

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  date?: string;
  amount?: number;
  currency?: string;
  accountId?: string;
}

export interface ComputeAlertsParams {
  accounts: Account[];
  balances: Record<string, number>;
  payments: Payment[];
  charges?: Charge[];
  asOf?: Date;
}

const SEVERITY_ORDER: Record<AlertSeverity, number> = {
  danger: 1,
  warning: 2,
  info: 3,
};

export function computeAlerts(params: ComputeAlertsParams): Alert[] {
  const {
    accounts,
    balances,
    payments,
    charges = [],
    asOf = new Date(),
  } = params;

  const today = startOfDay(asOf);
  const alerts: Alert[] = [];

  const chargeMap = new Map<string, Charge>();
  for (const c of charges) {
    chargeMap.set(c.id, c);
  }

  const accountMap = new Map<string, Account>();
  for (const a of accounts) {
    accountMap.set(a.id, a);
  }

  // 1. Échéances proches (due <= 7 jours, J+0 inclus)
  const pendingPayments = payments.filter((p) => p.status === 'PENDING');

  for (const p of pendingPayments) {
    const dueDate = parseISO(p.dueDate);
    const days = differenceInCalendarDays(dueDate, today);

    if (days >= 0 && days <= 7) {
      const charge = chargeMap.get(p.chargeId);
      const label = charge?.label ?? 'Échéance';
      const daysText =
        days === 0
          ? "aujourd'hui"
          : days === 1
            ? 'demain'
            : `dans ${days} jours`;

      alerts.push({
        id: `due-soon-${p.id}`,
        type: 'DUE_SOON',
        severity: days === 0 ? 'warning' : 'info',
        title: `Échéance proche : ${label}`,
        message: `${label} (${p.amount} ${p.currency}) due ${daysText}`,
        date: p.dueDate,
        amount: p.amount,
        currency: p.currency,
        accountId: charge?.accountId,
      });
    } else if (isBefore(dueDate, today)) {
      // En retard
      const charge = chargeMap.get(p.chargeId);
      const label = charge?.label ?? 'Échéance';
      const lateDays = Math.abs(days);

      alerts.push({
        id: `overdue-${p.id}`,
        type: 'DUE_SOON',
        severity: 'danger',
        title: `Échéance en retard : ${label}`,
        message: `${label} (${p.amount} ${p.currency}) en retard de ${lateDays} jour${lateDays > 1 ? 's' : ''}`,
        date: p.dueDate,
        amount: p.amount,
        currency: p.currency,
        accountId: charge?.accountId,
      });
    }
  }

  // 2 & 3. Découvert (approche et dépassement) + 4. Forecast 30 jours
  for (const acc of accounts) {
    if (acc.status !== 'ACTIVE') continue;

    const currentBalance = balances[acc.id] ?? acc.openingBalance ?? 0;
    const overdraft = acc.overdraftLimit ?? 0;

    // Découvert actuel
    if (overdraft > 0) {
      const threshold70 = -0.7 * overdraft;
      if (currentBalance < -overdraft) {
        alerts.push({
          id: `overdraft-exceeded-${acc.id}`,
          type: 'OVERDRAFT_EXCEEDED',
          severity: 'danger',
          title: `Découvert dépassé : ${acc.name}`,
          message: `Solde actuel de ${currentBalance} ${acc.currency} dépasse le découvert autorisé de ${overdraft} ${acc.currency}`,
          amount: currentBalance,
          currency: acc.currency,
          accountId: acc.id,
        });
      } else if (currentBalance <= threshold70) {
        alerts.push({
          id: `overdraft-approach-${acc.id}`,
          type: 'OVERDRAFT_APPROACH',
          severity: 'warning',
          title: `Approche du découvert : ${acc.name}`,
          message: `Solde actuel de ${currentBalance} ${acc.currency} approche de la limite de découvert (${overdraft} ${acc.currency})`,
          amount: currentBalance,
          currency: acc.currency,
          accountId: acc.id,
        });
      }
    } else if (currentBalance < 0 && acc.currency === 'CHF') {
      // Pas de découvert en Suisse
      alerts.push({
        id: `overdraft-exceeded-${acc.id}`,
        type: 'OVERDRAFT_EXCEEDED',
        severity: 'danger',
        title: `Solde négatif non autorisé : ${acc.name}`,
        message: `Solde actuel de ${currentBalance} CHF négatif sur compte suisse sans découvert`,
        amount: currentBalance,
        currency: acc.currency,
        accountId: acc.id,
      });
    }

    // Forecast 30 jours : échéances pending à venir sur ce compte
    const accountPayments = pendingPayments.filter((p) => {
      const charge = chargeMap.get(p.chargeId);
      return charge?.accountId === acc.id;
    });

    let projectedBalance = currentBalance;
    for (const p of accountPayments) {
      const dueDate = parseISO(p.dueDate);
      const days = differenceInCalendarDays(dueDate, today);
      if (days >= 0 && days <= 30) {
        projectedBalance -= p.amount;
      }
    }

    const limit = -overdraft;
    if (projectedBalance < limit && currentBalance >= limit) {
      alerts.push({
        id: `forecast-negative-${acc.id}`,
        type: 'NEGATIVE_FORECAST',
        severity: overdraft > 0 ? 'warning' : 'danger',
        title: `Trésorerie prévisionnelle négative : ${acc.name}`,
        message: `Solde projeté à 30 jours (${Math.round(projectedBalance * 100) / 100} ${acc.currency}) sous la limite autorisée`,
        amount: Math.round(projectedBalance * 100) / 100,
        currency: acc.currency,
        accountId: acc.id,
      });
    }
  }

  // Tri par gravité : danger (1), warning (2), info (3)
  return alerts.sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
  );
}
