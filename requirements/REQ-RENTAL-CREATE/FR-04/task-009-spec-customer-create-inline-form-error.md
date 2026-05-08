# Task 009: Error Spec for `CustomerCreateInlineFormComponent`

> **Applied Skill:** `angular-testing` — Error-path tests split into a separate `*.error.spec.ts` file. Both `CustomerStore` and `CustomerFormProvider` are overridden via `TestBed.overrideComponent`. `CustomerStore.create()` returns `throwError(...)`. Assertions verify snackbar is shown, `customerCreated` is NOT emitted.

## 1. Objective

Create the error-path unit test file for `CustomerCreateInlineFormComponent` verifying:

1. `snackBar.open()` is called with `Labels.CustomerCreateError` when `CustomerStore.create()` fails.
2. `customerCreated` is NOT emitted.
3. `customerStore.saving()` is `false` after the error (managed by `CustomerStore` internally via `finalize`).

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/rental-create/step1/customer-create-inline-form.component.error.spec.ts`
* **Action:** Create New File

## 3. Code Implementation

**Imports Required:**

```typescript
import { signal } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MatSnackBar } from '@angular/material/snack-bar';
import { throwError } from 'rxjs';
import { vi } from 'vitest';
import type { Customer } from '@bikerental/shared';
import { CustomerFormProvider, CustomerStore, Labels } from '@bikerental/shared';
import { CustomerCreateInlineFormComponent } from './customer-create-inline-form.component';
```

**Code to Add/Replace:**

* **Location:** Create a new file from scratch.
* **Snippet:**

```typescript
import { signal } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MatSnackBar } from '@angular/material/snack-bar';
import { throwError } from 'rxjs';
import { vi } from 'vitest';
import type { Customer } from '@bikerental/shared';
import { CustomerFormProvider, CustomerStore, Labels } from '@bikerental/shared';
import { CustomerCreateInlineFormComponent } from './customer-create-inline-form.component';

function makeFailingStore() {
  return {
    create: vi.fn().mockReturnValue(throwError(() => new Error('Server error'))),
    saving: signal(false),
  };
}

describe('CustomerCreateInlineFormComponent — error handling', () => {
  let fixture: ComponentFixture<CustomerCreateInlineFormComponent>;
  let component: CustomerCreateInlineFormComponent;
  let store: ReturnType<typeof makeFailingStore>;
  let snackBar: { open: ReturnType<typeof vi.fn> };
  let emitted: Customer[];

  beforeEach(async () => {
    store = makeFailingStore();
    snackBar = { open: vi.fn() };
    emitted = [];

    await TestBed.configureTestingModule({
      imports: [CustomerCreateInlineFormComponent],
      providers: [
        provideAnimationsAsync(),
        { provide: MatSnackBar, useValue: snackBar },
      ],
    })
      .overrideComponent(CustomerCreateInlineFormComponent, {
        set: {
          providers: [
            { provide: CustomerStore, useValue: store },
            CustomerFormProvider,
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(CustomerCreateInlineFormComponent);
    fixture.componentRef.setInput('phone', '+79001234567');
    fixture.componentInstance.customerCreated.subscribe((c: Customer) => emitted.push(c));
    fixture.detectChanges();
    component = fixture.componentInstance;
  });

  it('should show a snackbar with CustomerCreateError when store.create fails', fakeAsync(() => {
    component.formProvider.form.controls.firstName.setValue('Anna');
    component.formProvider.form.controls.lastName.setValue('Ivanova');
    component['submit']();
    tick();
    expect(snackBar.open).toHaveBeenCalledWith(
      Labels.CustomerCreateError,
      Labels.Close,
      { duration: 4000 },
    );
  }));

  it('should not emit customerCreated when store.create fails', fakeAsync(() => {
    component.formProvider.form.controls.firstName.setValue('Anna');
    component.formProvider.form.controls.lastName.setValue('Ivanova');
    component['submit']();
    tick();
    expect(emitted.length).toBe(0);
  }));

  it('should have saving false after store.create fails', fakeAsync(() => {
    component.formProvider.form.controls.firstName.setValue('Anna');
    component.formProvider.form.controls.lastName.setValue('Ivanova');
    component['submit']();
    tick();
    expect(store.saving()).toBe(false);
  }));
});
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx ng test operator --include="**/step1/customer-create-inline-form.component.error**"
```
