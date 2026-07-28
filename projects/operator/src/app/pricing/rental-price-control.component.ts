import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Labels, makeMoney, MoneyPipe, SegmentedTabsComponent } from '@bikerental/shared';
import type {
  RentalCostEstimate,
  RentalPriceMode,
  RentalPricingDraft,
  SegmentTab,
} from '@bikerental/shared';
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
    @let currentEstimate = estimate();

    <app-segmented-tabs
      [tabs]="modeTabs()"
      [activeId]="value().mode"
      (tabSelect)="onModeSelect($event)"
    />

    <div class="flex items-center justify-between gap-3 pt-3">
      <span class="text-sm text-slate-600">{{ Labels.TotalCost }}</span>

      @if (value().mode === 'FIXED') {
        <app-fixed-price-input
          [value]="value().specialPrice"
          [currency]="currency()"
          (valueChange)="onSpecialPriceChange($event)"
        />
      } @else {
        <span class="flex items-center gap-1.5">
          @if (value().mode === 'DISCOUNT') {
            @if (currentEstimate) {
              <span class="text-sm text-slate-500"
                >{{ currentEstimate.subtotal | money }} &minus;</span
              >
            }
            <app-discount-percent-input
              [value]="value().discountPercent"
              (valueChange)="onDiscountChange($event)"
            />
            @if (currentEstimate) {
              <span class="text-sm text-slate-500">=</span>
            }
          }

          @if (isCalculating()) {
            <mat-spinner diameter="20" />
          } @else if (currentEstimate) {
            <span class="font-semibold text-slate-900">{{
              currentEstimate.totalCost | money
            }}</span>
          } @else {
            <span class="text-slate-500">{{ zeroMoney | money }}</span>
          }
        </span>
      }
    </div>
  `,
})
export class RentalPriceControlComponent {
  readonly value = input.required<RentalPricingDraft>();
  readonly estimate = input<RentalCostEstimate | null>(null);
  readonly fixedPrefill = input<number | null>(null);
  readonly isCalculating = input(false);
  readonly overridesDisabled = input(false);
  readonly valueChange = output<RentalPricingDraft>();

  protected readonly Labels = Labels;
  protected readonly zeroMoney = makeMoney(0);

  protected readonly modeTabs = computed<SegmentTab[]>(() => {
    const disabled = this.overridesDisabled();
    return [
      { id: 'FULL', label: Labels.FullPrice },
      { id: 'DISCOUNT', label: Labels.DiscountLabel, disabled },
      { id: 'FIXED', label: Labels.FixedPrice, disabled },
    ];
  });

  protected readonly currency = computed(
    () => this.estimate()?.totalCost.currency ?? this.zeroMoney.currency,
  );

  protected onModeSelect(id: string): void {
    const mode = id as RentalPriceMode;
    if (mode === this.value().mode) return;
    switch (mode) {
      case 'FULL':
        this.valueChange.emit({ mode, discountPercent: null, specialPrice: null });
        return;
      case 'DISCOUNT':
        this.valueChange.emit({ mode, discountPercent: 0, specialPrice: null });
        return;
      case 'FIXED':
        this.valueChange.emit({
          mode,
          discountPercent: null,
          specialPrice: this.fixedPrefill() ?? 0,
        });
    }
  }

  protected onDiscountChange(percent: number): void {
    this.valueChange.emit({
      ...this.value(),
      discountPercent: Math.min(100, Math.max(0, percent)),
    });
  }

  protected onSpecialPriceChange(price: number | null): void {
    this.valueChange.emit({ ...this.value(), specialPrice: price });
  }
}
