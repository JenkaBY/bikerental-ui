import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { TimeTravelStore } from '../../../core/state/time-travel.store';
import { TimeTravelDialogComponent } from '../time-travel-dialog/time-travel-dialog.component';

@Component({
  selector: 'app-time-travel-display',
  standalone: true,
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="cursor-pointer select-none font-mono tabular-nums text-sm"
      (click)="openDialog()"
    >
      @if (store.serverTime(); as t) {
        {{ t.instant | date: 'dd/MM HH:mm:ss' }}
      } @else {
        --/-- --:--:--
      }
    </button>
  `,
})
export class TimeTravelDisplayComponent {
  protected readonly store = inject(TimeTravelStore);
  private readonly dialog = inject(MatDialog);

  protected openDialog(): void {
    this.dialog.open(TimeTravelDialogComponent);
  }
}
