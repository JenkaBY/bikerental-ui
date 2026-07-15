import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  ViewContainerRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import type { RentalEquipmentItem } from '@bikerental/shared';
import {
  EquipmentUnitCardComponent,
  EquipmentUnitViewModelMapper,
  Labels,
  RentalCostCalculationStore,
  RentalStore,
  TimeStore,
} from '@bikerental/shared';
import { AddEquipmentDialogComponent } from './add-equipment-dialog/add-equipment-dialog.component';

@Component({
  selector: 'app-rental-equipment-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatCheckboxModule, EquipmentUnitCardComponent],
  template: `
    <div class="flex flex-col">
      <div class="flex items-center gap-2 py-3">
        <mat-checkbox
          class="shrink-0 self-center ml-3 [--mat-checkbox-state-layer-size:18px]"
          [checked]="allSelected()"
          [indeterminate]="indeterminate()"
          [disabled]="isDebt() || disabled() || !hasActiveItems()"
          (change)="onToggleSelectAll($event)"
        />
        <span class="flex-1 text-sm font-semibold text-slate-600">{{ Labels.Equipment }}</span>
        @if (store.isActive()) {
          <button
            mat-flat-button
            color="primary"
            class="!min-w-0 !px-4 !text-white"
            [disabled]="store.isOverdue()"
            (click)="onAddEquipment()"
          >
            {{ Labels.Add }}
          </button>
        }
      </div>

      <div class="flex flex-col gap-2 pb-3">
        @for (item of sortedItems(); track item.id) {
          <div [class.opacity-40]="item.isReturned">
            <app-equipment-unit-card
              [unit]="unitFor(item)"
              [showCheckbox]="true"
              [checked]="isChecked(item)"
              [checkboxDisabled]="item.isReturned || isDebt() || disabled()"
              (checkedChange)="onCheckboxChange(item, $event)"
            />
          </div>
        }
      </div>
    </div>
  `,
})
export class RentalEquipmentSectionComponent {
  readonly equipmentItems = input.required<RentalEquipmentItem[]>();
  readonly isDebt = input(false);
  readonly disabled = input(false);

  protected readonly store = inject(RentalStore);
  private readonly costStore = inject(RentalCostCalculationStore);
  private readonly timeStore = inject(TimeStore);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly viewContainerRef = inject(ViewContainerRef);

  protected readonly Labels = Labels;

  protected readonly sortedItems = computed(() =>
    [...this.equipmentItems()].sort((a, b) => Number(a.isReturned) - Number(b.isReturned)),
  );

  protected readonly hasActiveItems = computed(
    () => this.store.activeEquipmentItemIds().length > 0,
  );
  protected readonly allSelected = this.store.isFullReturnSelected;
  protected readonly indeterminate = computed(
    () => this.store.selectedEquipmentCount() > 0 && !this.allSelected(),
  );

  protected isChecked(item: RentalEquipmentItem): boolean {
    return item.isReturned || this.store.selectedEquipmentItemIds().has(item.id);
  }

  protected onCheckboxChange(item: RentalEquipmentItem, checked: boolean): void {
    if (checked) {
      this.store.selectEquipmentItem(item.id);
    } else {
      this.store.deselectEquipmentItem(item.id);
    }
  }

  protected onToggleSelectAll(event: MatCheckboxChange): void {
    if (event.checked) {
      this.store.selectAllActiveItems(this.store.activeEquipmentItemIds());
    } else {
      this.store.clearSelection();
    }
  }

  protected onAddEquipment(): void {
    this.dialog
      .open(AddEquipmentDialogComponent, {
        viewContainerRef: this.viewContainerRef,
        disableClose: true,
        width: '480px',
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed: boolean | undefined) => {
        if (!confirmed) return;
        this.snackBar.open(Labels.RentalAddEquipmentSuccess, undefined, { duration: 3000 });
      });
  }

  protected unitFor(item: RentalEquipmentItem) {
    const breakdown = this.costStore.breakdowns().find((b) => b.equipmentId === item.id) ?? null;
    return EquipmentUnitViewModelMapper.forRentalItem(
      item,
      breakdown,
      this.store.startedAt(),
      this.store.durationMinutes(),
      this.timeStore.getCurrentDate(),
    );
  }
}
