import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerInputEvent, MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule, MatSlideToggleChange } from '@angular/material/slide-toggle';
import type { PenaltyStatus } from '@ui-models';
import { Labels, mapPenaltyStatus } from '@bikerental/shared';

export interface DamageReportFilterValue {
  equipmentId?: number;
  rentalId?: number;
  customerId?: string;
  penaltyStatus?: PenaltyStatus;
  from?: Date;
  to?: Date;
}

const PENALTY_STATUSES: PenaltyStatus[] = ['PENDING', 'SETTLED'];

@Component({
  selector: 'app-damage-report-filter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideNativeDateAdapter()],
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
  ],
  template: `
    <div class="flex flex-col gap-2">
      <button
        type="button"
        mat-button
        class="!self-start !min-w-0 !px-2 !text-slate-600"
        (click)="expanded.set(!expanded())"
        [attr.aria-expanded]="expanded()"
        aria-controls="damage-report-filter-fields"
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

      <div class="flex items-center gap-2">
        <mat-slide-toggle [checked]="isOutstandingOnly()" (change)="onOutstandingOnly($event)">
          {{ Labels.DamageReportFilterOutstandingOnly }}
        </mat-slide-toggle>
      </div>

      @if (expanded()) {
        <div id="damage-report-filter-fields" class="flex flex-wrap items-start gap-3">
          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-36">
            <mat-label>{{ Labels.DamageReportFilterEquipmentId }}</mat-label>
            <input
              matInput
              type="number"
              [value]="equipmentId() ?? ''"
              (change)="onEquipmentId($event)"
            />
          </mat-form-field>

          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-36">
            <mat-label>{{ Labels.DamageReportFilterRentalId }}</mat-label>
            <input
              matInput
              type="number"
              [value]="rentalId() ?? ''"
              (change)="onRentalId($event)"
            />
          </mat-form-field>

          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="min-w-64">
            <mat-label>{{ Labels.DamageReportFilterCustomerId }}</mat-label>
            <input matInput [value]="customerId() ?? ''" (change)="onCustomerId($event)" />
          </mat-form-field>

          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="min-w-48">
            <mat-label>{{ Labels.DamageReportFilterPenaltyStatus }}</mat-label>
            <mat-select
              [value]="penaltyStatus() ?? null"
              (selectionChange)="onPenaltyStatus($event.value)"
            >
              <mat-option [value]="null">{{ Labels.All }}</mat-option>
              @for (status of PENALTY_STATUSES; track status) {
                <mat-option [value]="status">{{ statusLabel(status) }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-40">
            <mat-label>{{ Labels.CustomerRentalsFilterFrom }}</mat-label>
            <input
              matInput
              [matDatepicker]="fromPicker"
              [value]="from() ?? null"
              [max]="to() ?? null"
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
              [value]="to() ?? null"
              [min]="from() ?? null"
              (dateChange)="onTo($event)"
            />
            <mat-datepicker-toggle matIconSuffix [for]="toPicker" />
            <mat-datepicker #toPicker />
          </mat-form-field>

          @if (hasFilter()) {
            <button mat-button type="button" class="!self-center" (click)="clearAll()">
              <mat-icon>close</mat-icon>
              {{ Labels.ClearAllFilters }}
            </button>
          }
        </div>
      }
    </div>
  `,
})
export class DamageReportFilterComponent {
  readonly value = input<DamageReportFilterValue>({});
  readonly filterChange = output<DamageReportFilterValue>();

  protected readonly Labels = Labels;
  protected readonly PENALTY_STATUSES = PENALTY_STATUSES;

  protected readonly expanded = signal(false);

  protected readonly equipmentId = computed(() => this.value().equipmentId);
  protected readonly rentalId = computed(() => this.value().rentalId);
  protected readonly customerId = computed(() => this.value().customerId);
  protected readonly penaltyStatus = computed(() => this.value().penaltyStatus);
  protected readonly from = computed(() => this.value().from);
  protected readonly to = computed(() => this.value().to);

  protected readonly isOutstandingOnly = computed(() => this.penaltyStatus() === 'PENDING');

  protected readonly hasFilter = computed(() => {
    const v = this.value();
    return !!(v.equipmentId || v.rentalId || v.customerId || v.penaltyStatus || v.from || v.to);
  });

  protected statusLabel(status: PenaltyStatus): string {
    return mapPenaltyStatus(status).label;
  }

  protected onOutstandingOnly(event: MatSlideToggleChange): void {
    this.emit({ ...this.value(), penaltyStatus: event.checked ? 'PENDING' : undefined });
  }

  protected onEquipmentId(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    const value = raw ? Number(raw) : undefined;
    this.emit({ ...this.value(), equipmentId: value && value > 0 ? value : undefined });
  }

  protected onRentalId(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    const value = raw ? Number(raw) : undefined;
    this.emit({ ...this.value(), rentalId: value && value > 0 ? value : undefined });
  }

  protected onCustomerId(event: Event): void {
    const value = (event.target as HTMLInputElement).value.trim();
    this.emit({ ...this.value(), customerId: value || undefined });
  }

  protected onPenaltyStatus(value: PenaltyStatus | null): void {
    this.emit({ ...this.value(), penaltyStatus: value ?? undefined });
  }

  protected onFrom(event: MatDatepickerInputEvent<Date>): void {
    this.emit({ ...this.value(), from: event.value ?? undefined });
  }

  protected onTo(event: MatDatepickerInputEvent<Date>): void {
    this.emit({ ...this.value(), to: event.value ?? undefined });
  }

  protected clearAll(): void {
    this.emit({});
  }

  private emit(value: DamageReportFilterValue): void {
    this.filterChange.emit(value);
  }
}
