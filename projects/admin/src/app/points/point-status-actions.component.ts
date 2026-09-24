import { ChangeDetectionStrategy, Component, DestroyRef, inject, input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { filter, switchMap } from 'rxjs';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
  Labels,
  PointAdminStore,
} from '@bikerental/shared';
import type { Point, PointStatus } from '@ui-models';
import {
  PointClosureDialogComponent,
  PointClosureDialogData,
} from './point-closure-dialog.component';

@Component({
  selector: 'app-point-status-actions',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule],
  template: `
    <div class="flex flex-wrap items-center gap-2">
      @if (point().status === 'INACTIVE') {
        <button mat-stroked-button [disabled]="saving()" (click)="change('ACTIVE')">
          {{ labels.PointActivate }}
        </button>
      }
      @if (point().status === 'ACTIVE') {
        <button mat-stroked-button [disabled]="saving()" (click)="change('INACTIVE')">
          {{ labels.PointDeactivate }}
        </button>
      }
      @if (point().status !== 'PERMANENTLY_CLOSED') {
        <button mat-stroked-button color="warn" [disabled]="saving()" (click)="closePermanently()">
          {{ labels.PointClosePermanently }}
        </button>
      }
    </div>
  `,
})
export class PointStatusActionsComponent {
  protected readonly labels = Labels;

  readonly point = input.required<Point>();

  private readonly store = inject(PointAdminStore);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly saving = this.store.saving;

  protected change(status: PointStatus): void {
    this.store
      .changeStatus(this.point().id, status)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  protected closePermanently(): void {
    const point = this.point();
    this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
        data: {
          title: Labels.PointCloseConfirmTitle,
          message: Labels.PointCloseConfirmMessage,
          confirmLabel: Labels.PointClosePermanently,
          cancelLabel: Labels.Cancel,
          danger: true,
        },
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(() => this.store.changeStatus(point.id, 'PERMANENTLY_CLOSED')),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) =>
        this.dialog.open<PointClosureDialogComponent, PointClosureDialogData>(
          PointClosureDialogComponent,
          { data: { pointName: point.name, summary: result.closureSummary } },
        ),
      );
  }
}
