import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit } from '@angular/core';
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
import { EquipmentDialogComponent, EquipmentDialogData } from './equipment-dialog.component';
import { TruncatePipe } from '../../../shared/pipes/truncate.pipe';
import { Labels } from '../../../shared/constant/labels';
import { Equipment } from '@ui-models';
import { EquipmentStore } from '@store.equipment.store';
import { EquipmentTypeStore } from '@store.equipment-type.store';
import { EquipmentStatusStore } from '@store.equipment-status.store';

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

        @if (store.loading()) {
          <mat-spinner diameter="40"></mat-spinner>
        }

        <table mat-table [dataSource]="store.items()" class="w-full">
          <ng-container matColumnDef="uid">
            <th mat-header-cell *matHeaderCellDef>{{ Labels.Uid }}</th>
            <td mat-cell *matCellDef="let equipment">{{ equipment.uid }}</td>
          </ng-container>

          <ng-container matColumnDef="serialNumber">
            <th mat-header-cell *matHeaderCellDef>{{ Labels.SerialNumber }}</th>
            <td mat-cell *matCellDef="let equipment">{{ equipment.serialNumber }}</td>
          </ng-container>

          <ng-container matColumnDef="type">
            <th mat-header-cell *matHeaderCellDef>
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>{{ Labels.Type }}</mat-label>
                <mat-select
                  [value]="store.filterType()"
                  (selectionChange)="onFilterTypeChange($event.value)"
                >
                  <mat-option [value]="undefined">{{ Labels.All }}</mat-option>
                  @for (t of equipmentTypeStore.typesForEquipment(); track t.slug) {
                    <mat-option [value]="t.slug">{{ t.name }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </th>
            <td mat-cell *matCellDef="let row">{{ row.type.name }}</td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>{{ Labels.Status }}</mat-label>
                <mat-select
                  [value]="store.filterStatus()"
                  (selectionChange)="onFilterStatusChange($event.value)"
                >
                  <mat-option [value]="undefined">{{ Labels.All }}</mat-option>
                  @for (s of equipmentStatusStore.statuses(); track s.slug) {
                    <mat-option [value]="s.slug">{{ s.name }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </th>
            <td mat-cell *matCellDef="let row">{{ row.status.name }}</td>
          </ng-container>

          <ng-container matColumnDef="model">
            <th mat-header-cell *matHeaderCellDef>{{ Labels.Model }}</th>
            <td mat-cell *matCellDef="let equipment">
              <span
                class="inline-block truncate"
                [matTooltip]="equipment.model"
                [matTooltipDisabled]="!equipment.model"
                matTooltipPosition="above"
                matTooltipShowDelay="250"
                [attr.aria-label]="equipment.model"
              >
                {{ equipment.model | truncate: 20 }}
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
          [length]="store.totalItems()"
          [pageIndex]="store.pageIndex()"
          [pageSize]="store.pageSize()"
          [pageSizeOptions]="[10, 20, 50]"
          (page)="onPageChange($event)"
          showFirstLastButtons
        ></mat-paginator>
      </mat-card-content>
    </mat-card>
  `,
})
export class EquipmentListComponent implements OnInit {
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);
  readonly store = inject(EquipmentStore);
  readonly equipmentTypeStore = inject(EquipmentTypeStore);
  readonly equipmentStatusStore = inject(EquipmentStatusStore);

  readonly Labels = Labels;

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
    this.equipmentTypeStore.load().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    this.equipmentStatusStore.load().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    this.loadEquipment();
  }

  loadEquipment(): void {
    this.store.load().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  onFilterStatusChange(value: string | undefined): void {
    this.store.setFilterStatus(value);
    this.loadEquipment();
  }

  onFilterTypeChange(value: string | undefined): void {
    this.store.setFilterType(value);
    this.loadEquipment();
  }

  onPageChange(event: PageEvent): void {
    this.store.setPage(event.pageIndex ?? 0, event.pageSize ?? this.store.pageSize());
    this.loadEquipment();
  }

  openCreateDialog(): void {
    const ref = this.dialog.open<EquipmentDialogComponent, EquipmentDialogData, boolean>(
      EquipmentDialogComponent,
      {
        data: {
          types: this.equipmentTypeStore.types(),
          statuses: this.equipmentStatusStore.statuses(),
        },
        disableClose: true,
        autoFocus: true,
      },
    );
    ref.afterClosed().subscribe((r) => {
      if (r) this.loadEquipment();
    });
  }

  openEditDialog(e: Equipment): void {
    const ref = this.dialog.open<EquipmentDialogComponent, EquipmentDialogData, boolean>(
      EquipmentDialogComponent,
      {
        data: {
          equipment: e,
          types: this.equipmentTypeStore.types(),
          statuses: this.equipmentStatusStore.statuses(),
        },
        autoFocus: 'first-tabbable',
      },
    );
    ref.afterClosed().subscribe((r) => {
      if (r) this.loadEquipment();
    });
  }
}
