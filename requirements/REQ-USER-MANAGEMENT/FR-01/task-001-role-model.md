# Task 001: Role Domain Model (Canonical Role Source)

> **Applied Skills:** `typescript-es2022` (const assertions, readonly arrays), `angular-component` (no side effects, pure value/type module) — this file is the single source of truth for the two assignable roles, replacing ad-hoc `'ADMIN' | 'OPERATOR'` literals scattered across the codebase.

## 1. Objective

Create `role.model.ts` exporting the canonical `Role` union type, the ordered `ASSIGNABLE_ROLES` constant array, and the `ROLE_LABELS` `$localize`d display-label map. This is the foundational file every later task in this REQ (store, mapper, list chips, create/edit dialogs) imports from instead of redeclaring the role literal.

## 2. Files to Modify / Create

* **File Path:** `projects/shared/src/core/models/role.model.ts`
* **Action:** Create New File

## 3. Code Implementation

**Imports Required:** None (pure type/value file — no external imports needed).

**Code to Add/Replace:**

* **Location:** Full file content — this is a new file.

```typescript
export type Role = 'ADMIN' | 'OPERATOR';

export const ASSIGNABLE_ROLES: readonly Role[] = ['ADMIN', 'OPERATOR'];

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: $localize`Admin`,
  OPERATOR: $localize`Operator`,
};
```

## 4. Validation Steps

```bash
npx tsc --noEmit -p projects/shared/tsconfig.lib.json
```
