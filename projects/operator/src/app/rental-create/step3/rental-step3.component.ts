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
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { catchError, of, tap } from 'rxjs';
import {
  Labels,
  RentalStore,
  RentalValidationStore,
  TopUpDialogComponent,
} from '@bikerental/shared';
import { RentalActivateButtonComponent } from './rental-activate-button.component';
import { RentalBalanceWarningComponent } from './rental-balance-warning.component';
import { RentalSummaryComponent } from './rental-summary.component';

@Component({
  selector: 'app-rental-step3',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButton,
    MatIcon,
    RentalSummaryComponent,
    RentalBalanceWarningComponent,
    RentalActivateButtonComponent,
  ],
  template: `
    <div class="flex flex-col gap-6">
      <app-rental-summary
        [customer]="store.customer()!"
        [durationMinutes]="store.durationMinutes()"
        [equipmentItems]="store.equipmentItems()"
        [specialPriceEnabled]="store.specialPriceEnabled()"
        [isBalanceNegative]="!validationStore.isBalanceSufficient()"
        [costEstimate]="validationStore.estimate()!"
        [projectedBalance]="validationStore.projectedBalance()"
      />

      <app-rental-balance-warning (topUpRequested)="onTopUpRequested()" />
    </div>

    <div class="bg-white p-4 shadow-md">
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

  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly viewContainerRef = inject(ViewContainerRef);

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
