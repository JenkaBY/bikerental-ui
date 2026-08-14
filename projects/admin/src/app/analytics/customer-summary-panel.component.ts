import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import {
  Labels,
  REVENUE_METRIC_KEYS,
  type CustomerCounts,
  type RevenueMetrics,
} from '@bikerental/shared';
import { CustomerCountTileComponent } from './customer-count-tile.component';
import { RevenueTotalsComponent } from './revenue-totals.component';

@Component({
  selector: 'app-customer-summary-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CustomerCountTileComponent, RevenueTotalsComponent],
  template: `
    <div class="flex flex-col gap-3">
      <div>
        <div class="text-xs font-semibold text-slate-500 uppercase mb-1">
          {{ Labels.AnalyticsCustomerCountsGroupLabel }}
        </div>
        <div class="flex flex-wrap gap-2">
          <app-customer-count-tile
            [label]="Labels.AnalyticsCountActiveCustomers"
            [hint]="Labels.AnalyticsCountActiveCustomersHint"
            [value]="counts()?.activeCustomers"
          />
          <app-customer-count-tile
            [label]="Labels.AnalyticsCountNewCustomers"
            [hint]="Labels.AnalyticsCountNewCustomersHint"
            [value]="counts()?.newCustomers"
          />
          <app-customer-count-tile
            [label]="Labels.AnalyticsCountRegisteredCustomers"
            [hint]="Labels.AnalyticsCountRegisteredCustomersHint"
            [value]="counts()?.registeredCustomers"
          />
        </div>
        @if (operatorFiltered()) {
          <p class="text-xs text-slate-400 mt-1">
            {{ Labels.AnalyticsCustomerCountsOperatorNote }}
          </p>
        }
      </div>

      <app-revenue-totals [totals]="totals()" [metricKeys]="metricKeys" />
    </div>
  `,
})
export class CustomerSummaryPanelComponent {
  readonly counts = input<CustomerCounts | null>(null);
  readonly totals = input<RevenueMetrics | null>(null);
  readonly operatorFiltered = input(false);

  protected readonly Labels = Labels;
  protected readonly metricKeys = REVENUE_METRIC_KEYS;
}
