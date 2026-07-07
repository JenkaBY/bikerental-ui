# Task 016: Rental Step 3 — "Send to signing" button + flow

> **Applied Skills:** `angular-di` (`providers: [AgreementSigningStore, SigningFlowService]` on
> this component — `RentalStore`/`RentalValidationStore` stay provided by the parent
> `RentalCreateComponent`, only the two new signing-feature services are scoped here),
> `error-handling` (`store.save()`/`sendToSigning()` chain uses `catchError` → parse + toast + abort)
> — implements FR-03 design section 3, bullet 10. The existing "Start rental" (activate) button is
> left untouched per the design's "Direct activation REMAINS available in this slice".

## 1. Objective

Add a "Send to signing" button next to the existing activate button in `RentalStep3Component`.
Clicking it: checks the active template exists → saves the draft → transitions the rental to
`AWAITING_SIGNATURE` → opens the signing dialog → routes the three dialog outcomes
(`signed`/`cancelled`/`failed`) per the design's interaction sequence.

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/rental-create/step3/rental-step3.component.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:**

```typescript
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  output,
  ViewContainerRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { catchError, of, switchMap, tap } from 'rxjs';
import {
  AgreementSigningStore,
  ApiErrorParser,
  Labels,
  NotificationService,
  resolveErrorMessage,
  RentalStore,
  RentalValidationStore,
  TopUpDialogComponent,
} from '@bikerental/shared';
import { RentalActivateButtonComponent } from './rental-activate-button.component';
import { RentalBalanceWarningComponent } from './rental-balance-warning.component';
import { RentalSummaryComponent } from './rental-summary.component';
import { SigningFlowService } from '../../rental-signing/signing-flow.service';
```

**Code to Add/Replace:**

* **Location:** Full file content — replaces the existing file entirely (small file, easier to
  rewrite than patch piecewise).

```typescript
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  output,
  ViewContainerRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { catchError, of, switchMap, tap } from 'rxjs';
import {
  AgreementSigningStore,
  ApiErrorParser,
  Labels,
  NotificationService,
  resolveErrorMessage,
  RentalStore,
  RentalValidationStore,
  TopUpDialogComponent,
} from '@bikerental/shared';
import { RentalActivateButtonComponent } from './rental-activate-button.component';
import { RentalBalanceWarningComponent } from './rental-balance-warning.component';
import { RentalSummaryComponent } from './rental-summary.component';
import { SigningFlowService } from '../../rental-signing/signing-flow.service';

@Component({
  selector: 'app-rental-step3',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [AgreementSigningStore, SigningFlowService],
  imports: [
    MatButton,
    MatIcon,
    MatProgressSpinner,
    RentalSummaryComponent,
    RentalBalanceWarningComponent,
    RentalActivateButtonComponent,
  ],
  template: `
    <div class="flex flex-col gap-6">
      @if (validationStore.estimate()) {
        <app-rental-summary
          [customer]="store.customer()!"
          [durationMinutes]="store.durationMinutes()"
          [equipmentItems]="store.equipmentItems()"
          [specialPriceEnabled]="store.specialPriceEnabled()"
          [isBalanceNegative]="!validationStore.isBalanceSufficient()"
          [costEstimate]="validationStore.estimate()!"
          [projectedBalance]="validationStore.projectedBalance()"
        />
      }

      <app-rental-balance-warning (topUpRequested)="onTopUpRequested()" />
    </div>

    <div class="bg-white p-4 shadow-md flex flex-col gap-2">
      <button
        mat-flat-button
        color="primary"
        type="button"
        [disabled]="!validationStore.isBalanceSufficient() || store.isSendingToSigning()"
        (click)="onSendToSigning()"
      >
        @if (store.isSendingToSigning()) {
          <mat-spinner diameter="20" />
        } @else {
          {{ Labels.SendToSigning }}
        }
      </button>

      <div class="flex gap-2 mt-1">
        <button matButton="outlined" class="flex-1" type="button" (click)="stepBack.emit()">
          <mat-icon>arrow_back</mat-icon>
          {{ Labels.Back }}
        </button>

        <app-rental-activate-button
          [disabled]="!validationStore.isBalanceSufficient()"
          [loading]="store.isActivating()"
          (activateRequested)="onActivateRequested()"
        />
      </div>
    </div>
  `,
})
export class RentalStep3Component {
  protected readonly Labels = Labels;
  protected readonly store = inject(RentalStore);
  protected readonly validationStore = inject(RentalValidationStore);
  protected readonly signingStore = inject(AgreementSigningStore);

  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly signingFlow = inject(SigningFlowService);
  private readonly notifications = inject(NotificationService);

  readonly stepBack = output<void>();

  protected onActivateRequested(): void {
    this.store
      .activateRental()
      .pipe(
        tap(() => {
          this.store.reset();
          this.snackBar.open(Labels.RentalStarted, Labels.Close, { duration: 3000 });
          this.router.navigate(['/rentals']);
        }),
        catchError(() => {
          this.snackBar.open(Labels.RentalStartError, Labels.Close, { duration: 4000 });
          return of(undefined);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  protected onSendToSigning(): void {
    this.store
      .save()
      .pipe(
        switchMap(() => this.store.sendToSigning()),
        catchError((err: unknown) => {
          this.notifications.error(resolveErrorMessage(ApiErrorParser.parse(err)));
          return of(null);
        }),
        switchMap((version) => {
          if (version === null) return of(null);
          const id = this.store.id();
          if (id === null) return of(null);
          return this.signingFlow.openDialog(id, version, this.viewContainerRef).pipe(
            switchMap((outcome) => {
              const rentalId = this.store.id();
              if (rentalId === null) return of(null);
              switch (outcome) {
                case 'signed':
                  this.store.loadDetail(rentalId);
                  this.notifications.success(Labels.AgreementSignedSuccess);
                  this.store.reset();
                  void this.router.navigate(['/rentals', rentalId]);
                  return of(null);
                case 'cancelled':
                  return this.store.cancelSigning();
                case 'failed':
                  this.store.loadDetail(rentalId);
                  return of(null);
              }
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  protected onTopUpRequested(): void {
    const customerId = this.store.customer()?.id;
    if (!customerId) return;

    this.dialog
      .open(TopUpDialogComponent, {
        data: { customerId },
        disableClose: true,
        viewContainerRef: this.viewContainerRef,
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result === true) this.store.refreshCustomerBalance();
      });
  }
}
```

**Note on `onSendToSigning()` chain:** matches the design's happy path exactly — `save()` →
`sendToSigning()` (fresh `version`) → `signingFlow.openDialog(id, version, viewContainerRef)` →
`'signed'` re-fetches then toasts then resets then navigates to `/rentals/{id}`; `'cancelled'`
calls `store.cancelSigning()` and intentionally does nothing else (stays on step3, still `DRAFT`);
`'failed'` calls `store.loadDetail(id)` and relies on the existing `RentalCreateComponent` effect
(`status !== 'DRAFT'` → navigate to `/rentals/{id}`) to redirect if the rental ended up stuck in
`AWAITING_SIGNATURE`.

## 4. Validation Steps

Do NOT execute these commands — write them for the dev agent to run.

```bash
npx ng build operator --configuration development
npx ng lint operator
```
