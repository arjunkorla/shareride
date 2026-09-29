import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import base from '@shareride/config/eslint.base.js'

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...base,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
)
