import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  bucketRangeLabel,
  Labels,
  MoneyPipe,
  REVENUE_METRIC_META,
  type RevenueBucket,
  type RevenueGranularity,
  type RevenueMetricKey,
  type RevenueMetrics,
} from '@bikerental/shared';

@Component({
  selector: 'app-revenue-bucket-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, MatTooltipModule, MoneyPipe],
  template: `
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-left text-xs text-slate-400 border-b border-slate-200">
            <th class="font-normal py-1.5 w-8"></th>
            <th class="font-normal py-1.5">{{ Labels.AnalyticsBucketColumn }}</th>
            @for (key of metricKeys(); track key) {
              <th
                class="font-normal py-1.5 text-right"
                [matTooltip]="REVENUE_METRIC_META[key].hint"
              >
                {{ REVENUE_METRIC_META[key].label }}
              </th>
            }
          </tr>
        </thead>
        <tbody>
          @for (bucket of buckets(); track $index) {
            <tr
              class="border-t border-slate-100 hover:bg-slate-50 cursor-pointer"
              (click)="toggle($index)"
            >
              <td class="py-1.5">
                <mat-icon class="!text-base">{{
                  isExpanded($index) ? 'expand_less' : 'expand_more'
                }}</mat-icon>
              </td>
              <td class="py-1.5 font-medium">{{ bucketLabel(bucket) }}</td>
              @for (key of metricKeys(); track key) {
                <td class="py-1.5 text-right">{{ bucket.totals[key] | money }}</td>
              }
            </tr>
            @if (isExpanded($index)) {
              <tr class="text-[10px] uppercase tracking-wide text-slate-400">
                <td></td>
                <td class="pl-4">{{ dimensionColumnLabel() }}</td>
                @for (key of metricKeys(); track key) {
                  <td></td>
                }
              </tr>
              @for (row of bucket.rows; track row.key) {
                <tr
                  [class]="
                    rowSelectable()
                      ? 'border-t border-slate-50 bg-slate-50/50 text-slate-600 cursor-pointer hover:bg-slate-100'
                      : 'border-t border-slate-50 bg-slate-50/50 text-slate-600'
                  "
                  (click)="onRowClick($event, row.key)"
                >
                  <td></td>
                  <td class="py-1 pl-4">{{ nameFor()(row.key) }}</td>
                  @for (key of metricKeys(); track key) {
                    <td class="py-1 text-right">{{ row.metrics[key] | money }}</td>
                  }
                </tr>
              }
              <tr
                class="border-t border-slate-50 bg-slate-50/50 text-slate-400 italic"
                [matTooltip]="unattributedHint()"
              >
                <td></td>
                <td class="py-1 pl-4">{{ Labels.AnalyticsUnattributedRow }}</td>
                @for (key of metricKeys(); track key) {
                  <td class="py-1 text-right">{{ unattributedFor()(bucket)[key] | money }}</td>
                }
              </tr>
            }
          }
          @if (buckets().length === 0) {
            <tr>
              <td [attr.colspan]="metricKeys().length + 2" class="py-6 text-center text-slate-400">
                {{ Labels.AnalyticsEmptyState }}
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class RevenueBucketTableComponent {
  readonly buckets = input.required<readonly RevenueBucket[]>();
  readonly granularity = input.required<RevenueGranularity>();
  readonly metricKeys = input.required<readonly RevenueMetricKey[]>();
  readonly dimensionColumnLabel = input.required<string>();
  readonly unattributedHint = input.required<string>();
  readonly nameFor = input.required<(key: string) => string>();
  readonly unattributedFor = input.required<(bucket: RevenueBucket) => RevenueMetrics>();
  readonly rowSelectable = input(false);
  readonly rowSelect = output<string>();

  protected readonly Labels = Labels;
  protected readonly REVENUE_METRIC_META = REVENUE_METRIC_META;

  private readonly expanded = signal<ReadonlySet<number>>(new Set());

  protected isExpanded(index: number): boolean {
    return this.expanded().has(index);
  }

  protected toggle(index: number): void {
    this.expanded.update((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  protected onRowClick(event: MouseEvent, key: string): void {
    if (!this.rowSelectable()) return;
    event.stopPropagation();
    this.rowSelect.emit(key);
  }

  protected bucketLabel(bucket: RevenueBucket): string {
    return bucketRangeLabel(bucket.start, bucket.end, this.granularity());
  }
}
