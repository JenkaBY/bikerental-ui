import { DatePipe, Location } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  ViewContainerRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import {
  AgreementSigningStore,
  BatchRentalPropertyStore,
  CustomerFinanceStore,
  DurationPipe,
  Labels,
  mapRentalStatus,
  RENTAL_STORE_TOKEN,
  RentalSignatureStore,
  RentalStore,
  TopUpDialogComponent,
  MoneyPipe,
  WithdrawDialogComponent,
} from '@bikerental/shared';
import { SigningFlowService } from '../rental-signing/signing-flow.service';
import { RentalCustomerPanelComponent } from '../rental-create/step2/rental-customer-panel.component';
import { RentalActionButtonsComponent } from './rental-action-buttons.component';
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
    { provide: RENTAL_STORE_TOKEN, useExisting: RentalStore },
    AgreementSigningStore,
    SigningFlowService,
    RentalSignatureStore,
  ],
  imports: [
    DatePipe,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RentalCustomerPanelComponent,
    RentalActionButtonsComponent,
    RentalPeriodSectionComponent,
    RentalCostSectionComponent,
    RentalEquipmentSectionComponent,
    MoneyPipe,
    DurationPipe,
  ],
  template: `
    <div class="flex flex-col h-full">
      <div class="flex items-center justify-between px-4 py-3 border-b border-slate-200 shrink-0">
        <div class="flex items-center gap-2 min-w-0">
          <button mat-icon-button (click)="onBack()" [attr.aria-label]="Labels.GoBack">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <h1 class="text-lg font-semibold text-slate-800 truncate">
            {{ Labels.RentalPrefix }}{{ rentalId() }}
          </h1>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          @if (signatureStore.summary()) {
            <button
              mat-flat-button
              class="btn-utility"
              [disabled]="signatureStore.isDownloading()"
              (click)="signatureStore.downloadPdf(rentalId())"
            >
              @if (signatureStore.isDownloading()) {
                <mat-spinner diameter="18" />
              } @else {
                {{ Labels.AgreementPdf }}
              }
            </button>
          }
          <span [class]="statusBadgeClasses()">{{ statusLabel() }}</span>
        </div>
      </div>

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
        <div class="flex-1 overflow-y-auto">
          <app-rental-customer-panel
            (topUpRequested)="onTopUpRequested()"
            (withdrawRequested)="onWithdrawRequested()"
          />
          <mat-divider />
          <app-rental-period-section />
          <mat-divider />
          <app-rental-cost-section />
          <mat-divider />

          <app-rental-equipment-section
            [equipmentItems]="store.rentalEquipmentItems()"
            [isDebt]="store.isDebt()"
            [disabled]="store.isAwaitingSignature()"
          />
        </div>

        <app-rental-action-buttons />
      }
    </div>
  `,
})
export class RentalDetailComponent {
  protected readonly store = inject(RentalStore);
  private readonly location = inject(Location);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly financeStore = inject(CustomerFinanceStore);
  private readonly destroyRef = inject(DestroyRef);
  private readonly viewContainerRef = inject(ViewContainerRef);
  protected readonly signatureStore = inject(RentalSignatureStore);

  readonly id = input.required<string>();
  readonly selectUid = input<string>();

  readonly rentalId = computed(() => Number(this.id()));

  private preselectApplied = false;

  protected readonly Labels = Labels;

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
    this.location.back();
  }

  protected onTopUpRequested(): void {
    const customerId = this.store.customerId();
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
        if (result) {
          this.financeStore.loadById(customerId);
        }
      });
  }

  protected onWithdrawRequested(): void {
    const customerId = this.store.customerId();
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
        if (result) {
          this.financeStore.loadById(customerId);
        }
      });
  }
}
