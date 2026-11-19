/**
 * Tests for the asynchronous DeleteButton: confirmation, pending lock,
 * failure stays in place and re-enables the control.
 *
 * @module Tests/Patterns/DeleteButton
 */

import { render, screen, waitFor } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { createElement } from 'react';
import { DeleteButton } from '@/components/patterns/delete-button';

function pendingButton(): HTMLButtonElement {
  return screen.getByRole('button', { name: 'Supprimer' });
}

function cancelButton(): HTMLButtonElement {
  return screen.getByRole('button', { name: 'Annuler' });
}

describe('DeleteButton', () => {
  it('waits for the confirmed action and disables both buttons meanwhile', async () => {
    let resolve: () => void = () => undefined;
    const onConfirmed = jest.fn(
      () =>
        new Promise<void>((done) => {
          resolve = done;
        })
    );

    render(
      createElement(DeleteButton, {
        label: 'Supprimer la charge',
        message: 'Supprimer « Loyer » ?',
        onConfirmed,
      })
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Supprimer la charge' })
    );
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer' }));

    expect(onConfirmed).toHaveBeenCalledTimes(1);
    expect(pendingButton().disabled).toBe(true);
    expect(cancelButton().disabled).toBe(true);

    resolve();
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Supprimer la charge' })
      ).toBeTruthy()
    );
  });

  it('stays in place with the message when the action rejects', async () => {
    const onConfirmed = jest.fn(() =>
      Promise.reject(new Error('Suppression impossible.'))
    );

    render(
      createElement(DeleteButton, {
        label: 'Supprimer la charge',
        message: 'Supprimer « Loyer » ?',
        onConfirmed,
      })
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Supprimer la charge' })
    );
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer' }));

    expect((await screen.findByRole('alert')).textContent).toBe(
      'Suppression impossible.'
    );
    expect(pendingButton().disabled).toBe(false);
  });
});
