# Task 001: Add `isDraft` Computed Signal to `RentalStore`

> **Applied Skill:** `angular-signals` — Add a `computed()` signal that derives draft status from the existing `status` string field; fixes the pre-existing template reference to `store.isDraft()` in `RentalDetailComponent`.

## 1. Objective

`RentalDetailComponent` already references `store.isDraft()` in its template (line 110), but `RentalStore` has no such signal. This task adds the missing `isDraft` computed signal to `RentalStore` so the TypeScript build succeeds before the remaining FR-10 tasks are applied.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/state/rental.store.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:** None — all required Angular imports already present.

**Code to Add/Replace:**

* **Location:** Inside `RentalStore`, immediately after the line `readonly isDebt = computed(() => this._state().isDebt);` (currently around line 80).

* **Snippet:**

```typescript
  readonly
isDraft = computed(() => this._state().status === 'DRAFT');
```

### Full context diff (lines around the insertion point):

```typescript
  readonly
isActive = computed(() => this._state().isActive);
readonly
isDebt = computed(() => this._state().isDebt);
readonly
isDraft = computed(() => this._state().status === 'DRAFT');  // ← ADD THIS LINE
readonly
isOverdue = computed(() => this._state().isOverdue);
```

## 4. Validation Steps

skip
