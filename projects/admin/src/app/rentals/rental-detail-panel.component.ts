import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';
import { catchError, EMPTY, exhaustMap, filter, Observable, tap } from 'rxjs';
import {
  ApiErrorParser,
  CardStackComponent,
  ConfirmDialogComponent,
  EquipmentUnitCardComponent,
  EquipmentUnitViewModelMapper,
  ErrorCode,
  ErrorMessageResolver,
  Labels,
  RentalCostCalculationStore,
  LocalTimestampPipe,
  NotificationService,
  RentalAgreementDownloadComponent,
  RentalSignatureStore,
  RentalStatusBadgeComponent,
  RentalStore,
  ShortIdPipe,
  TimeStore,
} from '@bikerental/shared';
import type { ConfirmDialogData, EquipmentUnitViewModel } from '@bikerental/shared';
import { RentalDetailSummaryComponent } from './rental-detail-summary.component';
import { RentalDamageReportsSectionComponent } from './rental-damage-reports-section.component';
import { RentalTransactionsSectionComponent } from './rental-transactions-section.component';

const STALE_CODES = new Set<string>([ErrorCode.STATUS_INVALID, ErrorCode.RESOURCE_NOT_FOUND]);
const STATUSES_WITHOUT_AGREEMENT = new Set(['DRAFT']);

@Component({
  selector: 'app-rental-detail-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    RouterLink,
    LocalTimestampPipe,
    ShortIdPipe,
    CardStackComponent,
    EquipmentUnitCardComponent,
    RentalAgreementDownloadComponent,
    RentalStatusBadgeComponent,
    RentalDetailSummaryComponent,
    RentalDamageReportsSectionComponent,
    RentalTransactionsSectionComponent,
  ],
  template: `
    <section
      class="border border-slate-200 rounded-xl bg-white shadow-sm"
      [attr.aria-label]="Labels.RentalDetailsPanelLabel"
      aria-live="polite"
    >
      @if (store.isLoading()) {
        <mat-progress-bar mode="indeterminate" />
      }

      @if (store.loadError()) {
        <div class="p-6 text-center flex flex-col items-center gap-2">
          <p class="text-slate-500">{{ Labels.RentalDetailsLoadError }}</p>
          <button mat-stroked-button (click)="reload()">{{ Labels.Retry }}</button>
        </div>
      } @else if (store.id(); as rentalId) {
        <div class="p-4 flex flex-col gap-4">
          <div class="flex items-center justify-between gap-2">
            <h2 class="text-base font-semibold text-slate-900" [title]="rentalId">
              {{ Labels.RentalTitle }} {{ rentalId | shortId }}
              <span class="font-normal text-slate-500">
                ({{ store.createdAt() | localTimestamp }})
              </span>
              @if (showOpenLink()) {
                <a
                  mat-icon-button
                  class="icon-btn-sm align-middle"
                  [routerLink]="['/rentals', rentalId]"
                  [attr.aria-label]="Labels.OpenRental"
                  [title]="Labels.OpenRental"
                >
                  <mat-icon class="!text-base">open_in_new</mat-icon>
                </a>
              }
            </h2>
            <div class="flex items-center gap-1">
              <app-rental-agreement-download [rentalId]="rentalId" />
              <app-rental-status-badge [status]="store.status()" />
            </div>
          </div>

          <app-rental-detail-summary />

          <div class="flex flex-col gap-1">
            <span class="text-xs uppercase tracking-wide text-slate-400">
              {{ Labels.Equipment }}
            </span>
            @if (equipmentUnits().length) {
              <app-card-stack variant="inset">
                @for (unit of equipmentUnits(); track $index) {
                  <app-equipment-unit-card [unit]="unit" />
                }
              </app-card-stack>
            } @else {
              <span class="text-sm text-slate-400">&mdash;</span>
            }
          </div>

          <app-rental-damage-reports-section />
          <app-rental-transactions-section />

          @if (store.canWriteOffDebt() || store.canCancel()) {
            <div class="flex gap-2 pt-3 border-t border-slate-100">
              @if (store.canWriteOffDebt()) {
                <button
                  mat-stroked-button
                  class="flex-1 btn-caution"
                  [disabled]="store.isSaving()"
                  (click)="onWriteOff()"
                >
                  {{ Labels.WriteOffDebtButton }}
                </button>
              }
              @if (store.canCancel()) {
                <button
                  mat-stroked-button
                  class="flex-1 !text-red-600 !border-red-400"
                  [disabled]="store.isSaving()"
                  (click)="onCancel()"
                >
                  {{ Labels.CancelRental }}
                </button>
              }
            </div>
          }
        </div>
      } @else if (!store.isLoading()) {
        <p class="p-6 text-center text-sm text-slate-400">{{ Labels.RentalDetailsEmptyState }}</p>
      }
    </section>
  `,
})
export class RentalDetailPanelComponent {
  protected readonly Labels = Labels;
  protected readonly store = inject(RentalStore);

  private readonly signatureStore = inject(RentalSignatureStore);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
  private readonly notifications = inject(NotificationService);
  private readonly resolver = inject(ErrorMessageResolver);
  private readonly timeStore = inject(TimeStore);
  private readonly costStore = inject(RentalCostCalculationStore);

  readonly showOpenLink = input(false);

  readonly actionCompleted = output<void>();

  protected readonly equipmentUnits = computed<EquipmentUnitViewModel[]>(() => {
    const now = this.timeStore.getCurrentDate();
    const startedAt = this.store.startedAt();
    const plannedDurationMinutes = this.store.durationMinutes();
    const breakdowns = this.costStore.breakdowns();
    return this.store
      .rentalEquipmentItems()
      .map((item) =>
        EquipmentUnitViewModelMapper.forRentalItem(
          item,
          breakdowns.find((b) => b.equipmentId === item.id) ?? null,
          startedAt,
          plannedDurationMinutes,
          now,
        ),
      );
  });

  constructor() {
    effect(() => {
      const id = this.store.id();
      const status = this.store.status();
      if (id === null || !status || STATUSES_WITHOUT_AGREEMENT.has(status)) return;
      this.signatureStore.load(id);
    });
  }

  protected reload(): void {
    const id = this.store.id();
    if (id !== null) this.store.loadDetail(id);
  }

  protected onWriteOff(): void {
    this.runAction(
      {
        title: Labels.WriteOffDebtDialogTitle,
        message: Labels.WriteOffDebtDialogMessage,
        confirmLabel: Labels.WriteOffDebtConfirmButton,
        cancelLabel: Labels.Cancel,
        danger: true,
      },
      () => this.store.writeOffDebt(),
      Labels.WriteOffDebtSuccess,
    );
  }

  protected onCancel(): void {
    this.runAction(
      {
        title: Labels.CancelRental,
        message: Labels.CancelRentalConfirmation,
        confirmLabel: Labels.YesCancel,
        cancelLabel: Labels.KeepRental,
        danger: true,
      },
      () => this.store.cancelRental(),
      Labels.RentalCancelSuccess,
    );
  }

  private runAction(
    data: ConfirmDialogData,
    action: () => Observable<void>,
    successMessage: string,
  ): void {
    this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, { data })
      .afterClosed()
      .pipe(
        filter((confirmed): confirmed is true => !!confirmed),
        exhaustMap(() =>
          action().pipe(
            tap(() => {
              this.notifications.success(successMessage);
              this.reload();
              this.actionCompleted.emit();
            }),
            catchError((err: unknown) => {
              this.handleError(err);
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private handleError(err: unknown): void {
    const apiError = ApiErrorParser.parse(err);
    const message = this.resolver.resolve(apiError);
    if (STALE_CODES.has(apiError.code)) {
      this.notifications.warn(message);
      this.reload();
      this.actionCompleted.emit();
      return;
    }
    this.notifications.error(message);
  }
}
