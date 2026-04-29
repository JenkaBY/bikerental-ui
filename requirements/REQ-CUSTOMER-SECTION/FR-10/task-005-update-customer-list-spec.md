# Task 005: Update CustomerListComponent Unit Tests

> **Applied Skill:** `angular-testing` — Vitest + TestBed, `vi.fn()` stubs for `MatDialog`, extend existing spec to cover new desktop button and dialog-triggered navigation

## 1. Objective

Extend the existing `CustomerListComponent` spec to cover the three new behaviours introduced in task-003: the "New Customer" desktop button exists, `openCreateDialog()` calls `MatDialog.open()`, and a truthy `id` returned from the closed dialog triggers `Router.navigate(['/customers', id])`.

## 2. File to Modify / Create

* **File Path:** `projects/admin/src/app/customers/customer-list.component.spec.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

### 3a. Replace the `import` block at the top of the file

* **Location:** Lines 1–7 — the complete existing import block.
* **Old code:**

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CustomerListComponent } from './customer-list.component';
import { CustomerListStore } from './customer-list.store';
```

* **New code:**

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MatDialog } from '@angular/material/dialog';
import { CustomerListComponent } from './customer-list.component';
import { CustomerListStore } from './customer-list.store';
```

### 3b. Add a `makeDialog` factory and `dialogRef` variable after the existing `makeStore` factory

* **Location:** After the closing `});` of `const makeStore = () => ({...})` and before `describe('CustomerListComponent', () => {`.
* **Snippet (insert between `makeStore` and the `describe` block):**

```typescript
const makeDialogRef = (returnValue: unknown = undefined) => ({
  afterClosed: vi.fn().mockReturnValue(of(returnValue)),
});

const makeDialog = (returnValue: unknown = undefined) => ({
  open: vi.fn().mockReturnValue(makeDialogRef(returnValue)),
});
```

### 3c. Add `dialog` and `dialogRef` variables inside the `describe` block

* **Location:** Inside `describe('CustomerListComponent', () => {`, right after the existing `let store: ReturnType<typeof makeStore>;` declaration.
* **Old code:**

```typescript
  let fixture: ComponentFixture<CustomerListComponent>;
let store: ReturnType<typeof makeStore>;

beforeEach(async () => {
```

* **New code:**

```typescript
  let fixture: ComponentFixture<CustomerListComponent>;
let store: ReturnType<typeof makeStore>;
let dialog: ReturnType<typeof makeDialog>;

beforeEach(async () => {
```

### 3d. Update `beforeEach` to reset `dialog` and add `MatDialog` provider

* **Location:** Inside `beforeEach`, replace the existing `store = makeStore();` line and `TestBed.configureTestingModule` call.
* **Old code:**

```typescript
    store = makeStore();
await TestBed.configureTestingModule({
  imports: [CustomerListComponent],
  providers: [provideRouter([]), { provide: CustomerListStore, useValue: store }],
}).compileComponents();
```

* **New code:**

```typescript
    store = makeStore();
dialog = makeDialog();
await TestBed.configureTestingModule({
  imports: [CustomerListComponent],
  providers: [
    provideRouter([]),
    { provide: CustomerListStore, useValue: store },
    { provide: MatDialog, useValue: dialog },
  ],
}).compileComponents();
```

### 3e. Add new test cases at the end of the `describe` block, after the last existing `it(...)` block

* **Location:** Inside `describe('CustomerListComponent', () => {`, after the last existing `it(...)` test and before the closing `});`.
* **Snippet (append these new tests):**

```typescript
  it('should render the "New Customer" button in the desktop header', () => {
  const buttons: NodeListOf<HTMLButtonElement> =
    fixture.nativeElement.querySelectorAll('button[mat-raised-button]');
  const labels = Array.from(buttons).map((b) => b.textContent?.trim());
  expect(labels.some((t) => t?.includes('New Customer'))).toBe(true);
});

it('should call MatDialog.open() when openCreateDialog() is invoked', () => {
  fixture.componentInstance.openCreateDialog();
  expect(dialog.open).toHaveBeenCalledOnce();
});

it('should navigate to /customers/:id when dialog closes with an id', () => {
  dialog.open.mockReturnValue(makeDialogRef('cust-abc'));
  const router = TestBed.inject(Router);
  const navigateSpy = vi.spyOn(router, 'navigate');

  fixture.componentInstance.openCreateDialog();

  expect(navigateSpy).toHaveBeenCalledWith(['/customers', 'cust-abc']);
});

it('should NOT navigate when dialog closes with undefined (cancel)', () => {
  dialog.open.mockReturnValue(makeDialogRef(undefined));
  const router = TestBed.inject(Router);
  const navigateSpy = vi.spyOn(router, 'navigate');

  fixture.componentInstance.openCreateDialog();

  expect(navigateSpy).not.toHaveBeenCalled();
});
```

## 4. Validation Steps

```bash
npm test -- --project admin --reporter=verbose
```
