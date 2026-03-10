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
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EquipmentStatusService } from '../../../core/api';
import { EquipmentStatusResponse } from '../../../core/models';
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

        <table mat-table [dataSource]="statuses()" class="w-full">
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
export class EquipmentStatusListComponent implements OnInit {
  private service = inject(EquipmentStatusService);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);

  statuses = signal<EquipmentStatusResponse[]>([]);
  loading = signal(false);

  readonly displayedColumns = ['slug', 'name', 'description', 'allowedTransitions', 'actions'];

  ngOnInit(): void {
    this.loadStatuses();
  }

  loadStatuses(): void {
    this.loading.set(true);
    this.service
      .getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (statuses) => {
          const sorted = (statuses ?? []).slice().sort((a, b) => a.slug.localeCompare(b.slug));
          this.statuses.set(sorted);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  openCreateDialog(): void {
    const ref = this.dialog.open<
      EquipmentStatusDialogComponent,
      EquipmentStatusDialogData,
      boolean
    >(EquipmentStatusDialogComponent, {
      data: { statuses: this.statuses() },
      disableClose: true,
      autoFocus: true,
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadStatuses();
    });
  }

  openEditDialog(status: EquipmentStatusResponse): void {
    const ref = this.dialog.open<
      EquipmentStatusDialogComponent,
      EquipmentStatusDialogData,
      boolean
    >(EquipmentStatusDialogComponent, {
      data: { status, statuses: this.statuses() },
      autoFocus: 'first-tabbable',
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadStatuses();
    });
  }
}
