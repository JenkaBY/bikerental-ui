# Task 008: Build and Test Validation

> **Applied Skill:** `angular-tooling` — `ng build`, `ng test`, production build validation.

## 1. Objective

Validate the complete operator project extraction by running a TypeScript compile check, the operator unit test suite, and a production build. All must pass cleanly before FR-05 is considered done.

## 2. Files to Modify / Create

No files are created or modified in this task. This is a validation-only task.

---

## 3. Code Implementation

No code to write.

---

## 4. Validation Steps

Execute the following commands **in order**. Each must succeed before proceeding to the next.

**Step 1 — TypeScript compile check (app sources):**

```powershell
npx tsc -p projects/operator/tsconfig.app.json --noEmit 2>&1 | Select-String "error TS"
```

Expected: **no output**.

**Step 2 — TypeScript compile check (spec sources):**

```powershell
npx tsc -p projects/operator/tsconfig.spec.json --noEmit 2>&1 | Select-String "error TS"
```

Expected: **no output**.

**Step 3 — Operator unit tests:**

```powershell
npx ng test operator --watch=false
```

Expected: all tests pass (`13 passed`, `0 failed`). Specifically:

- `OperatorLayoutComponent` — 9 tests
- `OperatorLayoutComponent handlers` — 1 test
- `OperatorShellWrapperComponent` — 2 tests
- `OperatorShellWrapperComponent handlers` — 1 test

**Step 4 — Operator production build:**

```powershell
npx ng build operator --configuration production
```

Expected: build completes without errors; output artifact emitted to `dist/operator/browser/`. No `projects/admin/` or `projects/gateway/` source files appear in the build output.
