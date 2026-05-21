# Task 004: Create `CancelRentalDialogComponent`

> **Applied Skill:** `angular-component` — Tiny standalone confirmation dialog; injects `MatDialogRef` as a value provider; closes with `true` on confirm and `false` on dismiss. Consistent with the existing `TopUpDialogComponent` pattern.

## 1. Objective

The "Cancel rental" button opens a simple in-process confirmation dialog. This component contains only the static message, two buttons, and the `MatDialogRef` close calls. It is opened by `RentalActionButtonsComponent` (Task 005).

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/rental-detail/cancel-rental-dialog.component.ts`
* **Action:** Create New File

## 3. Code Implementation

**Imports Required:** (included in the snippet below)

**Code to Add/Replace:**

* **Location:** New file — paste the complete content below.

```typescript
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Labels } from '@bikerental/shared';

@Component({
  selector: 'app-cancel-rental-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>{{ Labels.Confirmation }}</h2>
    <mat-dialog-content>
      <p class="text-sm text-slate-700">{{ Labels.CancelRentalConfirmation }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close(false)">
        {{ Labels.KeepRental }}
      </button>
      <button mat-flat-button color="warn" (click)="dialogRef.close(true)">
        {{ Labels.YesCancel }}
      </button>
    </mat-dialog-actions>
  `,
})
export class CancelRentalDialogComponent {
  protected readonly dialogRef = inject(MatDialogRef<CancelRentalDialogComponent>);
  protected readonly Labels = Labels;
}
```

## 4. Validation Steps

skip