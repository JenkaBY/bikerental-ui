import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  Customer,
  CustomerListStore,
  Labels,
  PhoneCharactersOnlyDirective,
} from '@bikerental/shared';
import { CustomerSearchOptionComponent } from './customer-search-option.component';
import { CustomerCreateInlineFormComponent } from './customer-create-inline-form.component';
import { MatIcon } from '@angular/material/icon';

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
    PhoneCharactersOnlyDirective,
    MatIcon,
  ],
  template: `
    <mat-form-field appearance="outline" class="w-full">
      <mat-label>{{ Labels.SearchByPhone }}</mat-label>
      <input
        matInput
        type="tel"
        appPhoneCharactersOnly
        [value]="phoneValue()"
        [matAutocomplete]="auto"
        [matAutocompleteDisabled]="showCreateForm()"
        (input)="onInput($event)"
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
        <mat-option [value]="CREATE_SENTINEL"
          ><mat-icon>add</mat-icon>{{ Labels.CreateCustomer }}</mat-option
        >
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
export class CustomerSearchInputComponent {
  private readonly customerListStore = inject(CustomerListStore);

  readonly initialPhone = input<string>('');
  readonly customerSelected = output<Customer>();

  protected readonly CREATE_SENTINEL = CREATE_SENTINEL;
  protected readonly Labels = Labels;

  protected readonly phoneValue = signal('');
  protected readonly showCreateForm = signal(false);
  protected readonly searchResults = this.customerListStore.customers;

  protected readonly displayWith = (value: Customer | string | null): string => {
    if (!value || value === CREATE_SENTINEL) return this.phoneValue();
    if (typeof value === 'string') return value;
    return value.phone;
  };

  constructor() {
    effect(() => {
      const initial = this.initialPhone();
      if (initial) this.phoneValue.set(initial);
    });
  }

  protected onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.phoneValue.set(value);
    this.customerListStore.search(value);
  }

  protected onOptionSelected(event: MatAutocompleteSelectedEvent): void {
    const value = event.option.value;
    if (value === CREATE_SENTINEL) {
      this.showCreateForm.set(true);
    } else {
      this.showCreateForm.set(false);
      const customer = value as Customer;
      this.phoneValue.set(customer.phone);
      this.customerSelected.emit(customer);
    }
  }

  protected onCustomerCreated(customer: Customer): void {
    this.showCreateForm.set(false);
    this.phoneValue.set(customer.phone);
    this.customerSelected.emit(customer);
  }
}
