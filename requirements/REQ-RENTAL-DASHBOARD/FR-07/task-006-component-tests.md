# Task 006: Component Tests — `RentalCustomerPanelComponent` and Top-Up Flow

> **Applied Skill:** `angular-testing` — Vitest + TestBed, token-based provider mocks,
> `MatDialog` stub, `overrideComponent` for component-level providers.

## 1. Objective

1. Create a new spec for `RentalCustomerPanelComponent` covering:
  - Customer phone and name rendered from token store signals.
  - Balance amount styled green when `isBalanceSufficient()` is `true`.
  - Balance amount styled red when `isBalanceSufficient()` is `false`.
  - `topUpRequested` output emitted when the Top Up button is tapped.

2. Add a new `describe('top-up flow')` block to the existing
   `rental-detail.component.spec.ts` covering:
  - `onTopUpRequested()` opens `TopUpDialogComponent` with correct data and `disableClose`.
  - Balance is refreshed (`financeStore.loadById`) when dialog closes with `true`.
  - Balance is NOT refreshed when dialog closes with `undefined`.

**Depends on:** Tasks 001–005 (FR-07).

## 2. Files to Modify / Create

* **File A Path:** `projects/operator/src/app/rental-create/step2/rental-customer-panel.component.spec.ts`
* **Action:** Create New File

* **File B Path:** `projects/operator/src/app/rental-detail/rental-detail.component.spec.ts`
* **Action:** Modify Existing File — add a new `describe` block at the end of the outer
  `describe('RentalDetailComponent', ...)` body.

---

## 3. Code Implementation

### File A — Full file content

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { Customer, CustomerBalance } from '@bikerental/shared';
import { RENTAL_STORE_TOKEN } from '@bikerental/shared';
import { RentalCustomerPanelComponent } from './rental-customer-panel.component';

const makeBalance = (amount: number): CustomerBalance => ({
  available: { amount, currency: 'BYN' },
  reserved: { amount: 0, currency: 'BYN' },
  lastUpdatedAt: new Date(),
  isWithdrawalAvailable: true,
});

const makeCustomer = (): Customer => ({
  id: 'cust-1',
  phone: '+375291234567',
  firstName: 'Ivan',
  lastName: 'Petrov',
});

const makeStore = () => ({
  customer: signal<Customer | null>(null),
  customerBalance: signal<CustomerBalance | null>(null),
  isBalanceSufficient: signal(true),
});

describe('RentalCustomerPanelComponent', () => {
  let fixture: ComponentFixture<RentalCustomerPanelComponent>;
  let store: ReturnType<typeof makeStore>;

  beforeEach(async () => {
    store = makeStore();

    await TestBed.configureTestingModule({
      imports: [RentalCustomerPanelComponent],
      providers: [{ provide: RENTAL_STORE_TOKEN, useValue: store }],
    }).compileComponents();

    fixture = TestBed.createComponent(RentalCustomerPanelComponent);
    fixture.detectChanges();
  });

  it('renders customer phone and full name when customer is set', () => {
    store.customer.set(makeCustomer());
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('+375291234567');
    expect(text).toContain('Ivan Petrov');
  });

  it('applies green class when isBalanceSufficient is true', () => {
    store.customer.set(makeCustomer());
    store.customerBalance.set(makeBalance(500));
    store.isBalanceSufficient.set(true);
    fixture.detectChanges();

    const balanceEl = (fixture.nativeElement as HTMLElement).querySelector('.text-green-700');
    expect(balanceEl).not.toBeNull();
  });

  it('applies red class when isBalanceSufficient is false', () => {
    store.customer.set(makeCustomer());
    store.customerBalance.set(makeBalance(-10));
    store.isBalanceSufficient.set(false);
    fixture.detectChanges();

    const balanceEl = (fixture.nativeElement as HTMLElement).querySelector('.text-red-600');
    expect(balanceEl).not.toBeNull();
  });

  it('emits topUpRequested when top-up button is tapped', () => {
    const emitted = vi.fn();
    fixture.componentInstance.topUpRequested.subscribe(emitted);

    const btn = (fixture.nativeElement as HTMLElement).querySelector('app-top-up-button');
    btn?.dispatchEvent(new CustomEvent('confirm', { bubbles: true }));
    fixture.detectChanges();

    expect(emitted).toHaveBeenCalledOnce();
  });
});
```

---

### File B — Add top-up `describe` block to existing spec

**Location:** Add at the end of the outer `describe('RentalDetailComponent', () => {` body,
after all existing `it(...)` tests and before the final closing `});`.

**Add:**

```typescript
  describe('top-up flow', () => {
    const makeDialogRef = (closeWith: boolean | undefined) => ({
      afterClosed: () => of(closeWith),
    });

    it('opens TopUpDialogComponent with correct data when onTopUpRequested is called', () => {
      store.customerId.set('cust-uuid');
      const dialogOpen = vi.fn().mockReturnValue(makeDialogRef(undefined));
      const dialog = { open: dialogOpen };

      TestBed.overrideComponent(RentalDetailComponent, {
        set: {
          providers: [
            { provide: RentalStore, useValue: store },
            { provide: CustomerFinanceStore, useValue: {} },
            { provide: BatchRentalPropertyStore, useValue: {} },
            { provide: MatDialog, useValue: dialog },
          ],
        },
      });
      fixture = TestBed.createComponent(RentalDetailComponent);
      fixture.componentRef.setInput('id', '10');
      fixture.detectChanges();

      (fixture.componentInstance as unknown as { onTopUpRequested(): void }).onTopUpRequested();

      expect(dialogOpen).toHaveBeenCalledWith(
        TopUpDialogComponent,
        expect.objectContaining({ data: { customerId: 'cust-uuid' }, disableClose: true }),
      );
    });

    it('calls financeStore.loadById after dialog closes with true', () => {
      store.customerId.set('cust-uuid');
      const loadById = vi.fn();
      const financeStore = { loadById };
      const dialog = { open: vi.fn().mockReturnValue(makeDialogRef(true)) };

      TestBed.overrideComponent(RentalDetailComponent, {
        set: {
          providers: [
            { provide: RentalStore, useValue: store },
            { provide: CustomerFinanceStore, useValue: financeStore },
            { provide: BatchRentalPropertyStore, useValue: {} },
            { provide: MatDialog, useValue: dialog },
          ],
        },
      });
      fixture = TestBed.createComponent(RentalDetailComponent);
      fixture.componentRef.setInput('id', '10');
      fixture.detectChanges();

      (fixture.componentInstance as unknown as { onTopUpRequested(): void }).onTopUpRequested();

      expect(loadById).toHaveBeenCalledWith('cust-uuid');
    });

    it('does NOT call financeStore.loadById when dialog closes with undefined', () => {
      store.customerId.set('cust-uuid');
      const loadById = vi.fn();
      const financeStore = { loadById };
      const dialog = { open: vi.fn().mockReturnValue(makeDialogRef(undefined)) };

      TestBed.overrideComponent(RentalDetailComponent, {
        set: {
          providers: [
            { provide: RentalStore, useValue: store },
            { provide: CustomerFinanceStore, useValue: financeStore },
            { provide: BatchRentalPropertyStore, useValue: {} },
            { provide: MatDialog, useValue: dialog },
          ],
        },
      });
      fixture = TestBed.createComponent(RentalDetailComponent);
      fixture.componentRef.setInput('id', '10');
      fixture.detectChanges();

      (fixture.componentInstance as unknown as { onTopUpRequested(): void }).onTopUpRequested();

      expect(loadById).not.toHaveBeenCalled();
    });
  });
```

**Additional imports** needed at the top of `rental-detail.component.spec.ts` — add alongside
existing imports:

```typescript
import { of } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { BatchRentalPropertyStore, CustomerFinanceStore, TopUpDialogComponent } from '@bikerental/shared';
```

Also add `customerId: signal('')` to the `makeStore()` factory in the existing spec if not
already present.

---

**Key implementation notes:**

- The `RentalCustomerPanelComponent` spec provides `RENTAL_STORE_TOKEN` as a plain value object
  (signals). No `TestBed.overrideComponent` needed because the component is not component-scoped
  — the token is resolved from TestBed's root injector.
- The top-up tests in File B reuse `overrideComponent` because `MatDialog` must be overridden at
  the component-level injector (which holds `RentalStore`, `CustomerFinanceStore`, etc.).
- `makeDialogRef(closeWith)` returns a minimal `MatDialogRef` stub whose `afterClosed()` returns
  `of(closeWith)`. Using `of()` means the observable completes synchronously within the same
  microtask — no `fakeAsync/tick` needed.
- The cast `as unknown as { onTopUpRequested(): void }` calls a `protected` method in tests
  without TypeScript visibility errors; it is the standard Vitest pattern for this project.

---

## 4. Validation Steps

```powershell
npm test -- --reporter=verbose --run rental-customer-panel
npm test -- --reporter=verbose --run rental-detail.component
```
