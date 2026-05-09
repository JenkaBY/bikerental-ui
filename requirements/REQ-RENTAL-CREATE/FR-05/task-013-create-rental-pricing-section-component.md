# Task 013: Create `RentalPricingSectionComponent` (Smart)

> **Applied Skill:** `angular-component`, `angular-signals` — Smart component. Injects `RentalStore` (resolved from parent injector). Reads and writes pricing mode signals. Conditionally renders `DiscountInputComponent` or `SpecialPriceInputComponent` based on `specialPriceEnabled`.

## 1. Objective

Create the pricing section that toggles between discount mode and special-price mode. Toggling special-price mode off clears the price in the store. The mode toggle is a `mat-slide-toggle`.

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/rental-create/step2/rental-pricing-section.component.ts`
* **Action:** Create New File

## 3. Code Implementation

```typescript
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Labels, RentalStore } from '@bikerental/shared';
import { DiscountInputComponent } from './discount-input.component';
import { SpecialPriceInputComponent } from './special-price-input.component';

@Component({
  selector: 'app-rental-pricing-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatSlideToggleModule, DiscountInputComponent, SpecialPriceInputComponent],
  template: `
    <div class="flex flex-col gap-4">
      <mat-slide-toggle
        [checked]="store.specialPriceEnabled()"
        (change)="store.setSpecialPriceEnabled($event.checked)"
      >
        {{ Labels.SpecialPriceModeLabel }}
      </mat-slide-toggle>

      @if (store.specialPriceEnabled()) {
        <app-special-price-input
          [value]="store.specialPrice()"
          [showRequired]="store.specialPrice() === null"
          (valueChange)="store.setSpecialPrice($event)"
        />
      } @else {
        <app-discount-input
          [value]="store.discountPercent()"
          (valueChange)="store.setDiscountPercent($event)"
        />
      }
    </div>
  `,
})
export class RentalPricingSectionComponent {
  protected readonly store = inject(RentalStore);
  protected readonly Labels = Labels;
}
```

## 4. Validation Steps

```bash
npx ng build operator --configuration=development
```
