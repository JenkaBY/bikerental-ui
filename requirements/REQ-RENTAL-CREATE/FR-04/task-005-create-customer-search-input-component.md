# Task 005: Create `CustomerSearchInputComponent` (Smart)

> **Applied Skill:** `angular-component`, `angular-signals` — Smart component owning the phone-number `MatAutocomplete`. Delegates all search logic (debounce, deduplication, minimum-length guard) to the component-scoped `CustomerListStore` instance. The component's constructor subscribes to `phoneControl.valueChanges` and calls `store.search()` — no manual `debounceTime`/`switchMap` pipeline in the component. The "Create new customer" option is a `mat-option` with a sentinel value; selecting it reveals `CustomerCreateInlineFormComponent` below the field.

> **⚠️ Dependency:** Requires **task-001** (`CustomerListStore` in shared) to be completed first.

## 1. Objective

Create a smart standalone component that:

1. Renders a `type="tel"` phone input with `MatAutocomplete`.
2. Passes every `phoneControl.valueChanges` string directly to `customerListStore.search()`. The store handles 300 ms debounce and the 4-character minimum internally.
3. Exposes `searchResults` as an alias for `customerListStore.customers` — no local mapping needed.
4. When results are empty and ≥ 4 chars are typed, shows a "Create new customer" `mat-option` as the last option.
5. Selecting an existing customer emits `customerSelected`; selecting the sentinel option shows `CustomerCreateInlineFormComponent` below the field.
6. When `CustomerCreateInlineFormComponent` emits `customerCreated`, the component emits `customerSelected` with the new customer.
7. Accepts `initialPhone = input<string>('')`; on `ngOnInit`, if non-empty, sets the control value without emitting.

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/rental-create/step1/customer-search-input.component.ts`
* **Action:** Create New File

## 3. Code Implementation

**Imports Required:**

```typescript
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
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { Customer, CustomerListStore, Labels } from '@bikerental/shared';
import { CustomerSearchOptionComponent } from './customer-search-option.component';
import { CustomerCreateInlineFormComponent } from './customer-create-inline-form.component';
```

**Code to Add/Replace:**

* **Location:** Create a new file from scratch.
* **Snippet:**

```typescript
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
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
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
```

> **Design note on search delegation:** The component's constructor pipe has no `debounceTime`, `switchMap`, or minimum-length filter — those live entirely inside `CustomerListStore._debouncedQuery`. The component calls `store.search(value)` on every `valueChanges` emission (after the string type-guard). This keeps the component thin and makes the search strategy independently testable.

> **Design note on "Create new customer" placement:** `CustomerCreateInlineFormComponent` is rendered below the autocomplete field, not inside the `mat-autocomplete` panel. Selecting the sentinel `mat-option` closes the panel naturally and sets `showCreateForm = true`. Embedding interactive form content inside a `mat-autocomplete` panel is unsupported in Angular Material and causes focus management issues.

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx ng build operator --configuration=development
```
