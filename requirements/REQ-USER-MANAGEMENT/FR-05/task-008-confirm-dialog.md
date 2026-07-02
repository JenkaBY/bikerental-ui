# Task 008: ConfirmDialogComponent (Generic Reusable Confirm Dialog)

> **Applied Skills:** `angular-component` (standalone, `OnPush`, `inject()`, native `@if` control flow) — this is the first generic confirm dialog introduced in this codebase; FR-05 (deactivate, task-012) and FR-06 (reset-password, task-013) both reuse it verbatim rather than each inventing its own confirm modal.

## 1. Objective

Create `ConfirmDialogComponent` in the Shared Library — a generic modal that receives `ConfirmDialogData` (`title`, `message`, `confirmLabel`, `cancelLabel`, optional `danger` styling flag) via `MAT_DIALOG_DATA`, renders the message with a Cancel action (closes `false`) and a Confirm action (closes `true`), and carries no business logic of its own.

## 2. Files to Modify / Create

* **File Path:** `projects/shared/src/shared/components/confirm-dialog/confirm-dialog.component.ts`
* **Action:** Create New File

## 3. Code Implementation

**Imports Required:**

```typescript
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
```

**Code to Add/Replace:**

* **Location:** Full file content — this is a new file.

```typescript
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  danger?: boolean;
}

@Component({
  selector: 'app-confirm-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <p>{{ data.message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="cancel()">{{ data.cancelLabel }}</button>
      <button
        mat-flat-button
        [color]="data.danger ? 'warn' : 'primary'"
        (click)="confirm()"
      >
        {{ data.confirmLabel }}
      </button>
    </mat-dialog-actions>
  `,
})
export class ConfirmDialogComponent {
  protected readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ConfirmDialogComponent>);

  confirm(): void {
    this.dialogRef.close(true);
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
```

## 4. Export from Shared Public API

* **File Path:** `projects/shared/src/public-api.ts`
* **Action:** Modify Existing File
* **Location:** In the `// Shared UI — components` block, add the new export immediately after `export * from './shared/components/temporary-password-dialog/temporary-password-dialog.component';` (added in task-007).

**New line to add:**

```typescript
export * from './shared/components/confirm-dialog/confirm-dialog.component';
```

## 5. Caller Contract (for reference by task-012 and task-013 — no action needed here)

```typescript
this.dialog
  .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
    data: {
      title: Labels.DeactivateUserDialogTitle,
      message: Labels.DeactivateUserDialogMessage,
      confirmLabel: Labels.DeactivateUserConfirmButton,
      cancelLabel: Labels.Cancel,
      danger: true,
    },
  })
  .afterClosed()
  .subscribe((confirmed) => {
    if (confirmed) {
      /* proceed with the mutating call */
    }
  });
```

`afterClosed()` resolves `true` only on explicit Confirm; backdrop click, Escape, and Cancel all resolve `false`/`undefined` — every call site must treat anything other than strict `true` as "no action."

## 6. Validation Steps

```bash
npx tsc --noEmit -p projects/shared/tsconfig.lib.json
npm run build -- --project shared
```
