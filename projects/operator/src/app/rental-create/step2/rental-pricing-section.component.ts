import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Labels, RentalStore } from '@bikerental/shared';
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
  protected readonly store = inject(RentalStore);
  protected readonly Labels = Labels;
}
