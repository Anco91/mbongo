/**
 * M4 — monthRange / isInMonth (dashboard mensuel, design D3) and the
 * dashboard month cursor (« ‹ mois › » + swipe) tests.
 *
 * @module Tests/M4/MonthNavigation
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { createElement } from 'react';
import { monthRange, isInMonth } from '@mbongo/shared';
import { DashboardContent } from '@/components/dashboard/dashboard-content';
import { swipeDirection } from '@/lib/month-navigation';
import { DisplayCurrencyProvider } from '@/components/providers/display-currency-provider';

jest.mock('@/hooks/use-accounts', () => ({
  useAccounts: jest.fn(() => ({ data: [] })),
}));

jest.mock('@/hooks/use-transactions', () => ({
  useTransactions: jest.fn(() => ({ data: [] })),
}));

jest.mock('@/hooks/use-charges', () => ({
  useCharges: jest.fn(() => ({ data: [] })),
}));

jest.mock('@/hooks/use-schedule', () => ({
  usePayments: jest.fn(() => ({ data: [] })),
}));

jest.mock('@/hooks/use-transfers', () => ({
  useTransfers: jest.fn(() => ({ data: [] })),
}));

jest.mock('@/hooks/use-exchange-rate', () => ({
  useExchangeRate: jest.fn(() => ({
    rate: null,
    rateDate: null,
    source: 'none',
    isLoading: false,
  })),
}));

jest.mock('@/hooks/use-members', () => ({
  useMembers: jest.fn(() => ({ data: [] })),
}));

jest.mock('@/hooks/use-monthly-budget', () => ({
  useMonthlyBudget: jest.fn(() => ({ data: null })),
}));

describe('monthRange / isInMonth (dérivation pure)', () => {
  it("monthRange('2026-11-16') → fenêtre inclusive du mois", () => {
    const range = monthRange('2026-11-16');
    expect(range.start.getFullYear()).toBe(2026);
    expect(range.start.getMonth()).toBe(10);
    expect(range.start.getDate()).toBe(1);
    expect(range.end.getMonth()).toBe(10);
    expect(range.end.getDate()).toBe(30);
  });

  it("monthRange('2026-02') → février", () => {
    const range = monthRange('2026-02');
    expect(range.end.getDate()).toBe(28);
  });

  it('isInMonth inclut les bornes', () => {
    const range = monthRange('2026-11-01');
    expect(isInMonth('2026-11-01T00:00:00.000Z', range)).toBe(true);
    expect(isInMonth('2026-11-30T23:59:59.000Z', range)).toBe(true);
    expect(isInMonth('2026-12-01T00:00:00.000Z', range)).toBe(false);
    expect(isInMonth('2026-10-31T23:59:59.000Z', range)).toBe(false);
  });
});

const renderDashboard = (): void => {
  render(
    createElement(
      DisplayCurrencyProvider,
      null,
      createElement(DashboardContent)
    )
  );
};

describe('DashboardContent — curseur mensuel', () => {
  it('affiche le mois courant au premier chargement', () => {
    renderDashboard();
    const expected = new Intl.DateTimeFormat('fr-FR', {
      month: 'short',
      year: 'numeric',
    }).format(new Date());
    expect(screen.getByText(expected)).toBeTruthy();
  });

  it('« ‹ » affiche le mois précédent, « › » le suivant', () => {
    renderDashboard();
    fireEvent.click(screen.getByLabelText('Mois précédent'));
    const prev = new Intl.DateTimeFormat('fr-FR', {
      month: 'short',
      year: 'numeric',
    }).format(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1));
    expect(screen.getByText(prev)).toBeTruthy();

    fireEvent.click(screen.getByLabelText('Mois suivant'));
    fireEvent.click(screen.getByLabelText('Mois suivant'));
    const next = new Intl.DateTimeFormat('fr-FR', {
      month: 'short',
      year: 'numeric',
    }).format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1));
    expect(screen.getByText(next)).toBeTruthy();
  });

  it('décision swipe pure : gauche → suivant, droite → précédent, vertical → rien', () => {
    expect(swipeDirection(-100, 5)).toBe(1);
    expect(swipeDirection(100, 5)).toBe(-1);
    expect(swipeDirection(-100, 120)).toBe(0); // vertical dominant
    expect(swipeDirection(-50, 0)).toBe(0); // sous le seuil
    expect(swipeDirection(-65, 50)).toBe(0); // 65 <= 75
  });
});
