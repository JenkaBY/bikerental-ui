import { ChangeDetectionStrategy, Component, computed, inject, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  Labels,
  MoneyPipe,
  RentalCostCalculationStore,
  RentalStore,
  RentalValidationStore,
} from '@bikerental/shared';
import type { RentalPricingDraft } from '@bikerental/shared';
import { RentalBalanceWarningComponent } from '../step3/rental-balance-warning.component';
import { RentalPriceControlComponent } from '../../pricing/rental-price-control.component';

@Component({
  selector: 'app-rental-cost-footer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MoneyPipe, RentalBalanceWarningComponent, RentalPriceControlComponent],
  template: `
    <div class="bg-white border-t border-slate-200 shadow-lg px-4 py-3 flex flex-col gap-2">
      <app-rental-price-control
        [value]="pricing()"
        [estimate]="costStore.estimate() ?? null"
        [fixedPrefill]="costStore.estimate()?.subtotal?.amount ?? 0"
        [isCalculating]="costStore.isCalculating()"
        [overridesDisabled]="!rentalStore.isSelectedAnyEquipment()"
        (valueChange)="onPricingChange($event)"
      />

      @let isBalanceSufficient = validationStore.isBalanceSufficient();
      @let isSavingRental = rentalStore.isSaving();

      @if (validationStore.projectedBalance(); as projected) {
        <div class="flex items-center justify-between">
          <span class="text-sm text-slate-600">{{ Labels.ProjectedBalance }}</span>
          <span class="font-medium" [class.text-red-600]="!isBalanceSufficient">
            {{ projected | money }}
          </span>
        </div>
      }

      <app-rental-balance-warning (topUpRequested)="topUpRequested.emit()" />

      <div class="flex gap-2 mt-1">
        <button
          mat-stroked-button
          type="button"
          class="flex-1 !text-red-600 !border-red-400"
          (click)="cancelRequested.emit()"
        >
          {{ Labels.Cancel }}
        </button>
        <button
          mat-stroked-button
          type="button"
          class="flex-1"
          [disabled]="isSavingRental"
          (click)="saveDraftRequested.emit()"
        >
          @if (isSavingRental) {
            {{ Labels.Saving }}
          } @else {
            {{ Labels.SaveDraft }}
          }
        </button>
        <button
          mat-flat-button
          color="primary"
          type="button"
          class="flex-1"
          [disabled]="!validationStore.canProceed() || isSavingRental"
          (click)="nextRequested.emit()"
        >
          {{ Labels.Next }}
        </button>
      </div>
    </div>
  `,
})
export class RentalCostFooterComponent {
  protected readonly rentalStore = inject(RentalStore);
  protected readonly costStore = inject(RentalCostCalculationStore);
  protected readonly validationStore = inject(RentalValidationStore);
  protected readonly Labels = Labels;

  readonly nextRequested = output<void>();
  readonly saveDraftRequested = output<void>();
  readonly topUpRequested = output<void>();
  readonly cancelRequested = output<void>();

  protected readonly pricing = computed<RentalPricingDraft>(() => ({
    mode: this.rentalStore.priceMode(),
    discountPercent: this.rentalStore.discountPercent(),
    specialPrice: this.rentalStore.specialPrice(),
  }));

  protected onPricingChange(draft: RentalPricingDraft): void {
    this.rentalStore.setPriceMode(draft.mode, draft.specialPrice ?? 0);
    this.rentalStore.setDiscountPercent(draft.discountPercent);
    this.rentalStore.setSpecialPrice(draft.specialPrice);
  }
}
