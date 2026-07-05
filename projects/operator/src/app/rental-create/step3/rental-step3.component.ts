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
  RentalStore,
  RentalValidationStore,
  resolveErrorMessage,
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
          return this.store.loadDetail$(id, { silent: true }).pipe(
            switchMap(() =>
              this.signingFlow.openDialog(id, version, this.viewContainerRef).pipe(
                switchMap((outcome) => {
                  const rentalId = this.store.id();
                  if (rentalId === null) return of(null);
                  if (outcome === 'signed') {
                    this.store.loadDetail(rentalId);
                    this.notifications.success(Labels.AgreementSignedSuccess);
                    this.store.reset();
                    void this.router.navigate(['/rentals', rentalId]);
                    return of(null);
                  }
                  if (outcome === 'cancelled') {
                    return this.store.cancelSigning();
                  }
                  this.store.loadDetail(rentalId);
                  return of(null);
                }),
              ),
            ),
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
