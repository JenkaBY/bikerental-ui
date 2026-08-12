import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MoneyPipe, type Money } from '@bikerental/shared';

@Component({
  selector: 'app-revenue-metric-tile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatTooltipModule, MoneyPipe],
  template: `
    <div
      class="flex flex-col gap-1 rounded border border-slate-200 bg-white px-3 py-2 min-w-40"
      [matTooltip]="hint()"
    >
      <span class="text-xs text-slate-500">{{ label() }}</span>
      <span class="text-lg font-semibold text-slate-800">{{ value() | money }}</span>
    </div>
  `,
})
export class RevenueMetricTileComponent {
  readonly label = input.required<string>();
  readonly hint = input<string>('');
  readonly value = input<Money | undefined>(undefined);
}
