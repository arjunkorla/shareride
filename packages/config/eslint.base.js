/** Shared ESLint flat-config base for all ShareRide workspace packages. */
export default [
  {
    ignores: ['dist/**', 'node_modules/**', '.next/**', '.expo/**', 'coverage/**'],
  },
  {
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
]
