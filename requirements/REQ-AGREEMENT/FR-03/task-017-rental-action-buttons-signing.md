# Task 017: Rental Action Buttons — Continue/Cancel signing + Cancel rental (AWAITING_SIGNATURE)

> **Applied Skills:** `angular-di` (`AgreementSigningStore`/`SigningFlowService` are injected here,
> NOT re-provided — they are provided once on the parent `RentalDetailComponent`, Task 018, and
> resolved from this child via the normal DI hierarchy), `error-handling` (`cancelSigning()`
> subscribes with the existing bare pattern; errors surface via the global interceptor since
> `cancelSigning()` suppresses only so the caller COULD handle 409s — here there is no local
> recovery UI needed beyond the existing effects, so the subscribe has no explicit error branch,
> matching how `store.cancelRental()` is called elsewhere without local 409 handling) — implements
> FR-03 design section 3, bullet 11.

## 1. Objective

Add an `@if (store.isAwaitingSignature())` block to `RentalActionButtonsComponent` with three
actions: Continue signing (reopens the signing dialog), Cancel signing (transitions back to
`DRAFT`), and Cancel rental (reuses the existing confirm-dialog flow).

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/rental-detail/rental-action-buttons.component.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:**

```typescript
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  ViewContainerRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import type { BrokenEquipmentEntry } from '@ui-models';
import { AgreementSigningStore, Labels, NotificationService, RentalStore } from '@bikerental/shared';
import { AddEquipmentDialogComponent } from './add-equipment-dialog/add-equipment-dialog.component';
import { BrokenEquipmentSheetComponent } from './broken-equipment-sheet.component';
import { CancelRentalDialogComponent } from './cancel-rental-dialog.component';
import { ReturnEquipmentDialogComponent } from './return-equipment-dialog/return-equipment-dialog.component';
import { SigningFlowService } from '../rental-signing/signing-flow.service';
```

**Code to Add/Replace:**

### 3.1 Add the imports listed above

* **Location:** Replace the existing import block at the top of the file with the block above (adds
  `AgreementSigningStore`, `NotificationService` from `@bikerental/shared` and the new
  `SigningFlowService` relative import; `ViewContainerRef` was already imported).

### 3.2 New template block

* **Location:** Immediately after the closing `}` of the existing `@if (store.isDebt()) { ... }`
  block, still inside the root `<div class="flex flex-col gap-2 ...">`.
* **Snippet:**

```typescript
      @if (store.isDebt()) {
        <button
          mat-stroked-button
          class="w-full !text-red-600 !border-red-400"
          (click)="onBroken()"
        >
          🔧 {{ Labels.BrokenEquipment }}
        </button>
      }

      @if (store.isAwaitingSignature()) {
        <button mat-flat-button color="primary" class="w-full" (click)="onContinueSigning()">
          {{ Labels.ContinueSigning }}
        </button>
        <button mat-stroked-button class="w-full" (click)="onCancelSigning()">
          {{ Labels.CancelSigning }}
        </button>
        <button
          mat-flat-button
          class="w-full !bg-amber-400 !text-white"
          [disabled]="store.isSaving()"
          (click)="onCancel()"
        >
          {{ Labels.CancelRental }}
        </button>
      }
    </div>
  `,
})
```

(This replaces the file's existing closing `    </div>\n  \`,\n})` with the same closing preceded by
the new `@if` block.)

### 3.3 New injected dependencies

* **Location:** Immediately after the existing `private readonly viewContainerRef = inject(ViewContainerRef);`.
* **Snippet:**

```typescript
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly signingStore = inject(AgreementSigningStore);
  private readonly signingFlow = inject(SigningFlowService);
  private readonly notifications = inject(NotificationService);
```

### 3.4 New methods

* **Location:** Immediately after the existing `onCancel()` method (end of class, before the final
  closing `}`).
* **Snippet:**

```typescript
  protected onContinueSigning(): void {
    const id = this.store.id();
    const version = this.store.version();
    if (id === null || version === null) return;

    this.signingFlow
      .openDialog(id, version, this.viewContainerRef)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((outcome) => {
        if (outcome === 'signed') {
          this.store.loadDetail(id);
          this.notifications.success(Labels.AgreementSignedSuccess);
        } else if (outcome === 'failed') {
          this.store.loadDetail(id);
        }
      });
  }

  protected onCancelSigning(): void {
    this.store
      .cancelSigning()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }
```

**Note on `onContinueSigning()`:** per the design's explicit instruction ("dialog 'cancelled' → no
lifecycle change ... only the explicit Cancel signing button transitions"), the `'cancelled'` outcome
branch does nothing — the rental stays `AWAITING_SIGNATURE` and the three action buttons remain.

**Note on `signingStore`:** injected but not directly referenced in this component's template/methods
— it exists so `SigningFlowService`'s internal `loadActiveTemplate()` call resolves the same
instance provided on `RentalDetailComponent` (Task 018). Do not remove it even though it looks
unused; if the linter flags it as unused, keep it as `protected readonly` instead of `private
readonly` (unused-but-DI-relevant fields are commonly kept `protected` in this codebase's stores —
verify against `npx ng lint operator` output and adjust visibility only, never delete the line).

## 4. Validation Steps

Do NOT execute these commands — write them for the dev agent to run.

```bash
npx ng build operator --configuration development
npx ng lint operator
```
