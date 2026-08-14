import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  Labels,
  MoneyPipe,
  REVENUE_METRIC_META,
  type CustomerSpendRow,
  type CustomerSpendSort,
  type CustomerSpendSortField,
  type RevenueMetricKey,
} from '@bikerental/shared';

@Component({
  selector: 'app-customer-spend-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, MatTooltipModule, MoneyPipe],
  template: `
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-left text-xs text-slate-400 border-b border-slate-200">
            <th class="font-normal py-1.5">
              <button
                type="button"
                class="flex items-center gap-0.5"
                [attr.aria-label]="sortAriaLabel()"
                (click)="onSort('customerId')"
              >
                {{ Labels.AnalyticsCustomerColumn }}
                @if (sort().field === 'customerId') {
                  <mat-icon class="!text-sm !w-4 !h-4 !leading-4">{{ sortIcon() }}</mat-icon>
                }
              </button>
            </th>
            @for (key of metricKeys(); track key) {
              <th
                class="font-normal py-1.5 text-right"
                [matTooltip]="REVENUE_METRIC_META[key].hint"
              >
                <button
                  type="button"
                  class="flex items-center gap-0.5 ml-auto"
                  [attr.aria-label]="sortAriaLabel()"
                  (click)="onSort(key)"
                >
                  {{ REVENUE_METRIC_META[key].label }}
                  @if (sort().field === key) {
                    <mat-icon class="!text-sm !w-4 !h-4 !leading-4">{{ sortIcon() }}</mat-icon>
                  }
                </button>
              </th>
            }
          </tr>
        </thead>
        <tbody>
          @for (row of rows(); track row.customerId) {
            <tr
              class="border-t border-slate-100 hover:bg-slate-50 cursor-pointer"
              [matTooltip]="Labels.AnalyticsCustomerDrillDownTooltip"
              (click)="rowSelect.emit(row.customerId)"
            >
              <td class="py-1.5 font-medium">
                {{ row.customer?.name ?? row.customer?.phone ?? row.customerId }}
              </td>
              @for (key of metricKeys(); track key) {
                <td class="py-1.5 text-right">{{ row.metrics[key] | money }}</td>
              }
            </tr>
          }
          @if (rows().length === 0) {
            <tr>
              <td [attr.colspan]="metricKeys().length + 1" class="py-6 text-center text-slate-400">
                {{ Labels.AnalyticsCustomersEmptyState }}
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class CustomerSpendTableComponent {
  readonly rows = input.required<readonly CustomerSpendRow[]>();
  readonly metricKeys = input.required<readonly RevenueMetricKey[]>();
  readonly sort = input.required<CustomerSpendSort>();
  readonly sortChange = output<CustomerSpendSort>();
  readonly rowSelect = output<string>();

  protected readonly Labels = Labels;
  protected readonly REVENUE_METRIC_META = REVENUE_METRIC_META;

  protected sortIcon(): string {
    return this.sort().direction === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  protected sortAriaLabel(): string {
    return this.sort().direction === 'asc'
      ? Labels.AnalyticsSortAscending
      : Labels.AnalyticsSortDescending;
  }

  protected onSort(field: CustomerSpendSortField): void {
    const current = this.sort();
    const direction = current.field === field && current.direction === 'desc' ? 'asc' : 'desc';
    this.sortChange.emit({ field, direction });
  }
}
