# Task 001: Domain Model Interfaces

> **Applied Skill:** `angular-data-flow-orchestrator` — Phase 1: Model Definition. New UI-layer
> interfaces are added to the shared `core/models/` layer so all dashboard and detail components
> import clean domain types only.

## 1. Objective

Create `rental-dashboard.model.ts` in the shared library with five new domain interfaces
(`RentalListItem`, `RentalEquipmentItem`, `BrokenEquipmentEntry`, `ReturnEquipmentWrite`,
`RentalDetailState`) and re-export them from the shared `core/models/index.ts` barrel so they
are available via `@bikerental/shared` and `@ui-models` to every downstream task.

## 2. Files to Modify / Create

* **File Path:** `projects/shared/src/core/models/rental-dashboard.model.ts`
* **Action:** Create New File

* **File Path:** `projects/shared/src/core/models/index.ts`
* **Action:** Modify Existing File

---

## 3. Code Implementation

### 3.1 — Create `rental-dashboard.model.ts`

**Imports Required:**

```typescript
import type { Money } from './transaction.model';
import type { RentalState } from './rental-create.model';
import type { EquipmentSearchItem } from './equipment.model';
```

**Code to Add:**

* **Location:** New file — full file content

```typescript
import type { Money } from './transaction.model';
import type { RentalState } from './rental-create.model';
import type { EquipmentSearchItem } from './equipment.model';

export interface RentalListItem {
  readonly id: number;
  readonly status: string;
  readonly customerPhone: string;
  readonly customerName?: string;
  readonly startedAt: Date;
  readonly equipmentNames: readonly string[];
  readonly expectedReturnAt?: Date;
  readonly isActive: boolean;
  readonly isDebt: boolean;
  readonly isOverdue: boolean;
  readonly overdueMinutes?: number;
}

export interface RentalEquipmentItem extends EquipmentSearchItem {
  readonly statusSlug: string;
  readonly isReturned: boolean;
}

export interface BrokenEquipmentEntry {
  equipmentItemId: number;
  penaltyAmount?: number;
}

export interface ReturnEquipmentWrite {
  rentalId: number;
  equipmentItemIds: number[];
  discountPercent?: number;
  specialPrice?: number;
}

export interface RentalDetailState extends RentalState {
  status: string;
  customerId: string;
  customerBalance?: Money;
  startedAt: Date | null;
  expectedReturnAt?: Date;
  paidDurationMinutes?: number;
  finalCost?: Money;
  debtAmount?: Money;
  isActive: boolean;
  isDebt: boolean;
  isOverdue: boolean;
  overdueMinutes?: number;
  brokenEquipmentEntries: BrokenEquipmentEntry[];
  isReturning: boolean;
}
```

**Key design decisions encoded in the model:**

- `RentalListItem` — all fields `readonly` (immutable view model for list cards)
- `RentalEquipmentItem extends EquipmentSearchItem` — adds `statusSlug` and `isReturned`; `isReturned` is always `statusSlug === 'RETURNED'` (derived by the mapper, stored as data here)
- `BrokenEquipmentEntry` — mutable (dialog builds entries incrementally)
- `ReturnEquipmentWrite` — mutable (detail store accumulates pricing inputs before submitting)
- `RentalDetailState extends RentalState` — adds the detail-specific fields; base `RentalState` fields (`id`, `customer`, `equipmentItems`, `durationMinutes`, `discountPercent`, `specialPrice`, `specialPriceEnabled`, `isSaving`, `isActivating`, `isLoading`) are inherited unchanged; `isActivating` is inherited but never set to `true` in the detail store (DRAFT rentals bypass this route entirely)

---

### 3.2 — Update `core/models/index.ts` barrel

**File Path:** `projects/shared/src/core/models/index.ts`

* **Location:** After the last existing `export * from` line (currently `export * from './rental-create.model';`)

* **Snippet:**

```typescript
export * from './rental-dashboard.model';
```

The final lines of `projects/shared/src/core/models/index.ts` should look like:

```typescript
export * from './user-profile.model';
export * from './user-preferences.model';
export * from './rental-create.model';
export * from './rental-dashboard.model';
```

---

## 4. Validation Steps

skip
