/**
 * Structure guards — the component taxonomy stays enforceable.
 *
 * Fails when a file keeps importing the removed `components/common`
 * location, when a component exports a formatting helper instead of
 * `lib/format`, or when a barrel of the taxonomy disappears.
 *
 * @module Tests/Structure
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SRC = join(__dirname, '..', 'src');

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return walk(full);
    return /\.(ts|tsx)$/.test(entry) ? [full] : [];
  });
}

const files = walk(SRC);

function filesMatching(pattern: RegExp): string[] {
  return files.filter((file) => pattern.test(readFileSync(file, 'utf8')));
}

describe('component taxonomy', () => {
  it('keeps the taxonomy barrels in place', () => {
    for (const barrel of ['ui', 'form', 'patterns']) {
      expect(existsSync(join(SRC, 'components', barrel, 'index.ts'))).toBe(
        true
      );
    }
    expect(existsSync(join(SRC, 'lib', 'format.ts'))).toBe(true);
    expect(existsSync(join(SRC, 'components', 'common'))).toBe(false);
  });

  it('has no remaining import of the removed common folder', () => {
    expect(filesMatching(/@\/components\/common/)).toEqual([]);
  });

  it('keeps formatting helpers out of components', () => {
    const offenders = filesMatching(
      /export function format(Amount|Date)/
    ).filter((file) => file.includes(`${join('src', 'components')}`));
    expect(offenders).toEqual([]);
  });

  it('keeps client components away from the server layer', () => {
    const offenders = filesMatching(/@\/server\//).filter((file) =>
      /'use client'/.test(readFileSync(file, 'utf8'))
    );
    expect(offenders).toEqual([]);
  });

  it('keeps shared folders free of domain components', () => {
    const shared = ['ui', 'form', 'patterns'].flatMap((dir) =>
      walk(join(SRC, 'components', dir))
    );
    const offenders = shared.filter((file) =>
      /@\/components\/(accounts|charges|transfers|household|dashboard|payments|schedule)\//.test(
        readFileSync(file, 'utf8')
      )
    );
    expect(offenders).toEqual([]);
  });
});
