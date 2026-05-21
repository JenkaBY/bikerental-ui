# Task 004: Register `RENTAL_STORE_TOKEN` in `RentalCreateComponent`

> **Applied Skill:** `angular-di` — `useExisting` provider alias to register an existing store
> instance under an injection token without creating a second instance.

## 1. Objective

Add `{ provide: RENTAL_STORE_TOKEN, useExisting: RentalStore }` to `RentalCreateComponent`'s
`providers` array so the existing `RentalStore` instance is resolvable via the token. This
restores the previous behavior of `RentalCustomerPanelComponent` after the token migration
in Task 003.

**Depends on:** Tasks 001, 002, and 003.

## 2. Files to Modify / Create

* **File Path:** `projects/operator/src/app/rental-create/rental-create.component.ts`
* **Action:** Modify Existing File

---

## 3. Code Implementation

### Change 1 — Add `RENTAL_STORE_TOKEN` to imports

**Replace:**

```typescript
import {
  CustomerFinanceStore,
  Labels,
  RentalCostCalculationStore,
  RentalStore,
  RentalValidationStore,
} from '@bikerental/shared';
```

**With:**

```typescript
import {
  CustomerFinanceStore,
  Labels,
  RENTAL_STORE_TOKEN,
  RentalCostCalculationStore,
  RentalStore,
  RentalValidationStore,
} from '@bikerental/shared';
```

---

### Change 2 — Add token provider to `providers` array

**Replace:**

```typescript
  providers: [CustomerFinanceStore, RentalCostCalculationStore, RentalStore, RentalValidationStore],
```

**With:**

```typescript
  providers: [
    CustomerFinanceStore,
    RentalCostCalculationStore,
    RentalStore,
    RentalValidationStore,
    { provide: RENTAL_STORE_TOKEN, useExisting: RentalStore },
  ],
```

---

**Key implementation notes:**

- `useExisting: RentalStore` creates a **provider alias** — Angular resolves `RENTAL_STORE_TOKEN`
  to the same `RentalStore` instance already in the injector. No second instance is created.
- `RentalValidationStore` remains in `providers` — it is still needed for `canProceed`,
  `balanceShortfall`, and `projectedBalance` signals consumed by Step 3 (`RentalStep3Component`).
  Only the customer panel's `isBalanceSufficient` coloring source changes (now via token).

---

## 4. Validation Steps

skip
