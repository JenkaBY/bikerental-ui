# Task 011: Spec for `RentalStep3Component` (Error Path)

> **Applied Skill:** `angular-testing` — Split into a separate `*.error.spec.ts` file per project convention. Tests the activation failure path: snackbar with error message shown; `store.reset()` NOT called; router does NOT navigate.

## 1. Objective

Unit tests for `RentalStep3Component` error path: when `activateRental()` errors, snackbar shows `RentalStartError`, `store.reset()` is not called, router does not navigate.

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/rental-create/step3/rental-step3.component.error.spec.ts`
* **Action:** Create New File

## 3. Code Implementation

```typescript
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { throwError } from 'rxjs';
import { vi } from 'vitest';
import { RentalStore } from '@bikerental/shared';
import type { Customer, EquipmentSearchItem, Money, RentalCostEstimate } from '@bikerental/shared';
import { RentalStep3Component } from './rental-step3.component';

const CUSTOMER: Customer = {
  id: 'c1',
  phone: '+79001234567',
  firstName: 'Anna',
  lastName: 'Smith',
};

const COST_ESTIMATE: RentalCostEstimate = {
  subtotal: { amount: 180, currency: 'BYN' },
  totalCost: { amount: 180, currency: 'BYN' },
  specialPricingApplied: false,
  equipmentBreakdowns: [],
};

function makeFailingStore() {
  return {
    customer: signal<Customer | null>(CUSTOMER),
    durationMinutes: signal(60),
    equipmentItems: signal<EquipmentSearchItem[]>([]),
    costEstimate: signal<RentalCostEstimate | null>(COST_ESTIMATE),
    specialPriceEnabled: signal(false),
    projectedBalance: signal<Money | null>({ amount: 320, currency: 'BYN' }),
    isBalanceSufficient: signal(true),
    isActivating: signal(false),
    activateRental: vi.fn().mockReturnValue(throwError(() => new Error('API error'))),
    reset: vi.fn(),
    refreshCustomerBalance: vi.fn(),
  };
}

describe('RentalStep3Component error handling', () => {
  let fixture: ComponentFixture<RentalStep3Component>;
  let component: RentalStep3Component;
  let store: ReturnType<typeof makeFailingStore>;
  let snackBar: { open: ReturnType<typeof vi.fn> };
  let router: Router;

  beforeEach(async () => {
    store = makeFailingStore();
    snackBar = { open: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [RentalStep3Component],
      providers: [
        provideAnimationsAsync(),
        provideRouter([]),
        { provide: MatSnackBar, useValue: snackBar },
      ],
    })
      .overrideComponent(RentalStep3Component, {
        set: { providers: [{ provide: RentalStore, useValue: store }] },
      })
      .compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(RentalStep3Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should show RentalStartError snackbar when activation fails', () => {
    component['onActivateRequested']();
    expect(snackBar.open).toHaveBeenCalledWith(
      expect.stringContaining('Failed to start rental'),
      expect.any(String),
      expect.objectContaining({ duration: 4000 }),
    );
  });

  it('should NOT call store.reset() when activation fails', () => {
    component['onActivateRequested']();
    expect(store.reset).not.toHaveBeenCalled();
  });

  it('should NOT navigate when activation fails', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    component['onActivateRequested']();
    expect(navigateSpy).not.toHaveBeenCalled();
  });
});
```

## 4. Validation Steps

```bash
npx ng test operator --include="**/step3/rental-step3.component.error.spec**"
```
