# Task 005: Component Tests — RentalDetailComponent

> **Applied Skill:** `angular-testing` — Vitest + TestBed, `overrideComponent` for
> component-level providers, `componentRef.setInput()`, signal mock factory, `Location` mock.

## 1. Objective

Create `projects/operator/src/app/rental-detail/rental-detail.component.spec.ts` covering:

1. `store.loadDetail(id)` called on activation with the correct numeric ID.
2. Loading spinner shown while `store.isLoading()` is `true`; section body hidden.
3. Error message and retry button shown when `store.loadError()` is `true`.
4. Retry button click re-calls `store.loadDetail(rentalId)`.
5. Overdue banner shown only when `isActive && isOverdue`; absent otherwise.
6. Debt banner shown only when `isDebt`; absent when `isActive && !isDebt`.
7. Back button calls `location.back()`.
8. Status badge renders the correct label from `mapRentalStatus`.

**Depends on:** Tasks 001–004.

## 2. Files to Modify / Create

* **File Path:** `projects/operator/src/app/rental-detail/rental-detail.component.spec.ts`
* **Action:** Create New File

---

## 3. Code Implementation

**Full file content:**

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Location } from '@angular/common';
import { signal } from '@angular/core';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { Money } from '@bikerental/shared';
import { BatchRentalPropertyStore, CustomerFinanceStore, RentalStore } from '@bikerental/shared';
import { RentalDetailComponent } from './rental-detail.component';

const makeStore = () => ({
  isLoading: signal(false),
  loadError: signal(false),
  id: signal<number | null>(null),
  status: signal(''),
  isActive: signal(false),
  isDebt: signal(false),
  isOverdue: signal(false),
  overdueMinutes: signal<number | undefined>(undefined),
  debtAmount: signal<Money | undefined>(undefined),
  expectedReturnAt: signal<Date | undefined>(undefined),
  customer: signal(null),
  equipmentItems: signal([]),
  customerBalance: signal(undefined),
  loadDetail: vi.fn(),
});

const makeLocation = () => ({ back: vi.fn() });

describe('RentalDetailComponent', () => {
  let fixture: ComponentFixture<RentalDetailComponent>;
  let component: RentalDetailComponent;
  let store: ReturnType<typeof makeStore>;
  let location: ReturnType<typeof makeLocation>;

  beforeEach(async () => {
    store = makeStore();
    location = makeLocation();

    await TestBed.configureTestingModule({
      imports: [RentalDetailComponent],
      providers: [{ provide: Location, useValue: location }],
    })
      .overrideComponent(RentalDetailComponent, {
        set: {
          providers: [
            { provide: RentalStore, useValue: store },
            { provide: CustomerFinanceStore, useValue: {} },
            { provide: BatchRentalPropertyStore, useValue: {} },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(RentalDetailComponent);
    component = fixture.componentInstance;
  });

  it('calls store.loadDetail() with numeric route id on activation', () => {
    fixture.componentRef.setInput('id', '42');
    fixture.detectChanges();

    expect(store.loadDetail).toHaveBeenCalledWith(42);
  });

  it('shows spinner and hides body while isLoading is true', () => {
    store.isLoading.set(true);
    fixture.componentRef.setInput('id', '42');
    fixture.detectChanges();

    const native = fixture.nativeElement as HTMLElement;

    expect(native.querySelector('mat-spinner')).not.toBeNull();
    expect(native.querySelector('.overflow-y-auto')).toBeNull();
  });

  it('shows error message and retry button when loadError is true', () => {
    store.loadError.set(true);
    fixture.componentRef.setInput('id', '42');
    fixture.detectChanges();

    const native = fixture.nativeElement as HTMLElement;
    const text = native.textContent ?? '';

    expect(text).toContain('Failed to load rental details');
    expect(native.querySelector('button[mat-button]')).not.toBeNull();
  });

  it('retry button re-calls store.loadDetail with the same id', () => {
    store.loadError.set(true);
    fixture.componentRef.setInput('id', '7');
    fixture.detectChanges();

    const retryBtn = fixture.nativeElement.querySelector('button[mat-button]') as HTMLElement;
    retryBtn.click();
    fixture.detectChanges();

    expect(store.loadDetail).toHaveBeenLastCalledWith(7);
  });

  it('shows overdue banner when isActive and isOverdue', () => {
    store.isActive.set(true);
    store.isOverdue.set(true);
    store.overdueMinutes.set(25);
    store.id.set(42);
    fixture.componentRef.setInput('id', '42');
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('25');
    expect(text).toMatch(/overdue/i);
  });

  it('hides overdue banner when isActive is false', () => {
    store.isActive.set(false);
    store.isOverdue.set(true);
    store.id.set(42);
    fixture.componentRef.setInput('id', '42');
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;

    expect(text).not.toMatch(/overdue/i);
  });

  it('shows debt banner with amount and auto-charge message when isDebt', () => {
    store.isDebt.set(true);
    store.debtAmount.set({ amount: 300, currency: 'BYN' });
    store.id.set(99);
    fixture.componentRef.setInput('id', '99');
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('300');
    expect(text).toContain('BYN');
    expect(text).toContain('charged automatically');
  });

  it('does not show debt banner when isDebt is false', () => {
    store.isDebt.set(false);
    store.id.set(42);
    fixture.componentRef.setInput('id', '42');
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;

    expect(text).not.toContain('charged automatically');
  });

  it('calls location.back() when back button is clicked', () => {
    store.id.set(42);
    fixture.componentRef.setInput('id', '42');
    fixture.detectChanges();

    const backBtn = fixture.nativeElement.querySelector(
      'button[mat-icon-button]',
    ) as HTMLElement;
    backBtn.click();

    expect(location.back).toHaveBeenCalledOnce();
  });

  it('renders the status badge label from mapRentalStatus', () => {
    store.status.set('ACTIVE');
    store.id.set(42);
    fixture.componentRef.setInput('id', '42');
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Active');
  });

  it('renders the rental id in the title', () => {
    store.id.set(42);
    fixture.componentRef.setInput('id', '42');
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('42');
    expect(text).toMatch(/Rental\s*#/);
  });
});
```

**Key implementation notes:**

- `RentalStore` is provided inside the component via `providers: [RentalStore, CustomerFinanceStore, BatchRentalPropertyStore]`,
  so all three must be replaced using `overrideComponent.set.providers`. `CustomerFinanceStore` and
  `BatchRentalPropertyStore` are provided as empty object stubs `{}` since none of their signals
  are exercised in these tests.
- `fixture.componentRef.setInput('id', '42')` sets the `id = input.required<string>()` signal
  before `fixture.detectChanges()` triggers `effect()`. Call order is: `setInput` → then
  `detectChanges` (which schedules the effect) → effect fires → `store.load(42)` is called.
- `store.loadDetail` is a `vi.fn()` — the test asserts it was called with the numeric `42`.
- `store.id.set(42)` (non-null) is required in tests that assert the content body renders —
  the component guards the body with `@else if (store.id() !== null)`.
- The `location` mock is provided at the TestBed level (not component level) because `Location`
  is not in the component's own `providers` — it is injected from the outer injector.
- `toContain('charged automatically')` matches the substring of
  `Labels.DebtAutoCharge` ("Balance will be **charged automatically** once topped up") without
  depending on the exact localized string, keeping the test robust across locale changes.

---

## 4. Validation Steps

```powershell
npm test -- --reporter=verbose rental-detail.component.spec.ts
```
