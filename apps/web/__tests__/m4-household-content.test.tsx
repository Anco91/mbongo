/**
 * M4 — HouseholdContent tests (vue foyer): member list, edit form,
 * create form, two-step delete (accounts unlinked, not deleted).
 *
 * @module Tests/M4/HouseholdContent
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HouseholdContent } from '@/components/household/household-content';
import { useMembers, useDeleteMember } from '@/hooks/use-members';
import type { Member } from '@mbongo/shared';

jest.mock('@/hooks/use-members', () => ({
  useMembers: jest.fn(),
  useCreateMember: jest.fn(() => ({
    mutate: jest.fn(),
    isPending: false,
    isSuccess: false,
  })),
  useUpdateMember: jest.fn(() => ({
    mutate: jest.fn(),
    isPending: false,
    isSuccess: false,
  })),
  useDeleteMember: jest.fn(() => ({
    mutate: jest.fn(),
    isPending: false,
  })),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  usePathname: () => '/household',
}));

const members: Member[] = [
  {
    id: 'm1',
    firstName: 'Anco',
    lastName: null,
    role: 'PRIMARY',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'm2',
    firstName: 'Carla',
    lastName: 'Dupont',
    role: 'PARTNER',
    createdAt: '2026-01-02T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
  },
];

describe('HouseholdContent', () => {
  it('liste les membres avec nom et rôle FR', () => {
    (useMembers as jest.Mock).mockReturnValue({ data: members });
    render(<HouseholdContent />);
    expect(screen.getByText('Anco')).toBeTruthy();
    expect(screen.getByText('Carla Dupont')).toBeTruthy();
    expect(screen.getByText('Titulaire')).toBeTruthy();
    expect(screen.getByText('Partenaire')).toBeTruthy();
  });

  it('état vide sans membre', () => {
    (useMembers as jest.Mock).mockReturnValue({ data: [] });
    render(<HouseholdContent />);
    expect(screen.getByText('Aucun membre du foyer.')).toBeTruthy();
  });

  it('ouvre le formulaire de modification du membre', () => {
    (useMembers as jest.Mock).mockReturnValue({ data: members });
    render(<HouseholdContent />);
    fireEvent.click(screen.getAllByText('Modifier')[0]);
    expect(screen.getByDisplayValue('Anco')).toBeTruthy();
    expect(screen.getByText('Enregistrer')).toBeTruthy();
  });

  it('suppression : confirmation deux étapes puis deleteMember', async () => {
    (useMembers as jest.Mock).mockReturnValue({ data: members });
    const deleteMember = jest.fn();
    (useDeleteMember as jest.Mock).mockReturnValue({
      mutate: deleteMember,
      isPending: false,
    });
    render(<HouseholdContent />);
    fireEvent.click(screen.getAllByText('Supprimer le membre')[0]);
    fireEvent.click(screen.getByText('Supprimer'));
    await waitFor(() => expect(deleteMember).toHaveBeenCalledWith('m1'));
  });

  it('création : le formulaire nouveau membre s’ouvre', () => {
    (useMembers as jest.Mock).mockReturnValue({ data: members });
    render(<HouseholdContent />);
    fireEvent.click(screen.getByText('Nouveau membre'));
    expect(screen.getByText('Créer le membre')).toBeTruthy();
  });
});
