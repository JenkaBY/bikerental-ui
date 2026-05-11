# Task 007: Spec for `RentalSummaryComponent`

> **Applied Skill:** `angular-testing` — Dumb component. All inputs provided directly. No store, no overrideComponent. Verify that computed labels, customer name, duration format, equipment UIDs, and money-formatted costs appear in the DOM.

## 1. Objective

Unit tests for `RentalSummaryComponent`: correct customer display, duration formatting (30 min, 90 min, 1440 min), equipment list, total cost, projected balance, red styling when balance is negative.

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/rental-create/step3/rental-summary.component.spec.ts`
* **Action:** Create New File

## 3. Code Implementation

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import type { Customer, EquipmentSearchItem, Money, RentalCostEstimate } from '@bikerental/shared';
import { RentalSummaryComponent } from './rental-summary.component';

const CUSTOMER: Customer = {
  id: 'c1',
  phone: '+79001234567',
  firstName: 'Anna',
  lastName: 'Smith',
  email: undefined,
};

const ITEM: EquipmentSearchItem = {
  id: 1,
  uid: 'ABC12',
  model: 'Trek FX3',
  type: { slug: 'bicycle', name: 'Bicycle', isForSpecialTariff: false },
};

const COST_ESTIMATE: RentalCostEstimate = {
  subtotal: { amount: 200, currency: 'BYN' },
  totalCost: { amount: 180, currency: 'BYN' },
  discountPercent: 10,
  specialPricingApplied: false,
  equipmentBreakdowns: [],
};

describe('RentalSummaryComponent', () => {
  let fixture: ComponentFixture<RentalSummaryComponent>;

  function setInputs(overrides: Partial<{
    customer: Customer;
    durationMinutes: number;
    equipmentItems: EquipmentSearchItem[];
    costEstimate: RentalCostEstimate;
    specialPriceEnabled: boolean;
    projectedBalance: Money | null;
    isBalanceNegative: boolean;
  }> = {}) {
    fixture.componentRef.setInput('customer', overrides.customer ?? CUSTOMER);
    fixture.componentRef.setInput('durationMinutes', overrides.durationMinutes ?? 60);
    fixture.componentRef.setInput('equipmentItems', overrides.equipmentItems ?? [ITEM]);
    fixture.componentRef.setInput('costEstimate', overrides.costEstimate ?? COST_ESTIMATE);
    fixture.componentRef.setInput('specialPriceEnabled', overrides.specialPriceEnabled ?? false);
    fixture.componentRef.setInput('projectedBalance', overrides.projectedBalance ?? { amount: 320, currency: 'BYN' });
    fixture.componentRef.setInput('isBalanceNegative', overrides.isBalanceNegative ?? false);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RentalSummaryComponent],
      providers: [provideAnimationsAsync()],
    }).compileComponents();

    fixture = TestBed.createComponent(RentalSummaryComponent);
  });

  it('should create', () => {
    setInputs();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should display customer full name and phone', () => {
    setInputs();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Anna Smith');
    expect(text).toContain('+79001234567');
  });

  it('should show only phone when firstName and lastName are empty', () => {
    setInputs({ customer: { ...CUSTOMER, firstName: '', lastName: '' } });
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('+79001234567');
    expect(text).not.toContain('Anna');
  });

  it('should format 30 minutes as "30 min"', () => {
    setInputs({ durationMinutes: 30 });
    expect(fixture.nativeElement.textContent).toContain('30 min');
  });

  it('should format 90 minutes as "1 hour 30 min"', () => {
    setInputs({ durationMinutes: 90 });
    expect(fixture.nativeElement.textContent).toContain('1 hour 30 min');
  });

  it('should format 1440 minutes as "1 day"', () => {
    setInputs({ durationMinutes: 1440 });
    expect(fixture.nativeElement.textContent).toContain('1 day');
  });

  it('should display each equipment item uid and model', () => {
    setInputs();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('ABC12');
    expect(text).toContain('Trek FX3');
  });

  it('should display total cost', () => {
    setInputs();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('180');
    expect(text).toContain('BYN');
  });

  it('should apply red styling when projected balance is negative', () => {
    setInputs({ isBalanceNegative: true, projectedBalance: { amount: -50, currency: 'BYN' } });
    const balanceEl = fixture.nativeElement.querySelector('.text-red-600');
    expect(balanceEl).not.toBeNull();
  });

  it('should not apply red styling when projected balance is positive', () => {
    setInputs({ isBalanceNegative: false, projectedBalance: { amount: 320, currency: 'BYN' } });
    const balanceEl = fixture.nativeElement.querySelector('.text-red-600');
    expect(balanceEl).toBeNull();
  });
});
```

## 4. Validation Steps

```bash
npx ng test operator --include="**/step3/rental-summary.component.spec**"
```
