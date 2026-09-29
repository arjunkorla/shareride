import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import base from '@shareride/config/eslint.base.js'

export default tseslint.config(
  { ignores: ['babel.config.js', 'jest.config.js', 'jest.setup.js', 'metro.config.js'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...base,
)
