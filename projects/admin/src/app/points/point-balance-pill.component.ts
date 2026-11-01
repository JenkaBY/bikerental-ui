import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FixedMoneyPipe, type Money } from '@bikerental/shared';

@Component({
  selector: 'app-point-balance-pill',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FixedMoneyPipe],
  template: `
    <span
      class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800 whitespace-nowrap"
    >
      <span>{{ label() }}</span>
      <span class="font-semibold tabular-nums">{{ amount() | fixedMoney }}</span>
    </span>
  `,
})
export class PointBalancePillComponent {
  readonly label = input.required<string>();
  readonly amount = input<Money | null>(null);
}
