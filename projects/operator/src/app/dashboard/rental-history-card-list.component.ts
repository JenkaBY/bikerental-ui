import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { catchError, EMPTY, exhaustMap, filter, Observable, Subject, switchMap, tap } from 'rxjs';
import {
  ApiErrorParser,
  ConfirmDialogComponent,
  ErrorCode,
  ErrorMessageResolver,
  Labels,
  NotificationService,
  RentalListStore,
} from '@bikerental/shared';
import type { ConfirmDialogData } from '@bikerental/shared';
import { RentalCardComponent } from './rental-card.component';

const STALE_RENTAL_CODES = new Set<string>([
  ErrorCode.STATUS_INVALID,
  ErrorCode.RESOURCE_NOT_FOUND,
]);

const WRITE_OFF_CONFIRM_DATA: ConfirmDialogData = {
  title: Labels.WriteOffDebtDialogTitle,
  message: Labels.WriteOffDebtDialogMessage,
  confirmLabel: Labels.WriteOffDebtConfirmButton,
  cancelLabel: Labels.Cancel,
  danger: true,
};

@Component({
  selector: 'app-rental-history-card-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatProgressSpinnerModule, RentalCardComponent],
  template: `
    @if (store.isLoadingHistory()) {
      <div class="flex justify-center py-8">
        <mat-spinner diameter="40" />
      </div>
    } @else if (isEmpty()) {
      <div class="px-4 py-8 text-center text-slate-500 text-sm">
        {{ Labels.NoHistoryRentals }}
      </div>
    } @else {
      <div class="flex flex-col gap-2 px-4 py-2">
        @for (rental of sortedHistoryRentals(); track rental.id) {
          <app-rental-card
            [item]="rental"
            variant="history"
            [isWritingOffDebt]="store.writingOffRentalIds().has(rental.id)"
            (writeOffRequested)="onWriteOffRequested(rental.id)"
          />
        }
      </div>
    }
  `,
})
export class RentalHistoryCardListComponent {
  protected readonly store = inject(RentalListStore);
  private readonly dialog = inject(MatDialog);
  private readonly notifications = inject(NotificationService);
  private readonly resolver = inject(ErrorMessageResolver);
  private readonly writeOffRequests = new Subject<number>();

  protected readonly isEmpty = computed(() => this.store.historyRentals().length === 0);
  protected readonly Labels = Labels;

  readonly sortedHistoryRentals = computed(() =>
    [...this.store.historyRentals()].sort((a, b) => {
      const timeA =
        a.startedAt instanceof Date ? a.startedAt.getTime() : new Date(a.startedAt).getTime();
      const timeB =
        b.startedAt instanceof Date ? b.startedAt.getTime() : new Date(b.startedAt).getTime();
      return timeB - timeA;
    }),
  );

  constructor() {
    this.writeOffRequests
      .pipe(
        exhaustMap((rentalId) => this.confirmAndWriteOff(rentalId)),
        takeUntilDestroyed(),
      )
      .subscribe();
  }

  protected onWriteOffRequested(rentalId: number): void {
    this.writeOffRequests.next(rentalId);
  }

  private confirmAndWriteOff(rentalId: number): Observable<void> {
    return this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
        data: WRITE_OFF_CONFIRM_DATA,
      })
      .afterClosed()
      .pipe(
        filter((confirmed): confirmed is true => !!confirmed),
        switchMap(() => this.store.writeOffDebt(rentalId)),
        tap(() => {
          this.notifications.success(Labels.WriteOffDebtSuccess);
          this.store.reloadHistory();
        }),
        catchError((err: unknown) => {
          this.handleWriteOffError(err);
          return EMPTY;
        }),
      );
  }

  private handleWriteOffError(err: unknown): void {
    const apiError = ApiErrorParser.parse(err);
    const message = this.resolver.resolve(apiError);
    if (STALE_RENTAL_CODES.has(apiError.code)) {
      this.notifications.warn(message);
      this.store.reloadHistory();
      return;
    }
    this.notifications.error(message);
  }
}
