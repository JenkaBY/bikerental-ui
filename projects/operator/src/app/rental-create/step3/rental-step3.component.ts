import { ChangeDetectionStrategy, Component, DestroyRef, inject, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { catchError, of, tap } from 'rxjs';
import { Labels, RentalStore } from '@bikerental/shared';
import { RentalActivateButtonComponent } from './rental-activate-button.component';
import { RentalBalanceWarningComponent } from './rental-balance-warning.component';
import { RentalSummaryComponent } from './rental-summary.component';

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

      <button mat-button type="button" (click)="stepBack.emit()">
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
    // TODO (FR-07): Open TopUpDialogComponent and refresh customer balance after successful top-up.
  }
}
