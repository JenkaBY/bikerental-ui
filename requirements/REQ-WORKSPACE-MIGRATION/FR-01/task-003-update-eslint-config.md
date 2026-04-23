# Task 003: Update ESLint Configuration for Multi-Project Scope

> **Applied Skill:** `angular-tooling` — `@angular-eslint/builder:lint` target scoping; ESLint `ignores` pattern updates for generated code relocated in later FRs.

## 1. Objective

Update `eslint.config.js` so that:

1. The `ignores` pattern covers the auto-generated API client at its **future** location (`projects/shared/**/core/api/generated/**`) in addition to the current location (`src/app/core/api/generated/**`). This avoids a breaking lint failure after FR-02 moves the generated code.
2. The `files` glob for TypeScript rules is broadened from `src/**` to also cover `projects/**`.
3. The `files` glob for HTML template rules is similarly broadened.
4. The `lint-staged` scope in `package.json` is updated to cover `projects/**` in addition to `src/**`, so pre-commit hooks run on files in all project directories.

## 2. File to Modify / Create

### 2a. `eslint.config.js` — Modify Existing File

**Current `ignores` block (lines 8–10):**

```js
  {
    ignores: ['src/app/core/api/generated/**'],
  },
```

**Replace with:**

```js
  {
    ignores: [
      'src/app/core/api/generated/**',
      'projects/shared/**/core/api/generated/**',
    ],
  },
```

**Current TypeScript `files` pattern (line 12):**

```js
    files: ['**/*.ts'],
```

No change required — `**/*.ts` already matches files in `projects/**`.

**Current HTML `files` pattern (near line 46):**

```js
    files: ['**/*.html'],
```

No change required — `**/*.html` already matches files in `projects/**`.

> The `files: ['**/*.ts']` and `files: ['**/*.html']` globs are already workspace-wide. Only the `ignores` block needs updating in this task.

### 2b. `package.json` — Modify `lint-staged` block

**Current `lint-staged` block:**

```json
"lint-staged": {
  "src/**/*.{ts,html}": [
    "eslint --fix"
  ],
  "src/**/*.{ts,html,scss,css,json}": [
    "prettier --write"
  ]
},
```

**Replace with:**

```json
"lint-staged": {
  "{src,projects}/**/*.{ts,html}": [
    "eslint --fix"
  ],
  "{src,projects}/**/*.{ts,html,scss,css,json}": [
    "prettier --write"
  ]
},
```

## 3. Code Implementation

**Imports Required:** N/A — config files.

**Code to Add/Replace:**

### eslint.config.js — exact replacement

* **Location:** The `ignores` object at the top of the `tseslint.config(...)` call — it is the first item in the array passed to `tseslint.config`, before the TypeScript `files` block.

**Old string (exact):**

```js
  {
    ignores: ['src/app/core/api/generated/**'],
  },
```

**New string (exact):**

```js
  {
    ignores: [
      'src/app/core/api/generated/**',
      'projects/shared/**/core/api/generated/**',
    ],
  },
```

### package.json — exact replacement

* **Location:** The `"lint-staged"` top-level key in `package.json`.

**Old string (exact):**

```json
  "lint-staged": {
    "src/**/*.{ts,html}": [
      "eslint --fix"
    ],
    "src/**/*.{ts,html,scss,css,json}": [
      "prettier --write"
    ]
  },
```

**New string (exact):**

```json
  "lint-staged": {
    "{src,projects}/**/*.{ts,html}": [
      "eslint --fix"
    ],
    "{src,projects}/**/*.{ts,html,scss,css,json}": [
      "prettier --write"
    ]
  },
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
# Confirm ESLint config parses without error
npx eslint --print-config src/app/app.ts > /dev/null

# Run lint against current src — must still pass with zero errors
npx ng lint bikerental-ui 2>&1 || npx eslint src --ext .ts,.html
```

> The `ng lint bikerental-ui` target no longer exists after task-001 removed it. Use the direct `eslint` call as the fallback. Zero errors expected on `src/app/` since no source changed.

```bash
# Verify the ignores patterns are present in the printed config
npx eslint --print-config src/app/core/api/generated/models/index.ts | grep -i ignore
```

Expected: output contains `src/app/core/api/generated/**` in the ignore list.
