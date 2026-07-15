import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  output,
  signal,
  ViewContainerRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { interval } from 'rxjs';
import type { RentalEquipmentItem } from '@bikerental/shared';
import {
  ApiErrorParser,
  CustomerFinanceStore,
  EquipmentUnitCardComponent,
  EquipmentUnitViewModelMapper,
  ErrorCode,
  ErrorMessageResolver,
  Labels,
  MOBILE_FORM_DIALOG_CONFIG,
  NotificationService,
  PageHeaderComponent,
  RentalStore,
  ReturnEquipmentCostStore,
  TimeStore,
  TopUpDialogComponent,
  WithdrawDialogComponent,
} from '@bikerental/shared';
import { RentalCustomerPanelComponent } from '../../rental-create/step2/rental-customer-panel.component';
import { ReturnSettlementSummaryComponent } from './return-settlement-summary.component';

@Component({
  selector: 'app-return-equipment-screen',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ReturnEquipmentCostStore],
  host: { class: 'flex flex-col flex-1 min-h-0' },
  imports: [
    MatButtonModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    EquipmentUnitCardComponent,
    PageHeaderComponent,
    RentalCustomerPanelComponent,
    ReturnSettlementSummaryComponent,
  ],
  template: `
    <app-page-header [title]="Labels.ReturnDialogTitle" (back)="onCancel()" />

    <div class="flex-1 min-h-0 overflow-y-auto px-4 py-3 flex flex-col gap-3">
      <app-rental-customer-panel
        [expanded]="customerExpanded()"
        (toggled)="customerExpanded.set(!customerExpanded())"
        (topUpRequested)="onTopUpRequested()"
        (withdrawRequested)="onWithdrawRequested()"
        (openProfileRequested)="onOpenProfile()"
      />

      <span class="text-sm font-semibold text-slate-600">{{ Labels.ItemsToReturn }}</span>

      <div class="flex flex-col gap-2">
        @for (item of costStore.selectedItems(); track item.id) {
          <app-equipment-unit-card [unit]="unitFor(item)" />
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
    </div>

    <div class="flex justify-end gap-2 px-4 py-3 border-t border-slate-200 bg-white shrink-0">
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
    </div>
  `,
})
export class ReturnEquipmentScreenComponent {
  protected readonly rentalStore = inject(RentalStore);
  protected readonly costStore = inject(ReturnEquipmentCostStore);
  private readonly financeStore = inject(CustomerFinanceStore);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);
  private readonly resolver = inject(ErrorMessageResolver);
  private readonly timeStore = inject(TimeStore);

  readonly completed = output<void>();
  readonly cancelled = output<void>();

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

  protected unitFor(item: RentalEquipmentItem) {
    const breakdown = this.costStore.breakdownByEquipmentId().get(item.id) ?? null;
    return EquipmentUnitViewModelMapper.forRentalItem(
      item,
      breakdown,
      this.rentalStore.startedAt(),
      this.rentalStore.durationMinutes(),
      this.timeStore.getCurrentDate(),
    );
  }

  constructor() {
    interval(1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.now.set(Date.now()));

    if (this.rentalStore.isFullReturnSelected()) {
      this.costStore.enterQuoteMode();
      this.refreshQuote();
    }
  }

  protected onCancel(): void {
    if (this.isFullReturn()) {
      this.costStore.deleteQuote();
    }
    this.cancelled.emit();
  }

  protected onOpenProfile(): void {
    const customerId = this.rentalStore.customerId();
    if (!customerId) return;
    this.cancelled.emit();
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
        next: () => this.completed.emit(),
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
        next: () => this.completed.emit(),
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
        this.completed.emit();
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
      this.cancelled.emit();
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
