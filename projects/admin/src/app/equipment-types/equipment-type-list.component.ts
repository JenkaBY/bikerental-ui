import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EquipmentTypeStore, Labels } from '@bikerental/shared';
import { EquipmentType } from '@ui-models';
import {
  EquipmentTypeDialogComponent,
  EquipmentTypeDialogData,
} from './equipment-type-dialog.component';

@Component({
  selector: 'app-equipment-type-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
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
        <mat-card-title>{{ Labels.EquipmentTypesPageTitle }}</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <div class="actions-bar">
          <button mat-raised-button color="primary" (click)="openCreateDialog()">
            <mat-icon>add</mat-icon>
            <span>{{ Labels.Create }}</span>
          </button>
        </div>

        @if (store.loading()) {
          <mat-progress-bar mode="indeterminate" />
        }

        <table mat-table [dataSource]="store.types()" class="w-full">
          <ng-container matColumnDef="slug">
            <th mat-header-cell *matHeaderCellDef>{{ Labels.Slug }}</th>
            <td mat-cell *matCellDef="let row">{{ row.slug }}</td>
          </ng-container>

          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>{{ Labels.Name }}</th>
            <td mat-cell *matCellDef="let row">{{ row.name }}</td>
          </ng-container>

          <ng-container matColumnDef="description">
            <th mat-header-cell *matHeaderCellDef>{{ Labels.Description }}</th>
            <td mat-cell *matCellDef="let row">{{ row.description }}</td>
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
          <tr mat-row *matRowDef="let _row; columns: displayedColumns"></tr>
        </table>
      </mat-card-content>
    </mat-card>
  `,
})
export class EquipmentTypeListComponent {
  protected readonly Labels = Labels;
  readonly store = inject(EquipmentTypeStore);
  private dialog = inject(MatDialog);

  readonly displayedColumns = ['slug', 'name', 'description', 'actions'];

  openCreateDialog(): void {
    this.dialog.open<EquipmentTypeDialogComponent, EquipmentTypeDialogData, boolean>(
      EquipmentTypeDialogComponent,
      { data: {}, disableClose: true, autoFocus: true },
    );
  }

  openEditDialog(type: EquipmentType): void {
    this.dialog.open<EquipmentTypeDialogComponent, EquipmentTypeDialogData, boolean>(
      EquipmentTypeDialogComponent,
      { data: { type }, autoFocus: 'first-tabbable' },
    );
  }
}
