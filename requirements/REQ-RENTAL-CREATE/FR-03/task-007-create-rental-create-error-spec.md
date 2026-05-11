# Task 007: Create `rental-create.component.error.spec.ts` (Error Path)

> **Applied Skill:** `angular-testing` — Error-path tests are split into a separate `*.error.spec.ts` file per project convention. The `RentalStore.loadRental()` mock returns `throwError(...)` to simulate backend failures. `store.reset()` is **not** expected from the component — `RentalStore` calls it internally. Assertions verify: snackbar is shown with `Labels.RentalDraftLoadError`, `activeStep` stays at `0`, and `isLoading` (aliased from the store) is `false` after the error.

## 1. Objective

Create the error-path unit test file for `RentalCreateComponent` that verifies the behaviour when `RentalStore.loadRental()` throws:

1. `snackBar.open()` is called (the operator sees a notification).
2. `activeStep` remains `0` (stepper stays on Step 1).
3. `isLoading` (aliased from `store.isLoading`) is `false` (the loading indicator is hidden).

> **Note:** `store.reset()` is intentionally NOT asserted here. The component no longer calls it directly — `RentalStore.loadRental()` calls `this.reset()` inside its own `catchError` before rethrowing. That behaviour belongs in the store's own spec (`rental.store.spec.ts`).

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/rental-create/rental-create.component.error.spec.ts`
* **Action:** Create New File

## 3. Code Implementation

**Imports Required:**

```typescript
import { signal } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { throwError } from 'rxjs';
import { vi } from 'vitest';
import { Labels, RentalStore } from '@bikerental/shared';
import { RentalCreateComponent } from './rental-create.component';
```

**Code to Add/Replace:**

* **Location:** Create a new file from scratch at `projects/operator/src/app/rental-create/rental-create.component.error.spec.ts`.
* **Snippet:**

```typescript
import { signal } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { throwError } from 'rxjs';
import { vi } from 'vitest';
import { Labels, RentalStore } from '@bikerental/shared';
import { RentalCreateComponent } from './rental-create.component';

function makeFailingStore() {
  return {
    loadRental: vi.fn().mockReturnValue(throwError(() => new Error('Not found'))),
    reset: vi.fn(),
    isLoading: signal(false),
  };
}

describe('RentalCreateComponent — error handling', () => {
  let fixture: ComponentFixture<RentalCreateComponent>;
  let component: RentalCreateComponent;
  let store: ReturnType<typeof makeFailingStore>;
  let snackBar: { open: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    store = makeFailingStore();
    snackBar = { open: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [RentalCreateComponent],
      providers: [
        provideRouter([]),
        { provide: MatSnackBar, useValue: snackBar },
      ],
    })
      .overrideComponent(RentalCreateComponent, {
        set: { providers: [{ provide: RentalStore, useValue: store }] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(RentalCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should open a snackbar with RentalDraftLoadError when loadRental fails', fakeAsync(() => {
    fixture.componentRef.setInput('id', 999);
    fixture.detectChanges();
    tick();
    expect(snackBar.open).toHaveBeenCalledWith(
      Labels.RentalDraftLoadError,
      Labels.Close,
      { duration: 4000 },
    );
  }));

  it('should keep activeStep at 0 when loadRental fails', fakeAsync(() => {
    fixture.componentRef.setInput('id', 999);
    fixture.detectChanges();
    tick();
    expect(component.activeStep()).toBe(0);
  }));

  it('should have isLoading as false after loadRental fails', fakeAsync(() => {
    fixture.componentRef.setInput('id', 999);
    fixture.detectChanges();
    tick();
    expect(component.isLoading()).toBe(false);
  }));
});
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx ng test operator --include="**/rental-create/**"
```
