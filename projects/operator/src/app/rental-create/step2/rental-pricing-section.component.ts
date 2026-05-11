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
    <div class="flex flex-col gap-4">
      <mat-slide-toggle
        [disabled]="!store.isSelectedAnyEquipment()"
        [checked]="store.specialPriceEnabled()"
        (change)="store.setSpecialPriceEnabled($event.checked)"
      >
        {{ Labels.SpecialPriceModeLabel }}
      </mat-slide-toggle>

      @if (store.specialPriceEnabled()) {
        <app-special-price-input
          [disabled]="!store.isSelectedAnyEquipment()"
          [value]="store.specialPrice()"
          [showRequired]="store.specialPrice() === null"
          (valueChange)="store.setSpecialPrice($event)"
        />
      } @else {
        <app-discount-input
          [disabled]="!store.isSelectedAnyEquipment()"
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
