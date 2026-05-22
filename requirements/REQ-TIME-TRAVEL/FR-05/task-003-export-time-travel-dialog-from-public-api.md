# Task 003: Export `TimeTravelDialogComponent` from the Shared Public API Barrel

> **Applied Skill:** `angular-di` — dialog component exported through the library barrel so `MatDialog.open(TimeTravelDialogComponent)` in `TimeTravelDisplayComponent` resolves without deep relative imports

## 1. Objective

Add `TimeTravelDialogComponent` to `projects/shared/src/public-api.ts`. This also unblocks the `npm run build:shared` validation for FR-04 tasks, because `TimeTravelDisplayComponent` imports `TimeTravelDialogComponent` by relative path and the shared library build requires the file to exist.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/public-api.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:**

```typescript
// No imports — this is a barrel re-export line
```

**Code to Add/Replace:**

* **Location:** Append immediately **after** the `time-travel-display` export line added in FR-04 task-003:
  `export * from './shared/components/time-travel-display/time-travel-display.component';`

* **Snippet (Add after the time-travel-display line):**

```typescript
export * from './shared/components/time-travel-dialog/time-travel-dialog.component';
```

The relevant section of `public-api.ts` should look like this after the change:

```typescript
export * from './shared/components/app-toolbar/app-toolbar.component';
export * from './shared/components/time-travel-display/time-travel-display.component';
export * from './shared/components/time-travel-dialog/time-travel-dialog.component';
export * from './shared/components/bottom-nav/bottom-nav.component';
```

## 4. Validation Steps

skip
