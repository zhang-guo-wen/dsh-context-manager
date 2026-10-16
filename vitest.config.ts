/**
 * Spec runner for this package.
 *
 * `npm test` runs `vitest run`, whose default include also collects
 * `tests/plugin-metadata.test.mjs`; that file is a `node:test` suite, so vitest
 * reports "No test suite found" and the command fails. `test:metadata` owns it.
 * Pinning `root` and the include keeps vitest on the Vitest specs only.
 */
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    root: import.meta.dirname,
    include: ['tests/**/*.spec.ts'],
    exclude: ['**/node_modules/**', 'tests/**/*.test.mjs'],
    environment: 'node',
  },
})
