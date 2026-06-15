import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import angular from 'angular-eslint';
import prettier from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';

export default tseslint.config(
  {
    ignores: ['src/app/core/api/generated/**', 'projects/shared/**/core/api/generated/**'],
  },
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
      prettier,
    ],
    processor: angular.processInlineTemplates,
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      'prettier/prettier': 'error',
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['*/shared/src/*', '**/shared/src/**'],
              message:
                'Import shared symbols from "@bikerental/shared", not deep relative paths into projects/shared/src.',
            },
            {
              group: ['@store.*'],
              message:
                'The @store.* alias is internal to the shared library. Import shared stores from "@bikerental/shared".',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['projects/shared/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['*/shared/src/*', '**/shared/src/**'],
              message:
                'Inside the shared library use relative paths, not deep paths into projects/shared/src.',
            },
            {
              group: ['@bikerental/shared'],
              message:
                'The shared library must not import its own public barrel (cyclic-init hazard). Use a relative path.',
            },
            {
              group: ['@store.*'],
              message: 'Use relative paths inside the shared library, not the @store.* alias.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
    rules: {},
  },
);
