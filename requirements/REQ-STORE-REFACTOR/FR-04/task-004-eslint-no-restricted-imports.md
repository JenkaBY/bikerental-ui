# Task 004: Add the `no-restricted-imports` lint guard to `eslint.config.js`

> **Applied Skill:** `angular-tooling` (SKILL.md — Angular CLI / ESLint flat-config tooling) +
> `typescript-es2022` (SKILL.md §"General guardrails" — rely on the project's lint script to enforce
> module-style rules). Enforces FR-04 Scenario 2 ("lint blocks regressions") via the core ESLint
> `no-restricted-imports` rule, scoped exactly as specified in the design §6.

## 1. Objective

Add a `no-restricted-imports` rule to the root flat ESLint config with two scopes: a consumer-scope
body on the existing `files: ['**/*.ts']` block (forbids deep `*/shared/src/*` paths and the
`@store.*` alias), and a new `files: ['projects/shared/**/*.ts']` override (forbids deep paths, the
`@bikerental/shared` self-import, and `@store.*`). Generated code is already exempt via the existing
root `ignores`. **Run this task only AFTER tasks 001–003** so the code already complies and the rule
goes green immediately.

## 2. File to Modify

* **File Path:** `D:\Workspace\private\bikerental-ui\eslint.config.js`
* **Action:** Modify Existing File

## 3. Code Implementation

The current file ends the `**/*.ts` block's `rules` object after the `@angular-eslint/component-selector`
rule, then has the `**/*.html` block. Make two edits.

### Edit A — add the rule to the consumer-scope `rules` object

**OLD (lines 24–42, the `rules` object of the `files: ['**/*.ts']` block):**

```js
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
    },
```

**NEW:**

```js
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
```

### Edit B — add the shared-library override config object

Insert a **new config object** AFTER the `files: ['**/*.ts']` block's closing `},` and BEFORE the
`files: ['**/*.html']` block, so it wins on overlap for files under `projects/shared`.

**OLD (lines 43–48, the start of the html block):**

```js
  },
  {
    files: ['**/*.html'],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
    rules: {},
  },
```

**NEW (insert the shared override between the `},` and the html block):**

```js
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
```

> Notes for the dev:
> - Do NOT touch the top `ignores` block — `src/app/core/api/generated/**` and
>   `projects/shared/**/core/api/generated/**` are already listed, so the rule never fires on
>   generated client code (design §6 "Generated-code exemption").
> - `no-restricted-imports` is a core ESLint rule, fully supported in the typescript-eslint flat
>   config already in use; no new dependency is required.

## 4. Validation Steps

Execute from the repo root `D:\Workspace\private\bikerental-ui`. Do NOT start the dev server, run
E2E, or inspect databases.

```bash
npm run lint
npm run fix
npm run build
npm test
```

`npm run lint` must report **zero** `no-restricted-imports` errors repo-wide — this proves tasks
001–003 fully removed every forbidden specifier (FR-04 Scenario 1) AND that the new rule is wired
(FR-04 Scenario 2). If lint reports a violation, it is an un-rewritten import from a prior task: fix
that import (do not weaken the rule). `npm run build` and `npm test` confirm no behavior changed.
