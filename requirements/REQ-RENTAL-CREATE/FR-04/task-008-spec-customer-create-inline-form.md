# Task 008: Spec for `CustomerCreateInlineFormComponent` (Happy Path)

> **Applied Skill:** `angular-testing` — Use Vitest + TestBed with `vi.fn()` stubs. Both `CustomerStore` and `CustomerFormProvider` are declared in the component's `providers`, so override them together via `TestBed.overrideComponent`. `CustomerFormProvider` is a real instance (not mocked) — this keeps form validation logic under test without extra ceremony.

## 1. Objective

Create happy-path unit tests for `CustomerCreateInlineFormComponent` verifying:

1. Component mounts with the phone displayed.
2. Submit with empty firstName/lastName does NOT call `customerStore.create()`.
3. Submit with valid data calls `customerStore.create()` with the `CustomerWrite` built by `CustomerFormProvider.getCustomerWrite()`.
4. `customerCreated` is emitted with the `Customer` returned by the store.
5. The snackbar is NOT shown on success.

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/rental-create/step1/customer-create-inline-form.component.spec.ts`
* **Action:** Create New File

## 3. Code Implementation

**Imports Required:**

```typescript
import { signal } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { vi } from 'vitest';
import type { Customer } from '@bikerental/shared';
import { CustomerFormProvider, CustomerStore } from '@bikerental/shared';
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
import { of } from 'rxjs';
import { vi } from 'vitest';
import type { Customer } from '@bikerental/shared';
import { CustomerFormProvider, CustomerStore } from '@bikerental/shared';
import { CustomerCreateInlineFormComponent } from './customer-create-inline-form.component';

const CREATED_CUSTOMER: Customer = {
  id: 'new-1',
  phone: '+79001234567',
  firstName: 'Anna',
  lastName: 'Ivanova',
};

function makeStore() {
  return {
    create: vi.fn().mockReturnValue(of(CREATED_CUSTOMER)),
    saving: signal(false),
  };
}

describe('CustomerCreateInlineFormComponent', () => {
  let fixture: ComponentFixture<CustomerCreateInlineFormComponent>;
  let component: CustomerCreateInlineFormComponent;
  let store: ReturnType<typeof makeStore>;
  let snackBar: { open: ReturnType<typeof vi.fn> };
  let emitted: Customer[];

  beforeEach(async () => {
    store = makeStore();
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

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the pre-filled phone value', () => {
    expect(fixture.nativeElement.textContent).toContain('+79001234567');
  });

  it('should not call store.create when firstName is empty', fakeAsync(() => {
    component.formProvider.form.controls.firstName.setValue('');
    component.formProvider.form.controls.lastName.setValue('Ivanova');
    component['submit']();
    tick();
    expect(store.create).not.toHaveBeenCalled();
  }));

  it('should not call store.create when lastName is empty', fakeAsync(() => {
    component.formProvider.form.controls.firstName.setValue('Anna');
    component.formProvider.form.controls.lastName.setValue('');
    component['submit']();
    tick();
    expect(store.create).not.toHaveBeenCalled();
  }));

  it('should call store.create with the CustomerWrite built by formProvider', fakeAsync(() => {
    component.formProvider.form.controls.firstName.setValue('Anna');
    component.formProvider.form.controls.lastName.setValue('Ivanova');
    component['submit']();
    tick();
    expect(store.create).toHaveBeenCalledWith(
      expect.objectContaining({ phone: '+79001234567', firstName: 'Anna', lastName: 'Ivanova' }),
    );
  }));

  it('should emit customerCreated with the customer returned by the store', fakeAsync(() => {
    component.formProvider.form.controls.firstName.setValue('Anna');
    component.formProvider.form.controls.lastName.setValue('Ivanova');
    component['submit']();
    tick();
    expect(emitted.length).toBe(1);
    expect(emitted[0]).toEqual(CREATED_CUSTOMER);
  }));

  it('should not show a snackbar on success', fakeAsync(() => {
    component.formProvider.form.controls.firstName.setValue('Anna');
    component.formProvider.form.controls.lastName.setValue('Ivanova');
    component['submit']();
    tick();
    expect(snackBar.open).not.toHaveBeenCalled();
  }));
});
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx ng test operator --include="**/step1/customer-create-inline-form.component.spec**"
```
