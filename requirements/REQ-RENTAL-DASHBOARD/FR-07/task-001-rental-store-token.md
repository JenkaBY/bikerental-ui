# Task 001: Create `RENTAL_STORE_TOKEN` Injection Token

> **Applied Skill:** `angular-di` — `InjectionToken` with typed interface; export from shared
> library `public-api.ts`.

## 1. Objective

Create a new injection token `RENTAL_STORE_TOKEN` in the shared library so that
`RentalCustomerPanelComponent` can be decoupled from the concrete `RentalStore` class and reused
in both the Create Rental flow and the Rental Detail page with no behavioral change.

**Depends on:** None.

## 2. Files to Modify / Create

* **File A Path:** `projects/shared/src/core/state/rental-store.token.ts`
* **Action:** Create New File

* **File B Path:** `projects/shared/src/public-api.ts`
* **Action:** Modify Existing File

---

## 3. Code Implementation

### File A — Full file content

```typescript
import { InjectionToken, Signal } from '@angular/core';
import type { Customer, CustomerBalance } from '@ui-models';

export interface RentalStoreContract {
  readonly customer: Signal<Customer | null>;
  readonly customerBalance: Signal<CustomerBalance | null>;
  readonly isBalanceSufficient: Signal<boolean>;
}

export const RENTAL_STORE_TOKEN = new InjectionToken<RentalStoreContract>('RentalStoreContract');
```

---

### File B — Add export to `public-api.ts`

**Location:** Add immediately after the `export * from './core/state/rental.store';` line.

```typescript
export * from './core/state/rental-store.token';
```

---

**Key implementation notes:**

- `RentalStoreContract` is the **minimum** interface both `RentalStore` (create flow) and the
  extended `RentalStore` (detail flow) must satisfy. It intentionally omits pricing fields
  (deferred to FR-10).
- Members are typed as `Signal<T>` readonly properties — this is consistent with Angular's
  signal-based component model. The concrete `RentalStore` fields (`customer`, `customerBalance`,
  `isBalanceSufficient`) are all `computed()` signals, which satisfy the `Signal<T>` type.
- `CustomerBalance` is imported from `@ui-models` path alias which resolves to
  `projects/shared/src/core/models/index.ts` → re-exported from `customer-balance.model.ts`.
- The token description string `'RentalStoreContract'` is used by Angular DevTools; it should
  be human-readable and unique within the application.

---

## 4. Validation Steps

skip
