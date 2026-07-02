import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  ApiErrorParser,
  ErrorCode,
  ErrorMessageResolver,
  EquipmentSearchItem,
  Labels,
  NotificationService,
  RentalStore,
} from '@bikerental/shared';
import { RentalEquipmentSectionComponent } from '../../rental-create/step2/rental-equipment-section.component';

@Component({
  selector: 'app-add-equipment-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    MatDialogModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    RentalEquipmentSectionComponent,
  ],
  template: `
    <h2 mat-dialog-title>{{ Labels.AddEquipmentDialogTitle }}</h2>

    <mat-dialog-content class="flex flex-col pt-1 !pb-0">
      @if (rentalStore.expectedReturnAt(); as returnAt) {
        <p class="text-sm text-slate-500 mb-3">
          {{ Labels.AddEquipmentBillingNote }} {{ Labels.Expected }} {{ returnAt | date: 'HH:mm' }}.
        </p>
      }
      <app-rental-equipment-section
        [items]="selectedItems()"
        (itemAdded)="onItemAdded($event)"
        (itemRemoved)="onItemRemoved($event)"
      />
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()" [disabled]="rentalStore.isAddingEquipment()">
        {{ Labels.Cancel }}
      </button>
      <button
        mat-flat-button
        color="primary"
        [disabled]="selectedItems().length === 0 || rentalStore.isAddingEquipment()"
        (click)="onConfirm()"
      >
        @if (rentalStore.isAddingEquipment()) {
          <mat-spinner diameter="20" />
        } @else {
          {{ Labels.AddEquipmentButton }}
        }
      </button>
    </mat-dialog-actions>
  `,
})
export class AddEquipmentDialogComponent {
  protected readonly rentalStore = inject(RentalStore);
  private readonly resolver = inject(ErrorMessageResolver);
  private readonly notifications = inject(NotificationService);
  private readonly dialogRef = inject(MatDialogRef) as MatDialogRef<
    AddEquipmentDialogComponent,
    boolean
  >;
  private readonly destroyRef = inject(DestroyRef);

  protected readonly Labels = Labels;
  protected readonly selectedItems = signal<EquipmentSearchItem[]>([]);

  protected onItemAdded(item: EquipmentSearchItem): void {
    this.selectedItems.update((items) =>
      items.some((i) => i.id === item.id) ? items : [...items, item],
    );
  }

  protected onItemRemoved(id: number): void {
    this.selectedItems.update((items) => items.filter((i) => i.id !== id));
  }

  protected onCancel(): void {
    this.dialogRef.close(false);
  }

  protected onConfirm(): void {
    const equipmentIds = this.selectedItems().map((item) => item.id);
    if (equipmentIds.length === 0) return;

    this.rentalStore
      .addEquipmentToRental(equipmentIds)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.dialogRef.close(true),
        error: (err: unknown) => this.handleError(err),
      });
  }

  private handleError(err: unknown): void {
    const apiError = ApiErrorParser.parse(err);
    this.notifications.error(this.resolver.resolve(apiError));

    if (apiError.code === ErrorCode.STATUS_INVALID) {
      const id = this.rentalStore.id();
      if (id !== null) this.rentalStore.loadDetail(id);
      this.dialogRef.close(false);
      return;
    }

    if (
      apiError.code === ErrorCode.EQUIPMENT_NOT_AVAILABLE ||
      apiError.code === ErrorCode.SHARED_EQUIPMENT_NOT_AVAILABLE
    ) {
      const unavailableIds = apiError.params['unavailableIds'];
      if (Array.isArray(unavailableIds)) {
        const idSet = new Set(unavailableIds.map(Number));
        this.selectedItems.update((items) => items.filter((i) => !idSet.has(i.id)));
      }
    }
  }
}
