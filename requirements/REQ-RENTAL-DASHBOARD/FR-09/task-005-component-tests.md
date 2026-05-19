# Task 005: Component Tests — `RentalCostSectionComponent`

> **Applied Skill:** `angular-testing` — Vitest + TestBed, mocking injected stores via `TestBed` providers, `OnPush` change detection via `fixture.detectChanges()`.

## 1. Objective

Create a spec file for `RentalCostSectionComponent` covering the relevant BDD scenarios. The component delegates all calculation to `RentalCostCalculationStore`, so the test mocks that store directly — no need to mock `RentalStore` or `TariffStore` individually.

- **Scenario 3:** Label reads "Current cost" when `estimate.isEstimate` is `true`.
- **Scenario 4:** Label reads "Final cost" when `estimate.isEstimate` is `false`.
- **Scenario 5:** Spinner shown while `isCalculating` is `true`.
- **Scenario 6:** Total amount shown when `estimate` resolves.
- **Scenario 7:** Details panel hidden by default (collapsed).
- **Scenario 8:** Details panel visible after toggle button click.
- **Scenario 9:** Breakdown row shows equipment name and `calculationBreakdown.message`.
- **Scenario 10:** Subtotal row always shown in breakdown.
- **Scenario 11:** Discount row shown when `discountPercent` is non-null.
- **Scenario 12:** Special price row shown when `specialPricingApplied` is true.
- **Scenario 13:** Neither discount nor special price row shown when both are absent.
- **Scenario 14:** Total row always shown in breakdown.

**Depends on:** Task 001 (model/mapper extensions), Task 002 (Labels), Task 003 (`RentalCostSectionComponent` must exist).

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/rental-detail/rental-cost-section.component.spec.ts`
* **Action:** Create New File

---

## 3. Code Implementation

### Full file content

```typescript
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import type { EquipmentSearchItem, RentalCostEstimate } from '@ui-models';
import { RentalCostCalculationStore, RentalStore } from '@bikerental/shared';
import { RentalCostSectionComponent } from './rental-cost-section.component';

const BIKE = {
  id: 1,
  name: 'Trek Domane',
  uid: 'UID-001',
  type: { id: 1, name: 'Bike', slug: 'bike' },
} as unknown as EquipmentSearchItem;

const ESTIMATE_COST: RentalCostEstimate = {
  isEstimate: true,
  subtotal: { amount: 300, currency: 'BYN' },
  totalCost: { amount: 270, currency: 'BYN' },
  discountPercent: 10,
  discountAmount: { amount: 30, currency: 'BYN' },
  specialPricingApplied: false,
  equipmentBreakdowns: [
    {
      equipmentType: 'bike',
      tariffId: 1,
      itemCost: { amount: 270, currency: 'BYN' },
      calculationMessage: '1 h × 270 ₽',
    },
  ],
};

const FINAL_COST: RentalCostEstimate = { ...ESTIMATE_COST, isEstimate: false };

const SPECIAL_COST: RentalCostEstimate = {
  isEstimate: false,
  subtotal: { amount: 500, currency: 'BYN' },
  totalCost: { amount: 500, currency: 'BYN' },
  specialPricingApplied: true,
  equipmentBreakdowns: [
    {
      equipmentType: 'bike',
      tariffId: 2,
      itemCost: { amount: 500, currency: 'BYN' },
      calculationMessage: 'Special price',
    },
  ],
};

const NO_DISCOUNT_COST: RentalCostEstimate = {
  isEstimate: true,
  subtotal: { amount: 300, currency: 'BYN' },
  totalCost: { amount: 300, currency: 'BYN' },
  specialPricingApplied: false,
  equipmentBreakdowns: [
    {
      equipmentType: 'bike',
      tariffId: 1,
      itemCost: { amount: 300, currency: 'BYN' },
      calculationMessage: '1 h × 300 ₽',
    },
  ],
};

const makeRentalStore = () => ({
  equipmentItems: signal<EquipmentSearchItem[]>([BIKE]),
});

const makeCostStore = (cost: RentalCostEstimate | null = ESTIMATE_COST, loading = false) => ({
  estimate: signal<RentalCostEstimate | null>(cost),
  isCalculating: signal<boolean>(loading),
});

async function createComponent(
  costStore: ReturnType<typeof makeCostStore>,
  rentalStore: ReturnType<typeof makeRentalStore> = makeRentalStore(),
): Promise<ComponentFixture<RentalCostSectionComponent>> {
  await TestBed.configureTestingModule({
    imports: [RentalCostSectionComponent],
    providers: [
      { provide: RentalCostCalculationStore, useValue: costStore },
      { provide: RentalStore, useValue: rentalStore },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(RentalCostSectionComponent);
  fixture.detectChanges();
  return fixture;
}

const text = (f: ComponentFixture<RentalCostSectionComponent>) =>
  (f.nativeElement as HTMLElement).textContent ?? '';

const toggleButton = (f: ComponentFixture<RentalCostSectionComponent>) =>
  (f.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button')!;

describe('RentalCostSectionComponent — section label', () => {
  it('Scenario 3: shows "Current cost" when isEstimate is true', async () => {
    const fixture = await createComponent(makeCostStore(ESTIMATE_COST));
    expect(text(fixture)).toContain('Current cost');
  });

  it('Scenario 4: shows "Final cost" when isEstimate is false', async () => {
    const fixture = await createComponent(makeCostStore(FINAL_COST));
    expect(text(fixture)).toContain('Final cost');
  });
});

describe('RentalCostSectionComponent — loading / total', () => {
  it('Scenario 5: shows spinner while isCalculating is true', async () => {
    const fixture = await createComponent(makeCostStore(null, true));
    expect((fixture.nativeElement as HTMLElement).querySelector('mat-spinner')).not.toBeNull();
  });

  it('Scenario 6: shows total amount and no spinner when estimate is resolved', async () => {
    const fixture = await createComponent(makeCostStore(ESTIMATE_COST, false));
    expect((fixture.nativeElement as HTMLElement).querySelector('mat-spinner')).toBeNull();
    expect(text(fixture)).toMatch(/270/);
  });
});

describe('RentalCostSectionComponent — toggle', () => {
  it('Scenario 7: breakdown panel hidden by default', async () => {
    const fixture = await createComponent(makeCostStore(ESTIMATE_COST));
    expect(text(fixture)).not.toContain('Subtotal');
  });

  it('Scenario 8: breakdown panel visible after toggle click', async () => {
    const fixture = await createComponent(makeCostStore(ESTIMATE_COST));
    toggleButton(fixture).click();
    fixture.detectChanges();
    expect(text(fixture)).toContain('Subtotal');
  });
});

describe('RentalCostSectionComponent — breakdown rows', () => {
  let fixture: ComponentFixture<RentalCostSectionComponent>;

  beforeEach(async () => {
    fixture = await createComponent(makeCostStore(ESTIMATE_COST));
    toggleButton(fixture).click();
    fixture.detectChanges();
  });

  it('Scenario 9: equipment row shows item name and calculationMessage', () => {
    expect(text(fixture)).toContain('Trek Domane');
    expect(text(fixture)).toContain('1 h × 270 ₽');
  });

  it('Scenario 10: subtotal row always shown', () => {
    expect(text(fixture)).toContain('Subtotal');
  });

  it('Scenario 11: discount row shown when discountPercent is set', () => {
    expect(text(fixture)).toContain('Discount');
    expect(text(fixture)).toContain('10%');
  });

  it('Scenario 14: total row always shown', () => {
    expect(text(fixture)).toContain('Total');
  });
});

describe('RentalCostSectionComponent — special price and no-discount cases', () => {
  it('Scenario 12: special price row shown when specialPricingApplied is true', async () => {
    const fixture = await createComponent(makeCostStore(SPECIAL_COST));
    toggleButton(fixture).click();
    fixture.detectChanges();
    expect(text(fixture)).toContain('Special price applied');
  });

  it('Scenario 13: no discount or special price row when both are absent', async () => {
    const fixture = await createComponent(makeCostStore(NO_DISCOUNT_COST));
    toggleButton(fixture).click();
    fixture.detectChanges();
    expect(text(fixture)).not.toContain('Discount');
    expect(text(fixture)).not.toContain('Special price applied');
  });
});
```

---

## 4. Validation Steps

```bash
npm test -- --project operator --testPathPattern="rental-cost-section"
```
