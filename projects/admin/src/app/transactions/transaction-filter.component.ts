import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
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
  LedgerType,
  mapLedgerType,
  PhoneCharactersOnlyDirective,
} from '@bikerental/shared';

export interface TransactionFilterValue {
  ledgerTypes: LedgerType[];
  customerId?: string;
  sourceId?: string;
  from?: Date;
  to?: Date;
}

const LEDGER_TYPES: LedgerType[] = [
  'CASH',
  'CARD_TERMINAL',
  'BANK_TRANSFER',
  'REVENUE',
  'ADJUSTMENT',
  'CUSTOMER_WALLET',
  'CUSTOMER_HOLD',
];

@Component({
  selector: 'app-transaction-filter',
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
        aria-controls="transaction-filter-fields"
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
        <div id="transaction-filter-fields" class="flex flex-wrap items-start gap-3">
          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="min-w-56">
            <mat-label>{{ Labels.TransactionFilterLedgerTypes }}</mat-label>
            <mat-select
              multiple
              [value]="ledgerTypes()"
              (selectionChange)="onLedgerTypes($event.value)"
            >
              @for (t of LEDGER_TYPES; track t) {
                <mat-option [value]="t">{{ ledgerLabel(t) }}</mat-option>
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

          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-32">
            <mat-label>{{ Labels.TransactionFilterSourceId }}</mat-label>
            <input matInput [value]="sourceId()" (change)="onSourceId($event)" />
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
export class TransactionFilterComponent {
  private readonly customerListStore = inject(CustomerListStore);

  readonly value = input<TransactionFilterValue>({ ledgerTypes: [] });
  readonly filterChange = output<TransactionFilterValue>();

  protected readonly Labels = Labels;
  protected readonly LEDGER_TYPES = LEDGER_TYPES;
  protected readonly customerResults = this.customerListStore.customers;

  protected readonly expanded = signal(false);
  protected readonly customerPhone = signal('');

  protected readonly ledgerTypes = computed(() => this.value().ledgerTypes);
  protected readonly from = computed(() => this.value().from);
  protected readonly to = computed(() => this.value().to);
  protected readonly sourceId = computed(() => this.value().sourceId ?? '');

  protected readonly hasFilter = computed(() => {
    const v = this.value();
    return !!(v.ledgerTypes.length || v.customerId || v.sourceId || v.from || v.to);
  });

  protected readonly displayCustomer = (value: Customer | string | null): string => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return value.phone;
  };

  protected ledgerLabel(type: LedgerType): string {
    return mapLedgerType(type).label;
  }

  protected onLedgerTypes(value: LedgerType[]): void {
    this.emit({ ...this.value(), ledgerTypes: value });
  }

  protected onFrom(event: MatDatepickerInputEvent<Date>): void {
    this.emit({ ...this.value(), from: event.value ?? undefined });
  }

  protected onTo(event: MatDatepickerInputEvent<Date>): void {
    this.emit({ ...this.value(), to: event.value ?? undefined });
  }

  protected onCustomerInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.customerPhone.set(value);
    this.customerListStore.search(value);
    if (this.value().customerId) {
      this.emit({ ...this.value(), customerId: undefined });
    }
  }

  protected onCustomerSelected(event: MatAutocompleteSelectedEvent): void {
    const customer = event.option.value as Customer;
    this.customerPhone.set(customer.phone);
    this.emit({ ...this.value(), customerId: customer.id });
  }

  protected onSourceId(event: Event): void {
    const value = (event.target as HTMLInputElement).value.trim();
    this.emit({ ...this.value(), sourceId: value || undefined });
  }

  protected clearAll(): void {
    this.customerPhone.set('');
    this.customerListStore.search(null);
    this.emit({ ledgerTypes: [] });
  }

  private emit(value: TransactionFilterValue): void {
    this.filterChange.emit(value);
  }
}
