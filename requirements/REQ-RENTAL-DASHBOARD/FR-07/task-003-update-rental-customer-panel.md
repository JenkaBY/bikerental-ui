# Task 003: Update `RentalCustomerPanelComponent` to Inject `RENTAL_STORE_TOKEN`

> **Applied Skill:** `angular-component` — replacing a concrete service injection with an
> `InjectionToken`; `angular-di` — token-based DI for component reusability.

## 1. Objective

Replace the two concrete store injections (`RentalStore` and `RentalValidationStore`) in
`RentalCustomerPanelComponent` with a single `RENTAL_STORE_TOKEN` injection. The component
behavior and template are unchanged; only the DI source changes.

**Depends on:** Tasks 001 and 002 (token and `isBalanceSufficient` must exist on the contract).

## 2. Files to Modify / Create

* **File Path:** `projects/operator/src/app/rental-create/step2/rental-customer-panel.component.ts`
* **Action:** Modify Existing File

---

## 3. Code Implementation

### Change 1 — Replace import block

**Replace:**

```typescript
import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  Labels,
  MoneyPipe,
  RentalStore,
  RentalValidationStore,
  TopUpButtonComponent,
} from '@bikerental/shared';
```

**With:**

```typescript
import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  Labels,
  MoneyPipe,
  RENTAL_STORE_TOKEN,
  TopUpButtonComponent,
} from '@bikerental/shared';
```

---

### Change 2 — Replace store injections in class body

**Replace:**

```typescript
export class RentalCustomerPanelComponent {
  protected readonly store = inject(RentalStore);
  protected readonly validationStore = inject(RentalValidationStore);
  protected readonly Labels = Labels;
```

**With:**

```typescript
export class RentalCustomerPanelComponent {
  protected readonly store = inject(RENTAL_STORE_TOKEN);
  protected readonly Labels = Labels;
```

---

### Change 3 — Update template `isBalanceSufficient` references

**Replace** (both occurrences on the same two lines in the `[class.text-red-600]` / `[class.text-green-700]` bindings):

```html
            [class.text-red-600]="!validationStore.isBalanceSufficient()"
            [class.text-green-700]="validationStore.isBalanceSufficient()"
```

**With:**

```html
            [class.text-red-600]="!store.isBalanceSufficient()"
            [class.text-green-700]="store.isBalanceSufficient()"
```

---

**Key implementation notes:**

- `RentalValidationStore` is removed entirely from this component — `isBalanceSufficient()` is
  now provided via the token's contract on whichever store the parent component provides.
- All three signals accessed by the template (`customer()`, `customerBalance()`,
  `isBalanceSufficient()`) are now read from `store` (the token), no secondary store needed.
- The `customerFullName()` arrow function reads `this.store.customer()` — the reference
  `this.store` still works because the token resolves to a `RentalStoreContract`-typed object.

---

## 4. Validation Steps

skip
