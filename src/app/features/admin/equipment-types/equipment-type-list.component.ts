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
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EquipmentTypeService } from '../../../core/api';
import { EquipmentType, EquipmentTypeWrite } from '../../../core/domain';
import {
  EquipmentTypeDialogComponent,
  EquipmentTypeDialogData,
} from './equipment-type-dialog.component';

@Component({
  selector: 'app-equipment-type-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, MatTableModule, MatButtonModule, MatIconModule, MatTooltipModule],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title i18n>Equipment types</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <div class="actions-bar">
          <button mat-raised-button color="primary" (click)="openCreateDialog()">
            <mat-icon>add</mat-icon>
            <span i18n>Create</span>
          </button>
        </div>

        <table mat-table [dataSource]="types()" class="w-full">
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
export class EquipmentTypeListComponent implements OnInit {
  private service = inject(EquipmentTypeService);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);

  types = signal<EquipmentType[]>([]);
  loading = signal(false);

  readonly displayedColumns = ['slug', 'name', 'description', 'actions'];

  ngOnInit(): void {
    this.loadTypes();
  }

  loadTypes(): void {
    this.loading.set(true);
    this.service
      .getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (types) => {
          this.types.set(types);
          // sort by slug (ascending) before setting the signal so table always shows slug-sorted order
          const sorted = (types ?? []).slice().sort((a, b) => a.slug.localeCompare(b.slug));
          this.types.set(sorted);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  openCreateDialog(): void {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.data = {} as EquipmentTypeWrite;
    const ref = this.dialog.open(EquipmentTypeDialogComponent, dialogConfig);
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadTypes();
    });
  }

  openEditDialog(type: EquipmentType): void {
    const ref = this.dialog.open<EquipmentTypeDialogComponent, EquipmentTypeDialogData, boolean>(
      EquipmentTypeDialogComponent,
      { data: { type }, autoFocus: 'first-tabbable' },
    );
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadTypes();
    });
  }
}
