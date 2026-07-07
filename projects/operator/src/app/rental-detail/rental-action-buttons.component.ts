import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  ViewContainerRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
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
import { AddEquipmentDialogComponent } from './add-equipment-dialog/add-equipment-dialog.component';
import { BrokenEquipmentSheetComponent } from './broken-equipment-sheet.component';
import { CancelRentalDialogComponent } from './cancel-rental-dialog.component';
import { ReturnEquipmentDialogComponent } from './return-equipment-dialog/return-equipment-dialog.component';
import { SigningFlowService } from '../rental-signing/signing-flow.service';

@Component({
  selector: 'app-rental-action-buttons',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatProgressSpinnerModule],
  template: `
    <div class="flex flex-col gap-2 px-4 py-3 border-t border-slate-200 bg-white shrink-0">
      @if (store.isActive()) {
        <div class="flex gap-2">
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
              {{ Labels.ReturnEquipmentButton }} ({{ store.selectedEquipmentCount() }})
            }
          </button>
          <button
            mat-flat-button
            class="flex-1 !bg-green-600 !text-white"
            (click)="onAddEquipment()"
          >
            {{ Labels.AddEquipmentButton }}
          </button>
        </div>

        <div class="flex gap-2">
          <button
            mat-stroked-button
            class="flex-1 !text-red-600 !border-red-400"
            (click)="onBroken()"
          >
            🔧 {{ Labels.BrokenEquipment }}
          </button>
          <button
            mat-flat-button
            class="flex-1 !bg-amber-400 !text-white"
            [disabled]="store.isSaving()"
            (click)="onCancel()"
          >
            {{ Labels.CancelRental }}
          </button>
        </div>
      }

      @if (store.isDebt()) {
        <button
          mat-stroked-button
          class="w-full !text-red-600 !border-red-400"
          (click)="onBroken()"
        >
          🔧 {{ Labels.BrokenEquipment }}
        </button>
      }

      @if (store.isAwaitingSignature()) {
        <div class="flex gap-2">
          <button mat-stroked-button class="flex-1" (click)="onCancelSigning()">
            {{ Labels.CancelSigning }}
          </button>
          <button mat-flat-button color="primary" class="flex-1" (click)="onContinueSigning()">
            {{ Labels.ContinueSigning }}
          </button>
        </div>
        <button
          mat-flat-button
          class="w-full !bg-amber-400 !text-white"
          [disabled]="store.isSaving()"
          (click)="onCancel()"
        >
          {{ Labels.CancelRental }}
        </button>
      }
    </div>
  `,
})
export class RentalActionButtonsComponent {
  protected readonly store = inject(RentalStore);
  private readonly dialog = inject(MatDialog);
  private readonly bottomSheet = inject(MatBottomSheet);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly signingFlow = inject(SigningFlowService);
  private readonly notifications = inject(NotificationService);
  private readonly resolver = inject(ErrorMessageResolver);

  protected readonly Labels = Labels;

  protected readonly isReturnDisabled = computed(
    () => this.store.selectedEquipmentCount() === 0 || this.store.isReturning(),
  );

  protected onReturn(): void {
    if (this.store.selectedEquipmentCount() === 0) return;

    this.dialog
      .open(ReturnEquipmentDialogComponent, {
        viewContainerRef: this.viewContainerRef,
        disableClose: true,
        width: '480px',
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed: boolean | undefined) => {
        if (!confirmed) return;
        this.snackBar.open(Labels.RentalReturnSuccess, undefined, { duration: 3000 });
        this.store.clearSelection();
        const id = this.store.id();
        if (id !== null) this.store.loadDetail(id);
      });
  }

  protected onAddEquipment(): void {
    this.dialog
      .open(AddEquipmentDialogComponent, {
        viewContainerRef: this.viewContainerRef,
        disableClose: true,
        width: '480px',
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed: boolean | undefined) => {
        if (!confirmed) return;
        this.snackBar.open(Labels.RentalAddEquipmentSuccess, undefined, { duration: 3000 });
      });
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

  protected onContinueSigning(): void {
    const id = this.store.id();
    const version = this.store.version();
    if (id === null || version === null) return;

    this.signingFlow
      .openDialog(id, version, this.viewContainerRef)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((outcome) => {
        if (outcome === 'signed') {
          this.store.loadDetail(id);
          this.notifications.success(Labels.AgreementSignedSuccess);
        } else if (outcome === 'failed') {
          this.store.loadDetail(id);
        }
      });
  }

  protected onCancelSigning(): void {
    this.store.cancelSigning().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }
}
