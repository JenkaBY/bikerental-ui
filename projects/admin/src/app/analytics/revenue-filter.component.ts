import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonToggleChange, MatButtonToggleModule } from '@angular/material/button-toggle';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerInputEvent, MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  Labels,
  REVENUE_GRANULARITIES,
  REVENUE_GRANULARITY_LABELS,
  type RevenueGranularity,
} from '@bikerental/shared';

export interface RevenueFilterValue {
  from: Date;
  to: Date;
  granularity: RevenueGranularity;
}

@Component({
  selector: 'app-revenue-filter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideNativeDateAdapter()],
  imports: [MatFormFieldModule, MatInputModule, MatDatepickerModule, MatButtonToggleModule],
  template: `
    <div class="flex flex-wrap items-center gap-3">
      <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-40">
        <mat-label>{{ Labels.CustomerRentalsFilterFrom }}</mat-label>
        <input
          matInput
          [matDatepicker]="fromPicker"
          [value]="value().from"
          [max]="value().to"
          (dateChange)="onFrom($event)"
        />
        <mat-datepicker-toggle matIconSuffix [for]="fromPicker" />
        <mat-datepicker #fromPicker />
      </mat-form-field>

      <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-40">
        <mat-label>{{ Labels.CustomerRentalsFilterTo }}</mat-label>
        <input
          matInput
          [matDatepicker]="toPicker"
          [value]="value().to"
          [min]="value().from"
          (dateChange)="onTo($event)"
        />
        <mat-datepicker-toggle matIconSuffix [for]="toPicker" />
        <mat-datepicker #toPicker />
      </mat-form-field>

      <mat-button-toggle-group
        [value]="value().granularity"
        (change)="onGranularity($event)"
        [attr.aria-label]="Labels.AnalyticsGranularityLabel"
      >
        @for (g of GRANULARITIES; track g) {
          <mat-button-toggle [value]="g">{{ GRANULARITY_LABELS[g] }}</mat-button-toggle>
        }
      </mat-button-toggle-group>

      <ng-content select="[dimension-filter]" />
    </div>
  `,
})
export class RevenueFilterComponent {
  readonly value = input.required<RevenueFilterValue>();
  readonly filterChange = output<RevenueFilterValue>();

  protected readonly Labels = Labels;
  protected readonly GRANULARITIES = REVENUE_GRANULARITIES;
  protected readonly GRANULARITY_LABELS = REVENUE_GRANULARITY_LABELS;

  protected onFrom(event: MatDatepickerInputEvent<Date>): void {
    if (!event.value) return;
    this.filterChange.emit({ ...this.value(), from: event.value });
  }

  protected onTo(event: MatDatepickerInputEvent<Date>): void {
    if (!event.value) return;
    this.filterChange.emit({ ...this.value(), to: event.value });
  }

  protected onGranularity(event: MatButtonToggleChange): void {
    this.filterChange.emit({ ...this.value(), granularity: event.value as RevenueGranularity });
  }
}
