import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-config-prettier/flat';
import autoImports from './.wxt/eslint-auto-imports.mjs';

export default [
  {
    ignores: [
      '.wxt/**',
      '.output/**',
      'dist/**',
      'node_modules/**',
      'coverage/**',
      'Docs/**',
      '.agent/**',
      '.agents/**',
      '.claude/**',
      'scripts/validate-env.ts',
    ],
  },
  autoImports,
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked.map((cfg) => ({
    ...cfg,
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ...cfg.languageOptions,
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
  })),
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  {
    files: ['tests/e2e/**/*.{ts,tsx}'],
    rules: {
      'react-hooks/rules-of-hooks': 'off',
      'react-refresh/only-export-components': 'off',
      'no-empty-pattern': 'off',
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: { 'no-console': 'error' },
  },
  {
    files: ['**/telemetry/logger.ts'],
    rules: { 'no-console': 'off' },
  },
  {
    files: ['*.{js,mjs,cjs}', 'wxt.config.ts'],
    languageOptions: {
      globals: {
        module: 'readonly',
        require: 'readonly',
        process: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        __dirname: 'readonly',
      },
    },
  },
  prettier,
];
