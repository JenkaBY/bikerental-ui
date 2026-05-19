# Task 006: Write Unit Tests for `RentalDetailComponent` — Pricing Section Conditional Rendering

> **Applied Skill:** `angular-testing` — Uses Vitest + Angular `TestBed`, signal-based store stubs, and `fixture.detectChanges()` to assert DOM presence/absence per the FR-10 BDD scenarios.

## 1. Objective

Verify the three acceptance criteria that are within scope for `RentalDetailComponent`:

* **AC-1 (Scenario 1):** Pricing section is **absent** from the DOM when `isDebt: true`.
* **AC-2 (Scenario 2):** Pricing section is **present** in the DOM when `isActive: true`.
* **AC-3 (Scenario 3 guard):** `discountPercent` and `specialPrice` signal wiring is intact (the store setter is called when the component interacts with the token).

The tests are added to a **new spec file** alongside `rental-detail.component.ts`.

> **Note:** Do NOT create `rental-detail.component.spec.ts` if it already exists — check first and append the `describe` block if the file is present. Based on the current workspace scan, **no spec file exists**, so create it fresh.

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/rental-detail/rental-detail.component.spec.ts`
* **Action:** Create New File

## 3. Code Implementation

**Imports Required:** (included in the snippet below)

**Code to Add/Replace:**

* **Location:** New file — paste the complete content below.

```typescript
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import {
  BatchRentalPropertyStore,
  CustomerFinanceStore,
  RENTAL_STORE_TOKEN,
  RentalStore,
} from '@bikerental/shared';
import { RentalDetailComponent } from './rental-detail.component';

function makeRentalStore() {
  return {
    id: signal<number | null>(1),
    customer: signal(null),
    customerBalance: signal(null),
    isBalanceSufficient: signal(true),
    specialPriceEnabled: signal(false),
    isSelectedAnyEquipment: signal(true),
    specialPrice: signal<number | null>(null),
    discountPercent: signal<number | null>(null),
    setSpecialPriceEnabled: vi.fn(),
    setSpecialPrice: vi.fn(),
    setDiscountPercent: vi.fn(),
    isActive: signal(false),
    isDebt: signal(false),
    isDraft: signal(false),
    isOverdue: signal(false),
    isLoading: signal(false),
    loadError: signal(false),
    status: signal('ACTIVE'),
    overdueMinutes: signal(0),
    debtAmount: signal(null),
    expectedReturnAt: signal(null),
    startedAt: signal(null),
    customerId: signal('cust-1'),
    paidDurationMinutes: signal(null),
    brokenEquipmentEntries: signal([]),
    isReturning: signal(false),
    loadDetail: vi.fn(),
  };
}

describe('RentalDetailComponent — Return Pricing Section (FR-10)', () => {
  let fixture: ComponentFixture<RentalDetailComponent>;
  let store: ReturnType<typeof makeRentalStore>;

  beforeEach(async () => {
    store = makeRentalStore();

    await TestBed.configureTestingModule({
      imports: [RentalDetailComponent],
      providers: [
        provideNoopAnimations(),
        { provide: RentalStore, useValue: store },
        { provide: RENTAL_STORE_TOKEN, useValue: store },
        { provide: CustomerFinanceStore, useValue: { balance: signal(null), loadById: vi.fn() } },
        { provide: BatchRentalPropertyStore, useValue: { fetch$: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RentalDetailComponent);
    fixture.componentRef.setInput('id', '42');
    fixture.detectChanges();
  });

  it('Scenario 1: Return Pricing section is absent from the DOM for a DEBT rental', () => {
    store.isActive.set(false);
    store.isDebt.set(true);
    store.isDraft.set(false);
    fixture.detectChanges();

    const pricingSection = fixture.debugElement.query(
      By.css('app-rental-pricing-section'),
    );
    expect(pricingSection).toBeNull();
  });

  it('Scenario 2: Return Pricing section is visible for an ACTIVE rental', () => {
    store.isActive.set(true);
    store.isDebt.set(false);
    store.isDraft.set(false);
    fixture.detectChanges();

    const pricingSection = fixture.debugElement.query(
      By.css('app-rental-pricing-section'),
    );
    expect(pricingSection).not.toBeNull();
  });

  it('Scenario 2 — section label "Return pricing" is rendered for ACTIVE rental', () => {
    store.isActive.set(true);
    store.isDebt.set(false);
    store.isDraft.set(false);
    fixture.detectChanges();

    const labelEl: HTMLElement = fixture.nativeElement.querySelector('p.font-semibold');
    expect(labelEl?.textContent?.trim()).toContain('Return pricing');
  });

  it('Scenario 1 guard — Return Pricing section is absent when isDraft is true', () => {
    store.isActive.set(false);
    store.isDraft.set(true);
    store.isDebt.set(false);
    fixture.detectChanges();

    const pricingSection = fixture.debugElement.query(
      By.css('app-rental-pricing-section'),
    );
    expect(pricingSection).toBeNull();
  });
});
```

### Key notes for the Junior Dev Agent

* `RentalDetailComponent.providers` already lists `{ provide: RENTAL_STORE_TOKEN, useExisting: RentalStore }`. In the test, **both** `RentalStore` and `RENTAL_STORE_TOKEN` must be provided with the same `store` stub so that `RentalPricingSectionComponent` (which injects `RENTAL_STORE_TOKEN`) and `RentalDetailComponent` (which injects `RentalStore`) both resolve to the same instance.
* The `id` input is set via `fixture.componentRef.setInput('id', '42')` — do NOT use `fixture.componentInstance.id` directly (it is a signal input, not a writable property).
* `provideNoopAnimations()` prevents Angular Material animation errors in the test environment.
* The `loadDetail` method on the stub is a `vi.fn()` — it will be called by the `effect()` inside `RentalDetailComponent`'s constructor when the input is set; a no-op is acceptable.

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx vitest run projects/operator/src/app/rental-detail/rental-detail.component.spec.ts
```
