/**
 * M4 — ChargesContent « qui-paie » badge tests: owner badge derived
 * from the debited account (member first name, « Foyer » when the
 * account is unattached or the member is gone).
 *
 * @module Tests/M4/ChargesOwnerBadge
 */

import { render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { ChargesContent } from '@/components/charges/charges-content';
import { useCharges } from '@/hooks/use-charges';
import { useAccounts } from '@/hooks/use-accounts';
import { useMembers } from '@/hooks/use-members';
import type { Charge } from '@mbongo/shared';

jest.mock('@/hooks/use-charges', () => ({
  useCharges: jest.fn(),
  useDeleteCharge: jest.fn(() => ({ mutate: jest.fn(), isPending: false })),
}));

jest.mock('@/hooks/use-schedule', () => ({
  usePayments: jest.fn(() => ({ data: [] })),
}));

jest.mock('@/hooks/use-accounts', () => ({
  useAccounts: jest.fn(),
}));

jest.mock('@/hooks/use-members', () => ({
  useMembers: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  usePathname: () => '/charges',
}));

const now = '2026-11-12T00:00:00.000Z';

const charge = (overrides: Partial<Charge> = {}): Charge =>
  ({
    id: 'charge-loyer',
    label: 'Loyer GE',
    type: 'FIXED_RECURRING',
    amount: 1800,
    currency: 'EUR',
    category: 'Logement',
    startDate: '2026-01-01',
    endDate: null,
    frequency: 'MONTHLY',
    installments: null,
    provisioned: false,
    accountId: 'account-ubs',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }) as Charge;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ChargesContent — OwnerBadge', () => {
  it('badge prénom du membre quand le compte est attribué', () => {
    (useCharges as jest.Mock).mockReturnValue({ data: [charge()] });
    (useAccounts as jest.Mock).mockReturnValue({
      data: [
        {
          id: 'account-ubs',
          name: 'UBS Courant',
          memberId: 'member-anco-0001',
        },
      ],
    });
    (useMembers as jest.Mock).mockReturnValue({
      data: [{ id: 'member-anco-0001', firstName: 'Anco' }],
    });

    render(createElement(ChargesContent));

    expect(screen.getAllByText('Anco').length).toBeGreaterThanOrEqual(1);
  });

  it('badge Foyer quand le compte est commun', () => {
    (useCharges as jest.Mock).mockReturnValue({ data: [charge()] });
    (useAccounts as jest.Mock).mockReturnValue({
      data: [{ id: 'account-ubs', name: 'UBS Courant', memberId: null }],
    });
    (useMembers as jest.Mock).mockReturnValue({ data: [] });

    render(createElement(ChargesContent));

    expect(screen.getAllByText('Foyer').length).toBeGreaterThanOrEqual(1);
  });
});
