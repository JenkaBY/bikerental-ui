# Task 003: Update CustomerListComponent — Add "New Customer" Button and Dialog Trigger

> **Applied Skill:** `angular-component` — OnPush, inject(), signal-based patterns; responsive layout (desktop button); `takeUntilDestroyed()` for dialog subscriptions

## 1. Objective

Extend `CustomerListComponent` to:

1. Render a "New Customer" `mat-raised-button` in the header area alongside the page title.
2. Inject `MatDialog` and open `CustomerCreateDialogComponent` when either button is clicked.
3. After the dialog closes, navigate to `/customers/:id` if the result is a truthy `id` string.

## 2. File to Modify / Create

* **File Path:** `projects/admin/src/app/customers/customer-list.component.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

### 3a. Replace the import line for `@angular/core`

* **Location:** Line 1 — the existing `@angular/core` import.
* **Old code:**

```typescript
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
```

* **New code:**

```typescript
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
```

### 3b. Add new import statements after the existing `import { Router } from '@angular/router';` line

* **Location:** After line `import { Router } from '@angular/router';` and before the `FormsModule` import.
* **Snippet (add these lines):**

```typescript
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CustomerCreateDialogComponent } from './dialogs/customer-create-dialog/customer-create-dialog.component';
```

### 3c. Replace the `imports` array inside `@Component`

* **Location:** The `imports: [...]` array in the `@Component` decorator.
* **Old code:**

```typescript
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatCardModule,
    MatProgressBarModule,
  ],
```

* **New code:**

```typescript
  imports: [
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatCardModule,
    MatProgressBarModule,
  ],
```

### 3d. Replace the header `<h1>` with a flex row that includes the desktop "New Customer" button

* **Location:** Inside the `template`, replace the standalone `<h1>` tag.
* **Old code:**

```html
      <h1 class="text-2xl font-semibold text-slate-800 mb-4">{{ Labels.CustomersTitle }}</h1>
```

* **New code:**

```html
      <div class="flex items-center justify-between mb-4">
        <h1 class="text-2xl font-semibold text-slate-800">{{ Labels.CustomersTitle }}</h1>
        <button
          mat-raised-button
          color="primary"
          class="hidden md:flex items-center gap-1"
          (click)="openCreateDialog()"
        >
          <mat-icon>add</mat-icon>
          {{ Labels.CustomerNewButton }}
        </button>
      </div>
```

### 3e. Replace the class body to add new injections and `openCreateDialog()` method

* **Location:** The `export class CustomerListComponent { ... }` body.
* **Old code:**

```typescript
export class CustomerListComponent {
  protected readonly Labels = Labels;
  protected readonly displayedColumns = ['phone', 'firstName', 'lastName'];

  protected readonly store = inject(CustomerListStore);
  private readonly router = inject(Router);

  public navigate(customer: Customer) {
    this.router.navigate(['/customers', customer.id]);
  }
}
```

* **New code:**

```typescript
export class CustomerListComponent {
  protected readonly Labels = Labels;
  protected readonly displayedColumns = ['phone', 'firstName', 'lastName'];

  protected readonly store = inject(CustomerListStore);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  public navigate(customer: Customer) {
    this.router.navigate(['/customers', customer.id]);
  }

  public openCreateDialog(): void {
    this.dialog
      .open(CustomerCreateDialogComponent, { data: {}, width: '480px' })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((id: string | undefined) => {
        if (id) {
          this.router.navigate(['/customers', id]);
        }
      });
  }
}
```

## 4. Validation Steps

```bash
npm run build -- --project admin
```
