# Task 004: Create `CustomerCreateInlineFormComponent` (Smart)

> **Applied Skill:** `angular-component`, `angular-forms` — Smart component that reuses `CustomerFormProvider` from shared for form state, validation, and payload building. `CustomerFormProvider` is declared in `providers` alongside `CustomerStore`. The phone field is patched into the provider's form on init and disabled (excluded from validation); `firstName` and `lastName` are the only editable fields shown. `CustomerStore.saving` drives the disabled state of the submit button.

## 1. Objective

Create a smart standalone component that renders an inline create-customer form:

- `phone` input is patched into `CustomerFormProvider.form.controls.phone` on init, then disabled (read-only display only, not validated).
- `firstName` and `lastName` are bound to `CustomerFormProvider.form` controls and validated via `formProvider.isValid`.
- On submit, calls `CustomerStore.create(formProvider.getCustomerWrite())` — the `CustomerWrite` payload (including phone) is built entirely by `CustomerFormProvider`.
- On success, emits `customerCreated` with the returned `Customer`.
- On error, opens a snackbar with `Labels.CustomerCreateError`.
- The submit button is disabled while `customerStore.saving()` is `true`.

> **`providers: [CustomerStore, CustomerFormProvider]`** — both are declared at component level. `CustomerStore` scopes the create operation; `CustomerFormProvider` provides the reactive form instance.

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/rental-create/step1/customer-create-inline-form.component.ts`
* **Action:** Create New File

## 3. Code Implementation

**Imports Required:**

```typescript
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  OnInit,
  output,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  Customer,
  CustomerFormProvider,
  CustomerStore,
  FormErrorMessages,
  Labels,
} from '@bikerental/shared';
```

**Code to Add/Replace:**

* **Location:** Create a new file from scratch.
* **Snippet:**

```typescript
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  OnInit,
  output,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  Customer,
  CustomerFormProvider,
  CustomerStore,
  FormErrorMessages,
  Labels,
} from '@bikerental/shared';

@Component({
  selector: 'app-customer-create-inline-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CustomerStore, CustomerFormProvider],
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <div class="mt-3 p-3 border border-slate-200 rounded-lg flex flex-col gap-3">
      <mat-form-field appearance="outline" class="w-full">
        <mat-label>{{ Labels.Phone }}</mat-label>
        <input matInput type="tel" [value]="phone()" readonly />
      </mat-form-field>

      <mat-form-field appearance="outline" class="w-full">
        <mat-label>{{ Labels.FirstName }}</mat-label>
        <input matInput [formControl]="formProvider.form.controls.firstName" />
        @if (formProvider.form.controls.firstName.hasError('required')) {
          <mat-error>{{ FormErrorMessages.firstNameRequired }}</mat-error>
        }
      </mat-form-field>

      <mat-form-field appearance="outline" class="w-full">
        <mat-label>{{ Labels.LastName }}</mat-label>
        <input matInput [formControl]="formProvider.form.controls.lastName" />
        @if (formProvider.form.controls.lastName.hasError('required')) {
          <mat-error>{{ FormErrorMessages.lastNameRequired }}</mat-error>
        }
      </mat-form-field>

      <button
        mat-flat-button
        [disabled]="customerStore.saving()"
        (click)="submit()"
      >
        {{ customerStore.saving() ? Labels.Saving : Labels.CreateCustomer }}
      </button>
    </div>
  `,
})
export class CustomerCreateInlineFormComponent implements OnInit {
  protected readonly customerStore = inject(CustomerStore);
  protected readonly formProvider = inject(CustomerFormProvider);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly phone = input.required<string>();
  readonly customerCreated = output<Customer>();

  protected readonly Labels = Labels;
  protected readonly FormErrorMessages = FormErrorMessages;

  ngOnInit(): void {
    this.formProvider.form.controls.phone.setValue(this.phone());
    this.formProvider.form.controls.phone.disable();
  }

  protected submit(): void {
    this.formProvider.form.markAllAsTouched();
    if (!this.formProvider.isValid || this.customerStore.saving()) return;
    this.customerStore
      .create(this.formProvider.getCustomerWrite())
      .pipe(
        catchError(() => {
          this.snackBar.open(Labels.CustomerCreateError, Labels.Close, { duration: 4000 });
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((customer) => this.customerCreated.emit(customer));
  }
}
```

> **Why `phone` is not a form input in the template:** The phone display uses `[value]="phone()"` bound directly to the signal — it is purely for display. The actual phone value enters the payload via `formProvider.form.controls.phone.setValue(this.phone())` in `ngOnInit`, after which the control is disabled (so Angular excludes it from `form.valid` but `getRawValue()` still returns it for `getCustomerWrite()`).

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx ng build operator --configuration=development
```
