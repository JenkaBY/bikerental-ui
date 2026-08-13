import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import {
  REVENUE_METRIC_GROUP_LABELS,
  REVENUE_METRIC_GROUP_ORDER,
  REVENUE_METRIC_META,
  type RevenueMetricGroup,
  type RevenueMetricKey,
  type RevenueMetrics,
} from '@bikerental/shared';
import { RevenueMetricTileComponent } from './revenue-metric-tile.component';

@Component({
  selector: 'app-revenue-totals',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RevenueMetricTileComponent],
  template: `
    <div class="flex flex-col gap-3">
      @for (group of visibleGroups(); track group) {
        <div>
          <div class="text-xs font-semibold text-slate-500 uppercase mb-1">
            {{ groupLabel(group) }}
          </div>
          <div class="flex flex-wrap gap-2">
            @for (key of keysFor(group); track key) {
              <app-revenue-metric-tile
                [label]="REVENUE_METRIC_META[key].label"
                [hint]="REVENUE_METRIC_META[key].hint"
                [value]="totals()?.[key]"
              />
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class RevenueTotalsComponent {
  readonly totals = input<RevenueMetrics | null>(null);
  readonly metricKeys = input.required<readonly RevenueMetricKey[]>();

  protected readonly groups = REVENUE_METRIC_GROUP_ORDER;
  protected readonly REVENUE_METRIC_META = REVENUE_METRIC_META;

  private readonly keysByGroup = computed<Record<RevenueMetricGroup, RevenueMetricKey[]>>(() => {
    const allowed = this.metricKeys();
    const grouped: Record<RevenueMetricGroup, RevenueMetricKey[]> = {
      revenue: [],
      forgone: [],
      cashMovement: [],
    };
    for (const meta of Object.values(REVENUE_METRIC_META)) {
      if (allowed.includes(meta.key)) grouped[meta.group].push(meta.key);
    }
    return grouped;
  });

  protected readonly visibleGroups = computed(() =>
    this.groups.filter((group) => this.keysFor(group).length > 0),
  );

  protected keysFor(group: RevenueMetricGroup): RevenueMetricKey[] {
    return this.keysByGroup()[group];
  }

  protected groupLabel(group: RevenueMetricGroup): string {
    return REVENUE_METRIC_GROUP_LABELS[group];
  }
}
