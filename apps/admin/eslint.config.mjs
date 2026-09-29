import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import base from '@shareride/config/eslint.base.js'

export default tseslint.config(
  { ignores: ['next-env.d.ts'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...base,
)
