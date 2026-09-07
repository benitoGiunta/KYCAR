// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

/**
 * KYCAR - ESLint flat config (lot D1).
 *
 * Kept intentionally small: `@eslint/js` recommended + `typescript-eslint` recommended, no
 * type-aware ("recommendedTypeChecked") ruleset in D1 to avoid coupling lint speed to a
 * `parserOptions.project` resolution that later lots' generated/large files would slow down -
 * revisit if a later lot wants stricter type-aware rules.
 *
 * `scripts/` (chantier 1/2.0-2.3 tooling, e.g. `scripts/fetch-reference-data.mjs`) is out of this
 * lot's periphery per the D1 work order - excluded from linting, not fixed here.
 */
export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'scripts/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    // Plain-Node tooling scripts that ship with this lot (the bundle size guard). Not
    // type-checked by tsc (see package.json `build`), so no TS-specific rules apply here -
    // just give them the Node globals `no-undef` needs.
    files: ['tools/**/*.mjs'],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
      },
    },
  },
);
