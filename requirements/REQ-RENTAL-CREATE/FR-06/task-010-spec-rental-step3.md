# Task 010: Spec for `RentalStep3Component` (Happy Path)

> **Applied Skill:** `angular-testing` — Smart orchestrator. `RentalStore` injected from parent; override with `overrideComponent`. Mock `Router` and `MatSnackBar` as value providers. Tests cover: component renders; `activateRental()` called on button click; `store.reset()` called on success; snackbar shown; router navigates to `/dashboard`; `stepBack` emitted when Back is tapped.

## 1. Objective

Unit tests for `RentalStep3Component` happy paths: successful activation flow, back navigation.

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/rental-create/step3/rental-step3.component.spec.ts`
* **Action:** Create New File

## 3. Code Implementation

```typescript
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
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

function makeRentalStore(overrides: Partial<{
  isBalanceSufficient: boolean;
  isActivating: boolean;
  projectedBalance: Money | null;
}> = {}) {
  return {
    customer: signal<Customer | null>(CUSTOMER),
    durationMinutes: signal(60),
    equipmentItems: signal<EquipmentSearchItem[]>([]),
    costEstimate: signal<RentalCostEstimate | null>(COST_ESTIMATE),
    specialPriceEnabled: signal(false),
    projectedBalance: signal<Money | null>(overrides.projectedBalance ?? { amount: 320, currency: 'BYN' }),
    isBalanceSufficient: signal(overrides.isBalanceSufficient ?? true),
    isActivating: signal(overrides.isActivating ?? false),
    activateRental: vi.fn().mockReturnValue(of(42)),
    reset: vi.fn(),
    refreshCustomerBalance: vi.fn(),
  };
}

describe('RentalStep3Component', () => {
  let fixture: ComponentFixture<RentalStep3Component>;
  let component: RentalStep3Component;
  let store: ReturnType<typeof makeRentalStore>;
  let snackBar: { open: ReturnType<typeof vi.fn> };
  let router: Router;

  async function setup(storeOverrides: Parameters<typeof makeRentalStore>[0] = {}) {
    store = makeRentalStore(storeOverrides);
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
  }

  it('should create', async () => {
    await setup();
    expect(component).toBeTruthy();
  });

  it('should call activateRental when onActivateRequested is invoked', async () => {
    await setup();
    component['onActivateRequested']();
    expect(store.activateRental).toHaveBeenCalled();
  });

  it('should call store.reset() after successful activation', async () => {
    await setup();
    component['onActivateRequested']();
    expect(store.reset).toHaveBeenCalled();
  });

  it('should show RentalStarted snackbar after successful activation', async () => {
    await setup();
    component['onActivateRequested']();
    expect(snackBar.open).toHaveBeenCalledWith(
      expect.stringContaining('Rental started'),
      expect.any(String),
      expect.objectContaining({ duration: 3000 }),
    );
  });

  it('should navigate to /dashboard after successful activation', async () => {
    await setup();
    const navigateSpy = vi.spyOn(router, 'navigate');
    component['onActivateRequested']();
    expect(navigateSpy).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should emit stepBack when Back button is tapped', async () => {
    await setup();
    let backEmitted = false;
    component.stepBack.subscribe(() => (backEmitted = true));
    component['onTopUpRequested']();
    const backButton = fixture.nativeElement.querySelector('button[mat-button]') as HTMLButtonElement;
    backButton.click();
    expect(backEmitted).toBe(true);
  });
});
```

## 4. Validation Steps

```bash
npx ng test operator --include="**/step3/rental-step3.component.spec**"
```
