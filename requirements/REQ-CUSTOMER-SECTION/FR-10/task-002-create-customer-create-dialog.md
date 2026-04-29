# Task 002: Create CustomerCreateDialogComponent

> **Applied Skill:** `angular-component`, `angular-forms` — Standalone component with OnPush, inject(), ReactiveFormsModule, signal-based loading state; dialog pattern matching existing `TopUpDialogComponent`/`WithdrawDialogComponent`

## 1. Objective

Create the `CustomerCreateDialogComponent` — a new Angular Material dialog with a six-field reactive form (phone, firstName, lastName required; email, birthDate, notes optional). On confirmation it calls `CustomerStore.create()`, closes the dialog with the new customer's `id` on success, or shows a `MatSnackBar` error and keeps the dialog open on failure.

## 2. File to Modify / Create

* **File Path:** `projects/admin/src/app/customers/dialogs/customer-create-dialog/customer-create-dialog.component.ts`
* **Action:** Create New File

## 3. Code Implementation

**Imports Required:**

```typescript
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EMPTY } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  CancelButtonComponent,
  CustomerStore,
  FormErrorMessages,
  Labels,
  phonePatternValidator,
  pastDateValidator,
} from '@bikerental/shared';
```

**Code to Add/Replace:**

* **Location:** Full file content — this is a new file.

* **Snippet:**

```typescript
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EMPTY } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  CancelButtonComponent,
  CustomerStore,
  FormErrorMessages,
  Labels,
  phonePatternValidator,
  pastDateValidator,
} from '@bikerental/shared';
```

@Component({
selector: 'app-customer-create-dialog',
changeDetection: ChangeDetectionStrategy.OnPush,
providers: [CustomerStore],
imports: [
ReactiveFormsModule,
MatDialogModule,
MatButtonModule,
MatDatepickerModule,
MatFormFieldModule,
MatInputModule,
CancelButtonComponent,
],
template: `
<h2 mat-dialog-title>{{ Labels.CreateCustomer }}</h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="flex flex-col gap-3 pt-2">
        <mat-form-field appearance="outline">
          <mat-label>{{ Labels.CustomerPhoneLabel }}</mat-label>
          <input matInput formControlName="phone" />
          @if (form.controls.phone.invalid && form.controls.phone.touched) {
            <mat-error>{{ FormErrorMessages.phoneRequired }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ Labels.CustomerFirstNameLabel }}</mat-label>
          <input matInput formControlName="firstName" />
          @if (form.controls.firstName.invalid && form.controls.firstName.touched) {
            <mat-error>{{ FormErrorMessages.firstNameRequired }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ Labels.CustomerLastNameLabel }}</mat-label>
          <input matInput formControlName="lastName" />
          @if (form.controls.lastName.invalid && form.controls.lastName.touched) {
            <mat-error>{{ FormErrorMessages.lastNameRequired }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ Labels.CustomerEmailLabel }}</mat-label>
          <input matInput type="email" formControlName="email" />
          @if (form.controls.email.invalid && form.controls.email.touched) {
            <mat-error>{{ FormErrorMessages.emailInvalid }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ Labels.CustomerBirthDateLabel }}</mat-label>
          <input matInput [matDatepicker]="picker" formControlName="birthDate" />
          <mat-datepicker-toggle matIconSuffix [for]="picker" />
          <mat-datepicker #picker />
          @if (form.controls.birthDate.invalid && form.controls.birthDate.touched) {
            <mat-error>{{ FormErrorMessages.birthDateFuture }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ Labels.CustomerNotesLabel }}</mat-label>
          <textarea matInput formControlName="notes" rows="3"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <app-form-cancel-button></app-form-cancel-button>
      <button
        mat-flat-button
        [disabled]="form.invalid || customerStore.saving()"
        (click)="confirm()"
      >
        {{ Labels.Create }}
      </button>
    </mat-dialog-actions>

`,
})
export class CustomerCreateDialogComponent {
protected readonly Labels = Labels;
protected readonly FormErrorMessages = FormErrorMessages;

private readonly dialogRef =
inject<MatDialogRef<CustomerCreateDialogComponent>>(MatDialogRef);
private readonly customerStore = inject(CustomerStore);
private readonly snackBar = inject(MatSnackBar);
private readonly destroyRef = inject(DestroyRef);

public readonly form = new FormGroup({
phone: new FormControl('', {
nonNullable: true,
validators: [Validators.required, phonePatternValidator()],
}),
firstName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
lastName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
email: new FormControl('', { nonNullable: true, validators: [Validators.email] }),
birthDate: new FormControl<Date | null>(null, [pastDateValidator()]),
notes: new FormControl('', { nonNullable: true }),
});

public confirm(): void {
if (this.form.invalid || this.customerStore.saving()) return;

    const { phone, firstName, lastName, email, birthDate, notes } = this.form.getRawValue();

    this.customerStore
      .create({
        phone,
        firstName,
        lastName,
        email: email || undefined,
        birthDate: birthDate ?? undefined,
        notes: notes || undefined,
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.snackBar.open(Labels.CustomerCreateError, undefined, { duration: 4000 });
          return EMPTY;
        }),
      )
      .subscribe((customer) => {
        this.dialogRef.close(customer.id);
      });

}
}

```

## Validators to Create

Add two new validator files to the shared library and export them from the shared public API so the dialog can import them as shown above.

1) Phone validator

* **File Path:** `projects/shared/src/shared/validators/phone-validators.ts`
* **Action:** Create New File

* **Snippet:**

```typescript
import { Validators } from '@angular/forms';

export const PHONE_PATTERN = /^\+?[0-9\-\s()]+$/;

export const PhoneValidators = [Validators.required, Validators.pattern(PHONE_PATTERN)];

export function phonePatternValidator() {
  return (control) => {
    const v = control.value;
    if (v == null) return null;
    const s = String(v).trim();
    if (s === '') return null; // let required() handle emptiness
    return PHONE_PATTERN.test(s) ? null : { phonePattern: { value: control.value } };
  };
}
```

2) Birth date (past-date) validator

* **File Path:** `projects/shared/src/shared/validators/date-validators.ts`
* **Action:** Create New File

* **Snippet:**

```typescript
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function pastDateValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value == null) return null;
    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) return { birthDateInvalid: true };
    const now = new Date();
    // Treat any date >= today as invalid
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return date < today ? null : { birthDateFuture: true };
  };
}
```

3) Export from shared public API

* **File to Modify:** `projects/shared/src/public-api.ts`
* **Action:** Add the following exports near the other validator exports:

```typescript
export * from './shared/validators/phone-validators';
export * from './shared/validators/date-validators';
```

4) Validation Steps after creating files

```bash
npm run build -- --project shared
npm run build -- --project admin
```

### Notes on key decisions

| Decision                                   | Reason                                                                                                                                                                                               |
|--------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `providers: [CustomerStore]`               | `CustomerStore` is `@Injectable()` without `providedIn`. The dialog is opened from `CustomerListComponent` which has no `CustomerStore` provider, so the dialog scopes its own instance.             |
| `MAT_DIALOG_DATA` injected but unused      | `MatDialog.open()` in the list component passes `{ data: {} }` per the design; the token must be injectable for tests to not throw. The dialog is always create-mode so no data payload is consumed. |
| `Labels.Create` for Confirm button         | Reuses the existing label (`$localize\`Create\``) rather than adding a new one.                                                                                                                      |
| `Validators.email` on optional email field | Empty string passes `Validators.email`, so the field is effectively optional. Only a non-empty value with an invalid email format will fail.                                                         |
| `email                                     |                                                                                                                                                                                                      | undefined` mapping | Prevents sending an empty string to the API for the optional email field. |

## 4. Validation Steps

```bash
npm run build -- --project admin
```
