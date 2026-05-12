import { ChangeDetectionStrategy, Component, DestroyRef, inject, output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of, tap } from 'rxjs';
import { Labels, RentalStore } from '@bikerental/shared';
import { RentalEquipmentSectionComponent } from './rental-equipment-section.component';
import { RentalPricingSectionComponent } from './rental-pricing-section.component';
import { RentalCostFooterComponent } from './rental-cost-footer.component';
import { RentalCustomerPanelComponent } from './rental-customer-panel.component';
import { RentalDurationControlComponent } from './duration/rental-duration-control.component';

// TopUpDialogComponent is provided by the shared module (FR-07).
// Import it once that task is completed:
// import { TopUpDialogComponent } from '@bikerental/shared';

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
    <!-- Add padding-bottom equal to footer height so content is not obscured -->
    <div class="flex flex-col">
      <app-rental-customer-panel (topUpRequested)="onTopUpRequested()" />
      <app-rental-duration-control />
      <app-rental-equipment-section />
      <app-rental-pricing-section />
    </div>
    <app-rental-cost-footer (nextRequested)="onNext()" (saveDraftRequested)="onSaveDraft()" />
  `,
})
export class RentalStep2Component {
  private readonly store = inject(RentalStore);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly stepAdvanced = output<void>();

  protected onTopUpRequested(): void {
    const customerId = this.store.customer()?.id;
    if (!customerId) return;

    // TODO (FR-07): Replace null with TopUpDialogComponent once it is available in shared.
    // this.dialog
    //   .open(TopUpDialogComponent, { data: { customerId }, disableClose: true })
    //   .afterClosed()
    //   .pipe(takeUntilDestroyed(this.destroyRef))
    //   .subscribe((result) => {
    //     if (result === true) this.store.refreshCustomerBalance();
    //   });
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
