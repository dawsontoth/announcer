// eslint.config.js
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from '@typescript-eslint/eslint-plugin';
import importPlugin, { createNodeResolver } from 'eslint-plugin-import-x';
import tsParser from '@typescript-eslint/parser';
import eslintJs from '@eslint/js';

export default defineConfig([
  eslintJs.configs.recommended,
  globalIgnores(['dist/**/*']),
  {
    files: ['**/*.ts'],
    extends: [importPlugin.flatConfigs.recommended, importPlugin.flatConfigs.typescript],
    settings: {
      // The typescript preset expects eslint-import-resolver-typescript; the built-in node resolver is enough here.
      'import-x/resolver-next': [createNodeResolver()],
    },
    rules: {
      'import-x/extensions': ['error', 'ignorePackages', { 'js': 'always', 'jsx': 'always', 'ts': 'always', 'tsx': 'always' }],
    },
  },
  {
    files: ['**/*.[jt]s'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2018,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        setTimeout: 'readonly',
        require: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'arrow-parens': ['error', 'as-needed'],
      'comma-dangle': ['error', 'always-multiline'],
      'indent': ['error', 2],
      'no-console': 'off',
      'no-multi-spaces': ['error'],
      'no-trailing-spaces': ['error'],
      'object-curly-spacing': ['error', 'always'],
      'quotes': ['error', 'single'],
      'semi': ['error', 'always'],
      'template-curly-spacing': ['error', 'never'],
    },
  },
]);
