import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FixedMoneyPipe, Labels, type PointPeriodResults } from '@bikerental/shared';

@Component({
  selector: 'app-point-results-strip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FixedMoneyPipe],
  template: `
    <div class="flex flex-wrap gap-8 rounded-xl border border-slate-200 bg-white px-4 py-3">
      <div class="flex flex-col">
        <span class="text-sm text-slate-500">{{ labels.PointResultCollections }}</span>
        <span class="text-xl font-semibold tabular-nums">
          {{ results()?.collected | fixedMoney }}
        </span>
      </div>
      <div class="flex flex-col">
        <span class="text-sm text-slate-500">{{ labels.PointResultTerminalSettlements }}</span>
        <span class="text-xl font-semibold tabular-nums">
          {{ results()?.terminalSettled | fixedMoney }}
        </span>
      </div>
    </div>
  `,
})
export class PointResultsStripComponent {
  protected readonly labels = Labels;

  readonly results = input<PointPeriodResults | null>(null);
}
