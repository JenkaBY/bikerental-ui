# Task 021: Spec for `RentalCustomerPanelComponent`

> **Applied Skill:** `angular-testing` — Smart component with component-scoped `RentalStore`. Override the store via `overrideComponent`. Verify phone is always the primary display, full name appears as secondary when present but is absent when empty, balance display, and `topUpRequested` output emission.

## 1. Objective

Unit tests for `RentalCustomerPanelComponent`: phone always shown as primary, full name shown as secondary when non-empty, hidden when empty, balance display, "Top Up" button emits `topUpRequested`.

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/rental-create/step2/rental-customer-panel.component.spec.ts`
* **Action:** Create New File

## 3. Code Implementation

```typescript
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { vi } from 'vitest';
import type { Customer } from '@bikerental/shared';
import { RentalStore } from '@bikerental/shared';
import { RentalCustomerPanelComponent } from './rental-customer-panel.component';

const CUSTOMER_WITH_NAME: Customer = {
  id: '1',
  phone: '+79001111111',
  firstName: 'Anna',
  lastName: 'Ivanova',
};

const CUSTOMER_NO_NAME: Customer = {
  id: '2',
  phone: '+79002222222',
  firstName: '',
  lastName: '',
};

function makeStore(customer: Customer | null = CUSTOMER_WITH_NAME) {
  return {
    customer: signal(customer),
    projectedBalance: signal({ amount: 500, currency: 'BYN' }),
    isBalanceSufficient: signal(true),
  };
}

describe('RentalCustomerPanelComponent', () => {
  let fixture: ComponentFixture<RentalCustomerPanelComponent>;

  async function setup(store = makeStore()) {
    await TestBed.configureTestingModule({
      imports: [RentalCustomerPanelComponent],
      providers: [provideAnimationsAsync()],
    })
      .overrideComponent(RentalCustomerPanelComponent, {
        set: { providers: [{ provide: RentalStore, useValue: store }] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(RentalCustomerPanelComponent);
    fixture.detectChanges();
  }

  it('should always display the phone number', async () => {
    await setup();
    expect(fixture.nativeElement.textContent).toContain('+79001111111');
  });

  it('should display full name as secondary when firstName and lastName are present', async () => {
    await setup();
    expect(fixture.nativeElement.textContent).toContain('Anna Ivanova');
  });

  it('should NOT display a name when firstName and lastName are empty', async () => {
    await setup(makeStore(CUSTOMER_NO_NAME));
    expect(fixture.nativeElement.textContent).not.toContain('Anna');
  });

  it('should display the projected balance', async () => {
    await setup();
    expect(fixture.nativeElement.textContent).toContain('500');
  });

  it('should emit topUpRequested when "Top Up" button is clicked', async () => {
    await setup();
    const emitted: void[] = [];
    fixture.componentInstance.topUpRequested.subscribe(() => emitted.push());

    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    btn.click();

    expect(emitted.length).toBe(1);
  });
});
```

## 4. Validation Steps

```bash
npx ng test operator --include="**/step2/rental-customer-panel.component.spec**"
```
