import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { RunningShift } from '../../../core/models';
import { Labels } from '../../constant/labels';
import { FixedMoneyPipe } from '../../pipes/fixed-money.pipe';
import { POINT_MOVEMENT_KIND_LABELS } from '../../point-money.meta';

@Component({
  selector: 'app-shift-breakdown',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FixedMoneyPipe],
  template: `
    <div class="flex flex-col gap-1 text-sm">
      <div class="flex justify-between gap-4">
        <span class="text-slate-600">{{ labels.PointShiftOpening }}</span>
        <span class="tabular-nums">{{ shift().openingAmount | fixedMoney }}</span>
      </div>
      @for (line of shift().kindTotals; track line.kind) {
        <div class="flex justify-between gap-4">
          <span class="text-slate-600">{{ kindLabels[line.kind] }}</span>
          <span
            class="tabular-nums"
            [class.text-emerald-600]="line.signedAmount.amount > 0"
            [class.text-red-700]="line.signedAmount.amount < 0"
          >
            {{ line.signedAmount | fixedMoney: true }}
          </span>
        </div>
      }
      <div
        class="flex justify-between gap-4 border-t border-slate-200 pt-1 font-semibold"
        [class.text-lg]="prominentExpected()"
      >
        <span>{{ labels.PointShiftExpectedCash }}</span>
        <span class="tabular-nums">{{ shift().expectedCash | fixedMoney }}</span>
      </div>
    </div>
  `,
})
export class ShiftBreakdownComponent {
  protected readonly labels = Labels;
  protected readonly kindLabels = POINT_MOVEMENT_KIND_LABELS;

  readonly shift = input.required<RunningShift>();
  readonly prominentExpected = input(false);
}
