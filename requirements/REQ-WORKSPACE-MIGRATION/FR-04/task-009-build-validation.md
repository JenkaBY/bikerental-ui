# Task 009: Build and Test Validation

## 1. Objective

Verify that the entire `admin` project compiles cleanly, produces a development build artifact, and that all relocated unit tests pass. This is the final validation gate for FR-04.

## 2. Files to Modify / Create

None. This task is validation-only.

---

## 3. Code Implementation

No code changes. Execute the validation commands in order.

---

## 4. Validation Steps

### Step 1: TypeScript compile-check (app code)

```powershell
npx tsc -p projects/admin/tsconfig.app.json --noEmit
```

**Expected:** Exit code `0`, no output (zero errors).

### Step 2: TypeScript compile-check (spec code)

```powershell
npx tsc -p projects/admin/tsconfig.spec.json --noEmit
```

**Expected:** Exit code `0`, no output (zero errors).

### Step 3: Development build

```powershell
npx ng build admin --configuration=development
```

**Expected:**

- Exit code `0`.
- Output written to `dist/admin/`.
- No `error` lines in build output (i18n missing-translation warnings are suppressed by `i18nMissingTranslation: "ignore"` already set in `angular.json`).

### Step 4: Unit tests

```powershell
npx ng test admin --watch=false
```

**Expected:**

- All test suites pass.
- No failures in any `projects/admin/**/*.spec.ts` file.

### Troubleshooting Guide

| Symptom                                                          | Likely Cause                                   | Fix                                                                                                       |
|------------------------------------------------------------------|------------------------------------------------|-----------------------------------------------------------------------------------------------------------|
| `Cannot find module '@bikerental/shared'`                        | Missing path alias in tsconfig                 | Verify `tsconfig.json` root has `"@bikerental/shared": ["projects/shared/src/public-api.ts"]`             |
| `Cannot find module '../../../shared/...'`                       | Missed import substitution in a relocated file | Re-read source, apply substitution rule from Tasks 005–007                                                |
| `Failed to read index HTML file 'projects/admin/src/index.html'` | `index.html` missing                           | Ensure Task 008 created `projects/admin/src/index.html`                                                   |
| `Cannot find module './environments/environment'`                | Environment file missing                       | Ensure Task 008 created `projects/admin/src/environments/environment.ts`                                  |
| `Cannot find module '*.component'` (in routes)                   | Feature component file not created             | Identify missing component from error path, create from corresponding source in `src/app/features/admin/` |
