import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Labels, mapEquipmentItemStatus, RentalStore } from '@bikerental/shared';
import type { RentalEquipmentItem } from '@bikerental/shared';

@Component({
  selector: 'app-rental-equipment-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCheckboxModule, MatButtonModule],
  template: `
    <div class="flex flex-col">
      <div class="flex items-center justify-between px-4 py-3">
        <span class="text-sm font-semibold text-slate-600">{{ Labels.Equipment }}</span>
        @if (!isDebt()) {
          <div class="flex gap-1">
            <button mat-button type="button" (click)="onSelectAll()">
              {{ Labels.SelectAll }}
            </button>
            <button mat-button type="button" (click)="store.clearSelection()">
              {{ Labels.Deselect }}
            </button>
          </div>
        }
      </div>

      @for (item of equipmentItems(); track item.id) {
        <div
          class="flex items-center gap-3 px-4 py-3 border-t border-slate-100"
          [class.opacity-40]="item.isReturned"
        >
          <mat-checkbox
            [checked]="isChecked(item)"
            [disabled]="item.isReturned || isDebt()"
            (change)="onCheckboxChange(item, $event.checked)"
          />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-slate-800 truncate">{{ item.model }}</p>
            <p class="text-xs text-slate-500 truncate">{{ item.type.name }} · {{ item.uid }}</p>
          </div>
          <span [class]="badgeClasses(item)">{{ badgeLabel(item) }}</span>
        </div>
      }
    </div>
  `,
})
export class RentalEquipmentSectionComponent {
  readonly equipmentItems = input.required<RentalEquipmentItem[]>();
  readonly isDebt = input(false);

  protected readonly store = inject(RentalStore);
  protected readonly Labels = Labels;

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

  protected onSelectAll(): void {
    const activeIds = this.equipmentItems()
      .filter((item) => !item.isReturned)
      .map((item) => item.id);
    this.store.selectAllActiveItems(activeIds);
  }

  protected badgeLabel(item: RentalEquipmentItem): string {
    if (item.isReturned) return Labels.Returned;
    return mapEquipmentItemStatus(item.statusSlug).label;
  }

  protected badgeClasses(item: RentalEquipmentItem): string {
    const colorMap: Record<string, string> = {
      primary: 'bg-blue-100 text-blue-700',
      warn: 'bg-amber-100 text-amber-700',
      accent: 'bg-purple-100 text-purple-700',
      default: 'bg-gray-100 text-gray-600',
    };
    const color = item.isReturned ? 'default' : mapEquipmentItemStatus(item.statusSlug).color;
    return `text-xs font-medium px-2 py-1 rounded-full ${colorMap[color] ?? colorMap['default']}`;
  }
}
