# Task 005: Create `EquipmentItemRowComponent` (Dumb)

> **Applied Skill:** `angular-component` — Dumb standalone component. Uses `input()` / `output()` signal functions. `OnPush`. No store injection.

## 1. Objective

Create a dumb row component that renders one selected equipment item (UID, model, type name) and emits a `removeRequested` output when the operator taps the remove button.

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/rental-create/step2/equipment-item-row.component.ts`
* **Action:** Create New File

## 3. Code Implementation

```typescript
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import type { EquipmentSearchItem } from '@bikerental/shared';

@Component({
  selector: 'app-equipment-item-row',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule],
  template: `
    <div class="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-50 border border-slate-200">
      <div class="flex flex-col gap-0.5 min-w-0">
        <span class="font-mono text-sm font-medium text-slate-800 truncate">{{ item().uid }}</span>
        <span class="text-xs text-slate-500 truncate">{{ item().model }} · {{ item().type.name }}</span>
      </div>
      <button
        mat-icon-button
        type="button"
        [attr.aria-label]="'Remove ' + item().uid"
        (click)="removeRequested.emit(item().id)"
      >
        <mat-icon>close</mat-icon>
      </button>
    </div>
  `,
})
export class EquipmentItemRowComponent {
  readonly item = input.required<EquipmentSearchItem>();
  readonly removeRequested = output<number>();
}
```

## 4. Validation Steps

```bash
npx ng build operator --configuration=development
```
