# Task 005: Create `RentalStep3Component`

> **Applied Skill:** `angular-component`, `angular-signals` — Smart orchestrator. Injects `RentalStore` (from parent `RentalCreateComponent` provider tree — no own `providers`), `Router`, `MatSnackBar`, `DestroyRef`. Composes the three dumb/smart children. Calls `store.activateRental()`, handles success (reset + snackbar + navigate) and error (snackbar only). The `TopUpDialogComponent` open is a TODO pending FR-07.

> **⚠️ Prerequisite:** Requires **task-001** (labels), **task-002**, **task-003**, **task-004** to be completed first.

## 1. Objective

Create the step 3 smart orchestrator. It wires `RentalSummaryComponent`, `RentalBalanceWarningComponent`, and `RentalActivateButtonComponent` together. On activation success it resets the store, shows a snackbar, and navigates to `/dashboard`. On error it shows a snackbar and leaves the operator on step 3.

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/rental-create/step3/rental-step3.component.ts`
* **Action:** Create New File

## 3. Code Implementation

```typescript
import { ChangeDetectionStrategy, Component, DestroyRef, inject, output } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of, tap } from 'rxjs';
import { Labels, RentalStore } from '@bikerental/shared';
import { RentalSummaryComponent } from './rental-summary.component';
import { RentalBalanceWarningComponent } from './rental-balance-warning.component';
import { RentalActivateButtonComponent } from './rental-activate-button.component';

// TODO (FR-07): Import TopUpDialogComponent from @bikerental/shared once moved:
// import { TopUpDialogComponent } from '@bikerental/shared';

@Component({
  selector: 'app-rental-step3',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatIconModule,
    RentalSummaryComponent,
    RentalBalanceWarningComponent,
    RentalActivateButtonComponent,
  ],
  template: `
    <div class="flex flex-col gap-6 pb-24">
      <app-rental-summary
        [customer]="store.customer()!"
        [durationMinutes]="store.durationMinutes()"
        [equipmentItems]="store.equipmentItems()"
        [costEstimate]="store.costEstimate()!"
        [specialPriceEnabled]="store.specialPriceEnabled()"
        [projectedBalance]="store.projectedBalance()"
        [isBalanceNegative]="store.isProjectedBalanceNegative()"
      />
      <app-rental-balance-warning (topUpRequested)="onTopUpRequested()" />
    </div>

    <div class="fixed bottom-0 left-0 right-0 flex flex-col gap-2 bg-white p-4 shadow-md">
      <app-rental-activate-button
        [disabled]="!store.isBalanceSufficient()"
        [loading]="store.isActivating()"
        (activateRequested)="onActivateRequested()"
      />
      <button mat-button (click)="stepBack.emit()">
        <mat-icon>arrow_back</mat-icon>
        {{ Labels.Back }}
      </button>
    </div>
  `,
})
export class RentalStep3Component {
  protected readonly Labels = Labels;
  protected readonly store = inject(RentalStore);

  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly stepBack = output<void>();

  protected onActivateRequested(): void {
    this.store
      .activateRental()
      .pipe(
        tap(() => {
          this.store.reset();
          this.snackBar.open(Labels.RentalStarted, Labels.Close, { duration: 3000 });
          this.router.navigate(['/dashboard']);
        }),
        catchError(() => {
          this.snackBar.open(Labels.RentalStartError, Labels.Close, { duration: 4000 });
          return of(undefined);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  protected onTopUpRequested(): void {
    // TODO (FR-07): Open TopUpDialogComponent once it is available in @bikerental/shared.
    // this.dialog
    //   .open(TopUpDialogComponent, { data: { customerId: this.store.customer()?.id }, disableClose: true })
    //   .afterClosed()
    //   .pipe(takeUntilDestroyed(this.destroyRef))
    //   .subscribe((result) => {
    //     if (result === true) this.store.refreshCustomerBalance();
    //   });
  }
}
```

## 4. Validation Steps

```bash
npx ng build operator --configuration=development
```
