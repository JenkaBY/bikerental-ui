# Task 004: Write Unit Tests for CustomerCreateDialogComponent

> **Applied Skill:** `angular-testing` — Vitest + TestBed, `vi.fn()` stubs, `MAT_DIALOG_DATA` / `MatDialogRef` value providers, `provideNativeDateAdapter()` for datepicker in tests

## 1. Objective

Create a full Vitest unit test suite for `CustomerCreateDialogComponent` covering: component instantiation, confirm button disabled/enabled state, happy path (dialog closes with new customer id), error path (snackbar shown, dialog stays open), guard against double-submission while loading, and guard against calling the store with an invalid form.

## 2. File to Modify / Create

* **File Path:** `projects/admin/src/app/customers/dialogs/customer-create-dialog/customer-create-dialog.component.spec.ts`
* **Action:** Create New File

## 3. Code Implementation

**Imports Required:**

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideNativeDateAdapter } from '@angular/material/core';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CustomerStore } from '@bikerental/shared';
import { CustomerCreateDialogComponent } from './customer-create-dialog.component';
```

**Code to Add/Replace:**

* **Location:** Full file content — this is a new file.

* **Snippet:**

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideNativeDateAdapter } from '@angular/material/core';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CustomerStore } from '@bikerental/shared';
import { CustomerCreateDialogComponent } from './customer-create-dialog.component';

const VALID_FORM_VALUE = {
  phone: '375291234567',
  firstName: 'John',
  lastName: 'Doe',
  email: '',
  birthDate: null,
  notes: '',
};

const makeStore = () => {
  const saving = signal(false);
  const create = vi.fn().mockImplementation((payload) => {
    saving.set(true);
    return of({
      id: 'cust-new-1',
      phone: payload?.phone ?? '375291234567',
      firstName: payload?.firstName ?? 'John',
      lastName: payload?.lastName ?? 'Doe',
    }).pipe(finalize(() => saving.set(false)));
  });

  return { create, saving };
};

describe('CustomerCreateDialogComponent', () => {
  let fixture: ComponentFixture<CustomerCreateDialogComponent>;
  let component: CustomerCreateDialogComponent;
  let store: ReturnType<typeof makeStore>;
  const dialogClose = vi.fn();
  const snackOpen = vi.fn();

  beforeEach(async () => {
    vi.clearAllMocks();
    store = makeStore();

    await TestBed.configureTestingModule({
      imports: [CustomerCreateDialogComponent],
      providers: [
        provideNativeDateAdapter(),
        { provide: CustomerStore, useValue: store },
        { provide: MatDialogRef, useValue: { close: dialogClose } },
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: MatSnackBar, useValue: { open: snackOpen } },
      ],
    }).compileComponents();

    ```typescript
    import { ComponentFixture, TestBed } from '@angular/core/testing';
    import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
    import { MatSnackBar } from '@angular/material/snack-bar';
    import { provideNativeDateAdapter } from '@angular/material/core';
    import { signal } from '@angular/core';
    import { of, throwError, finalize } from 'rxjs';
    import { beforeEach, describe, expect, it, vi } from 'vitest';
    import { CustomerStore } from '@bikerental/shared';
    import { CustomerCreateDialogComponent } from './customer-create-dialog.component';

    const VALID_FORM_VALUE = {
      phone: '375291234567',
      firstName: 'John',
      lastName: 'Doe',
      email: '',
      birthDate: null,
      notes: '',
    };

    const makeStore = () => {
      const saving = signal(false);
      const create = vi.fn().mockImplementation(() => {
        saving.set(true);
        return of({ id: 'cust-new-1', phone: '375291234567', firstName: 'John', lastName: 'Doe' }).pipe(
          finalize(() => saving.set(false)),
        );
      });

      return { create, saving } as unknown as { create: any; saving: any } & Partial<CustomerStore>;
    };

    describe('CustomerCreateDialogComponent', () => {
      let fixture: ComponentFixture<CustomerCreateDialogComponent>;
      let component: CustomerCreateDialogComponent;
      let store: ReturnType<typeof makeStore>;
      const dialogClose = vi.fn();
      const snackOpen = vi.fn();

      beforeEach(async () => {
        vi.clearAllMocks();
        store = makeStore();

        await TestBed.configureTestingModule({
          imports: [CustomerCreateDialogComponent],
          providers: [
            provideNativeDateAdapter(),
            { provide: CustomerStore, useValue: store },
            { provide: MatDialogRef, useValue: { close: dialogClose } },
            { provide: MAT_DIALOG_DATA, useValue: {} },
            { provide: MatSnackBar, useValue: { open: snackOpen } },
          ],
        }).compileComponents();

        fixture = TestBed.createComponent(CustomerCreateDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
      });

      it('should create', () => {
        expect(component).toBeTruthy();
      });

      it('should render dialog title', () => {
        const title = fixture.nativeElement.querySelector('[mat-dialog-title]');
        expect(title).toBeTruthy();
      });

      it('should have Confirm button disabled when form is invalid on load', () => {
        const button: HTMLButtonElement = fixture.nativeElement.querySelector('button[mat-flat-button]');
        expect(button.disabled).toBe(true);
      });

      it('should enable Confirm button when all required fields are filled', () => {
        component.form.setValue(VALID_FORM_VALUE);
        fixture.detectChanges();

        const button: HTMLButtonElement = fixture.nativeElement.querySelector('button[mat-flat-button]');
        expect(button.disabled).toBe(false);
      });

      it('should keep Confirm button disabled when only phone is missing', () => {
        component.form.setValue({ ...VALID_FORM_VALUE, phone: '' });
        fixture.detectChanges();

        const button: HTMLButtonElement = fixture.nativeElement.querySelector('button[mat-flat-button]');
        expect(button.disabled).toBe(true);
      });

      it('should keep Confirm button disabled when only firstName is missing', () => {
        component.form.setValue({ ...VALID_FORM_VALUE, firstName: '' });
        fixture.detectChanges();

        const button: HTMLButtonElement = fixture.nativeElement.querySelector('button[mat-flat-button]');
        expect(button.disabled).toBe(true);
      });

      it('should keep Confirm button disabled when only lastName is missing', () => {
        component.form.setValue({ ...VALID_FORM_VALUE, lastName: '' });
        fixture.detectChanges();

        const button: HTMLButtonElement = fixture.nativeElement.querySelector('button[mat-flat-button]');
        expect(button.disabled).toBe(true);
      });

      it('should close dialog with new customer id on successful creation', async () => {
        component.form.setValue(VALID_FORM_VALUE);
        component.confirm();
        // wait for async finalize
        await Promise.resolve();

        expect(store.create).toHaveBeenCalledOnce();
        expect(dialogClose).toHaveBeenCalledWith('cust-new-1');
      });

      it('should call store.create with mapped CustomerWrite', () => {
        component.form.setValue({
          phone: '375291234567',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          birthDate: null,
          notes: 'VIP',
        });
        component.confirm();

        expect(store.create).toHaveBeenCalledWith({
          phone: '375291234567',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          birthDate: undefined,
          notes: 'VIP',
        });
      });

      it('should omit empty optional string fields when calling store.create', () => {
        component.form.setValue(VALID_FORM_VALUE);
        component.confirm();

        const callArg = store.create.mock.calls[0][0];
        expect(callArg.email).toBeUndefined();
        expect(callArg.notes).toBeUndefined();
      });

      it('should show error snackbar and NOT close dialog on HTTP failure', async () => {
        store.create.mockImplementation(() => {
          store.saving.set(true);
          return throwError(() => new Error('500')).pipe(finalize(() => store.saving.set(false)));
        });
        component.form.setValue(VALID_FORM_VALUE);
        component.confirm();
        await Promise.resolve();

        expect(snackOpen).toHaveBeenCalledOnce();
        expect(dialogClose).not.toHaveBeenCalled();
      });

      it('should reset saving to false after HTTP failure', async () => {
        store.create.mockImplementation(() => {
          store.saving.set(true);
          return throwError(() => new Error('500')).pipe(finalize(() => store.saving.set(false)));
        });
        component.form.setValue(VALID_FORM_VALUE);
        component.confirm();
        await Promise.resolve();

        expect(store.saving()).toBe(false);
      });

      it('should NOT call store.create when form is invalid', () => {
        component.confirm();
        expect(store.create).not.toHaveBeenCalled();
      });

      it('should NOT call store.create when already saving', () => {
        store.saving.set(true);
        component.confirm();
        expect(store.create).not.toHaveBeenCalled();
      });
    });

## 4. Validator Unit Tests

Add unit tests for the two validators used by the dialog: the phone pattern validator and the birth-date-in-the-past validator. Place these specs next to the validator implementations under the shared project.

### 4a. Phone validator spec

* **File:** `
    projects / shared / src / shared / validators / phone - validators.spec.ts`

* **Purpose:** Verify that `
    phonePatternValidator()` accepts valid phone strings, rejects invalid ones, and treats empty values as valid (requiredness is tested separately).

* **Example test:**

```
    typescript
    import { FormControl } from '@angular/forms';
    import { describe, it, expect } from 'vitest';
    import { phonePatternValidator } from './phone-validators';

    describe('phonePatternValidator', () => {
      const validator = phonePatternValidator();

      it('accepts common valid phone formats', () => {
        const valid = ['+1 555-123-4567', '375291234567', '(555) 123 4567', '+44 (0)20 1234 5678', '5551234567'];
        valid.forEach(v => expect(validator(new FormControl(v))).toBeNull());
      });

      it('rejects invalid phone strings', () => {
        const invalid = ['abc', '123-abc-456', '+12#345', '++123'];
        invalid.forEach(v => expect(validator(new FormControl(v))).toEqual({ phonePattern: { value: v } }));
      });

      it('treats empty/null/undefined as valid (use Validators.required separately)', () => {
        expect(validator(new FormControl(''))).toBeNull();
        expect(validator(new FormControl(null))).toBeNull();
        expect(validator(new FormControl(undefined))).toBeNull();
      });
    });
```

### 4b. Birth-date-in-the-past validator spec

* **File:** `projects/shared/src/shared/validators/date-validators.spec.ts`

* **Purpose:** Verify that `pastDateValidator()` accepts empty values, accepts dates strictly in the past, and rejects today or future dates with the `{ birthDateFuture: true }` error.

* **Example test:**

```typescript
import { FormControl } from '@angular/forms';
import { describe, it, expect } from 'vitest';
import { pastDateValidator } from './date-validators';

describe('pastDateValidator', () => {
  const validator = pastDateValidator();

  it('returns null for empty values', () => {
    expect(validator(new FormControl(null))).toBeNull();
    expect(validator(new FormControl(''))).toBeNull();
  });

  it('accepts a date strictly in the past', () => {
    const past = new Date();
    past.setDate(past.getDate() - 2);
    expect(validator(new FormControl(past))).toBeNull();
  });

  it('rejects today as invalid', () => {
    const today = new Date();
    expect(validator(new FormControl(today))).toEqual({ birthDateFuture: true });
  });

  it('rejects a future date', () => {
    const future = new Date();
    future.setDate(future.getDate() + 3);
    expect(validator(new FormControl(future))).toEqual({ birthDateFuture: true });
  });

  it('handles ISO date strings', () => {
    const past = new Date();
    past.setDate(past.getDate() - 5);
    expect(validator(new FormControl(past.toISOString()))).toBeNull();
  });
});
```

### 4c. Validation command

Run the shared project tests (or target the validators directory):

```bash
npm test -- --project shared --testPathPattern=projects/shared/src/shared/validators
```

These specs should be created alongside the implementation files. If the validator implementations are not yet present, create them first using the shapes described in the dialog task (see `task-002-create-customer-create-dialog.md`).
