import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import globals from 'globals'
import pluginJs from '@eslint/js'
import pluginReact from 'eslint-plugin-react'
import tseslint from 'typescript-eslint'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const gitignores = fs.readFileSync(path.join(dirname, '.gitignore'), 'utf8').split('\n').filter(Boolean)

export default [
  {
    ignores: [...gitignores, 'dist'],
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'],
  },
  {
    languageOptions: {
      globals: globals.browser,
    },
  },

  // JavaScript
  pluginJs.configs.recommended,

  // TypeScript
  ...tseslint.configs.recommended,

  // React
  {
    ...pluginReact.configs.flat.recommended,
    settings: {
      react: {
        version: 'detect',
      },
    },
  },

  // Rules override
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      'no-case-declarations': 'off',
    },
  },
]
