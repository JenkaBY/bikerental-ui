import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  Labels,
  MoneyPipe,
  REVENUE_METRIC_META,
  type CustomerEquipmentTypeRow,
  type RevenueMetricKey,
} from '@bikerental/shared';

@Component({
  selector: 'app-customer-equipment-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, MatTooltipModule, MoneyPipe],
  template: `
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-left text-xs text-slate-400 border-b border-slate-200">
            <th class="font-normal py-1.5 w-8"></th>
            <th class="font-normal py-1.5">{{ Labels.AnalyticsDimensionColumnEquipmentType }}</th>
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
          @for (type of types(); track type.equipmentTypeSlug) {
            <tr
              class="border-t border-slate-100 hover:bg-slate-50 cursor-pointer"
              (click)="toggle(type.equipmentTypeSlug)"
            >
              <td class="py-1.5">
                <mat-icon class="!text-base">{{
                  isExpanded(type.equipmentTypeSlug) ? 'expand_less' : 'expand_more'
                }}</mat-icon>
              </td>
              <td class="py-1.5 font-medium">{{ typeNameFor()(type.equipmentTypeSlug) }}</td>
              @for (key of metricKeys(); track key) {
                <td class="py-1.5 text-right">{{ type.metrics[key] | money }}</td>
              }
            </tr>
            @if (isExpanded(type.equipmentTypeSlug)) {
              <tr class="text-[10px] uppercase tracking-wide text-slate-400">
                <td></td>
                <td class="pl-4">{{ Labels.AnalyticsDimensionColumnEquipmentUnit }}</td>
                @for (key of metricKeys(); track key) {
                  <td></td>
                }
              </tr>
              @for (unit of type.units; track unit.equipmentId) {
                <tr class="border-t border-slate-50 bg-slate-50/50 text-slate-600">
                  <td></td>
                  <td class="py-1 pl-4">{{ unitNameFor()(unit.equipmentId) }}</td>
                  @for (key of metricKeys(); track key) {
                    <td class="py-1 text-right">{{ unit.metrics[key] | money }}</td>
                  }
                </tr>
              }
            }
          }
        </tbody>
      </table>
    </div>
  `,
})
export class CustomerEquipmentTableComponent {
  readonly types = input.required<readonly CustomerEquipmentTypeRow[]>();
  readonly metricKeys = input.required<readonly RevenueMetricKey[]>();
  readonly typeNameFor = input.required<(slug: string) => string>();
  readonly unitNameFor = input.required<(id: string) => string>();

  protected readonly Labels = Labels;
  protected readonly REVENUE_METRIC_META = REVENUE_METRIC_META;

  private readonly expanded = signal<ReadonlySet<string>>(new Set());

  protected isExpanded(slug: string): boolean {
    return this.expanded().has(slug);
  }

  protected toggle(slug: string): void {
    this.expanded.update((current) => {
      const next = new Set(current);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }
}
