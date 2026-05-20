# Task 004: Create `RentalEquipmentSectionComponent`

> **Applied Skill:** `angular-component` — New standalone `OnPush` component with signal `input()` bindings, injects `RentalStore` for selection mutations, uses `@for` control flow, and `MatCheckboxModule` for accessible checkboxes.

## 1. Objective

Create the `RentalEquipmentSectionComponent` that renders the list of rental equipment items with checkbox selection controls, "Select all" / "Deselect" shortcut buttons, and a status badge per row. Active items have interactive checkboxes; returned items are pre-checked and disabled with dimmed opacity. The component reads checkbox state from `RentalStore.selectedEquipmentItemIds()` and mutates it via the store's selection methods.

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/rental-detail/rental-equipment-section.component.ts`
* **Action:** Create New File

## 3. Code Implementation

**Imports Required:** (included in the snippet below)

**Code to Add/Replace:**

* **Location:** New file — paste the complete content below.

```typescript
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
```

### Key design decisions

| Decision                                              | Rationale                                                                                                                                                         |
|-------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `inject(RentalStore)` instead of `RENTAL_STORE_TOKEN` | This component is only used in `RentalDetailComponent`, which provides `RentalStore` directly; the token abstraction is not needed here.                          |
| `isChecked(item)` returns `true` for returned items   | Pre-checked appearance for `isReturned` items without mutating the selection set — keeps returned-item IDs out of the selection payload sent to the API in FR-12. |
| `onSelectAll()` filters `!item.isReturned`            | Selects only active items; calling `store.selectAllActiveItems()` replaces the set with fresh IDs, which is idempotent.                                           |
| `item.isReturned \|\| isDebt()` for `[disabled]`      | DEBT rentals should have all checkboxes disabled per FR business rules.                                                                                           |
| `opacity-40` on returned rows                         | Visual dimming without hiding; preserves row height for layout stability.                                                                                         |

## 4. Validation Steps

skip
