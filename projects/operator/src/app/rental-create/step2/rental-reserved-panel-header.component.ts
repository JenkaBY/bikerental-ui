import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatIconModule } from '@angular/material/icon';
import type { Money } from '@ui-models';
import { Labels, MoneyPipe } from '@bikerental/shared';

@Component({
  selector: 'app-rental-reserved-panel-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatBadgeModule, MatIconModule, MoneyPipe],
  template: `
    <button
      type="button"
      class="w-full text-left flex items-center gap-2 px-3 py-3"
      [attr.aria-expanded]="expanded()"
      (click)="toggled.emit()"
    >
      <mat-icon
        class="shrink-0 text-slate-500 reserved-badge-icon"
        aria-hidden="true"
        [matBadge]="count()"
        matBadgeSize="small"
        matBadgeOverlap="true"
      >
        receipt_long
      </mat-icon>

      <span class="flex-1 min-w-0 text-sm text-slate-900">
        <span class="font-semibold">{{ Labels.CustomerBalanceReserved }}</span>
        <span class="ml-1">{{ reserved() | money }}</span>
      </span>

      <mat-icon class="text-slate-400 shrink-0" aria-hidden="true">{{
        expanded() ? 'expand_less' : 'expand_more'
      }}</mat-icon>
    </button>
  `,
  styles: `
    .reserved-badge-icon .mat-badge-content {
      background-color: #64748b;
      color: #fff;
    }
  `,
})
export class RentalReservedPanelHeaderComponent {
  readonly expanded = input<boolean>(false);
  readonly count = input<number>(0);
  readonly reserved = input<Money | null>(null);

  readonly toggled = output<void>();

  protected readonly Labels = Labels;
}
