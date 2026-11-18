/**
 * M4 — ShowMoreList (pagination révélation, task 5.3) :
 * 3 visibles, +5 par clic, « Réduire » replie, pas de bouton sous le seuil.
 *
 * @module Tests/M4/ShowMoreList
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { ShowMoreList } from '@/components/common/show-more-list';
import type { JSX } from 'react';

const twelve = Array.from({ length: 12 }, (_, i) => `item-${i + 1}`);

describe('ShowMoreList (pagination révélation)', () => {
  it('12 items : 3 visibles, bouton « Afficher les 9 autres »', () => {
    render(
      <ShowMoreList items={twelve} renderItem={(item) => <p>{item}</p>} />
    );
    expect(screen.getByText('item-1')).toBeTruthy();
    expect(screen.getByText('item-3')).toBeTruthy();
    expect(screen.queryByText('item-4')).toBeNull();
    expect(screen.getByText('Afficher les 9 autres')).toBeTruthy();
  });

  it('clic : +5 par paquet, jamais au-delà du total', () => {
    render(
      <ShowMoreList items={twelve} renderItem={(item) => <p>{item}</p>} />
    );
    fireEvent.click(screen.getByText('Afficher les 9 autres'));
    expect(screen.getByText('item-8')).toBeTruthy();
    expect(screen.queryByText('item-9')).toBeNull();
    expect(screen.getByText('Afficher les 4 autres')).toBeTruthy();
    fireEvent.click(screen.getByText('Afficher les 4 autres'));
    expect(screen.getByText('item-12')).toBeTruthy();
    expect(screen.getByText('Réduire')).toBeTruthy();
  });

  it('« Réduire » replie aux 3 initiaux', () => {
    render(
      <ShowMoreList items={twelve} renderItem={(item) => <p>{item}</p>} />
    );
    fireEvent.click(screen.getByText('Afficher les 9 autres'));
    fireEvent.click(screen.getByText('Afficher les 4 autres'));
    fireEvent.click(screen.getByText('Réduire'));
    expect(screen.queryByText('item-4')).toBeNull();
    expect(screen.getByText('item-3')).toBeTruthy();
  });

  it('2 items : tout visible, pas de bouton', () => {
    render(
      <ShowMoreList
        items={['a', 'b']}
        renderItem={(item): JSX.Element => <p>{item}</p>}
      />
    );
    expect(screen.getByText('a')).toBeTruthy();
    expect(screen.getByText('b')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });
});
