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
import { EquipmentDialogComponent, EquipmentDialogData } from './equipment-dialog.component';
import {
  EquipmentConditionFilterComponent,
  EquipmentStore,
  EquipmentTypeStore,
  Labels,
  PointAdminStore,
  TruncatePipe,
} from '@bikerental/shared';
import { Equipment, EquipmentConditionSlug } from '@ui-models';

@Component({
  selector: 'app-equipment-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [PointAdminStore],
  imports: [
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
    EquipmentConditionFilterComponent,
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

          <ng-container matColumnDef="condition">
            <th mat-header-cell *matHeaderCellDef>
              <app-equipment-condition-filter
                [value]="store.filterConditions()"
                (valueChange)="onFilterConditionsChange($event)"
              />
            </th>
            <td mat-cell *matCellDef="let row">
              <span
                [matTooltip]="row.conditionNotes"
                [matTooltipDisabled]="!row.conditionNotes"
                matTooltipPosition="above"
                matTooltipShowDelay="250"
                [attr.aria-label]="row.condition?.name ?? ''"
              >
                {{ row.condition?.name ?? '' }}
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="point">
            <th mat-header-cell *matHeaderCellDef>
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>{{ Labels.EquipmentPoint }}</mat-label>
                <mat-select
                  [value]="store.filterPoint()"
                  (selectionChange)="onFilterPointChange($event.value)"
                >
                  <mat-option [value]="undefined">{{ Labels.All }}</mat-option>
                  @for (p of pointStore.points(); track p.slug) {
                    <mat-option [value]="p.slug">{{ p.name }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </th>
            <td mat-cell *matCellDef="let row">
              {{ pointStore.nameBySlug().get(row.pointSlug) ?? row.pointSlug ?? '' }}
              @if (row.locationState === 'IN_TRANSIT') {
                <span class="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                  {{ Labels.EquipmentInTransit }}
                </span>
              }
            </td>
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
  readonly pointStore = inject(PointAdminStore);

  readonly Labels = Labels;

  readonly displayedColumns = ['uid', 'type', 'model', 'condition', 'point', 'actions'];

  ngOnInit(): void {
    this.loadEquipment();
    this.pointStore.load().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  loadEquipment(): void {
    this.store.load().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  onFilterTypeChange(value: string | undefined): void {
    this.store.setFilterType(value);
  }

  onFilterConditionsChange(value: EquipmentConditionSlug[]): void {
    this.store.setFilterConditions(value);
  }

  onFilterPointChange(value: string | undefined): void {
    this.store.setFilterPoint(value);
  }

  onPageChange(event: PageEvent): void {
    this.store.setPage(event.pageIndex ?? 0, event.pageSize ?? this.store.pageSize());
  }

  openCreateDialog(): void {
    this.dialog.open<EquipmentDialogComponent, EquipmentDialogData, boolean>(
      EquipmentDialogComponent,
      {
        data: {
          types: this.equipmentTypeStore.types(),
          points: this.pointStore.points(),
        },
        disableClose: true,
        autoFocus: true,
      },
    );
  }

  openEditDialog(e: Equipment): void {
    this.dialog.open<EquipmentDialogComponent, EquipmentDialogData, boolean>(
      EquipmentDialogComponent,
      {
        data: {
          equipment: e,
          types: this.equipmentTypeStore.types(),
          points: this.pointStore.points(),
        },
        autoFocus: 'first-tabbable',
      },
    );
  }
}
