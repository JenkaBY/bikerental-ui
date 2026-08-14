import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule, MatSelectChange } from '@angular/material/select';
import {
  AnalyticsRevenueStore,
  Labels,
  REVENUE_METRIC_META,
  REVENUE_REPORT_SOURCES,
  resolveErrorMessage,
  type RevenueBucket,
  type RevenueMetricKey,
  type RevenueMetrics,
  type RevenueQuery,
  type RevenueReportId,
} from '@bikerental/shared';
import { RevenueBucketTableComponent } from './revenue-bucket-table.component';
import { RevenueChartComponent } from './revenue-chart.component';
import { RevenueTotalsComponent } from './revenue-totals.component';

@Component({
  selector: 'app-revenue-report-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [AnalyticsRevenueStore],
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatProgressBarModule,
    MatSelectModule,
    RevenueTotalsComponent,
    RevenueChartComponent,
    RevenueBucketTableComponent,
  ],
  template: `
    @if (needsScope()) {
      <p class="text-sm text-slate-400 py-8 text-center">{{ Labels.AnalyticsSelectTypePrompt }}</p>
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
        <app-revenue-totals [totals]="store.totals()" [metricKeys]="metricKeys()" />

        @if (store.hasSeries()) {
          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-56">
            <mat-label>{{ Labels.AnalyticsMetricSelectorLabel }}</mat-label>
            <mat-select [value]="store.metric()" (selectionChange)="onMetricChange($event)">
              @for (key of metricKeys(); track key) {
                <mat-option [value]="key">{{ REVENUE_METRIC_META[key].label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <app-revenue-chart
            [buckets]="store.buckets()"
            [granularity]="query().granularity"
            [metric]="store.metric()"
            [dimensionKeys]="store.dimensionKeys()"
            [nameFor]="nameForFn"
          />
        }

        <app-revenue-bucket-table
          [buckets]="store.buckets()"
          [granularity]="query().granularity"
          [metricKeys]="metricKeys()"
          [dimensionColumnLabel]="dimensionColumnLabel()"
          [unattributedHint]="unattributedHint()"
          [nameFor]="nameForFn"
          [unattributedFor]="unattributedForFn"
          [rowSelectable]="reportId() === 'equipment-types'"
          (rowSelect)="onRowSelect($event)"
        />
      </div>
    }
  `,
})
export class RevenueReportPanelComponent {
  protected readonly store = inject(AnalyticsRevenueStore);
  private readonly sources = inject(REVENUE_REPORT_SOURCES);

  readonly reportId = input.required<RevenueReportId>();
  readonly query = input.required<RevenueQuery>();
  readonly drillDown = output<string>();

  protected readonly Labels = Labels;
  protected readonly REVENUE_METRIC_META = REVENUE_METRIC_META;
  protected readonly resolveErrorMessage = resolveErrorMessage;

  protected readonly nameForFn = (key: string): string => this.store.source()?.nameFor(key) ?? key;
  protected readonly unattributedForFn = (bucket: RevenueBucket): RevenueMetrics =>
    this.store.unattributedFor(bucket);

  private readonly currentSource = computed(() =>
    this.sources.find((s) => s.id === this.reportId()),
  );
  protected readonly needsScope = computed(
    () => !!this.currentSource()?.requiresScope && !this.query().scopeId,
  );
  protected readonly metricKeys = computed(() => this.store.source()?.metricKeys ?? []);
  protected readonly dimensionColumnLabel = computed(
    () => this.store.source()?.dimensionColumnLabel ?? '',
  );
  protected readonly unattributedHint = computed(() => this.store.source()?.unattributedHint ?? '');
  protected readonly isEmpty = computed(() => (this.store.report()?.buckets.length ?? 0) === 0);

  constructor() {
    effect(() => {
      this.store.setReportId(this.reportId());
      if (this.needsScope()) return;
      this.store.setQuery(this.query());
    });
  }

  protected onMetricChange(event: MatSelectChange): void {
    this.store.setMetric(event.value as RevenueMetricKey);
  }

  protected onRowSelect(key: string): void {
    this.drillDown.emit(key);
  }

  reload(): void {
    this.store.reload();
  }
}
