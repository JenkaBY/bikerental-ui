import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  ViewContainerRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  CustomerFinanceStore,
  Labels,
  RentalStore,
  ReturnEquipmentCostStore,
  TopUpDialogComponent,
  WithdrawDialogComponent,
} from '@bikerental/shared';
import { RentalCustomerPanelComponent } from '../../rental-create/step2/rental-customer-panel.component';
import { ReturnEquipmentItemRowComponent } from './return-equipment-item-row.component';
import { ReturnSettlementSummaryComponent } from './return-settlement-summary.component';

@Component({
  selector: 'app-return-equipment-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ReturnEquipmentCostStore],
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    RentalCustomerPanelComponent,
    ReturnEquipmentItemRowComponent,
    ReturnSettlementSummaryComponent,
  ],
  template: `
    <h2 mat-dialog-title>{{ Labels.ReturnDialogTitle }}</h2>

    <mat-dialog-content class="flex flex-col gap-3 pt-1">
      <app-rental-customer-panel
        (topUpRequested)="onTopUpRequested()"
        (withdrawRequested)="onWithdrawRequested()"
      />

      <span class="text-sm font-semibold text-slate-600">{{ Labels.ItemsToReturn }}</span>

      <div class="flex flex-col rounded-lg border border-slate-200">
        @for (item of costStore.selectedItems(); track item.id) {
          <app-return-equipment-item-row
            [item]="item"
            [breakdown]="costStore.breakdownByEquipmentId().get(item.id) ?? null"
            [isCalculating]="costStore.isCalculating()"
          />
        }
      </div>

      <mat-divider />

      <app-return-settlement-summary
        [totalEstimated]="costStore.totalEstimated()"
        [totalCurrent]="costStore.totalCurrent()"
        [settlement]="costStore.settlement()"
        [isCalculating]="costStore.isCalculating()"
      />
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()" [disabled]="rentalStore.isReturning()">
        {{ Labels.Cancel }}
      </button>
      <button
        mat-flat-button
        color="primary"
        (click)="onConfirm()"
        [disabled]="rentalStore.isReturning()"
      >
        @if (rentalStore.isReturning()) {
          <mat-spinner diameter="20" />
        } @else {
          {{ Labels.ConfirmReturnButton }}
        }
      </button>
    </mat-dialog-actions>
  `,
})
export class ReturnEquipmentDialogComponent {
  protected readonly rentalStore = inject(RentalStore);
  protected readonly costStore = inject(ReturnEquipmentCostStore);
  private readonly financeStore = inject(CustomerFinanceStore);
  private readonly dialogRef = inject(MatDialogRef) as MatDialogRef<
    ReturnEquipmentDialogComponent,
    boolean
  >;
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly viewContainerRef = inject(ViewContainerRef);

  protected readonly Labels = Labels;

  protected onCancel(): void {
    this.dialogRef.close(false);
  }

  protected onConfirm(): void {
    this.rentalStore
      .returnEquipment()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.dialogRef.close(true),
        error: () => {
          this.snackBar.open(Labels.RentalReturnError, Labels.Close, { duration: 5000 });
        },
      });
  }

  protected onTopUpRequested(): void {
    const customerId = this.rentalStore.customerId();
    if (!customerId) return;
    this.dialog
      .open(TopUpDialogComponent, {
        data: { customerId },
        disableClose: true,
        viewContainerRef: this.viewContainerRef,
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result: boolean | undefined) => {
        if (result) this.financeStore.loadById(customerId);
      });
  }

  protected onWithdrawRequested(): void {
    const customerId = this.rentalStore.customerId();
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
      .subscribe((result: boolean | undefined) => {
        if (result) this.financeStore.loadById(customerId);
      });
  }
}
