/**
 * Tests for the standard form actions: fixed order, stable label while
 * pending, one error spot and an isolated destructive zone.
 *
 * @module Tests/Form/FormActions
 */

import { render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { FormActions } from '@/components/form/form-actions';
import { FormSuccess } from '@/components/form/form-success';

describe('FormActions', () => {
  it('renders the primary action, then cancel, then the destructive zone', () => {
    render(
      createElement(FormActions, {
        submitLabel: 'Créer la charge',
        onCancel: () => undefined,
        destructive: createElement('button', { type: 'button' }, 'Supprimer'),
      })
    );

    const submit = screen.getByRole('button', { name: 'Créer la charge' });
    const cancel = screen.getByRole('button', { name: 'Annuler' });
    const destructive = screen.getByRole('button', { name: 'Supprimer' });

    expect(submit.getAttribute('type')).toBe('submit');
    expect(cancel.getAttribute('type')).toBe('button');
    expect(
      submit.compareDocumentPosition(cancel) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      cancel.compareDocumentPosition(destructive) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it('keeps the label and disables the action while pending', () => {
    render(
      createElement(FormActions, {
        submitLabel: 'Enregistrer les modifications',
        isPending: true,
      })
    );

    const submit = screen.getByRole('button', {
      name: 'Enregistrer les modifications',
    });
    expect((submit as HTMLButtonElement).disabled).toBe(true);
    expect(submit.getAttribute('aria-busy')).toBe('true');
  });

  it('shows the failure below the actions', () => {
    render(
      createElement(FormActions, {
        submitLabel: 'Créer la charge',
        error: 'Impossible de créer la charge.',
      })
    );

    const submit = screen.getByRole('button', { name: 'Créer la charge' });
    const error = screen.getByRole('alert');
    expect(error.textContent).toBe('Impossible de créer la charge.');
    expect(
      submit.compareDocumentPosition(error) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });
});

describe('FormSuccess', () => {
  it('confirms the outcome and hosts the return action', () => {
    render(
      createElement(
        FormSuccess,
        { message: 'Charge créée.' },
        createElement('button', { type: 'button' }, 'Retour')
      )
    );

    expect(screen.getByRole('status').textContent).toBe('Charge créée.');
    expect(screen.getByRole('button', { name: 'Retour' }).textContent).toBe(
      'Retour'
    );
  });
});
