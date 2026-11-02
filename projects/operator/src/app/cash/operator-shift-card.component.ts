import { formatDate } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  LOCALE_ID,
  output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  type ActionAvailability,
  Labels,
  pointShiftCaption,
  type RunningShift,
  ShiftBreakdownComponent,
} from '@bikerental/shared';

const OPENED_TIME_FORMAT = 'HH:mm';

@Component({
  selector: 'app-operator-shift-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, ShiftBreakdownComponent],
  template: `
    <section class="rounded-xl border border-slate-200 bg-white p-4 flex flex-col gap-4">
      <div class="text-sm text-slate-500">{{ caption() }}</div>
      <app-shift-breakdown [shift]="shift()" [prominentExpected]="true" />

      <div class="flex flex-col gap-3">
        @if (collection().reason !== 'HIDDEN') {
          <button
            mat-flat-button
            color="primary"
            type="button"
            class="!h-12 w-full"
            [disabled]="!collection().enabled"
            (click)="handIn.emit()"
          >
            {{ labels.OperatorHandInCash }}
          </button>
        }
        @if (collection().reason === 'POINT_NOT_ACTIVE') {
          <p class="m-0 text-sm text-slate-500">{{ labels.PointCollectionNotActiveHint }}</p>
        }
        @if (closeShift().reason !== 'HIDDEN') {
          <button
            mat-flat-button
            type="button"
            class="btn-utility !h-12 w-full"
            [disabled]="!closeShift().enabled"
            (click)="closeShiftRequested.emit()"
          >
            {{ labels.PointCloseShift }}
          </button>
        }
      </div>
    </section>
  `,
})
export class OperatorShiftCardComponent {
  private readonly locale = inject(LOCALE_ID);

  protected readonly labels = Labels;

  readonly shift = input.required<RunningShift>();
  readonly collection = input.required<ActionAvailability>();
  readonly closeShift = input.required<ActionAvailability>();

  readonly handIn = output<void>();
  readonly closeShiftRequested = output<void>();

  protected readonly caption = computed(() => {
    const current = this.shift();
    return pointShiftCaption(
      current.sequence,
      formatDate(current.openedAt, OPENED_TIME_FORMAT, this.locale),
    );
  });
}
