import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Labels } from '@bikerental/shared';
import type { RentalPriceMode } from '@bikerental/shared';

const PILL_BASE = 'inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium';
const CHEVRON_CLASS = '!text-base !w-4 !h-4 leading-none';

@Component({
  selector: 'app-rental-price-mode-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    @switch (mode()) {
      @case ('DISCOUNT') {
        @if (interactive()) {
          <button
            type="button"
            class="{{ pillBase }} bg-emerald-100 text-emerald-700 border-0 cursor-pointer"
            (click)="pressed.emit()"
          >
            &minus;{{ discountPercent() }}%
            <mat-icon class="{{ chevronClass }}">chevron_right</mat-icon>
          </button>
        } @else {
          <span class="{{ pillBase }} bg-emerald-100 text-emerald-700">
            &minus;{{ discountPercent() }}%
          </span>
        }
      }
      @case ('FIXED') {
        @if (interactive()) {
          <button
            type="button"
            class="{{ pillBase }} bg-indigo-100 text-indigo-700 border-0 cursor-pointer"
            (click)="pressed.emit()"
          >
            {{ Labels.Fixed }}
            <mat-icon class="{{ chevronClass }}">chevron_right</mat-icon>
          </button>
        } @else {
          <span class="{{ pillBase }} bg-indigo-100 text-indigo-700">{{ Labels.Fixed }}</span>
        }
      }
      @case ('FULL') {
        @if (interactive()) {
          <button
            type="button"
            class="{{ pillBase }} bg-slate-100 text-slate-600 border-0 cursor-pointer"
            (click)="pressed.emit()"
          >
            + {{ Labels.ChangePrice }}
            <mat-icon class="{{ chevronClass }}">chevron_right</mat-icon>
          </button>
        }
      }
    }
  `,
})
export class RentalPriceModeBadgeComponent {
  readonly mode = input.required<RentalPriceMode>();
  readonly discountPercent = input<number | null>(null);
  readonly interactive = input(false);
  readonly pressed = output<void>();

  protected readonly Labels = Labels;
  protected readonly pillBase = PILL_BASE;
  protected readonly chevronClass = CHEVRON_CLASS;
}
