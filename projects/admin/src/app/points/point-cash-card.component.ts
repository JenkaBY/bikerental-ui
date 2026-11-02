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
import { MatProgressBarModule } from '@angular/material/progress-bar';
import {
  type ActionAvailability,
  FixedMoneyPipe,
  Labels,
  type Money,
  pointShiftCaption,
  type RunningShift,
  type RunningShiftState,
  ShiftBreakdownComponent,
} from '@bikerental/shared';

const OPENED_TIME_FORMAT = 'HH:mm';

@Component({
  selector: 'app-point-cash-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatProgressBarModule, FixedMoneyPipe, ShiftBreakdownComponent],
  template: `
    <section class="rounded-xl border border-slate-200 bg-white p-4 flex flex-col gap-3">
      <h2 class="m-0 text-base font-semibold text-slate-700">{{ labels.PointCashCardTitle }}</h2>
      <div class="text-3xl font-semibold tabular-nums">{{ cash() | fixedMoney }}</div>

      @switch (shiftState()) {
        @case ('loading') {
          <mat-progress-bar mode="indeterminate" />
        }
        @case ('running') {
          @if (shift(); as current) {
            <div class="text-sm text-slate-500">{{ caption() }}</div>
            <app-shift-breakdown [shift]="current" />
          }
        }
        @case ('none') {
          <p class="m-0 text-slate-400">{{ labels.PointShiftNone }}</p>
        }
        @case ('failed') {
          <p class="m-0 text-slate-400">{{ labels.PointShiftLoadFailed }}</p>
        }
      }

      <div class="flex flex-wrap gap-2">
        @if (collection().reason !== 'HIDDEN') {
          <button
            mat-flat-button
            color="primary"
            type="button"
            [disabled]="!collection().enabled"
            (click)="collect.emit()"
          >
            {{ labels.PointCollectCash }}
          </button>
        }
        @if (closeShift().reason !== 'HIDDEN') {
          <button
            mat-flat-button
            type="button"
            class="btn-utility"
            [disabled]="!closeShift().enabled"
            (click)="closeShiftRequested.emit()"
          >
            {{ labels.PointCloseShift }}
          </button>
        }
      </div>
      @if (collection().reason === 'POINT_NOT_ACTIVE') {
        <p class="m-0 text-xs text-slate-500">{{ labels.PointCollectionNotActiveHint }}</p>
      }
    </section>
  `,
})
export class PointCashCardComponent {
  private readonly locale = inject(LOCALE_ID);

  protected readonly labels = Labels;

  readonly cash = input<Money | null>(null);
  readonly shift = input<RunningShift | null>(null);
  readonly shiftState = input.required<RunningShiftState>();
  readonly collection = input.required<ActionAvailability>();
  readonly closeShift = input.required<ActionAvailability>();

  readonly collect = output<void>();
  readonly closeShiftRequested = output<void>();

  protected readonly caption = computed(() => {
    const current = this.shift();
    if (!current) return '';
    return pointShiftCaption(
      current.sequence,
      formatDate(current.openedAt, OPENED_TIME_FORMAT, this.locale),
    );
  });
}
