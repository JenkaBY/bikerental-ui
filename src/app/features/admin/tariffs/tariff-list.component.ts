import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
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
import { EquipmentTypeService, TariffService } from '../../../core/api';
import { Tariff } from '../../../core/domain';
import { Labels } from '../../../shared/constant/labels';
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
              <td mat-cell *matCellDef="let row">
                {{ equipmentTypeNames()[row.equipmentType] || row.equipmentType }}
              </td>
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
                {{ pricingTypeTitles()[row.pricingType] }}
              </td>
            </ng-container>

            <!-- Valid From -->
            <ng-container matColumnDef="validFrom">
              <th
                mat-header-cell
                *matHeaderCellDef
                class="bg-slate-50 font-semibold text-slate-700"
              >
                {{ 'Valid From' }}
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
                {{ 'Valid To' }}
              </th>
              <td mat-cell *matCellDef="let row">{{ row.validTo ? (row.validTo | date) : '' }}</td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th
                mat-header-cell
                *matHeaderCellDef
                class="bg-slate-50 font-semibold text-slate-700"
              >
                {{ 'Status' }}
              </th>
              <td
                mat-cell
                *matCellDef="let row"
                [ngClass]="row.status === 'ACTIVE' ? 'bg-green-100' : 'bg-yellow-100'"
              >
                <mat-slide-toggle
                  [checked]="row.status === 'ACTIVE'"
                  (change)="toggleStatus(row)"
                  [disabled]="toggling()[row.id]"
                  [aria-label]="row.name"
                  [class.checked-green]="row.status === 'ACTIVE'"
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
export class TariffListComponent {
  private tariffService = inject(TariffService);
  private destroyRef = inject(DestroyRef);
  private snackBar = inject(MatSnackBar);

  items = signal<Tariff[]>([]);
  totalItems = signal<number>(0);
  loading = signal(false);
  page = signal(0);
  pageSize = signal(10);
  pageSizeOptions = [5, 10, 25];

  pricingTypeTitles = signal<Record<string, string>>({});
  pricingTypeDescriptions = signal<Record<string, string | undefined>>({});
  readonly equipmentTypeNames = signal<Record<string, string>>({});
  // per-row pending state while toggle request is in-flight
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

  private dialog = inject(MatDialog);

  constructor() {
    // load equipment type names for slug -> name mapping
    const equipmentTypeService = inject(EquipmentTypeService);
    equipmentTypeService
      .getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((types) => {
        const map: Record<string, string> = {};
        (types || []).forEach((t: { slug: string; name: string }) => {
          map[t.slug] = t.name;
        });
        this.equipmentTypeNames.set(map);
      });
    // populate pricing type titles lookup (fallback to slug when title missing)
    this.tariffService
      .getPricingTypes()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        // we rely on UI Labels for translated titles/descriptions
        this.pricingTypeTitles.set(Labels.PricingTypeTitles as Record<string, string>);
        this.pricingTypeDescriptions.set(
          Labels.PricingTypeDescriptions as Record<string, string | undefined>,
        );
      });

    this.load();
  }

  load() {
    this.loading.set(true);
    this.tariffService
      .getAll({ page: this.page(), size: this.pageSize() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((p) => {
        this.items.set(p.items ?? []);
        this.totalItems.set(p.totalItems ?? this.items().length);
        this.loading.set(false);
      });
  }

  onPage(e: PageEvent) {
    this.page.set(e.pageIndex);
    this.pageSize.set(e.pageSize);
    this.load();
  }

  refresh() {
    this.load();
  }

  openCreateDialog(): void {
    this.dialog
      .open(TariffDialogComponent, {
        data: {} as TariffDialogData,
        width: '680px',
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result) {
          this.snackBar.open(Labels.Saved, Labels.Close, { duration: 3000 });
          this.load();
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
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result) {
          this.snackBar.open(Labels.Saved, Labels.Close, { duration: 3000 });
          this.load();
        }
      });
  }

  toggleStatus(row: Tariff) {
    if (!row || row.id == null) return;
    const id = row.id;
    const isActive = row.status === 'ACTIVE';

    // set pending
    this.toggling.update((s) => ({ ...s, [id]: true }));

    const call$ = isActive ? this.tariffService.deactivate(id) : this.tariffService.activate(id);
    call$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (updated) => {
        // update single item in the items signal
        this.items.update((arr) => arr.map((it) => (it.id === id ? updated : it)));
        this.snackBar.open(Labels.StatusChanged ?? Labels.Close, Labels.Close, { duration: 3000 });
        this.toggling.update((s) => ({ ...s, [id]: false }));
      },
      error: (err) => {
        const msg = err?.message ?? Labels.ErrorOccurred ?? $localize`Error occurred`;
        this.snackBar.open(msg, Labels.Close, { duration: 4000 });
        this.toggling.update((s) => ({ ...s, [id]: false }));
      },
    });
  }
}
