# Task 026: Spec for `RentalStep2Component`

> **Applied Skill:** `angular-testing` — Orchestrator spec. Override `RentalStore` via `overrideComponent`. Mock `MatDialog`, `MatSnackBar`. Verify: `onSaveDraft` calls `store.save()` and shows snackbar on success; `onNext` calls `store.save()` and emits `stepAdvanced` on success; `onNext` does NOT emit on save error.

## 1. Objective

Unit tests for `RentalStep2Component` orchestration logic: save draft success, next/advance on success, next does not advance on save error.

## 2. Files to Modify / Create

### 2a. Happy-path spec: `projects/operator/src/app/rental-create/step2/rental-step2.component.spec.ts`

```typescript
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { RentalStore } from '@bikerental/shared';
import { RentalStep2Component } from './rental-step2.component';

function makeStore() {
  return {
    customer: signal({ id: '1', phone: '+79001111111', firstName: 'Anna', lastName: 'Ivanova' }),
    save: vi.fn().mockReturnValue(of(undefined)),
    durationMinutes: signal(60),
    equipmentItems: signal([]),
    specialPriceEnabled: signal(false),
    discountPercent: signal(null),
    specialPrice: signal(null),
    projectedBalance: signal({ amount: 500, currency: 'BYN' }),
    isBalanceSufficient: signal(true),
    canProceedFromStep2: signal(true),
    isSaving: signal(false),
    costEstimate: signal({ amount: 100, currency: 'BYN' }),
    setDurationMinutes: vi.fn(),
    addEquipmentItem: vi.fn(),
    removeEquipmentItem: vi.fn(),
    setDiscountPercent: vi.fn(),
    setSpecialPriceEnabled: vi.fn(),
    setSpecialPrice: vi.fn(),
    refreshCustomerBalance: vi.fn(),
  };
}

describe('RentalStep2Component', () => {
  let fixture: ComponentFixture<RentalStep2Component>;
  let component: RentalStep2Component;
  let store: ReturnType<typeof makeStore>;
  let snackBar: { open: ReturnType<typeof vi.fn> };

  async function setup() {
    store = makeStore();
    snackBar = { open: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [RentalStep2Component],
      providers: [
        provideAnimationsAsync(),
        { provide: MatDialog, useValue: { open: vi.fn() } },
        { provide: MatSnackBar, useValue: snackBar },
      ],
    })
      .overrideComponent(RentalStep2Component, {
        set: { providers: [{ provide: RentalStore, useValue: store }] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(RentalStep2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should create', async () => {
    await setup();
    expect(component).toBeTruthy();
  });

  it('onSaveDraft should call store.save() and show snackbar on success', async () => {
    await setup();
    component['onSaveDraft']();
    expect(store.save).toHaveBeenCalled();
    expect(snackBar.open).toHaveBeenCalledWith(
      expect.stringContaining('Draft'),
      expect.any(String),
      expect.any(Object),
    );
  });

  it('onNext should call store.save() and emit stepAdvanced on success', async () => {
    await setup();
    const advanced: void[] = [];
    component.stepAdvanced.subscribe(() => advanced.push());
    component['onNext']();
    expect(store.save).toHaveBeenCalled();
    expect(advanced.length).toBe(1);
  });
});
```

### 2b. Error-path spec: `projects/operator/src/app/rental-create/step2/rental-step2.component.error.spec.ts`

```typescript
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { throwError } from 'rxjs';
import { vi } from 'vitest';
import { RentalStore } from '@bikerental/shared';
import { RentalStep2Component } from './rental-step2.component';

function makeFailingStore() {
  return {
    customer: signal(null),
    save: vi.fn().mockReturnValue(throwError(() => new Error('Save failed'))),
    durationMinutes: signal(60),
    equipmentItems: signal([]),
    specialPriceEnabled: signal(false),
    discountPercent: signal(null),
    specialPrice: signal(null),
    projectedBalance: signal(null),
    isBalanceSufficient: signal(false),
    canProceedFromStep2: signal(false),
    isSaving: signal(false),
    costEstimate: signal(null),
    setDurationMinutes: vi.fn(),
    addEquipmentItem: vi.fn(),
    removeEquipmentItem: vi.fn(),
    setDiscountPercent: vi.fn(),
    setSpecialPriceEnabled: vi.fn(),
    setSpecialPrice: vi.fn(),
    refreshCustomerBalance: vi.fn(),
  };
}

describe('RentalStep2Component — error handling', () => {
  let fixture: ComponentFixture<RentalStep2Component>;
  let component: RentalStep2Component;

  async function setup() {
    const store = makeFailingStore();

    await TestBed.configureTestingModule({
      imports: [RentalStep2Component],
      providers: [
        provideAnimationsAsync(),
        { provide: MatDialog, useValue: { open: vi.fn() } },
        { provide: MatSnackBar, useValue: { open: vi.fn() } },
      ],
    })
      .overrideComponent(RentalStep2Component, {
        set: { providers: [{ provide: RentalStore, useValue: store }] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(RentalStep2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('onNext should NOT emit stepAdvanced when save fails', async () => {
    await setup();
    const advanced: void[] = [];
    component.stepAdvanced.subscribe(() => advanced.push());
    component['onNext']();
    expect(advanced.length).toBe(0);
  });

  it('onSaveDraft should NOT throw when save fails', async () => {
    await setup();
    expect(() => component['onSaveDraft']()).not.toThrow();
  });
});
```

## 4. Validation Steps

```bash
npx ng test operator --include="**/step2/rental-step2.component.spec**"
npx ng test operator --include="**/step2/rental-step2.component.error.spec**"
```
