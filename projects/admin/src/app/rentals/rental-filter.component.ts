import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  output,
  signal,
} from '@angular/core';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerInputEvent, MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  Customer,
  CustomerListStore,
  Labels,
  mapRentalStatus,
  PhoneCharactersOnlyDirective,
} from '@bikerental/shared';

export interface RentalFilterValue {
  statuses: string[];
  customerId?: string;
  from?: Date;
  to?: Date;
}

const RENTAL_STATUSES = [
  'DRAFT',
  'AWAITING_SIGNATURE',
  'ACTIVE',
  'COMPLETED',
  'CANCELLED',
  'DEBT',
] as const;

@Component({
  selector: 'app-rental-filter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideNativeDateAdapter(), CustomerListStore],
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatIconModule,
    PhoneCharactersOnlyDirective,
  ],
  template: `
    <div class="flex flex-col gap-2">
      <button
        type="button"
        mat-button
        class="!self-start !min-w-0 !px-2 !text-slate-600"
        (click)="expanded.set(!expanded())"
        [attr.aria-expanded]="expanded()"
        aria-controls="rental-filter-fields"
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
        <div id="rental-filter-fields" class="flex flex-wrap items-start gap-3">
          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="min-w-56">
            <mat-label>{{ Labels.Status }}</mat-label>
            <mat-select multiple [value]="statuses()" (selectionChange)="onStatuses($event.value)">
              @for (s of RENTAL_STATUSES; track s) {
                <mat-option [value]="s">{{ statusLabel(s) }}</mat-option>
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

          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="min-w-64">
            <mat-label>{{ Labels.SearchByPhone }}</mat-label>
            <input
              matInput
              type="tel"
              appPhoneCharactersOnly
              [value]="customerPhone()"
              [matAutocomplete]="auto"
              (input)="onCustomerInput($event)"
            />
            <mat-autocomplete
              #auto="matAutocomplete"
              [displayWith]="displayCustomer"
              (optionSelected)="onCustomerSelected($event)"
            >
              @for (c of customerResults(); track c.id) {
                <mat-option [value]="c"
                  >{{ c.phone }} ({{ c.firstName }} {{ c.lastName }})</mat-option
                >
              }
            </mat-autocomplete>
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
export class RentalFilterComponent {
  private readonly customerListStore = inject(CustomerListStore);

  readonly filterChange = output<RentalFilterValue>();

  protected readonly Labels = Labels;
  protected readonly RENTAL_STATUSES = RENTAL_STATUSES;
  protected readonly customerResults = this.customerListStore.customers;

  protected readonly expanded = signal(false);
  protected readonly statuses = signal<string[]>([]);
  protected readonly from = signal<Date | undefined>(undefined);
  protected readonly to = signal<Date | undefined>(undefined);
  protected readonly customerId = signal<string | undefined>(undefined);
  protected readonly customerPhone = signal('');

  protected readonly hasFilter = computed(
    () => this.statuses().length > 0 || !!this.from() || !!this.to() || !!this.customerId(),
  );

  protected readonly displayCustomer = (value: Customer | string | null): string => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return value.phone;
  };

  protected statusLabel(slug: string): string {
    return mapRentalStatus(slug).label;
  }

  protected onStatuses(value: string[]): void {
    this.statuses.set(value);
    this.emit();
  }

  protected onFrom(event: MatDatepickerInputEvent<Date>): void {
    this.from.set(event.value ?? undefined);
    this.emit();
  }

  protected onTo(event: MatDatepickerInputEvent<Date>): void {
    this.to.set(event.value ?? undefined);
    this.emit();
  }

  protected onCustomerInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.customerPhone.set(value);
    this.customerListStore.search(value);
    if (this.customerId()) {
      this.customerId.set(undefined);
      this.emit();
    }
  }

  protected onCustomerSelected(event: MatAutocompleteSelectedEvent): void {
    const customer = event.option.value as Customer;
    this.customerPhone.set(customer.phone);
    this.customerId.set(customer.id);
    this.emit();
  }

  protected clearAll(): void {
    this.statuses.set([]);
    this.from.set(undefined);
    this.to.set(undefined);
    this.customerId.set(undefined);
    this.customerPhone.set('');
    this.customerListStore.search(null);
    this.emit();
  }

  private emit(): void {
    this.filterChange.emit({
      statuses: this.statuses(),
      customerId: this.customerId(),
      from: this.from(),
      to: this.to(),
    });
  }
}
