# Task 006: Create `RentalStep1Component` (Smart)

> **Applied Skill:** `angular-component`, `angular-signals` — Thin smart orchestrator that injects `RentalStore`, composes `CustomerSearchInputComponent`, and forwards the selected customer into the store. Emits `customerSelected` output to signal the stepper (in `RentalCreateComponent`) to advance to Step 2.

## 1. Objective

Create the smart `RentalStep1Component` that:

1. Injects `RentalStore` (already provided by `RentalCreateComponent`'s injector — do **not** add it to `providers` here).
2. Reads `store.customer()` on init to derive `initialPhone` — passed down to `CustomerSearchInputComponent` to pre-populate the field when navigating back from Step 2.
3. Listens to `CustomerSearchInputComponent`'s `customerSelected` output, calls `store.setCustomer(customer)`, and emits its own `customerSelected` output so the parent can advance the stepper.

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/rental-create/step1/rental-step1.component.ts`
* **Action:** Create New File

## 3. Code Implementation

**Imports Required:**

```typescript
import { ChangeDetectionStrategy, Component, computed, inject, output } from '@angular/core';
import { Customer, RentalStore } from '@bikerental/shared';
import { CustomerSearchInputComponent } from './customer-search-input.component';
```

**Code to Add/Replace:**

* **Location:** Create a new file from scratch.
* **Snippet:**

```typescript
import { ChangeDetectionStrategy, Component, computed, inject, output } from '@angular/core';
import { Customer, RentalStore } from '@bikerental/shared';
import { CustomerSearchInputComponent } from './customer-search-input.component';

@Component({
  selector: 'app-rental-step1',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CustomerSearchInputComponent],
  template: `
    <app-customer-search-input
      [initialPhone]="initialPhone()"
      (customerSelected)="onCustomerSelected($event)"
    />
  `,
})
export class RentalStep1Component {
  private readonly store = inject(RentalStore);

  readonly customerSelected = output<void>();

  protected readonly initialPhone = computed(() => this.store.customer()?.phone ?? '');

  protected onCustomerSelected(customer: Customer): void {
    this.store.setCustomer(customer);
    this.customerSelected.emit();
  }
}
```

> **Note on `RentalStore` injection:** `RentalStore` is declared in `RentalCreateComponent`'s `providers` array. `RentalStep1Component` is always rendered as a child of `RentalCreateComponent`, so it resolves the same instance from the parent's injector. Do NOT add `RentalStore` to `RentalStep1Component`'s `providers`.

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx ng build operator --configuration=development
```
