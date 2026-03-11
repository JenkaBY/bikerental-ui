import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { EquipmentService, EquipmentStatusService, EquipmentTypeService } from '../../../core/api';
import {
  EquipmentResponse,
  EquipmentStatusResponse,
  EquipmentTypeResponse,
  Page,
  Pageable,
} from '../../../core/models';
import { EquipmentDialogComponent, EquipmentDialogData } from './equipment-dialog.component';
import { TruncatePipe } from '../../../shared/pipes/truncate.pipe';
import { Labels } from '../../../shared/constant/labels';

@Component({
  selector: 'app-equipment-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    TruncatePipe,
    MatCardModule,
    MatTableModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>{{ Labels.Equipment }}</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <div class="filter-bar">
          <div class="flex gap-2">
            <button mat-raised-button color="primary" (click)="openCreateDialog()">
              <mat-icon>add</mat-icon>
              <span>{{ Labels.Create }}</span>
            </button>
          </div>
        </div>

        @if (loading()) {
          <mat-spinner diameter="40"></mat-spinner>
        }

        <table mat-table [dataSource]="equipment()" class="w-full">
          <ng-container matColumnDef="uid">
            <th mat-header-cell *matHeaderCellDef>{{ Labels.Uid }}</th>
            <td mat-cell *matCellDef="let row">{{ row.uid }}</td>
          </ng-container>

          <ng-container matColumnDef="serialNumber">
            <th mat-header-cell *matHeaderCellDef>{{ Labels.SerialNumber }}</th>
            <td mat-cell *matCellDef="let row">{{ row.serialNumber }}</td>
          </ng-container>

          <ng-container matColumnDef="type">
            <th mat-header-cell *matHeaderCellDef>
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>{{ Labels.Type }}</mat-label>
                <mat-select
                  [value]="filterType()"
                  (selectionChange)="onFilterTypeChange($event.value)"
                >
                  <mat-option [value]="undefined">{{ Labels.All }}</mat-option>
                  @for (t of types(); track t.slug) {
                    <mat-option [value]="t.slug">{{ t.name }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </th>
            <td mat-cell *matCellDef="let row">{{ row.type }}</td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>{{ Labels.Status }}</mat-label>
                <mat-select
                  [value]="filterStatus()"
                  (selectionChange)="onFilterStatusChange($event.value)"
                >
                  <mat-option [value]="undefined">{{ Labels.All }}</mat-option>
                  @for (s of statuses(); track s.slug) {
                    <mat-option [value]="s.slug">{{ s.name }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </th>
            <td mat-cell *matCellDef="let row">{{ row.status }}</td>
          </ng-container>

          <ng-container matColumnDef="model">
            <th mat-header-cell *matHeaderCellDef>{{ Labels.Model }}</th>
            <td mat-cell *matCellDef="let row">
              <span
                class="inline-block truncate"
                [matTooltip]="row.model"
                [matTooltipDisabled]="!row.model"
                matTooltipPosition="above"
                matTooltipShowDelay="250"
                [attr.aria-label]="row.model"
              >
                {{ row.model | truncate: 20 }}
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="commissionedAt">
            <th mat-header-cell *matHeaderCellDef>{{ Labels.CommissionedAt }}</th>
            <td mat-cell *matCellDef="let row">{{ row.commissionedAt }}</td>
          </ng-container>

          <ng-container matColumnDef="condition">
            <th mat-header-cell *matHeaderCellDef>{{ Labels.Condition }}</th>
            <td mat-cell *matCellDef="let row">
              <span
                class="inline-block truncate"
                [matTooltip]="row.condition"
                [matTooltipDisabled]="!row.condition"
                matTooltipPosition="above"
                matTooltipShowDelay="250"
                [attr.aria-label]="row.condition"
              >
                {{ row.condition | truncate: 20 }}
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let row">
              <button mat-icon-button (click)="openEditDialog(row)" [matTooltip]="Labels.Edit">
                <mat-icon>edit</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr
            mat-row
            *matRowDef="let row; columns: displayedColumns"
            [attr.data-row-uid]="row?.uid"
          ></tr>
        </table>

        <mat-paginator
          [length]="totalItems()"
          [pageIndex]="pageIndex()"
          [pageSize]="pageSize()"
          [pageSizeOptions]="[10, 20, 50]"
          (page)="onPageChange($event)"
          showFirstLastButtons
        ></mat-paginator>
      </mat-card-content>
    </mat-card>
  `,
})
export class EquipmentListComponent implements OnInit {
  private service = inject(EquipmentService);
  private typeService = inject(EquipmentTypeService);
  private statusService = inject(EquipmentStatusService);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);

  // expose Labels constant so template expressions can reference it
  readonly Labels = Labels;

  equipment = signal<EquipmentResponse[]>([]);
  totalItems = signal(0);
  loading = signal(false);
  types = signal<EquipmentTypeResponse[]>([]);
  statuses = signal<EquipmentStatusResponse[]>([]);
  filterStatus = signal<string | undefined>(undefined);
  filterType = signal<string | undefined>(undefined);
  pageIndex = signal(0);
  pageSize = signal(20);

  readonly displayedColumns = [
    'uid',
    'serialNumber',
    'type',
    'status',
    'model',
    'commissionedAt',
    'condition',
    'actions',
  ];

  ngOnInit(): void {
    this.loadTypes();
    this.loadStatuses();
    this.loadEquipment();
  }

  private loadTypes(): void {
    this.typeService
      .getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (t) => this.types.set(t ?? []) });
  }

  private loadStatuses(): void {
    this.statusService
      .getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (s) => this.statuses.set(s ?? []) });
  }

  loadEquipment(): void {
    this.loading.set(true);
    const pageable: Pageable = { page: this.pageIndex(), size: this.pageSize() };
    this.service
      .search(this.filterStatus(), this.filterType(), pageable)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page: Page<EquipmentResponse>) => {
          this.equipment.set(page.items ?? []);
          this.totalItems.set(page.totalItems ?? 0);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  onFilterStatusChange(value: string | undefined): void {
    this.filterStatus.set(value);
    this.pageIndex.set(0);
    this.loadEquipment();
  }

  onFilterTypeChange(value: string | undefined): void {
    this.filterType.set(value);
    this.pageIndex.set(0);
    this.loadEquipment();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex ?? 0);
    this.pageSize.set(event.pageSize ?? this.pageSize());
    this.loadEquipment();
  }

  openCreateDialog(): void {
    const ref = this.dialog.open<EquipmentDialogComponent, EquipmentDialogData, boolean>(
      EquipmentDialogComponent,
      {
        data: { types: this.types(), statuses: this.statuses() },
        disableClose: true,
        autoFocus: true,
      },
    );
    ref.afterClosed().subscribe((r) => {
      if (r) this.loadEquipment();
    });
  }

  openEditDialog(e: EquipmentResponse): void {
    const ref = this.dialog.open<EquipmentDialogComponent, EquipmentDialogData, boolean>(
      EquipmentDialogComponent,
      {
        data: { equipment: e, types: this.types(), statuses: this.statuses() },
        autoFocus: 'first-tabbable',
      },
    );
    ref.afterClosed().subscribe((r) => {
      if (r) this.loadEquipment();
    });
  }
}
