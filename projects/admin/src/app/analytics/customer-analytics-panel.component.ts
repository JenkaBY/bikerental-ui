import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule, MatSelectChange } from '@angular/material/select';
import {
  CustomerAnalyticsStore,
  Labels,
  REVENUE_METRIC_KEYS,
  REVENUE_METRIC_META,
  resolveErrorMessage,
  type CustomerAnalyticsRange,
  type CustomerSpendListState,
  type CustomerSpendSort,
  type RevenueMetricKey,
} from '@bikerental/shared';
import { CustomerEquipmentBreakdownComponent } from './customer-equipment-breakdown.component';
import { CustomerSpendTableComponent } from './customer-spend-table.component';
import { CustomerSummaryChartComponent } from './customer-summary-chart.component';
import { CustomerSummaryPanelComponent } from './customer-summary-panel.component';

@Component({
  selector: 'app-customer-analytics-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CustomerAnalyticsStore],
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatSelectModule,
    CustomerEquipmentBreakdownComponent,
    CustomerSpendTableComponent,
    CustomerSummaryChartComponent,
    CustomerSummaryPanelComponent,
  ],
  template: `
    @if (customerId(); as id) {
      <app-customer-equipment-breakdown [range]="range()" [customerId]="id" (back)="onBack()" />
    } @else {
      <div class="mt-4 flex flex-col gap-4">
        <h3 class="text-sm font-semibold text-slate-600">
          {{ Labels.AnalyticsCustomerSummaryHeading }}
        </h3>

        @if (store.summaryError(); as err) {
          <div class="text-center mt-2 flex flex-col items-center gap-2">
            <p class="text-slate-500">{{ resolveErrorMessage(err) }}</p>
            <button mat-stroked-button (click)="store.reload()">{{ Labels.Retry }}</button>
          </div>
        } @else if (store.summaryLoading() && !store.summary()) {
          <mat-progress-bar mode="indeterminate" />
        } @else {
          <app-customer-summary-panel
            [counts]="store.counts()"
            [totals]="store.summaryTotals()"
            [operatorFiltered]="store.operatorFilterActive()"
          />

          @if (store.hasSeries()) {
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-56">
              <mat-label>{{ Labels.AnalyticsMetricSelectorLabel }}</mat-label>
              <mat-select
                [value]="store.chartMetric()"
                (selectionChange)="onChartMetricChange($event)"
              >
                @for (key of chartMetricKeys; track key) {
                  <mat-option [value]="key">{{ REVENUE_METRIC_META[key].label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <app-customer-summary-chart
              [buckets]="store.summaryBuckets()"
              [granularity]="range().granularity"
              [metric]="store.chartMetric()"
            />
          }
        }

        <h3 class="text-sm font-semibold text-slate-600 mt-2">
          {{ Labels.AnalyticsCustomerListHeading }}
        </h3>
        <p class="text-xs text-slate-400 -mt-2">{{ Labels.AnalyticsCustomerListNote }}</p>

        @if (store.listError(); as err) {
          <div class="text-center mt-2 flex flex-col items-center gap-2">
            <p class="text-slate-500">{{ resolveErrorMessage(err) }}</p>
            <button mat-stroked-button (click)="store.reload()">{{ Labels.Retry }}</button>
          </div>
        } @else if (store.listLoading() && store.rows().length === 0) {
          <mat-progress-bar mode="indeterminate" />
        } @else {
          <app-customer-spend-table
            [rows]="store.rows()"
            [metricKeys]="listMetricKeys"
            [sort]="store.sort()"
            (sortChange)="onSortChange($event)"
            (rowSelect)="customerSelect.emit($event)"
          />

          <mat-paginator
            [length]="store.totalItems()"
            [pageIndex]="store.pageIndex()"
            [pageSize]="store.pageSize()"
            [pageSizeOptions]="[10, 20, 50]"
            (page)="onPageChange($event)"
            showFirstLastButtons
          />
        }
      </div>
    }
  `,
})
export class CustomerAnalyticsPanelComponent {
  protected readonly store = inject(CustomerAnalyticsStore);

  readonly range = input.required<CustomerAnalyticsRange>();
  readonly list = input.required<CustomerSpendListState>();
  readonly customerId = input<string | undefined>(undefined);
  readonly pageChange = output<PageEvent>();
  readonly sortChange = output<CustomerSpendSort>();
  readonly customerSelect = output<string | undefined>();

  protected readonly Labels = Labels;
  protected readonly REVENUE_METRIC_META = REVENUE_METRIC_META;
  protected readonly resolveErrorMessage = resolveErrorMessage;
  protected readonly listMetricKeys = REVENUE_METRIC_KEYS;
  protected readonly chartMetricKeys = REVENUE_METRIC_KEYS;

  constructor() {
    effect(() => this.store.setRange(this.range()));
    effect(() => this.store.setList(this.list()));
  }

  protected onChartMetricChange(event: MatSelectChange): void {
    this.store.setChartMetric(event.value as RevenueMetricKey);
  }

  protected onPageChange(event: PageEvent): void {
    this.pageChange.emit(event);
  }

  protected onSortChange(sort: CustomerSpendSort): void {
    this.sortChange.emit(sort);
  }

  protected onBack(): void {
    this.customerSelect.emit(undefined);
  }

  reload(): void {
    this.store.reload();
  }
}
