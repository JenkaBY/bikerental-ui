import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { RentalCostBreakdown } from '../../../core/models';
import { Labels } from '../../constant/labels';
import { resolveBreakdownMessage, resolveTariffCodeLabel } from '../../constant/breakdown-messages';

@Component({
  selector: 'app-cost-breakdown',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="flex flex-wrap items-center gap-1 text-xs text-slate-500">
      <span>{{ text() }}</span>
      @if (tariffLabel()) {
        <span class="rounded bg-slate-100 px-1.5 py-0.5 font-medium text-slate-600">{{
          tariffLabel()
        }}</span>
      }
    </span>
  `,
})
export class CostBreakdownComponent {
  readonly breakdown = input<RentalCostBreakdown | null>(null);

  protected readonly text = computed(() => {
    const bd = this.breakdown();
    return bd ? resolveBreakdownMessage(bd) : Labels.NotAvailable;
  });

  protected readonly tariffLabel = computed(() => {
    const bd = this.breakdown();
    return bd ? resolveTariffCodeLabel(bd) : '';
  });
}
