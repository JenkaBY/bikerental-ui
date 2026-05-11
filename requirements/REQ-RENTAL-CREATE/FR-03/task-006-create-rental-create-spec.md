# Task 006: Create `rental-create.component.spec.ts` (Happy Path)

> **Applied Skill:** `angular-testing` — Use Vitest + TestBed with `vi.fn()` stubs. Override the component-level `RentalStore` provider via `TestBed.overrideComponent` so the mock is picked up from the component injector (not just the module injector). Test that `loadRental` is called with the correct `id` and that `activeStep` advances to `1` on success.

## 1. Objective

Create the happy-path unit test file for `RentalCreateComponent` that verifies:

1. The component mounts without errors when `id` is `undefined`.
2. `store.loadRental()` is **not** called when no `id` is present.
3. `store.loadRental(42)` **is** called when `id` input is set to `42`.
4. `activeStep` advances to `1` after a successful load.
5. `isLoading` (aliased from `store.isLoading`) is `false` after a successful load.

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/rental-create/rental-create.component.spec.ts`
* **Action:** Create New File

## 3. Code Implementation

**Imports Required:**

```typescript
import { signal } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { RentalStore } from '@bikerental/shared';
import { RentalCreateComponent } from './rental-create.component';
```

**Code to Add/Replace:**

* **Location:** Create a new file from scratch at `projects/operator/src/app/rental-create/rental-create.component.spec.ts`.
* **Snippet:**

```typescript
import { signal } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { RentalStore } from '@bikerental/shared';
import { RentalCreateComponent } from './rental-create.component';

function makeStore() {
  return {
    loadRental: vi.fn().mockReturnValue(of(undefined)),
    reset: vi.fn(),
    isLoading: signal(false),
  };
}

describe('RentalCreateComponent', () => {
  let fixture: ComponentFixture<RentalCreateComponent>;
  let component: RentalCreateComponent;
  let store: ReturnType<typeof makeStore>;
  let snackBar: { open: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    store = makeStore();
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

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not call loadRental when id input is undefined', fakeAsync(() => {
    tick();
    expect(store.loadRental).not.toHaveBeenCalled();
  }));

  it('should not show the snackbar when id input is undefined', fakeAsync(() => {
    tick();
    expect(snackBar.open).not.toHaveBeenCalled();
  }));

  it('should call loadRental with the provided id', fakeAsync(() => {
    fixture.componentRef.setInput('id', 42);
    fixture.detectChanges();
    tick();
    expect(store.loadRental).toHaveBeenCalledWith(42);
  }));

  it('should set activeStep to 1 after a successful draft load', fakeAsync(() => {
    fixture.componentRef.setInput('id', 42);
    fixture.detectChanges();
    tick();
    expect(component.activeStep()).toBe(1);
  }));

  it('should have isLoading as false after a successful draft load', fakeAsync(() => {
    fixture.componentRef.setInput('id', 42);
    fixture.detectChanges();
    tick();
    expect(component.isLoading()).toBe(false);
  }));

  it('should keep activeStep at 0 when no id is provided', fakeAsync(() => {
    tick();
    expect(component.activeStep()).toBe(0);
  }));
});
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx ng test operator --include="**/rental-create/**"
```
