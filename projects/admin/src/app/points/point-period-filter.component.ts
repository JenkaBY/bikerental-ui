import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  linkedSignal,
  output,
} from '@angular/core';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  Labels,
  POINT_PERIOD_VIOLATION_MESSAGES,
  type PointPeriod,
  PointPeriodRule,
} from '@bikerental/shared';

@Component({
  selector: 'app-point-period-filter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideNativeDateAdapter()],
  imports: [MatFormFieldModule, MatInputModule, MatDatepickerModule],
  template: `
    <div class="flex flex-col gap-1">
      <div class="flex items-center gap-2">
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-44">
          <mat-label>{{ labels.PointPeriodFrom }}</mat-label>
          <input
            matInput
            [matDatepicker]="fromPicker"
            [value]="from()"
            (dateChange)="onFrom($event.value)"
          />
          <mat-datepicker-toggle matIconSuffix [for]="fromPicker" />
          <mat-datepicker #fromPicker />
        </mat-form-field>
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-44">
          <mat-label>{{ labels.PointPeriodTo }}</mat-label>
          <input
            matInput
            [matDatepicker]="toPicker"
            [value]="to()"
            (dateChange)="onTo($event.value)"
          />
          <mat-datepicker-toggle matIconSuffix [for]="toPicker" />
          <mat-datepicker #toPicker />
        </mat-form-field>
      </div>
      @if (message(); as text) {
        <span class="text-xs text-red-700" role="alert">{{ text }}</span>
      }
    </div>
  `,
})
export class PointPeriodFilterComponent {
  protected readonly labels = Labels;

  readonly period = input.required<PointPeriod>();

  readonly periodChange = output<PointPeriod>();

  protected readonly from = linkedSignal<Date | null>(() => this.period().from);
  protected readonly to = linkedSignal<Date | null>(() => this.period().to);

  protected readonly message = computed(() => {
    const violation = PointPeriodRule.validate(this.from(), this.to());
    return violation ? POINT_PERIOD_VIOLATION_MESSAGES[violation] : null;
  });

  protected onFrom(value: Date | null): void {
    this.from.set(value);
    this.emitIfValid();
  }

  protected onTo(value: Date | null): void {
    this.to.set(value);
    this.emitIfValid();
  }

  private emitIfValid(): void {
    const from = this.from();
    const to = this.to();
    if (from && to && PointPeriodRule.validate(from, to) === null) {
      this.periodChange.emit({ from, to });
    }
  }
}
