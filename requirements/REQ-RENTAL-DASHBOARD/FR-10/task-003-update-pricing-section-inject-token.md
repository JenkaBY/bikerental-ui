# Task 003: Update `RentalPricingSectionComponent` to Inject `RENTAL_STORE_TOKEN`

> **Applied Skill:** `angular-component` — Replaces a concrete class injection (`inject(RentalStore)`) with the abstract token (`inject(RENTAL_STORE_TOKEN)`) so the component is reusable in any context that provides a compatible store implementation.

## 1. Objective

`RentalPricingSectionComponent` currently injects the concrete `RentalStore` class, preventing its reuse inside `RentalDetailComponent`. Switching the injection to `RENTAL_STORE_TOKEN` makes the component context-agnostic. No template or behavioral change is required.

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/rental-create/step2/rental-pricing-section.component.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:**

Replace the existing import line:

```typescript
// REMOVE:
import { Labels, RentalStore } from '@bikerental/shared';

// ADD:
import { Labels, RENTAL_STORE_TOKEN } from '@bikerental/shared';
```

**Code to Add/Replace:**

* **Location:** Inside the `RentalPricingSectionComponent` class body — the single `inject()` call.

**Before:**

```typescript
export class RentalPricingSectionComponent {
  protected readonly store = inject(RentalStore);
  protected readonly Labels = Labels;
}
```

**After:**

```typescript
export class RentalPricingSectionComponent {
  protected readonly store = inject(RENTAL_STORE_TOKEN);
  protected readonly Labels = Labels;
}
```

### Complete file after the change:

```typescript
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Labels, RENTAL_STORE_TOKEN } from '@bikerental/shared';
import { DiscountInputComponent } from './discount-input.component';
import { SpecialPriceInputComponent } from './special-price-input.component';

@Component({
  selector: 'app-rental-pricing-section',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatSlideToggleModule, DiscountInputComponent, SpecialPriceInputComponent],
  template: `
    @let isSpecialPriceEnabled = store.specialPriceEnabled();
    @let isAnyEquipmentSelected = store.isSelectedAnyEquipment();

    <div class="flex flex-col gap-4">
      <mat-slide-toggle
        [disabled]="!isAnyEquipmentSelected"
        [checked]="isSpecialPriceEnabled"
        (change)="store.setSpecialPriceEnabled($event.checked)"
      >
        {{ Labels.SpecialPriceModeLabel }}
      </mat-slide-toggle>

      @if (isSpecialPriceEnabled) {
        <app-special-price-input
          [disabled]="!isAnyEquipmentSelected"
          [value]="store.specialPrice()"
          [showRequired]="store.specialPrice() === null"
          (valueChange)="store.setSpecialPrice($event)"
        />
      } @else {
        <app-discount-input
          [disabled]="!isAnyEquipmentSelected"
          [value]="store.discountPercent()"
          (valueChange)="store.setDiscountPercent($event)"
        />
      }
    </div>
  `,
})
export class RentalPricingSectionComponent {
  protected readonly store = inject(RENTAL_STORE_TOKEN);
  protected readonly Labels = Labels;
}
```

## 4. Validation Steps

skip
