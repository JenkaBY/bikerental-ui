import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { RentalCostBreakdown } from '../../../core/models';
import { Labels } from '../../constant/labels';
import { resolveBreakdownMessage } from '../../constant/breakdown-messages';

@Component({
  selector: 'app-cost-breakdown',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <span class="text-xs text-slate-500">{{ text() }}</span> `,
})
export class CostBreakdownComponent {
  readonly breakdown = input<RentalCostBreakdown | null>(null);

  protected readonly text = computed(() => {
    const bd = this.breakdown();
    return bd ? resolveBreakdownMessage(bd) : Labels.NotAvailable;
  });
}
