import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  Labels,
  MoneyPipe,
  REVENUE_METRIC_KEYS,
  REVENUE_METRIC_META,
  toIsoDate,
  type RevenueBucket,
  type RevenueGranularity,
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
            @for (key of METRIC_KEYS; track key) {
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
              @for (key of METRIC_KEYS; track key) {
                <td class="py-1.5 text-right">{{ bucket.totals[key] | money }}</td>
              }
            </tr>
            @if (isExpanded($index)) {
              @for (row of bucket.rows; track row.key) {
                <tr class="border-t border-slate-50 bg-slate-50/50 text-slate-600">
                  <td></td>
                  <td class="py-1 pl-4">{{ nameFor()(row.key) }}</td>
                  @for (key of METRIC_KEYS; track key) {
                    <td class="py-1 text-right">{{ row.metrics[key] | money }}</td>
                  }
                </tr>
              }
              <tr
                class="border-t border-slate-50 bg-slate-50/50 text-slate-400 italic"
                [matTooltip]="Labels.AnalyticsUnattributedHint"
              >
                <td></td>
                <td class="py-1 pl-4">{{ Labels.AnalyticsUnattributedRow }}</td>
                @for (key of METRIC_KEYS; track key) {
                  <td class="py-1 text-right">{{ unattributedFor()(bucket)[key] | money }}</td>
                }
              </tr>
            }
          }
          @if (buckets().length === 0) {
            <tr>
              <td [attr.colspan]="METRIC_KEYS.length + 2" class="py-6 text-center text-slate-400">
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
  readonly nameFor = input.required<(key: string) => string>();
  readonly unattributedFor = input.required<(bucket: RevenueBucket) => RevenueMetrics>();

  protected readonly Labels = Labels;
  protected readonly METRIC_KEYS = REVENUE_METRIC_KEYS;
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

  protected bucketLabel(bucket: RevenueBucket): string {
    if (this.granularity() === 'MONTH') {
      return `${bucket.start.getFullYear()}-${String(bucket.start.getMonth() + 1).padStart(2, '0')}`;
    }
    if (toIsoDate(bucket.start) === toIsoDate(bucket.end)) {
      return toIsoDate(bucket.start);
    }
    return `${toIsoDate(bucket.start)} — ${toIsoDate(bucket.end)}`;
  }
}
