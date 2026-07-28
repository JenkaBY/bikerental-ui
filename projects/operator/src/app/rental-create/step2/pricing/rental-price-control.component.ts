import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  Labels,
  makeMoney,
  MoneyPipe,
  RentalCostCalculationStore,
  RentalStore,
  SegmentedTabsComponent,
} from '@bikerental/shared';
import type { RentalPriceMode, SegmentTab } from '@bikerental/shared';
import { DiscountPercentInputComponent } from './discount-percent-input.component';
import { FixedPriceInputComponent } from './fixed-price-input.component';

@Component({
  selector: 'app-rental-price-control',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatProgressSpinnerModule,
    MoneyPipe,
    SegmentedTabsComponent,
    DiscountPercentInputComponent,
    FixedPriceInputComponent,
  ],
  template: `
    @let estimate = costStore.estimate();

    <app-segmented-tabs
      [tabs]="modeTabs()"
      [activeId]="store.priceMode()"
      (tabSelect)="onModeSelect($event)"
    />

    <div class="flex items-center justify-between gap-3 pt-3">
      <span class="text-sm text-slate-600">{{ Labels.TotalCost }}</span>

      @if (store.isFixedPriceMode()) {
        <app-fixed-price-input
          [value]="store.specialPrice()"
          [currency]="currency()"
          (valueChange)="store.setSpecialPrice($event)"
        />
      } @else {
        <span class="flex items-center gap-1.5">
          @if (store.isDiscountPriceMode()) {
            @if (estimate) {
              <span class="text-sm text-slate-500">{{ estimate.subtotal | money }} &minus;</span>
            }
            <app-discount-percent-input
              [value]="store.discountPercent()"
              (valueChange)="store.setDiscountPercent($event)"
            />
            @if (estimate) {
              <span class="text-sm text-slate-500">=</span>
            }
          }

          @if (costStore.isCalculating()) {
            <mat-spinner diameter="20" />
          } @else if (estimate) {
            <span class="font-semibold text-slate-900">{{ estimate.totalCost | money }}</span>
          } @else {
            <span class="text-slate-500">{{ zeroMoney | money }}</span>
          }
        </span>
      }
    </div>
  `,
})
export class RentalPriceControlComponent {
  protected readonly store = inject(RentalStore);
  protected readonly costStore = inject(RentalCostCalculationStore);
  protected readonly Labels = Labels;
  protected readonly zeroMoney = makeMoney(0);

  protected readonly modeTabs = computed<SegmentTab[]>(() => {
    const disabled = !this.store.isSelectedAnyEquipment();
    return [
      { id: 'FULL', label: Labels.FullPrice },
      { id: 'DISCOUNT', label: Labels.DiscountLabel, disabled },
      { id: 'FIXED', label: Labels.FixedPrice, disabled },
    ];
  });

  protected readonly currency = computed(
    () => this.costStore.estimate()?.totalCost.currency ?? this.zeroMoney.currency,
  );

  protected onModeSelect(id: string): void {
    const mode = id as RentalPriceMode;
    if (mode === 'FIXED') {
      this.store.setPriceMode('FIXED', this.costStore.estimate()?.subtotal.amount ?? 0);
    } else {
      this.store.setPriceMode(mode);
    }
  }
}
