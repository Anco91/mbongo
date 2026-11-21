/**
 * Tests for the Charges view entry points — the due-date view has an
 * explicit action, so the route is no longer orphaned.
 *
 * @module Tests/Charges/ChargesContent
 */

import { render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { ChargesContent } from '@/components/charges/charges-content';

jest.mock('@/hooks/use-charges', () => ({
  useCharges: jest.fn(() => ({ data: [] })),
  useDeleteCharge: jest.fn(() => ({ mutateAsync: jest.fn() })),
}));

jest.mock('@/hooks/use-schedule', () => ({
  usePayments: jest.fn(() => ({ data: [] })),
}));

jest.mock('@/hooks/use-accounts', () => ({
  useAccounts: jest.fn(() => ({ data: [] })),
}));

jest.mock('@/hooks/use-members', () => ({
  useMembers: jest.fn(() => ({ data: [] })),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  usePathname: () => '/charges',
}));

describe('ChargesContent', () => {
  it('offers an action to the upcoming due dates', () => {
    render(createElement(ChargesContent));

    const link = screen.getByRole('link', { name: /Échéances à venir/ });
    expect(link.getAttribute('href')).toBe('/schedule');
    expect(link.querySelector('svg')).toBeTruthy();
  });
});
