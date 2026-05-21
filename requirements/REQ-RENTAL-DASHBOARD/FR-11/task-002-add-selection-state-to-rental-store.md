# Task 002: Add Equipment Selection State and Methods to `RentalStore`

> **Applied Skill:** `angular-signals` — Adds a `WritableSignal<Set<number>>` for selection state and four mutation methods; the `Set` is immutably replaced on each update to ensure signal reactivity. Also adds a `rentalEquipmentItems` typed accessor for downstream components that need `RentalEquipmentItem[]` rather than the base `EquipmentSearchItem[]`.

## 1. Objective

`RentalEquipmentSectionComponent` (created in Task 004) needs to drive and read checkbox selection state, and `RentalDetailComponent` (Task 005) needs to pass `RentalEquipmentItem[]` — not the base `EquipmentSearchItem[]` — to it. This task adds all required state and methods to `RentalStore` without altering any existing signal or behavior.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/state/rental.store.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

### Step A — Add `RentalEquipmentItem` to the import block

**Before:**

```typescript
import {
  type BrokenEquipmentEntry,
  type Customer,
  type EquipmentSearchItem,
  type RentalDetailState,
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
} from '@ui-models';
```

> **Note:** `@ui-models` is the TypeScript path alias for `projects/shared/src/core/models`. If the project uses a different alias (e.g. `@bikerental/shared`), adjust accordingly. Check `tsconfig.json` — the alias used in existing imports of this file is `@ui-models`.

### Step B — Add `selectedEquipmentItemIds`, `selectedEquipmentCount`, and `rentalEquipmentItems` signals

**Location:** In the `RentalStore` class body, immediately after the existing `readonly loadError = signal(false);` line.

**Before:**

```typescript
  readonly loadError = signal(false);

  readonly status = computed(() => this._state().status);
```

**After:**

```typescript
  readonly loadError = signal(false);

  readonly selectedEquipmentItemIds = signal<Set<number>>(new Set<number>());
  readonly selectedEquipmentCount = computed(() => this.selectedEquipmentItemIds().size);
  readonly rentalEquipmentItems = computed(
    () => this._state().equipmentItems as RentalEquipmentItem[],
  );

  readonly status = computed(() => this._state().status);
```

### Step C — Add selection mutation methods

**Location:** In the `RentalStore` class body, immediately after the existing `setSpecialPrice` method (which ends around the `setSpecialPrice` block), and before the `save()` method.

**Before:**

```typescript
  setSpecialPrice(price: number | null): void {
    if (!this._state().specialPriceEnabled) {
      return;
    }

    this.patchState({
      specialPriceEnabled: true,
      specialPrice: price ?? undefined,
      discountPercent: undefined,
    });
  }

  save() {
```

**After:**

```typescript
  setSpecialPrice(price: number | null): void {
    if (!this._state().specialPriceEnabled) {
      return;
    }

    this.patchState({
      specialPriceEnabled: true,
      specialPrice: price ?? undefined,
      discountPercent: undefined,
    });
  }

  selectEquipmentItem(id: number): void {
    const next = new Set(this.selectedEquipmentItemIds());
    next.add(id);
    this.selectedEquipmentItemIds.set(next);
  }

  deselectEquipmentItem(id: number): void {
    const next = new Set(this.selectedEquipmentItemIds());
    next.delete(id);
    this.selectedEquipmentItemIds.set(next);
  }

  selectAllActiveItems(ids: number[]): void {
    this.selectedEquipmentItemIds.set(new Set(ids));
  }

  clearSelection(): void {
    this.selectedEquipmentItemIds.set(new Set<number>());
  }

  save() {
```

### Step D — Reset `selectedEquipmentItemIds` inside `reset()`

**Before:**

```typescript
  reset(): void {
    this.patchState({
      id: null,
      customer: null,
      equipmentItems: [],
      specialPriceEnabled: false,
      isSaving: false,
      isActivating: false,
      isLoading: false,
    });
  }
```

**After:**

```typescript
  reset(): void {
    this.selectedEquipmentItemIds.set(new Set<number>());
    this.patchState({
      id: null,
      customer: null,
      equipmentItems: [],
      specialPriceEnabled: false,
      isSaving: false,
      isActivating: false,
      isLoading: false,
    });
  }
```

## 4. Validation Steps

skip
