import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerInputEvent, MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Labels } from '../../../../../constant/labels';

export interface RentalDateRange {
  from?: Date;
  to?: Date;
}

@Component({
  selector: 'app-rental-date-range-filter',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideNativeDateAdapter()],
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <div class="flex flex-col gap-2">
      <button
        type="button"
        mat-button
        class="!self-start !min-w-0 !px-2 !text-slate-600"
        (click)="expanded.set(!expanded())"
        [attr.aria-expanded]="expanded()"
        aria-controls="rental-date-range-fields"
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
        <div id="rental-date-range-fields" class="flex items-center gap-2">
          <mat-form-field
            appearance="outline"
            subscriptSizing="dynamic"
            class="flex-1 compact-field"
            style="--mat-form-field-container-height: 40px; --mat-form-field-container-vertical-padding: 8px"
          >
            <input
              matInput
              [placeholder]="Labels.CustomerRentalsFilterFrom"
              [matDatepicker]="fromPicker"
              [value]="from() ?? null"
              [max]="to() ?? null"
              (dateChange)="onFrom($event)"
            />
            <mat-datepicker-toggle matIconSuffix [for]="fromPicker" />
            <mat-datepicker #fromPicker />
          </mat-form-field>

          <mat-form-field
            appearance="outline"
            subscriptSizing="dynamic"
            class="flex-1 compact-field"
            style="--mat-form-field-container-height: 40px; --mat-form-field-container-vertical-padding: 8px"
          >
            <input
              matInput
              [placeholder]="Labels.CustomerRentalsFilterTo"
              [matDatepicker]="toPicker"
              [value]="to() ?? null"
              [min]="from() ?? null"
              (dateChange)="onTo($event)"
            />
            <mat-datepicker-toggle matIconSuffix [for]="toPicker" />
            <mat-datepicker #toPicker />
          </mat-form-field>

          @if (hasFilter()) {
            <button
              mat-icon-button
              type="button"
              (click)="clear.emit()"
              [attr.aria-label]="Labels.CustomerRentalsFilterClear"
            >
              <mat-icon>close</mat-icon>
            </button>
          }
        </div>
      }
    </div>
  `,
})
export class RentalDateRangeFilterComponent {
  readonly from = input<Date | undefined>();
  readonly to = input<Date | undefined>();

  readonly rangeChange = output<RentalDateRange>();
  readonly clear = output<void>();

  protected readonly Labels = Labels;
  protected readonly expanded = signal(false);
  protected readonly hasFilter = computed(() => !!(this.from() || this.to()));

  protected onFrom(event: MatDatepickerInputEvent<Date>): void {
    this.rangeChange.emit({ from: event.value ?? undefined, to: this.to() });
  }

  protected onTo(event: MatDatepickerInputEvent<Date>): void {
    this.rangeChange.emit({ from: this.from(), to: event.value ?? undefined });
  }
}
