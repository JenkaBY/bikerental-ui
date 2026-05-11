# Task 024: Spec for `RentalPricingSectionComponent`

> **Applied Skill:** `angular-testing` — Smart component. Override `RentalStore` via `overrideComponent`. Verify: discount input shown when special price off; special price input shown when on; `setSpecialPriceEnabled` called on toggle.

## 1. Objective

Unit tests for `RentalPricingSectionComponent`: default mode renders discount input; special price mode renders special price input; toggling calls store setter.

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/rental-create/step2/rental-pricing-section.component.spec.ts`
* **Action:** Create New File

## 3. Code Implementation

```typescript
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { vi } from 'vitest';
import { RentalStore } from '@bikerental/shared';
import { RentalPricingSectionComponent } from './rental-pricing-section.component';

function makeStore(specialEnabled = false) {
  return {
    specialPriceEnabled: signal(specialEnabled),
    discountPercent: signal<number | null>(null),
    specialPrice: signal<number | null>(null),
    setSpecialPriceEnabled: vi.fn(),
    setDiscountPercent: vi.fn(),
    setSpecialPrice: vi.fn(),
  };
}

describe('RentalPricingSectionComponent', () => {
  let fixture: ComponentFixture<RentalPricingSectionComponent>;

  async function setup(specialEnabled = false) {
    const store = makeStore(specialEnabled);

    await TestBed.configureTestingModule({
      imports: [RentalPricingSectionComponent],
      providers: [provideAnimationsAsync()],
    })
      .overrideComponent(RentalPricingSectionComponent, {
        set: { providers: [{ provide: RentalStore, useValue: store }] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(RentalPricingSectionComponent);
    fixture.detectChanges();
    return store;
  }

  it('should render DiscountInputComponent when special price is disabled', async () => {
    await setup(false);
    expect(fixture.nativeElement.querySelector('app-discount-input')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-special-price-input')).toBeNull();
  });

  it('should render SpecialPriceInputComponent when special price is enabled', async () => {
    await setup(true);
    expect(fixture.nativeElement.querySelector('app-special-price-input')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-discount-input')).toBeNull();
  });
});
```

## 4. Validation Steps

```bash
npx ng test operator --include="**/step2/rental-pricing-section.component.spec**"
```
