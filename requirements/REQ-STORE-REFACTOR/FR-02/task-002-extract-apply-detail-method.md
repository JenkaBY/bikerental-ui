# Task 002: Extract `private applyDetail` Method

> **Applied Skill:** `angular-signals` — Intent-named internal mutation paths; `typescript-es2022` — private method extraction for single-entry-point design.

## 1. Objective

Introduce a `private applyDetail(state: Partial<RentalDetailState>): void` method in `RentalStore` whose sole body is `this.patchState(state)`. This gives the detail-hydration path its own named origin, making it trivial to locate and reason about separately from other `patchState` call sites.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/state/rental.store.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:**

No new imports are needed. `RentalDetailState` is already imported at the top of the file via the `@ui-models` barrel:

```typescript
import {
  type BrokenEquipmentEntry,
  type Customer,
  type EquipmentSearchItem,
  type RentalDetailState,
  type RentalEquipmentItem,
} from '@ui-models';
```

**Code to Add/Replace:**

**Step A — Add the new private method.**

* **Location:** Directly above the existing `private mapToRequest()` method (currently around line 195). Insert the new method between `removeEquipmentItem` and `setDiscountPercent` is acceptable, but the canonical insertion point is immediately above `private mapToRequest()` so all private helpers are grouped together.

Add the following block immediately before `private mapToRequest()`:

```typescript
  private applyDetail(state: Partial<RentalDetailState>): void {
    this.patchState(state);
  }
```

**Step B — Update the `loadDetail` subscribe callback.**

* **Location:** Inside the `loadDetail` method, in the `.subscribe(...)` callback (currently at line 269–272).

Replace this exact snippet:

```typescript
      .subscribe((state) => {
        this.patchState(state);
        this.setCustomer(state.customer || null);
      });
```

With:

```typescript
      .subscribe((state) => {
        this.applyDetail(state);
        this.setCustomer(state.customer || null);
      });
```

The only change in Step B is replacing `this.patchState(state)` with `this.applyDetail(state)`. All other lines in `loadDetail` (`patchState({ isLoading: true })`, the `finalize` and `catchError` calls) continue to call `this.patchState(...)` directly and must not be changed.

## 4. Validation Steps

```bash
npm run build
```

The build must produce zero errors. The `applyDetail` method delegates directly to the now-private `patchState`, so TypeScript will accept the call because `applyDetail` is defined inside the same class.
