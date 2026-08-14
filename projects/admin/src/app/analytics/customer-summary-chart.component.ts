import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import type { EChartsCoreOption } from 'echarts/core';
import {
  bucketAxisLabel,
  Labels,
  REVENUE_METRIC_META,
  type CustomerSummaryBucket,
  type RevenueGranularity,
  type RevenueMetricKey,
} from '@bikerental/shared';
import { echarts } from './echarts-setup';

@Component({
  selector: 'app-customer-summary-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideEchartsCore({ echarts })],
  imports: [NgxEchartsDirective],
  template: ` <div echarts [options]="chartOption()" class="w-full h-96"></div> `,
})
export class CustomerSummaryChartComponent {
  readonly buckets = input.required<readonly CustomerSummaryBucket[]>();
  readonly granularity = input.required<RevenueGranularity>();
  readonly metric = input.required<RevenueMetricKey>();

  protected readonly chartOption = computed<EChartsCoreOption>(() => {
    const buckets = this.buckets();
    const metric = this.metric();
    const granularity = this.granularity();
    const categories = buckets.map((bucket) => bucketAxisLabel(bucket.start, granularity));

    return {
      tooltip: { trigger: 'axis' },
      legend: { type: 'scroll', top: 0 },
      grid: {
        left: 56,
        right: 56,
        top: 40,
        bottom: categories.length > 20 ? 64 : 32,
      },
      dataZoom:
        categories.length > 20
          ? [{ type: 'inside' }, { type: 'slider', height: 18, bottom: 12, left: 64, right: 64 }]
          : undefined,
      xAxis: { type: 'category', data: categories },
      yAxis: [
        { type: 'value', name: REVENUE_METRIC_META[metric].label },
        { type: 'value', name: Labels.AnalyticsActiveCustomersSeriesLabel },
      ],
      series: [
        {
          name: REVENUE_METRIC_META[metric].label,
          type: 'bar',
          yAxisIndex: 0,
          data: buckets.map((bucket) => bucket.totals[metric].amount),
        },
        {
          name: Labels.AnalyticsActiveCustomersSeriesLabel,
          type: 'line',
          yAxisIndex: 1,
          data: buckets.map((bucket) => bucket.activeCustomers),
        },
      ],
    };
  });
}
