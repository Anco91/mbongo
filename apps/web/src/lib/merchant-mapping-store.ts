/**
 * Merchant Mapping Store
 *
 * Module-level external store of the merchant → category mapping of the
 * bank import screen, per device (localStorage `mbongo.merchantCategories`),
 * lazily hydrated on first subscription (SSR-safe). Same shape as
 * `alerts-read-store.ts`; pure rules live in `@mbongo/shared`.
 *
 * @module Lib/MerchantMappingStore
 */

import {
  parseMerchantMapping,
  serializeMerchantMapping,
  setMerchantCategory,
} from '@mbongo/shared';

/** localStorage key of the mapping. */
export const MERCHANT_MAPPING_KEY = 'mbongo.merchantCategories';

type Mapping = Readonly<Record<string, string>>;

const EMPTY_MAPPING: Mapping = Object.freeze({});

/** Current snapshot, same reference between mutations. */
let mapping: Mapping = EMPTY_MAPPING;
let hydrated = false;
const listeners = new Set<() => void>();

function hydrate(): void {
  if (hydrated || typeof window === 'undefined') return;
  hydrated = true;
  try {
    const persisted = parseMerchantMapping(
      window.localStorage.getItem(MERCHANT_MAPPING_KEY)
    );
    if (Object.keys(persisted).length > 0) mapping = persisted;
  } catch {
    // Unreadable storage: start empty.
  }
}

/** Subscribes a listener (external store contract); hydrates lazily. */
export function subscribe(listener: () => void): () => void {
  hydrate();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Current mapping (stable reference). */
export function getSnapshot(): Mapping {
  return mapping;
}

/** Server snapshot: always empty. */
export function getServerSnapshot(): Mapping {
  return EMPTY_MAPPING;
}

/** Sets (or clears) the category of a merchant, persists, notifies. */
export function setCategory(merchant: string, category: string): void {
  hydrate();
  mapping = setMerchantCategory(mapping, merchant, category);
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(
        MERCHANT_MAPPING_KEY,
        serializeMerchantMapping(mapping)
      );
    }
  } catch {
    // Persistence failure: the state stays valid for the session.
  }
  for (const listener of listeners) listener();
}
