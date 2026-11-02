import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { type ActionAvailability, FixedMoneyPipe, Labels, type Money } from '@bikerental/shared';

@Component({
  selector: 'app-point-terminal-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, FixedMoneyPipe],
  template: `
    <section class="rounded-xl border border-slate-200 bg-white p-4 flex flex-col gap-3">
      <h2 class="m-0 text-base font-semibold text-slate-700">
        {{ labels.PointTerminalCardTitle }}
      </h2>
      <div class="text-3xl font-semibold tabular-nums">{{ terminal() | fixedMoney }}</div>
      <div>
        <button
          mat-flat-button
          color="primary"
          type="button"
          [disabled]="!settlement().enabled"
          (click)="settle.emit()"
        >
          {{ labels.PointRecordSettlement }}
        </button>
      </div>
      @if (settlement().reason === 'POINT_PERMANENTLY_CLOSED') {
        <p class="m-0 text-xs text-slate-500">{{ labels.PointSettlementClosedHint }}</p>
      }
    </section>
  `,
})
export class PointTerminalCardComponent {
  protected readonly labels = Labels;

  readonly terminal = input<Money | null>(null);
  readonly settlement = input.required<ActionAvailability>();

  readonly settle = output<void>();
}
