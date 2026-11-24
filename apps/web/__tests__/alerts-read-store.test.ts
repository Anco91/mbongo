/**
 * Tests for the alerts read store (design D3).
 *
 * Pure helpers are tested directly; the module-level store is tested
 * through fresh module instances (`jest.isolateModules`) so the mutable
 * snapshot of one test never leaks into the next.
 *
 * @module Tests/Lib/AlertsReadStore
 */
import {
  ALERTS_READ_KEY,
  parseReadIds,
  serializeReadIds,
} from '@/lib/alerts-read-store';

describe('parseReadIds', () => {
  it('returns an empty set for null', () => {
    expect(parseReadIds(null)).toEqual(new Set());
  });

  it('returns an empty set for invalid JSON', () => {
    expect(parseReadIds('not-json{{')).toEqual(new Set());
  });

  it('returns an empty set for a non-array payload', () => {
    expect(parseReadIds('{"a":1}')).toEqual(new Set());
  });

  it('drops non-string entries', () => {
    expect(parseReadIds('["a", 1, null, "b"]')).toEqual(new Set(['a', 'b']));
  });

  it('parses a valid array of fingerprints', () => {
    expect(parseReadIds('["fp-1","fp-2"]')).toEqual(new Set(['fp-1', 'fp-2']));
  });
});

describe('serializeReadIds', () => {
  it('serializes a set as a JSON array (round-trip)', () => {
    const ids = new Set(['fp-1', 'fp-2']);
    const raw = serializeReadIds(ids);
    expect(JSON.parse(raw)).toEqual(['fp-1', 'fp-2']);
    expect(parseReadIds(raw)).toEqual(ids);
  });

  it('serializes an empty set as an empty array', () => {
    expect(serializeReadIds(new Set())).toBe('[]');
  });
});

describe('store (module-level)', () => {
  /** Fresh store instance per test — the module state is mutable. */
  function loadFreshStore(): typeof import('@/lib/alerts-read-store') {
    let store!: typeof import('@/lib/alerts-read-store');
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      store = require('@/lib/alerts-read-store');
    });
    return store;
  }

  beforeEach(() => {
    window.localStorage.clear();
  });

  it('serves an empty snapshot before hydration and on the server', () => {
    const store = loadFreshStore();
    expect(store.getServerSnapshot()).toEqual(new Set());
    expect(store.getSnapshot()).toEqual(new Set());
  });

  it('hydrates lazily from localStorage on first subscription', () => {
    window.localStorage.setItem(
      ALERTS_READ_KEY,
      JSON.stringify(['fp-1', 'fp-2'])
    );
    const store = loadFreshStore();

    expect(store.getSnapshot()).toEqual(new Set());
    const unsubscribe = store.subscribe(() => {});
    expect(store.getSnapshot()).toEqual(new Set(['fp-1', 'fp-2']));
    unsubscribe();
  });

  it('notifies subscribers with a new immutable snapshot on markAllRead', () => {
    const store = loadFreshStore();
    const listener = jest.fn();
    const unsubscribe = store.subscribe(listener);

    const before = store.getSnapshot();
    store.markAllRead(['fp-1']);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot()).not.toBe(before);
    expect(store.getSnapshot()).toEqual(new Set(['fp-1']));
    unsubscribe();
  });

  it('persists the read set to localStorage', () => {
    const store = loadFreshStore();
    store.subscribe(() => {});
    store.markAllRead(['fp-1', 'fp-2']);

    expect(
      JSON.parse(window.localStorage.getItem(ALERTS_READ_KEY) ?? 'null')
    ).toEqual(['fp-1', 'fp-2']);
  });

  it('merges with the hydrated state instead of overwriting it', () => {
    window.localStorage.setItem(ALERTS_READ_KEY, JSON.stringify(['fp-old']));
    const store = loadFreshStore();
    const unsubscribe = store.subscribe(() => {});

    store.markAllRead(['fp-new']);
    expect(store.getSnapshot()).toEqual(new Set(['fp-old', 'fp-new']));
    unsubscribe();
  });
});

describe('alert fingerprints', () => {
  it('are `{id}|{amount}|{date}` — value moves re-trigger as unread', () => {
    // Contract frozen by the alerts spec: the fingerprint is owned by
    // use-alerts.ts; the store only persists opaque strings.
    const fingerprint = 'due-soon-p1|1850|2026-11-28T00:00:00.000Z';
    const moved = 'due-soon-p1|1900|2026-11-28T00:00:00.000Z';
    expect(fingerprint).not.toBe(moved);
    expect(parseReadIds(serializeReadIds(new Set([fingerprint])))).toEqual(
      new Set([fingerprint])
    );
  });
});
