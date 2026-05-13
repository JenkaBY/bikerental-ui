# Task 004: Update Admin `CustomerAccountComponent` Import

> **Applied Skill:** `angular-component` — After moving `TopUpDialogComponent` to the shared library, all admin consumers must update their import path to `@bikerental/shared`.

> **⚠️ Prerequisite:** Requires **task-001** and **task-002** to be completed first.

## 1. Objective

Update the import statement in `CustomerAccountComponent` so it no longer references the deleted local dialog file. After this change, the admin top-up flow continues to behave identically but now uses the shared component.

## 2. File to Modify / Create

* **File Path:** `projects/admin/src/app/customers/customer-detail/tabs/customer-account/customer-account.component.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Code to Add/Replace:**

* **Location:** Replace the local import on line 15 of the file

**Old line (to remove):**

```typescript
import { TopUpDialogComponent } from '../../../dialogs/top-up-dialog/top-up-dialog.component';
```

**New line (to add in the same position):**

```typescript
import { TopUpDialogComponent } from '@bikerental/shared';
```

The updated import block at the top of the file should look like:

```typescript
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  ViewContainerRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Labels, MoneyPipe, TopUpButtonComponent, TopUpDialogComponent } from '@bikerental/shared';
import { CustomerLayoutStore } from '../../customer-layout.store';
import { CustomerFinanceStore } from '@store.customer-finance.store';
import { WithdrawDialogComponent } from '../../../dialogs/withdraw-dialog/withdraw-dialog.component';
import { CustomerTransactionsStore } from '../../customer-transactions.store';
```

> **Note:** `TopUpDialogComponent` is now part of the `@bikerental/shared` named import, alongside `Labels`, `MoneyPipe`, and `TopUpButtonComponent`. Remove the separate standalone import line for `TopUpDialogComponent`.

## 4. Validation Steps

skip
