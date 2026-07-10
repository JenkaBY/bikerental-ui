import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
  ViewContainerRef,
} from '@angular/core';
import { Location } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, EMPTY, exhaustMap, filter, of, tap } from 'rxjs';
import {
  ApiErrorParser,
  CustomerFinanceStore,
  Labels,
  MOBILE_FORM_DIALOG_CONFIG,
  NotificationService,
  RentalStore,
  RentalValidationStore,
  resolveErrorMessage,
  TopUpDialogComponent,
  WithdrawDialogComponent,
} from '@bikerental/shared';
import { CancelRentalDialogComponent } from '../../rental-detail/cancel-rental-dialog.component';
import { RentalCustomerPanelComponent } from './rental-customer-panel.component';
import { RentalReservedPanelComponent } from './rental-reserved-panel.component';
import { RentalDurationControlComponent } from './duration/rental-duration-control.component';
import { RentalEquipmentSectionComponent } from './rental-equipment-section.component';
import { RentalPricingSectionComponent } from './rental-pricing-section.component';
import { RentalCostFooterComponent } from './rental-cost-footer.component';

@Component({
  selector: 'app-rental-step2',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RentalCustomerPanelComponent,
    RentalReservedPanelComponent,
    RentalDurationControlComponent,
    RentalEquipmentSectionComponent,
    RentalPricingSectionComponent,
    RentalCostFooterComponent,
  ],
  template: `
    <div class="flex flex-col">
      <app-rental-customer-panel
        [expanded]="openPanel() === 'customer'"
        (toggled)="togglePanel('customer')"
        (topUpRequested)="onTopUpRequested()"
        (withdrawRequested)="onWithdrawRequested()"
        (openProfileRequested)="onOpenProfile()"
      />
      <app-rental-reserved-panel
        [expanded]="openPanel() === 'reserved'"
        (toggled)="togglePanel('reserved')"
      />
      <app-rental-duration-control />
      <app-rental-equipment-section
        [items]="store.equipmentItems()"
        (itemAdded)="store.addEquipmentItem($event)"
        (itemRemoved)="store.removeEquipmentItem($event)"
      />
      <app-rental-pricing-section />
    </div>
    <app-rental-cost-footer
      (nextRequested)="onNext()"
      (saveDraftRequested)="onSaveDraft()"
      (topUpRequested)="onTopUpRequested()"
      (cancelRequested)="onCancel()"
    />
  `,
})
export class RentalStep2Component {
  protected readonly store = inject(RentalStore);
  private readonly financeStore = inject(CustomerFinanceStore);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly notifications = inject(NotificationService);
  protected readonly validationStore = inject(RentalValidationStore);

  protected readonly openPanel = signal<'customer' | 'reserved' | null>(null);

  protected togglePanel(panel: 'customer' | 'reserved'): void {
    this.openPanel.update((current) => (current === panel ? null : panel));
  }

  protected onTopUpRequested(): void {
    const customerId = this.store.customer()?.id;
    if (!customerId) return;

    this.dialog
      .open(TopUpDialogComponent, {
        ...MOBILE_FORM_DIALOG_CONFIG,
        data: { customerId, initialAmount: this.validationStore.balanceShortfall()?.amount },
        disableClose: true,
        viewContainerRef: this.viewContainerRef,
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result === true) this.store.refreshCustomerBalance();
      });
  }

  protected onOpenProfile(): void {
    const customerId = this.store.customer()?.id;
    if (!customerId) return;
    void this.router.navigate(['/customers', customerId]);
  }

  protected onWithdrawRequested(): void {
    const customerId = this.store.customer()?.id;
    if (!customerId) return;
    const availableBalance = this.financeStore.balance()?.available;
    this.dialog
      .open(WithdrawDialogComponent, {
        ...MOBILE_FORM_DIALOG_CONFIG,
        data: { customerId, availableBalance },
        disableClose: true,
        viewContainerRef: this.viewContainerRef,
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result === true) this.store.refreshCustomerBalance();
      });
  }

  protected onSaveDraft(): void {
    const wasNew = this.store.id() === null;
    this.store
      .save()
      .pipe(
        tap(() => {
          this.snackBar.open(Labels.DraftSaved, Labels.Close, { duration: 3000 });
          const id = this.store.id();
          if (wasNew && id !== null) this.location.replaceState(`/rentals/${id}/edit`);
        }),
        catchError(() => of(undefined)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  protected onCancel(): void {
    this.dialog
      .open(CancelRentalDialogComponent, { disableClose: false })
      .afterClosed()
      .pipe(
        filter((confirmed): confirmed is true => !!confirmed),
        exhaustMap(() => {
          if (this.store.id() === null) return of(undefined);
          return this.store.cancelRental().pipe(
            tap(() => this.notifications.success(Labels.RentalCancelSuccess)),
            catchError((err: unknown) => {
              const apiError = ApiErrorParser.parse(err);
              this.notifications.error(resolveErrorMessage(apiError));
              return EMPTY;
            }),
          );
        }),
        tap(() => {
          this.store.reset();
          void this.router.navigate(['/rentals']);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  protected onNext(): void {
    const wasNew = this.store.id() === null;
    this.store
      .proceedToSigning()
      .pipe(
        tap((version) => {
          const id = this.store.id();
          if (id === null) return;
          if (wasNew) this.location.replaceState(`/rentals/${id}/edit`);
          void this.router.navigate(['/rentals', id, 'agreement'], { state: { version } });
        }),
        catchError((err: unknown) => {
          const apiError = ApiErrorParser.parse(err);
          this.notifications.error(resolveErrorMessage(apiError));
          return of(undefined);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
}
