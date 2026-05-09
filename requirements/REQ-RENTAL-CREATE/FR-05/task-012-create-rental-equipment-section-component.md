# Task 012: Create `RentalEquipmentSectionComponent` (Smart)

> **Applied Skill:** `angular-component`, `angular-signals` — Smart component. Injects component-scoped `EquipmentSearchStore` (declared in `providers`) and `RentalStore` (resolved from parent). Delegates all search logic to the store; the component's constructor subscribes to `searchControl.valueChanges` and calls `store.search()`. Exclusion of already-selected IDs is a view `computed()` in the component, not in the store.

> **⚠️ Prerequisite:** Requires **task-003b** (`EquipmentSearchStore` in shared) to be completed first.

## 1. Objective

Create the smart equipment search section. Debounces user input at 300 ms (min 2 chars), calls `EquipmentService.searchEquipments`, maps results to `EquipmentSearchItem[]`, excludes already-selected IDs, and renders selected items as `EquipmentItemRowComponent` rows.

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/rental-create/step2/rental-equipment-section.component.ts`
* **Action:** Create New File

## 3. Code Implementation

```typescript
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import {
  EquipmentSearchItem,
  EquipmentSearchStore,
  Labels,
  RentalStore,
} from '@bikerental/shared';
import { EquipmentItemRowComponent } from './equipment-item-row.component';

@Component({
  selector: 'app-rental-equipment-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    EquipmentItemRowComponent,
  ],
  template: `
    <div class="flex flex-col gap-3">
      <div class="flex gap-2">
        <mat-form-field appearance="outline" class="flex-1">
          <mat-label>{{ Labels.Equipment }}</mat-label>
          <input
            matInput
            type="text"
            [formControl]="searchControl"
            [matAutocomplete]="auto"
            [placeholder]="Labels.SearchEquipmentPlaceholder"
          />
          <mat-autocomplete #auto="matAutocomplete" (optionSelected)="onEquipmentSelected($event)">
            @for (item of searchResults(); track item.id) {
              <mat-option [value]="item">
                <span class="font-mono">{{ item.uid }}</span>
                <span class="text-slate-500 ml-2">{{ item.model }} · {{ item.type.name }}</span>
              </mat-option>
            }
          </mat-autocomplete>
        </mat-form-field>

        <button
          mat-icon-button
          type="button"
          disabled
          [matTooltip]="Labels.ComingSoon"
          [attr.aria-label]="Labels.ScanQr"
        >
          <mat-icon>qr_code_scanner</mat-icon>
        </button>
      </div>

      <div class="flex flex-col gap-2">
        @for (item of store.equipmentItems(); track item.id) {
          <app-equipment-item-row
            [item]="item"
            (removeRequested)="store.removeEquipmentItem($event)"
          />
        }
      </div>
    </div>
  `,
  providers: [EquipmentSearchStore],
})
export class RentalEquipmentSectionComponent {
  private readonly equipmentSearchStore = inject(EquipmentSearchStore);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly store = inject(RentalStore);
  protected readonly Labels = Labels;
  protected readonly searchControl = new FormControl<string>('', { nonNullable: true });

  private readonly selectedIds = computed(() =>
    new Set(this.store.equipmentItems().map((e) => e.id)),
  );

  protected readonly searchResults = computed(() =>
    this.equipmentSearchStore.results().filter((r) => !this.selectedIds().has(r.id)),
  );

  protected readonly loading = this.equipmentSearchStore.loading;

  constructor() {
    this.searchControl.valueChanges
      .pipe(
        filter((v): v is string => typeof v === 'string'),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((value) => this.equipmentSearchStore.search(value));
  }

  protected onEquipmentSelected(event: MatAutocompleteSelectedEvent): void {
    const item = event.option.value as EquipmentSearchItem;
    this.store.addEquipmentItem(item);
    this.searchControl.setValue('', { emitEvent: false });
    this.equipmentSearchStore.search(null);
  }
}
```

## 4. Validation Steps

```bash
npx ng build operator --configuration=development
```
