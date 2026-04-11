import js from '@eslint/js'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'

export default [
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    plugins: {
      react,
      'react-hooks': reactHooks
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        localStorage: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        Blob: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        navigator: 'readonly',
        FileReader: 'readonly',
        Image: 'readonly',
        // Vite globals
        import: 'readonly',
        // Build-time constant injected via vite.config.js define
        __SENTRY_DSN__: 'readonly'
      }
    },
    settings: {
      react: {
        version: 'detect'
      }
    },
    rules: {
      // React rules
      'react/jsx-uses-react': 'off', // Not needed with React 17+ JSX transform
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'warn',
      'react/jsx-key': 'error',
      'react/jsx-no-duplicate-props': 'error',

      // React Hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // General rules
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': 'off', // We use our logger utility
      'no-debugger': 'warn',
      'eqeqeq': ['error', 'always', { null: 'ignore' }],
      'no-var': 'error',
      'prefer-const': 'warn'
    }
  },
  {
    ignores: ['dist/**', 'node_modules/**', '*.config.js']
  }
]
