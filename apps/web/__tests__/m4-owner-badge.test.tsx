/**
 * M4 — OwnerBadge (« qui paie ») tests.
 *
 * ownerLabel is pure: prénom du membre, « Foyer » sinon (compte non
 * attribué ou membre supprimé). OwnerBadge renders the label from
 * useMembers.
 *
 * @module Tests/M4/OwnerBadge
 */

import { render, screen } from '@testing-library/react';
import { OwnerBadge, ownerLabel } from '@/components/patterns/owner-badge';

jest.mock('@/hooks/use-members', () => ({
  useMembers: jest.fn(() => ({
    data: [
      { id: 'm1', firstName: 'Anco' },
      { id: 'm2', firstName: 'Carla' },
    ],
  })),
}));

describe('ownerLabel (dérivation pure)', () => {
  const members = [
    { id: 'm1', firstName: 'Anco' },
    { id: 'm2', firstName: 'Carla' },
  ];

  it('compte attribué → prénom du membre', () => {
    expect(ownerLabel('m2', members)).toBe('Carla');
  });

  it('compte sans membre → Foyer', () => {
    expect(ownerLabel(null, members)).toBe('Foyer');
    expect(ownerLabel(undefined, members)).toBe('Foyer');
  });

  it('membre supprimé (id orphelin) → Foyer', () => {
    expect(ownerLabel('ghost', members)).toBe('Foyer');
  });
});

describe('OwnerBadge (rendu)', () => {
  it('badge prénom pour un membre connu', () => {
    render(<OwnerBadge memberId="m1" />);
    expect(screen.getByText('Anco')).toBeTruthy();
  });

  it('badge Foyer pour un compte non attribué', () => {
    render(<OwnerBadge memberId={null} />);
    expect(screen.getByText('Foyer')).toBeTruthy();
  });
});
