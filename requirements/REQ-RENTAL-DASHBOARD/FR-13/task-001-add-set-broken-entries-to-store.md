# Task 001: Add `setBrokenEquipmentEntries()` to `RentalStore`

> **Applied Skill:** `angular-signals` — Adds a synchronous mutator method to `RentalStore` that overwrites the `brokenEquipmentEntries` slice of state. No Observable is returned; this is a pure in-process state update.

## 1. Objective

`RentalActionButtonsComponent` (updated in Task 004) must persist the `BrokenEquipmentEntry[]`
list returned from the bottom sheet into `RentalStore`. `RentalStore.brokenEquipmentEntries` is
already a **read-only** computed signal backed by `_state().brokenEquipmentEntries`. This task
exposes a public write path for that slice.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/state/rental.store.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

### Step A — Add `setBrokenEquipmentEntries()` after the `brokenEquipmentEntries` computed signal

**Location:** The `brokenEquipmentEntries` computed signal is on line ~94. Add the new method
immediately after it.

**Before:**

```typescript
  readonly brokenEquipmentEntries = computed(() => this._state().brokenEquipmentEntries);
  readonly isReturning = computed(() => this._state().isReturning);
```

**After:**

```typescript
  readonly brokenEquipmentEntries = computed(() => this._state().brokenEquipmentEntries);

  setBrokenEquipmentEntries(entries: BrokenEquipmentEntry[]): void {
    this.patchState({ brokenEquipmentEntries: entries });
  }

  readonly isReturning = computed(() => this._state().isReturning);
```

> **Note:** `BrokenEquipmentEntry` is already imported at the top of `rental.store.ts` via the
> `@ui-models` path alias. No new imports are required.

> **Token contract:** `RentalActionButtonsComponent` injects `RentalStore` directly (not via
> `RENTAL_STORE_TOKEN`), so the `RentalStoreContract` interface in `rental-store.token.ts` does
> **not** need updating.

## 4. Validation Steps

skip
