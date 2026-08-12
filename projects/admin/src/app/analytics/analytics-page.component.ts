import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule, MatSelectChange } from '@angular/material/select';
import {
  AnalyticsRevenueStore,
  daysInclusive,
  Labels,
  MAX_REVENUE_RANGE_DAYS,
  OperatorRevenueSource,
  parseDate,
  REVENUE_GRANULARITIES,
  REVENUE_METRIC_KEYS,
  REVENUE_METRIC_META,
  REVENUE_REPORT_SOURCES,
  resolveErrorMessage,
  resolveFieldErrorMessage,
  SegmentedTabsComponent,
  toIsoDate,
  type RevenueBucket,
  type RevenueGranularity,
  type RevenueMetricKey,
  type RevenueMetrics,
  type RevenueReportId,
  type SegmentTab,
} from '@bikerental/shared';
import { OperatorSelectComponent } from './operator-select.component';
import { RevenueBucketTableComponent } from './revenue-bucket-table.component';
import { RevenueChartComponent } from './revenue-chart.component';
import { RevenueFilterComponent, type RevenueFilterValue } from './revenue-filter.component';
import { RevenueTotalsComponent } from './revenue-totals.component';

function defaultRange(): { from: Date; to: Date } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 29);
  return { from, to };
}

@Component({
  selector: 'app-analytics-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    AnalyticsRevenueStore,
    { provide: REVENUE_REPORT_SOURCES, useFactory: () => [inject(OperatorRevenueSource)] },
  ],
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatFormFieldModule,
    MatSelectModule,
    SegmentedTabsComponent,
    RevenueFilterComponent,
    OperatorSelectComponent,
    RevenueTotalsComponent,
    RevenueChartComponent,
    RevenueBucketTableComponent,
  ],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>{{ Labels.AnalyticsPageTitle }}</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <div class="flex items-center justify-between mb-1">
          <app-segmented-tabs
            [tabs]="tabs()"
            [activeId]="reportId()"
            (tabSelect)="onReportChange($event)"
          />
          <button mat-stroked-button (click)="store.reload()">
            <mat-icon>refresh</mat-icon>
            {{ Labels.AnalyticsRefreshButton }}
          </button>
        </div>
        <p class="text-xs text-slate-400 mb-3">{{ Labels.AnalyticsFreshnessNote }}</p>

        <app-revenue-filter [value]="filterValue()" (filterChange)="onFilterChange($event)">
          <app-operator-select
            dimension-filter
            [value]="dimensionId()"
            (valueChange)="onDimensionChange($event)"
          />
        </app-revenue-filter>

        @if (rangeErrorMessage(); as msg) {
          <p class="text-sm text-red-600 mt-2">{{ msg }}</p>
        } @else if (store.error(); as err) {
          <div class="text-center mt-6 flex flex-col items-center gap-2">
            <p class="text-slate-500">{{ resolveErrorMessage(err) }}</p>
            <button mat-stroked-button (click)="store.reload()">{{ Labels.Retry }}</button>
          </div>
        } @else if (store.loading() || !store.report()) {
          <mat-progress-bar mode="indeterminate" class="mt-3" />
        } @else if (isEmpty()) {
          <p class="text-sm text-slate-400 py-8 text-center">{{ Labels.AnalyticsEmptyState }}</p>
        } @else {
          <div class="mt-4 flex flex-col gap-4">
            <app-revenue-totals [totals]="store.totals()" />

            @if (store.hasSeries()) {
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-56">
                <mat-label>{{ Labels.AnalyticsMetricSelectorLabel }}</mat-label>
                <mat-select [value]="store.metric()" (selectionChange)="onMetricChange($event)">
                  @for (key of METRIC_KEYS; track key) {
                    <mat-option [value]="key">{{ REVENUE_METRIC_META[key].label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <app-revenue-chart
                [buckets]="store.buckets()"
                [granularity]="granularity()"
                [metric]="store.metric()"
                [dimensionKeys]="store.dimensionKeys()"
                [nameFor]="nameForFn"
              />
            }

            <app-revenue-bucket-table
              [buckets]="store.buckets()"
              [granularity]="granularity()"
              [nameFor]="nameForFn"
              [unattributedFor]="unattributedForFn"
            />
          </div>
        }
      </mat-card-content>
    </mat-card>
  `,
})
export class AnalyticsPageComponent {
  protected readonly store = inject(AnalyticsRevenueStore);
  private readonly sources = inject(REVENUE_REPORT_SOURCES);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly Labels = Labels;
  protected readonly METRIC_KEYS = REVENUE_METRIC_KEYS;
  protected readonly REVENUE_METRIC_META = REVENUE_METRIC_META;
  protected readonly resolveErrorMessage = resolveErrorMessage;

  protected readonly nameForFn = (key: string): string => this.store.source()?.nameFor(key) ?? key;
  protected readonly unattributedForFn = (bucket: RevenueBucket): RevenueMetrics =>
    this.store.unattributedFor(bucket);

  protected readonly tabs = computed<SegmentTab[]>(() =>
    this.sources.map((source) => ({ id: source.id, label: source.tabLabel })),
  );

  private readonly defaults = defaultRange();
  private readonly params = toSignal(this.route.queryParams, { initialValue: {} as Params });

  protected readonly reportId = computed<RevenueReportId>(
    () => (this.params()['report'] as RevenueReportId) || this.sources[0]?.id || 'operators',
  );
  protected readonly from = computed(() => parseDate(this.params()['from']) ?? this.defaults.from);
  protected readonly to = computed(() => parseDate(this.params()['to']) ?? this.defaults.to);
  protected readonly granularity = computed<RevenueGranularity>(() => {
    const value = this.params()['granularity'];
    return REVENUE_GRANULARITIES.includes(value) ? (value as RevenueGranularity) : 'DAY';
  });
  protected readonly dimensionId = computed(() => this.params()['dimensionId'] || undefined);

  protected readonly filterValue = computed<RevenueFilterValue>(() => ({
    from: this.from(),
    to: this.to(),
    granularity: this.granularity(),
  }));

  protected readonly rangeExceeded = computed(
    () => daysInclusive(this.from(), this.to()) > MAX_REVENUE_RANGE_DAYS,
  );
  protected readonly rangeErrorMessage = computed(() =>
    this.rangeExceeded()
      ? resolveFieldErrorMessage({
          field: null,
          code: 'validation.max_date_range',
          params: { maxDays: MAX_REVENUE_RANGE_DAYS },
        })
      : null,
  );

  protected readonly isEmpty = computed(() => (this.store.report()?.buckets.length ?? 0) === 0);

  constructor() {
    effect(() => {
      this.store.setReportId(this.reportId());
      if (this.rangeExceeded()) return;
      this.store.setQuery({
        from: this.from(),
        to: this.to(),
        granularity: this.granularity(),
        dimensionId: this.dimensionId(),
      });
    });
  }

  protected onFilterChange(value: RevenueFilterValue): void {
    this.updateUrl(
      {
        from: toIsoDate(value.from),
        to: toIsoDate(value.to),
        granularity: value.granularity === 'DAY' ? null : value.granularity,
      },
      true,
    );
  }

  protected onDimensionChange(id: string | undefined): void {
    this.updateUrl({ dimensionId: id ?? null }, true);
  }

  protected onReportChange(id: string): void {
    this.updateUrl({ report: id === this.sources[0]?.id ? null : id, dimensionId: null }, true);
  }

  protected onMetricChange(event: MatSelectChange): void {
    this.store.setMetric(event.value as RevenueMetricKey);
  }

  private updateUrl(queryParams: Params, replaceUrl: boolean): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl,
    });
  }
}
