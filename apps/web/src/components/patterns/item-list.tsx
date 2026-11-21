/**
 * Item List — Generic async list shell.
 *
 * Handles loading, empty, and populated states with a single component.
 * The footer is always rendered (useful for "Add" buttons).
 *
 * @module Components/Patterns/ItemList
 */

'use client';

import { JSX, ReactNode } from 'react';
import { LoadingState, EmptyState } from './async-state';

interface ItemListProps<T> {
  items: T[] | undefined;
  isLoading?: boolean;
  renderItem: (item: T) => ReactNode;
  emptyState: ReactNode;
  footer?: ReactNode;
  rowClassName?: string;
}

/**
 * Generic list shell for async data.
 *
 * - isLoading → LoadingState
 * - items empty → emptyState
 * - footer always rendered (for "Add" buttons)
 */
export function ItemList<T>({
  items,
  isLoading,
  renderItem,
  emptyState,
  footer,
  rowClassName = 'p-4 border rounded-lg',
}: ItemListProps<T>): JSX.Element {
  if (isLoading) {
    return <LoadingState />;
  }

  const isEmpty = !items || items.length === 0;

  return (
    <div className="space-y-3">
      {isEmpty ? (
        <EmptyState action={footer}>{emptyState}</EmptyState>
      ) : (
        <>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={getItemKey(item)} className={rowClassName}>
                {renderItem(item)}
              </div>
            ))}
          </div>
          {footer}
        </>
      )}
    </div>
  );
}

/** Extract a key from an item (assumes { id } shape). */
function getItemKey<T>(item: T): string {
  if (typeof item === 'object' && item !== null && 'id' in item) {
    return String((item as { id: unknown }).id);
  }
  return String(item);
}
