import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FixedMoneyPipe, Labels, type Money } from '@bikerental/shared';

@Component({
  selector: 'app-point-bank-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FixedMoneyPipe],
  template: `
    <section class="rounded-xl border border-slate-200 bg-white p-4 flex flex-col gap-3">
      <h2 class="m-0 text-base font-semibold text-slate-700">
        {{ labels.PointBankCardTitle }}
      </h2>
      <div class="text-3xl font-semibold tabular-nums">{{ bank() | fixedMoney }}</div>
    </section>
  `,
})
export class PointBankCardComponent {
  protected readonly labels = Labels;

  readonly bank = input.required<Money | null>();
}
