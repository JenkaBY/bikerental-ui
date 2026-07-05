import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
  ViewContainerRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
import type { ConfirmDialogData } from '@bikerental/shared';
import type { AgreementTemplateStatus, AgreementTemplateSummary } from '@ui-models';
import { AgreementDialogComponent, AgreementDialogData } from './agreement-dialog.component';

type SortColumn = 'versionNumber' | 'createdAt';
type SortDirection = 'asc' | 'desc';

const STATUS_BADGE_CLASSES: Record<AgreementTemplateStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  ACTIVE: 'bg-green-100 text-green-700',
  DEACTIVATED: 'bg-amber-100 text-amber-700',
};

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

        @if (!store.isLoading() && sortedTemplates().length > 0) {
          <table mat-table [dataSource]="sortedTemplates()" class="w-full">
            <ng-container matColumnDef="versionNumber">
              <th mat-header-cell *matHeaderCellDef>
                <button class="flex items-center gap-1" (click)="toggleSort('versionNumber')">
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
                <button class="flex items-center gap-1" (click)="toggleSort('createdAt')">
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
                      [disabled]="busy()[row.id]"
                      [matTooltip]="Labels.AgreementActivateTooltip"
                      (click)="onActivate(row)"
                    >
                      <mat-icon>check_circle</mat-icon>
                    </button>
                    <button
                      mat-icon-button
                      [disabled]="busy()[row.id]"
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
                </div>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let _row; columns: displayedColumns"></tr>
          </table>
        }

        @if (!store.isLoading() && sortedTemplates().length === 0) {
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
  protected readonly busy = signal<Record<number, boolean>>({});

  private readonly dialog = inject(MatDialog);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly notifications = inject(NotificationService);

  private readonly sortColumn = signal<SortColumn>('createdAt');
  private readonly sortDirection = signal<SortDirection>('desc');

  protected readonly sortedTemplates = computed(() => {
    const column = this.sortColumn();
    const direction = this.sortDirection();
    const factor = direction === 'asc' ? 1 : -1;

    return [...this.store.templates()].sort((a, b) => {
      const av = column === 'versionNumber' ? (a.versionNumber ?? -1) : a.createdAt.getTime();
      const bv = column === 'versionNumber' ? (b.versionNumber ?? -1) : b.createdAt.getTime();
      return (av - bv) * factor;
    });
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.store.load();
  }

  toggleSort(column: SortColumn): void {
    if (this.sortColumn() === column) {
      this.sortDirection.update((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
  }

  sortIcon(column: SortColumn): string {
    if (this.sortColumn() !== column) return 'unfold_more';
    return this.sortDirection() === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  statusLabel(status: AgreementTemplateStatus): string {
    switch (status) {
      case 'DRAFT':
        return Labels.AgreementStatusDraft;
      case 'ACTIVE':
        return Labels.AgreementStatusActive;
      case 'DEACTIVATED':
        return Labels.AgreementStatusDeactivated;
    }
  }

  statusBadgeClass(status: AgreementTemplateStatus): string {
    return STATUS_BADGE_CLASSES[status];
  }

  openCreateDialog(): void {
    this.dialog
      .open<AgreementDialogComponent, AgreementDialogData, boolean>(AgreementDialogComponent, {
        data: {},
        width: '80vw',
        maxWidth: '1000px',
        height: '85vh',
        viewContainerRef: this.viewContainerRef,
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((saved) => {
        if (saved) this.load();
      });
  }

  openEditDialog(row: AgreementTemplateSummary): void {
    this.dialog
      .open<AgreementDialogComponent, AgreementDialogData, boolean>(AgreementDialogComponent, {
        data: { templateId: row.id },
        width: '80vw',
        maxWidth: '1000px',
        height: '85vh',
        viewContainerRef: this.viewContainerRef,
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((saved) => {
        if (saved) this.load();
      });
  }

  openViewDialog(row: AgreementTemplateSummary): void {
    this.dialog.open<AgreementDialogComponent, AgreementDialogData, boolean>(
      AgreementDialogComponent,
      {
        data: { templateId: row.id, readonly: true },
        width: '80vw',
        maxWidth: '1000px',
        height: '85vh',
        viewContainerRef: this.viewContainerRef,
      },
    );
  }

  onActivate(row: AgreementTemplateSummary): void {
    this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
        data: {
          title: Labels.ActivateAgreementDialogTitle,
          message: Labels.ActivateAgreementDialogMessage,
          confirmLabel: Labels.ActivateAgreementConfirmButton,
          cancelLabel: Labels.Cancel,
        },
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (confirmed) this.activate(row.id);
      });
  }

  onDelete(row: AgreementTemplateSummary): void {
    this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
        data: {
          title: Labels.DeleteAgreementDialogTitle,
          message: Labels.DeleteAgreementDialogMessage,
          confirmLabel: Labels.DeleteAgreementConfirmButton,
          cancelLabel: Labels.Cancel,
          danger: true,
        },
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (confirmed) this.delete(row.id);
      });
  }

  private activate(id: number): void {
    this.busy.update((s) => ({ ...s, [id]: true }));
    this.store
      .activate(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.busy.update((s) => ({ ...s, [id]: false }));
          this.notifications.success(Labels.ActivateAgreementSuccess);
          this.load();
        },
        error: (err) => {
          this.busy.update((s) => ({ ...s, [id]: false }));
          const apiError = ApiErrorParser.parse(err);
          this.notifications.error(resolveErrorMessage(apiError));
          if (apiError.status === 409) this.load();
        },
      });
  }

  private delete(id: number): void {
    this.busy.update((s) => ({ ...s, [id]: true }));
    this.store
      .delete(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.busy.update((s) => ({ ...s, [id]: false }));
          this.notifications.success(Labels.DeleteAgreementSuccess);
          this.load();
        },
        error: (err) => {
          this.busy.update((s) => ({ ...s, [id]: false }));
          const apiError = ApiErrorParser.parse(err);
          this.notifications.error(resolveErrorMessage(apiError));
          if (apiError.status === 409) this.load();
        },
      });
  }
}
