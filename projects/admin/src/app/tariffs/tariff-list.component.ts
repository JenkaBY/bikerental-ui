import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Tariff } from '@ui-models';
import { TariffStore } from '@store.tariff.store';
import { Labels } from '@bikerental/shared';
import { MatDialog } from '@angular/material/dialog';
import { TariffDialogComponent, TariffDialogData } from './tariff-dialog.component';

@Component({
  selector: 'app-tariff-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatTooltipModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>{{ Labels.Tariffs }}</mat-card-title>
      </mat-card-header>

      <mat-card-content>
        <div class="flex justify-start mb-2">
          <button mat-raised-button color="primary" (click)="openCreateDialog()">
            <mat-icon>add</mat-icon>
            <span>{{ Labels.CreateTariff }}</span>
          </button>
        </div>
        @if (loading()) {
          <div class="flex justify-center py-6">
            <mat-progress-spinner mode="indeterminate" diameter="36"></mat-progress-spinner>
          </div>
        }
        @if (!loading() && items().length > 0) {
          <table mat-table [dataSource]="items()" class="min-w-full">
            <!-- Name -->
            <ng-container matColumnDef="name">
              <th
                mat-header-cell
                *matHeaderCellDef
                class="bg-slate-50 font-semibold text-slate-700"
              >
                {{ Labels.Name }}
              </th>
              <td mat-cell *matCellDef="let row">{{ row.name }}</td>
            </ng-container>

            <!-- Equipment Type -->
            <ng-container matColumnDef="equipmentType">
              <th
                mat-header-cell
                *matHeaderCellDef
                class="bg-slate-50 font-semibold text-slate-700"
              >
                {{ Labels.EquipmentType }}
              </th>
              <td mat-cell *matCellDef="let row">{{ row.equipmentType.name }}</td>
            </ng-container>

            <!-- Pricing Type -->
            <ng-container matColumnDef="pricingType">
              <th
                mat-header-cell
                *matHeaderCellDef
                class="bg-slate-50 font-semibold text-slate-700"
              >
                {{ Labels.PricingType }}
              </th>
              <td mat-cell *matCellDef="let row">
                {{ row.pricingType.title }}
              </td>
            </ng-container>

            <!-- Valid From -->
            <ng-container matColumnDef="validFrom">
              <th
                mat-header-cell
                *matHeaderCellDef
                class="bg-slate-50 font-semibold text-slate-700"
              >
                {{ Labels.ValidFrom }}
              </th>
              <td mat-cell *matCellDef="let row">{{ row.validFrom | date }}</td>
            </ng-container>

            <!-- Valid To -->
            <ng-container matColumnDef="validTo">
              <th
                mat-header-cell
                *matHeaderCellDef
                class="bg-slate-50 font-semibold text-slate-700"
              >
                {{ Labels.ValidTo }}
              </th>
              <td mat-cell *matCellDef="let row">{{ row.validTo ? (row.validTo | date) : '' }}</td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th
                mat-header-cell
                *matHeaderCellDef
                class="bg-slate-50 font-semibold text-slate-700"
              >
                {{ Labels.Status }}
              </th>
              <td
                mat-cell
                *matCellDef="let row"
                [ngClass]="row.isActive ? 'bg-green-100' : 'bg-yellow-100'"
              >
                <mat-slide-toggle
                  [checked]="row.isActive"
                  (change)="toggleStatus(row)"
                  [disabled]="toggling()[row.id]"
                  [aria-label]="row.name"
                  [class.checked-green]="row.isActive"
                ></mat-slide-toggle>
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th
                mat-header-cell
                *matHeaderCellDef
                class="bg-slate-50 font-semibold text-slate-700"
              ></th>
              <td mat-cell *matCellDef="let row" class="flex gap-2 items-center">
                <button mat-icon-button (click)="openEditDialog(row)" [matTooltip]="Labels.Edit">
                  <mat-icon>edit</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns" class="bg-slate-50"></tr>
            <tr
              mat-row
              *matRowDef="let row; columns: displayedColumns"
              [attr.data-row-id]="row.id"
              class="hover:bg-slate-200 transition-colors"
            ></tr>
          </table>
        }

        @if (!loading() && items().length === 0) {
          <div class="text-sm text-slate-500 py-6">
            {{ 'No tariffs found' }}
          </div>
        }
      </mat-card-content>

      <mat-card-actions>
        <mat-paginator
          [length]="totalItems()"
          [pageIndex]="page()"
          [pageSize]="pageSize()"
          [pageSizeOptions]="pageSizeOptions"
          (page)="onPage($event)"
        >
        </mat-paginator>
      </mat-card-actions>
    </mat-card>
  `,
})
export class TariffListComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private snackBar = inject(MatSnackBar);
  private store = inject(TariffStore);
  private dialog = inject(MatDialog);

  readonly items = this.store.tariffs;
  readonly totalItems = this.store.totalItems;
  readonly loading = this.store.loading;
  readonly page = this.store.currentPage;
  readonly pageSize = this.store.pageSize;
  readonly pageSizeOptions = [5, 10, 25];

  toggling = signal<Record<number, boolean>>({});
  protected readonly Labels = Labels;

  displayedColumns = [
    'name',
    'equipmentType',
    'pricingType',
    'validFrom',
    'validTo',
    'status',
    'actions',
  ];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.store.load().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  onPage(e: PageEvent): void {
    this.store.setPage(e.pageIndex, e.pageSize);
  }

  openCreateDialog(): void {
    this.dialog
      .open(TariffDialogComponent, {
        data: {} as TariffDialogData,
        width: '680px',
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.snackBar.open(Labels.Saved, Labels.Close, { duration: 3000 });
        }
      });
  }

  openEditDialog(tariff: Tariff): void {
    this.dialog
      .open(TariffDialogComponent, {
        data: { tariff } as TariffDialogData,
        width: '680px',
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.snackBar.open(Labels.Saved, Labels.Close, { duration: 3000 });
        }
      });
  }

  toggleStatus(row: Tariff) {
    if (!row || row.id == null) return;
    const id = row.id;

    this.toggling.update((s) => ({ ...s, [id]: true }));

    const call$ = row.isActive ? this.store.deactivate(id) : this.store.activate(id);
    call$.subscribe({
      next: () => {
        this.snackBar.open(Labels.StatusChanged ?? Labels.Close, Labels.Close, { duration: 3000 });
        this.toggling.update((s) => ({ ...s, [id]: false }));
      },
      error: (err) => {
        const msg = err?.message ?? Labels.ErrorOccurred;
        this.snackBar.open(msg, Labels.Close, { duration: 4000 });
        this.toggling.update((s) => ({ ...s, [id]: false }));
      },
    });
  }
}
