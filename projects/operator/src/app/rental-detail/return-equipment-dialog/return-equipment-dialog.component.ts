import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  signal,
  ViewContainerRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { interval } from 'rxjs';
import {
  ApiErrorParser,
  CustomerFinanceStore,
  ErrorCode,
  ErrorMessageResolver,
  Labels,
  MOBILE_FORM_DIALOG_CONFIG,
  NotificationService,
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
        [expanded]="customerExpanded()"
        (toggled)="customerExpanded.set(!customerExpanded())"
        (topUpRequested)="onTopUpRequested()"
        (withdrawRequested)="onWithdrawRequested()"
        (openProfileRequested)="onOpenProfile()"
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
        [heldAmount]="costStore.heldAmount()"
        [cost]="costStore.estimate()"
        [settlement]="costStore.settlement()"
        [isCalculating]="costStore.isCalculating()"
      />

      @if (isFullReturn() && remainingSeconds() !== null) {
        <p class="text-xs text-center text-slate-500">
          {{ Labels.QuoteValidFor }} {{ remainingSeconds() }}{{ Labels.SecondsUnit }}
        </p>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()" [disabled]="rentalStore.isReturning()">
        {{ Labels.Cancel }}
      </button>
      <button
        mat-flat-button
        color="primary"
        (click)="onConfirm()"
        [disabled]="isConfirmDisabled()"
      >
        @if (isBusy()) {
          <mat-spinner diameter="20" />
        } @else {
          {{ isFullReturn() ? Labels.CompleteRentalButton : Labels.ConfirmReturnButton }}
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
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);
  private readonly resolver = inject(ErrorMessageResolver);

  protected readonly Labels = Labels;
  protected readonly customerExpanded = signal(false);

  protected readonly isFullReturn = computed(() => this.rentalStore.isFullReturnSelected());

  private readonly now = signal(Date.now());
  protected readonly remainingSeconds = computed(() => {
    const expiresAt = this.costStore.expiresAt();
    if (!expiresAt) return null;
    return Math.max(0, Math.floor((expiresAt.getTime() - this.now()) / 1000));
  });

  protected readonly isBusy = computed(
    () => this.rentalStore.isReturning() || (this.isFullReturn() && this.costStore.isCalculating()),
  );
  protected readonly isConfirmDisabled = computed(
    () => this.isBusy() || (this.isFullReturn() && !this.costStore.quoteId()),
  );

  constructor() {
    interval(1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.now.set(Date.now()));

    effect(() => {
      const remaining = this.remainingSeconds();
      if (
        remaining === 0 &&
        this.costStore.quoteId() &&
        !this.costStore.isCalculating() &&
        !this.rentalStore.isReturning()
      ) {
        this.refreshQuote();
      }
    });

    if (this.rentalStore.isFullReturnSelected()) {
      this.costStore.enterQuoteMode();
      this.refreshQuote();
    }
  }

  protected onCancel(): void {
    this.dialogRef.close(false);
  }

  protected onOpenProfile(): void {
    const customerId = this.rentalStore.customerId();
    if (!customerId) return;
    this.dialogRef.close(false);
    void this.router.navigate(['/customers', customerId]);
  }

  protected onConfirm(): void {
    if (this.isFullReturn()) {
      this.confirmByQuote();
    } else {
      this.returnPartial();
    }
  }

  private returnPartial(): void {
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

  private confirmByQuote(): void {
    const quoteId = this.costStore.quoteId();
    if (!quoteId) return;
    this.rentalStore
      .confirmReturn(quoteId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.dialogRef.close(true),
        error: (err: unknown) => this.handleConfirmError(err),
      });
  }

  private refreshQuote(): void {
    this.costStore
      .createQuote()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ error: (err: unknown) => this.handleQuoteError(err) });
  }

  private handleConfirmError(err: unknown): void {
    const apiError = ApiErrorParser.parse(err);
    switch (apiError.code) {
      case ErrorCode.TARIFF_QUOTE_EXPIRED:
      case ErrorCode.TARIFF_QUOTE_NOT_FOUND:
      case ErrorCode.RENTAL_QUOTE_MISMATCH:
        this.notifications.warn(this.resolver.resolve(apiError));
        this.refreshQuote();
        break;
      case ErrorCode.TARIFF_QUOTE_ALREADY_CONSUMED:
        this.notifications.info(this.resolver.resolve(apiError));
        this.dialogRef.close(true);
        break;
      default:
        this.notifications.error(this.resolver.resolve(apiError));
    }
  }

  private handleQuoteError(err: unknown): void {
    const apiError = ApiErrorParser.parse(err);
    this.notifications.error(this.resolver.resolve(apiError));
    if (apiError.code === ErrorCode.STATUS_INVALID) {
      const id = this.rentalStore.id();
      if (id !== null) this.rentalStore.loadDetail(id);
      this.dialogRef.close(false);
    }
  }

  protected onTopUpRequested(): void {
    const customerId = this.rentalStore.customerId();
    if (!customerId) return;
    this.dialog
      .open(TopUpDialogComponent, {
        ...MOBILE_FORM_DIALOG_CONFIG,
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
        ...MOBILE_FORM_DIALOG_CONFIG,
        data: { customerId, availableBalance },
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
