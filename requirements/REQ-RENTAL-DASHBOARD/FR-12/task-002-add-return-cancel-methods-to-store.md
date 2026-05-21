# Task 002: Add `returnEquipment()` to `RentalStore` and Update `cancelRental()` Loading State

> **Applied Skill:** `angular-signals` — Adds a `returnEquipment()` observable method that assembles the domain write-model, maps to the generated request, and delegates to the generated service; updates `cancelRental()` to set `isSaving` during the call.

## 1. Objective

`RentalActionButtonsComponent` (Task 005) subscribes to `store.returnEquipment()` and `store.cancelRental()`. Neither currently manages the right loading state for the component to show spinners or prevent double-submission. This task:

1. Adds `returnEquipment(): Observable<void>` to `RentalStore` — sets `isReturning`, assembles `ReturnEquipmentWrite`, maps via `RentalDashboardMapper.toReturnRequest()`, calls `RentalsService.returnEquipment()`.
2. Updates `cancelRental()` — wraps the existing call in `isSaving` state management using `finalize`.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/state/rental.store.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

### Step A — Add `ReturnEquipmentWrite` to the `@ui-models` import

**Before (after FR-11 task-002 was applied):**

```typescript
import {
  type BrokenEquipmentEntry,
  type Customer,
  type EquipmentSearchItem,
  type RentalDetailState,
  type RentalEquipmentItem,
} from '@ui-models';
```

**After:**

```typescript
import {
  type BrokenEquipmentEntry,
  type Customer,
  type EquipmentSearchItem,
  type RentalDetailState,
  type RentalEquipmentItem,
  type ReturnEquipmentWrite,
} from '@ui-models';
```

### Step B — Update `cancelRental()` to set `isSaving` state

**Before:**

```typescript
  cancelRental(): Observable<void> {
    const id = this._state().id;
    if (id === null) throw new Error('No rental id in store');
    return this.rentalsService
      .updateLifecycle(id, { status: 'CANCELLED', operatorId: this.operatorId() })
      .pipe(map(() => undefined as void));
  }
```

**After:**

```typescript
  cancelRental(): Observable<void> {
    const id = this._state().id;
    if (id === null) throw new Error('No rental id in store');
    this.patchState({ isSaving: true });
    return this.rentalsService
      .updateLifecycle(id, { status: 'CANCELLED', operatorId: this.operatorId() })
      .pipe(
        map(() => undefined as void),
        finalize(() => this.patchState({ isSaving: false })),
      );
  }
```

### Step C — Add `returnEquipment()` method

**Location:** In `RentalStore`, immediately after the updated `cancelRental()` method and before `loadDetail()`.

**Before:**

```typescript
  cancelRental(): Observable<void> {
    const id = this._state().id;
    if (id === null) throw new Error('No rental id in store');
    this.patchState({ isSaving: true });
    return this.rentalsService
      .updateLifecycle(id, { status: 'CANCELLED', operatorId: this.operatorId() })
      .pipe(
        map(() => undefined as void),
        finalize(() => this.patchState({ isSaving: false })),
      );
  }

  loadDetail(id: number): void {
```

**After:**

```typescript
  cancelRental(): Observable<void> {
    const id = this._state().id;
    if (id === null) throw new Error('No rental id in store');
    this.patchState({ isSaving: true });
    return this.rentalsService
      .updateLifecycle(id, { status: 'CANCELLED', operatorId: this.operatorId() })
      .pipe(
        map(() => undefined as void),
        finalize(() => this.patchState({ isSaving: false })),
      );
  }

  returnEquipment(): Observable<void> {
    const id = this._state().id;
    if (id === null) throw new Error('No rental id in store');
    this.patchState({ isReturning: true });
    const write: ReturnEquipmentWrite = {
      rentalId: id,
      equipmentItemIds: [...this.selectedEquipmentItemIds()],
    };
    const request = RentalDashboardMapper.toReturnRequest(write, this.operatorId());
    return this.rentalsService.returnEquipment(request).pipe(
      map(() => undefined as void),
      finalize(() => this.patchState({ isReturning: false })),
    );
  }

  loadDetail(id: number): void {
```

## 4. Validation Steps

skip
