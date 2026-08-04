import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Labels } from '../../../../../constant/labels';

@Component({
  selector: 'app-penalty-rental-filter',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
  template: `
    <div class="flex flex-col gap-2">
      <button
        type="button"
        mat-button
        class="!self-start !min-w-0 !px-2 !text-slate-600"
        (click)="expanded.set(!expanded())"
        [attr.aria-expanded]="expanded()"
        aria-controls="penalty-rental-filter-fields"
      >
        <mat-icon class="!text-base !w-4 !h-4 align-middle">tune</mat-icon>
        {{ Labels.CustomerRentalsFilterToggle }}
        @if (hasFilter() && !expanded()) {
          <span class="text-xs text-blue-600">({{ Labels.CustomerRentalsFilterActive }})</span>
        }
        <mat-icon class="!text-base !w-4 !h-4 align-middle">{{
          expanded() ? 'expand_less' : 'expand_more'
        }}</mat-icon>
      </button>

      @if (expanded()) {
        <div id="penalty-rental-filter-fields" class="flex items-center gap-2">
          <mat-form-field
            appearance="outline"
            subscriptSizing="dynamic"
            class="flex-1 compact-field"
            style="--mat-form-field-container-height: 40px; --mat-form-field-container-vertical-padding: 8px"
          >
            <input
              matInput
              type="number"
              inputmode="numeric"
              min="1"
              [placeholder]="Labels.CustomerPenaltiesRentalFilter"
              [value]="rentalId() ?? ''"
              (change)="onRentalId($event)"
            />
          </mat-form-field>

          @if (hasFilter()) {
            <button
              mat-icon-button
              type="button"
              (click)="rentalIdChange.emit(undefined)"
              [attr.aria-label]="Labels.CustomerPenaltiesRentalFilterClear"
            >
              <mat-icon>close</mat-icon>
            </button>
          }
        </div>
      }
    </div>
  `,
})
export class PenaltyRentalFilterComponent {
  readonly rentalId = input<number | undefined>();

  readonly rentalIdChange = output<number | undefined>();

  protected readonly Labels = Labels;
  protected readonly expanded = signal(false);
  protected readonly hasFilter = computed(() => this.rentalId() !== undefined);

  constructor() {
    effect(() => {
      if (this.hasFilter()) this.expanded.set(true);
    });
  }

  protected onRentalId(event: Event): void {
    const raw = (event.target as HTMLInputElement).value.trim();
    const value = raw ? Number(raw) : NaN;
    this.rentalIdChange.emit(Number.isInteger(value) && value > 0 ? value : undefined);
  }
}
