import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EquipmentStatusStore } from '@bikerental/shared';
import { EquipmentStatus } from '@ui-models';
import {
  EquipmentStatusDialogComponent,
  EquipmentStatusDialogData,
} from './equipment-status-dialog.component';

@Component({
  selector: 'app-equipment-status-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatChipsModule,
    MatProgressBarModule,
  ],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title i18n>Equipment statuses</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <div class="actions-bar">
          <button mat-raised-button color="primary" (click)="openCreateDialog()">
            <mat-icon>add</mat-icon>
            <span i18n>Create</span>
          </button>
        </div>

        @if (store.loading()) {
          <mat-progress-bar mode="indeterminate" />
        }

        <table mat-table [dataSource]="store.statuses()" class="w-full">
          <ng-container matColumnDef="slug">
            <th mat-header-cell *matHeaderCellDef i18n>Slug</th>
            <td mat-cell *matCellDef="let row">{{ row.slug }}</td>
          </ng-container>

          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef i18n>Name</th>
            <td mat-cell *matCellDef="let row">{{ row.name }}</td>
          </ng-container>

          <ng-container matColumnDef="description">
            <th mat-header-cell *matHeaderCellDef i18n>Description</th>
            <td mat-cell *matCellDef="let row">{{ row.description }}</td>
          </ng-container>

          <ng-container matColumnDef="allowedTransitions">
            <th mat-header-cell *matHeaderCellDef i18n>Allowed transitions</th>
            <td mat-cell *matCellDef="let row">
              <mat-chip-set>
                @for (t of row.allowedTransitions; track t) {
                  <mat-chip>{{ t }}</mat-chip>
                }
              </mat-chip-set>
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let row">
              <button
                mat-icon-button
                (click)="openEditDialog(row)"
                matTooltip="Edit"
                i18n-matTooltip
              >
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
export class EquipmentStatusListComponent {
  readonly store = inject(EquipmentStatusStore);
  private dialog = inject(MatDialog);

  readonly displayedColumns = ['slug', 'name', 'description', 'allowedTransitions', 'actions'];

  openCreateDialog(): void {
    this.dialog.open<EquipmentStatusDialogComponent, EquipmentStatusDialogData, boolean>(
      EquipmentStatusDialogComponent,
      { data: { statuses: this.store.statuses() }, disableClose: true, autoFocus: true },
    );
  }

  openEditDialog(status: EquipmentStatus): void {
    this.dialog.open<EquipmentStatusDialogComponent, EquipmentStatusDialogData, boolean>(
      EquipmentStatusDialogComponent,
      { data: { status, statuses: this.store.statuses() }, autoFocus: 'first-tabbable' },
    );
  }
}
