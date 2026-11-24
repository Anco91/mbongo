/**
 * Alerts Read Store
 *
 * Module-level external store for the per-device read state of alerts
 * (design D3). The header bell and the dedicated alerts view can both
 * be mounted at once: a component-local `useState` keeps the two
 * instances out of sync, while this store is shared by every consumer
 * through `useSyncExternalStore`.
 *
 * Persistence stays per device in localStorage (`mbongo.alertsRead`),
 * lazily hydrated on the first subscription (SSR-safe guard).
 *
 * @module Lib/AlertsReadStore
 */

/** localStorage key of the read fingerprints. */
export const ALERTS_READ_KEY = 'mbongo.alertsRead';

/** Immutable empty snapshot served during SSR and before hydration. */
const EMPTY_SET: ReadonlySet<string> = new Set();

/** Current snapshot — same reference between mutations (useSyncExternalStore contract). */
let readIds: ReadonlySet<string> = EMPTY_SET;

/** Whether localStorage has already been read in this tab. */
let hydrated = false;

const listeners = new Set<() => void>();

/**
 * Parses a persisted JSON payload into a read-fingerprints set.
 * Invalid JSON, non-array payloads and non-string entries degrade to
 * an empty set (all alerts count as unread) instead of crashing.
 */
export function parseReadIds(raw: string | null): Set<string> {
  if (raw === null) return new Set();
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(
      parsed.filter((entry): entry is string => typeof entry === 'string')
    );
  } catch {
    return new Set();
  }
}

/** Serializes the read set for persistence (stable JSON array). */
export function serializeReadIds(ids: ReadonlySet<string>): string {
  return JSON.stringify([...ids]);
}

/** Reads localStorage once per tab; a no-op on the server. */
function hydrate(): void {
  if (hydrated || typeof window === 'undefined') return;
  hydrated = true;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(ALERTS_READ_KEY);
  } catch {
    // Unreadable storage: start from the in-memory state.
    return;
  }
  const persisted = parseReadIds(raw);
  if (persisted.size > 0) {
    readIds = persisted;
  }
}

/**
 * Subscribes a listener to read-state changes (external store contract).
 * The first subscription triggers the lazy localStorage hydration.
 */
export function subscribe(listener: () => void): () => void {
  hydrate();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Current snapshot of the read fingerprints (stable reference). */
export function getSnapshot(): ReadonlySet<string> {
  return readIds;
}

/** Server snapshot — always empty (no localStorage during SSR). */
export function getServerSnapshot(): ReadonlySet<string> {
  return EMPTY_SET;
}

/**
 * Marks every given fingerprint as read: new immutable snapshot,
 * persisted to localStorage, then subscribers notified.
 */
export function markAllRead(fingerprints: string[]): void {
  hydrate();
  const next = new Set(readIds);
  for (const fingerprint of fingerprints) next.add(fingerprint);
  readIds = next;
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(ALERTS_READ_KEY, serializeReadIds(next));
    }
  } catch {
    // Ignore persistence failure: the state stays valid for the session.
  }
  for (const listener of listeners) listener();
}
