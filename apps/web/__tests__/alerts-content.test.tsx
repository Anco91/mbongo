/**
 * Tests for AlertsContent — the dedicated alerts view.
 *
 * use-alerts is mocked: the view contract is (1) list every active alert
 * via AlertCard, (2) mark them read when opened, (3) show a readable
 * empty state.
 *
 * @module Tests/Alerts/AlertsContent
 */

import { render, screen, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import { AlertsContent } from '@/components/alerts/alerts-content';

jest.mock('@/hooks/use-alerts', () => ({
  useActiveAlerts: jest.fn(),
  useAlertsRead: jest.fn(),
  alertFingerprint: jest.fn((a: { id: string }) => a.id),
}));

import {
  useActiveAlerts,
  useAlertsRead,
} from '@/hooks/use-alerts';

const markAllRead = jest.fn();

const alerts = [
  {
    id: 'overdue-p2',
    type: 'DUE_SOON',
    severity: 'danger',
    title: 'Échéance en retard : Loyer GE',
    message: 'Loyer GE (1850 CHF) en retard de 3 jours',
  },
  {
    id: 'due-soon-p1',
    type: 'DUE_SOON',
    severity: 'warning',
    title: 'Échéance proche : Mobile',
    message: 'Mobile (19.99 EUR) due dans 3 jours',
  },
];

describe('AlertsContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAlertsRead as jest.Mock).mockReturnValue({
      readIds: new Set<string>(),
      markAllRead,
    });
  });

  it('lists every active alert with severity badges', () => {
    (useActiveAlerts as jest.Mock).mockReturnValue(alerts);

    render(createElement(AlertsContent));

    expect(screen.getByText('Échéance en retard : Loyer GE')).toBeTruthy();
    expect(screen.getByText('Échéance proche : Mobile')).toBeTruthy();
    expect(screen.getByText('Critique')).toBeTruthy();
    expect(screen.getByText('Avertissement')).toBeTruthy();
  });

  it('marks the current alerts as read when opened', async () => {
    (useActiveAlerts as jest.Mock).mockReturnValue(alerts);

    render(createElement(AlertsContent));

    await waitFor(() => {
      expect(markAllRead).toHaveBeenCalledWith(['overdue-p2', 'due-soon-p1']);
    });
  });

  it('shows a readable empty state without conditions', () => {
    (useActiveAlerts as jest.Mock).mockReturnValue([]);

    render(createElement(AlertsContent));

    expect(screen.getByText('Aucune alerte')).toBeTruthy();
    expect(markAllRead).not.toHaveBeenCalled();
  });
});
