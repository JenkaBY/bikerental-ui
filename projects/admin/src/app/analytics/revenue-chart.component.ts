import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import type { EChartsCoreOption } from 'echarts/core';
import type { RevenueBucket, RevenueGranularity, RevenueMetricKey } from '@bikerental/shared';
import { toIsoDate } from '@bikerental/shared';
import { echarts } from './echarts-setup';

@Component({
  selector: 'app-revenue-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideEchartsCore({ echarts })],
  imports: [NgxEchartsDirective],
  template: ` <div echarts [options]="chartOption()" class="w-full h-96"></div> `,
})
export class RevenueChartComponent {
  readonly buckets = input.required<readonly RevenueBucket[]>();
  readonly granularity = input.required<RevenueGranularity>();
  readonly metric = input.required<RevenueMetricKey>();
  readonly dimensionKeys = input.required<readonly string[]>();
  readonly nameFor = input.required<(key: string) => string>();

  protected readonly chartOption = computed<EChartsCoreOption>(() => {
    const buckets = this.buckets();
    const metric = this.metric();
    const keys = this.dimensionKeys();
    const granularity = this.granularity();
    const nameFor = this.nameFor();
    const categories = buckets.map((bucket) => this.bucketLabel(bucket, granularity));

    return {
      tooltip: { trigger: 'axis' },
      legend: { type: 'scroll', top: 0 },
      grid: {
        left: 56,
        right: 16,
        top: keys.length > 1 ? 40 : 16,
        bottom: categories.length > 20 ? 64 : 32,
      },
      dataZoom:
        categories.length > 20
          ? [{ type: 'inside' }, { type: 'slider', height: 18, bottom: 12, left: 64, right: 40 }]
          : undefined,
      xAxis: { type: 'category', data: categories },
      yAxis: { type: 'value' },
      series: keys.map((key) => ({
        name: nameFor(key),
        type: 'bar',
        data: buckets.map(
          (bucket) => bucket.rows.find((row) => row.key === key)?.metrics[metric].amount ?? 0,
        ),
      })),
    };
  });

  private bucketLabel(bucket: RevenueBucket, granularity: RevenueGranularity): string {
    if (granularity === 'MONTH') {
      return `${bucket.start.getFullYear()}-${String(bucket.start.getMonth() + 1).padStart(2, '0')}`;
    }
    return toIsoDate(bucket.start);
  }
}
