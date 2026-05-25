import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { TimeTravelDialogComponent } from '../time-travel-dialog/time-travel-dialog.component';
import { TIME_TRAVEL_STORE_TOKEN } from '../../../core/state/time-travel-store.token';

@Component({
  selector: 'app-time-travel-display',
  standalone: true,
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col justify-center">
      <button
        type="button"
        class="cursor-pointer select-none font-mono tabular-nums text-sm"
        (click)="openDialog()"
      >
        @if (store?.serverTime(); as serverTime) {
          {{ serverTime | date: 'dd/MM HH:mm:ss' }}
        } @else {
          --/-- --:--:--
        }
      </button>
      <span class="text-xs">Time Travel {{ isTimeChanged() ? 'ON' : 'off' }}</span>
    </div>
  `,
})
export class TimeTravelDisplayComponent {
  private readonly dialog = inject(MatDialog);
  protected readonly store = inject(TIME_TRAVEL_STORE_TOKEN, { optional: true });
  protected readonly isTimeChanged = computed(() => !!this.store?.uiTime?.());

  protected openDialog(): void {
    this.dialog.open(TimeTravelDialogComponent);
  }
}
