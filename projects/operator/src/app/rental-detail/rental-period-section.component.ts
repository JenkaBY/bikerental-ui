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
      <span class="text-slate-500">{{ store.durationMinutes() | duration }}</span>
    </div>
  `,
})
export class RentalPeriodSectionComponent {
  protected readonly store = inject(RentalStore);
}
