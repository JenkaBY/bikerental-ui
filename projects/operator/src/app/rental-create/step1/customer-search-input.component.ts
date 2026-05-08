import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { Customer, CustomerListStore, Labels } from '@bikerental/shared';
import { CustomerSearchOptionComponent } from './customer-search-option.component';
import { CustomerCreateInlineFormComponent } from './customer-create-inline-form.component';

const MIN_SEARCH_LENGTH = 4;
const CREATE_SENTINEL = '__create__';

@Component({
  selector: 'app-customer-search-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CustomerListStore],
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    CustomerSearchOptionComponent,
    CustomerCreateInlineFormComponent,
  ],
  template: `
    <mat-form-field appearance="outline" class="w-full">
      <mat-label>{{ Labels.Phone }}</mat-label>
      <input
        matInput
        type="tel"
        [formControl]="phoneControl"
        [matAutocomplete]="auto"
        [matAutocompleteDisabled]="showCreateForm()"
      />
      <mat-autocomplete
        #auto="matAutocomplete"
        [displayWith]="displayWith"
        (optionSelected)="onOptionSelected($event)"
      >
        @for (customer of searchResults(); track customer.id) {
          <mat-option [value]="customer">
            <app-customer-search-option [customer]="customer" />
          </mat-option>
        }
        @if (showCreateOption()) {
          <mat-option [value]="CREATE_SENTINEL">{{ Labels.CreateCustomer }}</mat-option>
        }
      </mat-autocomplete>
    </mat-form-field>

    @if (showCreateForm()) {
      <app-customer-create-inline-form
        [phone]="phoneValue()"
        (customerCreated)="onCustomerCreated($event)"
      />
    }
  `,
})
export class CustomerSearchInputComponent implements OnInit {
  private readonly customerListStore = inject(CustomerListStore);
  private readonly destroyRef = inject(DestroyRef);

  readonly initialPhone = input<string>('');
  readonly customerSelected = output<Customer>();

  protected readonly CREATE_SENTINEL = CREATE_SENTINEL;
  protected readonly Labels = Labels;
  protected readonly phoneControl = new FormControl<string>('', { nonNullable: true });
  protected readonly showCreateForm = signal(false);

  protected readonly phoneValue = toSignal(this.phoneControl.valueChanges, { initialValue: '' });
  protected readonly searchResults = this.customerListStore.customers;
  protected readonly loading = this.customerListStore.loading;

  protected readonly showCreateOption = computed(
    () => this.searchResults().length === 0 && this.phoneValue().length >= MIN_SEARCH_LENGTH,
  );

  protected readonly displayWith = (value: Customer | string | null): string => {
    if (!value || value === CREATE_SENTINEL) return this.phoneValue();
    if (typeof value === 'string') return value;
    return value.phone;
  };

  constructor() {
    this.phoneControl.valueChanges
      .pipe(
        filter((v): v is string => typeof v === 'string'),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((value) => this.customerListStore.search(value));
  }

  ngOnInit(): void {
    const initial = this.initialPhone();
    if (initial.length > 0) {
      this.phoneControl.setValue(initial, { emitEvent: false });
    }
  }

  protected onOptionSelected(event: MatAutocompleteSelectedEvent): void {
    const value = event.option.value;
    if (value === CREATE_SENTINEL) {
      this.showCreateForm.set(true);
      this.phoneControl.setValue(this.phoneValue(), { emitEvent: false });
    } else {
      this.showCreateForm.set(false);
      const customer = value as Customer;
      this.phoneControl.setValue(customer.phone, { emitEvent: false });
      this.customerSelected.emit(customer);
    }
  }

  protected onCustomerCreated(customer: Customer): void {
    this.showCreateForm.set(false);
    this.customerSelected.emit(customer);
  }
}
