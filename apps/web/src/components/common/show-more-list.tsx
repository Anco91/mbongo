/**
 * Show More List — pagination « révélation » mobile (M4, design D7).
 *
 * Pas une barre de pages web : 3 éléments visibles au départ,
 * un bouton révèle la suite par paquets de 5, « Réduire » replie.
 * Générique et découplé : l'appelant garde son conteneur (Card, liste…).
 *
 * @module Components/Common/ShowMoreList
 */

'use client';

import { useState, type JSX, type ReactNode } from 'react';

const INITIAL_VISIBLE = 3;
const PAGE_SIZE = 5;

interface ShowMoreListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  /** Visibles au départ (défaut 3). */
  initial?: number;
  /** Éléments révélés par clic (défaut 5). */
  step?: number;
}

export function ShowMoreList<T>({
  items,
  renderItem,
  initial = INITIAL_VISIBLE,
  step = PAGE_SIZE,
}: ShowMoreListProps<T>): JSX.Element {
  const [count, setCount] = useState(initial);
  const expanded = count >= items.length;
  const visible = items.slice(0, count);

  return (
    <>
      {visible.map((item, index) => renderItem(item, index))}
      {items.length > initial && (
        <button
          type="button"
          onClick={() =>
            setCount(expanded ? initial : Math.min(count + step, items.length))
          }
          className="w-full py-2.5 text-xs font-medium text-emerald-700"
        >
          {expanded ? 'Réduire' : `Afficher les ${items.length - count} autres`}
        </button>
      )}
    </>
  );
}
