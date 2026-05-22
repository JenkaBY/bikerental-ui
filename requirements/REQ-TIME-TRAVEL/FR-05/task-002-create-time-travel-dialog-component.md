# Task 002: Create `TimeTravelDialogComponent`

> **Applied Skill:** `angular-component` — standalone dialog following the Admin CRUD dialog pattern; `ChangeDetectionStrategy.OnPush`; reactive `FormControl`; `MatDialogRef.close(true)` on success; `takeUntilDestroyed()` for subscription cleanup; no error handling (global `ErrorInterceptor` handles HTTP errors)

## 1. Objective

Create the `TimeTravelDialogComponent` that:

* Pre-fills a `datetime-local` input with the current `TimeTravelStore.serverTime()?.instant` (falls back to `new Date()` when the signal is `null`).
* The input value and the server instant are both in UTC — `toDateTimeLocalString()` serialises to `"YYYY-MM-DDTHH:mm"` via `Date.toISOString().slice(0, 16)`, and `parseDateTimeLocal()` parses it back by appending `":00.000Z"`.
* On **Save**: calls `TimeTravelStore.setTime()` with the parsed `Date`; on success closes with `true`.
* On **Reset**: calls `TimeTravelStore.resetTime()`; on success closes with `true`.
* On backdrop / Escape: Angular Material closes the dialog with no API call.
* Does **not** catch HTTP errors — the global `ErrorInterceptor` surfaces them via `MatSnackBar`; the dialog stays open automatically because `close(true)` is only called in the `next` callback.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/shared/components/time-travel-dialog/time-travel-dialog.component.ts`
* **Action:** Create New File

## 3. Code Implementation

**Imports Required:**

```typescript
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TimeTravelStore } from '../../../core/state/time-travel.store';
import { CancelButtonComponent } from '../cancel-button/cancel-button.component';
import { Labels } from '../../constant/labels';
```

**Code to Add/Replace:**

* **Location:** New file; paste the entire content below.

* **Snippet:**

```typescript
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TimeTravelStore } from '../../../core/state/time-travel.store';
import { CancelButtonComponent } from '../cancel-button/cancel-button.component';
import { Labels } from '../../constant/labels';

function toDateTimeLocalString(date: Date): string {
  return date.toISOString().slice(0, 16);
}

function parseDateTimeLocal(value: string): Date {
  return new Date(value + ':00.000Z');
}

@Component({
  selector: 'app-time-travel-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    CancelButtonComponent,
  ],
  template: `
    <h2 mat-dialog-title>{{ Labels.TimeTravelDialogTitle }}</h2>

    <mat-dialog-content>
      <mat-form-field appearance="outline" class="w-full mt-2">
        <mat-label>{{ Labels.TimeTravelDialogTitle }}</mat-label>
        <input matInput type="datetime-local" [formControl]="datetimeControl" />
      </mat-form-field>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <app-form-cancel-button />
      <button mat-button (click)="onReset()">{{ Labels.TimeTravelReset }}</button>
      <button mat-flat-button [disabled]="datetimeControl.invalid" (click)="onSave()">
        {{ Labels.Save }}
      </button>
    </mat-dialog-actions>
  `,
})
export class TimeTravelDialogComponent {
  protected readonly Labels = Labels;

  private readonly store = inject(TimeTravelStore);
  private readonly dialogRef = inject<MatDialogRef<TimeTravelDialogComponent>>(MatDialogRef);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly datetimeControl = new FormControl<string>(
    toDateTimeLocalString(this.store.serverTime()?.instant ?? new Date()),
    [Validators.required],
  );

  protected onSave(): void {
    if (this.datetimeControl.invalid) return;
    this.store
      .setTime(parseDateTimeLocal(this.datetimeControl.value!))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.dialogRef.close(true));
  }

  protected onReset(): void {
    this.store
      .resetTime()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.dialogRef.close(true));
  }
}
```

**Key Rules:**

* `toDateTimeLocalString` / `parseDateTimeLocal` are module-level pure functions, not class methods — they have no dependency on Angular DI and require no instances.
* Both treat the value as UTC: `toISOString().slice(0, 16)` produces `"YYYY-MM-DDTHH:mm"` in UTC; appending `":00.000Z"` on parse restores the full UTC instant. The developer sees and edits in UTC, which matches what the server displays.
* `store.serverTime()?.instant ?? new Date()` is evaluated **once at construction time** to snapshot the current server time for the pre-fill. The control is not live-linked to the signal.
* HTTP errors are intentionally not caught — `close(true)` lives only in the `next` callback, so the dialog remains open on error while the global `ErrorInterceptor` shows the snackbar.
* `inject<MatDialogRef<TimeTravelDialogComponent>>(MatDialogRef)` uses the generic type so that `close()` is typed correctly without importing `MAT_DIALOG_DATA` (no data payload is needed).

## 4. Validation Steps

skip
