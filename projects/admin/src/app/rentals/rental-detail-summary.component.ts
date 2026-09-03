import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import {
  CustomerRefComponent,
  Labels,
  MoneyPipe,
  RentalCostCalculationStore,
  RentalPeriodSectionComponent,
  RentalPriceModeBadgeComponent,
  RentalStore,
  RentalTransactionsStore,
  type CustomerRef,
} from '@bikerental/shared';

@Component({
  selector: 'app-rental-detail-summary',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MoneyPipe,
    CustomerRefComponent,
    RentalPeriodSectionComponent,
    RentalPriceModeBadgeComponent,
  ],
  template: `
    <div class="flex flex-col gap-3">
      <app-customer-ref [customer]="customerRef()" [link]="true" />

      <div class="flex flex-col gap-1">
        <span class="text-xs uppercase tracking-wide text-slate-400">
          {{ Labels.RentalPeriodLabel }}
        </span>
        <app-rental-period-section />
      </div>

      <div class="flex items-center flex-wrap gap-x-2 gap-y-1 text-sm">
        <span class="text-slate-500">{{ costLabel() }}:</span>
        <span class="text-slate-900 font-semibold">
          @if (costStore.isCalculating()) {
            <span class="text-slate-400">&hellip;</span>
          } @else if (totalCost(); as total) {
            {{ total | money }}
          } @else {
            <span class="text-slate-400">&mdash;</span>
          }
        </span>
        <span class="text-slate-500">
          ({{ Labels.CustomerBalanceReserved }}:
          @if (transactionsStore.reserved(); as reserved) {
            {{ reserved | money }}
          } @else {
            &mdash;
          }
          )
        </span>
        <app-rental-price-mode-badge
          [mode]="store.priceMode()"
          [discountPercent]="store.discountPercent()"
        />
      </div>

      @if (store.writtenOffAmount(); as written) {
        <div class="flex items-center gap-2 text-sm">
          <span class="text-slate-500">{{ Labels.WrittenOffBadge }}:</span>
          <span class="text-orange-700">{{ written | money }}</span>
        </div>
      }
      @if (transactionsStore.outstandingDebt(); as debt) {
        <div class="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
          <span class="text-xs text-amber-800">{{ Labels.RentalOutstandingDebt }}</span>
          <p class="text-base font-semibold text-red-700">{{ debt | money }}</p>
        </div>
      }
    </div>
  `,
})
export class RentalDetailSummaryComponent {
  protected readonly Labels = Labels;
  protected readonly store = inject(RentalStore);
  protected readonly costStore = inject(RentalCostCalculationStore);
  protected readonly transactionsStore = inject(RentalTransactionsStore);

  protected readonly totalCost = computed(
    () => this.costStore.totalCost() ?? this.store.finalCost(),
  );

  protected readonly costLabel = computed(() =>
    this.costStore.isFinal() ? Labels.FinalCost : Labels.CurrentCost,
  );

  protected readonly customerRef = computed<CustomerRef | undefined>(() => {
    const c = this.store.customer();
    if (!c) return undefined;
    return {
      id: c.id,
      phone: c.phone,
      name: `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim() || undefined,
    };
  });
}
