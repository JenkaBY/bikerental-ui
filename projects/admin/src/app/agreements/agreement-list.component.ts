import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
  ViewContainerRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs/operators';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  AgreementTemplateStore,
  ApiErrorParser,
  ConfirmDialogComponent,
  Labels,
  NotificationService,
  resolveErrorMessage,
} from '@bikerental/shared';
import type { AgreementTemplateSortColumn, ConfirmDialogData } from '@bikerental/shared';
import type { AgreementTemplateStatus, AgreementTemplateSummary } from '@ui-models';
import { AgreementDialogComponent, AgreementDialogData } from './agreement-dialog.component';

const STATUS_BADGE_CLASSES: Record<AgreementTemplateStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  ACTIVE: 'bg-green-100 text-green-700',
  DEACTIVATED: 'bg-amber-100 text-amber-700',
};

const STATUS_LABELS: Record<AgreementTemplateStatus, string> = {
  DRAFT: Labels.AgreementStatusDraft,
  ACTIVE: Labels.AgreementStatusActive,
  DEACTIVATED: Labels.AgreementStatusDeactivated,
};

const DIALOG_SIZE = { width: '80vw', maxWidth: '1000px', height: '85vh' } as const;

@Component({
  selector: 'app-agreement-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [AgreementTemplateStore],
  imports: [
    DatePipe,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressBarModule,
  ],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>{{ Labels.AgreementsListTitle }}</mat-card-title>
      </mat-card-header>

      <mat-card-content>
        <div class="flex justify-start mb-2">
          <button mat-raised-button color="primary" (click)="openCreateDialog()">
            <mat-icon>add</mat-icon>
            <span>{{ Labels.NewTemplateButton }}</span>
          </button>
        </div>

        @if (store.isLoading()) {
          <mat-progress-bar mode="indeterminate" />
        }

        @if (!store.isLoading() && store.sortedTemplates().length > 0) {
          <table mat-table [dataSource]="store.sortedTemplates()" class="w-full">
            <ng-container matColumnDef="versionNumber">
              <th mat-header-cell *matHeaderCellDef>
                <button class="flex items-center gap-1" (click)="store.toggleSort('versionNumber')">
                  {{ Labels.AgreementColumnVersion }}
                  <mat-icon class="!text-base">{{ sortIcon('versionNumber') }}</mat-icon>
                </button>
              </th>
              <td mat-cell *matCellDef="let row">{{ row.versionNumber ?? '—' }}</td>
            </ng-container>

            <ng-container matColumnDef="title">
              <th mat-header-cell *matHeaderCellDef>{{ Labels.AgreementColumnTitle }}</th>
              <td mat-cell *matCellDef="let row">{{ row.title }}</td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>{{ Labels.AgreementColumnStatus }}</th>
              <td mat-cell *matCellDef="let row">
                <span
                  class="px-2 py-1 rounded text-xs font-medium"
                  [class]="statusBadgeClass(row.status)"
                >
                  {{ statusLabel(row.status) }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="createdAt">
              <th mat-header-cell *matHeaderCellDef>
                <button class="flex items-center gap-1" (click)="store.toggleSort('createdAt')">
                  {{ Labels.AgreementColumnCreatedAt }}
                  <mat-icon class="!text-base">{{ sortIcon('createdAt') }}</mat-icon>
                </button>
              </th>
              <td mat-cell *matCellDef="let row">{{ row.createdAt | date: 'short' }}</td>
            </ng-container>

            <ng-container matColumnDef="activatedAt">
              <th mat-header-cell *matHeaderCellDef>{{ Labels.AgreementColumnActivatedAt }}</th>
              <td mat-cell *matCellDef="let row">
                {{ row.activatedAt ? (row.activatedAt | date: 'short') : '—' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="deactivatedAt">
              <th mat-header-cell *matHeaderCellDef>{{ Labels.AgreementColumnDeactivatedAt }}</th>
              <td mat-cell *matCellDef="let row">
                {{ row.deactivatedAt ? (row.deactivatedAt | date: 'short') : '—' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>{{ Labels.AgreementColumnActions }}</th>
              <td mat-cell *matCellDef="let row">
                <div class="flex gap-1 items-center">
                  @if (row.status === 'DRAFT') {
                    <button
                      mat-icon-button
                      [matTooltip]="Labels.AgreementEditTooltip"
                      (click)="openEditDialog(row)"
                    >
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button
                      mat-icon-button
                      [disabled]="store.busyIds().has(row.id)"
                      [matTooltip]="Labels.AgreementActivateTooltip"
                      (click)="onActivate(row)"
                    >
                      <mat-icon>check_circle</mat-icon>
                    </button>
                    <button
                      mat-icon-button
                      [disabled]="store.busyIds().has(row.id)"
                      [matTooltip]="Labels.AgreementDeleteTooltip"
                      (click)="onDelete(row)"
                    >
                      <mat-icon>delete</mat-icon>
                    </button>
                  } @else {
                    <button
                      mat-icon-button
                      [matTooltip]="Labels.AgreementViewTooltip"
                      (click)="openViewDialog(row)"
                    >
                      <mat-icon>visibility</mat-icon>
                    </button>
                  }
                  <button
                    mat-icon-button
                    [disabled]="copyingIds().has(row.id)"
                    [matTooltip]="Labels.AgreementCopyTooltip"
                    (click)="onCopy(row)"
                  >
                    <mat-icon>content_copy</mat-icon>
                  </button>
                </div>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let _row; columns: displayedColumns"></tr>
          </table>
        }

        @if (!store.isLoading() && store.sortedTemplates().length === 0) {
          <div class="text-sm text-slate-500 py-6">{{ Labels.AgreementEmptyState }}</div>
        }
      </mat-card-content>
    </mat-card>
  `,
})
export class AgreementListComponent implements OnInit {
  protected readonly Labels = Labels;
  protected readonly store = inject(AgreementTemplateStore);
  protected readonly displayedColumns = [
    'versionNumber',
    'title',
    'status',
    'createdAt',
    'activatedAt',
    'deactivatedAt',
    'actions',
  ];

  private readonly dialog = inject(MatDialog);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly notifications = inject(NotificationService);

  protected readonly copyingIds = signal<ReadonlySet<number>>(new Set());

  ngOnInit(): void {
    this.store.load();
  }

  sortIcon(column: AgreementTemplateSortColumn): string {
    if (this.store.sortColumn() !== column) return 'unfold_more';
    return this.store.sortDirection() === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  statusLabel(status: AgreementTemplateStatus): string {
    return STATUS_LABELS[status];
  }

  statusBadgeClass(status: AgreementTemplateStatus): string {
    return STATUS_BADGE_CLASSES[status];
  }

  openCreateDialog(): void {
    this.openTemplateDialog({});
  }

  openEditDialog(row: AgreementTemplateSummary): void {
    this.openTemplateDialog({ templateId: row.id });
  }

  openViewDialog(row: AgreementTemplateSummary): void {
    this.openTemplateDialog({ templateId: row.id, readonly: true });
  }

  onActivate(row: AgreementTemplateSummary): void {
    this.confirmThen(
      {
        title: Labels.ActivateAgreementDialogTitle,
        message: Labels.ActivateAgreementDialogMessage,
        confirmLabel: Labels.ActivateAgreementConfirmButton,
        cancelLabel: Labels.Cancel,
      },
      () => this.mutate(this.store.activate(row.id), Labels.ActivateAgreementSuccess),
    );
  }

  onDelete(row: AgreementTemplateSummary): void {
    this.confirmThen(
      {
        title: Labels.DeleteAgreementDialogTitle,
        message: Labels.DeleteAgreementDialogMessage,
        confirmLabel: Labels.DeleteAgreementConfirmButton,
        cancelLabel: Labels.Cancel,
        danger: true,
      },
      () => this.mutate(this.store.delete(row.id), Labels.DeleteAgreementSuccess),
    );
  }

  onCopy(row: AgreementTemplateSummary): void {
    this.setCopying(row.id, true);
    this.store
      .getById(row.id)
      .pipe(
        switchMap((template) =>
          this.store.create({ title: template.title, content: template.content }),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (copy) => {
          this.setCopying(row.id, false);
          this.notifications.success(Labels.AgreementCopySuccess);
          this.store.load();
          this.openEditDialog(copy);
        },
        error: (err) => {
          this.setCopying(row.id, false);
          const apiError = ApiErrorParser.parse(err);
          this.notifications.error(resolveErrorMessage(apiError));
        },
      });
  }

  private setCopying(id: number, copying: boolean): void {
    this.copyingIds.update((ids) => {
      const next = new Set(ids);
      if (copying) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }

  private openTemplateDialog(data: AgreementDialogData): void {
    this.dialog
      .open<AgreementDialogComponent, AgreementDialogData, boolean>(AgreementDialogComponent, {
        data,
        ...DIALOG_SIZE,
        viewContainerRef: this.viewContainerRef,
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((saved) => {
        if (saved) this.store.load();
      });
  }

  private confirmThen(data: ConfirmDialogData, action: () => void): void {
    this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, { data })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (confirmed) action();
      });
  }

  private mutate(
    request$: ReturnType<AgreementTemplateStore['activate']>,
    successMessage: string,
  ): void {
    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.notifications.success(successMessage);
        this.store.load();
      },
      error: (err) => {
        const apiError = ApiErrorParser.parse(err);
        this.notifications.error(resolveErrorMessage(apiError));
        if (apiError.status === 409) this.store.load();
      },
    });
  }
}
