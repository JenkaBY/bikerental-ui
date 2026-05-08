# Task 011: Spec for `RentalStep1Component`

> **Applied Skill:** `angular-testing` — `RentalStore` is provided at `RentalCreateComponent` level; `RentalStep1Component` resolves it from the parent injector. In tests, override at the module level. Stub `CustomerSearchInputComponent` to emit `customerSelected` programmatically so tests are decoupled from the autocomplete DOM.

## 1. Objective

Create unit tests for `RentalStep1Component` verifying:

1. Component mounts.
2. `initialPhone` is derived from `store.customer()?.phone` — empty string when no customer is in the store.
3. `initialPhone` returns the customer's phone when `store.customer()` is non-null.
4. `store.setCustomer()` is called when `CustomerSearchInputComponent` emits `customerSelected`.
5. `customerSelected` output on `RentalStep1Component` is emitted after `store.setCustomer()`.

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/rental-create/step1/rental-step1.component.spec.ts`
* **Action:** Create New File

## 3. Code Implementation

**Imports Required:**

```typescript
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { vi } from 'vitest';
import type { Customer } from '@bikerental/shared';
import { RentalStore } from '@bikerental/shared';
import { RentalStep1Component } from './rental-step1.component';
import { CustomerSearchInputComponent } from './customer-search-input.component';
```

**Code to Add/Replace:**

* **Location:** Create a new file from scratch.
* **Snippet:**

```typescript
import { Component, output, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { vi } from 'vitest';
import type { Customer } from '@bikerental/shared';
import { RentalStore } from '@bikerental/shared';
import { RentalStep1Component } from './rental-step1.component';
import { CustomerSearchInputComponent } from './customer-search-input.component';

const EXISTING_CUSTOMER: Customer = {
  id: 'cust-1',
  phone: '+79001234567',
  firstName: 'Anna',
  lastName: 'Ivanova',
};

// Stub CustomerSearchInputComponent so we can trigger its output programmatically
// without needing the full autocomplete DOM.
@Component({
  selector: 'app-customer-search-input',
  standalone: true,
  template: '',
})
class CustomerSearchInputStub {
  readonly customerSelected = output<Customer>();
}

function makeStore(customer: Customer | null = null) {
  return {
    customer: signal(customer),
    setCustomer: vi.fn(),
  };
}

describe('RentalStep1Component', () => {
  let fixture: ComponentFixture<RentalStep1Component>;
  let component: RentalStep1Component;
  let store: ReturnType<typeof makeStore>;

  async function setup(customer: Customer | null = null) {
    store = makeStore(customer);

    await TestBed.configureTestingModule({
      imports: [RentalStep1Component],
      providers: [
        provideAnimationsAsync(),
        { provide: RentalStore, useValue: store },
      ],
    })
      .overrideComponent(RentalStep1Component, {
        set: { imports: [CustomerSearchInputStub] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(RentalStep1Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should create', async () => {
    await setup();
    expect(component).toBeTruthy();
  });

  it('should derive initialPhone as empty string when no customer in store', async () => {
    await setup(null);
    expect(component['initialPhone']()).toBe('');
  });

  it('should derive initialPhone from store customer phone when customer is set', async () => {
    await setup(EXISTING_CUSTOMER);
    expect(component['initialPhone']()).toBe('+79001234567');
  });

  it('should call store.setCustomer with the selected customer', async () => {
    await setup();
    component['onCustomerSelected'](EXISTING_CUSTOMER);
    expect(store.setCustomer).toHaveBeenCalledWith(EXISTING_CUSTOMER);
  });

  it('should emit customerSelected output after onCustomerSelected is called', async () => {
    await setup();
    let emitted = false;
    component.customerSelected.subscribe(() => (emitted = true));
    component['onCustomerSelected'](EXISTING_CUSTOMER);
    expect(emitted).toBe(true);
  });
});
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx ng test operator --include="**/step1/rental-step1.component.spec**"
```
