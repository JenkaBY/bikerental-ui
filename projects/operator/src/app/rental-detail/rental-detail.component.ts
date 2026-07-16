import { DatePipe, Location } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
  ViewContainerRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import {
  BatchRentalPropertyStore,
  CustomerFinanceStore,
  DurationPipe,
  Labels,
  mapRentalStatus,
  MOBILE_FORM_DIALOG_CONFIG,
  MoneyPipe,
  PageHeaderComponent,
  RENTAL_STORE_TOKEN,
  RentalCostCalculationStore,
  RentalSignatureStore,
  RentalStore,
  RentalTransactionsStore,
  TopUpDialogComponent,
  WithdrawDialogComponent,
} from '@bikerental/shared';
import { RentalCustomerPanelComponent } from '../rental-create/step2/rental-customer-panel.component';
import { RentalReservedPanelComponent } from '../rental-create/step2/rental-reserved-panel.component';
import { RentalActionButtonsComponent } from './rental-action-buttons.component';
import { ReturnEquipmentScreenComponent } from './return-equipment-screen/return-equipment-screen.component';
import { RentalPeriodSectionComponent } from './rental-period-section.component';
import { RentalCostSectionComponent } from './rental-cost-section.component';
import { RentalEquipmentSectionComponent } from './rental-equipment-section.component';

@Component({
  selector: 'app-rental-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    RentalStore,
    CustomerFinanceStore,
    BatchRentalPropertyStore,
    RentalCostCalculationStore,
    RentalTransactionsStore,
    { provide: RENTAL_STORE_TOKEN, useExisting: RentalStore },
    RentalSignatureStore,
  ],
  imports: [
    DatePipe,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MatProgressSpinnerModule,
    PageHeaderComponent,
    RentalCustomerPanelComponent,
    RentalReservedPanelComponent,
    RentalActionButtonsComponent,
    ReturnEquipmentScreenComponent,
    RentalPeriodSectionComponent,
    RentalCostSectionComponent,
    RentalEquipmentSectionComponent,
    MoneyPipe,
    DurationPipe,
  ],
  template: `
    <div class="flex flex-col h-[calc(100%+2rem)] -m-4">
      @if (returnMode()) {
        <app-return-equipment-screen
          (completed)="onReturnCompleted()"
          (cancelled)="returnMode.set(false)"
        />
      } @else {
        <app-page-header [title]="Labels.RentalPrefix + rentalId()" (back)="onBack()">
          <div actions class="flex items-center gap-2">
            @if (signatureStore.summary()) {
              <button
                mat-icon-button
                [disabled]="signatureStore.isDownloading()"
                (click)="signatureStore.downloadPdf(rentalId())"
                [attr.aria-label]="Labels.AgreementPdf"
                [title]="Labels.AgreementPdf"
              >
                @if (signatureStore.isDownloading()) {
                  <mat-spinner diameter="18" />
                } @else {
                  <mat-icon>picture_as_pdf</mat-icon>
                }
              </button>
            }
            <span [class]="statusBadgeClasses()">{{ statusLabel() }}</span>
          </div>
        </app-page-header>

        @if (store.isActive() && store.isOverdue()) {
          <div
            class="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-2 text-amber-700 text-sm shrink-0"
          >
            <mat-icon class="!text-base">warning_amber</mat-icon>
            <span>
              {{ Labels.OverdueBy }} {{ store.overdueMinutes() | duration }}
              @if (store.expectedReturnAt(); as returnAt) {
                &nbsp;&middot;&nbsp;{{ Labels.Expected }} {{ returnAt | date: 'HH:mm' }}
              }
            </span>
          </div>
        }

        @if (store.isDebt()) {
          <div
            class="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-2 text-amber-700 text-sm shrink-0"
          >
            <mat-icon class="!text-base">warning_amber</mat-icon>
            <span>
              @if (store.debtAmount(); as debt) {
                {{ debt | money }}&nbsp;&middot;&nbsp;
              }
              {{ Labels.DebtAutoCharge }}
            </span>
          </div>
        }

        @if (store.isLoading()) {
          <div class="flex justify-center py-8">
            <mat-spinner diameter="40" />
          </div>
        } @else if (store.loadError()) {
          <div class="flex flex-col items-center gap-4 py-8 px-4">
            <p class="text-slate-500 text-sm">{{ Labels.CustomerRentalDetailLoadError }}</p>
            <button mat-button (click)="store.loadDetail(rentalId())">{{ Labels.Retry }}</button>
          </div>
        } @else if (store.id() !== null) {
          <div class="flex-1 min-h-0 overflow-y-auto px-4 py-3 flex flex-col">
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
            <div>
              <app-rental-period-section />
              <mat-divider />
              <app-rental-cost-section />
              <mat-divider />
              <app-rental-equipment-section
                [equipmentItems]="store.rentalEquipmentItems()"
                [isDebt]="store.isDebt()"
              />
            </div>
          </div>

          <app-rental-action-buttons (returnRequested)="returnMode.set(true)" />
        }
      }
    </div>
  `,
})
export class RentalDetailComponent {
  protected readonly store = inject(RentalStore);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly financeStore = inject(CustomerFinanceStore);
  private readonly transactionsStore = inject(RentalTransactionsStore);
  private readonly destroyRef = inject(DestroyRef);
  private readonly viewContainerRef = inject(ViewContainerRef);
  protected readonly signatureStore = inject(RentalSignatureStore);

  readonly id = input.required<string>();
  readonly selectUid = input<string>();

  readonly rentalId = computed(() => Number(this.id()));

  private preselectApplied = false;

  protected readonly Labels = Labels;

  protected readonly openPanel = signal<'customer' | 'reserved' | null>(null);
  protected readonly returnMode = signal(false);

  protected onReturnCompleted(): void {
    this.returnMode.set(false);
    this.snackBar.open(Labels.RentalReturnSuccess, undefined, { duration: 3000 });
    this.store.clearSelection();
    const id = this.store.id();
    if (id !== null) this.store.loadDetail(id);
  }

  protected togglePanel(panel: 'customer' | 'reserved'): void {
    this.openPanel.update((current) => (current === panel ? null : panel));
  }

  readonly statusBadgeClasses = computed(
    () =>
      `text-xs font-medium px-2 py-1 rounded-full ${mapRentalStatus(this.store.status()).badgeClasses}`,
  );

  readonly statusLabel = computed(() => mapRentalStatus(this.store.status()).label);

  constructor() {
    effect(() => {
      const id = this.rentalId();
      if (!isNaN(id) && id > 0) {
        this.store.loadDetail(id);
      }
    });

    effect(() => {
      if (this.store.isLoading() || this.store.loadError() || this.store.id() === null) return;
      if (this.store.isDraft()) {
        void this.router.navigate(['/rentals', this.store.id(), 'edit']);
        return;
      }
      if (this.store.isAwaitingSignature()) {
        void this.router.navigate(['/rentals', this.store.id(), 'agreement']);
      }
    });

    effect(() => {
      const status = this.store.status();
      const id = this.store.id();
      if (id === null) return;
      if (status === 'ACTIVE' || status === 'COMPLETED' || status === 'DEBT') {
        this.signatureStore.load(id);
      }
    });

    effect(() => {
      const uid = this.selectUid();
      if (!uid || this.preselectApplied) return;
      if (this.store.isLoading() || this.store.id() === null) return;
      const match = this.store.rentalEquipmentItems().find((item) => item.uid === uid);
      if (match) {
        this.store.selectEquipmentItem(match.id);
        this.preselectApplied = true;
      }
    });
  }

  protected onBack(): void {
    const navigationId = (window.history.state as { navigationId?: number } | null)?.navigationId;
    if (navigationId && navigationId > 1) {
      this.location.back();
    } else {
      void this.router.navigate(['/rentals']);
    }
  }

  protected onOpenProfile(): void {
    const customerId = this.store.customerId();
    if (!customerId) return;
    void this.router.navigate(['/customers', customerId]);
  }

  protected onTopUpRequested(): void {
    const customerId = this.store.customerId();
    if (!customerId) return;

    this.dialog
      .open(TopUpDialogComponent, {
        ...MOBILE_FORM_DIALOG_CONFIG,
        data: { customerId, initialAmount: this.debtTopUpAmount() },
        disableClose: true,
        viewContainerRef: this.viewContainerRef,
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result: boolean | undefined) => {
        if (result) {
          this.financeStore.loadById(customerId);
        }
      });
  }

  private debtTopUpAmount(): number | undefined {
    if (!this.store.isDebt()) return undefined;
    const finalCost = this.store.finalCost()?.amount ?? 0;
    const reservedAmount = this.transactionsStore.reserved().amount;
    const actualBalance = this.financeStore.balance()?.available.amount ?? 0;
    const amount = parseFloat((finalCost - reservedAmount - actualBalance).toFixed(2));
    return amount > 0 ? amount : undefined;
  }

  protected onWithdrawRequested(): void {
    const customerId = this.store.customerId();
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
        if (result) {
          this.financeStore.loadById(customerId);
        }
      });
  }
}
