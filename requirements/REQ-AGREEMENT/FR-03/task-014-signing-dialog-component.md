# Task 014: SigningDialogComponent

> **Applied Skills:** `angular-component` (standalone, OnPush, `viewChild` for the signature pad),
> `angular-signals` (local `signal` tracking pad-empty state via the pad's `emptyChanged` output),
> `error-handling` (`ApiErrorParser.parse` on the `sign()` error path; `invalid_signature_image`
> handled inline — toast + `pad.clear()` + stay open; every other code closes with the error for the
> opener to resolve) — implements FR-03 design section 3, bullet 8.

## 1. Objective

Create `SigningDialogComponent`: a full-height `MatDialog` showing the active agreement template
text, a read-only rental summary, the `<app-signature-pad>`, and Cancel/Sign actions. On success it
closes with `'signed'`; on cancel with `'cancelled'`; on a 409/404 during `sign()` (other than
`invalid_signature_image`) it closes with `{ error: ApiError }` for the opener to resolve.

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/rental-signing/signing-dialog.component.ts`
* **Action:** Create New File

## 3. Code Implementation

**Imports Required:**

```typescript
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  MAT_DIALOG_DATA,
  signal,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  AgreementSigningStore,
  ApiError,
  ApiErrorParser,
  DurationPipe,
  ErrorCode,
  Labels,
  MoneyPipe,
  NotificationService,
  RentalStore,
  resolveErrorMessage,
  SignaturePadComponent,
} from '@bikerental/shared';
```

**Code to Add/Replace:**

* **Location:** Full file content — this is a new file.

```typescript
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  MAT_DIALOG_DATA,
  signal,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  AgreementSigningStore,
  ApiError,
  ApiErrorParser,
  DurationPipe,
  ErrorCode,
  Labels,
  MoneyPipe,
  NotificationService,
  RentalStore,
  resolveErrorMessage,
  SignaturePadComponent,
} from '@bikerental/shared';

export interface SigningDialogData {
  rentalId: number;
  version: number;
}

export type SigningDialogResult = 'signed' | 'cancelled' | { error: ApiError };

@Component({
  selector: 'app-signing-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatProgressSpinnerModule,
    DurationPipe,
    MoneyPipe,
    SignaturePadComponent,
  ],
  template: `
    <h2 mat-dialog-title>{{ Labels.SigningDialogTitle }}</h2>
    <mat-dialog-content class="flex flex-col gap-4">
      @if (signingStore.template(); as template) {
        <div class="max-h-48 overflow-y-auto rounded border border-slate-200 p-3 text-sm">
          <h3 class="font-semibold mb-2">{{ template.title }}</h3>
          <p class="whitespace-pre-wrap">{{ template.content }}</p>
        </div>
      }

      <div class="rounded border border-slate-200 p-3 text-sm flex flex-col gap-1">
        <h3 class="font-semibold mb-1">{{ Labels.SigningSummaryTitle }}</h3>
        <div>{{ rentalStore.customer()?.firstName }} {{ rentalStore.customer()?.lastName }}</div>
        <div class="text-slate-500">{{ rentalStore.customer()?.phone }}</div>
        @for (item of equipmentItems(); track item.id) {
          <div class="flex justify-between">
            <span>{{ item.model }} ({{ item.uid }})</span>
            <span>{{ item.estimatedCost | money }}</span>
          </div>
        }
        <div class="flex justify-between mt-1">
          <span>{{ Labels.Duration }}</span>
          <span>{{ rentalStore.durationMinutes() | duration }}</span>
        </div>
        @if (rentalStore.estimatedCost(); as total) {
          <div class="flex justify-between font-semibold">
            <span>{{ Labels.Total }}</span>
            <span>{{ total | money }}</span>
          </div>
        }
        <p class="text-xs text-slate-500 mt-2">{{ Labels.SignatureStartNote }}</p>
      </div>

      <app-signature-pad (emptyChanged)="onPadEmptyChanged($event)" />
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="onCancel()">{{ Labels.Cancel }}</button>
      <button
        mat-flat-button
        color="primary"
        type="button"
        [disabled]="padEmpty() || signingStore.isSigning()"
        (click)="onSign()"
      >
        @if (signingStore.isSigning()) {
          <mat-spinner diameter="20" />
        } @else {
          {{ Labels.SignButton }}
        }
      </button>
    </mat-dialog-actions>
  `,
})
export class SigningDialogComponent {
  protected readonly Labels = Labels;
  protected readonly signingStore = inject(AgreementSigningStore);
  protected readonly rentalStore = inject(RentalStore);

  private readonly data = inject<SigningDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<SigningDialogComponent, SigningDialogResult>);
  private readonly notifications = inject(NotificationService);

  private readonly pad = viewChild.required(SignaturePadComponent);

  protected readonly padEmpty = signal(true);

  protected readonly equipmentItems = () =>
    this.rentalStore.rentalEquipmentItems().length > 0
      ? this.rentalStore.rentalEquipmentItems()
      : this.rentalStore.equipmentItems();

  protected onPadEmptyChanged(empty: boolean): void {
    this.padEmpty.set(empty);
  }

  protected onCancel(): void {
    this.dialogRef.close('cancelled');
  }

  protected onSign(): void {
    const png = this.pad().toDataUrl();
    if (!png) return;

    this.signingStore
      .sign(this.data.rentalId, png, this.data.version, this.rentalStore.operatorId())
      .subscribe({
        next: () => this.dialogRef.close('signed'),
        error: (err: unknown) => {
          const apiError = ApiErrorParser.parse(err);
          if (apiError.code === ErrorCode.AGREEMENT_SIGNING_INVALID_SIGNATURE_IMAGE) {
            this.notifications.error(resolveErrorMessage(apiError));
            this.pad().clear();
            return;
          }
          this.dialogRef.close({ error: apiError });
        },
      });
  }
}
```

**Note on `equipmentItems()`:** `rentalEquipmentItems()` is a `computed` derived from the store's
detail state (populated by `loadDetail`); when the dialog is opened straight from step3 right after
`sendToSigning()` (no intervening `loadDetail`), that computed may still be empty, so this falls back
to `equipmentItems()` (populated by step1/step2 selection) — matching the design's
"`rentalEquipmentItems()` (detail flow) falling back to `equipmentItems()`" instruction.

## 4. Validation Steps

Do NOT execute these commands — write them for the dev agent to run.

```bash
npx ng build operator --configuration development
npx ng lint operator
```
