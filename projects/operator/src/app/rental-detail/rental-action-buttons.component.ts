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
import type { BrokenEquipmentEntry } from '@ui-models';
import {
  ApiErrorParser,
  ErrorMessageResolver,
  Labels,
  NotificationService,
  RentalStore,
} from '@bikerental/shared';
import { BrokenEquipmentSheetComponent } from './broken-equipment-sheet.component';
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
            {{ Labels.CancelRental }}
          </button>
          <button mat-stroked-button class="flex-1" (click)="onBroken()">
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
      }

      @if (store.isDebt()) {
        <button
          mat-stroked-button
          class="w-full !text-red-600 !border-red-400"
          (click)="onBroken()"
        >
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

  readonly returnRequested = output<void>();

  protected readonly Labels = Labels;

  protected readonly isReturnDisabled = computed(
    () => this.store.selectedEquipmentCount() === 0 || this.store.isReturning(),
  );

  protected onReturn(): void {
    if (this.store.selectedEquipmentCount() === 0) return;
    this.returnRequested.emit();
  }

  protected onBroken(): void {
    this.bottomSheet
      .open(BrokenEquipmentSheetComponent, {
        data: {
          equipmentItems: this.store.rentalEquipmentItems(),
          existingEntries: this.store.brokenEquipmentEntries(),
        },
      })
      .afterDismissed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((entries: BrokenEquipmentEntry[] | undefined) => {
        if (entries !== undefined) {
          this.store.setBrokenEquipmentEntries(entries);
        }
      });
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
