# Task 002: Export `TopUpDialogComponent` from Shared `public-api.ts`

> **Applied Skill:** `angular-component` — All shared components must be re-exported from the library's public API barrel so consuming projects (`admin`, `operator`) can import via the `@bikerental/shared` path alias.

## 1. Objective

Add a single `export *` line for the new `TopUpDialogComponent` to `projects/shared/src/public-api.ts` so it becomes importable as `import { TopUpDialogComponent } from '@bikerental/shared'` in both the admin and operator projects.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/public-api.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Code to Add/Replace:**

* **Location:** After the existing `save-button` export line (last line of the "Shared UI — components" block, currently line 65 area). Insert immediately after the line:
  `export * from './shared/components/save-button/save-button.component';`

```typescript
export * from './shared/components/top-up-dialog/top-up-dialog.component';
```

The updated block tail should look like:

```typescript
export * from './shared/components/save-button/save-button.component';
export * from './shared/components/top-up-dialog/top-up-dialog.component';
```

## 4. Validation Steps

skip
