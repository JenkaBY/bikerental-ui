import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  output,
  ViewContainerRef,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of, tap } from 'rxjs';
import {
  CustomerFinanceStore,
  Labels,
  RentalStore,
  TopUpDialogComponent,
  WithdrawDialogComponent,
} from '@bikerental/shared';
import { RentalCustomerPanelComponent } from './rental-customer-panel.component';
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
    RentalDurationControlComponent,
    RentalEquipmentSectionComponent,
    RentalPricingSectionComponent,
    RentalCostFooterComponent,
  ],
  template: `
    <div class="flex flex-col">
      <app-rental-customer-panel
        (topUpRequested)="onTopUpRequested()"
        (withdrawRequested)="onWithdrawRequested()"
      />
      <app-rental-duration-control />
      <app-rental-equipment-section
        [items]="store.equipmentItems()"
        (itemAdded)="store.addEquipmentItem($event)"
        (itemRemoved)="store.removeEquipmentItem($event)"
      />
      <app-rental-pricing-section />
    </div>
    <app-rental-cost-footer (nextRequested)="onNext()" (saveDraftRequested)="onSaveDraft()" />
  `,
})
export class RentalStep2Component {
  protected readonly store = inject(RentalStore);
  private readonly financeStore = inject(CustomerFinanceStore);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly viewContainerRef = inject(ViewContainerRef);

  readonly stepAdvanced = output<void>();

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

  protected onWithdrawRequested(): void {
    const customerId = this.store.customer()?.id;
    if (!customerId) return;
    const availableBalance = this.financeStore.balance()?.available;
    this.dialog
      .open(WithdrawDialogComponent, {
        data: { customerId, availableBalance },
        width: '380px',
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
    this.store
      .save()
      .pipe(
        tap(() => this.snackBar.open(Labels.DraftSaved, Labels.Close, { duration: 3000 })),
        catchError(() => of(undefined)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  protected onNext(): void {
    this.store
      .save()
      .pipe(
        tap(() => this.stepAdvanced.emit()),
        catchError(() => of(undefined)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
}
