import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DurationPipe, RentalStore } from '@bikerental/shared';

@Component({
  selector: 'app-rental-period-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, DurationPipe],
  template: `
    <div class="px-4 py-3 flex items-center flex-wrap gap-x-2 gap-y-1 text-sm text-slate-700">
      <span>{{ store.startedAt() | date: 'dd.MM HH:mm' }}</span>
      <span class="text-slate-400">→</span>
      @if (store.expectedReturnAt(); as returnAt) {
        <span [class.text-amber-700]="store.isOverdue()">{{ returnAt | date: 'dd.MM HH:mm' }}</span>
      } @else {
        <span [class.text-amber-700]="store.isOverdue()">—</span>
      }
      <span class="text-slate-400">·</span>
      <span class="inline-flex items-baseline gap-1 whitespace-nowrap">
        <span class="text-slate-500">{{ store.durationMinutes() | duration }}</span>
        @if (store.isActive() && store.isOverdue()) {
          <span class="text-amber-700 font-semibold">{{
            store.overdueMinutes() | duration: 'signed'
          }}</span>
        } @else if (store.durationDeltaMinutes(); as delta) {
          <span
            class="font-semibold"
            [class.text-amber-700]="delta > 0"
            [class.text-emerald-700]="delta < 0"
            >{{ delta | duration: 'signed' }}</span
          >
        }
      </span>
    </div>
  `,
})
export class RentalPeriodSectionComponent {
  protected readonly store = inject(RentalStore);
}
