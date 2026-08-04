import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  output,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { catchError, EMPTY, exhaustMap, filter, tap } from 'rxjs';
import type { DamageReport } from '@ui-models';
import {
  ApiErrorParser,
  ErrorMessageResolver,
  Labels,
  NotificationService,
  RentalDetailRefreshFacade,
  RentalStore,
} from '@bikerental/shared';
import type { ReportDamageResult } from './report-damage-sheet.component';
import { ReportDamageSheetComponent } from './report-damage-sheet.component';
import { CancelRentalDialogComponent } from './cancel-rental-dialog.component';

@Component({
  selector: 'app-rental-action-buttons',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatProgressSpinnerModule],
  template: `
    <div class="flex flex-col gap-2 px-4 py-3 border-t border-slate-200 bg-white shrink-0">
      @if (store.isActive()) {
        <div class="flex gap-2">
          <button
            mat-stroked-button
            class="flex-1 !text-red-600 !border-red-400"
            [disabled]="store.isSaving()"
            (click)="onCancel()"
          >
            {{ Labels.Cancel }}
          </button>
          <button mat-stroked-button class="flex-1" (click)="onReportDamage()">
            {{ Labels.BrokenEquipment }}
          </button>
          <button
            mat-flat-button
            color="primary"
            class="flex-1"
            [disabled]="isReturnDisabled()"
            (click)="onReturn()"
          >
            @if (store.isReturning()) {
              <mat-spinner diameter="20" />
            } @else {
              {{ store.isFullReturnSelected() ? Labels.CalculateButton : Labels.ReturnButton }}
            }
          </button>
        </div>
      } @else if (store.isDebt()) {
        <button
          mat-stroked-button
          class="w-full !text-red-600 !border-red-400"
          (click)="onReportDamage()"
        >
          {{ Labels.BrokenEquipment }}
        </button>
      } @else {
        <button mat-stroked-button class="w-full" (click)="onReportDamage()">
          {{ Labels.BrokenEquipment }}
        </button>
      }
    </div>
  `,
})
export class RentalActionButtonsComponent {
  protected readonly store = inject(RentalStore);
  private readonly dialog = inject(MatDialog);
  private readonly bottomSheet = inject(MatBottomSheet);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly notifications = inject(NotificationService);
  private readonly resolver = inject(ErrorMessageResolver);
  private readonly refresh = inject(RentalDetailRefreshFacade);

  readonly returnRequested = output<void>();

  protected readonly Labels = Labels;

  protected readonly isReturnDisabled = computed(
    () => this.store.selectedEquipmentCount() === 0 || this.store.isReturning(),
  );

  protected onReturn(): void {
    if (this.store.selectedEquipmentCount() === 0) return;
    this.returnRequested.emit();
  }

  protected onReportDamage(): void {
    const rentalId = this.store.id();
    if (rentalId === null) return;
    this.bottomSheet
      .open(ReportDamageSheetComponent, {
        data: {
          rentalId,
          operatorId: this.store.operatorId(),
          equipmentItems: this.store.rentalEquipmentItems(),
        },
      })
      .afterDismissed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result: ReportDamageResult) => {
        if (result) this.onDamageReportCreated(result.report);
      });
  }

  private onDamageReportCreated(report: DamageReport): void {
    this.refresh.refreshAll();
    const penalty = report.penalty;
    if (!penalty) {
      this.notifications.success(Labels.DamageReportCreatedSuccess);
    } else if (penalty.isSettled) {
      this.notifications.success(Labels.DamageReportPenaltyChargedSuccess);
    } else {
      this.notifications.info(Labels.DamageReportPenaltyPendingInfo);
    }
  }

  protected onCancel(): void {
    this.dialog
      .open(CancelRentalDialogComponent, { disableClose: false })
      .afterClosed()
      .pipe(
        filter((confirmed): confirmed is true => !!confirmed),
        exhaustMap(() =>
          this.store.cancelRental().pipe(
            tap(() => {
              this.notifications.success(Labels.RentalCancelSuccess);
              this.router.navigate(['/rentals']);
            }),
            catchError((err: unknown) => {
              this.notifications.error(this.resolver.resolve(ApiErrorParser.parse(err)));
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
}
