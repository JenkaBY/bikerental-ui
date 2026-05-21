# Task 002: Extend `RENTAL_STORE_TOKEN` Interface with Pricing Contract

> **Applied Skill:** `angular-di` — Extends the existing `RentalStoreContract` injection token interface to include all pricing-related signals and mutator methods required by `RentalPricingSectionComponent`, as specified in FR-07 / FR-10.

## 1. Objective

`RENTAL_STORE_TOKEN` currently only declares the customer-balance contract. `RentalPricingSectionComponent` must inject this token (not the concrete `RentalStore` class). Add the seven pricing members to `RentalStoreContract` so the token fully represents the shared interface for both `RentalCustomerPanelComponent` and `RentalPricingSectionComponent`.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/state/rental-store.token.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:**

```typescript
// Add `WritableSignal` to the existing import from '@angular/core'
import { InjectionToken, Signal, WritableSignal } from '@angular/core';
```

> **Note:** The pricing signals in `RentalStore` are `computed()` (read-only `Signal<T>`), not `WritableSignal`. The contract must declare them as `Signal<T>` — mutators are exposed as plain methods. `WritableSignal` is NOT needed; keep the import as `Signal` only.

**Code to Add/Replace:**

* **Location:** Replace the entire file content with the following:

```typescript
import { InjectionToken, Signal } from '@angular/core';
import type { Customer, CustomerBalance } from '@ui-models';

export interface RentalStoreContract {
  readonly customer: Signal<Customer | null>;
  readonly customerBalance: Signal<CustomerBalance | null>;
  readonly isBalanceSufficient: Signal<boolean>;

  readonly specialPriceEnabled: Signal<boolean>;
  readonly isSelectedAnyEquipment: Signal<boolean>;
  readonly specialPrice: Signal<number | null>;
  readonly discountPercent: Signal<number | null>;

  setSpecialPriceEnabled(value: boolean): void;
  setSpecialPrice(value: number | null): void;
  setDiscountPercent(value: number | null): void;
}

export const RENTAL_STORE_TOKEN = new InjectionToken<RentalStoreContract>('RentalStoreContract');
```

## 4. Validation Steps

skip
