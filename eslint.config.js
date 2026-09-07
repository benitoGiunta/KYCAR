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
 */
export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**'],
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
);
