/**
 * Import View Component
 *
 * Composition shell: page → View → Guard (children) → Content.
 *
 * @module Components/Import/ImportView
 */

import { ImportGuard } from './import-guard';
import { ImportContent } from './import-content';
import { JSX } from 'react';

export function ImportView(): JSX.Element {
  return (
    <ImportGuard>
      <ImportContent />
    </ImportGuard>
  );
}
